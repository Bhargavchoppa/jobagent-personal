/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { testDatabaseConnection } from '../../../../packages/database/src/index';
import { testGeminiConnection } from '../../../../packages/ai/src/index';
import { runSecurityAudit } from '../middleware/security';
import { SystemDiagnosticReport } from '../../../../packages/shared/src/index';

export const healthRouter = Router();

// Base Health Check
healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'JobAgent Web Backend',
    version: '1.0.0-foundation',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    gemini_configured: Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    ),
  });
});

// Database Connection Test
healthRouter.get('/db', async (_req: Request, res: Response) => {
  try {
    const dbResult = await testDatabaseConnection();
    res.json({
      success: dbResult.connected,
      data: dbResult,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Gemini Backend-Only Connection Test
healthRouter.get('/gemini', async (_req: Request, res: Response) => {
  try {
    const geminiResult = await testGeminiConnection();
    res.json({
      success: geminiResult.connected,
      data: geminiResult,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Security Audit
healthRouter.get('/security-audit', (_req: Request, res: Response) => {
  const audit = runSecurityAudit();
  res.json({
    success: audit.passed,
    data: audit,
  });
});

// Comprehensive System Diagnostics
healthRouter.get('/system', async (req: Request, res: Response) => {
  const mem = process.memoryUsage();

  const [dbResult, geminiResult] = await Promise.all([
    testDatabaseConnection(),
    testGeminiConnection(),
  ]);

  const securityAudit = runSecurityAudit();

  const report: SystemDiagnosticReport = {
    timestamp: new Date().toISOString(),
    service: 'JobAgent Web (Phase 1 Foundation)',
    nodeVersion: process.version,
    memoryUsageMb: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    },
    database: dbResult,
    gemini: geminiResult,
    security: securityAudit,
    auth: {
      authReady: true,
      provider: 'Bearer Token / Dev Session',
      activeUser: req.user?.email || 'unauthenticated',
    },
  };

  res.json({
    success: true,
    data: report,
  });
});
