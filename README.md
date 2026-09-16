# JobAgent Web

An AI-powered job discovery, job matching, ATS resume tailoring, job prioritization, and application-tracking platform.

Built with a strict **Zero-Fabrication Policy**: candidate credentials, dates, employers, metrics, and achievements are drawn strictly from the verified master resume. Missing skills identified during ATS analysis are flagged for candidate review and are never automatically fabricated.

---

## Running Locally on Your Laptop (Quickstart)

> **Important**: This is a modern full-stack web application powered by Node.js, Express, and Vite. You **cannot double-click `index.html`** in File Explorer (via `file:///...`) because browsers block ES module imports and backend API communication for local file links.

### Step 1: Install Node.js
Ensure you have **Node.js (v18+)** installed from [nodejs.org](https://nodejs.org).

### Step 2: Install and Start Ollama with `qwen3.8:latest`
1. Download Ollama from [ollama.com](https://ollama.com).
2. Pull the model:
   ```bash
   ollama pull qwen3.8:latest
   ```
3. Start the daemon (with origins enabled for local dev):
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```

### Step 3: Run the Project
1. Extract the downloaded ZIP file.
2. Open your terminal in the extracted folder:
   ```bash
   # 1. Install dependencies
   npm install

   # 2. Start dev server (Express backend + Vite frontend)
   npm run dev
   ```
3. Open your browser to:
   ```
   http://localhost:3000
   ```
4. All views (Job Discovery, Match Scoring, Resume Tailoring, ATS Diagnostics, Truth Validation, and Settings) will render and communicate directly with your local Ollama instance.

---

## Architecture Overview

JobAgent Web is organized as a modular full-stack application:

```
jobagent-web/
├── apps/
│   ├── api/                     # Backend Express server, middleware, routes, security
│   │   ├── src/
│   │   │   ├── middleware/      # Auth, Error Handling, Security, Logging
│   │   │   ├── routes/          # Health, Diagnostics, Discovery, Resumes
│   │   │   └── logger.ts        # Structured logger
│   └── web/                     # React 19 Client Dashboard, Pipeline Views, Components
├── packages/
│   ├── shared/                  # Common TypeScript types, Enums, DTOs
│   ├── database/                # PostgreSQL schema, Prisma ORM schema, DB client
│   ├── ai/                      # Google Gemini SDK integration, backend-only secrets
│   ├── jobs/                    # Job discovery contracts, multi-ATS platform specs
│   ├── resume/                  # 9-section master resume, inconsistency detection
│   └── ats/                     # 5-component weighted scoring & zero-fabrication rules
├── docs/                        # Technical specifications (architecture, db, api, security)
├── server.ts                    # Root Express server integrating Vite middleware
├── PROJECT_STATUS.md            # Phase tracking & milestone audit
├── ARCHITECTURE.md              # Master system architecture specification
├── CHANGELOG.md                 # Version history
└── README.md                    # Developer onboarding & quickstart
```

---

## Key Features

1. **Verified Master Resume as Source of Truth**:
   - 9 structured sections: Personal Information, Summary, Experience, Skills, Technologies, Certifications, Education, Projects, Achievements.
   - Discrepancy auditor flagging conflicting information (e.g. Header positioning vs. Certification list).
2. **Dual-Market Job Discovery**:
   - Separate, dedicated pipelines for USA jobs (USD) and India jobs (INR).
   - ATS platform detection: Greenhouse, Lever, Workday, Ashby, SmartRecruiters, BuiltIn, LinkedIn.
3. **5-Component Weighted Job Matching**:
   - Score formula: `(0.35 * Semantic) + (0.25 * Skills) + (0.20 * Responsibilities) + (0.10 * Domain) + (0.10 * Title)`.
   - Hard Gate Directive: Any score ≥ 60% automatically qualifies for tailored resume generation.
4. **ATS Analysis & Truthful Resume Tailoring**:
   - Keyword categorization: Present in Master, Related Competencies, Not Evidenced (Missing).
   - Native Microsoft Word `.docx` generation with formatting optimized for ATS parsers.
5. **Security & Prompt Injection Defense**:
   - Backend-only secret isolation (`process.env.GEMINI_API_KEY`, `process.env.DATABASE_URL`).
   - Automated runtime security audits guaranteeing zero client-exposed keys.
   - Defenses against adversarial prompt injections within job descriptions.

---

## Getting Started

### 1. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Configure your secrets:
- `GEMINI_API_KEY`: Server-side API key for Google Gemini (never exposed to client).
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/jobagent`).

### 2. Development

Start the development server (runs Express and Vite on port 3000):

```bash
npm run dev
```

### 3. Build & Production

```bash
npm run build
npm start
```

---

## Health & Diagnostics Endpoints

- `GET /api/health`: Basic service uptime, version, and Gemini configuration status.
- `GET /api/health/db`: Database connection test, latency benchmark, and verified tables count.
- `GET /api/health/gemini`: Backend-only Gemini model probe and prompt-defense verification.
- `GET /api/health/security-audit`: Client bundle audit guaranteeing zero leaked secrets.
- `GET /api/health/system`: Combined diagnostic report (Node.js, memory usage, auth state).
