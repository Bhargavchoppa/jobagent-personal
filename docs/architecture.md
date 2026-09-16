# JobAgent Web — Monorepo Architecture

## 1. Directory & Package Hierarchy

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
├── docs/                        # Technical specifications and guides
├── server.ts                    # Root Express server integrating Vite middleware
├── PROJECT_STATUS.md            # Phase tracking & milestone audit
├── ARCHITECTURE.md              # Master system architecture specification
├── CHANGELOG.md                 # Version history
└── README.md                    # Developer onboarding & quickstart
```

## 2. Core Architectural Pillars

1. **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS. Single-page application rendering the Foundation Dashboard and modular pipeline views.
2. **Backend**: Node.js + TypeScript + Express. Serves API endpoints and proxies all AI/database requests.
3. **Database Architecture**: PostgreSQL with Prisma schema definition (`packages/database/prisma/schema.prisma`) and raw DDL (`packages/database/src/schema.sql`). Connection testing with automatic fallback diagnostics.
4. **Backend-Only AI Integration**: Google Gemini API is accessed exclusively through `packages/ai` via `process.env.GEMINI_API_KEY`. Secrets are never serialized or leaked to client bundles.
5. **Authentication-Ready**: Centralized `authenticate` and `requireAuth` middleware ready for JWT/OAuth providers with mock/dev context fallback.
6. **Zero-Fabrication ATS**: Strict protocol preventing invention of unverified candidate qualifications.
