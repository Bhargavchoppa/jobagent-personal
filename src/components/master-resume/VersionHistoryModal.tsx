/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  CheckCircle2,
  Lock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  FileCheck2,
} from 'lucide-react';
import { ResumeVersion, MasterResume } from '../../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateVersion: (versionNum: number) => Promise<void>;
  onSelectVersionSnapshot: (resume: MasterResume) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  onActivateVersion,
  onSelectVersionSnapshot,
}) => {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activatingVer, setActivatingVer] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/master-resume/versions');
      if (!res.ok) throw new Error('Failed to load version history');
      const data = await res.json();
      setVersions(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActivate = async (versionNum: number) => {
    setActivatingVer(versionNum);
    setError(null);
    try {
      await onActivateVersion(versionNum);
      await fetchVersions();
    } catch (err: any) {
      setError(err.message || 'Failed to activate version');
    } finally {
      setActivatingVer(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Master Resume Version History</h3>
              <p className="text-xs text-slate-500">
                Audit trail of verified master resume revisions and active Source of Truth status.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Single Active Source Rule:</strong> Exactly one master resume version is active at any time. Tailoring and matching operations pull strictly from this active version and never alter it.
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Loading resume versions...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No version history records found.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((ver) => {
                const isActive = ver.is_active;
                return (
                  <div
                    key={ver.id || ver.version}
                    className={`border rounded-xl p-4 transition-all ${
                      isActive
                        ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900">
                            Version v{ver.version}
                          </span>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> ACTIVE SOURCE OF TRUTH
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              Archived
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full">
                            Source: {ver.source.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 mt-1.5 font-medium">{ver.note}</p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(ver.timestamp).toLocaleString()}
                          </span>
                          {ver.inconsistency_count > 0 ? (
                            <span className="flex items-center gap-1 text-amber-700 font-semibold">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              {ver.inconsistency_count} Discrepancy Audited
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              Zero Discrepancies
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 sm:justify-end">
                        <button
                          onClick={() => {
                            if (ver.snapshot) {
                              onSelectVersionSnapshot(ver.snapshot);
                              onClose();
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          View Snapshot
                        </button>

                        {!isActive && (
                          <button
                            onClick={() => handleActivate(ver.version)}
                            disabled={activatingVer === ver.version}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                          >
                            {activatingVer === ver.version ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Make Active
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
