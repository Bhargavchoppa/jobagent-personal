/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { SystemAiSettings, AiModelProbeResult } from './types';

dotenv.config();

export interface AiGenerateOptions {
  systemInstruction?: string;
  responseMimeType?: 'application/json' | 'text/plain';
  temperature?: number;
  maxTokens?: number;
}

export interface AiGenerateResult {
  text: string;
  provider: 'gemini' | 'ollama';
  model: string;
  latencyMs: number;
}

export class AiRouterService {
  private static instance: AiRouterService;
  private settings: SystemAiSettings = {
    provider: 'ollama', // Default to user-preferred local Ollama
    ollamaUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'qwen3.8:latest',
    geminiModel: 'gemini-3.8-flash',
    temperature: 0.2,
    maxTokens: 4096,
  };

  private geminiClient: GoogleGenAI | null = null;

  constructor() {
    this.initGemini();
  }

  public static getInstance(): AiRouterService {
    if (!AiRouterService.instance) {
      AiRouterService.instance = new AiRouterService();
    }
    return AiRouterService.instance;
  }

  private initGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.geminiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.warn('[AiRouter] Failed to initialize GoogleGenAI client:', err);
        this.geminiClient = null;
      }
    } else {
      this.geminiClient = null;
    }
  }

  public getSettings(): SystemAiSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SystemAiSettings>): SystemAiSettings {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    return { ...this.settings };
  }

  public getActiveProvider(): 'gemini' | 'ollama' {
    return this.settings.provider;
  }

  public getActiveModel(): string {
    return this.settings.provider === 'ollama'
      ? this.settings.ollamaModel
      : this.settings.geminiModel;
  }

  /**
   * Prompt Injection Defense Sanitizer
   */
  public sanitizeInput(untrustedInput: string): string {
    if (!untrustedInput) return '';
    const defanged = untrustedInput
      .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, '[DEFANGED_INSTRUCTION]')
      .replace(/system\s+prompt/gi, '[DEFANGED_TERM]')
      .replace(/you\s+are\s+now/gi, '[DEFANGED_ROLE]');
    return `<untrusted_data>\n${defanged}\n</untrusted_data>`;
  }

  /**
   * Generate content using currently configured provider (Ollama or Gemini)
   */
  public async generateContent(
    prompt: string,
    options: AiGenerateOptions = {}
  ): Promise<AiGenerateResult> {
    const startTime = Date.now();

    if (this.settings.provider === 'ollama') {
      return this.generateWithOllama(prompt, options, startTime);
    } else {
      return this.generateWithGemini(prompt, options, startTime);
    }
  }

  /**
   * Call local Ollama API (/api/generate or /api/chat)
   */
  private async generateWithOllama(
    prompt: string,
    options: AiGenerateOptions,
    startTime: number
  ): Promise<AiGenerateResult> {
    const endpoint = `${this.settings.ollamaUrl.replace(/\/$/, '')}/api/generate`;
    const model = this.settings.ollamaModel;

    const requestBody: any = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? this.settings.temperature,
      },
    };

    if (options.systemInstruction) {
      requestBody.system = options.systemInstruction;
    }

    if (options.responseMimeType === 'application/json') {
      requestBody.format = 'json';
    }

    // Set a 45 second timeout for local LLM inference
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(
          `Ollama returned HTTP ${response.status}: ${errText || response.statusText}`
        );
      }

      const data: any = await response.json();
      const text = data.response || '';
      const latencyMs = Date.now() - startTime;

      return {
        text,
        provider: 'ollama',
        model,
        latencyMs,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Ollama request timed out after 45 seconds on model "${model}".`);
      }
      throw new Error(`Failed to connect to local Ollama at ${endpoint}: ${err.message}`);
    }
  }

  /**
   * Call Google Gemini API
   */
  private async generateWithGemini(
    prompt: string,
    options: AiGenerateOptions,
    startTime: number
  ): Promise<AiGenerateResult> {
    if (!this.geminiClient) {
      this.initGemini();
    }

    if (!this.geminiClient) {
      throw new Error('Google Gemini API Key is not configured in environment (GEMINI_API_KEY).');
    }

    const model = this.settings.geminiModel;

    const callPromise = this.geminiClient.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: options.systemInstruction,
        responseMimeType: options.responseMimeType,
        temperature: options.temperature ?? this.settings.temperature,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 25s')), 25000)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    const text = (response.text || '').trim();
    const latencyMs = Date.now() - startTime;

    return {
      text,
      provider: 'gemini',
      model,
      latencyMs,
    };
  }

  /**
   * Test connection to configured Ollama endpoint
   */
  public async testOllamaConnection(
    overrideUrl?: string,
    overrideModel?: string
  ): Promise<AiModelProbeResult> {
    const url = (overrideUrl || this.settings.ollamaUrl).replace(/\/$/, '');
    const model = overrideModel || this.settings.ollamaModel;
    const startTime = Date.now();

    try {
      // 1. Check if Ollama tags endpoint is responsive
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const tagsRes = await fetch(`${url}/api/tags`, {
        signal: controller.signal,
      }).catch((e) => {
        throw new Error(`Connection refused to ${url}. Is Ollama running? (${e.message})`);
      });

      clearTimeout(timeoutId);

      if (!tagsRes.ok) {
        return {
          connected: false,
          provider: 'ollama',
          model,
          latencyMs: Date.now() - startTime,
          status: 'error',
          endpoint: url,
          message: `Ollama daemon returned HTTP ${tagsRes.status}`,
        };
      }

      const tagsData: any = await tagsRes.json();
      const availableModels: string[] = (tagsData.models || []).map((m: any) => m.name || m.model);

      const hasExactModel = availableModels.some(
        (m) => m === model || m.startsWith(model.split(':')[0])
      );

      const latencyMs = Date.now() - startTime;

      if (!hasExactModel && availableModels.length > 0) {
        return {
          connected: true,
          provider: 'ollama',
          model,
          latencyMs,
          status: 'connected',
          endpoint: url,
          modelsAvailable: availableModels,
          message: `Connected to Ollama at ${url}! Note: Model "${model}" is not in installed list [${availableModels.join(', ')}]. You can pull it using 'ollama pull ${model}'.`,
        };
      }

      return {
        connected: true,
        provider: 'ollama',
        model,
        latencyMs,
        status: 'connected',
        endpoint: url,
        modelsAvailable: availableModels,
        message: `Local Ollama model "${model}" is ready and connected at ${url} (${latencyMs}ms).`,
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: 'ollama',
        model,
        latencyMs: Date.now() - startTime,
        status: 'offline',
        endpoint: url,
        message: `Local Ollama probe failed at ${url}: ${err.message}. Make sure to run 'ollama serve' on your laptop.`,
      };
    }
  }

  /**
   * Test connection to Gemini API
   */
  public async testGeminiConnection(): Promise<AiModelProbeResult> {
    const startTime = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return {
        connected: false,
        provider: 'gemini',
        model: this.settings.geminiModel,
        latencyMs: 0,
        status: 'unconfigured',
        message: 'GEMINI_API_KEY not configured in environment.',
      };
    }

    try {
      if (!this.geminiClient) this.initGemini();
      if (!this.geminiClient) throw new Error('Client not initialized');

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API probe timed out (6s)')), 6000)
      );

      const callPromise = this.geminiClient.models.generateContent({
        model: this.settings.geminiModel,
        contents: 'Ping health check. Respond with single word "PONG".',
      });

      const response = await Promise.race([callPromise, timeoutPromise]);
      const latencyMs = Date.now() - startTime;
      const text = (response.text || '').trim();

      return {
        connected: true,
        provider: 'gemini',
        model: this.settings.geminiModel,
        latencyMs,
        status: 'connected',
        message: `Google Gemini (${this.settings.geminiModel}) connected in ${latencyMs}ms. Response: "${text}".`,
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: 'gemini',
        model: this.settings.geminiModel,
        latencyMs: Date.now() - startTime,
        status: 'error',
        message: `Gemini API error: ${err.message}`,
      };
    }
  }

  /**
   * Health diagnostic check covering the active provider
   */
  public async testActiveConnection(): Promise<AiModelProbeResult> {
    if (this.settings.provider === 'ollama') {
      return this.testOllamaConnection();
    } else {
      return this.testGeminiConnection();
    }
  }
}

export const aiRouter = AiRouterService.getInstance();
