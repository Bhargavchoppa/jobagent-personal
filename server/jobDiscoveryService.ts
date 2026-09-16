/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  JobPosting,
  JobSearchRun,
  CountryTarget,
  LiveJobSearchState,
} from '../src/types';
import { db } from './db';
import { calculateJobMatch, analyzeAtsKeywords, generateTailoredResume } from './geminiService';
import {
  JobDiscoveryEngine,
  TARGET_ROLE_PROFILES,
  detectAtsPlatform,
  validatePostingDate,
  JobDiscoveryProgress,
} from '../packages/jobs/src';
import { runJobDiscoveryTests } from '../packages/jobs/src/tests/discovery.test';

export const TARGET_ROLES = [...TARGET_ROLE_PROFILES];

let activeSearchState: LiveJobSearchState = {
  run_id: '',
  status: 'idle',
  progress_percent: 0,
  current_step: 'Idle',
  candidates_found: 0,
  results_found: 0,
  unique_urls: 0,
  likely_job_pages: 0,
  jobs_extracted: 0,
  jobs_saved: 0,
  processed_count: 0,
  total_to_process: 0,
  logs: [],
};

export function getActiveSearchState(): LiveJobSearchState {
  return activeSearchState;
}

export { detectAtsPlatform, validatePostingDate };

/**
 * Runs Phase 3 Job Discovery Unit & Integration Test Suite
 */
export function runPhase3Diagnostics() {
  return runJobDiscoveryTests();
}

/**
 * Main discovery pipeline orchestration
 */
