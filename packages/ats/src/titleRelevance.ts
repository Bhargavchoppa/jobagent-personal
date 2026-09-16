/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TitleRelevanceResult } from './types';

// Core target role relationships and semantic affinity weights against candidate profile
// Candidate has 9 years verified experience across BA, PO, and Technical PM
const ROLE_AFFINITY_MATRIX: Record<string, { baseAffinity: number; rationale: string }> = {
  'business analyst': {
    baseAffinity: 98,
    rationale: 'Core primary discipline with 9 years verified track record across 6 enterprise employers.',
  },
  'senior business analyst': {
    baseAffinity: 100,
    rationale: 'Exact seniority and discipline match for candidate with 9 years total experience.',
  },
  'technical business analyst': {
    baseAffinity: 98,
    rationale: 'Direct alignment with technical requirements gathering, SQL, API specifications, and data modeling.',
  },
  'lead business analyst': {
    baseAffinity: 95,
    rationale: 'Direct fit with senior requirements leadership, UAT governance, and cross-functional teams.',
  },
  'product owner': {
    baseAffinity: 96,
    rationale: 'Direct verified role with backlog grooming, sprint prioritization, and acceptance criteria ownership.',
  },
  'senior product owner': {
    baseAffinity: 96,
    rationale: 'Exact seniority alignment for agile product ownership and customer-facing delivery.',
  },
  'technical product manager': {
    baseAffinity: 92,
    rationale: 'High synergy with software specifications, semiconductor lithography tools, and platform integrations.',
  },
  'senior technical product manager': {
    baseAffinity: 92,
    rationale: 'High synergy with technical architecture and data platform roadmaps.',
  },
  'product manager': {
    baseAffinity: 88,
    rationale: 'Strong cross-functional synergy bridging customer discovery, feature roadmapping, and engineering execution.',
  },
  'senior product manager': {
    baseAffinity: 88,
    rationale: 'Strong product leadership synergy with candidate 9-year cross-industry background.',
  },
  'product analyst': {
    baseAffinity: 92,
    rationale: 'Strong synergy with analytical requirements, Tableau/Power BI metrics, and telemetry analysis.',
  },
  'ai product manager': {
    baseAffinity: 82,
    rationale: 'Emerging technology alignment leveraging data pipeline, LLM/NLP workflows, and quant model analysis.',
  },
  'it product manager': {
    baseAffinity: 90,
    rationale: 'High synergy with enterprise IT systems, middleware platforms, and business systems analysis.',
  },
  'project manager': {
    baseAffinity: 84,
    rationale: 'Strong procedural overlap in sprint cadence, risk mitigation, and cross-functional milestone delivery.',
  },
  'scrum master': {
    baseAffinity: 80,
    rationale: 'Operational overlap with agile ceremonies, sprint velocity, and sprint retrospectives.',
  },
};

export class TitleRelevanceEngine {
  /**
   * Evaluates title relevance considering semantic family relationships rather than exact matching.
   */
  public evaluateTitle(jobTitle: string): TitleRelevanceResult {
    const cleanTitle = (jobTitle || '').toLowerCase().trim();

    // Check for exact and substring matches across the affinity matrix
    let bestMatchKey = '';
    let bestMatchData = { baseAffinity: 40, rationale: 'Generic or non-target title.' };

    for (const [roleKey, data] of Object.entries(ROLE_AFFINITY_MATRIX)) {
      if (cleanTitle === roleKey || cleanTitle.includes(roleKey)) {
        if (data.baseAffinity > bestMatchData.baseAffinity) {
          bestMatchKey = roleKey;
          bestMatchData = data;
        }
      }
    }

    // Token-based semantic discovery if no direct substring match
    if (!bestMatchKey) {
      const isAnalyst = cleanTitle.includes('analyst') || cleanTitle.includes('analysis');
      const isProduct = cleanTitle.includes('product') || cleanTitle.includes('po');
      const isProject = cleanTitle.includes('project') || cleanTitle.includes('program');
      const isTechnical = cleanTitle.includes('technical') || cleanTitle.includes('systems') || cleanTitle.includes('data');

      if (isProduct && isTechnical) {
        bestMatchData = {
          baseAffinity: 88,
          rationale: 'Semantic affinity with Technical Product Management.',
        };
      } else if (isProduct && isAnalyst) {
        bestMatchData = {
          baseAffinity: 90,
          rationale: 'Semantic affinity with Product Analysis / Requirements Engineering.',
        };
      } else if (isAnalyst && isTechnical) {
        bestMatchData = {
          baseAffinity: 92,
          rationale: 'Semantic affinity with Technical Business Systems Analysis.',
        };
      } else if (isProduct) {
        bestMatchData = {
          baseAffinity: 85,
          rationale: 'Semantic affinity with Product Ownership and Delivery.',
        };
      } else if (isAnalyst) {
        bestMatchData = {
          baseAffinity: 88,
          rationale: 'Semantic affinity with Enterprise Business Analysis.',
        };
      } else if (isProject) {
        bestMatchData = {
          baseAffinity: 80,
          rationale: 'Functional overlap with project delivery and agile governance.',
        };
      } else {
        bestMatchData = {
          baseAffinity: 35,
          rationale: `Title "${jobTitle}" has low semantic overlap with candidate's Business Analyst / Product Owner positioning.`,
        };
      }
    }

    // Seniority modifier
    let finalScore = bestMatchData.baseAffinity;
    const hasSeniorPrefix =
      cleanTitle.includes('senior') ||
      cleanTitle.includes('sr') ||
      cleanTitle.includes('lead') ||
      cleanTitle.includes('principal') ||
      cleanTitle.includes('staff');

    if (hasSeniorPrefix && finalScore >= 70) {
      finalScore = Math.min(100, finalScore + 4);
    }

    return {
      score: finalScore,
      targetRole: bestMatchKey || 'Related Technical/Product Role',
      jobTitle,
      rationale: bestMatchData.rationale,
    };
  }
}
