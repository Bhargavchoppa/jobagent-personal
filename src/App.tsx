/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import {
  DashboardStats,
  JobPosting,
  MasterResume,
  TailoredResume,
  ApplicationRecord,
  SystemAuditLog,
  LiveJobSearchState,
  CountryTarget,
  ApplicationStatus,
} from './types';

import { Navigation, ActiveTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { JobSearchView } from './components/JobSearchView';
import { IndiaJobsView } from './components/IndiaJobsView';
import { UsaJobsView } from './components/UsaJobsView';
import { JobMatchingView } from './components/JobMatchingView';
import { MasterResumeView } from './components/MasterResumeView';
import { TailoredResumesView } from './components/TailoredResumesView';
import { AtsAnalysisView } from './components/AtsAnalysisView';
import { ApplicationsView } from './components/ApplicationsView';
import { SettingsView } from './components/SettingsView';
import { SystemLogsView } from './components/SystemLogsView';
import { JobDetailsModal } from './components/JobDetailsModal';

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('jobagent_active_tab');
      if (saved && ['dashboard', 'master', 'search', 'jobs', 'tailored', 'applications', 'system', 'settings'].includes(saved)) {
        return saved as ActiveTab;
      }
    } catch {}
    return 'dashboard';
  });

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('jobagent_active_tab', tab);
    } catch {}
  };
  const [stats, setStats] = useState<DashboardStats>({
    jobs_found: 0,
    jobs_discovered_today: 0,
    india_jobs_count: 0,
    usa_jobs_count: 0,
    jobs_ge_60_count: 0,
    strong_matches_count: 0,
    tailored_resumes_count: 0,
    applications_count: 0,
    interview_pipeline_count: 0,
    failed_searches_count: 0,
  });

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null);
  const [tailoredResumes, setTailoredResumes] = useState<TailoredResume[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [validationAlert, setValidationAlert] = useState<{
    jobId: string;
    reasons: string[];
  } | null>(null);

  const [searchState, setSearchState] = useState<LiveJobSearchState>({
    run_id: '',
    status: 'idle',
    progress_percent: 0,
    current_step: 'Idle',
    candidates_found: 0,
    processed_count: 0,
    total_to_process: 0,
    logs: [],
  });

  // Load all initial state
  const refreshAllData = async () => {
    try {
      const [dashRes, masterRes, jobsRes, tailoredRes, appsRes, logsRes] = await Promise.all([
        fetch('/api/dashboard').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/master-resume').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/jobs').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/resumes/tailored').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/applications').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/logs').then((r) => (r.ok ? r.json() : [])),
      ]);

      if (dashRes?.stats) setStats(dashRes.stats);
      if (masterRes) setMasterResume(masterRes);
      if (jobsRes) setJobs(jobsRes);
      if (tailoredRes) setTailoredResumes(tailoredRes);
      if (appsRes) setApplications(appsRes);
      if (logsRes) setLogs(logsRes);
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Poll search status while discovery run is active
  useEffect(() => {
    let intervalId: any = null;

    const checkSearch = async () => {
      try {
        const res = await fetch('/api/jobs/search/status');
        if (res.ok) {
          const current = await res.json();
          setSearchState(current);

          // If recently completed, refresh datasets
          if (current.status === 'completed' && searchState.status !== 'completed') {
            refreshAllData();
          }
        }
      } catch (e) {
        console.error('Failed to poll search state:', e);
      }
    };

    if (
      searchState.status === 'searching' ||
      searchState.status === 'matching' ||
      searchState.status === 'tailoring' ||
      searchState.status === 'extracting'
    ) {
      intervalId = setInterval(checkSearch, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [searchState.status]);

  // Action Handlers
  const handleTriggerSearch = async (params: {
    country: CountryTarget;
    roles: string[];
    locationKeywords?: string;
    additionalKeywords?: string[];
  }) => {
    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchState(data.state);
      }
    } catch (err) {
      console.error('Failed to trigger search:', err);
    }
  };

  const handleRecalculateMatch = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/match`, { method: 'POST' });
      if (res.ok) {
        await refreshAllData();
        const updated = await fetch(`/api/jobs/${jobId}`).then((r) => r.json());
        if (updated?.job) {
          setSelectedJob(updated.job);
        }
      }
    } catch (err) {
      console.error('Failed to recalculate match:', err);
    }
  };

  const handleGenerateTailored = async (jobId: string) => {
    try {
      setValidationAlert(null);
      const res = await fetch(`/api/jobs/${jobId}/tailor`, { method: 'POST' });
      if (res.ok) {
        await refreshAllData();
        const updated = await fetch(`/api/jobs/${jobId}`).then((r) => r.json());
        if (updated?.job) {
          setSelectedJob(updated.job);
        }
      } else if (res.status === 422) {
        const data = await res.json();
        setValidationAlert({
          jobId,
          reasons: data.reasons || [data.error || 'Truth validation failed'],
        });
      }
    } catch (err) {
      console.error('Failed to generate tailored resume:', err);
    }
  };

  const handleUpdateStatus = async (
    jobId: string,
    status: ApplicationStatus,
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/applications/${jobId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        await refreshAllData();
        if (selectedJob && selectedJob.job_id === jobId) {
          setSelectedJob({ ...selectedJob, application_status: status });
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleUpdateMasterResume = async (updated: MasterResume) => {
    try {
      const res = await fetch('/api/master-resume', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const saved = await res.json();
        setMasterResume(saved);
      }
    } catch (err) {
      console.error('Failed to update master resume:', err);
    }
  };

  // Find active tailored resume for selected modal job
  const selectedJobTailored = selectedJob
    ? tailoredResumes.find((r) => r.job_id === selectedJob.job_id) || null
    : null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchState={searchState}
        masterResume={masterResume}
        jobsCount={{
          total: jobs.length,
          usa: jobs.filter((j) => j.country === 'USA').length,
          india: jobs.filter((j) => j.country === 'India').length,
          tailored: tailoredResumes.length,
          applications: applications.length,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top App Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Environment:
            </span>
            <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              Full-Stack (Vite + Node Express)
            </span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Gemini 3.8 Flash Engine
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              PMP Inconsistency Guard Active
            </div>
            <div className="text-slate-400">|</div>
            <div className="text-slate-600 font-medium">
              Candidate: <strong className="text-slate-900">{masterResume?.personal_information.full_name || 'Bhargav Choppa'}</strong>
            </div>
          </div>
        </header>

        {/* Scrollable Main View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Phase 6 Truth Validation Failure Banner */}
            {validationAlert && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1.5">
                  <div className="text-sm font-bold flex items-center gap-2 text-rose-700">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Validation Failed</span>
                  </div>
                  <div className="text-xs font-semibold text-rose-800">Reason:</div>
                  <ul className="text-xs list-disc list-outside pl-5 space-y-1 text-rose-900 font-mono">
                    {validationAlert.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-rose-700 mt-1 italic">
                    Per Phase 6 Zero-Fabrication Protocol: Final resume creation was strictly blocked because candidate evidence could not be corroborated.
                  </p>
                </div>
                <button
                  onClick={() => setValidationAlert(null)}
                  className="text-xs text-rose-700 hover:text-rose-950 font-bold px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 border border-rose-200 transition-colors shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                jobs={jobs}
                masterResume={masterResume}
                tailoredResumes={tailoredResumes}
                onSelectJob={(j) => setSelectedJob(j)}
                onNavigate={(tab) => setActiveTab(tab)}
                onStartSearch={() => setActiveTab('search')}
              />
            )}

            {activeTab === 'search' && (
              <JobSearchView
                searchState={searchState}
                onTriggerSearch={handleTriggerSearch}
                jobs={jobs}
                onSelectJob={(j) => setSelectedJob(j)}
              />
            )}

            {activeTab === 'india-jobs' && (
              <IndiaJobsView
                jobs={jobs}
                tailoredResumes={tailoredResumes}
                onSelectJob={(j) => setSelectedJob(j)}
              />
            )}

            {activeTab === 'usa-jobs' && (
              <UsaJobsView
                jobs={jobs}
                tailoredResumes={tailoredResumes}
                onSelectJob={(j) => setSelectedJob(j)}
              />
            )}

            {activeTab === 'job-matching' && (
              <JobMatchingView
                jobs={jobs}
                masterResume={masterResume}
                tailoredResumes={tailoredResumes}
                onSelectJob={(j) => setSelectedJob(j)}
                onRecalculateMatch={handleRecalculateMatch}
                onGenerateTailored={handleGenerateTailored}
              />
            )}

            {activeTab === 'master-resume' && (
              <MasterResumeView
                resume={masterResume}
                onUpdateResume={handleUpdateMasterResume}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'tailored-resumes' && (
              <TailoredResumesView
                tailoredResumes={tailoredResumes}
              />
            )}

            {activeTab === 'ats-analysis' && (
              <AtsAnalysisView
                jobs={jobs}
                onSelectJob={(j) => setSelectedJob(j)}
              />
            )}

            {activeTab === 'applications' && (
              <ApplicationsView
                applications={applications}
                jobs={jobs}
                tailoredResumes={tailoredResumes}
                onUpdateStatus={handleUpdateStatus}
                onSelectJob={(j) => setSelectedJob(j)}
              />
            )}

            {activeTab === 'settings' && <SettingsView onDataReset={refreshAllData} />}

            {activeTab === 'system-logs' && <SystemLogsView logs={logs} />}
          </div>
        </main>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          tailored={selectedJobTailored}
          onClose={() => setSelectedJob(null)}
          onRecalculateMatch={handleRecalculateMatch}
          onGenerateTailored={handleGenerateTailored}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
