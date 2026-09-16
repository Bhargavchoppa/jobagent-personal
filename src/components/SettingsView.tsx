/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  Cpu,
  Layers,
  AlertTriangle,
  RefreshCw,
  Server,
  CheckCircle2,
  XCircle,
  Laptop,
  Terminal,
  Download,
  Play,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { TARGET_ROLE_OPTIONS } from './JobSearchView';
import { SystemAiSettings, AiModelProbeResult } from '../types';

interface SettingsViewProps {
  onDataReset?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataReset }) => {
  const [targetRoles] = useState<string[]>(TARGET_ROLE_OPTIONS);
  
  // AI Settings State
  const [aiSettings, setAiSettings] = useState<SystemAiSettings>({
    provider: 'ollama',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'qwen3.8:latest',
    geminiModel: 'gemini-3.8-flash',
    temperature: 0.2,
    maxTokens: 4096,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testingOllama, setTestingOllama] = useState<boolean>(false);
  const [testingGemini, setTestingGemini] = useState<boolean>(false);
  const [ollamaProbe, setOllamaProbe] = useState<AiModelProbeResult | null>(null);
  const [geminiProbe, setGeminiProbe] = useState<AiModelProbeResult | null>(null);
  const [showLocalGuide, setShowLocalGuide] = useState<boolean>(true);
  const [clearingData, setClearingData] = useState<boolean>(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  // Load current AI settings from backend
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/ai');
      if (res.ok) {
        const data = await res.json();
        setAiSettings(data);
      }
    } catch (e) {
      console.warn('Failed to load AI settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (override?: Partial<SystemAiSettings>) => {
    setSaving(true);
    setSaveSuccess(false);
    const toSave = { ...aiSettings, ...(override || {}) };
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });
      if (res.ok) {
        const updated = await res.json();
        setAiSettings(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const testOllama = async () => {
    setTestingOllama(true);
    setOllamaProbe(null);
    try {
      const res = await fetch('/api/settings/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ollama',
          ollamaUrl: aiSettings.ollamaUrl,
          ollamaModel: aiSettings.ollamaModel,
        }),
      });
      const data: AiModelProbeResult = await res.json();
      setOllamaProbe(data);
    } catch (e: any) {
      setOllamaProbe({
        connected: false,
        provider: 'ollama',
        model: aiSettings.ollamaModel,
        latencyMs: 0,
        status: 'error',
        message: `Connection error: ${e.message}`,
      });
    } finally {
      setTestingOllama(false);
    }
  };

  const testGemini = async () => {
    setTestingGemini(true);
    setGeminiProbe(null);
    try {
      const res = await fetch('/api/settings/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
        }),
      });
      const data: AiModelProbeResult = await res.json();
      setGeminiProbe(data);
    } catch (e: any) {
      setGeminiProbe({
        connected: false,
        provider: 'gemini',
        model: aiSettings.geminiModel,
        latencyMs: 0,
        status: 'error',
        message: `Connection error: ${e.message}`,
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleCleanSlate = async (preserveMaster: boolean = true) => {
    const confirmMsg = preserveMaster
      ? 'Are you sure you want to clear all dummy/discovered jobs, match scores, tailored resumes, and applications? Your Master Resume will be kept safe.'
      : 'Are you sure you want to completely wipe all records and restore the seed baseline?';
    if (!window.confirm(confirmMsg)) return;

    setClearingData(true);
    setClearSuccess(null);
    try {
      const res = await fetch('/api/database/clean-slate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preserveMaster }),
      });
      if (res.ok) {
        setClearSuccess('Database successfully reset to a clean slate! All dummy job and tailored data removed.');
        if (onDataReset) {
          onDataReset();
        }
      } else {
        const data = await res.json();
        alert(`Failed to reset database: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Network error resetting database: ${e.message}`);
    } finally {
      setClearingData(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-slate-700" />
            System Configuration & AI Model Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure local Ollama execution (qwen3.8:latest), cloud fallback, matching parameters, and ATS optimization targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            onClick={() => handleSaveSettings()}
            disabled={saving}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Save Settings
          </button>
        </div>
      </div>

      {/* Primary Local AI Provider Configuration Card */}
      <div className="bg-white border-2 border-slate-900/20 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Primary AI Backend Provider
                {aiSettings.provider === 'ollama' ? (
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Local Ollama Active
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Google Gemini Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Choose between your laptop's local Ollama instance (<code className="text-slate-800 font-mono font-semibold">qwen3.8:latest</code>) or Google Gemini.
              </p>
            </div>
          </div>

          {/* Provider Toggle Pill */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => {
                const next = { ...aiSettings, provider: 'ollama' as const };
                setAiSettings(next);
                handleSaveSettings(next);
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                aiSettings.provider === 'ollama'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> Local Ollama (qwen3.8)
            </button>
            <button
              onClick={() => {
                const next = { ...aiSettings, provider: 'gemini' as const };
                setAiSettings(next);
                handleSaveSettings(next);
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                aiSettings.provider === 'gemini'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Google Gemini
            </button>
          </div>
        </div>

        {/* Ollama Parameter Form */}
        <div className={`p-4 rounded-xl border ${aiSettings.provider === 'ollama' ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50 border-slate-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-700" />
              <span className="text-xs font-bold text-slate-900">Local Ollama Configuration</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Runs on your local laptop machine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Local Model Tag
              </label>
              <input
                type="text"
                value={aiSettings.ollamaModel}
                onChange={(e) => setAiSettings({ ...aiSettings, ollamaModel: e.target.value })}
                placeholder="qwen3.8:latest"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Your preferred local model is configured as: <span className="font-mono font-bold text-indigo-700">qwen3.8:latest</span>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ollama Daemon Endpoint URL
              </label>
              <input
                type="text"
                value={aiSettings.ollamaUrl}
                onChange={(e) => setAiSettings({ ...aiSettings, ollamaUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Default daemon host on local laptops is <span className="font-mono">http://localhost:11434</span>
              </p>
            </div>
          </div>

          {/* Test Ollama Button & Diagnostic Feedback */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/60">
            <button
              onClick={testOllama}
              disabled={testingOllama}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all self-start"
            >
              {testingOllama ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Test Local Ollama Connection
            </button>

            {ollamaProbe && (
              <div className="text-xs flex flex-col gap-1.5 w-full">
                {ollamaProbe.connected ? (
                  <span className="text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> {ollamaProbe.message}
                  </span>
                ) : (
                  <div className="text-amber-900 bg-amber-50 border border-amber-300 p-3 rounded-md space-y-1.5 text-[11px]">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      Unable to connect to Ollama daemon at {aiSettings.ollamaUrl}
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      <strong>Why this happens in Cloud Preview:</strong> The preview runs in a cloud sandbox container, so its backend cannot reach <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">http://localhost:11434</code> on your personal laptop.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      <strong>Once you run the project on your laptop:</strong> Both the Node.js server and Ollama will run on the same machine, allowing seamless local communication. If you start Ollama locally, set <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">OLLAMA_ORIGINS="*" ollama serve</code> to enable connections.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Gemini Parameter Form */}
        <div className={`p-4 rounded-xl border ${aiSettings.provider === 'gemini' ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-50 border-slate-200'} space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-slate-900">Google Gemini Configuration</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Cloud fallback provider</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Gemini Model
              </label>
              <input
                type="text"
                value={aiSettings.geminiModel}
                onChange={(e) => setAiSettings({ ...aiSettings, geminiModel: e.target.value })}
                placeholder="gemini-3.8-flash"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                API Key Management
              </label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs flex items-center justify-between">
                <span>process.env.GEMINI_API_KEY</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-sans font-bold">
                  Backend Secure
                </span>
              </div>
            </div>
          </div>

          {/* Test Gemini Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/60">
            <button
              onClick={testGemini}
              disabled={testingGemini}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all self-start"
            >
              {testingGemini ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Test Gemini Connection
            </button>

            {geminiProbe && (
              <div className="text-xs flex items-center gap-1.5">
                {geminiProbe.connected ? (
                  <span className="text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {geminiProbe.message}
                  </span>
                ) : (
                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {geminiProbe.message}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-Step Local Setup Guide for Laptop Execution */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-400" />
            How to Run This Project on Your Laptop with Local Ollama (qwen3.8:latest)
          </h3>
          <span className="text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
            Zero Cloud Dependency
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Follow these exact steps after downloading the ZIP export from the top Settings menu to run completely locally on your laptop without any changes to Google Cloud:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Step 1 & 2 */}
          <div className="space-y-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">1</span>
                Download & Extract ZIP
              </div>
              <p className="text-slate-400 text-[11px]">
                In the AI Studio header, click <strong>Settings &gt; Export to ZIP</strong>. Unzip the archive into any folder on your laptop (e.g. <code className="text-emerald-300">~/jobagent-local</code>).
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">2</span>
                Install Ollama & Pull qwen3.8
              </div>
              <p className="text-slate-400 text-[11px]">
                Install Ollama from <span className="text-emerald-300">ollama.com</span>, then open your laptop terminal and run:
              </p>
              <pre className="bg-slate-950 p-2 rounded text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
# Pull the exact Qwen 3.8 model
ollama pull qwen3.8:latest

# Ensure Ollama daemon is running (default port 11434)
ollama serve
              </pre>
            </div>
          </div>

          {/* Step 3 & 4 */}
          <div className="space-y-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">3</span>
                Create Your Local .env File
              </div>
              <p className="text-slate-400 text-[11px]">
                In the unzipped project root directory, copy <code className="text-emerald-300">.env.example</code> to <code className="text-emerald-300">.env</code>:
              </p>
              <pre className="bg-slate-950 p-2 rounded text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
# Set your local Ollama configuration:
OLLAMA_API_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3.8:latest"
              </pre>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">4</span>
                Install Dependencies & Run Locally
              </div>
              <p className="text-slate-400 text-[11px]">
                In the project folder, run npm install and boot the local server:
              </p>
              <pre className="bg-slate-950 p-2 rounded text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
npm install
npm run dev

# Open in your browser:
# http://localhost:3000
              </pre>
            </div>
          </div>
        </div>

        <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-[11px] text-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong>100% Local &amp; Private:</strong> Once running on your laptop, all resume parsing, 5-component semantic matching, and ~95% truthful tailoring will route directly to your local Ollama process at <code className="font-mono text-white">http://localhost:11434</code> without sending candidate or job data to any third-party cloud.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: 5-Component Matching Algorithm Weights */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> 5-Component Algorithm Weightings
            </h3>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              Sum = 100%
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Semantic Similarity</span>
                <span className="font-mono text-blue-700">35%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Skills & Technologies</span>
                <span className="font-mono text-emerald-700">25%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Responsibilities & Duties</span>
                <span className="font-mono text-indigo-700">20%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Industry & Domain Relevance</span>
                <span className="font-mono text-amber-700">10%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Role & Title Relevance</span>
                <span className="font-mono text-purple-700">10%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
            <strong>Hard Gate Protocol:</strong> Once a match score reaches ≥60%, the system automatically tailors the resume. The AI model's purpose is semantic interpretation, extraction, and optimization—never secondary rejection.
          </div>
        </div>

        {/* Card 2: Security & Zero-Fabrication Rules */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security &amp; Zero-Fabrication Integrity
            </h3>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1">
              Active Policy
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Active Model</span>
              <span className="font-mono font-bold text-slate-800">
                {aiSettings.provider === 'ollama' ? aiSettings.ollamaModel : aiSettings.geminiModel}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Local Execution Mode</span>
              <span className="text-indigo-700 font-semibold">
                {aiSettings.provider === 'ollama' ? 'Enabled (Ollama Direct)' : 'Cloud API Mode'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Prompt Injection Shield</span>
              <span className="text-emerald-700 font-semibold">Active & Neutralizing</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">ATS Coverage Target</span>
              <span className="font-bold text-indigo-700">~95% Truthful Coverage</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Candidate Verification Rule (PMP)
            </div>
            <p>
              The candidate's header references PMP, but the certification section lacks an independent credential record. The system enforces strict integrity: PMP will not be hallucinated into tailored certifications.
            </p>
          </div>
        </div>

        {/* Card 3: Target Role Taxonomy */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Target Role Discovery Taxonomy ({targetRoles.length} Roles)
          </h3>
          <p className="text-xs text-slate-500">
            These roles are queried concurrently during USA and India job discovery runs:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {targetRoles.map((role) => (
              <span
                key={role}
                className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-md font-medium"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: Database Storage & Clean Slate Management */}
        <div className="lg:col-span-2 bg-white border border-rose-200/80 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" /> Database &amp; Clean Slate Operations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Remove all pre-seeded dummy jobs, generated tailored resumes, and application tracking records to start completely fresh.
              </p>
            </div>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
              Data Management
            </span>
          </div>

          {clearSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{clearSuccess}</span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-800">Clear All Jobs & Start Clean Slate (Keep Master Resume)</div>
              <p className="text-[11px] text-slate-500 max-w-xl">
                Wipes all dummy USA/India jobs, match ratings, tailored docx/pdf outputs, and application statuses. Leaves your master resume completely untouched so you can discover real jobs right away.
              </p>
            </div>
            <button
              onClick={() => handleCleanSlate(true)}
              disabled={clearingData}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:bg-rose-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearingData ? 'Clearing Records...' : 'Clear All Dummy Jobs'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
