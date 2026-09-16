/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchCategory } from '../../../src/types';

export type { MatchCategory };

export type SkillClassification = 'EVIDENCED' | 'RELATED/EQUIVALENT' | 'NOT_EVIDENCED';

export interface SkillEvaluation {
  skill: string;
  classification: SkillClassification;
  evidenceOrRationale: string;
  formattedOutput: string; // e.g. "Snowflake — not evidenced in master resume"
}

export interface TitleRelevanceResult {
  score: number; // 0 - 100
  targetRole: string;
  jobTitle: string;
  rationale: string;
}

export interface IndustryRelevanceResult {
  score: number; // 0 - 100
  matchedIndustries: string[];
  rationale: string;
}

export interface SemanticEmbeddingBreakdown {
  summarySimilarity: number;
  experiencesSimilarity: number;
  skillsSimilarity: number;
  titleSimilarity: number;
  overallSemanticSimilarity: number; // 0 - 100
}

export interface Phase4MatchResult {
  match_score: number; // 0 - 100
  match_category: MatchCategory;
  semantic_score: number; // 35% weight
  skills_score: number; // 25% weight
  responsibility_score: number; // 20% weight
  industry_score: number; // 10% weight
  title_score: number; // 10% weight
  matched_skills: string[];
  related_skills: Array<{ skill: string; equivalent_evidence: string }>;
  not_evidenced_skills: string[];
  matching_explanation: string;
  meets_tailoring_gate: boolean; // true if match_score >= 60
  strengths: string[];
  gaps: string[];
  details: {
    titleRelevance: TitleRelevanceResult;
    industryRelevance: IndustryRelevanceResult;
    skillEvaluations: SkillEvaluation[];
    embeddingBreakdown?: SemanticEmbeddingBreakdown;
  };
}

export const VERIFIED_CANDIDATE_INDUSTRIES = [
  'Financial Services',
  'Technology',
  'Manufacturing',
  'Government/Eligibility systems',
  'E-commerce',
  'Banking',
  'Cloud/technology',
] as const;

export type VerifiedIndustry = typeof VERIFIED_CANDIDATE_INDUSTRIES[number];
