/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PageClassification =
  | 'INDIVIDUAL_JOB'
  | 'LISTING_PAGE'
  | 'COMPANY_PAGE'
  | 'SEARCH_PAGE'
  | 'ERROR_PAGE'
  | 'UNKNOWN';

export const KNOWN_ATS_PLATFORMS = [
  'Greenhouse',
  'Lever',
  'Workday',
  'Ashby',
  'SmartRecruiters',
  'Taleo',
  'BuiltIn',
  'LinkedIn',
] as const;

export type AtsPlatform = typeof KNOWN_ATS_PLATFORMS[number] | 'Direct Career Portal';

export interface RawDiscoveredUrl {
  original_url: string;
  normalized_url: string;
  source_page?: string;
  source_query?: string;
  platform: AtsPlatform;
  classification?: PageClassification;
  rank_score: number;
}

export interface JobPostingData {
  company: string;
  title: string;
  location: string;
  country: 'USA' | 'India' | 'Global';
  remote: 'remote' | 'hybrid' | 'on-site';
  work_mode: string;
  employment_type: string;
  experience_required: string;
  salary: string;
  posted_date: string;
  posted_date_verified: boolean;
  posted_date_source: 'json-ld' | 'meta' | 'explicit-text' | 'unverified';
  age_days: number;
  age_status: 'fresh' | 'active' | 'stale';
  application_url: string;
  source_url: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
  extraction_notes?: string;
  ats_platform?: AtsPlatform;
}

export interface JobSearchRunRecord {
  id: string;
  start_time: string;
  end_time?: string;
  country: 'USA' | 'India' | 'All';
  queries: string[];
  target_roles: string[];
  results_found: number;
  unique_urls_count: number;
  likely_job_pages_count: number;
  jobs_extracted: number;
  jobs_saved: number;
  errors: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_step: string;
  logs: string[];
}

export interface JobDiscoveryProgress {
  run_id: string;
  step: string;
  progress_percent: number;
  results_found: number;
  unique_urls: number;
  likely_job_pages: number;
  jobs_extracted: number;
  jobs_saved: number;
  logs: string[];
}

export const TARGET_ROLE_PROFILES = [
  'Business Analyst',
  'Senior Business Analyst',
  'Product Manager',
  'Senior Product Manager',
  'Product Owner',
  'Senior Product Owner',
  'AI Product Manager',
  'Technical Product Manager',
  'IT Product Manager',
  'Product Analyst',
  'Project Manager',
  'Technical Business Analyst',
] as const;

export type TargetRole = typeof TARGET_ROLE_PROFILES[number];
