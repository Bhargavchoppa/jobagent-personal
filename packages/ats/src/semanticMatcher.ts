/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MasterResume, JobPosting } from '../../../src/types';
import { EmbeddingEngine } from './embeddingEngine';
import { SkillAnalyzer } from './skillAnalyzer';
import { TitleRelevanceEngine } from './titleRelevance';
import { IndustryRelevanceEngine } from './industryRelevance';
import { Phase4MatchResult, MatchCategory } from './types';

export class SemanticJobMatcher {
  private embeddingEngine: EmbeddingEngine;
  private skillAnalyzer: SkillAnalyzer;
  private titleEngine: TitleRelevanceEngine;
  private industryEngine: IndustryRelevanceEngine;

  constructor() {
    this.embeddingEngine = new EmbeddingEngine();
    this.skillAnalyzer = new SkillAnalyzer();
    this.titleEngine = new TitleRelevanceEngine();
    this.industryEngine = new IndustryRelevanceEngine();
  }

  /**
   * Evaluates a job posting against the master resume using the Phase 4 5-component formula:
   * - Semantic similarity: 35%
   * - Skills/technologies: 25%
   * - Responsibilities: 20%
   * - Industry/domain: 10%
   * - Role/title: 10%
   * Total = 100%
   */
  public async evaluateMatch(job: JobPosting, master: MasterResume): Promise<Phase4MatchResult> {
    // 1. Semantic Embedding Analysis (35% weight)
    const embeddingBreakdown = await this.embeddingEngine.computeSemanticMatch(job, master);
    const semanticScore = embeddingBreakdown.overallSemanticSimilarity;

    // 2. 3-Tier Skill Analysis (25% weight)
    const skillAnalysis = this.skillAnalyzer.analyzeSkills(job, master);
    const skillsScore = skillAnalysis.score;

    // 3. Responsibilities Analysis (20% weight)
    const responsibilityScore = embeddingBreakdown.experiencesSimilarity;

    // 4. Industry / Domain Relevance (10% weight)
    const industryAnalysis = this.industryEngine.evaluateIndustry(job);
    const industryScore = industryAnalysis.score;

    // 5. Role / Title Relevance (10% weight)
    const titleAnalysis = this.titleEngine.evaluateTitle(job.title);
    const titleScore = titleAnalysis.score;

    // -------------------------------------------------------------
    // Weighted Total Score Calculation
    // -------------------------------------------------------------
    const weightedTotal =
      semanticScore * 0.35 +
      skillsScore * 0.25 +
      responsibilityScore * 0.20 +
      industryScore * 0.10 +
      titleScore * 0.10;

    const match_score = Math.min(100, Math.max(0, Math.round(weightedTotal)));

    // -------------------------------------------------------------
    // Category Assignment (75-100: Strong Match, 60-74: Tailor Resume, 50-59: Review Later, <50: Reject)
    // -------------------------------------------------------------
    let match_category: MatchCategory = 'Reject';
    if (match_score >= 75) {
      match_category = 'Strong Match';
    } else if (match_score >= 60) {
      match_category = 'Tailor Resume';
    } else if (match_score >= 50) {
      match_category = 'Review Later';
    } else {
      match_category = 'Reject';
    }

    // -------------------------------------------------------------
    // Critical Rule: 60% is the Resume-Generation Gate
    // If score >= 60, ALWAYS attempt resume generation.
    // Gemini is NOT a second rejection gate.
    // -------------------------------------------------------------
    const meets_tailoring_gate = match_score >= 60;

    // Build Strengths & Gaps
    const strengths: string[] = [];
    strengths.push(`Title synergy: ${titleAnalysis.rationale} (${titleScore}/100)`);
    strengths.push(`Domain relevance: ${industryAnalysis.rationale} (${industryScore}/100)`);
    if (skillAnalysis.evidenced.length > 0) {
      strengths.push(`Verified skills evidenced: ${skillAnalysis.evidenced.slice(0, 5).join(', ')}`);
    }
    if (skillAnalysis.related.length > 0) {
      strengths.push(`Transferable skill equivalents: ${skillAnalysis.related.slice(0, 3).map((r) => `${r.skill} (via ${r.equivalent_evidence})`).join('; ')}`);
    }

    const gaps: string[] = [...skillAnalysis.notEvidenced];

    // Synthesize comprehensive matching explanation
    const matching_explanation = [
      `Overall Match Score: ${match_score}% [${match_category}]`,
      meets_tailoring_gate
        ? `Status: PASSED 60% Tailoring Gate. Immediate resume tailoring authorized (Gemini rejection override disabled).`
        : `Status: Below 60% Gate threshold (${match_score}%). Automated tailoring held for review.`,
      `Component Breakdown:`,
      `• Semantic Similarity (35%): ${semanticScore}/100 (Summary: ${embeddingBreakdown.summarySimilarity}%, Experience: ${embeddingBreakdown.experiencesSimilarity}%)`,
      `• Skills & Technologies (25%): ${skillsScore}/100 (${skillAnalysis.evidenced.length} verified, ${skillAnalysis.related.length} transferable equivalents)`,
      `• Responsibilities Alignment (20%): ${responsibilityScore}/100`,
      `• Industry / Domain (10%): ${industryScore}/100 (${industryAnalysis.matchedIndustries.join(', ')})`,
      `• Role / Title Fit (10%): ${titleScore}/100 (${titleAnalysis.targetRole})`,
      skillAnalysis.notEvidenced.length > 0
        ? `Unverified Skills (${skillAnalysis.notEvidenced.length}): ${skillAnalysis.notEvidenced.slice(0, 4).join('; ')}`
        : 'All core JD skills are directly evidenced or have equivalent coverage in master resume.',
    ].join('\n');

    return {
      match_score,
      match_category,
      semantic_score: semanticScore,
      skills_score: skillsScore,
      responsibility_score: responsibilityScore,
      industry_score: industryScore,
      title_score: titleScore,
      matched_skills: skillAnalysis.evidenced,
      related_skills: skillAnalysis.related,
      not_evidenced_skills: skillAnalysis.notEvidenced,
      matching_explanation,
      meets_tailoring_gate,
      strengths,
      gaps,
      details: {
        titleRelevance: titleAnalysis,
        industryRelevance: industryAnalysis,
        skillEvaluations: skillAnalysis.evaluations,
        embeddingBreakdown,
      },
    };
  }
}
