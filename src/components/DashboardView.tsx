/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Briefcase,
  Globe2,
  Building2,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  ArrowUpRight,
  Download,
  AlertTriangle,
  Play,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { DashboardStats, JobPosting, MasterResume, TailoredResume } from '../types';
import { FoundationHealthCard } from './FoundationHealthCard';

interface DashboardViewProps {
  stats: DashboardStats;
  jobs: JobPosting[];
  masterResume: MasterResume | null;
  tailoredResumes: TailoredResume[];
  onSelectJob: (job: JobPosting) => void;
  onNavigate: (tab: any) => void;
  onStartSearch: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  jobs,
  masterResume,
  tailoredResumes,
  onSelectJob,
  onNavigate,
  onStartSearch,
}) => {
  const topMatches = jobs
    .filter((j) => (j.match_score || 0) >= 60)
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/80">
              Verified Master Resume Active
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Zero-Fabrication Mode
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5">
            Welcome, {masterResume?.personal_information.full_name || 'Candidate'}
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Positioned as <strong className="text-slate-100">{masterResume?.personal_information.header_positioning}</strong>. Target matching gate is strictly set to <strong className="text-emerald-400 font-mono">≥60%</strong> with automatic ATS resume tailoring (~95% truthful coverage).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onStartSearch}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Discover Jobs Now
          </button>
          <button
            onClick={() => onNavigate('master-resume')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition-all"
          >
            Review Master Resume
          </button>
        </div>
      </div>

      {/* Phase 1 Foundation Architecture & Health Diagnostics */}
      <FoundationHealthCard />

      {/* Audit Inconsistency Flag Alert Banner (If Present) */}
      {masterResume?.inconsistency_flags && masterResume.inconsistency_flags.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-4 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-amber-300">
              Auditor Verified Notice: Header vs. Certification Inconsistency Detected
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              Your resume header mentions <strong>"PMP"</strong>, but the verified certification section does not independently list a Project Management Professional credential. The system strictly complies with the <strong>Zero-Fabrication Policy</strong>: PMP will <em>never</em> be silently invented or added into your tailored certifications.
            </p>
          </div>
        </div>
      )}

      {/* 9 Metrics Dashboard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Jobs Today</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.jobs_discovered_today}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across USA & India</div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate('usa-jobs')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>USA Jobs</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.usa_jobs_count}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-0.5 flex items-center gap-0.5">
            View USA board <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate('india-jobs')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>India Jobs</span>
            <Globe2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.india_jobs_count}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-0.5">
            View India board <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Jobs ≥60% Gate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.jobs_ge_60_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automated tailoring triggered</div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Strong Matches</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats.strong_matches_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Score 75 - 100%</div>
        </div>

        {/* Metric 6 */}
        <div
          onClick={() => onNavigate('tailored-resumes')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tailored Resumes</span>
            <FileCheck2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{stats.tailored_resumes_count}</div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">DOCX & ATS Ready</div>
        </div>

        {/* Metric 7 */}
        <div
          onClick={() => onNavigate('applications')}
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Applications Sent</span>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.applications_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Submitted via portals</div>
        </div>

        {/* Metric 8 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Interview Pipeline</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-teal-600 mt-1">{stats.interview_pipeline_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active interview rounds</div>
        </div>

        {/* Metric 9 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Search Failures</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 mt-1">{stats.failed_searches_count}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Zero critical errors</div>
        </div>
      </div>

      {/* Top High-Match Opportunities Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Priority Job Opportunities (≥60% Gate Passed)</h3>
            <p className="text-xs text-slate-500">
              Matched against verified master resume using 5-component semantic weighting (35% semantic, 25% skills, 20% duties, 10% domain, 10% role).
            </p>
          </div>
          <button
            onClick={() => onNavigate('job-matching')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Matching Jobs <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {topMatches.map((job) => {
            const hasTailored = tailoredResumes.some((r) => r.job_id === job.job_id);
            return (
              <div
                key={job.job_id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        (job.match_score || 0) >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {job.match_score}% Match • {job.match_category}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{job.country}</span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {job.work_mode}
                    </span>
                    {job.ats_platform && (
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {job.ats_platform}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Posted {job.age_days}d ago ({job.posted_date_source})
                    </span>
                  </div>

                  <h4
                    onClick={() => onSelectJob(job)}
                    className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                  >
                    {job.title}
                  </h4>
                  <div className="text-xs text-slate-600 font-medium">
                    {job.company} • <span className="text-slate-500">{job.location}</span> •{' '}
                    <span className="text-emerald-700 font-semibold">{job.salary}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.skills.slice(0, 5).map((s) => (
                      <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasTailored ? (
                    <a
                      href={`/api/resumes/tailored/${job.job_id}/docx`}
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-semibold rounded-lg transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DOCX Resume
                    </a>
                  ) : (
                    <button
                      onClick={() => onSelectJob(job)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-all"
                    >
                      Tailor Resume
                    </button>
                  )}
                  <button
                    onClick={() => onSelectJob(job)}
                    className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-lg transition-all"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
