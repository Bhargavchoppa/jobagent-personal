/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { InconsistencyFlag, MasterResume } from '../../types';

interface InconsistencyBannerProps {
  flags: InconsistencyFlag[];
  resume: MasterResume;
  onResolveFlag?: (flag: InconsistencyFlag) => void;
}

export const InconsistencyBanner: React.FC<InconsistencyBannerProps> = ({
  flags,
  resume,
  onResolveFlag,
}) => {
  if (!flags || flags.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Zero Discrepancies:</strong> All headers, credentials, and experience timelines pass cross-section verification.
          </span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
          Passed Audit
        </span>
      </div>
    );
  }

  // Check specifically if PMP inconsistency is present
  const pmpFlag = flags.find(
    (f) =>
      f.code === 'HEADER_CERTIFICATION_MISMATCH' ||
      f.title.toLowerCase().includes('pmp') ||
      f.id.includes('PMP')
  );

  return (
    <div className="space-y-3">
      {/* Primary Flag Banner */}
      <div className="bg-amber-50 border-2 border-amber-400/80 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                Potential resume inconsistency — verify PMP certification.
              </h3>
              <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                High Priority Audit Warning
              </span>
            </div>

            <div className="text-xs text-amber-900 grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 bg-white/90 border border-amber-200 rounded-lg">
                <div className="font-bold text-[11px] text-amber-800 uppercase tracking-wider">
                  Header:
                </div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {resume.personal_information.header_positioning || 'Positioning mentions PMP'}
                </div>
              </div>

              <div className="p-2.5 bg-white/90 border border-amber-200 rounded-lg">
                <div className="font-bold text-[11px] text-amber-800 uppercase tracking-wider">
                  Certification section:
                </div>
                <div className="font-semibold text-rose-700 mt-0.5">
                  PMP not listed
                </div>
              </div>
            </div>

            <div className="mt-2 p-3 bg-white/95 border-l-4 border-amber-500 rounded-r-lg text-xs space-y-1">
              <div className="font-bold text-amber-950">
                Display:
              </div>
              <div className="text-slate-800 font-medium italic">
                "Potential resume inconsistency — verify PMP certification."
              </div>
              <div className="text-amber-900 font-bold pt-1 text-[11px] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Enforced Directive: Do NOT automatically add PMP.</span>
              </div>
              <p className="text-[11px] text-slate-600">
                The platform protects factual integrity. If the candidate has not earned the PMP credential or verified it in the certification catalog, the tailoring engine will never inject PMP into tailored resumes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Other flags if any */}
      {flags.filter((f) => f !== pmpFlag).map((flag) => (
        <div
          key={flag.id}
          className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-start justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">{flag.title}</div>
              <div className="text-slate-600 mt-0.5">{flag.description}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                <strong>Rule:</strong> {flag.resolution_rule}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-semibold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded shrink-0">
            {flag.severity}
          </span>
        </div>
      ))}
    </div>
  );
};
