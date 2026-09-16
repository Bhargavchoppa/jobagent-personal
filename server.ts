/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db';
import { healthRouter } from './apps/api/src/routes/health';
import { errorHandler } from './apps/api/src/middleware/errorHandler';
import { authenticate } from './apps/api/src/middleware/auth';
import { securityHeaders } from './apps/api/src/middleware/security';
import { Logger } from './apps/api/src/logger';
import {
  executeJobSearch,
  getActiveSearchState,
  TARGET_ROLES,
  runPhase3Diagnostics,
} from './server/jobDiscoveryService';
import {
  calculateJobMatch,
  analyzeAtsKeywords,
  generateTailoredResume,
} from './server/geminiService';
import { generateResumeDocxBuffer } from './server/docxService';
import { generateResumePdfBuffer } from './server/pdfService';
import { resumeParser } from './server/resumeParserService';
import { runSemanticMatchingTests } from './packages/ats/src/index';
import {
  executeTailoringPipeline,
  runPhase5TailoringTests,
  ResumeTruthValidator,
  runPhase6TruthValidationTests,
} from './packages/resume/src/index';
import { aiRouter } from './packages/ai/src/index';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(securityHeaders);
  app.use(authenticate);

  // ==========================================
  // REST API Endpoints
  // ==========================================

  // Modular Health & System Diagnostics Router
  app.use('/api/health', healthRouter);

  // Dashboard Stats
  app.get('/api/dashboard', (req, res) => {
    try {
      const stats = db.getDashboardStats();
      const recentRuns = db.getSearchRuns().slice(0, 5);
      const recentTailored = db.getTailoredResumes().slice(0, 5);
      const masterResume = db.getMasterResume();

      res.json({
        stats,
        recentRuns,
        recentTailored,
        inconsistency_flags: masterResume.inconsistency_flags,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // Master Resume & Source of Truth APIs (Phase 2)
  // ==========================================

  // 1. Upload API (PDF / DOCX / Raw Text)
  app.post('/api/master-resume/upload', async (req, res) => {
    try {
      const { file_base64, filename, mime_type, raw_text } = req.body;

      let extractedText = '';
      if (file_base64) {
        const cleanBase64 = file_base64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        extractedText = await resumeParser.extractTextFromFile(
          buffer,
          filename || 'uploaded_resume.docx',
          mime_type
        );
      } else if (raw_text && typeof raw_text === 'string') {
        extractedText = raw_text;
      } else {
        return res.status(400).json({ error: 'Please provide either file_base64 or raw_text' });
      }

      if (!extractedText.trim()) {
        return res.status(400).json({ error: 'Could not extract any readable text from the provided document' });
      }

      // Parse document into the 9 structured sections
      const review = await resumeParser.parseResumeText(extractedText, filename || 'Uploaded Document');
      db.saveParsedReview(review);

      db.log('info', 'RESUME_PARSE', `Extracted & audited document: ${filename || 'Uploaded text'}. Review ID: ${review.id}`);

      res.json({
        success: true,
        review_id: review.id,
        review,
      });
    } catch (e: any) {
      db.log('error', 'RESUME_PARSE', `Resume upload/parse error: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  // 2. Parse API (Explicit text or payload parsing)
  app.post('/api/master-resume/parse', async (req, res) => {
    try {
      const { text, filename } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing resume text string' });
      }

      const review = await resumeParser.parseResumeText(text, filename || 'Pasted Resume Text');
      db.saveParsedReview(review);

      res.json({
        success: true,
        review_id: review.id,
        review,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 3. Review APIs (Retrieve staged parsed resume for user inspection)
  app.get('/api/master-resume/review', (req, res) => {
    try {
      const reviews = db.getAllParsedReviews();
      res.json(reviews);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/master-resume/review/:id', (req, res) => {
    try {
      const review = db.getParsedReview(req.params.id);
      if (!review) {
        return res.status(404).json({ error: 'Parsed review not found' });
      }
      res.json(review);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 4. Version API (List all resume versions with status)
  app.get('/api/master-resume/versions', (req, res) => {
    try {
      const versions = db.getResumeVersions();
      res.json(versions);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 5. Activate API (Mark one version as ACTIVE)
  app.post(['/api/master-resume/activate/:version', '/api/master-resume/versions/:version/activate'], (req, res) => {
    try {
      const versionNum = parseInt(req.params.version, 10);
      if (isNaN(versionNum)) {
        return res.status(400).json({ error: 'Invalid version number' });
      }

      const activated = db.activateVersion(versionNum);
      res.json({
        success: true,
        message: `Version v${versionNum} marked as ACTIVE Source of Truth`,
        active_resume: activated,
      });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  });

  // 6. Save API (Save verified master resume, create version, enforce integrity)
  app.post(['/api/master-resume/save', '/api/master-resume'], (req, res) => {
    try {
      const payload = req.body;
      const resume = payload.resume || payload;
      const note = payload.note || payload._update_note || 'User saved verified master resume';
      const source = payload.source || (resume.source_of_truth?.source) || 'manual_edit';
      const makeActive = payload.make_active !== undefined ? Boolean(payload.make_active) : true;

      if (!resume || !resume.personal_information) {
        return res.status(400).json({ error: 'Invalid master resume structure' });
      }

      // Run Inconsistency Detection Engine
      const detectedFlags = resumeParser.detectInconsistencies(resume);
      resume.inconsistency_flags = detectedFlags;

      // Never modify active resume during tailoring - enforce immutability & active flags
      const saved = db.saveMasterResume(resume, note, source, makeActive);
      res.json({
        success: true,
        message: `Master resume saved as version v${saved.version} (Active: ${saved.is_active})`,
        master_resume: saved,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/master-resume', (req, res) => {
    try {
      const resume = req.body;
      if (!resume || !resume.personal_information) {
        return res.status(400).json({ error: 'Invalid master resume structure' });
      }
      const detectedFlags = resumeParser.detectInconsistencies(resume);
      resume.inconsistency_flags = detectedFlags;

      const saved = db.saveMasterResume(resume, req.body._update_note || 'User edit', 'manual_edit', true);
      res.json(saved);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 7. Retrieve API (Get active master resume or specific version)
  app.get('/api/master-resume', (req, res) => {
    try {
      const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;
      const resume = db.getMasterResume(version);
      res.json(resume);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/master-resume/versions/:version', (req, res) => {
    try {
      const versionNum = parseInt(req.params.version, 10);
      const resume = db.getMasterResume(versionNum);
      if (!resume) {
        return res.status(404).json({ error: `Resume version v${versionNum} not found` });
      }
      res.json(resume);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Jobs
  app.get('/api/jobs', (req, res) => {
    try {
      const country = req.query.country as string | undefined;
      const minScore = req.query.minScore ? Number(req.query.minScore) : undefined;
      const status = req.query.status as string | undefined;

      const jobs = db.getJobs({ country, minScore, status });
      res.json(jobs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/jobs/:id', (req, res) => {
    try {
      const job = db.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      const match = db.getMatch(job.job_id);
      const ats = db.getAtsAnalysis(job.job_id);
      const tailored = db.getTailoredResumeByJobId(job.job_id);

      res.json({ job, match, ats, tailored });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Job Search Trigger
  app.post('/api/jobs/search', async (req, res) => {
    try {
      const { country = 'All', roles = TARGET_ROLES.slice(0, 4), locationKeywords, additionalKeywords } = req.body;

      // Start search asynchronously or await depending on request
      const searchPromise = executeJobSearch({ country, roles, locationKeywords, additionalKeywords });

      // Return immediately with current state for live UI tracking
      res.json({
        message: 'Search initiated',
        state: getActiveSearchState(),
      });

      // Let search run to completion in background
      searchPromise.catch((err) => {
        console.error('[JobSearch] Background search failed:', err);
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Phase 3 Job Discovery Unit & Integration Tests Runner
  app.get('/api/jobs/tests/run', (req, res) => {
    try {
      const testSuiteResults = runPhase3Diagnostics();
      res.json({
        success: testSuiteResults.failed === 0,
        ...testSuiteResults,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Phase 4 Semantic Matching Unit & Integration Tests Runner
  app.get('/api/matching/tests/run', async (req, res) => {
    try {
      const testSuiteResults = await runSemanticMatchingTests();
      res.json(testSuiteResults);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Live Search Status
  app.get('/api/jobs/search/status', (req, res) => {
    res.json(getActiveSearchState());
  });

  app.get('/api/jobs/search/history', (req, res) => {
    res.json(db.getSearchRuns());
  });

  // Match Recalculation
  app.post('/api/jobs/:id/match', async (req, res) => {
    try {
      const job = db.getJobById(req.params.id);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      const master = db.getMasterResume();

      const match = await calculateJobMatch(job, master);

      // Gate check: If >= 60%, automatically trigger resume tailoring
      let tailored = db.getTailoredResumeByJobId(job.job_id);
      if (match.total_score >= 60 && !tailored) {
        const ats = await analyzeAtsKeywords(job, master);
        tailored = await generateTailoredResume(job, master, ats);
      }

      res.json({ match, tailored });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Tailored Resume Generation & Phase 6 Deterministic Truth Validation Gate
  app.post('/api/jobs/:id/tailor', async (req, res) => {
    try {
      const job = db.getJobById(req.params.id);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      const master = db.getMasterResume();

      // Execute full Phase 5 + Phase 6 pipeline
      const pipelineResult = await executeTailoringPipeline(job, master);
      db.addGenerationRun(pipelineResult.run);
      db.saveTruthValidationReport(pipelineResult.validation_report);

      if (pipelineResult.validation_report.validation_status === 'FAILED') {
        db.log(
          'error',
          'RESUME_VALIDATOR',
          `Validation Failed for ${job.title} at ${job.company}: ${pipelineResult.validation_report.validation_errors.join('; ')}`
        );
        return res.status(422).json({
          success: false,
          error: 'Validation Failed',
          reasons: pipelineResult.validation_report.validation_errors,
          validation_report: pipelineResult.validation_report,
          run: pipelineResult.run,
        });
      }

      if (pipelineResult.tailored) {
        db.saveTailoredResume(pipelineResult.tailored);
      }

      res.json({
        success: true,
        tailored: pipelineResult.tailored,
        ats: pipelineResult.analysis,
        run: pipelineResult.run,
        validation_report: pipelineResult.validation_report,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Phase 6 Truth Validation API: Validate any resume against master resume
  app.post('/api/resumes/validate', (req, res) => {
    try {
      const candidateResume = req.body.resume;
      if (!candidateResume) {
        return res.status(400).json({ error: 'Resume payload is required' });
      }
      const master = db.getMasterResume();
      const report = ResumeTruthValidator.validate(candidateResume, master);
      db.saveTruthValidationReport(report);
      res.json(report);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/validation/reports', (req, res) => {
    try {
      res.json(db.getAllTruthValidationReports());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/validation/reports/:jobId', (req, res) => {
    try {
      const report = db.getTruthValidationReport(req.params.jobId);
      if (!report) {
        const tailored = db.getTailoredResumeByJobId(req.params.jobId);
        if (tailored) {
          const master = db.getMasterResume();
          const generated = ResumeTruthValidator.validate(tailored, master);
          db.saveTruthValidationReport(generated);
          return res.json(generated);
        }
        return res.status(404).json({ error: 'No truth validation report found for this job' });
      }
      res.json(report);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/validation/tests/run', (req, res) => {
    try {
      const master = db.getMasterResume();
      const testResults = runPhase6TruthValidationTests(master);
      res.json(testResults);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Phase 5 Generation Tracking Runs
  app.get('/api/resume-generation/runs', (req, res) => {
    try {
      res.json(db.getGenerationRuns());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/resume-generation/runs/:jobId', (req, res) => {
    try {
      const run = db.getGenerationRunByJobId(req.params.jobId);
      if (!run) return res.status(404).json({ error: 'Generation run not found' });
      res.json(run);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/tailoring/tests/run', (req, res) => {
    try {
      const master = db.getMasterResume();
      const testResults = runPhase5TailoringTests(master);
      res.json(testResults);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Tailored Resumes List
  app.get('/api/resumes/tailored', (req, res) => {
    try {
      const list = db.getTailoredResumes();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/resumes/tailored/:jobId', (req, res) => {
    try {
      const tailored = db.getTailoredResumeByJobId(req.params.jobId);
      if (!tailored) return res.status(404).json({ error: 'Tailored resume not found' });
      res.json(tailored);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Download DOCX Resume
  app.get('/api/resumes/tailored/:jobId/docx', async (req, res) => {
    try {
      const tailored = db.getTailoredResumeByJobId(req.params.jobId);
      if (!tailored) return res.status(404).json({ error: 'Tailored resume not found' });

      // Truth Validation Gate: require truth validation passed before download
      const isTruthPassed =
        tailored.validation_status === 'PASSED' ||
        tailored.truth_audit_passed === true ||
        tailored.truth_check?.passed === true;

      if (!isTruthPassed) {
        return res.status(403).json({
          error: 'Resume download blocked: Truth validation has not passed (Zero-Fabrication Guard).',
        });
      }

      const master = db.getMasterResume();
      const docxBuffer = await generateResumeDocxBuffer(tailored, master);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${tailored.file_name}"`);
      res.send(docxBuffer);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Download PDF Resume
  app.get('/api/resumes/tailored/:jobId/pdf', async (req, res) => {
    try {
      const tailored = db.getTailoredResumeByJobId(req.params.jobId);
      if (!tailored) return res.status(404).json({ error: 'Tailored resume not found' });

      // Truth Validation Gate: require truth validation passed before download
      const isTruthPassed =
        tailored.validation_status === 'PASSED' ||
        tailored.truth_audit_passed === true ||
        tailored.truth_check?.passed === true;

      if (!isTruthPassed) {
        return res.status(403).json({
          error: 'Resume download blocked: Truth validation has not passed (Zero-Fabrication Guard).',
        });
      }

      const master = db.getMasterResume();
      const pdfBuffer = await generateResumePdfBuffer(tailored, master);
      const pdfFileName = tailored.file_name.replace(/\.docx$/i, '.pdf');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);
      res.send(pdfBuffer);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ATS Analysis
  app.get('/api/ats-analysis/:jobId', (req, res) => {
    try {
      const ats = db.getAtsAnalysis(req.params.jobId);
      if (!ats) return res.status(404).json({ error: 'ATS analysis not found for this job' });
      res.json(ats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Applications
  app.get('/api/applications', (req, res) => {
    try {
      const apps = db.getApplications();
      res.json(apps);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/applications/:jobId/status', (req, res) => {
    try {
      const { status, notes } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });
      const updated = db.updateApplicationStatus(req.params.jobId, status, notes);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // System Logs
  app.get('/api/logs', (req, res) => {
    try {
      const logs = db.getLogs();
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Provider & Settings
  app.post('/api/database/clean-slate', (req, res) => {
    try {
      const { preserveMaster = true } = req.body || {};
      db.resetToCleanSlate(preserveMaster);
      res.json({
        success: true,
        message: 'All dummy jobs, matches, tailored resumes, and applications cleared successfully.',
        stats: db.getDashboardStats(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/settings/ai', (req, res) => {
    try {
      const settings = db.getAiSettings();
      // Synchronize aiRouter with db
      aiRouter.updateSettings(settings);
      res.json({
        ...settings,
        activeModel: aiRouter.getActiveModel(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/settings/ai', (req, res) => {
    try {
      const updated = db.saveAiSettings(req.body);
      aiRouter.updateSettings(updated);
      res.json({
        ...updated,
        activeModel: aiRouter.getActiveModel(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Test AI model connection (Ollama or Gemini)
  app.post('/api/settings/ai/test', async (req, res) => {
    try {
      const { provider, ollamaUrl, ollamaModel } = req.body || {};
      let result;
      if (provider === 'ollama') {
        result = await aiRouter.testOllamaConnection(ollamaUrl, ollamaModel);
      } else if (provider === 'gemini') {
        result = await aiRouter.testGeminiConnection();
      } else {
        result = await aiRouter.testActiveConnection();
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({
        connected: false,
        status: 'error',
        message: e.message,
      });
    }
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  // ==========================================
  // Vite Middleware Setup
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JobAgent Web] Server running on http://localhost:${PORT}`);
  });
}

startServer();