export async function executeJobSearch(params: {
  country: CountryTarget;
  roles?: string[];
  additionalKeywords?: string[];
  locationKeywords?: string;
}): Promise<JobSearchRun> {
  const runId = `run-${Date.now()}`;
  const startTime = new Date().toISOString();
  const rolesToSearch = params.roles && params.roles.length > 0 ? params.roles : [...TARGET_ROLES];
  const additionalKeywords = params.additionalKeywords || [];

  const runRecord: JobSearchRun = {
    id: runId,
    timestamp: startTime,
    start_time: startTime,
    target_roles: rolesToSearch,
    queries: rolesToSearch.map((r) => additionalKeywords.length > 0 ? `${r} ${additionalKeywords.join(' ')}` : r),
    country: params.country,
    candidates_found: 0,
    results_found: 0,
    unique_urls_count: 0,
    likely_job_pages_count: 0,
    extracted_count: 0,
    jobs_extracted: 0,
    deduped_count: 0,
    jobs_saved: 0,
    high_match_count: 0,
    tailored_count: 0,
    errors: [],
    status: 'running',
    current_step: 'Search started',
    logs: [`[${startTime}] Search started for [${params.country}] on ${rolesToSearch.length} target profiles.`],
  };

  db.addSearchRun(runRecord);

  activeSearchState = {
    run_id: runId,
    status: 'searching',
    progress_percent: 5,
    current_step: 'Search started',
    candidates_found: 0,
    results_found: 0,
    unique_urls: 0,
    likely_job_pages: 0,
    jobs_extracted: 0,
    jobs_saved: 0,
    processed_count: 0,
    total_to_process: 0,
    logs: [...runRecord.logs],
  };

  const addLog = (msg: string) => {
    runRecord.logs.push(msg);
    activeSearchState.logs.push(msg);
    db.log('info', 'DISCOVERY', msg);
  };

  try {
    const existingJobs = db.getJobs();
    const discoveryEngine = new JobDiscoveryEngine();

    // Execute 11-stage search pipeline with live progress events
    const discoveryResult = await discoveryEngine.runDiscoveryPipeline(
      {
        country: params.country as any,
        targetRoles: rolesToSearch,
        additionalKeywords: params.additionalKeywords,
        concurrencyLimit: 5,
        onProgress: (p: JobDiscoveryProgress) => {
          activeSearchState.current_step = p.step;
          activeSearchState.progress_percent = Math.min(50, p.progress_percent);
          activeSearchState.results_found = p.results_found;
          activeSearchState.unique_urls = p.unique_urls;
          activeSearchState.likely_job_pages = p.likely_job_pages;
          activeSearchState.jobs_extracted = p.jobs_extracted;
          activeSearchState.jobs_saved = p.jobs_saved;
          runRecord.current_step = p.step;
        },
        onLog: (msg) => {
          addLog(msg);
        },
      },
      existingJobs
    );

    const extractedJobs = discoveryResult.extractedJobs;
    runRecord.results_found = discoveryResult.runRecord.results_found;
    runRecord.unique_urls_count = discoveryResult.runRecord.unique_urls_count;
    runRecord.likely_job_pages_count = discoveryResult.runRecord.likely_job_pages_count;
    runRecord.extracted_count = extractedJobs.length;
    runRecord.jobs_extracted = extractedJobs.length;
    runRecord.candidates_found = extractedJobs.length;

    activeSearchState.candidates_found = extractedJobs.length;
    activeSearchState.total_to_process = extractedJobs.length;

    // Convert to JobPosting format and insert to Database
    const jobPostingsToInsert: JobPosting[] = extractedJobs.map((ext, idx) => ({
      job_id: `job-${params.country === 'India' ? 'in' : 'us'}-${Date.now().toString().slice(-4)}-${idx + 1}`,
      company: ext.company,
      title: ext.title,
      location: ext.location,
      country: ext.country,
      remote: ext.remote as any,
      work_mode: ext.work_mode,
      employment_type: ext.employment_type,
      experience_required: ext.experience_required,
      salary: ext.salary,
      posted_date: ext.posted_date,
      posted_date_verified: ext.posted_date_verified,
      posted_date_source: ext.posted_date_source,
      age_days: ext.age_days,
      age_status: ext.age_status,
      application_url: ext.application_url,
      source_url: ext.source_url,
      ats_platform: ext.ats_platform,
      description: ext.description,
      responsibilities: ext.responsibilities,
      requirements: ext.requirements,
      skills: ext.skills,
      benefits: ext.benefits,
      extraction_notes: ext.extraction_notes,
      application_status: 'Not Applied',
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    }));

    activeSearchState.current_step = 'Deduplicating postings by canonical URL and company/title...';
    const dedupeResult = db.deduplicateAndInsertJobs(jobPostingsToInsert);
    runRecord.deduped_count = dedupeResult.inserted + dedupeResult.updated;
    runRecord.jobs_saved = dedupeResult.inserted + dedupeResult.updated;
    activeSearchState.jobs_saved = runRecord.jobs_saved;

    addLog(`Database persistence: ${dedupeResult.inserted} new jobs saved, ${dedupeResult.updated} existing updated.`);

    // Stage: 5-Component Semantic Matching & Tailoring Pipeline
    const master = db.getMasterResume();
    let highMatchCount = 0;
    let tailoredCount = 0;

    activeSearchState.status = 'matching';
    activeSearchState.current_step = 'Evaluating 5-component semantic match scores against master resume...';

    for (let i = 0; i < jobPostingsToInsert.length; i++) {
      const job = jobPostingsToInsert[i];
      activeSearchState.processed_count = i + 1;
      activeSearchState.progress_percent = 50 + Math.round(((i + 1) / jobPostingsToInsert.length) * 45);

      addLog(`Evaluating [${i + 1}/${jobPostingsToInsert.length}]: "${job.title}" at ${job.company}...`);
      const match = await calculateJobMatch(job, master);

      if (match.total_score >= 60) {
        highMatchCount++;
        addLog(`Match score ${match.total_score}% passes the 60% Gate! Generating tailored resume...`);

        activeSearchState.status = 'tailoring';
        activeSearchState.current_step = `Generating truthful tailored resume for "${job.title}"...`;

        const ats = await analyzeAtsKeywords(job, master);
        const tailored = await generateTailoredResume(job, master, ats);
        tailoredCount++;
        addLog(`Generated tailored resume with ${tailored.ats_score}% truthful ATS coverage (Zero Fabrication Certified).`);
      } else {
        addLog(`Match score ${match.total_score}% [${match.category}] below 60% gate; tailoring skipped.`);
      }
    }

    // Complete run
    const endTime = new Date().toISOString();
    runRecord.end_time = endTime;
    runRecord.high_match_count = highMatchCount;
    runRecord.tailored_count = tailoredCount;
    runRecord.status = 'completed';
    runRecord.current_step = 'Completed';
    addLog(`Run completed. Discovered: ${jobPostingsToInsert.length}, Saved: ${runRecord.jobs_saved}, >=60% Gate: ${highMatchCount}, Tailored: ${tailoredCount}.`);

    db.updateSearchRun(runId, runRecord);

    activeSearchState = {
      run_id: runId,
      status: 'completed',
      progress_percent: 100,
      current_step: 'Completed',
      candidates_found: jobPostingsToInsert.length,
      results_found: runRecord.results_found,
      unique_urls: runRecord.unique_urls_count,
      likely_job_pages: runRecord.likely_job_pages_count,
      jobs_extracted: jobPostingsToInsert.length,
      jobs_saved: runRecord.jobs_saved,
      processed_count: jobPostingsToInsert.length,
      total_to_process: jobPostingsToInsert.length,
      logs: [...runRecord.logs],
    };

    return runRecord;
  } catch (err: any) {
    runRecord.status = 'failed';
    runRecord.end_time = new Date().toISOString();
    runRecord.current_step = `Error: ${err.message || String(err)}`;
    runRecord.errors = [err.message || String(err)];
    addLog(`Discovery run failed with error: ${err.message || String(err)}`);
    db.updateSearchRun(runId, runRecord);

    activeSearchState = {
      run_id: runId,
      status: 'error',
      progress_percent: 100,
      current_step: `Failed: ${err.message || String(err)}`,
      candidates_found: 0,
      results_found: 0,
      unique_urls: 0,
      likely_job_pages: 0,
      jobs_extracted: 0,
      jobs_saved: 0,
      processed_count: 0,
      total_to_process: 0,
      logs: [...runRecord.logs],
    };

    throw err;
  }
}
