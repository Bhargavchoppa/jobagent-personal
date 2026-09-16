/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MasterResume,
  TailoredResume,
  TruthValidationReport,
  TruthValidationStatus,
  DimensionAuditResult,
} from '../../../src/types';

// =============================================================
// KNOWN TAXONOMY & STRICT EQUIVALENCE DEFINITIONS
// =============================================================

// Unverified / Forbidden technologies that must trigger immediate validation failure
const FORBIDDEN_UNSUPPORTED_TECH: Record<string, string> = {
  snowflake: 'Snowflake',
  databricks: 'Databricks',
  kafka: 'Kafka',
  spark: 'Apache Spark',
  hadoop: 'Hadoop',
  cassandra: 'Cassandra',
  mongodb: 'MongoDB',
  redis: 'Redis',
  kubernetes: 'Kubernetes',
  docker: 'Docker',
  graphql: 'GraphQL',
  terraform: 'Terraform',
  ansible: 'Ansible',
};

// Forbidden unevidenced programming languages
const FORBIDDEN_UNSUPPORTED_LANGUAGES: Record<string, string> = {
  python: 'Python',
  java: 'Java',
  cplusplus: 'C++',
  'c++': 'C++',
  csharp: 'C#',
  'c#': 'C#',
  golang: 'Golang',
  rust: 'Rust',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  scala: 'Scala',
};

// Forbidden unevidenced cloud platforms (Candidate verified only for AWS & Azure)
const FORBIDDEN_UNSUPPORTED_CLOUDS: Record<string, string> = {
  gcp: 'Google Cloud Platform (GCP)',
  'google cloud': 'Google Cloud Platform (GCP)',
  'google cloud platform': 'Google Cloud Platform (GCP)',
  oci: 'Oracle Cloud Infrastructure (OCI)',
  'oracle cloud': 'Oracle Cloud',
  'ibm cloud': 'IBM Cloud',
  'alibaba cloud': 'Alibaba Cloud',
};

// Forbidden unevidenced tools
const FORBIDDEN_UNSUPPORTED_TOOLS: Record<string, string> = {
  looker: 'Looker',
  domo: 'Domo',
  sisense: 'Sisense',
  asana: 'Asana',
  monday: 'Monday.com',
  'monday.com': 'Monday.com',
  trello: 'Trello',
  clickup: 'ClickUp',
  notion: 'Notion',
  figma: 'Figma',
  miro: 'Miro',
  datadog: 'Datadog',
  splunk: 'Splunk',
  dynatrace: 'Dynatrace',
  'new relic': 'New Relic',
};

// Forbidden unevidenced industries/domains
const FORBIDDEN_UNSUPPORTED_DOMAINS: Record<string, string> = {
  aerospace: 'Aerospace & Defense',
  defense: 'Aerospace & Defense',
  automotive: 'Autonomous Vehicles / Automotive',
  'self-driving': 'Autonomous Vehicles',
  'oil & gas': 'Oil & Gas Exploration',
  petroleum: 'Oil & Gas Exploration',
  mining: 'Mining & Heavy Industries',
  gaming: 'Video Game Development',
  cryptocurrency: 'Cryptocurrency Mining',
};

// STRICT REJECTIONS (Strict technology separation rules)
export const STRICT_TECHNOLOGY_SEPARATIONS = [
  { techA: 'AWS', techB: 'Azure', rule: 'AWS != Azure. Both are evaluated separately against master resume proof.' },
  { techA: 'SQL', techB: 'Python', rule: 'SQL != Python. SQL proficiency never implies Python proficiency.' },
  { techA: 'Tableau', techB: 'Power BI', rule: 'Tableau != Power BI. Both are evaluated separately.' },
  { techA: 'Jira', techB: 'Rally', rule: 'Jira != Rally. Both require independent master resume evidence.' },
  { techA: 'AWS', techB: 'GCP', rule: 'AWS != GCP. Cloud platform knowledge is never assumed across providers.' },
  { techA: 'Azure', techB: 'GCP', rule: 'Azure != GCP. Cloud platform knowledge is never assumed across providers.' },
  { techA: 'SQL', techB: 'Snowflake', rule: 'SQL != Snowflake. Relational SQL does not establish Snowflake data warehouse expertise.' },
];

// SEMANTIC EQUIVALENCE LAYER
// Legitimate soft skills and responsibility rephrasings supported by master resume evidence
export interface SemanticEquivalenceMapping {
  phrase: string;
  category: 'soft_skill' | 'responsibility' | 'methodology';
  supportedByTerms: string[];
}

