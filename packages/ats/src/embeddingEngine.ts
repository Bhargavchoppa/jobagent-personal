/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { MasterResume, JobPosting } from '../../../src/types';
import { cosineSimilarity, createDeterministicEmbedding } from './cosineSimilarity';
import { SemanticEmbeddingBreakdown } from './types';

// In-memory cache for embeddings to maximize performance and avoid duplicate API calls
const embeddingCache = new Map<string, number[]>();

export class EmbeddingEngine {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  /**
   * Generates embedding vector for a given text.
   * Prioritizes gemini-embedding-2-preview, falling back cleanly to deterministic n-gram vectorizer.
   */
  public async getEmbedding(text: string): Promise<number[]> {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      return new Array(256).fill(0);
    }

    const cacheKey = cleanText.length < 200 ? cleanText : `${cleanText.substring(0, 100)}_${cleanText.length}`;
    if (embeddingCache.has(cacheKey)) {
      return embeddingCache.get(cacheKey)!;
    }

    if (this.aiClient) {
      try {
        const response = await this.aiClient.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: cleanText,
        });

        const respAny = response as any;
        const values = respAny.embedding?.values || respAny.embeddings?.[0]?.values;
        if (values && values.length > 0) {
          embeddingCache.set(cacheKey, values);
          return values;
        }
      } catch (err) {
        // Fallback to deterministic embedding on quota or network error
        console.warn('[EmbeddingEngine] Gemini embedContent failed, using deterministic embedding fallback:', err);
      }
    }

    const deterministic = createDeterministicEmbedding(cleanText);
    embeddingCache.set(cacheKey, deterministic);
    return deterministic;
  }

  /**
   * Generates embeddings for all 7 required segments:
   * 1. Master resume summary
   * 2. Each experience section
   * 3. Skills
   * 4. Job title
   * 5. Job responsibilities
   * 6. Job requirements
   * 7. Full job description
   *
   * Then computes cosine similarity across each segment.
   */
  public async computeSemanticMatch(
    job: JobPosting,
    master: MasterResume
  ): Promise<SemanticEmbeddingBreakdown> {
    // 1. Master resume summary
    const summaryText = `${master.personal_information.header_positioning}. ${master.professional_summary}`;
    const summaryVec = await this.getEmbedding(summaryText);

    // 2. Each experience section
    const expVectors: number[] = [];
    const expTexts = (master.experience || []).map((e) =>
      `${e.title} at ${e.company} (${e.start_date || ''} - ${e.end_date || 'Present'}). Key responsibilities: ${e.responsibilities.join(' ')}. Highlights: ${(e.achievements || []).join(' ')}`
    );

    // Compute experience vector
    let aggregatedExpVec: number[] = [];
    if (expTexts.length > 0) {
      const expVecs = await Promise.all(expTexts.map((t) => this.getEmbedding(t)));
      // Combine vectors with recency weighting
      const dim = expVecs[0]?.length || 256;
      aggregatedExpVec = new Array(dim).fill(0);
      expVecs.forEach((vec, idx) => {
        const recencyWeight = 1.0 - idx * 0.1; // Recent roles have higher weight
        for (let i = 0; i < dim; i++) {
          aggregatedExpVec[i] += (vec[i] || 0) * Math.max(0.4, recencyWeight);
        }
      });
    } else {
      aggregatedExpVec = await this.getEmbedding(summaryText);
    }

    // 3. Skills (Technical + Domain)
    const skillsText = [...(master.skills || []), ...(master.technologies || [])].join(', ');
    const skillsVec = await this.getEmbedding(skillsText);

    // 4. Job title
    const jobTitleVec = await this.getEmbedding(job.title);

    // 5. Job responsibilities
    const jobRespText = (job.responsibilities && job.responsibilities.length > 0)
      ? job.responsibilities.join('\n')
      : job.description;
    const jobRespVec = await this.getEmbedding(jobRespText);

    // 6. Job requirements
    const jobReqText = (job.requirements && job.requirements.length > 0)
      ? job.requirements.join('\n')
      : job.description;
    const jobReqVec = await this.getEmbedding(jobReqText);

    // 7. Full job description
    const fullJobText = `${job.title} at ${job.company}. ${job.description} ${jobRespText} ${jobReqText}`;
    const fullJobVec = await this.getEmbedding(fullJobText);

    // -------------------------------------------------------------
    // Cosine Similarities Across Segments
    // -------------------------------------------------------------
    // Summary vs Full Job Description
    const summarySimilarity = cosineSimilarity(summaryVec, fullJobVec);

    // Experiences vs Job Responsibilities
    const experiencesSimilarity = cosineSimilarity(aggregatedExpVec, jobRespVec);

    // Skills vs Job Requirements
    const skillsSimilarity = cosineSimilarity(skillsVec, jobReqVec);

    // Candidate positioning vs Job Title
    const titleSimilarity = cosineSimilarity(
      await this.getEmbedding(master.personal_information.header_positioning),
      jobTitleVec
    );

    // Normalized semantic similarity (0 - 100)
    // Blend: Summary vs Full (40%), Experience vs Responsibilities (35%), Skills vs Req (25%)
    const rawBlend = summarySimilarity * 0.4 + experiencesSimilarity * 0.35 + skillsSimilarity * 0.25;

    // Rescale cosine similarity (which typically sits in 0.45 - 0.95 for related text) to 0 - 100 percentage
    const calibratedScore = Math.round(Math.min(100, Math.max(0, (rawBlend - 0.2) / 0.75 * 100)));

    return {
      summarySimilarity: Math.round(summarySimilarity * 100),
      experiencesSimilarity: Math.round(experiencesSimilarity * 100),
      skillsSimilarity: Math.round(skillsSimilarity * 100),
      titleSimilarity: Math.round(titleSimilarity * 100),
      overallSemanticSimilarity: calibratedScore,
    };
  }
}
