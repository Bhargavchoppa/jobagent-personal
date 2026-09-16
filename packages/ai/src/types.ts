/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AiProviderType = 'gemini' | 'ollama';

export interface SystemAiSettings {
  provider: AiProviderType;
  // Ollama configuration
  ollamaUrl: string;
  ollamaModel: string;
  // Gemini configuration
  geminiModel: string;
  // Common operational parameters
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
