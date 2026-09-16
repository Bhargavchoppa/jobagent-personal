/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Download,
  RotateCw,
  Sparkles,
  Calendar,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck2,
  Eye,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  JobPosting,
  TailoredResume,
  ApplicationStatus,
  AtsAnalysis,
} from '../types';

interface JobDetailsModalProps {
  job: JobPosting | null;
  tailored: TailoredResume | null;
  onClose: () => void;
  onRecalculateMatch: (jobId: string) => Promise<void>;
  onGenerateTailored: (jobId: string) => Promise<void>;
  onUpdateStatus: (jobId: string, status: ApplicationStatus) => Promise<void>;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  tailored,
  onClose,
  onRecalculateMatch,
  onGenerateTailored,
  onUpdateStatus,
}) => {
  const [loading, setLoading] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState<AtsAnalysis | null>(null);
  const [loadingAts, setLoadingAts] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'resume'>('details');

  useEffect(() => {
    if (job?.job_id) {
      setLoadingAts(true);
      fetch(`/api/ats-analysis/${job.job_id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setAtsAnalysis(data))
        .catch(() => setAtsAnalysis(null))
        .finally(() => setLoadingAts(false));
    }
  }, [job?.job_id]);

  if (!job) return null;

  const handleRecalc = async () => {
    setLoading(true);
    try {
      await onRecalculateMatch(job.job_id);
    } finally {
      setLoading(false);
    }
  };

  const handleTailor = async () => {
    setLoading(true);
    try {
      await onGenerateTailored(job.job_id);
      // After tailoring, fetch fresh ATS analysis
      const res = await fetch(`/api/ats-analysis/${job.job_id}`);
      if (res.ok) {
        setAtsAnalysis(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  // Check Phase 7 Truth Gate Requirement
  const isTruthVerified = tailored
    ? tailored.validation_status === 'PASSED' ||
      tailored.truth_audit_passed === true ||
      tailored.truth_check?.passed === true
    : false;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  (job.match_score || 0) >= 75
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : (job.match_score || 0) >= 60
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {job.match_score || 0}% Match • {job.match_category || 'Pending'}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                {job.country} ({job.location})
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                {job.work_mode || job.remote || 'On-site'}
              </span>
              {job.ats_platform && (
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono">
                  ATS: {job.ats_platform}
                </span>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-900 leading-snug truncate">
              {job.title}
            </h2>
            <div className="text-xs text-slate-600 font-medium">
              <strong className="text-slate-900">{job.company}</strong> •{' '}
              <span className="text-emerald-700 font-bold">{job.salary || 'Competitive'}</span> •{' '}
              {job.employment_type || 'Full-time'} • Experience:{' '}
              {job.experience_required || 'Not specified'}
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Posted: {job.posted_date || 'Recent'} ({job.age_days ?? 0} days ago)
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" />
                ID: <span className="font-mono text-slate-700">{job.job_id}</span>
              </span>
              {job.posted_date_verified && (
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Date Verified
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs (Details vs Generated Resume) */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Job Overview & Match Analysis
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'resume'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Generated Resume Document {tailored && `(${tailored.ats_score || atsAnalysis?.coverage_percentage || 0}%)`}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Action Callout Bar */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                Automated Tailoring Gate (≥60%)
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">
                Current Match:{' '}
                <strong className="text-emerald-400">{job.match_score || 0}%</strong>{' '}
                {(job.match_score || 0) >= 60
                  ? '— Tailoring Gate Passed'
                  : '— Below 60% threshold'}
                {tailored && (
                  <span className="text-purple-300 ml-2">
                    • ATS Score: <strong className="text-purple-200">{tailored.ats_score}%</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRecalc}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Recalculate Match
              </button>

              {tailored ? (
                <div className="flex items-center gap-1.5">
                  <a
                    href={`/api/resumes/tailored/${job.job_id}/docx`}
                    download
                    className={`flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg shadow-xs transition-all ${
                      isTruthVerified
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    DOCX
                  </a>
                  <a
                    href={`/api/resumes/tailored/${job.job_id}/pdf`}
                    download
                    className={`flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg shadow-xs transition-all ${
                      isTruthVerified
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleTailor}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Tailor Resume Now
                </button>
              )}
            </div>
          </div>

          {activeTab === 'details' && (
            <>
              {/* Job Links & Pipeline Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="space-y-1">
                  <div className="font-bold text-slate-700">Application Links:</div>
                  <div className="flex flex-col gap-1">
                    {job.application_url && (
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" /> Direct ATS Portal Application
                      </a>
                    )}
                    {job.source_url && job.source_url !== job.application_url && (
                      <a
                        href={job.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" /> Original Source Listing
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-700">Application Pipeline Status:</div>
                  <div className="flex items-center gap-2">
                    <select
                      value={job.application_status}
                      onChange={(e) =>
                        onUpdateStatus(job.job_id, e.target.value as ApplicationStatus)
                      }
                      className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-medium"
                    >
                      {[
                        'Not Applied',
                        'Saved',
                        'Tailored',
                        'Applied',
                        'Interviewing',
                        'Offer',
                        'Rejected',
                      ].map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400 text-[11px]">Updates pipeline stage</span>
                  </div>
                </div>
              </div>

              {/* 5-Component Match Breakdown */}
              {job.match_breakdown && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    5-Component Semantic Breakdown
                  </h4>
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="text-slate-500">Semantic (35%)</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {job.match_breakdown.semantic_similarity}%
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="text-slate-500">Skills (25%)</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {job.match_breakdown.skills_technologies}%
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="text-slate-500">Duties (20%)</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {job.match_breakdown.responsibilities}%
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="text-slate-500">Domain (10%)</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {job.match_breakdown.industry_domain}%
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="text-slate-500">Role (10%)</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {job.match_breakdown.role_title}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Original Job Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Original Job Description
                </h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50/50 p-3.5 rounded-lg border border-slate-200 whitespace-pre-wrap">
                  {job.description || job.raw_text || 'No description provided.'}
                </p>
              </div>

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Responsibilities
                  </h4>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside">
                    {job.responsibilities.map((r, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Requirements
                  </h4>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Skills & Tools Required
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(job.skills || []).map((s) => (
                    <span
                      key={s}
                      className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Match Analysis: Matched Skills, Related Skills, Not Evidenced Skills */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Match Analysis & Evidence Audit
                </h4>

                {job.matching_explanation && (
                  <p className="text-slate-600 text-xs italic bg-white p-2.5 rounded border border-slate-200">
                    {job.matching_explanation}
                  </p>
                )}

                {/* Matched Skills */}
                <div>
                  <div className="font-semibold text-emerald-800 text-[11px] mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Matched Skills ({job.matched_skills?.length || 0}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {job.matched_skills && job.matched_skills.length > 0 ? (
                      job.matched_skills.map((s, i) => (
                        <span
                          key={i}
                          className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-medium"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">None identified</span>
                    )}
                  </div>
                </div>

                {/* Related Skills */}
                <div>
                  <div className="font-semibold text-blue-800 text-[11px] mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Related / Transferable Skills ({job.related_skills?.length || 0}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {job.related_skills && job.related_skills.length > 0 ? (
                      job.related_skills.map((s: any, i: number) => {
                        const label = typeof s === 'string' ? s : s.skill;
                        return (
                          <span
                            key={i}
                            className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-medium"
                          >
                            {label}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">None identified</span>
                    )}
                  </div>
                </div>

                {/* Not Evidenced Skills */}
                <div>
                  <div className="font-semibold text-amber-800 text-[11px] mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Not Evidenced Skills (Zero-Fabrication Preserved) ({job.not_evidenced_skills?.length || 0}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {job.not_evidenced_skills && job.not_evidenced_skills.length > 0 ? (
                      job.not_evidenced_skills.map((s, i) => (
                        <span
                          key={i}
                          className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-emerald-700 italic text-[11px]">
                        All core JD skills are evidenced in candidate profile.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ATS Analysis Summary */}
              {atsAnalysis && (
                <div className="space-y-2 p-4 bg-purple-50/50 border border-purple-200 rounded-xl text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      ATS Analysis & Keyword Density
                    </h4>
                    <span className="font-bold text-purple-700 text-xs">
                      {atsAnalysis.coverage_percentage}% Truthful Coverage
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] pt-1">
                    <div className="p-2 bg-white rounded border border-purple-200">
                      <div className="text-slate-500">Total JD Keywords</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {atsAnalysis.total_jd_keywords}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border border-purple-200">
                      <div className="text-emerald-700 font-medium">Present in Resume</div>
                      <div className="font-bold text-emerald-800 text-xs mt-0.5">
                        {atsAnalysis.present_count}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border border-purple-200">
                      <div className="text-blue-700 font-medium">Related Capabilities</div>
                      <div className="font-bold text-blue-800 text-xs mt-0.5">
                        {atsAnalysis.related_count}
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded border border-purple-200">
                      <div className="text-amber-700 font-medium">Unsupported (Gap)</div>
                      <div className="font-bold text-amber-800 text-xs mt-0.5">
                        {atsAnalysis.not_evidenced_count}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'resume' && (
            <div className="space-y-4">
              {tailored ? (
                <div className="space-y-4">
                  {/* Resume Document Metadata Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-purple-600" />
                        {tailored.file_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Target Title:{' '}
                        <strong className="text-slate-800">
                          {tailored.target_title || tailored.headline || tailored.job_title}
                        </strong>{' '}
                        • ATS Score: <strong className="text-purple-700">{tailored.ats_score}%</strong>
                      </div>
                      <div className="text-[11px] flex items-center gap-1">
                        {isTruthVerified ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Truth
                            Validation: PASSED (Download Unlocked)
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Truth Validation:
                            FAILED / PENDING
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/api/resumes/tailored/${job.job_id}/docx`}
                        download
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-all ${
                          isTruthVerified
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed pointer-events-none'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download DOCX
                      </a>
                      <a
                        href={`/api/resumes/tailored/${job.job_id}/pdf`}
                        download
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-all ${
                          isTruthVerified
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed pointer-events-none'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </a>
                    </div>
                  </div>

                  {/* Document Content Preview Canvas */}
                  <div className="bg-slate-50/80 border border-slate-300 rounded-xl p-6 font-sans space-y-4 text-slate-900">
                    <div className="text-center pb-3 border-b border-slate-300 space-y-1">
                      <h3 className="text-lg font-black text-slate-950">
                        Bhargav Aravind Sai Ram Choppa
                      </h3>
                      <div className="text-xs text-slate-600">
                        Hartford, CT | bhargavchoppa23@gmail.com | (860) 997-6229 | linkedin.com/in/bhargavchoppa
                      </div>
                      <div className="text-xs font-bold text-blue-900 mt-1">
                        {tailored.target_title || tailored.headline || tailored.job_title}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5">
                        Professional Summary
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {tailored.professional_summary || tailored.summary}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5">
                        Core Skills
                      </h4>
                      <p className="text-xs text-slate-700">
                        {(tailored.targeted_skills?.present || tailored.core_skills || []).join(' • ')}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5">
                        Professional Experience
                      </h4>
                      {(tailored.tailored_experience || tailored.professional_experience || []).map(
                        (exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                              <span>
                                {exp.company} — {exp.location}
                              </span>
                              <span className="font-mono text-slate-500 font-normal">
                                {exp.dates}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-blue-900 italic">
                              {exp.title}
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-700">
                              {(exp.reordered_responsibilities || []).map((resp, rIdx) => (
                                <li key={rIdx}>{resp}</li>
                              ))}
                              {(exp.truth_aligned_achievements || []).map((ach, aIdx) => (
                                <li key={aIdx} className="font-medium text-emerald-900">
                                  <strong>Key Result:</strong> {ach}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No Resume Generated Yet</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click <strong>Tailor Resume Now</strong> to generate a zero-fabrication, ATS-friendly resume formatted specifically for this job description.
                  </p>
                  <button
                    onClick={handleTailor}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    Tailor Resume Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Prompt Injection Guard & Zero-Fabrication Protocol Enforced
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
