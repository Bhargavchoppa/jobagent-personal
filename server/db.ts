/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import {
  MasterResume,
  ResumeVersion,
  ParsedResumeReview,
  JobPosting,
  MatchBreakdown,
  AtsAnalysis,
  TailoredResume,
  ApplicationRecord,
  ApplicationEvent,
  JobSearchRun,
  SystemLog,
  DashboardStats,
  ResumeGenerationRun,
  TruthValidationReport,
  SystemAiSettings,
} from '../src/types';
import { VERIFIED_MASTER_RESUME } from './masterResumeSeed';

export interface DatabaseStore {
  users: Array<{ id: string; name: string; email: string; created_at: string }>;
  master_resumes: MasterResume[];
  resume_versions: ResumeVersion[];
  parsed_reviews: Record<string, ParsedResumeReview>;
  jobs: JobPosting[];
  job_sources: Array<{ id: string; name: string; type: string; base_url: string; active: boolean }>;
  job_search_runs: JobSearchRun[];
  job_matches: Record<string, MatchBreakdown>;
  ats_analyses: Record<string, AtsAnalysis>;
  tailored_resumes: TailoredResume[];
  applications: ApplicationRecord[];
  application_events: ApplicationEvent[];
  search_queries: Array<{ id: string; query: string; country: string; timestamp: string }>;
  system_logs: SystemLog[];
  resume_generation_runs: ResumeGenerationRun[];
  truth_validation_reports: Record<string, TruthValidationReport>;
  ai_settings?: SystemAiSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'jobagent_store.json');

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Clean Initial Seed Jobs (Clean slate - populated purely via live discovery feeds)
const INITIAL_JOBS: JobPosting[] = [];

class DatabaseService {
  private store: DatabaseStore;

  constructor() {
    this.store = this.loadStore();
  }

  private loadStore(): DatabaseStore {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.master_resumes && parsed.jobs) {
          parsed.resume_versions = parsed.resume_versions || [];
          parsed.parsed_reviews = parsed.parsed_reviews || {};
          if (parsed.resume_versions.length === 0 && parsed.master_resumes.length > 0) {
            parsed.resume_versions.push({
              id: 'ver-1',
              version: 1,
              timestamp: parsed.master_resumes[0].last_updated || new Date().toISOString(),
              is_active: true,
              source: 'seed_specification',
              note: 'Initial verified master resume',
              snapshot: parsed.master_resumes[0],
              inconsistency_count: parsed.master_resumes[0].inconsistency_flags?.length || 1,
            });
          }
          if (!parsed.resume_generation_runs) {
            parsed.resume_generation_runs = [];
          }
          if (!parsed.truth_validation_reports) {
            parsed.truth_validation_reports = {};
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('[DB] Failed to load data file, initializing fresh store:', e);
    }

    const initialStore: DatabaseStore = {
      users: [
        {
          id: 'user-bhargav-001',
          name: 'Bhargav Aravind Sai Ram Choppa',
          email: 'bhargavchoppa23@gmail.com',
          created_at: new Date().toISOString(),
        },
      ],
      master_resumes: [VERIFIED_MASTER_RESUME],
      resume_versions: [
        {
          id: 'ver-1',
          version: 1,
          timestamp: new Date().toISOString(),
          is_active: true,
          source: 'seed_specification',
          note: 'Initial verified master resume seeded with verified professional history and PMP header discrepancy flag.',
          snapshot: VERIFIED_MASTER_RESUME,
          inconsistency_count: VERIFIED_MASTER_RESUME.inconsistency_flags?.length || 1,
        },
      ],
      parsed_reviews: {},
      jobs: INITIAL_JOBS,
      job_sources: [
        { id: 'src-gh', name: 'Greenhouse ATS', type: 'ats', base_url: 'https://boards.greenhouse.io', active: true },
        { id: 'src-lever', name: 'Lever ATS', type: 'ats', base_url: 'https://jobs.lever.co', active: true },
        { id: 'src-workday', name: 'Workday ATS', type: 'ats', base_url: 'https://myworkdayjobs.com', active: true },
        { id: 'src-ashby', name: 'Ashby ATS', type: 'ats', base_url: 'https://jobs.ashbyhq.com', active: true },
        { id: 'src-builtin', name: 'BuiltIn Tech Jobs', type: 'portal', base_url: 'https://builtin.com', active: true },
        { id: 'src-linkedin', name: 'LinkedIn Jobs Public', type: 'portal', base_url: 'https://linkedin.com/jobs', active: true },
        { id: 'src-google', name: 'Google Search Job Grounding', type: 'search_grounding', base_url: 'https://google.com', active: true },
      ],
      job_search_runs: [],
      job_matches: {},
      ats_analyses: {},
      tailored_resumes: [],
      applications: [],
      application_events: [],
      search_queries: [],
      system_logs: [
        {
          id: 'log-001',
          timestamp: new Date().toISOString(),
          level: 'info',
          module: 'DATABASE',
          message: 'Initialized normalized database store with 16 relational tables and verified seed master resume.',
        },
        {
          id: 'log-002',
          timestamp: new Date().toISOString(),
          level: 'warn',
          module: 'ATS_TAILOR',
          message: 'Auditor Flagged: Header mentions PMP, but certification section does not independently list PMP. PMP will NOT be injected into tailored certifications.',
        },
      ],
      resume_generation_runs: [],
      truth_validation_reports: {},
    };

    this.saveStore(initialStore);
    return initialStore;
  }

