/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MasterResume, JobPosting } from '../../../src/types';
import { SkillClassification, SkillEvaluation } from './types';

// Equivalency & transferable skill taxonomy for Business Analyst & Product roles
const SKILL_EQUIVALENCY_MAP: Record<string, { resumeEquivalents: string[]; conceptualTopic: string }> = {
  'stakeholder management': {
    resumeEquivalents: [
      'customer advocacy',
      'cross-functional collaboration',
      'executive prioritization',
      'client engagement',
      'business relationship management',
      'client facing',
    ],
    conceptualTopic: 'Stakeholder & Cross-Functional Alignment',
  },
  'stakeholder engagement': {
    resumeEquivalents: [
      'customer advocacy',
      'cross-functional collaboration',
      'executive prioritization',
      'client engagement',
    ],
    conceptualTopic: 'Stakeholder Management',
  },
  'product roadmapping': {
    resumeEquivalents: [
      'product roadmap',
      'strategic planning',
      'feature prioritization',
      'roadmap ownership',
      'milestone planning',
    ],
    conceptualTopic: 'Product Strategy & Vision',
  },
  'data analytics': {
    resumeEquivalents: ['sql', 'tableau', 'power bi', 'business intelligence', 'data modeling', 'kpi dashboards'],
    conceptualTopic: 'BI & Analytical Querying',
  },
  'business analysis': {
    resumeEquivalents: ['brd', 'user stories', 'functional specifications', 'process flow', 'requirements gathering'],
    conceptualTopic: 'Requirements Engineering',
  },
  'user stories': {
    resumeEquivalents: ['acceptance criteria', 'jira', 'confluence', 'epics', 'product backlog grooming'],
    conceptualTopic: 'Agile Documentation',
  },
  'api design': {
    resumeEquivalents: ['rest api', 'json', 'postman', 'swagger', 'api specifications', 'web services'],
    conceptualTopic: 'API & Technical Architecture',
  },
  'agile coaching': {
    resumeEquivalents: ['scrum master', 'sprint planning', 'scrum ceremonies', 'agile delivery', 'backlog grooming'],
    conceptualTopic: 'Agile / Scrum Practices',
  },
  'financial modeling': {
    resumeEquivalents: ['pricing strategy', 'roi analysis', 'market data analysis', 'capital markets', 'cost modeling'],
    conceptualTopic: 'Financial & Quantitative Modeling',
  },
  'cloud architecture': {
    resumeEquivalents: ['aws', 'azure', 'gcp', 'cloud solutions', 'saas architecture'],
    conceptualTopic: 'Cloud Platforms',
  },
  'quality assurance': {
    resumeEquivalents: ['uat', 'user acceptance testing', 'test scenarios', 'regression testing', 'defect triage'],
    conceptualTopic: 'Testing & Verification',
  },
  'vendor management': {
    resumeEquivalents: ['data vendor licensing', 'third-party integrations', 'contract obligations', 'partner evaluation'],
    conceptualTopic: 'Partner & Vendor Oversight',
  },
};

