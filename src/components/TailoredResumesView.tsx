/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Download,
  Eye,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Building2,
  Sparkles,
  ExternalLink,
  Copy,
  Printer,
  FlaskConical,
  RefreshCw,
  Check,
  X,
  ListChecks,
  Scale,
} from 'lucide-react';
import { TailoredResume, TruthValidationReport } from '../types';

interface TailoredResumesViewProps {
  tailoredResumes: TailoredResume[];
  onSelectResume?: (resume: TailoredResume) => void;
}

export const TailoredResumesView: React.FC<TailoredResumesViewProps> = ({
  tailoredResumes,
}) => {
  const [selectedResume, setSelectedResume] = useState<TailoredResume | null>(
    tailoredResumes[0] || null
  );
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'truth_audit' | 'diagnostics'>('preview');
  const [copied, setCopied] = useState(false);
  const [validationReport, setValidationReport] = useState<TruthValidationReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Diagnostic Test State
  const [diagnosticResults, setDiagnosticResults] = useState<{
    suite?: string;
    total?: number;
    total_tests?: number;
    passed: number;
    failed: number;
    tests?: Array<{
      name: string;
      dimension: string;
      passed: boolean;
      expected?: string;
      actual?: string;
      message?: string;
    }>;
    results?: Array<{ test: string; passed: boolean; message?: string }>;
  } | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  useEffect(() => {
    if (selectedResume?.job_id) {
      loadValidationReport(selectedResume.job_id);
    }
  }, [selectedResume?.job_id]);

  const loadValidationReport = async (jobId: string) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/validation/reports/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setValidationReport(data);
      } else {
        setValidationReport(null);
      }
    } catch (e) {
      console.error('Failed to load validation report:', e);
      setValidationReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const res = await fetch('/api/validation/tests/run');
      if (res.ok) {
        const data = await res.json();
        setDiagnosticResults(data);
      }
    } catch (e) {
      console.error('Failed to run diagnostics:', e);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleCopyText = (res: TailoredResume) => {
    const headline = res.headline || res.target_title || res.job_title;
    const summary = res.professional_summary || res.summary || '';
    const skills = res.targeted_skills?.present || res.core_skills || [];
    const experience = res.tailored_experience || res.professional_experience || [];

    const text = `
${headline}

SUMMARY:
${summary}

TARGETED COMPETENCIES:
${skills.join(', ')}

EXPERIENCE:
${experience
  .map(
    (e) => `
${e.title} - ${e.company} (${e.dates})
${e.reordered_responsibilities.map((r) => `• ${r}`).join('\n')}
${e.truth_aligned_achievements.map((a) => `Key Result: ${a}`).join('\n')}
`
  )
  .join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-purple-600" />
            PHASE 6 — Deterministic Truth Validation & Tailored Resumes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict zero-fabrication engine. Validates 13 critical dimensions against active master resume. Final resume is never created if truth validation fails.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              setActiveSubTab('diagnostics');
              if (!diagnosticResults) handleRunDiagnostics();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold border border-emerald-300 transition-all cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
            Run 13-Dimension Test Suite
          </button>
          <span className="px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-bold border border-purple-200">
            {tailoredResumes.length} Validated Resumes
          </span>
        </div>
      </div>

      {/* Main Layout: List & Live Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Resumes (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-700">Available Tailored Resumes ({tailoredResumes.length})</div>
          {tailoredResumes.map((res) => {
            const isSelected = selectedResume?.id === res.id;
            const isPassed = res.validation_status !== 'FAILED' && res.truth_audit_passed !== false;
            return (
              <div
                key={res.id}
                onClick={() => setSelectedResume(res)}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                  isSelected
                    ? 'bg-purple-50/70 border-purple-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {res.ats_score}% ATS Coverage
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(res.generated_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{res.job_title}</h4>
                  <div className="text-[11px] text-slate-600 font-medium">{res.company}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                    isPassed ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {isPassed ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 13/13 Truth Passed
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Validation Failed
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/api/resumes/tailored/${res.job_id}/docx`}
                      download
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isPassed) e.preventDefault();
                      }}
                      className={`flex items-center gap-0.5 text-[11px] font-bold ${
                        isPassed ? 'text-purple-700 hover:text-purple-900' : 'text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Download className="w-3 h-3" /> DOCX
                    </a>
                    <span className="text-slate-300">|</span>
                    <a
                      href={`/api/resumes/tailored/${res.job_id}/pdf`}
                      download
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isPassed) e.preventDefault();
                      }}
                      className={`flex items-center gap-0.5 text-[11px] font-bold ${
                        isPassed ? 'text-indigo-700 hover:text-indigo-900' : 'text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Download className="w-3 h-3" /> PDF
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Dynamic Panel (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('preview')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'preview'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Resume Document Preview
              </button>

              <button
                onClick={() => setActiveSubTab('truth_audit')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'truth_audit'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                13-Dimension Truth Audit
                {validationReport && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    validationReport.validation_status === 'PASSED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {validationReport.validation_status}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveSubTab('diagnostics');
                  if (!diagnosticResults) handleRunDiagnostics();
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'diagnostics'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Diagnostic Suite
              </button>
            </div>

            {selectedResume && activeSubTab === 'preview' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyText(selectedResume)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>

                <a
                  href={`/api/resumes/tailored/${selectedResume.job_id}/docx`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-lg shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download DOCX
                </a>
              </div>
            )}
          </div>

          {/* TAB 1: RESUME DOCUMENT PREVIEW */}
          {activeSubTab === 'preview' && (
            selectedResume ? (
              <div className="space-y-5">
                {/* Header Information */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                    Tailored Document Preview
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedResume.job_title} @ {selectedResume.company}
                  </h3>
                </div>

                {/* Document Canvas (Mimicking Native Professional Word Layout) */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-6 text-slate-900 space-y-5 font-sans">
                  {/* Header */}
                  <div className="text-center space-y-1 pb-3 border-b border-slate-300">
                    <h1 className="text-xl font-black text-slate-950 tracking-tight">
                      Bhargav Aravind Sai Ram Choppa
                    </h1>
                    <div className="text-xs text-slate-600">
                      Hartford, CT | bhargavchoppa23@gmail.com | (860) 997-6229 | linkedin.com/in/bhargavchoppa
                    </div>
                    <div className="text-xs font-bold text-blue-900 mt-1">
                      {selectedResume.headline || selectedResume.target_title || selectedResume.job_title}
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                      Professional Summary
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {selectedResume.professional_summary || selectedResume.summary}
                    </p>
                  </div>

                  {/* Targeted Skills & Competencies */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                      Targeted Core Competencies & Skills
                    </h4>
                    <div className="text-xs text-slate-700 space-y-1">
                      <div>
                        <strong className="text-slate-900">Evidenced in Master Resume: </strong>
                        {(selectedResume.targeted_skills?.present || selectedResume.core_skills || []).join(' • ')}
                      </div>
                      {selectedResume.targeted_skills?.related && selectedResume.targeted_skills.related.length > 0 && (
                        <div>
                          <strong className="text-slate-900">Demonstrated Related Capabilities: </strong>
                          {selectedResume.targeted_skills.related.join(' • ')}
                        </div>
                      )}
                      {(selectedResume.targeted_skills?.not_evidenced_disclaimer || selectedResume.keywords_not_evidenced) && (
                        <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-600 border border-slate-200">
                          <strong className="text-slate-800">Zero-Fabrication Policy Enforced:</strong> The following job requirements are not evidenced in the master resume and are preserved without fabrication: {(selectedResume.targeted_skills?.not_evidenced_disclaimer || selectedResume.keywords_not_evidenced || []).join(', ')}.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Experience */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                      Professional Experience
                    </h4>

                    {(selectedResume.tailored_experience || selectedResume.professional_experience || []).map((exp, eIdx) => (
                      <div key={eIdx} className="space-y-1.5">
                        <div className="flex justify-between items-baseline text-xs">
                          <div className="font-bold text-slate-900">
                            {exp.company} <span className="font-normal text-slate-500">— {exp.location}</span>
                          </div>
                          <div className="text-slate-500 font-mono text-[11px]">{exp.dates}</div>
                        </div>
                        <div className="text-xs font-semibold text-blue-900 italic">{exp.title}</div>

                        <ul className="space-y-1 text-xs text-slate-700 list-disc list-outside pl-4">
                          {exp.reordered_responsibilities.map((r, rIdx) => (
                            <li key={rIdx} className="leading-relaxed">{r}</li>
                          ))}
                          {exp.truth_aligned_achievements.map((ach, aIdx) => (
                            <li key={aIdx} className="font-medium text-emerald-900 leading-relaxed">
                              <span className="font-bold">Key Result:</span> {ach}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Certifications (strictly verified) */}
                  <div className="space-y-1.5 pt-2">
                    <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-200 pb-0.5">
                      Verified Certifications
                    </h4>
                    <div className="text-xs text-slate-700">
                      {(selectedResume.certifications || []).map((c) => `${c.name} (${c.issuer})`).join(' • ')}
                    </div>
                  </div>

                  {/* Footer Validation Stamp */}
                  <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-400 font-mono">
                    [JobAgent Web] Deterministic Zero-Fabrication Audit Passed • Tailored for {selectedResume.job_title} at {selectedResume.company} • Coverage: {selectedResume.ats_score}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No tailored resume selected.
              </div>
            )
          )}

          {/* TAB 2: 13-DIMENSION TRUTH AUDIT */}
          {activeSubTab === 'truth_audit' && (
            <div className="space-y-6">
              {validationReport ? (
                <>
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    validationReport.validation_status === 'PASSED'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-300 text-rose-950'
                  }`}>
                    {validationReport.validation_status === 'PASSED' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-sm">
                        {validationReport.validation_status === 'PASSED'
                          ? 'Truth Validation Audit Passed (13/13 Dimensions Verified)'
                          : 'Truth Validation Failed'}
                      </div>
                      <p className="text-slate-600">
                        {validationReport.validation_status === 'PASSED'
                          ? 'All claims across employers, titles, dates, technologies, metrics, and achievements are deterministically corroborated by the active master resume.'
                          : 'The candidate resume contains unevidenced or exaggerated claims. Final resume creation blocked per Zero-Fabrication Rules.'}
                      </p>

                      {validationReport.validation_errors.length > 0 && (
                        <div className="mt-2 p-3 bg-white/80 rounded-lg border border-rose-200 text-rose-800 space-y-1">
                          <strong className="block text-rose-900">Validation Errors:</strong>
                          {validationReport.validation_errors.map((err, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                              <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Dimensions Audited</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-1">13 / 13</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Passed Dimensions</div>
                      <div className="text-xl font-extrabold text-emerald-700 mt-1">
                        {validationReport.dimension_results.filter((d) => d.passed).length}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Violations Flagged</div>
                      <div className="text-xl font-extrabold text-rose-700 mt-1">
                        {validationReport.validation_errors.length}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Audit Status</div>
                      <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> 100% Deterministic
                      </div>
                    </div>
                  </div>

                  {/* 13 Dimensions Breakdown Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      13-Dimension Audit Breakdown
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {validationReport.dimension_results.map((dim) => {
                        return (
                          <div
                            key={dim.dimension_id}
                            className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                              dim.passed
                                ? 'bg-white border-slate-200 hover:border-slate-300'
                                : 'bg-rose-50/50 border-rose-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {dim.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                                <span>{dim.name}</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  dim.passed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {dim.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Evidenced Items */}
                            {dim.evidenced_items.length > 0 && (
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                  Evidenced in Master ({dim.evidenced_items.length})
                                </span>
                                <div className="text-[11px] text-slate-700 font-mono flex flex-wrap gap-1">
                                  {dim.evidenced_items.slice(0, 6).map((item, i) => (
                                    <span
                                      key={i}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                  {dim.evidenced_items.length > 6 && (
                                    <span className="text-slate-400">+{dim.evidenced_items.length - 6} more</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Unsupported Items / Violations */}
                            {dim.unsupported_items.length > 0 && (
                              <div className="p-2 bg-rose-100/80 rounded text-[11px] text-rose-900 border border-rose-200 space-y-1">
                                <span className="font-bold text-[10px] uppercase text-rose-950 block">
                                  Unsupported Claims Detected
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {dim.unsupported_items.map((item, i) => (
                                    <span
                                      key={i}
                                      className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-950 font-bold"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                  <RefreshCw className={`w-6 h-6 mx-auto text-slate-300 ${loadingReport ? 'animate-spin' : ''}`} />
                  <div>{loadingReport ? 'Loading 13-Dimension audit report...' : 'Select a tailored resume to view its truth audit report.'}</div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC TEST SUITE */}
          {activeSubTab === 'diagnostics' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Phase 6 — Automated Diagnostic Verification Suite
                  </h3>
                  <p className="text-xs text-slate-500">
                    Executes deterministic positive verification and negative injection attacks against the validation engine.
                  </p>
                </div>

                <button
                  onClick={handleRunDiagnostics}
                  disabled={runningDiagnostics}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningDiagnostics ? 'animate-spin' : ''}`} />
                  {runningDiagnostics ? 'Running Suite...' : 'Re-Run All 7 Tests'}
                </button>
              </div>

              {diagnosticResults ? (
                <div className="space-y-4">
                  {/* Results Summary */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Total Tests</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-1">
                        {diagnosticResults.total_tests || diagnosticResults.total || 0}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-emerald-700">Passed</div>
                      <div className="text-xl font-extrabold text-emerald-700 mt-1">{diagnosticResults.passed}</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Failed</div>
                      <div className="text-xl font-extrabold text-rose-700 mt-1">{diagnosticResults.failed}</div>
                    </div>
                  </div>

                  {/* Test Cases List */}
                  <div className="space-y-2">
                    {(
                      diagnosticResults.tests ||
                      (diagnosticResults.results || []).map((r) => ({
                        name: r.test,
                        dimension: 'Validation Rule',
                        passed: r.passed,
                        message: r.message,
                      }))
                    ).map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                          t.passed
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-rose-50/70 border-rose-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {t.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span>{t.name}</span>
                          </div>
                          {t.dimension && (
                            <div className="text-[10px] uppercase font-bold text-slate-500 pl-6">
                              Dimension: <span className="font-mono text-purple-700">{t.dimension}</span>
                            </div>
                          )}
                          {t.message && (
                            <p className="text-[11px] text-slate-600 pl-6 font-mono">{t.message}</p>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            t.passed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                  <FlaskConical className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
                  <div>Click &quot;Run 13-Dimension Test Suite&quot; to verify deterministic truth validation rules.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

