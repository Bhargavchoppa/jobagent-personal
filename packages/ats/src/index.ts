/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchCategory, AtsKeywordCategory } from '../../shared/src/index';

export interface MatchScoreWeights {
  semantic: number;       // 0.35
  skills: number;         // 0.25
  responsibilities: number; // 0.20
  domain: number;         // 0.10
  title: number;          // 0.10
}

export const DEFAULT_WEIGHTS: MatchScoreWeights = {
  semantic: 0.35,
  skills: 0.25,
  responsibilities: 0.20,
  domain: 0.10,
  title: 0.10,
};

export const MATCH_THRESHOLDS = {
  STRONG_MATCH: 75,       // 75% - 100%
  TAILOR_TRIGGER: 60,     // 60% - 74% (hard gate: immediately proceed to tailor)
  REVIEW_LATER: 50,       // 50% - 59%
} as const;

export function determineMatchCategory(overallScore: number): MatchCategory {
  if (overallScore >= MATCH_THRESHOLDS.STRONG_MATCH) return MatchCategory.STRONG_MATCH;
  if (overallScore >= MATCH_THRESHOLDS.TAILOR_TRIGGER) return MatchCategory.TAILOR_RESUME;
  if (overallScore >= MATCH_THRESHOLDS.REVIEW_LATER) return MatchCategory.REVIEW_LATER;
  return MatchCategory.REJECT;
}

export interface AtsKeywordItem {
  skill: string;
  category: AtsKeywordCategory;
  context?: string;
  evidenceNotes?: string;
}

export * from './types';
export * from './cosineSimilarity';
export * from './embeddingEngine';
export * from './skillAnalyzer';
export * from './titleRelevance';
export * from './industryRelevance';
export * from './semanticMatcher';
export * from './tests/matching.test';
