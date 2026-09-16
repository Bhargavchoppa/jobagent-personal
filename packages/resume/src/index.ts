/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PersonalInformation {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url?: string;
  portfolio_url?: string;
  header_positioning: string;
}

export interface ExperienceRecord {
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

export interface EducationRecord {
  id: string;
  degree: string;
  field_of_study: string;
  institution: string;
  graduation_date: string;
  location: string;
}

export interface CertificationRecord {
  id: string;
  name: string;
  issuer: string;
  issue_date?: string;
  verified: boolean;
  notes?: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  technologies?: string[];
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

export interface MasterResumeEntity {
  id: string;
  user_id: string;
  version: number;
  is_active: boolean;
  is_immutable: boolean;
  personal_information: PersonalInformation;
  professional_summary: string;
  skills: string[];
  technologies: string[];
  experience: ExperienceRecord[];
  education: EducationRecord[];
  certifications: CertificationRecord[];
  projects: ProjectRecord[];
  achievements: string[];
  total_experience_years: number;
  inconsistency_flags: InconsistencyFlag[];
  last_updated: string;
}

export * from './tailoringEngine';
export * from './tests/tailoring.test';
export * from './truthValidator';
export * from './tests/truthValidator.test';