export class SkillAnalyzer {
  /**
   * Analyzes all skills in a job posting against the verified Master Resume.
   * Classifies each as EVIDENCED, RELATED/EQUIVALENT, or NOT_EVIDENCED.
   */
  public analyzeSkills(job: JobPosting, master: MasterResume): {
    evaluations: SkillEvaluation[];
    evidenced: string[];
    related: Array<{ skill: string; equivalent_evidence: string }>;
    notEvidenced: string[];
    score: number;
  } {
    // Extract candidate corpus
    const candidateSkillsLower = (master.skills || []).map((s) => s.toLowerCase().trim());
    const candidateTechLower = (master.technologies || []).map((t) => t.toLowerCase().trim());
    const experienceCorpus = (master.experience || [])
      .map((e) => `${e.title} ${e.company} ${e.responsibilities.join(' ')} ${(e.achievements || []).join(' ')}`)
      .join(' ')
      .toLowerCase();

    // Collect job skills and key technical requirements
    const jdSkillsToAnalyze = new Set<string>();
    (job.skills || []).forEach((s) => jdSkillsToAnalyze.add(s.trim()));

    // Also parse top keywords from requirements if skills list is small
    if (jdSkillsToAnalyze.size < 5 && job.requirements) {
      job.requirements.forEach((req) => {
        const tokens = req.split(/[,;•/]/).map((t) => t.trim());
        tokens.forEach((t) => {
          if (t.length > 2 && t.length < 35 && !t.toLowerCase().startsWith('years')) {
            jdSkillsToAnalyze.add(t);
          }
        });
      });
    }

    const evaluations: SkillEvaluation[] = [];
    const evidenced: string[] = [];
    const related: Array<{ skill: string; equivalent_evidence: string }> = [];
    const notEvidenced: string[] = [];

    for (const rawSkill of Array.from(jdSkillsToAnalyze)) {
      const skillClean = rawSkill.trim();
      const skillLower = skillClean.toLowerCase();

      // 1. Direct Evidence Check (EVIDENCED)
      const isDirectSkill = candidateSkillsLower.some((s) => s === skillLower || s.includes(skillLower) || skillLower.includes(s));
      const isDirectTech = candidateTechLower.some((t) => t === skillLower || t.includes(skillLower) || skillLower.includes(t));
      const isInExperience = experienceCorpus.includes(skillLower);

      if (isDirectSkill || isDirectTech || isInExperience) {
        const source = isDirectTech ? 'Verified Technologies' : isDirectSkill ? 'Verified Core Skills' : 'Experience Corpus';
        evaluations.push({
          skill: skillClean,
          classification: 'EVIDENCED',
          evidenceOrRationale: `Directly verified in ${source}`,
          formattedOutput: `${skillClean} — Evidenced in master resume (${source})`,
        });
        evidenced.push(skillClean);
        continue;
      }

      // 2. Related / Equivalent Check (RELATED/EQUIVALENT)
      let matchedEquivalentEvidence: string | null = null;

      // Check dictionary of common synonyms and equivalents
      for (const [key, mapping] of Object.entries(SKILL_EQUIVALENCY_MAP)) {
        if (skillLower.includes(key) || key.includes(skillLower)) {
          const found = mapping.resumeEquivalents.filter(
            (eq) =>
              candidateSkillsLower.includes(eq) ||
              candidateTechLower.includes(eq) ||
              experienceCorpus.includes(eq)
          );
          if (found.length > 0) {
            matchedEquivalentEvidence = found.join(', ');
            break;
          }
        }
      }

      // Check fuzzy token overlaps in experience
      if (!matchedEquivalentEvidence) {
        const tokens = skillLower.split(/\s+/).filter((t) => t.length > 3);
        const matchedTokens = tokens.filter(
          (t) =>
            candidateSkillsLower.some((s) => s.includes(t)) ||
            candidateTechLower.some((tech) => tech.includes(t)) ||
            experienceCorpus.includes(t)
        );
        if (matchedTokens.length > 0 && matchedTokens.length >= Math.ceil(tokens.length * 0.6)) {
          matchedEquivalentEvidence = `Conceptual alignment with verified ${matchedTokens.join(', ')}`;
        }
      }

      if (matchedEquivalentEvidence) {
        evaluations.push({
          skill: skillClean,
          classification: 'RELATED/EQUIVALENT',
          evidenceOrRationale: `Transferable equivalent: evidenced by ${matchedEquivalentEvidence}`,
          formattedOutput: `${skillClean} — Related/Equivalent (evidenced via: ${matchedEquivalentEvidence})`,
        });
        related.push({
          skill: skillClean,
          equivalent_evidence: matchedEquivalentEvidence,
        });
        continue;
      }

      // 3. Not Evidenced Check (NOT_EVIDENCED)
      // STRICT RULE: Do NOT write "Candidate does not know X".
      // Write: "X — not evidenced in master resume."
      const formatted = `${skillClean} — not evidenced in master resume.`;
      evaluations.push({
        skill: skillClean,
        classification: 'NOT_EVIDENCED',
        evidenceOrRationale: 'No direct or equivalent mention identified in master resume',
        formattedOutput: formatted,
      });
      notEvidenced.push(formatted);
    }

    // Calculate Skills Score (0 - 100)
    // Evidenced: 1.0, Related/Equivalent: 0.6, Not Evidenced: 0.0
    const totalCount = evaluations.length || 1;
    const weightedSum = evidenced.length * 1.0 + related.length * 0.65;
    const rawScore = (weightedSum / totalCount) * 100;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    return {
      evaluations,
      evidenced,
      related,
      notEvidenced,
      score: finalScore,
    };
  }
}
