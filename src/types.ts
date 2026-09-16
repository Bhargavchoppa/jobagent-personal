/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CountryTarget = 'USA' | 'India' | 'All';

export type WorkMode = 'remote' | 'hybrid' | 'on-site';

export type MatchCategory =
  | 'Strong Match' // 75 - 100
  | 'Tailor Resume' // 60 - 74
  | 'Review Later' // 50 - 59
  | 'Reject'
  | 'Reject / Do Not Tailor'; // < 50

export type AtsKeywordStatus = 'present' | 'related' | 'not_evidenced';

export type ApplicationStatus =
  | 'Not Applied'
  | 'Saved'
  | 'Tailored'
  | 'Applied'
  | 'Interviewing'
  | 'Offer'
  | 'Rejected';

export interface PersonalInformation {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url?: string;
  portfolio_url?: string;
  header_positioning: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  industry: string;
  domain: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  field_of_study: string;
  institution: string;
  graduation_date: string;
  location?: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  issue_date?: string;
  verified: boolean;
  notes?: string;
}

export interface InconsistencyFlag {
  id: string;
  code: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location_a: string;
  location_b: string;
  resolution_rule: string;
}

export interface MasterResume {
  id: string;
  user_id: string;
  version: number;
  is_active?: boolean;
  is_seed_data?: boolean;
  source_of_truth?: {
    is_verified: boolean;
    source: 'seed_specification' | 'user_upload' | 'manual_edit' | 'manual_entry';
    last_verified_at: string;
    verified_by?: string;
  };
  personal_information: PersonalInformation;
  professional_summary: string;
  skills: string[];
  technologies: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
  }>;
  achievements: string[];
  inconsistency_flags: InconsistencyFlag[];
  total_experience_years: number;
  last_updated: string;
  is_immutable: boolean;
}

export interface ResumeVersion {
  id: string;
  version: number;
  timestamp: string;
  is_active: boolean;
  source: 'seed_specification' | 'user_upload' | 'manual_edit';
  note: string;
  snapshot: MasterResume;
  inconsistency_count: number;
}

export interface ParsedResumeReview {
  id: string;
  raw_text_preview: string;
  extracted_resume: MasterResume;
  inconsistencies: InconsistencyFlag[];
  parsing_confidence: {
    overall: number;
    sections_detected: string[];
    warnings: string[];
  };
  uploaded_filename?: string;
  created_at: string;
}

export interface JobPosting {
  job_id: string;
  company: string;
  title: string;
  location: string;
  country: 'USA' | 'India' | 'Global';
  remote?: WorkMode;
  work_mode?: string;
  employment_type?: string;
  experience_required?: string;
  salary?: string;
  posted_date?: string;
  posted_date_verified?: boolean;
  posted_date_source?: 'json-ld' | 'meta' | 'explicit-text' | 'unverified';
  age_days?: number;
  age_status?: 'fresh' | 'active' | 'stale';
  application_url?: string;
  source_url?: string;
  external_url?: string;
  description?: string;
  raw_text?: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits?: string[];
  ats_platform?: string; // Greenhouse, Lever, Workday, Ashby, etc.
  extraction_notes?: string;
  match_score?: number;
  match_category?: MatchCategory;
  semantic_score?: number;
  skills_score?: number;
  responsibility_score?: number;
  industry_score?: number;
  title_score?: number;
  matched_skills?: string[];
  related_skills?: Array<{ skill: string; equivalent_evidence: string }>;
  not_evidenced_skills?: string[];
  matching_explanation?: string;
  missing_skills?: string[];
  source?: string;
  resume_file?: string;
  application_status: ApplicationStatus;
  first_seen: string;
  last_seen?: string;
}

export interface MatchBreakdown {
  semantic_similarity: number; // weight 35%
  skills_technologies: number; // weight 25%
  responsibilities: number; // weight 20%
  industry_domain: number; // weight 10%
  role_title: number; // weight 10%
  total_score: number; // weighted sum (0-100)
  category: MatchCategory;
  meets_tailoring_gate: boolean; // >= 60%
  justification: string;
  strengths: string[];
  gaps: string[];
  // Phase 4 semantic matching fields
  match_score?: number;
  match_category?: MatchCategory;
  semantic_score?: number;
  skills_score?: number;
  responsibility_score?: number;
  industry_score?: number;
  title_score?: number;
  matched_skills?: string[];
  related_skills?: Array<{ skill: string; equivalent_evidence: string }>;
  not_evidenced_skills?: string[];
  matching_explanation?: string;
}

export interface AtsKeywordItem {
  keyword: string;
  status: AtsKeywordStatus;
  evidence_in_resume?: string;
  suggested_phrasing?: string;
  category: 'core_skill' | 'technology' | 'responsibility' | 'certification' | 'domain' | 'role' | 'soft_skill';
  frequency_in_jd: number;
}