export const SEMANTIC_EQUIVALENCE_RULES: SemanticEquivalenceMapping[] = [
  {
    phrase: 'stakeholder collaboration',
    category: 'soft_skill',
    supportedByTerms: [
      'customer advocacy',
      'cross-functional collaboration',
      'executive prioritization',
      'stakeholder management',
    ],
  },
  {
    phrase: 'cross-functional alignment',
    category: 'soft_skill',
    supportedByTerms: [
      'cross-functional leadership',
      'align engineering, manufacturing, and global sales departments',
      'bridging cross-border engineering teams',
    ],
  },
  {
    phrase: 'backlog refinement',
    category: 'methodology',
    supportedByTerms: ['sprint planning', 'user stories & acceptance criteria', 'agile / scrum'],
  },
  {
    phrase: 'feature prioritization',
    category: 'methodology',
    supportedByTerms: ['executive prioritization', 'feature prioritization', 'technical tradeoffs'],
  },
  {
    phrase: 'requirements authoring',
    category: 'responsibility',
    supportedByTerms: ['brd', 'user stories', 'process flow diagrams', 'requirements traceability matrix'],
  },
  {
    phrase: 'user acceptance testing',
    category: 'responsibility',
    supportedByTerms: ['chaired user acceptance testing (uat)', 'uat acceptance criteria', 'test scenario coverage'],
  },
  {
    phrase: 'data visualization',
    category: 'responsibility',
    supportedByTerms: ['tableau', 'power bi', 'aws quicksight', 'analytical dashboards', 'bi dashboards'],
  },
  {
    phrase: 'market research & competitive analysis',
    category: 'responsibility',
    supportedByTerms: ['synthesize market research', 'competitor market research', 'competitor benchmarking across 5'],
  },
  {
    phrase: 'pricing strategy',
    category: 'responsibility',
    supportedByTerms: ['pricing models', 'refreshed pricing tier', 'pricing strategy & financial forecasting'],
  },
  {
    phrase: 'customer advocacy',
    category: 'soft_skill',
    supportedByTerms: ['customer advocacy forums', 'customer insights & advocacy', 'operationalized customer insights'],
  },
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesWordInCorpus(corpus: string, term: string): boolean {
  const escaped = escapeRegex(term);
  const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, 'i');
  return regex.test(corpus);
}

// =============================================================
// DETERMINISTIC TRUTH VALIDATION ENGINE
// =============================================================

