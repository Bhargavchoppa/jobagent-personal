/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConcurrencyOptions {
  maxConcurrency?: number; // Default 5
  timeoutMs?: number; // Default 6000ms
  maxRetries?: number; // Default 2
  targetItemsCount?: number; // Early stopping threshold
  onProgress?: (progress: { completed: number; total: number; successful: number; failed: number }) => void;
}

export interface FetchResult<T> {
  item: T;
  data?: any;
  success: boolean;
  error?: string;
  statusCode?: number;
  durationMs: number;
}

export class ConcurrencyEngine {
  private cache = new Map<string, any>();

  constructor(private defaultOptions: ConcurrencyOptions = {}) {}

  /**
   * Clears in-memory URL fetch cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Processes an array of items with a fixed concurrency limit, timeouts, retries, and early stopping
   */
  public async processBatch<T>(
    items: T[],
    processor: (item: T, signal: AbortSignal) => Promise<any>,
    options: ConcurrencyOptions = {}
  ): Promise<FetchResult<T>[]> {
    const maxConcurrency = options.maxConcurrency || this.defaultOptions.maxConcurrency || 5;
    const timeoutMs = options.timeoutMs || this.defaultOptions.timeoutMs || 6000;
    const maxRetries = options.maxRetries || this.defaultOptions.maxRetries || 1;
    const targetItemsCount = options.targetItemsCount || this.defaultOptions.targetItemsCount;

    const results: FetchResult<T>[] = [];
    const queue = [...items];
    let activeWorkers = 0;
    let completedCount = 0;
    let successfulCount = 0;
    let failedCount = 0;
    let earlyStopTriggered = false;

    return new Promise((resolve) => {
      if (items.length === 0) {
        return resolve([]);
      }

      const checkNext = () => {
        // Early stopping check
        if (targetItemsCount && successfulCount >= targetItemsCount) {
          earlyStopTriggered = true;
        }

        if ((queue.length === 0 || earlyStopTriggered) && activeWorkers === 0) {
          return resolve(results);
        }

        while (activeWorkers < maxConcurrency && queue.length > 0 && !earlyStopTriggered) {
          const item = queue.shift()!;
          activeWorkers++;

          this.processWithRetry(item, processor, timeoutMs, maxRetries)
            .then((res) => {
              results.push(res);
              completedCount++;
              if (res.success) {
                successfulCount++;
              } else {
                failedCount++;
              }

              if (options.onProgress) {
                options.onProgress({
                  completed: completedCount,
                  total: items.length,
                  successful: successfulCount,
                  failed: failedCount,
                });
              }
            })
            .catch((err) => {
              results.push({
                item,
                success: false,
                error: err.message || 'Unknown processing failure',
                durationMs: 0,
              });
              completedCount++;
              failedCount++;
            })
            .finally(() => {
              activeWorkers--;
              checkNext();
            });
        }
      };

      // Kick off initial workers
      checkNext();
    });
  }

  private async processWithRetry<T>(
    item: T,
    processor: (item: T, signal: AbortSignal) => Promise<any>,
    timeoutMs: number,
    retriesLeft: number
  ): Promise<FetchResult<T>> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const data = await processor(item, controller.signal);
      clearTimeout(timeoutId);
      return {
        item,
        data,
        success: true,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
      const errMessage = isTimeout ? `Request timed out after ${timeoutMs}ms` : err.message || 'Network error';

      if (retriesLeft > 0 && !isTimeout) {
        // Exponential backoff wait
        await new Promise((r) => setTimeout(r, 400 * (2 - retriesLeft + 1)));
        return this.processWithRetry(item, processor, timeoutMs, retriesLeft - 1);
      }

      return {
        item,
        success: false,
        error: errMessage,
        durationMs: Date.now() - startTime,
      };
    }
  }
}
