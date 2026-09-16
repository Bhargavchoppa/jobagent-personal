/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResumeTruthValidator } from '../truthValidator';
import { MasterResume } from '../../../../src/types';
import { VERIFIED_MASTER_RESUME } from '../../../../server/masterResumeSeed';

export interface Phase6DiagnosticResult {
  suite: string;
  total_tests: number;
  passed: number;
  failed: number;
  tests: Array<{
    name: string;
    dimension: string;
    passed: boolean;
    expected: string;
    actual: string;
    message?: string;
  }>;
}

export function runPhase6TruthValidationTests(
  master: MasterResume = VERIFIED_MASTER_RESUME
): Phase6DiagnosticResult {
  const tests: Phase6DiagnosticResult['tests'] = [];

  // 1. Positive Baseline Test: Valid Master-derived tailored resume
  const validTailoredDraft = {
    id: 'test-valid-001',
    job_id: 'job-test-001',
    target_title: 'Senior Business Analyst',
    company: 'MIT Resources',
    summary:
      'Accomplished Business Analyst with ~9 years of verified experience across semiconductor manufacturing and health eligibility platforms.',
    core_skills: ['Business Analysis', 'Agile / Scrum', 'SQL', 'Tableau', 'Power BI'],
    professional_experience: master.experience.map((e) => ({
      company: e.company,
      title: e.title,
      dates: `${e.start_date} - ${e.end_date}`,
      responsibilities: e.responsibilities,
      achievements: e.achievements,
    })),
    education: master.education,
    certifications: master.certifications, // strictly no PMP
  };

  const validReport = ResumeTruthValidator.validate(validTailoredDraft, master);
  tests.push({
    name: 'Valid Verified Resume Baseline (All 13 Dimensions)',
    dimension: 'All 13 Dimensions',
    passed: validReport.validation_status === 'PASSED',
    expected: 'PASSED',
    actual: validReport.validation_status,
    message: validReport.validation_status === 'PASSED' ? 'Passed all 13 dimensions perfectly' : validReport.validation_errors.join('; '),
  });

  // 2. Negative Test: Unsupported Technology (Snowflake)
  const snowflakeDraft = {
    ...validTailoredDraft,
    summary: 'Expert in Snowflake cloud data warehousing and SQL analytics.',
    core_skills: ['Snowflake', 'SQL'],
  };
  const snowflakeReport = ResumeTruthValidator.validate(snowflakeDraft, master);
  const snowflakeFailed = snowflakeReport.validation_status === 'FAILED' &&
    snowflakeReport.validation_errors.some((e) => e.includes('Unsupported technology: Snowflake'));
  tests.push({
    name: 'Negative: Unsupported Technology Rejection (Snowflake)',
    dimension: '6_technologies',
    passed: snowflakeFailed,
    expected: 'FAILED with "Unsupported technology: Snowflake"',
    actual: snowflakeReport.validation_errors.find((e) => e.includes('Snowflake')) || snowflakeReport.validation_status,
  });

  // 3. Negative Test: Unsupported Metric (40% revenue growth)
  const metricDraft = {
    ...validTailoredDraft,
    professional_experience: [
      {
        company: 'MIT Resources',
        title: 'Business Analyst',
        dates: 'Aug 2023 - Present',
        responsibilities: ['Steered wafer manufacturing analytics.'],
        achievements: ['Delivered 40% revenue growth across global client accounts.'],
      },
    ],
  };
  const metricReport = ResumeTruthValidator.validate(metricDraft, master);
  const metricFailed = metricReport.validation_status === 'FAILED' &&
    metricReport.validation_errors.some((e) => e.includes('Unsupported metric') && e.includes('40%'));
  tests.push({
    name: 'Negative: Unsupported Metric Rejection (40% revenue growth)',
    dimension: '10_metrics',
    passed: metricFailed,
    expected: 'FAILED with "Unsupported metric: 40% revenue growth"',
    actual: metricReport.validation_errors.find((e) => e.includes('40%')) || metricReport.validation_status,
  });

  // 4. Negative Test: Programming Language Strict Separation (SQL != Python)
  const pythonDraft = {
    ...validTailoredDraft,
    summary: 'Lead Python data engineer developing statistical models.',
    core_skills: ['Python', 'SQL'],
  };
  const pythonReport = ResumeTruthValidator.validate(pythonDraft, master);
  const pythonFailed = pythonReport.validation_status === 'FAILED' &&
    pythonReport.validation_errors.some((e) => e.includes('Unsupported programming/data technology: Python'));
  tests.push({
    name: 'Strict Equivalence: SQL != Python Enforcement',
    dimension: '8_programming_data_technologies',
    passed: pythonFailed,
    expected: 'FAILED with "Unsupported programming/data technology: Python"',
    actual: pythonReport.validation_errors.find((e) => e.includes('Python')) || pythonReport.validation_status,
  });

  // 5. Negative Test: Cloud Strict Separation (AWS != GCP)
  const gcpDraft = {
    ...validTailoredDraft,
    summary: 'Architecting Google Cloud Platform infrastructure for analytics.',
    core_skills: ['GCP', 'AWS'],
  };
  const gcpReport = ResumeTruthValidator.validate(gcpDraft, master);
  const gcpFailed = gcpReport.validation_status === 'FAILED' &&
    gcpReport.validation_errors.some((e) => e.includes('Unsupported cloud platform'));
  tests.push({
    name: 'Strict Equivalence: AWS != GCP Rejection',
    dimension: '9_cloud_platforms',
    passed: gcpFailed,
    expected: 'FAILED with "Unsupported cloud platform: Google Cloud Platform (GCP)"',
    actual: gcpReport.validation_errors.find((e) => e.includes('cloud platform')) || gcpReport.validation_status,
  });

  // 6. Negative Test: Unsupported Employer (Acme Corp)
  const employerDraft = {
    ...validTailoredDraft,
    professional_experience: [
      {
        company: 'Acme Corp',
        title: 'Business Analyst',
        dates: 'Jan 2020 - Dec 2021',
        responsibilities: ['Managed business requirements.'],
        achievements: ['Completed enterprise roadmap.'],
      },
    ],
  };
  const employerReport = ResumeTruthValidator.validate(employerDraft, master);
  const employerFailed = employerReport.validation_status === 'FAILED' &&
    employerReport.validation_errors.some((e) => e.includes('Unsupported employer: Acme Corp'));
  tests.push({
    name: 'Negative: Unsupported Employer Rejection (Acme Corp)',
    dimension: '1_employer_names',
    passed: employerFailed,
    expected: 'FAILED with "Unsupported employer: Acme Corp"',
    actual: employerReport.validation_errors.find((e) => e.includes('Acme Corp')) || employerReport.validation_status,
  });

  // 7. Negative Test: Mismatched Employment Dates
  const datesDraft = {
    ...validTailoredDraft,
    professional_experience: [
      {
        company: 'MIT Resources',
        title: 'Business Analyst',
        dates: 'Jan 2018 - Dec 2024',
        responsibilities: master.experience[0].responsibilities,
        achievements: master.experience[0].achievements,
      },
    ],
  };
  const datesReport = ResumeTruthValidator.validate(datesDraft, master);
  const datesFailed = datesReport.validation_status === 'FAILED' &&
    datesReport.validation_errors.some((e) => e.includes('Mismatched employment dates'));
  tests.push({
    name: 'Negative: Mismatched Employment Dates Rejection',
    dimension: '3_employment_dates',
    passed: datesFailed,
    expected: 'FAILED with "Mismatched employment dates for MIT Resources"',
    actual: datesReport.validation_errors.find((e) => e.includes('Mismatched employment dates')) || datesReport.validation_status,
  });

  // 8. Negative Test: Unsupported Certification (PMP Injection)
  const pmpDraft = {
    ...validTailoredDraft,
    certifications: [
      ...master.certifications,
      {
        id: 'cert-pmp-injected',
        name: 'PMP (Project Management Professional)',
        issuer: 'PMI',
        verified: false,
      },
    ],
  };
  const pmpReport = ResumeTruthValidator.validate(pmpDraft, master);
  const pmpFailed = pmpReport.validation_status === 'FAILED' &&
    pmpReport.validation_errors.some((e) => e.includes('Unsupported certification: PMP'));
  tests.push({
    name: 'Audit Guard: PMP Certification Injection Rejection',
    dimension: '5_certifications',
    passed: pmpFailed,
    expected: 'FAILED with "Unsupported certification: PMP"',
    actual: pmpReport.validation_errors.find((e) => e.includes('PMP')) || pmpReport.validation_status,
  });

  // 9. Positive Test: Supported Semantic Equivalence ("stakeholder collaboration")
  const equivDraft = {
    ...validTailoredDraft,
    core_skills: ['Stakeholder Collaboration', 'Cross-Functional Alignment', 'Requirements Authoring'],
    professional_experience: [
      {
        company: 'MIT Resources',
        title: 'Business Analyst',
        dates: 'Aug 2023 - Present',
        responsibilities: [
          'Lead stakeholder collaboration and executive prioritization to align wafer fabrication engineering parameters.',
          'Synthesize market research and quantitative customer insights for global releases.',
        ],
        achievements: master.experience[0].achievements,
      },
    ],
  };
  const equivReport = ResumeTruthValidator.validate(equivDraft, master);
  const equivPassed = equivReport.validation_status === 'PASSED' &&
    equivReport.semantic_equivalences_used.some((eq) => eq.tailored_phrase.toLowerCase() === 'stakeholder collaboration');
  tests.push({
    name: 'Semantic Equivalence: "stakeholder collaboration" Supported by Master Proof',
    dimension: '12_responsibilities',
    passed: equivPassed,
    expected: 'PASSED with semantic equivalence mapped to customer advocacy & executive prioritization',
    actual: equivPassed ? 'PASSED (Equivalence Verified)' : equivReport.validation_errors.join('; '),
  });

  const passedCount = tests.filter((t) => t.passed).length;
  return {
    suite: 'Phase 6 Resume Truth Validation Diagnostics Suite',
    total_tests: tests.length,
    passed: passedCount,
    failed: tests.length - passedCount,
    tests,
  };
}
