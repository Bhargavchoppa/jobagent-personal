/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe2,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { JobPosting, TailoredResume } from '../types';

interface IndiaJobsViewProps {
  jobs: JobPosting[];
  tailoredResumes: TailoredResume[];
  onSelectJob: (job: JobPosting) => void;
}

export const IndiaJobsView: React.FC<IndiaJobsViewProps> = ({
  jobs,
  tailoredResumes,
  onSelectJob,
}) => {
  const [workModeFilter, setWorkModeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState<number>(0);

  const indiaJobs = jobs.filter((j) => j.country === 'India');

  const filtered = indiaJobs.filter((j) => {
    if (workModeFilter !== 'All' && !j.work_mode.toLowerCase().includes(workModeFilter.toLowerCase())) {
      return false;
    }
    if (minScore > 0 && (j.match_score || 0) < minScore) {
      return false;
    }
    if (
      searchQuery &&
      !j.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !j.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !j.location.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-emerald-600" />
            India Target Jobs Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Targeting Bangalore, Hyderabad, Pune, Mumbai, Gurgaon, Noida, and Pan-India Remote roles.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-200">
            {indiaJobs.length} Active India Postings
          </span>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-200">
            {indiaJobs.filter((j) => (j.match_score || 0) >= 60).length} Passed ≥60% Gate
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Bangalore, Hyderabad, Product Owner, BA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Mode:</span>
            <select
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-800"
            >
              <option value="All">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Min Score:</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-800"
            >
              <option value="0">Any Score</option>
              <option value="60">≥60% (Gate Pass)</option>
              <option value="75">≥75% (Strong Match)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((job) => {
          const tailored = tailoredResumes.find((r) => r.job_id === job.job_id);

          return (
            <div
              key={job.job_id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Badges row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        (job.match_score || 0) >= 75
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : (job.match_score || 0) >= 60
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {job.match_score}% Match • {job.match_category}
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {job.work_mode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{job.age_days}d ago</span>
                    {job.posted_date_verified && (
                      <span className="text-emerald-600 font-medium" title="Verified via JSON-LD">
                        ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Company */}
                <div>
                  <h3
                    onClick={() => onSelectJob(job)}
                    className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                  >
                    {job.title}
                  </h3>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {job.company} • <span className="text-slate-500">{job.location}</span>
                  </div>
                </div>

                {/* Compensation */}
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50/60 border border-emerald-100 px-2.5 py-1 rounded inline-block">
                  {job.salary}
                </div>

                {/* Excerpt */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {job.description}
                </p>

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1">
                  {job.skills.map((s) => (
                    <span key={s} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {s}
                    </span>
                  ))}
                  {job.ats_platform && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                      ATS: {job.ats_platform}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Status: <strong className="text-slate-700">{job.application_status}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {tailored ? (
                    <a
                      href={`/api/resumes/tailored/${job.job_id}/docx`}
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
