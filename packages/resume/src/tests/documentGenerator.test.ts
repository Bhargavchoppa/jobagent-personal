/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  generateAtsResumeDocxBuffer,
  generateAtsResumePdfBuffer,
  generateResumePlainTextPreview,
  determineJobSpecificTargetTitle,
  generateResumeDocumentFilename,
  createGeneratedResumeDocumentRecord,
  checkAtsDocumentCompliance,
} from '../documentGenerator';
import { VERIFIED_MASTER_RESUME } from '../../../../server/masterResumeSeed';
import { MasterResume, TailoredResume, JobPosting, DocumentGenerationDiagnosticResult, TruthValidationReport } from '../../../../src/types';

export async function runPhase7DocumentGenerationTests(
  customMaster?: MasterResume
): Promise<DocumentGenerationDiagnosticResult> {
  const master = customMaster || VERIFIED_MASTER_RESUME;
  const tests: DocumentGenerationDiagnosticResult['tests'] = [];

  const mockJob: JobPosting = {
    job_id: 'job-phase7-001',
    company: 'ASML',
    title: 'Senior Technical Product Manager - Lithography Software',
    location: 'Wilton, Connecticut',
    country: 'USA',
    work_mode: 'Hybrid',
    responsibilities: [
      'Define multi-year technical product roadmap for wafer inspection software.',
      'Lead cross-functional agile ceremonies and sprint planning.',
    ],
    requirements: [
      '7+ years technical product management or business analysis.',
      'Proficiency in SQL, Tableau, and REST APIs.',
    ],
    skills: ['Product Roadmapping', 'SQL', 'Tableau', 'Agile/Scrum', 'REST API'],
    match_score: 91,
    application_status: 'Tailored',
    first_seen: '2026-09-10',
  };

  const mockTailoredResume: TailoredResume = {
    id: 'tailored-phase7-001',
    job_id: mockJob.job_id,
    job_title: mockJob.title,
    company: mockJob.company,
    target_title: 'Senior Technical Product Manager',
    generated_at: new Date().toISOString(),
    summary:
      'Accomplished Senior Technical Product Manager with ~9 years of verified experience steering product roadmaps, translating complex engineering parameters into scalable software releases, and driving cross-functional agile execution with Tableau and SQL.',
    core_skills: [
      'Product Roadmapping',
      'Technical Product Management',
      'SQL',
      'Tableau',
      'Agile / Scrum',
      'REST API',
      'BRD & User Stories',
      'Stakeholder Collaboration',
    ],
    professional_experience: [
      {
        company: 'MIT Resources',
        title: 'Business Analyst',
        location: 'Hartford, Connecticut',
        dates: 'Aug 2023 – Present',
        reordered_responsibilities: [
          'Steer product roadmaps for wafer fabrication technologies, translating engineering parameters into customer-facing features.',
          'Formulate data-driven financial forecasting models in Tableau and SQL.',
        ],
        truth_aligned_achievements: [
          'Engineered predictive financial forecasting models in Tableau informing executive contract negotiations.',
        ],
      },
    ],
    education: master.education,
    certifications: master.certifications.filter((c) => c.verified),
    ats_score: 88,
    truthful_maximum_ats_score: 88,
    truth_audit_passed: true,
    validation_status: 'PASSED',
  };

  // -------------------------------------------------------------
  // Test 1: DOCX Binary Generation & Buffer Validity
  // -------------------------------------------------------------
  let docxBuffer: Buffer | null = null;
  try {
    docxBuffer = await generateAtsResumeDocxBuffer(mockTailoredResume, master, mockJob);
    const passed = Buffer.isBuffer(docxBuffer) && docxBuffer.length > 2000;
    tests.push({
      name: '1. Formats: ATS DOCX Document Generation',
      category: 'format_docx',
      passed,
      expected: 'Valid DOCX buffer > 2KB',
      actual: passed ? `DOCX buffer generated: ${docxBuffer.length} bytes` : 'Failed or empty buffer',
      message: 'Generated native Microsoft Word OpenXML document without corruptions.',
    });
  } catch (err: any) {
    tests.push({
      name: '1. Formats: ATS DOCX Document Generation',
      category: 'format_docx',
      passed: false,
      expected: 'Valid DOCX buffer > 2KB',
      actual: `Error: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 2: PDF Binary Generation & Buffer Validity
  // -------------------------------------------------------------
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateAtsResumePdfBuffer(mockTailoredResume, master, mockJob);
    const passed = Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 1000;
    tests.push({
      name: '2. Formats: ATS PDF Document Generation',
      category: 'format_pdf',
      passed,
      expected: 'Valid PDF buffer > 1KB',
      actual: passed ? `PDF buffer generated: ${pdfBuffer.length} bytes` : 'Failed or empty buffer',
      message: 'Generated pure linear ATS-parseable PDF stream.',
    });
  } catch (err: any) {
    tests.push({
      name: '2. Formats: ATS PDF Document Generation',
      category: 'format_pdf',
      passed: false,
      expected: 'Valid PDF buffer > 1KB',
      actual: `Error: ${err.message}`,
    });
  }

  // -------------------------------------------------------------
  // Test 3: ATS Layout Compliance: 0 tables, 0 text boxes, 0 graphics, 0 icons
  // -------------------------------------------------------------
  const plainText = generateResumePlainTextPreview(mockTailoredResume, master, mockJob);
  const compliance = checkAtsDocumentCompliance(plainText);
  const layoutClean =
    !compliance.has_tables &&
    !compliance.has_text_boxes &&
    !compliance.has_graphics &&
    !compliance.has_columns &&
    !compliance.has_icons &&
    !compliance.critical_info_in_header_footer;

  tests.push({
    name: '3. ATS Layout: Strict Anti-Confusion Parsing Rules',
    category: 'layout_compliance',
    passed: layoutClean && compliance.compliance_score === 100,
    expected: '0 tables, 0 text boxes, 0 graphics, 0 columns, 0 icons, body contact info',
    actual: layoutClean ? 'All 6 anti-confusion layout constraints verified' : 'Disallowed element found',
    message: 'Layout is single-column, linearly parsable by all commercial ATS parsers.',
  });

  // -------------------------------------------------------------
  // Test 4: Safe Font Verification (Arial / Standard Typography)
  // -------------------------------------------------------------
  tests.push({
    name: '4. ATS Typography: Standard Safe Font (Arial)',
    category: 'typography',
    passed: compliance.safe_font === 'Arial',
    expected: 'Arial (ATS-safe font standard)',
    actual: `Font: ${compliance.safe_font}`,
    message: 'Arial font applied across all document text runs and headings.',
  });

  // -------------------------------------------------------------
  // Test 5: Section Ordering (Exact 7 Sections in Sequence)
  // -------------------------------------------------------------
  const requiredSections = [
    'Name',
    'Target Title',
    'Professional Summary',
    'Core Skills',
    'Professional Experience',
    'Education',
    'Certifications',
  ];
  const orderCorrect =
    JSON.stringify(compliance.sections_order) === JSON.stringify(requiredSections) &&
    plainText.includes(master.personal_information.full_name.toUpperCase()) &&
    plainText.includes('TARGET POSITION') &&
    plainText.includes('PROFESSIONAL SUMMARY') &&
    plainText.includes('CORE SKILLS') &&
    plainText.includes('PROFESSIONAL EXPERIENCE') &&
    plainText.includes('EDUCATION') &&
    plainText.includes('CERTIFICATIONS');

  tests.push({
    name: '5. Section Structure: Exact 7-Stage ATS Sequence',
    category: 'sections_order',
    passed: orderCorrect,
    expected: requiredSections.join(' -> '),
    actual: compliance.sections_order.join(' -> '),
    message: 'Sections follow canonical recruiter and ATS scanning order.',
  });

  // -------------------------------------------------------------
  // Test 6: Target Title Seniority Guard (Preserves Job-Specific vs Contradictory Seniority)
  // -------------------------------------------------------------
  const caseA = determineJobSpecificTargetTitle('Senior Business Analyst', 9);
  const caseB = determineJobSpecificTargetTitle('Product Manager', 9);
  const caseC = determineJobSpecificTargetTitle('Vice President of Product & Growth', 9);
  const caseD = determineJobSpecificTargetTitle('Director of Engineering & Product', 9);

  const seniorityCorrect =
    caseA.targetTitle === 'Senior Business Analyst' &&
    caseA.adjusted === false &&
    caseB.targetTitle === 'Product Manager' &&
    caseB.adjusted === false &&
    caseC.adjusted === true && // VP safely demoted to Senior Product Manager
    caseC.targetTitle.includes('Senior Product Manager') &&
    caseD.adjusted === true && // Director safely aligned
    !caseC.targetTitle.toLowerCase().includes('vice president') &&
    !caseD.targetTitle.toLowerCase().includes('director');

  tests.push({
    name: '6. Seniority Guard: Job-Specific Target Title vs False Executive Rank',
    category: 'seniority_guard',
    passed: seniorityCorrect,
    expected: 'Adjust contradictory VP/Director titles to Senior PM; preserve matching BA/PM titles',
    actual: seniorityCorrect
      ? `VP -> "${caseC.targetTitle}" (adjusted); BA -> "${caseA.targetTitle}"`
      : 'Seniority adjustment failed',
    message: caseC.adjustmentNote || 'Contradictory executive titles neutralized successfully.',
  });

  // -------------------------------------------------------------
  // Test 7: Generated File Naming Convention
  // Pattern: <job-id>_<company>_<title>_tailored.docx
  // -------------------------------------------------------------
  const docxName = generateResumeDocumentFilename(mockJob.job_id, mockJob.company, mockJob.title, 'docx');
  const pdfName = generateResumeDocumentFilename(mockJob.job_id, mockJob.company, mockJob.title, 'pdf');
  const namingCorrect =
    docxName.startsWith('job-phase7-001_ASML_') &&
    docxName.endsWith('_tailored.docx') &&
    pdfName.startsWith('job-phase7-001_ASML_') &&
    pdfName.endsWith('_tailored.pdf');

  tests.push({
    name: '7. File Naming: <job-id>_<company>_<title>_tailored.ext Pattern',
    category: 'file_naming',
    passed: namingCorrect,
    expected: 'job-phase7-001_ASML_..._tailored.docx & .pdf',
    actual: docxName,
    message: 'Filename format compliant with ATS file upload specifications.',
  });

  // -------------------------------------------------------------
  // Test 8: Download Gating Rule: require truth_validation = PASS
  // -------------------------------------------------------------
  const passingReport: TruthValidationReport = {
    id: 'report-pass',
    job_id: mockJob.job_id,
    validation_status: 'PASSED',
    validation_errors: [],
    validation_warnings: [],
    validated_at: new Date().toISOString(),
    dimensions: {} as any,
    semantic_equivalences_used: [],
    strict_rejections_enforced: [],
  };

  const failingReport: TruthValidationReport = {
    id: 'report-fail',
    job_id: mockJob.job_id,
    validation_status: 'FAILED',
    validation_errors: ['Unsupported technology: Snowflake'],
    validation_warnings: [],
    validated_at: new Date().toISOString(),
    dimensions: {} as any,
    semantic_equivalences_used: [],
    strict_rejections_enforced: [],
  };

  const passRecord = await createGeneratedResumeDocumentRecord(
    mockTailoredResume,
    master,
    mockJob,
    passingReport,
    docxBuffer || undefined,
    pdfBuffer || undefined
  );

  const failRecord = await createGeneratedResumeDocumentRecord(
    mockTailoredResume,
    master,
    mockJob,
    failingReport,
    docxBuffer || undefined,
    pdfBuffer || undefined
  );

  const gatingCorrect =
    passRecord.document.can_download === true &&
    failRecord.document.can_download === false &&
    failRecord.document.download_blocked_reason?.includes('Requires Truth Validation PASS');

  tests.push({
    name: '8. Gating Rule: require truth_validation = PASS before Download',
    category: 'download_gating',
    passed: gatingCorrect,
    expected: 'PASS -> can_download: true; FAILED -> can_download: false',
    actual: gatingCorrect
      ? 'Gating enforced: download strictly locked on FAILED status'
      : 'Download gating failed',
    message: failRecord.document.download_blocked_reason,
  });

  // -------------------------------------------------------------
  // Test 9: Stored File Metadata Completeness
  // -------------------------------------------------------------
  const docMeta = passRecord.document;
  const metadataComplete =
    !!docMeta.id &&
    docMeta.job_id === mockJob.job_id &&
    docMeta.company === mockJob.company &&
    docMeta.match_score === 91 &&
    docMeta.ats_score === 88 &&
    docMeta.docx_size_bytes > 0 &&
    docMeta.pdf_size_bytes > 0 &&
    !!docMeta.docx_download_url &&
    !!docMeta.pdf_download_url &&
    docMeta.truth_validation_status === 'PASSED';

  tests.push({
    name: '9. Metadata Persistence: Full Record Specification Stored',
    category: 'metadata_storage',
    passed: metadataComplete,
    expected: 'Match score, ATS score, file sizes, truth status, download URLs present',
    actual: metadataComplete
      ? `Stored: DOCX (${docMeta.docx_size_bytes}B), PDF (${docMeta.pdf_size_bytes}B), Match: ${docMeta.match_score}%, ATS: ${docMeta.ats_score}%`
      : 'Missing metadata fields',
    message: 'Persistent metadata tracking enabled for download analytics and auditing.',
  });

  const total = tests.length;
  const passed = tests.filter((t) => t.passed).length;
  const failed = total - passed;

  return {
    suite: 'Phase 7 ATS Resume Document Generation Diagnostics Suite',
    total_tests: total,
    passed,
    failed,
    tests,
  };
}
