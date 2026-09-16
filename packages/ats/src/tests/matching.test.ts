/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SemanticJobMatcher } from '../semanticMatcher';
import { MasterResume, JobPosting } from '../../../../src/types';

export async function runSemanticMatchingTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: Array<{ test: string; passed: boolean; message?: string }>;
}> {
  const testResults: Array<{ test: string; passed: boolean; message?: string }> = [];

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      testResults.push({ test: name, passed: true });
    } else {
      testResults.push({ test: name, passed: false, message: message || 'Assertion failed' });
    }
  }

  // Sample verified Master Resume for Bhargav Choppa
  const testMasterResume: MasterResume = {
    id: 'resume-test-001',
    is_active: true,
    version: 1,
    personal_information: {
      full_name: 'Bhargav Aravind Sai Ram Choppa',
      email: 'bhargavchoppa23@gmail.com',
      phone: '+1 (860) 997-6229',
      location: 'Hartford, Connecticut, USA',
      header_positioning: 'Senior Business Analyst / Product Owner / Technical Product Manager',
    },
    professional_summary:
      'Senior Business Analyst and Product Owner with ~9 years of experience driving complex enterprise digital transformation, requirements architecture, and agile product delivery across semiconductor manufacturing, capital markets, health insurance exchanges, and banking ecosystems.',
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
      'AWS',
      'Azure',
    ],
    experience: [
      {
        id: 'exp-1',
        company: 'MIT Resources / Applied Materials Client',
        title: 'Lead Technical Business Analyst / Product Owner',
        location: 'Danbury, CT',
        start_date: 'Jan 2024',
        end_date: 'Present',
        is_current: true,
        industry: 'Manufacturing',
        domain: 'Semiconductor Lithography',
        technologies: ['SQL', 'Tableau', 'Jira'],
        responsibilities: [
          'Led requirements elicitation and product backlog ownership for semiconductor lithography telemetry systems.',
          'Built predictive wafer fabrication yield dashboards using Tableau and SQL.',
          'Authored BRDs and detailed acceptance criteria for high-throughput wafer inspection software.',
        ],
        achievements: [
          'Boosted engineering throughput by 28% through rigorous backlog grooming and sprint planning.',
        ],
      },
      {
        id: 'exp-2',
        company: 'Point72',
        title: 'Senior Business Analyst / Product Owner',
        location: 'New York, NY',
        start_date: 'Mar 2022',
        end_date: 'Dec 2023',
        is_current: false,
        industry: 'Financial Services',
        domain: 'Capital Markets & Market Data',
        technologies: ['SQL', 'REST API', 'FactSet', 'Bloomberg'],
        responsibilities: [
          'Managed product roadmap for financial market data ingestion bridge connecting FactSet and Bloomberg feeds.',
          'Defined API integration specifications with quantitative engineering teams.',
          'Led sprint retrospectives and executive stakeholder prioritization sessions.',
        ],
        achievements: [
          'Reduced market data pipeline latency by 35% through optimized JSON payloads.',
        ],
      },
      {
        id: 'exp-3',
        company: 'CVS Health',
        title: 'Senior Business Analyst',
        location: 'Hartford, CT',
        start_date: 'Jun 2019',
        end_date: 'Feb 2022',
        is_current: false,
        industry: 'Government/Eligibility systems',
        domain: 'Healthcare Exchanges & Medicaid/Medicare',
        technologies: ['SQL', 'Jira', 'Confluence'],
        responsibilities: [
          'Architected Medicaid and Medicare healthcare enrollment eligibility rules engines.',
          'Facilitated government regulatory compliance UAT alongside state agency sponsors.',
        ],
        achievements: [
          'Seamlessly processed 1.2M member enrollment renewals with zero audit discrepancies.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'University of New Haven',
        degree: 'Master of Science',
        field_of_study: 'Computer Science',
        graduation_date: '2019',
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'Certified Scrum Product Owner (CSPO)',
        issuer: 'Scrum Alliance',
        issue_date: '2021',
        verified: true,
      },
    ],
    projects: [],
    achievements: ['9 years enterprise track record', 'Zero compliance discrepancies'],
    inconsistency_flags: [],
    total_experience_years: 9,
    last_updated: '2026-09-11',
    is_immutable: true,
    user_id: 'user-bhargav-001',
  };

  const matcher = new SemanticJobMatcher();

  // -------------------------------------------------------------
  // Test 1: Known Job — ASML Senior Technical Product Manager
  // -------------------------------------------------------------
  const asmlJob: JobPosting = {
    job_id: 'test-job-asml',
    company: 'ASML',
    title: 'Senior Technical Product Manager - Lithography Software',
    location: 'Wilton, Connecticut',
    country: 'USA',
    remote: 'hybrid',
    work_mode: 'Hybrid',
    employment_type: 'Full-time',
    experience_required: '7+ years',
    salary: '$165,000 - $195,000 / year',
    posted_date: '2026-09-08',
    posted_date_verified: true,
    posted_date_source: 'json-ld',
    age_days: 3,
    age_status: 'fresh',
    application_url: 'https://asml.com/careers/stpm-litho',
    source_url: 'https://boards.greenhouse.io/asml/jobs/1234',
    description:
      'Lead product definition and roadmap execution for next-generation wafer fabrication software. Collaborate with software engineers, author BRDs, and drive data telemetry reporting with SQL and Tableau.',
    responsibilities: [
      'Define technical product specifications for lithography equipment software.',
      'Bridge customer requirements with software engineering teams.',
      'Analyze wafer fabrication telemetry data with SQL and Tableau dashboards.',
    ],
    requirements: [
      '7+ years experience in Technical Product Management or Senior Business Analysis.',
      'Strong proficiency in SQL, Tableau or Power BI, and Agile/Scrum.',
      'Demonstrated cross-functional collaboration and stakeholder management.',
    ],
    skills: ['Technical Product Management', 'SQL', 'Tableau', 'Agile', 'Wafer fabrication', 'stakeholder management'],
    benefits: ['401k', 'Health insurance'],
    application_status: 'Not Applied',
    first_seen: '2026-09-08',
    last_seen: '2026-09-11',
  };

  const asmlMatch = await matcher.evaluateMatch(asmlJob, testMasterResume);
  assert(
    'ASML Senior TPM yields Strong Match (>= 75)',
    asmlMatch.match_score >= 75 && asmlMatch.match_category === 'Strong Match',
    `Expected >= 75, got ${asmlMatch.match_score}`
  );
  assert(
    'ASML Senior TPM passes 60% Tailoring Gate',
    asmlMatch.meets_tailoring_gate === true
  );
  assert(
    'ASML identifies Manufacturing & Technology domain alignment',
    asmlMatch.details.industryRelevance.matchedIndustries.includes('Manufacturing') ||
      asmlMatch.details.industryRelevance.matchedIndustries.includes('Technology')
  );

  // -------------------------------------------------------------
  // Test 2: Skill Classification (Evidenced, Related/Equivalent, Not Evidenced)
  // -------------------------------------------------------------
  const skillAnalysisJob: JobPosting = {
    ...asmlJob,
    skills: ['SQL', 'stakeholder management', 'Snowflake'],
  };

  const skillMatch = await matcher.evaluateMatch(skillAnalysisJob, testMasterResume);

  // "SQL" should be EVIDENCED
  const sqlEval = skillMatch.details.skillEvaluations.find((e) => e.skill === 'SQL');
  assert('SQL is classified as EVIDENCED', sqlEval?.classification === 'EVIDENCED');

  // "stakeholder management" should be RELATED/EQUIVALENT
  const stakeholderEval = skillMatch.details.skillEvaluations.find((e) =>
    e.skill.toLowerCase().includes('stakeholder')
  );
  assert(
    'stakeholder management is classified as RELATED/EQUIVALENT via customer advocacy/collaboration',
    stakeholderEval?.classification === 'RELATED/EQUIVALENT'
  );

  // "Snowflake" should be NOT_EVIDENCED with exact phrasing rule
  const snowflakeEval = skillMatch.details.skillEvaluations.find((e) => e.skill === 'Snowflake');
  assert(
    'Snowflake is classified as NOT_EVIDENCED',
    snowflakeEval?.classification === 'NOT_EVIDENCED'
  );
  assert(
    'Snowflake formatted strictly as "Snowflake — not evidenced in master resume."',
    snowflakeEval?.formattedOutput.includes('Snowflake — not evidenced in master resume') === true &&
      !snowflakeEval?.formattedOutput.includes('Candidate does not know')
  );

  // -------------------------------------------------------------
  // Test 3: Title Relevance (Non-exact semantic matching)
  // -------------------------------------------------------------
  const poJob: JobPosting = {
    ...asmlJob,
    title: 'Senior Product Owner - Core Banking Platform',
  };
  const poMatch = await matcher.evaluateMatch(poJob, testMasterResume);
  assert(
    'Product Owner title receives high semantic score (> 90) without requiring exact BA match',
    poMatch.title_score >= 90
  );

  // -------------------------------------------------------------
  // Test 4: Known Irrelevant Job — Rejection Category (< 50)
  // -------------------------------------------------------------
  const fashionJob: JobPosting = {
    job_id: 'test-job-fashion',
    company: 'Vogue Boutique',
    title: 'Head Fashion Stylist & Runway Visual Coordinator',
    location: 'Paris / Milan',
    country: 'USA',
    remote: 'on-site',
    work_mode: 'On-site',
    employment_type: 'Full-time',
    experience_required: '3 years',
    salary: '$50,000',
    posted_date: '2026-09-08',
    posted_date_verified: true,
    posted_date_source: 'json-ld',
    age_days: 3,
    age_status: 'fresh',
    application_url: 'https://fashion.com',
    source_url: 'https://fashion.com',
    description: 'Style runway models, coordinate haute couture textile pallets, dress mannequins.',
    responsibilities: ['Haute couture design', 'Runway dress fitting', 'Color wheel selection'],
    requirements: ['Sewing proficiency', 'Runway experience', 'Textile knowledge'],
    skills: ['Sewing', 'Runway', 'Textiles', 'Mannequin Dressing'],
    benefits: [],
    application_status: 'Not Applied',
    first_seen: '2026-09-08',
    last_seen: '2026-09-11',
  };

  const fashionMatch = await matcher.evaluateMatch(fashionJob, testMasterResume);
  assert(
    'Fashion Stylist job correctly rejected (< 50 score)',
    fashionMatch.match_score < 50 && fashionMatch.match_category === 'Reject'
  );
  assert(
    'Fashion Stylist does NOT pass 60% Tailoring Gate',
    fashionMatch.meets_tailoring_gate === false
  );

  // -------------------------------------------------------------
  // Test 5: Critical Rule — 60% Gate strictly triggers resume tailoring
  // -------------------------------------------------------------
  assert(
    'Critical Rule: Score >= 60 ALWAYS sets meets_tailoring_gate to true',
    asmlMatch.match_score >= 60 && asmlMatch.meets_tailoring_gate === true
  );

  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  return {
    total: testResults.length,
    passed,
    failed,
    results: testResults,
  };
}
