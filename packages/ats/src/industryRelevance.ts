/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JobPosting } from '../../../src/types';
import { IndustryRelevanceResult, VERIFIED_CANDIDATE_INDUSTRIES, VerifiedIndustry } from './types';

// Domain and industry keyword mappings reflecting candidate's verified employers:
// MIT Resources (Semiconductor Manufacturing), Point72 (Financial Services / Capital Markets),
// CVS Health (Healthcare / Government Eligibility Systems), PhonePe (E-commerce / FinTech),
// TCS (Banking / Financial Technology), Applied Materials (Semiconductor / Technology)
const INDUSTRY_KEYWORD_PATTERNS: Record<VerifiedIndustry, string[]> = {
  'Financial Services': [
    'financial services',
    'capital markets',
    'fintech',
    'hedge fund',
    'investment',
    'wealth management',
    'trading',
    'asset management',
    'market data',
    'bloomberg',
    'factset',
  ],
  Technology: [
    'technology',
    'software',
    'saas',
    'platform',
    'enterprise software',
    'it services',
    'digital solutions',
    'high-tech',
  ],
  Manufacturing: [
    'manufacturing',
    'semiconductor',
    'lithography',
    'wafer',
    'hardware',
    'industrial',
    'fabrication',
    'supply chain manufacturing',
    'advanced manufacturing',
  ],
  'Government/Eligibility systems': [
    'government',
    'eligibility',
    'hhs',
    'medicaid',
    'medicare',
    'public sector',
    'health plan',
    'enrollment',
    'state agency',
    'healthcare payer',
    'social services',
  ],
  'E-commerce': [
    'e-commerce',
    'ecommerce',
    'merchant',
    'checkout',
    'retail',
    'online shopping',
    'digital payments',
    'payment gateway',
    'marketplace',
  ],
  Banking: [
    'banking',
    'retail banking',
    'commercial banking',
    'credit',
    'core banking',
    'financial institutions',
    'wire transfer',
    'payments',
  ],
  'Cloud/technology': [
    'cloud',
    'aws',
    'azure',
    'gcp',
    'cloud infrastructure',
    'distributed systems',
    'cloud services',
    'infrastructure software',
  ],
};

export class IndustryRelevanceEngine {
  /**
   * Evaluates job domain against candidate's 7 verified industries.
   */
  public evaluateIndustry(job: JobPosting): IndustryRelevanceResult {
    const textCorpus = `${job.company} ${job.title} ${job.description} ${job.location}`.toLowerCase();
    const matchedIndustries: VerifiedIndustry[] = [];

    for (const industry of VERIFIED_CANDIDATE_INDUSTRIES) {
      const patterns = INDUSTRY_KEYWORD_PATTERNS[industry];
      const match = patterns.some((p) => textCorpus.includes(p));
      if (match) {
        matchedIndustries.push(industry);
      }
    }

    if (matchedIndustries.length >= 2) {
      return {
        score: 95,
        matchedIndustries,
        rationale: `Strong dual-domain alignment with verified candidate industries: ${matchedIndustries.join(' and ')}.`,
      };
    }

    if (matchedIndustries.length === 1) {
      return {
        score: 88,
        matchedIndustries,
        rationale: `Direct domain alignment with verified candidate background in ${matchedIndustries[0]}.`,
      };
    }

    // Default cross-functional transferable tech/business relevance
    return {
      score: 65,
      matchedIndustries: ['Technology'],
      rationale: 'Transferable enterprise domain; candidate generalist Business Analyst principles apply.',
    };
  }
}
