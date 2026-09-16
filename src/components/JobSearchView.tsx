/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Globe2,
  Building2,
  Play,
  RotateCw,
  CheckCircle2,
  Terminal,
  Filter,
  ShieldCheck,
  Calendar,
  Layers,
  Plus,
  X,
  Sparkles,
  CheckSquare,
  Square,
  FlaskConical,
  AlertCircle,
} from 'lucide-react';
import { CountryTarget, JobPosting, LiveJobSearchState, WorkMode } from '../types';

interface JobSearchViewProps {
  searchState: LiveJobSearchState;
  onTriggerSearch: (params: {
    country: CountryTarget;
    roles: string[];
    locationKeywords?: string;
    additionalKeywords?: string[];
  }) => void;
  jobs: JobPosting[];
  onSelectJob: (job: JobPosting) => void;
}

export const TARGET_ROLE_OPTIONS = [
  'Business Analyst',
  'Senior Business Analyst',
  'Product Manager',
  'Senior Product Manager',
  'Product Owner',
  'Senior Product Owner',
  'AI Product Manager',
  'Technical Product Manager',
  'IT Product Manager',
  'Product Analyst',
  'Project Manager',
  'Technical Business Analyst',
];

export const JobSearchView: React.FC<JobSearchViewProps> = ({
  searchState,
  onTriggerSearch,
  jobs,
  onSelectJob,
}) => {
  const [country, setCountry] = useState<CountryTarget>('All');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    'Business Analyst',
    'Senior Business Analyst',
    'Product Owner',
    'Product Manager',
    'AI Product Manager',
    'Technical Business Analyst',
  ]);
  const [additionalKeywords, setAdditionalKeywords] = useState<string[]>(['FinTech', 'Cloud']);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [filterText, setFilterText] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState<'All' | WorkMode>('All');

  // Diagnostics state
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: Array<{ test: string; passed: boolean; message?: string }>;
  } | null>(null);

  const isRunning =
    searchState.status === 'searching' ||
    searchState.status === 'matching' ||
    searchState.status === 'tailoring' ||
    searchState.status === 'extracting';

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const selectAllRoles = () => {
    setSelectedRoles([...TARGET_ROLE_OPTIONS]);
  };

  const selectCoreRoles = () => {
    setSelectedRoles([
      'Business Analyst',
      'Senior Business Analyst',
      'Product Owner',
      'Product Manager',
    ]);
  };

  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim();
    if (trimmed && !additionalKeywords.includes(trimmed)) {
      setAdditionalKeywords([...additionalKeywords, trimmed]);
      setNewKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setAdditionalKeywords(additionalKeywords.filter((k) => k !== kw));
  };

  const handleStart = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isRunning) return;
    onTriggerSearch({
      country,
      roles: selectedRoles,
      additionalKeywords,
    });
  };

  const runDiagnostics = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/jobs/tests/run');
      if (res.ok) {
        const data = await res.json();
        setTestResults(data);
      }
    } catch (err) {
      console.error('Failed to run discovery test suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (country !== 'All' && job.country !== country) return false;
    if (workModeFilter !== 'All' && job.remote !== workModeFilter) return false;
    if (
      filterText &&
      !job.title.toLowerCase().includes(filterText.toLowerCase()) &&
      !job.company.toLowerCase().includes(filterText.toLowerCase()) &&
      !job.skills.some((s) => s.toLowerCase().includes(filterText.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Diagnostics Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Phase 3 — Live Job Discovery Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            11-stage search pipeline with URL normalization, ATS recognition (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, Taleo), zero-trust date parsing, and concurrent extraction across USA & India.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runDiagnostics}
            disabled={isRunningTests}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all"
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
            {isRunningTests ? 'Running Tests...' : 'Run Pipeline Tests'}
          </button>
        </div>
      </div>

      {/* Test Results Banner (If Executed) */}
      {testResults && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <FlaskConical className="w-4 h-4 text-purple-400" />
              <span>Phase 3 Test Suite Results:</span>
              <span className="text-emerald-400">{testResults.passed} Passed</span>
              {testResults.failed > 0 && <span className="text-red-400">{testResults.failed} Failed</span>}
              <span className="text-slate-400">({testResults.total} total)</span>
            </div>
            <button
              onClick={() => setTestResults(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {testResults.results.map((r, i) => (
              <div
                key={i}
                className={`p-2 rounded border flex items-center gap-2 ${
                  r.passed
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-red-950/40 border-red-800/60 text-red-300'
                }`}
              >
                {r.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span className="truncate">{r.test}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Geography */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Target Geography (Isolated DB Storage)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['All', 'USA', 'India'] as CountryTarget[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCountry(c)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                    country === c
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {c === 'USA' && <Building2 className="w-3.5 h-3.5" />}
                  {c === 'India' && <Globe2 className="w-3.5 h-3.5" />}
                  {c === 'All' && <Layers className="w-3.5 h-3.5" />}
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt-Guard & Zero-Fabrication Status */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Zero-Fabrication & Pipeline Directive</label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Prompt-Injection Defense & Zero-Trust Date Validation Active
              </div>
              <p className="text-[11px] text-slate-500">
                JSON-LD JobPosting dates prioritized; generic &lt;time&gt; elements rejected. Hard Gate rule: Jobs with match score <strong className="text-slate-800">≥60%</strong> trigger automated ATS resume tailoring.
              </p>
            </div>
          </div>
        </div>

        {/* Target Roles (All 12 Profiles with Select Controls) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              Target Roles ({selectedRoles.length} of {TARGET_ROLE_OPTIONS.length} active)
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={selectAllRoles}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All 12 Roles
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={selectCoreRoles}
                className="text-slate-500 hover:text-slate-700 font-medium"
              >
                Reset to Core 4
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TARGET_ROLE_OPTIONS.map((role) => {
              const isSelected = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional Configurable Keywords */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Additional Configurable Keywords & Domains
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {additionalKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Add keyword (e.g. Healthcare, LLM, Cloud)..."
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                className="text-xs px-2.5 py-1 border border-slate-200 rounded-md bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Trigger */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Pipeline: Collect → Normalize → Dedup → Classify → Rank → Concurrently Fetch → Extract → Validate Dates → Store
          </div>
          <button
            type="button"
            onClick={handleStart}
            disabled={isRunning}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg text-white shadow-sm transition-all ${
              isRunning
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Executing Pipeline...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Start Live Job Discovery
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Pipeline Milestones & Progress Stream */}
      {searchState.current_step && searchState.status !== 'idle' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 shadow-md space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-white">
              {isRunning ? (
                <RotateCw className="w-4 h-4 text-blue-400 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-sm">{searchState.current_step}</span>
            </div>
            <span className="font-mono text-slate-400">{searchState.progress_percent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                searchState.status === 'completed'
                  ? 'bg-emerald-500'
                  : searchState.status === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${searchState.progress_percent}%` }}
            ></div>
          </div>

          {/* 6 Core Milestones Grid (Matching Prompt Example) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-slate-850 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Stage 1</div>
              <div className="font-bold text-white mt-0.5">Search started</div>
            </div>
            <div className="bg-slate-850 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Stage 2</div>
              <div className="font-bold text-blue-400 mt-0.5">
                {searchState.results_found || searchState.candidates_found || 0} search results
              </div>
            </div>
            <div className="bg-slate-850 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Stage 3</div>
              <div className="font-bold text-blue-300 mt-0.5">
                {searchState.unique_urls || 0} unique URLs
              </div>
            </div>
            <div className="bg-slate-850 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Stage 4</div>
              <div className="font-bold text-amber-400 mt-0.5">
                {searchState.likely_job_pages || 0} likely job pages
              </div>
            </div>
            <div className="bg-slate-850 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Stage 5</div>
              <div className="font-bold text-purple-400 mt-0.5">
                {searchState.jobs_extracted || 0} extracted
              </div>
            </div>
            <div className="bg-slate-850 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Stage 6</div>
              <div className="font-bold text-emerald-400 mt-0.5">
                {searchState.jobs_saved || 0} valid jobs saved
              </div>
            </div>
          </div>

          {/* Live Terminal Log Stream */}
          <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-300 max-h-44 overflow-y-auto space-y-1 border border-slate-800">
            <div className="text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-800">
              <Terminal className="w-3.5 h-3.5" /> Discovery & Matching Terminal Stream
            </div>
            {(searchState?.logs || []).map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                <span className="text-blue-400">❯</span> {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovered Postings List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">
            Discovered Job Postings ({filteredJobs.length})
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* Work Mode Filter */}
            <div className="flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Mode:</span>
              <select
                value={workModeFilter}
                onChange={(e) => setWorkModeFilter(e.target.value as any)}
                className="bg-transparent text-slate-800 font-medium focus:outline-none"
              >
                <option value="All">All Modes</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Filter by title, company, skill..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredJobs.map((job) => (
            <div
              key={job.job_id}
              onClick={() => onSelectJob(job)}
              className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (job.match_score || 0) >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : (job.match_score || 0) >= 60
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {job.match_score ? `${job.match_score}% Match` : 'Unscored'} • {job.match_category || 'Pending'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {job.age_days}d ago ({job.posted_date_source})
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{job.title}</h4>
                  <div className="text-xs text-slate-600 font-medium">
                    {job.company} • <span className="text-slate-500">{job.location}</span> ({job.country})
                  </div>
                </div>

                <div className="text-xs text-emerald-700 font-semibold">{job.salary}</div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {job.skills.slice(0, 4).map((s) => (
                    <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                  {job.ats_platform && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                      {job.ats_platform}
                    </span>
                  )}
                  {job.work_mode && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {job.work_mode}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Status: {job.application_status}</span>
                <span className="text-blue-600 font-semibold hover:underline">
                  Inspect & Tailor →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
