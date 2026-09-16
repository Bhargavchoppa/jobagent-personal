/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, FileCheck2, Info } from 'lucide-react';
import { MasterResume } from '../../types';

interface SourceOfTruthBadgeProps {
  resume: MasterResume;
  onOpenVersions: () => void;
  onUploadNew: () => void;
  onEditResume: () => void;
}

export const SourceOfTruthBadge: React.FC<SourceOfTruthBadgeProps> = ({
  resume,
  onOpenVersions,
  onUploadNew,
  onEditResume,
}) => {
  const isSeed = resume.is_seed_data || resume.source_of_truth?.source === 'seed_specification';
  const isActive = resume.is_active !== false;

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Single Source of Truth
              </span>
              {isActive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE VERSION
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-full">
                  HISTORICAL VERSION
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                <FileCheck2 className="w-3 h-3" /> v{resume.version}
              </span>
              {isSeed && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  Seed Specification Reference
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Verified Master Resume: {resume.personal_information.full_name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <button
            onClick={onOpenVersions}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            Version History
          </button>
          <button
            onClick={onUploadNew}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            Upload PDF/DOCX
          </button>
          <button
            onClick={onEditResume}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            Edit Master Resume
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            <strong>Immutability Guarantee:</strong> The active master resume is never modified automatically during tailoring. Only explicit user verification updates this truth.
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Last Verified: {new Date(resume.last_updated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
