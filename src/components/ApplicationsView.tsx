/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Briefcase,
  Download,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { ApplicationRecord, ApplicationStatus, JobPosting, TailoredResume } from '../types';

interface ApplicationsViewProps {
  applications: ApplicationRecord[];
  jobs: JobPosting[];
  tailoredResumes: TailoredResume[];
  onUpdateStatus: (jobId: string, status: ApplicationStatus, notes?: string) => Promise<void>;
  onSelectJob: (job: JobPosting) => void;
}

const STAGES: ApplicationStatus[] = [
  'Saved',
  'Tailored',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
];

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  jobs,
  tailoredResumes,
  onUpdateStatus,
  onSelectJob,
}) => {
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const getJob = (jobId: string) => jobs.find((j) => j.job_id === jobId);
  const getTailored = (jobId: string) => tailoredResumes.find((r) => r.job_id === jobId);

  const handleSaveNote = async () => {
    if (!selectedApp || !noteInput.trim()) return;
    setSavingNote(true);
    try {
      await onUpdateStatus(selectedApp.job_id, selectedApp.status, noteInput.trim());
      setNoteInput('');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Active Application Tracking Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track opportunities from tailored resume generation through portal submission and multi-round interviews.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-200">
            {applications.length} Tracked Opportunities
          </span>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const items = applications.filter((a) => a.status === stage);

          return (
            <div
              key={stage}
              className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col min-h-[500px]"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {stage}
                </span>
                <span className="text-[10px] font-bold bg-white text-slate-600 px-1.5 py-0.5 rounded-full border border-slate-200">
                  {items.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {items.map((app) => {
                  const job = getJob(app.job_id);
                  const tailored = getTailored(app.job_id);

                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-3 shadow-2xs cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-blue-700">{app.country}</span>
                        <span className="text-slate-400">
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {app.job_title}
                        </h4>
                        <div className="text-[11px] text-slate-600 font-medium">{app.company}</div>
                      </div>

                      {/* Tailored link & status stepper */}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        {tailored ? (
                          <a
                            href={`/api/resumes/tailored/${app.job_id}/docx`}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="text-purple-700 font-bold flex items-center gap-0.5 hover:underline"
                          >
                            <Download className="w-2.5 h-2.5" /> DOCX
                          </a>
                        ) : (
                          <span className="text-slate-400">No tailored doc</span>
                        )}

                        {/* Quick stage transition button */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={app.status}
                            onChange={(e) =>
                              onUpdateStatus(app.job_id, e.target.value as ApplicationStatus)
                            }
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-slate-400 italic">
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recruiter Notes & Timeline Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedApp.job_title}</h3>
                <div className="text-xs text-slate-600">
                  {selectedApp.company} • Status: <strong className="text-blue-700">{selectedApp.status}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Event Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Application Events Timeline
              </h4>
              <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 border border-slate-200 text-xs">
                {(selectedApp.timeline || []).map((evt) => (
                  <div key={evt.id} className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        {evt.event_type} — {new Date(evt.timestamp).toLocaleString()}
                      </div>
                      <div className="text-slate-600 text-[11px]">{evt.description}</div>
                    </div>
                  </div>
                ))}
                {(!selectedApp.timeline || selectedApp.timeline.length === 0) && (
                  <div className="text-slate-400 italic text-[11px]">
                    Status: {selectedApp.status} (Updated {new Date(selectedApp.updated_at).toLocaleDateString()})
                  </div>
                )}
              </div>
            </div>

            {/* Add Recruiter Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Add Recruiter / Interview Note</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Phone screen scheduled for Thursday 2pm..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote || !noteInput.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Note
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
