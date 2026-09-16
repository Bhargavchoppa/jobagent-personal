# JobAgent Web — API Specification

## 1. Health & Foundation Endpoints

### `GET /api/health`
Returns basic service health, version, and Gemini configuration status.

**Response:**
```json
{
  "status": "ok",
  "service": "JobAgent Web Backend",
  "version": "1.0.0-foundation",
  "timestamp": "2026-09-11T16:40:00.000Z",
  "uptime": 120.5,
  "environment": "development",
  "gemini_configured": true
}
```

### `GET /api/health/db`
Tests database connectivity against PostgreSQL / normalized relational store.

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "status": "connected",
    "provider": "in_memory_relational",
    "host": "localhost (in-container)",
    "database": "jobagent_normalized_store",
    "latencyMs": 2,
    "tablesVerified": ["users", "master_resumes", "jobs", "job_matches", ...],
    "totalRecordsCount": 42,
    "message": "Database architecture verified..."
  }
}
```

### `GET /api/health/gemini`
Tests backend-only Gemini API integration and verifies model latency.

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "status": "connected",
    "model": "gemini-3.8-flash",
    "latencyMs": 420,
    "promptInjectionDefenseActive": true,
    "backendOnlyConfirmed": true,
    "message": "Gemini API connection verified (gemini-3.8-flash)..."
  }
}
```

### `GET /api/health/system`
Comprehensive system diagnostic combining memory usage, Node version, database, Gemini, security audit, and auth state.

### `GET /api/health/security-audit`
Audits environment to confirm no server secrets (`GEMINI_API_KEY`, `DATABASE_URL`) are leaked to the client bundle.
