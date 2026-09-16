# JobAgent Web — Security Specification

## 1. Zero-Fabrication Policy
The core promise of JobAgent Web is truthfulness:
- The candidate's master resume is an immutable factual ceiling.
- Missing skills identified during ATS keyword extraction are marked as `Not Evidenced` and flagged in review reports.
- Missing skills are **strictly never injected** or fabricated into tailored resumes.

## 2. API Key & Secret Isolation
- **Rule**: All third-party secrets, database credentials, and LLM API keys reside strictly on the server side (`process.env.GEMINI_API_KEY`, `process.env.DATABASE_URL`).
- **Client Bundle Protection**: Vite build output is audited to guarantee that no sensitive variables are prefixed with `VITE_` or exposed in browser client code.
- **Automated Security Audit**: The `/api/health/security-audit` endpoint validates isolation at runtime.

## 3. Prompt Injection Defense
- Untrusted external job postings and candidate-uploaded text are sanitized using delimiter boundaries (`<untrusted_data>`).
- Direct model override phrases like "ignore all previous instructions" or "system prompt" are defanged before reaching the model context.
