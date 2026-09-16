/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Info,
  Filter,
  Search,
  Download,
} from 'lucide-react';
import { SystemAuditLog } from '../types';

interface SystemLogsViewProps {
  logs: SystemAuditLog[];
}

export const SystemLogsView: React.FC<SystemLogsViewProps> = ({ logs }) => {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
    if (
      searchQuery &&
      !log.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.module.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const downloadLogs = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jobagent_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-700" />
            System Audit & Security Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry tracking discovery, deduplication, 5-component matching, ATS tailoring, and prompt-injection defense.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON Logs
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search log messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Level:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-800"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Module:</span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-800"
            >
              <option value="all">All Modules</option>
              <option value="DISCOVERY">Discovery</option>
              <option value="DEDUPE">Deduplication</option>
              <option value="MATCHING">Matching</option>
              <option value="ATS_TAILOR">ATS Tailor</option>
              <option value="PROMPT_GUARD">Prompt Guard</option>
              <option value="DATABASE">Database</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / Terminal View */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-md font-mono text-xs text-slate-300 space-y-2 max-h-[650px] overflow-y-auto">
        {filteredLogs.map((log) => {
          let levelColor = 'text-blue-400';
          if (log.level === 'warn') levelColor = 'text-amber-400';
          if (log.level === 'error') levelColor = 'text-red-400';
          if (log.level === 'security') levelColor = 'text-emerald-400 font-bold';

          return (
            <div
              key={log.id}
              className="py-1.5 border-b border-slate-900/80 flex flex-col sm:flex-row sm:items-start gap-2 hover:bg-slate-900/40 transition-colors"
            >
              <span className="text-slate-500 shrink-0 text-[11px]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>

              <span
                className={`uppercase text-[10px] px-1.5 py-0.5 rounded shrink-0 ${levelColor} bg-slate-900 border border-slate-800`}
              >
                {log.level}
              </span>

              <span className="text-purple-400 font-semibold shrink-0 text-[11px]">
                [{log.module}]
              </span>

              <span className="text-slate-200 flex-1 leading-relaxed">{log.message}</span>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="py-12 text-center text-slate-500 italic">
            No system audit logs found matching current filters.
          </div>
        )}
      </div>
    </div>
  );
};