export interface AtsCategorizedKeywords {
  required_keywords: string[];
  preferred_keywords: string[];
  technical_keywords: string[];
  soft_skills: string[];
  domain_keywords: string[];
  role_keywords: string[];
  certification_keywords: string[];
}

export interface AtsAnalysis {
  id: string;
  job_id: string;
  coverage_percentage: number; // Target ~95% achievable truthful coverage
  total_jd_keywords: number;
  present_count: number;
  related_count: number;
  not_evidenced_count: number;
  keywords: AtsKeywordItem[];
  // Phase 5 Categories and Metric Breakdown
  categorized_keywords?: AtsCategorizedKeywords;
  keyword_coverage?: number; // overall %
  required_keyword_coverage?: number; // %
  technical_keyword_coverage?: number; // %
  role_keyword_coverage?: number; // %
  domain_keyword_coverage?: number; // %
  matched_keywords?: string[];
  missing_keywords?: string[]; // supported keywords missing from tailored resume
  unsupported_keywords: string[]; // unsupported keywords (not evidenced in master resume)
  truthful_maximum_score?: number; // theoretical maximum achievable truthful score
  ats_score?: number;
  truth_validation_audit: {
    passed: boolean;
    zero_fabrication_certified: boolean;
    verified_elements_count: number;
    flagged_inventions_count: number;
    audit_notes: string[];
  };
  revision_cycle: number;
  created_at: string;
}

export interface TailoredExperience {
  company: string;
  title: string;
  location: string;
  dates: string;
  reordered_responsibilities: string[];
  truth_aligned_achievements: string[];
}

export interface TailoredResume {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  generated_at: string;
  // Phase 5 Output Structure
  target_title?: string;
  summary?: string;
  core_skills?: string[];
  professional_experience?: TailoredExperience[];
  education?: EducationEntry[];
  certifications?: CertificationEntry[];
  ats_keywords_used?: string[];
  keywords_not_evidenced?: string[];
  truth_check?: {
    passed: boolean;
    zero_fabrication_certified: boolean;
    verified_elements_count: number;
    flagged_inventions_count: number;
    audit_notes: string[];
  };
  ats_score: number;
  truthful_maximum_ats_score?: number;
  revision_cycle?: number;
  // Backwards compatibility fields
  headline?: string;
  professional_summary?: string;
  targeted_skills?: {
    present: string[];
    related: string[];
    not_evidenced_disclaimer: string[];
  };
  tailored_experience?: TailoredExperience[];
  truth_audit_passed?: boolean;
  docx_ready?: boolean;
  file_name?: string;
  // Phase 6 Truth Validation Attributes
  validation_status?: 'PASSED' | 'FAILED' | 'PASSED_WITH_WARNINGS';
  validation_errors?: string[];
  validation_warnings?: string[];
  validated_at?: string;
}

export type TruthValidationStatus = 'PASSED' | 'FAILED' | 'PASSED_WITH_WARNINGS';

export interface DimensionAuditResult {
  dimension_id: string;
  name: string;
  passed: boolean;
  status: 'passed' | 'failed' | 'warning';
  evidenced_items: string[];
  unsupported_items: string[];
  notes: string;
}

export interface TruthValidationReport {
  id: string;
  job_id: string;
  resume_id?: string;
  target_role?: string;
  company?: string;
  validation_status: TruthValidationStatus;
  validation_errors: string[];
  validation_warnings: string[];
  validated_at: string;
  dimensions: {
    employer_names: DimensionAuditResult;
    job_titles: DimensionAuditResult;
    employment_dates: DimensionAuditResult;
    education: DimensionAuditResult;
    certifications: DimensionAuditResult;
    technologies: DimensionAuditResult;
    tools: DimensionAuditResult;
    programming_data_technologies: DimensionAuditResult;
    cloud_platforms: DimensionAuditResult;
    metrics: DimensionAuditResult;
    achievements: DimensionAuditResult;
    responsibilities: DimensionAuditResult;
    industry_domain_claims: DimensionAuditResult;
  };
  semantic_equivalences_used: Array<{
    tailored_phrase: string;
    master_evidence: string;
    category: string;
  }>;
  strict_rejections_enforced: Array<{
    claim: string;
    reason: string;
  }>;
}

export type GenerationProgressStage =
  | 'Matching'
  | 'Generating'
  | 'Analyzing ATS'
  | 'Optimizing'
  | 'Validating'
  | 'Completed';

export interface GenerationStageItem {
  name: GenerationProgressStage;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
  details?: string;
}

