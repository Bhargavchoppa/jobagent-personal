# JobAgent Web — Database Specification

## 1. Schema Overview

The database is architected for PostgreSQL with normalized relational models defined in both Prisma ORM format (`packages/database/prisma/schema.prisma`) and raw DDL (`packages/database/src/schema.sql`).

### Primary Tables (16 Entities):
1. `users`: User identity, email, role, and timestamps.
2. `master_resumes`: Single source of truth candidate profile (immutable during tailoring).
3. `resume_versions`: Historical snapshots and edits of the master resume.
4. `experiences`: Verified employment entries (company, title, dates, responsibilities, achievements, technologies, industry, domain).
5. `skills`: Structured catalog of verified competencies.
6. `certifications`: Verified credentials with discrepancy flags.
7. `education`: Degrees, institutions, and graduation records.
8. `projects`: Key projects, descriptions, and technologies.
9. `job_sources`: Discovered platforms (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, BuiltIn, LinkedIn).
10. `jobs`: Comprehensive job postings with requirements, responsibilities, and metadata.
11. `job_search_runs`: Asynchronous job discovery pipeline logs.
12. `job_matches`: 5-component weighted scoring records.
13. `ats_analyses`: Keyword triage records (Present, Related, Not Evidenced).
14. `tailored_resumes`: Derived, validated resumes linked to job targets.
15. `applications`: Pipeline tracker (Saved, Tailored, Applied, Interviewing, Offer, Rejected).
16. `application_events`: Historical timeline of interview events and status transitions.
17. `search_queries`: Search query parameters and timestamps.
18. `system_logs`: Structured audit trail.

## 2. Connection Testing & Diagnostics

The database connection test is available at `GET /api/health/db`:
- Verifies connection string format.
- Probes connection latency using `SELECT NOW()`.
- Validates table readiness and record counts.
- Reports clear operational status (`connected` or `fallback_ready`).
