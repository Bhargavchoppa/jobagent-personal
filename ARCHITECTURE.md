# JOBAGENT WEB — Architecture Specification

## 1. Executive Summary
JobAgent Web is a production-grade full-stack AI-powered job discovery, semantic matching, ATS resume tailoring, and application-tracking platform. It strictly enforces a **Zero-Fabrication Policy**, ensuring that candidate experience is never invented to artificially inflate ATS scores while achieving optimal truthful keyword alignment.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JobAgent Web (React 19)                  │
│  - 12 Dedicated Functional Views                            │
│  - Real-time Pipeline Progress Tracker                      │
│  - 5-Component Interactive Match Breakdown                  │
│  - ATS Keyword Inspector (Present / Related / Not Evidenced)│
│  - Client-Side & Server-Side DOCX Download                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON APIs
┌──────────────────────────────▼──────────────────────────────┐
│                  Express Backend (Node.js/TS)               │
│  - Vite Middleware (Development) / Static Bundle (Prod)     │
│  - Concurrency-Controlled Job Discovery Runner              │
│  - Multi-source ATS Scraper & Search Grounding              │
│  - Strict Prompt-Injection Guard Sandbox                    │
│  - 5-Component Weighted Matching Algorithm (35/25/20/10/10) │
│  - Truth Validation Auditor                                 │
│  - Native Word DOCX Generator (`docx` engine)               │
└───────────────┬──────────────────────────────┬──────────────┘
                │                              │
┌───────────────▼──────────────┐ ┌─────────────▼──────────────┐
│      Google Gemini API       │ │    Normalized Data Store   │
│  - gemini-3.8-flash (Reasoning│ │  - Master Resumes (Truth)  │
│    & Semantic Extraction)    │ │  - Jobs & Sources          │
│  - Search Grounding Tool     │ │  - 5-Component Matches     │
│  - JSON Schema Validation    │ │  - ATS Analysis & Revisions│
│  - Zero-Fabrication Tailoring│ │  - Applications & Logs     │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 3. Database Schema (Normalized)

The storage engine implements normalized relational models:
1. `users`: User identity and session metadata.
2. `master_resumes`: Single source of truth candidate profile (immutable during tailoring).
3. `resume_versions`: Historical snapshots and edits of the master resume.
4. `experiences`: Verified employment entries with company, title, location, dates, responsibilities, achievements, technologies, industry, and domain.
5. `skills`: Structured catalog of verified competencies.
6. `certifications`: Verified credentials (with explicit audit flagging for header vs. certification section discrepancies).
7. `jobs`: Comprehensive job postings containing company, title, location, country, remote mode, employment type, salary, verified posting date, source, description, responsibilities, requirements, and benefits.
8. `job_sources`: Discovered platforms (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, BuiltIn, LinkedIn, etc.).
9. `job_search_runs`: Asynchronous job discovery pipeline logs with candidate counts and error tracking.
10. `job_matches`: 5-component weighted scoring records with category assignment and 60% resume generation gate.
11. `ats_analyses`: Keyword extraction records categorizing items as Present/Evidenced, Related/Equivalent, or Not Evidenced.
12. `tailored_resumes`: Derived, validated resume documents linked to specific job targets.
13. `applications`: Application status pipeline records (Saved, Tailored, Applied, Interviewing, Offer, Rejected).
14. `application_events`: Historical timeline of interview events, recruiter emails, and status transitions.
15. `search_queries`: Catalog of queries executed across USA and India.
16. `system_logs`: High-resolution audit log for security, prompt injection defense, and ATS parsing.

---

## 4. 5-Component Matching Algorithm

Match Score Calculation:
$$\text{Score} = (0.35 \times \text{Semantic}) + (0.25 \times \text{Skills}) + (0.20 \times \text{Responsibilities}) + (0.10 \times \text{Domain}) + (0.10 \times \text{Title})$$

Thresholds & Gates:
- **75 – 100%**: Strong Match (High-priority application)
- **60 – 74%**: Tailor Resume (Automated tailoring triggered)
- **50 – 59%**: Review Later
- **Below 50%**: Reject / Do Not Tailor

**Hard Gate Directive**: Any score $\ge 60\%$ **must immediately proceed** to tailored resume generation without secondary LLM rejection.

---

## 5. ATS Keyword & Zero-Fabrication Protocol

1. **Target**: ~95% truthful ATS coverage.
2. **Skill Triage**:
   - `Present/Evidenced`: Specifically documented in verified resume.
   - `Related/Equivalent`: Legitimate transferrable capability supported by verified work.
   - `Not Evidenced`: Flagged explicitly in the ATS report; NEVER injected into the tailored resume.
3. **Audit Loop**: Prior to finalizing any tailored resume, the document is checked against the immutable master resume. Any unverified entity triggers an immediate audit failure.

---

## 6. Prompt Injection Defense
All external job descriptions are wrapped in strict boundary tags (`<untrusted_job_description>`) and parsed exclusively as passive data schema objects. LLM system instructions explicitly command the model to disregard imperative statements contained in posting text.