  private saveStore(data: DatabaseStore): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed to save store:', e);
    }
  }

  // Master Resume Methods
  public getMasterResume(version?: number): MasterResume {
    if (version !== undefined) {
      const verObj = (this.store.resume_versions || []).find((v) => v.version === version);
      if (verObj) return verObj.snapshot;
    }
    // Return active version
    const activeVer = (this.store.resume_versions || []).find((v) => v.is_active);
    if (activeVer) return activeVer.snapshot;
    return this.store.master_resumes[0] || VERIFIED_MASTER_RESUME;
  }

  public getResumeVersions(): ResumeVersion[] {
    return (this.store.resume_versions || []).slice().sort((a, b) => b.version - a.version);
  }

  public activateVersion(versionNum: number): MasterResume {
    const targetVer = (this.store.resume_versions || []).find((v) => v.version === versionNum);
    if (!targetVer) {
      throw new Error(`Resume version ${versionNum} not found`);
    }

    // Mark target as active and all others as inactive
    this.store.resume_versions.forEach((v) => {
      v.is_active = v.version === versionNum;
      if (v.snapshot) {
        v.snapshot.is_active = v.version === versionNum;
      }
    });

    const activatedResume: MasterResume = JSON.parse(JSON.stringify(targetVer.snapshot));
    activatedResume.is_active = true;
    this.store.master_resumes = [activatedResume];

    this.log(
      'info',
      'DATABASE',
      `Master Resume Version v${versionNum} marked as ACTIVE source of truth.`
    );
    this.saveStore(this.store);
    return activatedResume;
  }

  public saveMasterResume(
    updated: MasterResume,
    note?: string,
    source: 'seed_specification' | 'user_upload' | 'manual_edit' = 'manual_edit',
    makeActive: boolean = true
  ): MasterResume {
    const existingVersions = this.store.resume_versions || [];
    const maxVer = existingVersions.reduce((max, v) => Math.max(max, v.version || 0), 0);
    const newVersionNum = maxVer + 1;

    updated.version = newVersionNum;
    updated.last_updated = new Date().toISOString();
    updated.is_immutable = true;
    updated.is_active = makeActive;
    updated.source_of_truth = updated.source_of_truth || {
      is_verified: true,
      source: source,
      last_verified_at: updated.last_updated,
    };

    if (makeActive) {
      existingVersions.forEach((v) => {
        v.is_active = false;
        if (v.snapshot) {
          v.snapshot.is_active = false;
        }
      });
      this.store.master_resumes = [updated];
    }

    const versionEntry: ResumeVersion = {
      id: `ver-${Date.now()}-${newVersionNum}`,
      version: newVersionNum,
      timestamp: updated.last_updated,
      is_active: makeActive,
      source: source,
      note: note || `Master resume version v${newVersionNum}`,
      snapshot: JSON.parse(JSON.stringify(updated)),
      inconsistency_count: updated.inconsistency_flags?.length || 0,
    };

    this.store.resume_versions.unshift(versionEntry);
    this.log(
      'info',
      'DATABASE',
      `Saved verified master resume v${newVersionNum} (Active: ${makeActive}). Discrepancies detected: ${versionEntry.inconsistency_count}`
    );
    this.saveStore(this.store);
    return updated;
  }

  public updateMasterResume(updated: MasterResume, note?: string): MasterResume {
    return this.saveMasterResume(updated, note, 'manual_edit', true);
  }

  // Parsed Reviews
  public saveParsedReview(review: ParsedResumeReview): void {
    this.store.parsed_reviews = this.store.parsed_reviews || {};
    this.store.parsed_reviews[review.id] = review;
    this.saveStore(this.store);
  }

  public getParsedReview(id: string): ParsedResumeReview | undefined {
    return (this.store.parsed_reviews || {})[id];
  }

  public getAllParsedReviews(): ParsedResumeReview[] {
    return Object.values(this.store.parsed_reviews || {}).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Jobs
  public getJobs(filter?: { country?: string; minScore?: number; status?: string }): JobPosting[] {
    let result = [...this.store.jobs];
    if (filter?.country && filter.country !== 'All') {
      result = result.filter((j) => j.country.toLowerCase() === filter.country!.toLowerCase());
    }
    if (filter?.minScore !== undefined) {
      result = result.filter((j) => (j.match_score || 0) >= filter.minScore!);
    }
    if (filter?.status && filter.status !== 'All') {
      result = result.filter((j) => j.application_status === filter.status);
    }
    return result;
  }

  public getJobById(id: string): JobPosting | undefined {
    return this.store.jobs.find((j) => j.job_id === id);
  }

  public addOrUpdateJob(job: JobPosting): JobPosting {
    const idx = this.store.jobs.findIndex((j) => j.job_id === job.job_id);
    if (idx >= 0) {
      this.store.jobs[idx] = { ...this.store.jobs[idx], ...job, last_seen: new Date().toISOString() };
    } else {
      this.store.jobs.unshift({
        ...job,
        first_seen: job.first_seen || new Date().toISOString(),
        last_seen: new Date().toISOString(),
      });
    }
    this.saveStore(this.store);
    return job;
  }

  public deduplicateAndInsertJobs(candidates: JobPosting[]): { inserted: number; updated: number; skipped: number } {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const cand of candidates) {
      // Deduplication rules:
      // 1. Same application_url or source_url
      // 2. Same normalized company + title + country
      const existingIdx = this.store.jobs.findIndex((existing) => {
        if (cand.application_url && existing.application_url === cand.application_url) return true;
        if (cand.source_url && existing.source_url === cand.source_url) return true;
        const normCand = `${cand.company.trim().toLowerCase()}|${cand.title.trim().toLowerCase()}|${cand.country.toLowerCase()}`;
        const normExist = `${existing.company.trim().toLowerCase()}|${existing.title.trim().toLowerCase()}|${existing.country.toLowerCase()}`;
        return normCand === normExist;
      });

      if (existingIdx >= 0) {
        // Update existing record if newer information or update last seen
        this.store.jobs[existingIdx].last_seen = new Date().toISOString();
        if (!this.store.jobs[existingIdx].description && cand.description) {
          this.store.jobs[existingIdx].description = cand.description;
        }
        updated++;
      } else {
        this.store.jobs.unshift(cand);
        inserted++;
      }
    }

    this.saveStore(this.store);
    this.log('info', 'DEDUPE', `Deduplication complete. Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
    return { inserted, updated, skipped };
  }

  // Matches
  public getMatch(jobId: string): MatchBreakdown | undefined {
    return this.store.job_matches[jobId];
  }

  public saveMatch(jobId: string, match: MatchBreakdown): void {
    this.store.job_matches[jobId] = match;
    const job = this.store.jobs.find((j) => j.job_id === jobId);
    if (job) {
      job.match_score = match.total_score;
      job.match_category = match.category;
      job.semantic_score = match.semantic_score ?? match.semantic_similarity;
      job.skills_score = match.skills_score ?? match.skills_technologies;
      job.responsibility_score = match.responsibility_score ?? match.responsibilities;
      job.industry_score = match.industry_score ?? match.industry_domain;
      job.title_score = match.title_score ?? match.role_title;
      job.matched_skills = match.matched_skills;
      job.related_skills = match.related_skills;
      job.not_evidenced_skills = match.not_evidenced_skills;
      job.matching_explanation = match.matching_explanation ?? match.justification;
    }
    this.saveStore(this.store);
  }

  // ATS Analyses
  public getAtsAnalysis(jobId: string): AtsAnalysis | undefined {
    return this.store.ats_analyses[jobId];
  }

  public saveAtsAnalysis(analysis: AtsAnalysis): void {
    this.store.ats_analyses[analysis.job_id] = analysis;
    this.saveStore(this.store);
  }

  // Tailored Resumes
  public getTailoredResumes(): TailoredResume[] {
    return this.store.tailored_resumes;
  }

  public getTailoredResumeByJobId(jobId: string): TailoredResume | undefined {
    return this.store.tailored_resumes.find((r) => r.job_id === jobId);
  }

  public saveTailoredResume(resume: TailoredResume): void {
    const idx = this.store.tailored_resumes.findIndex((r) => r.job_id === resume.job_id);
    if (idx >= 0) {
      this.store.tailored_resumes[idx] = resume;
    } else {
      this.store.tailored_resumes.unshift(resume);
    }

    // Update job status to 'Tailored' if currently 'Not Applied' or 'Saved'
    const job = this.store.jobs.find((j) => j.job_id === resume.job_id);
    if (job && (job.application_status === 'Not Applied' || job.application_status === 'Saved')) {
      job.application_status = 'Tailored';
    }

    this.saveStore(this.store);
  }

  // Resume Generation Runs (Phase 5 History & Tracking)
  public getGenerationRuns(): ResumeGenerationRun[] {
    return this.store.resume_generation_runs || [];
  }

  public addGenerationRun(run: ResumeGenerationRun): void {
    if (!this.store.resume_generation_runs) {
      this.store.resume_generation_runs = [];
    }
    const idx = this.store.resume_generation_runs.findIndex((r) => r.id === run.id || r.job_id === run.job_id);
    if (idx >= 0) {
      this.store.resume_generation_runs[idx] = run;
    } else {
      this.store.resume_generation_runs.unshift(run);
    }
    this.saveStore(this.store);
  }

  public getGenerationRunByJobId(jobId: string): ResumeGenerationRun | undefined {
    return (this.store.resume_generation_runs || []).find((r) => r.job_id === jobId);
  }

  // Phase 6 Truth Validation Reports
  public saveTruthValidationReport(report: TruthValidationReport): void {
    if (!this.store.truth_validation_reports) {
      this.store.truth_validation_reports = {};
    }
    this.store.truth_validation_reports[report.job_id] = report;
    this.saveStore(this.store);
  }

  public getTruthValidationReport(jobId: string): TruthValidationReport | undefined {
    return (this.store.truth_validation_reports || {})[jobId];
  }

  public getAllTruthValidationReports(): TruthValidationReport[] {
    return Object.values(this.store.truth_validation_reports || {});
  }

  // Applications
  public getApplications(): ApplicationRecord[] {
    return this.store.applications;
  }

  public updateApplicationStatus(jobId: string, status: ApplicationRecord['status'], notes?: string): ApplicationRecord {
    let app = this.store.applications.find((a) => a.job_id === jobId);
    const job = this.store.jobs.find((j) => j.job_id === jobId);

    if (!app && job) {
      app = {
        id: `app-${Date.now()}`,
        job_id: jobId,
        company: job.company,
        title: job.title,
        country: job.country,
        status: status,
        date_applied: status === 'Applied' ? new Date().toISOString().split('T')[0] : undefined,
        notes: notes || '',
        match_score: job.match_score || 0,
        updated_at: new Date().toISOString(),
      };
      this.store.applications.unshift(app);
    } else if (app) {
      app.status = status;
      if (status === 'Applied' && !app.date_applied) {
        app.date_applied = new Date().toISOString().split('T')[0];
      }
      if (notes !== undefined) {
        app.notes = notes;
      }
      app.updated_at = new Date().toISOString();
    }

    if (job) {
      job.application_status = status;
    }

    // Record timeline event
    this.store.application_events.unshift({
      id: `evt-${Date.now()}`,
      application_id: app ? app.id : jobId,
      timestamp: new Date().toISOString(),
      event_type: 'status_change',
      description: `Application status transitioned to "${status}". ${notes ? `Note: ${notes}` : ''}`,
    });

    this.saveStore(this.store);
    return app!;
  }

  // Search Runs
  public getSearchRuns(): JobSearchRun[] {
    return this.store.job_search_runs;
  }

  public addSearchRun(run: JobSearchRun): void {
    this.store.job_search_runs.unshift(run);
    this.saveStore(this.store);
  }

  public updateSearchRun(id: string, updates: Partial<JobSearchRun>): void {
    const run = this.store.job_search_runs.find((r) => r.id === id);
    if (run) {
      Object.assign(run, updates);
      this.saveStore(this.store);
    }
  }

  // System Logs
  public log(level: SystemLog['level'], module: SystemLog['module'], message: string, metadata?: Record<string, unknown>): void {
    const entry: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      metadata,
    };
    this.store.system_logs.unshift(entry);
    if (this.store.system_logs.length > 500) {
      this.store.system_logs = this.store.system_logs.slice(0, 500);
    }
    this.saveStore(this.store);
    console.log(`[${entry.module}] [${entry.level.toUpperCase()}] ${message}`);
  }

  public getLogs(): SystemLog[] {
    return this.store.system_logs;
  }

  // AI Settings
  public getAiSettings(): SystemAiSettings {
    if (!this.store.ai_settings) {
      this.store.ai_settings = {
        provider: 'ollama',
        ollamaUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
        ollamaModel: process.env.OLLAMA_MODEL || 'qwen3.8:latest',
        geminiModel: 'gemini-3.8-flash',
        temperature: 0.2,
        maxTokens: 4096,
      };
      this.saveStore(this.store);
    }
    return this.store.ai_settings;
  }

  public saveAiSettings(settings: Partial<SystemAiSettings>): SystemAiSettings {
    const current = this.getAiSettings();
    this.store.ai_settings = {
      ...current,
      ...settings,
    };
    this.saveStore(this.store);
    this.log(
      'info',
      'SETTINGS',
      `Updated AI settings: Provider=${this.store.ai_settings.provider}, Model=${
        this.store.ai_settings.provider === 'ollama'
          ? this.store.ai_settings.ollamaModel
          : this.store.ai_settings.geminiModel
      }`
    );
    return this.store.ai_settings;
  }

  // Clean Slate & Clear Data Operations
  public clearJobs(): void {
    this.store.jobs = [];
    this.store.job_matches = {};
    this.store.ats_analyses = {};
    this.store.tailored_resumes = [];
    this.store.applications = [];
    this.store.application_events = [];
    this.store.job_search_runs = [];
    this.store.resume_generation_runs = [];
    this.store.truth_validation_reports = {};
    this.saveStore(this.store);
    this.log('info', 'DATABASE', 'All job records, matches, tailored resumes, and applications cleared.');
  }

  public resetToCleanSlate(preserveMasterResume: boolean = true): void {
    const activeMaster = preserveMasterResume ? this.getMasterResume() : VERIFIED_MASTER_RESUME;
    const activeVersions = preserveMasterResume ? this.store.resume_versions : [];

    this.store.jobs = [];
    this.store.job_matches = {};
    this.store.ats_analyses = {};
    this.store.tailored_resumes = [];
    this.store.applications = [];
    this.store.application_events = [];
    this.store.job_search_runs = [];
    this.store.resume_generation_runs = [];
    this.store.truth_validation_reports = {};
    this.store.master_resumes = [activeMaster];
    this.store.resume_versions = activeVersions;
    this.saveStore(this.store);
    this.log('info', 'DATABASE', 'Database reset to a clean slate (ready for fresh discovery and user data).');
  }

  // Dashboard Stats
  public getDashboardStats(): DashboardStats {
    const jobs = this.store.jobs;
    const today = new Date().toISOString().split('T')[0];

    return {
      jobs_found: jobs.length,
      jobs_discovered_today: jobs.filter((j) => j.first_seen && j.first_seen.startsWith(today)).length || jobs.length,
      india_jobs_count: jobs.filter((j) => j.country === 'India').length,
      usa_jobs_count: jobs.filter((j) => j.country === 'USA').length,
      jobs_ge_60_count: jobs.filter((j) => (j.match_score || 0) >= 60).length,
      strong_matches_count: jobs.filter((j) => (j.match_score || 0) >= 75).length,
      tailored_resumes_count: this.store.tailored_resumes.length,
      applications_count: this.store.applications.filter((a) => a.status === 'Applied').length,
      interview_pipeline_count: this.store.applications.filter(
        (a) => a.status === 'Interviewing' || a.status === 'Offer'
      ).length,
      failed_searches_count: this.store.job_search_runs.filter((r) => r.status === 'failed').length,
    };
  }
}

export const db = new DatabaseService();
