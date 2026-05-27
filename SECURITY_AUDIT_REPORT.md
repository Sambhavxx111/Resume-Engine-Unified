# Production Security Audit Report

Date: 2026-05-27

Scope: Resume Engine Unified backend, frontend, and career-service modules.

## Summary

This hardening pass preserved existing application behavior and API contracts while reducing production security risk across authentication, uploads, AI endpoints, outbound service calls, headers, error handling, and dependency posture.

## Findings and Fixes

### CSRF on Cookie-Authenticated Writes

- Severity: High
- Affected files: `apps/backend/src/App.js`, `apps/backend/src/middleware/csrf.middleware.js`
- Risk: Production auth uses HttpOnly cookies with `SameSite=None` for cross-site Vercel-to-Render requests. Without request origin enforcement, a third-party site could attempt state-changing requests from a logged-in browser.
- Applied fix: Added origin/referer validation for unsafe methods when the `authToken` cookie is present. Allowed origins reuse `CORS_ORIGINS` and local development origin patterns.
- Validation: Backend changed files passed `node --check`; frontend Vercel origin remains compatible through existing `CORS_ORIGINS`.

### File Upload Content Spoofing

- Severity: High
- Affected files: `apps/backend/src/middleware/upload.middleware.js`, `apps/backend/src/routes/ats.routes.js`, `apps/backend/src/routes/resume.routes.js`, `apps/career-service/api/resume.py`
- Risk: Upload filtering checked MIME type and extension, but not file magic/content. Attackers could upload disguised content or dangerous double-extension filenames.
- Applied fix: Added backend and career-service content checks for PDF, DOCX, and TXT, dangerous inner-extension blocking, max-size enforcement, and security logging for blocked uploads.
- Validation: Frontend build passed; Python career-service compile passed.

### AI and Career-Service Abuse Controls

- Severity: Medium
- Affected files: `apps/career-service/main.py`, `apps/career-service/api/chatbot.py`, `apps/career-service/api/jobs.py`
- Risk: AI/chat/job endpoints could be abused with high request volume or oversized payloads.
- Applied fix: Added career-service in-memory rate limiting per client and route family, separate lower limits for AI and upload endpoints, and stricter payload bounds for chat context, skills, matched jobs, and job location.
- Validation: Python career-service compile passed.

### Production Error Disclosure

- Severity: Medium
- Affected files: `apps/backend/src/utils/safeError.js`, `apps/backend/src/controllers/ats.controller.js`, `apps/backend/src/controllers/resume.controller.js`, `apps/backend/src/controllers/ai.controller.js`, `apps/backend/src/config/db.js`
- Risk: Production responses/logs could expose internal error messages, stack traces, SQL state, paths, or provider details.
- Applied fix: Added environment-aware safe error details, removed stack exposure from AI optimize responses, hid low-level database connection details in production, and preserved developer diagnostics outside production.
- Validation: Backend changed files passed `node --check`.

### SSRF Guardrail for RAG Service Calls

- Severity: Medium
- Affected files: `apps/backend/src/services/rag.service.js`
- Risk: A misconfigured production `RAG_SERVICE_URL` could point to localhost/private-network targets or plain HTTP.
- Applied fix: Production now requires HTTPS RAG URLs and blocks localhost/private/internal hostnames.
- Validation: Backend changed files passed `node --check`.

### Security Headers on Career Service

- Severity: Medium
- Affected files: `apps/career-service/main.py`
- Risk: Career service responses lacked a consistent set of browser hardening headers.
- Applied fix: Added `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP, and production HSTS.
- Validation: Python career-service compile passed.

### Vulnerable Dependencies

- Severity: High
- Affected files: `apps/backend/package-lock.json`, `apps/frontend/package.json`, `apps/frontend/package-lock.json`
- Risk: npm audit reported vulnerable backend transitive dependencies, vulnerable Axios/follow-redirects/PostCSS/Picomatch chains, and a critical DOMPurify issue through jsPDF.
- Applied fix: Ran non-breaking backend and frontend audit fixes; updated `jspdf` to `4.2.1`; backend audit is clean.
- Validation: Backend `npm audit --audit-level=moderate` returned 0 vulnerabilities. Frontend production build passed after jsPDF update.
- Remaining: Frontend audit still reports Vite/esbuild dev-server advisories requiring forced major Vite upgrade to `8.x`; not applied because it is a breaking upgrade and the issue affects local dev server exposure, not the deployed static production bundle.

## Existing Controls Verified

- Password hashing uses bcrypt.
- Password policy enforces length and mixed character classes.
- Email verification and password reset tokens are generated randomly and stored hashed.
- Password reset tokens expire.
- Login rate limiting and account lockout are present.
- Auth tokens are stored in HttpOnly cookies with Secure production settings.
- Protected saved-resume routes use authentication middleware.
- Resume database access is scoped by `user_id`, reducing IDOR risk.
- MySQL user inputs use parameterized queries.
- Frontend secret scan found no tracked API keys or DB/JWT secrets.
- No dangerous React HTML rendering was found; `innerHTML` usage only clears a generated PDF container.

## Validation Performed

- `npm --prefix apps/frontend run build`: passed.
- `npm --prefix apps/backend audit --audit-level=moderate`: passed, 0 vulnerabilities.
- `npm --prefix apps/frontend audit --audit-level=moderate`: remaining Vite/esbuild dev-server advisory only.
- `node --check` on changed backend JavaScript files: passed.
- Python `compileall` on `apps/career-service`: passed when run with elevated filesystem access.
- Tracked-source secret scan: no committed secrets found.
- SQL usage review: user-controlled database values are parameterized.
- XSS sink review: no unsafe user-content HTML rendering found.

## Validation Not Fully Available Locally

- Backend has no `npm test` script, so unit/integration tests could not be run through npm.
- Full browser authentication, resume editing, AI generation, export/download, and dashboard smoke tests require the deployed environment and live env secrets.
- Python runtime import using the bundled Python failed because FastAPI dependencies are not installed in that bundled interpreter; syntax/compile validation passed.

## Remaining Recommendations

- Configure `REQUIRE_EMAIL_VERIFICATION=true` once production email delivery is wired, then verify signup/login flows.
- Keep `CORS_ORIGINS` set exactly to trusted frontend origins.
- Keep `JWT_SECRET` high-entropy and at least 32 bytes.
- Rotate all production API keys if they were ever shared in screenshots or logs.
- Upgrade Vite in a dedicated compatibility branch and smoke-test frontend dev/build behavior before merging.
- Add automated tests for auth, CSRF, uploads, resume save/load, AI endpoints, and career-service endpoints.
- Consider persistent distributed rate limiting such as Redis for multi-instance Render deployments.
- Restrict Aiven database network access where plan/settings allow.
