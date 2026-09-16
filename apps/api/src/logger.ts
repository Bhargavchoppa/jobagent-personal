/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogLevel } from '../../../packages/shared/src';

export class Logger {
  private static formatMessage(level: LogLevel, category: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}${metaStr}`;
  }

  public static debug(category: string, message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage(LogLevel.DEBUG, category, message, meta));
    }
  }

  public static info(category: string, message: string, meta?: any): void {
    console.info(this.formatMessage(LogLevel.INFO, category, message, meta));
  }

  public static warn(category: string, message: string, meta?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, category, message, meta));
  }

  public static error(category: string, message: string, meta?: any): void {
    console.error(this.formatMessage(LogLevel.ERROR, category, message, meta));
  }
}
