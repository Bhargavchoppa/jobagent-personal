/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core Enums
export enum MatchCategory {
  STRONG_MATCH = 'strong_match',     // 75% - 100%
  TAILOR_RESUME = 'tailor_resume',   // 60% - 74%
  REVIEW_LATER = 'review_later',     // 50% - 59%
  REJECT = 'reject',                 // < 50%
}

export enum ApplicationStatus {
  SAVED = 'SAVED',
  TAILORED = 'TAILORED',
  APPLIED = 'APPLIED',
  INTERVIEWING = 'INTERVIEWING',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
}

export enum AtsKeywordCategory {
  PRESENT = 'present',               // Evidenced in master resume
  RELATED = 'related',               // Equivalent/transferrable
  NOT_EVIDENCED = 'not_evidenced',   // Flagged; strictly NEVER fabricated
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// User & Auth Types
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthContext {
  userId: string;
  email: string;
  isAuthenticated: boolean;
  tokenType: 'bearer' | 'session';
}

// Health & Diagnostic Types
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
}

export interface DatabaseConnectionResult {
  connected: boolean;
  status: 'connected' | 'fallback_ready' | 'error';
  provider: 'postgresql' | 'in_memory_relational';
  host?: string;
  database?: string;
  latencyMs: number;
  tablesVerified: string[];
  totalRecordsCount: number;
  message: string;
}

export interface GeminiConnectionResult {
  connected: boolean;
  status: 'connected' | 'unconfigured' | 'fallback_ready' | 'error';
  model: string;
  latencyMs: number;
  promptInjectionDefenseActive: boolean;
  backendOnlyConfirmed: boolean;
  message: string;
}

export interface SecurityAuditResult {
  passed: boolean;
  clientEnvClean: boolean;
  backendSecretsIsolated: boolean;
  exposedKeysCount: number;
  findings: Array<{
    target: string;
    status: 'pass' | 'fail' | 'warn';
    detail: string;
  }>;
}

export interface SystemDiagnosticReport {
  timestamp: string;
  service: string;
  nodeVersion: string;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  database: DatabaseConnectionResult;
  gemini: GeminiConnectionResult;
  security: SecurityAuditResult;
  auth: {
    authReady: boolean;
    provider: string;
    activeUser: string;
  };
}

export type AiProviderType = 'gemini' | 'ollama';

export interface SystemAiSettings {
  provider: AiProviderType;
  ollamaUrl: string;
  ollamaModel: string;
  geminiModel: string;
  temperature: number;
  maxTokens: number;
}

export interface AiModelProbeResult {
  connected: boolean;
  provider: AiProviderType;
  model: string;
  latencyMs: number;
  status: 'connected' | 'unconfigured' | 'offline' | 'error';
  message: string;
  endpoint?: string;
  modelsAvailable?: string[];
}
