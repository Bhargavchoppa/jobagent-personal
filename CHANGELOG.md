# Changelog — JOBAGENT WEB

## [1.2.0] - Phase 3 Job Discovery Engine
### Added
- **11-Stage Production Search Pipeline** in `packages/jobs/`:
  - `urlNormalizer.ts`: Normalizes URLs, removes tracking/query tokens (`utm_*`, `ref`, `gh_src`, etc.), and generates 5-tier fingerprint deduplication keys.
  - `pageClassifier.ts`: Classifies web pages into `INDIVIDUAL_JOB`, `LISTING_PAGE`, `COMPANY_PAGE`, `SEARCH_PAGE`, `ERROR_PAGE`, `UNKNOWN`, and detects known ATS platforms (`Greenhouse`, `Lever`, `Workday`, `Ashby`, `SmartRecruiters`, `Taleo`). Rejects search and listing pages before candidate fetching.
  - `dateValidator.ts`: Zero-trust date verification prioritizing JSON-LD `JobPosting` and verified meta tags, strictly rejecting generic `<time>` elements. Parses relative dates (`"2 days ago"`) and flags freshness (`fresh`, `active`, `stale`).
  - `deduplicator.ts`: Multi-tier deduplication engine checking canonical URLs, application URLs, job IDs, company/title/location, and normalized company/title.
  - `concurrencyEngine.ts`: Concurrent worker pool with per-page abort timeouts, exponential backoff retries, and early-stopping on successive failures.
  - `discoveryEngine.ts`: High-level orchestrator executing the 11-stage pipeline, generating live milestone progress events, and creating `JobSearchRun` telemetry records.
- **Geography & Profile Expansion**:
  - Independent search pipelines for **INDIA** and **USA** with isolated database queries.
  - 12 target role profiles (BA, Senior BA, PM, Senior PM, Product Owner, Senior PO, AI PM, Tech PM, IT PM, Product Analyst, Project Manager, Tech BA).
  - Configurable custom user keywords and domain modifiers (e.g. FinTech, Healthcare, Cloud, LLM).
- **Automated Diagnostics & UI Milestone Stream**:
  - `GET /api/jobs/tests/run`: Diagnostics test suite covering normalization, ATS recognition, classification, date validation, and deduplication.
  - Real-time 6-stage milestone tracker in the frontend UI displaying search started, results collected, unique URLs, likely job pages, extracted jobs, and saved jobs.

## [1.1.0] - Phase 1 Foundation Architecture & Diagnostics
### Added
- **Monorepo Directory Skeleton**: Established clean workspace hierarchy matching architectural specifications:
  - `apps/api`: Express server middleware (auth, error handling, security, logging) and modular routes.
  - `apps/web`: React 19 client application.
  - `packages/shared`: Shared TypeScript types, enums, DTOs, and health diagnostic interfaces.
  - `packages/database`: PostgreSQL schema DDL (18 tables), Prisma ORM definition, connection pool service, and connectivity test suite.
  - `packages/ai`: Google GenAI backend service with prompt-injection defense and backend-only secret isolation.
  - `packages/jobs`: Job discovery types and ATS platform signatures.
  - `packages/resume`: 9 structured master resume sections and inconsistency audit models.
  - `packages/ats`: 5-component weighted scoring formula (35/25/20/10/10) and gating logic.
  - `docs/`: Monorepo architecture, database, API, and security documentation.
- **Centralized Middleware**:
  - `apps/api/src/middleware/errorHandler.ts`: Centralized error handling with `AppError` operational error classes.
  - `apps/api/src/middleware/auth.ts`: Authentication-ready middleware supporting Bearer tokens and developer session context.
  - `apps/api/src/middleware/security.ts`: Security headers (`nosniff`, `SAMEORIGIN`, `XSS`) and automated runtime secret isolation audit.
  - `apps/api/src/logger.ts`: Structured console logger with timestamps, levels, and categories.
- **Health & Diagnostic Endpoints**:
  - `GET /api/health`: Base health check, version, and Gemini configuration detection.
  - `GET /api/health/db`: Database connection test against PostgreSQL / normalized store.
  - `GET /api/health/gemini`: Backend-only Gemini connection probe and latency check.
  - `GET /api/health/security-audit`: Client bundle secret scan ensuring zero exposed credentials.
  - `GET /api/health/system`: Comprehensive memory, node, database, and AI diagnostic telemetry.
- **Frontend Foundation Dashboard**:
  - Interactive `FoundationHealthCard` component with real-time test triggers for database, AI, and security diagnostics.

## [1.0.0] - Core Production Implementation
### Added
- Complete normalized data model in `src/types.ts` and `server/db.ts` across 16 tables.
- Master resume seed for Bhargav Aravind Sai Ram Choppa with verified 9-year career history across 6 employers and explicit PMP header discrepancy audit flagging.
- Server-side Gemini AI engine (`server/geminiService.ts`) utilizing `@google/genai` (model `gemini-3.8-flash`) with prompt-injection defense, 5-component semantic matching (35/25/20/10/10), ATS keyword analyzer (~95% coverage), and deterministic fallback.
- Multi-source job discovery engine (`server/jobDiscoveryService.ts`) with USA and India segmentation, ATS board identification (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, BuiltIn, LinkedIn), deduplication, and JSON-LD date verification.
- Native Microsoft Word `.docx` resume export service (`server/docxService.ts`) with zero fabrication certification.
- Express API server with Vite middleware integration in `server.ts`.
- 12 comprehensive React UI views:
  1. Dashboard (9 metrics, priority opportunities, PMP alert banner)
  2. Job Discovery / Search (live progress indicator, real-time terminal log)
  3. India Jobs (INR salary, hub filters)
  4. USA Jobs (USD salary, ATS platform filters)
  5. Job Details Modal (full metadata, direct links, match breakdown)
  6. Job Matching (interactive 5-component weights, comparison, gate inspection)
  7. Master Resume (source of truth viewer, audit alerts)
  8. Tailored Resumes (interactive Word preview, DOCX download)
  9. ATS Analysis (~95% coverage optimizer, 3 color-coded keyword groups, truth certificate)
  10. Applications (Kanban pipeline and recruiter notes)
  11. Settings (taxonomy, gate threshold, AI model config)
  12. System Logs (security & prompt injection telemetry)
