/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  extractAndCategorizeJobKeywords,
  evaluateEvidenceInMasterResume,
  runAtsAnalysis,
  generateDeterministicTailoredResume,
  executeTailoringPipeline,
} from '../tailoringEngine';
import { MasterResume, JobPosting } from '../../../../src/types';

export async function runPhase5TailoringTests(customMaster?: MasterResume): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: Array<{ test: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ test: string; passed: boolean; message?: string }> = [];

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      results.push({ test: name, passed: true });
    } else {
      results.push({ test: name, passed: false, message: message || 'Assertion failed' });
    }
  }

  // Master Resume for testing
  const mockMasterResume: MasterResume = customMaster || {
    id: 'resume-bhargav-001',
    user_id: 'user-001',
    is_active: true,
    is_immutable: false,
    version: 1,
    personal_information: {
      full_name: 'Bhargav Aravind Sai Ram Choppa',
      email: 'bhargavchoppa23@gmail.com',
      phone: '+1 (860) 997-6229',
      location: 'Hartford, Connecticut, USA',
      header_positioning: 'Senior Business Analyst / Product Owner / Technical Product Manager',
    },
    professional_summary:
      'Senior Business Analyst and Product Owner with ~9 years of verified technical excellence steering Agile digital platforms, BRD authoring, user stories, and cross-functional delivery across high-tech semiconductor analytics, capital markets, and health eligibility platforms.',
    skills: [
      'Business Analysis',
      'Product Ownership',
      'Agile / Scrum',
      'BRD / PRD Authoring',
      'User Stories & Acceptance Criteria',
      'UAT Governance',
      'Customer Advocacy',
      'Cross-Functional Collaboration',
      'Executive Prioritization',
      'Data Modeling',
    ],
    technologies: [
      'SQL',
      'Tableau',
      'Power BI',
      'JIRA',
      'Confluence',
      'REST API',
      'JSON',
      'Postman',
      'Git',
    ],
    experience: [
      {
        id: 'exp-1',
        company: 'ASML',
        title: 'Senior Business Analyst / Product Owner',
        location: 'Wilton, CT',
        start_date: '2022-03',
        end_date: 'Present',
        is_current: true,
        responsibilities: [
          'Led requirements elicitation and sprint planning for lithography data analytics platforms.',
          'Authored detailed user stories and acceptance criteria in JIRA.',
          'Executed SQL queries to validate wafer metrology pipeline accuracy.',
        ],
        achievements: [
          'Reduced defect escalation rate by 24% via rigorous UAT test case matrices.',
        ],
        technologies: ['SQL', 'JIRA', 'Confluence', 'Tableau'],
        industry: 'Semiconductor Manufacturing',
        domain: 'Hardware/Software Metrology',
      },
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Master of Science',
        field_of_study: 'Business Analytics and Project Management',
        institution: 'University of Connecticut',
        graduation_date: '2021-12',
        location: 'Storrs, CT',
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'Certified Scrum Product Owner (CSPO)',
        issuer: 'Scrum Alliance',
        verified: true,
      },
      {
        id: 'cert-2',
        name: 'Certified ScrumMaster (CSM)',
        issuer: 'Scrum Alliance',
        verified: true,
      },
    ],
    projects: [],
    achievements: ['Delivered enterprise platform analytics for Fortune 500 partners.'],
    total_experience_years: 9,
    inconsistency_flags: [],
    last_updated: '2026-03-01T00:00:00Z',
  };

  // -------------------------------------------------------------
  // Test 1: Gating Rule - Score < 60% Rejection
  // -------------------------------------------------------------
  const lowScoreJob: JobPosting = {
    job_id: 'job-low-score',
    title: 'Lead Mobile iOS Swift Engineer',
    company: 'Apple',
    country: 'USA',
    location: 'Cupertino, CA',
    source: 'LinkedIn',
    external_url: 'https://example.com/job-low',
    skills: ['Swift', 'Objective-C', 'iOS SDK', 'CocoaPods', 'SwiftUI'],
    requirements: ['8+ years native iOS development in Swift', 'Expert CoreData and Metal'],
    responsibilities: ['Architect iOS apps from scratch'],
    match_score: 35, // below 60
    raw_text: 'Mobile dev job',
    first_seen: new Date().toISOString(),
    application_status: 'Not Applied',
  };

  try {
    await executeTailoringPipeline(lowScoreJob, mockMasterResume);
    assert('1. Gating Rule: Job < 60% must be rejected', false, 'Pipeline did not throw on score < 60%');
  } catch (err: any) {
    assert(
      '1. Gating Rule: Job < 60% must be rejected',
      err.message.includes('60%'),
      'Pipeline correctly enforced gating check for score < 60%'
    );
  }

  // -------------------------------------------------------------
  // Test 2: Gating Rule - Score >= 60% Permitted
  // -------------------------------------------------------------
  const highScoreJob: JobPosting = {
    job_id: 'job-high-score',
    title: 'Senior Business Analyst / Product Owner',
    company: 'ASML / Tech Systems',
    country: 'USA',
    location: 'Hartford, CT',
    source: 'LinkedIn',
    external_url: 'https://example.com/job-high',
    skills: ['SQL', 'JIRA', 'Agile', 'Tableau', 'User Stories', 'UAT', 'Snowflake', 'Kubernetes'],
    requirements: [
      '5+ years experience as Business Analyst or Product Owner',
      'Demonstrated expertise with SQL, JIRA, and Agile Scrum user stories',
      'Preferred experience with Snowflake and Kubernetes',
    ],
    responsibilities: [
      'Facilitate backlog refinement and translate requirements into JIRA user stories',
      'Perform data validation using SQL and build Tableau dashboards',
      'Conduct user acceptance testing (UAT)',
    ],
    match_score: 82, // >= 60
    raw_text: 'High match BA/PO job with some unsupported keywords',
    first_seen: new Date().toISOString(),
    application_status: 'Not Applied',
  };

  const { tailored, analysis, run } = await executeTailoringPipeline(highScoreJob, mockMasterResume);
  assert(
    '2. Gating Rule: Job >= 60% triggers pipeline',
    tailored !== null && run.status === 'completed',
    'Pipeline successfully executed for score >= 60%'
  );

  // -------------------------------------------------------------
  // Test 3: 7-Category Keyword Extraction
  // -------------------------------------------------------------
  const extractedCategories = extractAndCategorizeJobKeywords(highScoreJob);
  assert(
    '3. ATS Analysis: Extract into 7 keyword categories',
    extractedCategories.technical_keywords.length > 0 &&
      extractedCategories.role_keywords.length > 0 &&
      Array.isArray(extractedCategories.required_keywords) &&
      Array.isArray(extractedCategories.preferred_keywords) &&
      Array.isArray(extractedCategories.soft_skills) &&
      Array.isArray(extractedCategories.domain_keywords) &&
      Array.isArray(extractedCategories.certification_keywords),
    'Categorized keywords into technical, role, required, preferred, soft, domain, and certification categories'
  );

  // -------------------------------------------------------------
  // Test 4: Target ~95% Truthful Coverage & Truthful Maximum Ceiling
  // -------------------------------------------------------------
  assert(
    '4. ATS Target: Truthful Maximum Ceiling & Unsupported Identification',
    analysis.unsupported_keywords.includes('Snowflake') || analysis.unsupported_keywords.includes('Kubernetes'),
    'Identified unsupported keywords (Snowflake/Kubernetes) without fabricating'
  );

  assert(
    '4b. ATS Target: Truthful maximum score capped correctly',
    analysis.truthful_maximum_score <= 100 && analysis.coverage_percentage <= analysis.truthful_maximum_score,
    `Score ${analysis.coverage_percentage}% strictly capped by truthful maximum ${analysis.truthful_maximum_score}%`
  );

  // -------------------------------------------------------------
  // Test 5: Zero-Fabrication Protocol Enforcement
  // -------------------------------------------------------------
  const tailoredFullText = [
    tailored.target_title,
    tailored.summary,
    tailored.core_skills.join(' '),
    tailored.professional_experience.flatMap((e) => [
      e.title,
      e.company,
      ...e.reordered_responsibilities,
      ...e.truth_aligned_achievements,
    ]).join(' '),
  ].join(' ').toLowerCase();

  const fabricatedSnowflake = tailoredFullText.includes('snowflake');
  const fabricatedKubernetes = tailoredFullText.includes('kubernetes');

  assert(
    '5. Zero Fabrication: Unsupported technologies strictly excluded',
    !fabricatedSnowflake && !fabricatedKubernetes,
    'Tailored resume strictly excluded unverified technologies Snowflake & Kubernetes'
  );

  // -------------------------------------------------------------
  // Test 6: Output Structure Completeness (All 11 Required Fields)
  // -------------------------------------------------------------
  const hasTargetTitle = typeof tailored.target_title === 'string' && tailored.target_title.length > 0;
  const hasSummary = typeof tailored.summary === 'string' && tailored.summary.length > 0;
  const hasCoreSkills = Array.isArray(tailored.core_skills) && tailored.core_skills.length > 0;
  const hasProfExp = Array.isArray(tailored.professional_experience) && tailored.professional_experience.length > 0;
  const hasEducation = Array.isArray(tailored.education) && tailored.education.length > 0;
  const hasCertifications = Array.isArray(tailored.certifications);
  const hasAtsKeywordsUsed = Array.isArray(tailored.ats_keywords_used) && tailored.ats_keywords_used.length > 0;
  const hasKeywordsNotEvidenced = Array.isArray(tailored.keywords_not_evidenced);
  const hasTruthCheck = tailored.truth_check && tailored.truth_check.passed === true;
  const hasAtsScore = typeof tailored.ats_score === 'number';
  const hasTruthfulMax = typeof tailored.truthful_maximum_ats_score === 'number';

  assert(
    '6. Output Structure: All 11 required fields present and valid',
    hasTargetTitle &&
      hasSummary &&
      hasCoreSkills &&
      hasProfExp &&
      hasEducation &&
      hasCertifications &&
      hasAtsKeywordsUsed &&
      hasKeywordsNotEvidenced &&
      hasTruthCheck &&
      hasAtsScore &&
      hasTruthfulMax,
    'All 11 Phase 5 fields generated accurately'
  );

  // -------------------------------------------------------------
  // Test 7: PMP Certification Exclusion Audit
  // -------------------------------------------------------------
  const pmpInCerts = tailored.certifications.some((c) => c.name.toLowerCase().includes('pmp'));
  assert(
    '7. Master Resume Audit: PMP omitted from certifications',
    !pmpInCerts,
    'PMP strictly omitted from certifications section'
  );

  // -------------------------------------------------------------
  // Test 8: Progress Stages Validation
  // -------------------------------------------------------------
  const stageNames = run.stages.map((s) => s.name);
  const expectedStages = ['Matching', 'Generating', 'Analyzing ATS', 'Optimizing', 'Validating', 'Completed'];
  const allStagesPresent = expectedStages.every((s) => stageNames.includes(s as any));

  assert(
    '8. Performance & Progress: 6-stage lifecycle tracked in history',
    allStagesPresent && run.stages.every((s) => s.status === 'completed'),
    'Matching -> Generating -> Analyzing ATS -> Optimizing -> Validating -> Completed stages recorded'
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