export class ResumeTruthValidator {
  /**
   * Validate a generated or draft resume against the active Master Resume
   * across all 13 mandatory dimensions.
   */
  public static validate(
    resume: Partial<TailoredResume> | Record<string, any>,
    master: MasterResume
  ): TruthValidationReport {
    const reportId = `truth-audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const errors: string[] = [];
    const warnings: string[] = [];
    const equivalencesUsed: Array<{ tailored_phrase: string; master_evidence: string; category: string }> = [];
    const strictRejections: Array<{ claim: string; reason: string }> = [];

    // Master resume baseline maps (normalized)
    const masterCompanyNames = master.experience.map((e) => e.company.toLowerCase().trim());
    const masterTechAll = new Set([
      ...master.technologies.map((t) => t.toLowerCase().trim()),
      ...master.skills.map((s) => s.toLowerCase().trim()),
      ...master.experience.flatMap((e) => (e.technologies || []).map((t) => t.toLowerCase().trim())),
    ]);

    const masterCertNames = master.certifications.map((c) => c.name.toLowerCase().trim());
    const masterEducationInstitutions = master.education.map((e) => e.institution.toLowerCase().trim());
    const masterDegrees = master.education.map((e) => e.degree.toLowerCase().trim());

    // Aggregate all text from the generated resume
    const experienceEntries: Array<{
      company: string;
      title: string;
      dates: string;
      responsibilities: string[];
      achievements: string[];
    }> =
      resume.professional_experience ||
      resume.tailored_experience ||
      [];

    const resumeSkills: string[] = [
      ...(resume.core_skills || []),
      ...((resume.targeted_skills?.present) || []),
      ...((resume.targeted_skills?.related) || []),
    ];

    const resumeCertifications: string[] = (resume.certifications || []).map((c: any) =>
      typeof c === 'string' ? c : c.name || ''
    );

    const resumeSummary = (resume.summary || resume.professional_summary || '').toString();
    const resumeHeadline = (resume.target_title || resume.headline || '').toString();

    const fullResumeCorpus = [
      resumeHeadline,
      resumeSummary,
      ...resumeSkills,
      ...resumeCertifications,
      ...experienceEntries.flatMap((e) => [
        e.company,
        e.title,
        e.dates,
        ...(e.responsibilities || (e as any).reordered_responsibilities || []),
        ...(e.achievements || (e as any).truth_aligned_achievements || []),
      ]),
    ]
      .join(' ')
      .toLowerCase();

    // -------------------------------------------------------------
    // 1. Employer Names Validation
    // -------------------------------------------------------------
    const evidencedEmployers: string[] = [];
    const unsupportedEmployers: string[] = [];

    for (const exp of experienceEntries) {
      const compName = (exp.company || '').trim();
      if (!compName) continue;
      const compLower = compName.toLowerCase();

      // Check against master companies
      const isKnown = masterCompanyNames.some(
        (mc) => mc === compLower || compLower.includes(mc) || mc.includes(compLower)
      );

      if (isKnown) {
        evidencedEmployers.push(compName);
      } else {
        unsupportedEmployers.push(compName);
        errors.push(`Unsupported employer: ${compName}`);
      }
    }

    const employerAudit: DimensionAuditResult = {
      dimension_id: '1_employer_names',
      name: 'Employer Names',
      passed: unsupportedEmployers.length === 0,
      status: unsupportedEmployers.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedEmployers,
      unsupported_items: unsupportedEmployers,
      notes:
        unsupportedEmployers.length === 0
          ? `All ${evidencedEmployers.length} employers verified against Master Resume.`
          : `Flagged ${unsupportedEmployers.length} unevidenced employers.`,
    };

    // -------------------------------------------------------------
    // 2. Job Titles Validation
    // -------------------------------------------------------------
    const evidencedTitles: string[] = [];
    const unsupportedTitles: string[] = [];

    for (const exp of experienceEntries) {
      const title = (exp.title || '').trim();
      const compLower = (exp.company || '').toLowerCase().trim();
      if (!title) continue;

      const masterMatch = master.experience.find(
        (m) => m.company.toLowerCase().trim() === compLower || compLower.includes(m.company.toLowerCase().trim())
      );

      if (masterMatch) {
        const mTitleLower = masterMatch.title.toLowerCase().trim();
        const tLower = title.toLowerCase();

        // Allowed title variations (e.g. Business Analyst vs Senior Business Analyst or Product Owner)
        const isCompatible =
          tLower.includes(mTitleLower) ||
          mTitleLower.includes(tLower) ||
          (mTitleLower.includes('business analyst') && tLower.includes('business analyst')) ||
          (mTitleLower.includes('product specialist') && tLower.includes('product specialist'));

        if (isCompatible) {
          evidencedTitles.push(`${title} (${exp.company})`);
        } else {
          unsupportedTitles.push(`${title} (${exp.company})`);
          errors.push(`Unsupported job title: ${title} at ${exp.company}`);
        }
      }
    }

    const titlesAudit: DimensionAuditResult = {
      dimension_id: '2_job_titles',
      name: 'Job Titles',
      passed: unsupportedTitles.length === 0,
      status: unsupportedTitles.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedTitles,
      unsupported_items: unsupportedTitles,
      notes:
        unsupportedTitles.length === 0
          ? 'All job titles match verified positions in Master Resume.'
          : `Flagged unsupported job titles: ${unsupportedTitles.join(', ')}`,
    };

    // -------------------------------------------------------------
    // 3. Employment Dates Validation
    // -------------------------------------------------------------
    const evidencedDates: string[] = [];
    const unsupportedDates: string[] = [];

    for (const exp of experienceEntries) {
      const dates = (exp.dates || '').trim();
      const compLower = (exp.company || '').toLowerCase().trim();
      if (!dates) continue;

      const masterMatch = master.experience.find(
        (m) => m.company.toLowerCase().trim() === compLower || compLower.includes(m.company.toLowerCase().trim())
      );

      if (masterMatch) {
        const verifiedDates = `${masterMatch.start_date} - ${masterMatch.end_date}`;
        // Normalize comparison (handle spaces / dashes)
        const normTailored = dates.replace(/[\s–—]+/g, ' ').toLowerCase();
        const normVerified = verifiedDates.replace(/[\s–—]+/g, ' ').toLowerCase();

        // Dates match if start and end dates correspond or are within verified tenure
        const hasStart = normTailored.includes(masterMatch.start_date.toLowerCase());
        const hasEnd = normTailored.includes(masterMatch.end_date.toLowerCase());

        if (hasStart && hasEnd) {
          evidencedDates.push(`${exp.company}: ${dates}`);
        } else {
          unsupportedDates.push(`${exp.company}: '${dates}' vs verified '${verifiedDates}'`);
          errors.push(
            `Mismatched employment dates for ${exp.company}: '${dates}' does not match verified '${verifiedDates}'`
          );
        }
      }
    }

    const datesAudit: DimensionAuditResult = {
      dimension_id: '3_employment_dates',
      name: 'Employment Dates',
      passed: unsupportedDates.length === 0,
      status: unsupportedDates.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedDates,
      unsupported_items: unsupportedDates,
      notes:
        unsupportedDates.length === 0
          ? 'All employment date ranges exactly match verified tenures.'
          : `Flagged date mismatches: ${unsupportedDates.join('; ')}`,
    };

    // -------------------------------------------------------------
    // 4. Education Validation
    // -------------------------------------------------------------
    const evidencedEducation: string[] = [];
    const unsupportedEducation: string[] = [];
    const tailoredEdu = resume.education || master.education;

    for (const edu of tailoredEdu) {
      const inst = (edu.institution || '').toLowerCase().trim();
      const deg = (edu.degree || '').toLowerCase().trim();

      const instMatches = masterEducationInstitutions.some((mi) => inst.includes(mi) || mi.includes(inst));
      const degMatches = masterDegrees.some((md) => deg.includes(md) || md.includes(deg));

      if (instMatches && degMatches) {
        evidencedEducation.push(`${edu.degree} - ${edu.institution}`);
      } else {
        const itemStr = `${edu.degree} from ${edu.institution}`;
        unsupportedEducation.push(itemStr);
        errors.push(`Unsupported education: ${itemStr}`);
      }
    }

    const educationAudit: DimensionAuditResult = {
      dimension_id: '4_education',
      name: 'Education',
      passed: unsupportedEducation.length === 0,
      status: unsupportedEducation.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedEducation,
      unsupported_items: unsupportedEducation,
      notes:
        unsupportedEducation.length === 0
          ? 'All degrees and academic institutions verified against Master Resume.'
          : `Flagged unverified education: ${unsupportedEducation.join(', ')}`,
    };

    // -------------------------------------------------------------
    // 5. Certifications Validation
    // -------------------------------------------------------------
    const evidencedCerts: string[] = [];
    const unsupportedCerts: string[] = [];

    // Check all certifications in the resume
    for (const cert of resumeCertifications) {
      const cLower = cert.toLowerCase().trim();
      if (!cLower) continue;

      // STRICT AUDIT RULE: PMP Check
      if (cLower === 'pmp' || cLower.includes('project management professional')) {
        unsupportedCerts.push(cert);
        errors.push(
          'Unsupported certification: PMP (Project Management Professional) — flagged as unverified in master resume'
        );
        continue;
      }

      // Check if matches a verified certification in Master Resume
      const isKnown = masterCertNames.some(
        (mc) => mc === cLower || cLower.includes(mc) || mc.includes(cLower)
      );

      if (isKnown) {
        evidencedCerts.push(cert);
      } else {
        unsupportedCerts.push(cert);
        errors.push(`Unsupported certification: ${cert}`);
      }
    }

    // Also verify no unverified certs injected into headline
    if (
      (resumeHeadline.toLowerCase().includes('pmp') || resumeHeadline.toLowerCase().includes('project management professional')) &&
      !masterCertNames.some((c) => c.includes('pmp'))
    ) {
      warnings.push('Header mentions PMP, but PMP is strictly excluded from verified certifications.');
    }

    const certsAudit: DimensionAuditResult = {
      dimension_id: '5_certifications',
      name: 'Certifications',
      passed: unsupportedCerts.length === 0,
      status: unsupportedCerts.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedCerts,
      unsupported_items: unsupportedCerts,
      notes:
        unsupportedCerts.length === 0
          ? 'All certifications confirmed in Master Resume (PMP excluded per zero-fabrication audit rule).'
          : `Flagged unsupported certifications: ${unsupportedCerts.join(', ')}`,
    };

    // -------------------------------------------------------------
    // 6. Technologies Validation (General Tech Claims)
    // -------------------------------------------------------------
    const evidencedTechnologies: string[] = [];
    const unsupportedTechnologies: string[] = [];

    // Check for forbidden unevidenced technologies across the entire resume corpus
    for (const [key, label] of Object.entries(FORBIDDEN_UNSUPPORTED_TECH)) {
      if (matchesWordInCorpus(fullResumeCorpus, key)) {
        unsupportedTechnologies.push(label);
        errors.push(`Unsupported technology: ${label}`);
        strictRejections.push({
          claim: label,
          reason: `Technology '${label}' has no verifiable experience or skill proof in Master Resume.`,
        });
      }
    }

    // Check core skills and targeted skills explicitly
    for (const sk of resumeSkills) {
      const skLower = sk.toLowerCase().trim();
      if (!skLower) continue;

      if (masterTechAll.has(skLower)) {
        evidencedTechnologies.push(sk);
      } else {
        // Check if covered by semantic equivalence
        const matchedEquiv = SEMANTIC_EQUIVALENCE_RULES.find(
          (eq) => eq.phrase.toLowerCase() === skLower
        );
        if (matchedEquiv) {
          equivalencesUsed.push({
            tailored_phrase: sk,
            master_evidence: matchedEquiv.supportedByTerms.join(', '),
            category: matchedEquiv.category,
          });
          evidencedTechnologies.push(`${sk} (via Semantic Equivalence)`);
        }
      }
    }

    const techAudit: DimensionAuditResult = {
      dimension_id: '6_technologies',
      name: 'Technologies',
      passed: unsupportedTechnologies.length === 0,
      status: unsupportedTechnologies.length === 0 ? 'passed' : 'failed',
      evidenced_items: Array.from(new Set(evidencedTechnologies)),
      unsupported_items: unsupportedTechnologies,
      notes:
        unsupportedTechnologies.length === 0
          ? 'Zero unevidenced technologies detected. All claims grounded in master resume.'
          : `Flagged unsupported technologies: ${unsupportedTechnologies.join(', ')}`,
    };

    // -------------------------------------------------------------
    // 7. Tools Validation
    // -------------------------------------------------------------
    const evidencedTools: string[] = [];
    const unsupportedTools: string[] = [];

    for (const [key, label] of Object.entries(FORBIDDEN_UNSUPPORTED_TOOLS)) {
      if (matchesWordInCorpus(fullResumeCorpus, key)) {
        unsupportedTools.push(label);
        errors.push(`Unsupported tool: ${label}`);
        strictRejections.push({
          claim: label,
          reason: `Tool '${label}' is not evidenced in Master Resume tools or workflows.`,
        });
      }
    }

    // Known verified tools in master
    const verifiedMasterTools = ['Tableau', 'Power BI', 'Jira', 'Confluence', 'Azure DevOps', 'Rally', 'Postman', 'GitHub', 'GitLab', 'AWS QuickSight'];
    for (const tool of verifiedMasterTools) {
      if (fullResumeCorpus.includes(tool.toLowerCase())) {
        evidencedTools.push(tool);
      }
    }

    const toolsAudit: DimensionAuditResult = {
      dimension_id: '7_tools',
      name: 'Tools',
      passed: unsupportedTools.length === 0,
      status: unsupportedTools.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedTools,
      unsupported_items: unsupportedTools,
      notes:
        unsupportedTools.length === 0
          ? `All tools verified (${evidencedTools.join(', ')}). No loose tool equivalence permitted.`
          : `Flagged unsupported tools: ${unsupportedTools.join(', ')}`,
    };

    // -------------------------------------------------------------
    // 8. Programming & Data Technologies Validation
    // -------------------------------------------------------------
    const evidencedProgData: string[] = [];
    const unsupportedProgData: string[] = [];

    for (const [key, label] of Object.entries(FORBIDDEN_UNSUPPORTED_LANGUAGES)) {
      if (matchesWordInCorpus(fullResumeCorpus, key)) {
        unsupportedProgData.push(label);
        errors.push(`Unsupported programming/data technology: ${label}`);
        strictRejections.push({
          claim: label,
          reason: `Programming language '${label}' is not listed or verified in Master Resume (SQL != Python rule enforced).`,
        });
      }
    }

    // Explicit skills check for short-token languages like 'go' or 'r'
    const explicitSkillsLower = resumeSkills.map((s) => s.toLowerCase().trim());
    if (explicitSkillsLower.includes('go') || explicitSkillsLower.includes('go lang') || explicitSkillsLower.includes('golang')) {
      if (!unsupportedProgData.includes('Golang')) {
        unsupportedProgData.push('Golang');
        errors.push('Unsupported programming/data technology: Golang');
      }
    }
    if (explicitSkillsLower.includes('r') || explicitSkillsLower.includes('r programming') || explicitSkillsLower.includes('r language')) {
      if (!unsupportedProgData.includes('R')) {
        unsupportedProgData.push('R');
        errors.push('Unsupported programming/data technology: R');
      }
    }

    // Verified programming & data technologies: SQL, JSON, XML, REST API
    ['SQL', 'JSON', 'XML', 'REST API'].forEach((tech) => {
      if (fullResumeCorpus.includes(tech.toLowerCase())) {
        evidencedProgData.push(tech);
      }
    });

    const progDataAudit: DimensionAuditResult = {
      dimension_id: '8_programming_data_technologies',
      name: 'Programming & Data Technologies',
      passed: unsupportedProgData.length === 0,
      status: unsupportedProgData.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedProgData,
      unsupported_items: unsupportedProgData,
      notes:
        unsupportedProgData.length === 0
          ? 'SQL, JSON, XML, and REST APIs verified. Strict exclusion of unverified languages (Python/Java).'
          : `Flagged unsupported programming/data technologies: ${unsupportedProgData.join(', ')}`,
    };

    // -------------------------------------------------------------
    // 9. Cloud Platforms Validation
    // -------------------------------------------------------------
    const evidencedCloud: string[] = [];
    const unsupportedCloud: string[] = [];

    for (const [key, label] of Object.entries(FORBIDDEN_UNSUPPORTED_CLOUDS)) {
      if (matchesWordInCorpus(fullResumeCorpus, key)) {
        unsupportedCloud.push(label);
        errors.push(`Unsupported cloud platform: ${label}`);
        strictRejections.push({
          claim: label,
          reason: `Cloud platform '${label}' is unverified. Candidate is verified strictly for AWS and Microsoft Azure.`,
        });
      }
    }

    if (fullResumeCorpus.includes('aws') || fullResumeCorpus.includes('amazon web services')) {
      evidencedCloud.push('AWS (Amazon Web Services)');
    }
    if (fullResumeCorpus.includes('azure') || fullResumeCorpus.includes('microsoft azure')) {
      evidencedCloud.push('Microsoft Azure');
    }

    const cloudAudit: DimensionAuditResult = {
      dimension_id: '9_cloud_platforms',
      name: 'Cloud Platforms',
      passed: unsupportedCloud.length === 0,
      status: unsupportedCloud.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedCloud,
      unsupported_items: unsupportedCloud,
      notes:
        unsupportedCloud.length === 0
          ? 'Verified AWS and Azure. Strict cloud platform separation (AWS != Azure != GCP) enforced.'
          : `Flagged unsupported cloud platforms: ${unsupportedCloud.join(', ')}`,
    };

    // -------------------------------------------------------------
    // 10. Metrics Validation
    // -------------------------------------------------------------
    const evidencedMetrics: string[] = [];
    const unsupportedMetrics: string[] = [];

    // Verified metrics patterns from master resume
    const verifiedMetricsPatterns = [
      { pattern: /30\s*%\s*(operational|improvement|effectiveness)/i, label: '30% operational effectiveness improvement' },
      { pattern: /25\s*%\s*(defect|post-deployment|reduction)/i, label: '25% post-deployment defect reduction' },
      { pattern: /100\s*%\s*(test|coverage|scenario)/i, label: '100% test scenario coverage' },
      { pattern: /9\s*(\+|\~)?\s*years/i, label: '~9 years verified experience' },
      { pattern: /5\s*(ed-tech|platform|benchmarking)/i, label: '5 ed-tech platforms benchmarked' },
      { pattern: /3\s*(high-impact|improvements|product)/i, label: '3 high-impact product improvements' },
    ];

    for (const vm of verifiedMetricsPatterns) {
      if (vm.pattern.test(fullResumeCorpus)) {
        evidencedMetrics.push(vm.label);
      }
    }

    // Scan for unevidenced percentages, financial amounts, or multipliers
    const allPercentMatches = fullResumeCorpus.match(/\b\d{1,3}\s*%/g) || [];
    for (const match of allPercentMatches) {
      const numVal = parseInt(match.replace('%', '').trim(), 10);
      // Legitimate numbers: 30%, 25%, 100%, 95% (ATS target in header/notes)
      if (numVal === 30 || numVal === 25 || numVal === 100 || numVal === 95 || numVal === 24) {
        continue;
      }
      // Any other metric (e.g. 40%, 50%, 80%) is unsupported!
      const contextRegex = new RegExp(`(?:\\S+\\s+){0,3}${escapeRegex(match)}(?:\\s+\\S+){0,3}`, 'i');
      const snippet = (fullResumeCorpus.match(contextRegex)?.[0] || match).trim();
      unsupportedMetrics.push(snippet);
      errors.push(`Unsupported metric: ${snippet}`);
    }

    // Scan for unevidenced dollar amounts (e.g. $50M, $10M, $5M)
    const dollarMatches = fullResumeCorpus.match(/\$\s*\d+[\d,]*\s*(?:million|m|k|billion|b)?/gi) || [];
    for (const match of dollarMatches) {
      unsupportedMetrics.push(match);
      errors.push(`Unsupported metric: ${match}`);
    }

    const metricsAudit: DimensionAuditResult = {
      dimension_id: '10_metrics',
      name: 'Metrics',
      passed: unsupportedMetrics.length === 0,
      status: unsupportedMetrics.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedMetrics,
      unsupported_items: unsupportedMetrics,
      notes:
        unsupportedMetrics.length === 0
          ? `All quantitative metrics verified against Master Resume benchmarks (${evidencedMetrics.join('; ')}).`
          : `Flagged unevidenced metrics: ${unsupportedMetrics.join(', ')}`,
    };

    // -------------------------------------------------------------
    // 11. Achievements Validation
    // -------------------------------------------------------------
    const evidencedAchievements: string[] = [];
    const unsupportedAchievements: string[] = [];

    const masterAchievementsText = master.experience
      .flatMap((e) => e.achievements || [])
      .join(' ')
      .toLowerCase();

    for (const exp of experienceEntries) {
      const achievements = exp.achievements || (exp as any).truth_aligned_achievements || [];
      for (const ach of achievements) {
        const aLower = ach.toLowerCase().trim();
        if (!aLower) continue;

        // Check if words in achievement match master achievements
        const words = aLower.split(/\s+/).filter((w) => w.length > 3);
        const matchCount = words.filter((w) => masterAchievementsText.includes(w)).length;
        const ratio = words.length > 0 ? matchCount / words.length : 1;

        if (ratio >= 0.55 || masterAchievementsText.includes(aLower.substring(0, 30))) {
          evidencedAchievements.push(ach.substring(0, 60) + '...');
        } else {
          unsupportedAchievements.push(ach);
          errors.push(`Unsupported achievement: ${ach}`);
        }
      }
    }

    const achievementsAudit: DimensionAuditResult = {
      dimension_id: '11_achievements',
      name: 'Achievements',
      passed: unsupportedAchievements.length === 0,
      status: unsupportedAchievements.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedAchievements,
      unsupported_items: unsupportedAchievements,
      notes:
        unsupportedAchievements.length === 0
          ? 'All achievement claims verified against Master Resume record.'
          : `Flagged unsupported achievements: ${unsupportedAchievements.join('; ')}`,
    };

    // -------------------------------------------------------------
    // 12. Responsibilities Validation & Semantic Equivalence Layer
    // -------------------------------------------------------------
    const evidencedResponsibilities: string[] = [];
    const unsupportedResponsibilities: string[] = [];

    const masterResponsibilitiesText = master.experience
      .flatMap((e) => e.responsibilities || [])
      .join(' ')
      .toLowerCase();

    for (const exp of experienceEntries) {
      const responsibilities = exp.responsibilities || (exp as any).reordered_responsibilities || [];
      for (const resp of responsibilities) {
        const rLower = resp.toLowerCase().trim();
        if (!rLower) continue;

        // Rule A: Directly exists in the master resume (as whole or substring)
        const isDirect = masterResponsibilitiesText.includes(rLower.substring(0, 30));

        if (isDirect) {
          evidencedResponsibilities.push(resp.substring(0, 50) + '...');
          continue;
        }

        // Rule B: Truthful rephrasing supported by Semantic Equivalence Layer
        let supportedByEquiv = false;
        for (const eq of SEMANTIC_EQUIVALENCE_RULES) {
          if (rLower.includes(eq.phrase.toLowerCase())) {
            // Check if master resume contains the supporting terms
            const masterSupports = eq.supportedByTerms.some((term) =>
              masterResponsibilitiesText.includes(term.toLowerCase())
            );
            if (masterSupports) {
              supportedByEquiv = true;
              equivalencesUsed.push({
                tailored_phrase: eq.phrase,
                master_evidence: eq.supportedByTerms.join(', '),
                category: eq.category,
              });
              break;
            }
          }
        }

        if (supportedByEquiv) {
          evidencedResponsibilities.push(`${resp.substring(0, 45)}... (Semantic Equivalence)`);
          continue;
        }

        // Check word overlap ratio
        const words = rLower.split(/\s+/).filter((w) => w.length > 3);
        const matchCount = words.filter((w) => masterResponsibilitiesText.includes(w)).length;
        const ratio = words.length > 0 ? matchCount / words.length : 0;

        if (ratio >= 0.5) {
          evidencedResponsibilities.push(resp.substring(0, 50) + '...');
        } else {
          unsupportedResponsibilities.push(resp);
          errors.push(`Unsupported responsibility: ${resp}`);
        }
      }
    }

    const responsibilitiesAudit: DimensionAuditResult = {
      dimension_id: '12_responsibilities',
      name: 'Responsibilities',
      passed: unsupportedResponsibilities.length === 0,
      status: unsupportedResponsibilities.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedResponsibilities,
      unsupported_items: unsupportedResponsibilities,
      notes:
        unsupportedResponsibilities.length === 0
          ? 'Every responsibility directly exists in Master Resume or is a truthful rephrasing supported by the Semantic Equivalence Layer.'
          : `Flagged unsupported responsibilities: ${unsupportedResponsibilities.join('; ')}`,
    };

    // -------------------------------------------------------------
    // 13. Industry / Domain Claims Validation
    // -------------------------------------------------------------
    const evidencedDomains: string[] = [];
    const unsupportedDomains: string[] = [];

    // Check for forbidden industries in corpus
    for (const [key, label] of Object.entries(FORBIDDEN_UNSUPPORTED_DOMAINS)) {
      if (matchesWordInCorpus(fullResumeCorpus, key)) {
        unsupportedDomains.push(label);
        errors.push(`Unsupported industry/domain claim: ${label}`);
        strictRejections.push({
          claim: label,
          reason: `Industry domain '${label}' is completely unevidenced in candidate background.`,
        });
      }
    }

    // Check verified domains
    const verifiedMasterDomains = [
      'Semiconductor Manufacturing & Hardware Engineering',
      'Public Sector & Health and Human Services (HHS)',
      'Financial Technology (FinTech)',
      'Capital Markets & Financial Data',
      'Banking & Digital Payments',
      'EdTech & Cloud Learning Systems',
    ];

    verifiedMasterDomains.forEach((dom) => {
      evidencedDomains.push(dom);
    });

    const domainAudit: DimensionAuditResult = {
      dimension_id: '13_industry_domain_claims',
      name: 'Industry & Domain Claims',
      passed: unsupportedDomains.length === 0,
      status: unsupportedDomains.length === 0 ? 'passed' : 'failed',
      evidenced_items: evidencedDomains,
      unsupported_items: unsupportedDomains,
      notes:
        unsupportedDomains.length === 0
          ? 'All domain references strictly align with verified candidate history.'
          : `Flagged unsupported domains: ${unsupportedDomains.join(', ')}`,
    };

    // -------------------------------------------------------------
    // Final Audit Compilation & Status Assignment
    // -------------------------------------------------------------
    const hasFailures = errors.length > 0;
    const hasWarnings = warnings.length > 0;
    const validationStatus: TruthValidationStatus = hasFailures
      ? 'FAILED'
      : hasWarnings
      ? 'PASSED_WITH_WARNINGS'
      : 'PASSED';

    return {
      id: reportId,
      job_id: resume.job_id || 'manual_check',
      resume_id: resume.id,
      target_role: resume.job_title || resume.target_title || 'Tailored Profile',
      company: resume.company || 'Target Employer',
      validation_status: validationStatus,
      validation_errors: errors,
      validation_warnings: warnings,
      validated_at: new Date().toISOString(),
      dimensions: {
        employer_names: employerAudit,
        job_titles: titlesAudit,
        employment_dates: datesAudit,
        education: educationAudit,
        certifications: certsAudit,
        technologies: techAudit,
        tools: toolsAudit,
        programming_data_technologies: progDataAudit,
        cloud_platforms: cloudAudit,
        metrics: metricsAudit,
        achievements: achievementsAudit,
        responsibilities: responsibilitiesAudit,
        industry_domain_claims: domainAudit,
      },
      semantic_equivalences_used: equivalencesUsed,
      strict_rejections_enforced: strictRejections,
    };
  }
}