export interface ResumeGenerationRun {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  status: 'running' | 'completed' | 'failed';
  current_stage: GenerationProgressStage;
  stages: GenerationStageItem[];
  ats_score: number;
  truthful_maximum_ats_score: number;
  unsupported_keywords: string[];
  revision_cycle: number;
  created_at: string;
  completed_at?: string;
  error?: string;
}

export interface ApplicationRecord {
  id: string;
  job_id: string;
  company: string;
  title: string;
  country: 'USA' | 'India' | 'Global';
  status: ApplicationStatus;
  date_applied?: string;
  next_step?: string;
  notes?: string;
  match_score: number;
  tailored_resume_id?: string;
  updated_at: string;
  timeline?: ApplicationEvent[];
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  timestamp: string;
  event_type: 'status_change' | 'note' | 'interview_scheduled' | 'tailored';
  description: string;
}

export interface JobSearchRun {
  id: string;
  timestamp: string;
  start_time?: string;
  end_time?: string;
  target_roles: string[];
  queries?: string[];
  country: CountryTarget;
  results_found?: number;
  candidates_found: number;
  unique_urls_count?: number;
  likely_job_pages_count?: number;
  extracted_count: number;
  jobs_extracted?: number;
  deduped_count: number;
  jobs_saved?: number;
  high_match_count: number;
  tailored_count: number;
  errors?: string[];
  status: 'running' | 'completed' | 'failed';
  current_step: string;
  logs: string[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'security';
  module: 'DISCOVERY' | 'DEDUPE' | 'MATCHING' | 'ATS_TAILOR' | 'PROMPT_GUARD' | 'DATABASE' | 'RESUME_PARSE' | 'RESUME_VALIDATOR' | 'SETTINGS';
  message: string;
  metadata?: Record<string, unknown>;
}

export type SystemAuditLog = SystemLog;

export interface LiveJobSearchState {
  run_id: string;
  status: 'idle' | 'searching' | 'extracting' | 'matching' | 'tailoring' | 'completed' | 'error';
  progress_percent: number;
  current_step: string;
  candidates_found: number;
  results_found?: number;
  unique_urls?: number;
  likely_job_pages?: number;
  jobs_extracted?: number;
  jobs_saved?: number;
  processed_count: number;
  total_to_process: number;
  logs: string[];
}

export interface DashboardStats {
  jobs_found: number;
  jobs_discovered_today: number;
  india_jobs_count: number;
  usa_jobs_count: number;
  jobs_ge_60_count: number;
  strong_matches_count: number; // >=75% jobs
  tailored_resumes_count: number;
  applications_count: number;
  interview_pipeline_count: number;
  failed_searches_count: number;
}

// -------------------------------------------------------------
// Phase 7 — Resume Document Generation Types
// -------------------------------------------------------------
export interface AtsDocumentCompliance {
  has_tables: boolean;
  has_text_boxes: boolean;
  has_graphics: boolean;
  has_columns: boolean;
  has_icons: boolean;
  safe_font: 'Arial' | 'Calibri';
  critical_info_in_header_footer: boolean;
  sections_order: string[];
  word_count: number;
  pages_estimate: number;
  compliance_score: number; // 100% ATS Safe
}

export interface GeneratedResumeDocument {
  id: string;
  job_id: string;
  tailored_resume_id: string;
  company: string;
  job_title: string;
  target_title: string;
  target_title_adjusted?: boolean;
  target_title_adjustment_note?: string;
  docx_filename: string;
  pdf_filename: string;
  docx_size_bytes: number;
  pdf_size_bytes: number;
  docx_download_url: string;
  pdf_download_url: string;
  match_score: number;
  ats_score: number;
  truthful_maximum_ats_score?: number;
  truth_validation_status: 'PASSED' | 'FAILED' | 'PASSED_WITH_WARNINGS';
  truth_validation_passed: boolean;
  can_download: boolean;
  download_blocked_reason?: string;
  generated_at: string;
  preview_text: string;
  ats_compliance: AtsDocumentCompliance;
}

export interface DocumentGenerationDiagnosticResult {
  suite: string;
  total_tests: number;
  passed: number;
  failed: number;
  tests: Array<{
    name: string;
    category: string;
    passed: boolean;
    expected: string;
    actual: string;
    message?: string;
  }>;
}

export type AiProviderType = 'gemini' | 'ollama';

export interface SystemAiSettings {
  provider: AiProviderType;
  ollamaUrl: string;
  ollamaModel: string;
  geminiModel: string;
  temperature: number;
  maxTokens: number;
}

export interface AiModelProbeResult {
  connected: boolean;
  provider: AiProviderType;
  model: string;
  latencyMs: number;
  status: 'connected' | 'unconfigured' | 'offline' | 'error';
  message: string;
  endpoint?: string;
  modelsAvailable?: string[];
}
