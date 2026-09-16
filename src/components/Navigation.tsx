/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Search,
  Globe2,
  Building2,
  FileText,
  Sparkles,
  CheckCircle2,
  Briefcase,
  Sliders,
  Terminal,
  AlertTriangle,
  FileCheck2,
  Layers,
} from 'lucide-react';
import { LiveJobSearchState, MasterResume } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'search'
  | 'india-jobs'
  | 'usa-jobs'
  | 'job-matching'
  | 'master-resume'
  | 'tailored-resumes'
  | 'ats-analysis'
  | 'applications'
  | 'settings'
  | 'system-logs';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchState: LiveJobSearchState;
  masterResume: MasterResume | null;
  jobsCount: { total: number; usa: number; india: number; tailored: number; applications: number };
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  searchState,
  masterResume,
  jobsCount,
}) => {
  const isSearching = searchState.status === 'searching' || searchState.status === 'matching' || searchState.status === 'tailoring';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    {
      id: 'search',
      label: 'Job Discovery',
      icon: Search,
      badge: isSearching ? 'Running' : null,
      badgeColor: 'bg-emerald-500 text-white animate-pulse',
    },
    { id: 'usa-jobs', label: 'USA Jobs', icon: Building2, badge: jobsCount.usa },
    { id: 'india-jobs', label: 'India Jobs', icon: Globe2, badge: jobsCount.india },
    { id: 'job-matching', label: 'Job Matching', icon: Layers, badge: `${jobsCount.tailored} Tailored` },
    {
      id: 'master-resume',
      label: 'Master Resume',
      icon: FileText,
      hasWarning: Boolean(masterResume?.inconsistency_flags?.length),
    },
    { id: 'tailored-resumes', label: 'Tailored Resumes', icon: FileCheck2, badge: jobsCount.tailored },
    { id: 'ats-analysis', label: 'ATS Analysis', icon: Sparkles, badge: '~95% Target' },
    { id: 'applications', label: 'Applications', icon: Briefcase, badge: jobsCount.applications },
    { id: 'settings', label: 'Settings', icon: Sliders, badge: null },
    { id: 'system-logs', label: 'System Logs', icon: Terminal, badge: null },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col h-screen shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            JA
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              JOBAGENT <span className="text-blue-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800">WEB</span>
            </h1>
            <p className="text-xs text-slate-400">Verified AI Career Agent</p>
          </div>
        </div>

        {/* Candidate Profile Quick Pill */}
        {masterResume && (
          <div className="mt-3 p-2 bg-slate-800/80 rounded-md border border-slate-700/60 text-xs">
            <div className="font-medium text-slate-200 truncate">{masterResume.personal_information.full_name}</div>
            <div className="text-slate-400 text-[11px] truncate">~{masterResume.total_experience_years} yrs • BA / PO / PM</div>
            {masterResume.inconsistency_flags?.length > 0 && (
              <div className="mt-1 flex items-center gap-1 text-amber-400 text-[10px] font-medium">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>PMP header audit flag</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.hasWarning && (
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" title="Flagged Header Inconsistency" />
                )}
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    item.badgeColor
                      ? item.badgeColor
                      : isActive
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Zero-Fabrication Mode
          </span>
          <span className="text-emerald-400 font-medium">Active</span>
        </div>
        <div className="text-[10px] text-slate-500">
          Threshold Gate: <span className="text-slate-300 font-mono">≥60%</span> • ATS Target: <span className="text-slate-300 font-mono">~95%</span>
        </div>
      </div>
    </aside>
  );
};
