# API Contract

The frontend is built against the following normalized API contract. If the backend differs, update the mapping here and the affected service usage in one place rather than hardcoding assumptions in components.

| endpoint | method | headers | request body (sample) | response format (sample) |
| --- | --- | --- | --- | --- |
| `/api/auth/login` | `POST` | `Content-Type: application/json` | `{ "email": "user@example.com", "password": "secret123" }` | `{ "token": "jwt_token", "user": { "id": "u_1", "name": "Divya", "email": "user@example.com" } }` |
| `/api/auth/signup` | `POST` | `Content-Type: application/json` | `{ "name": "Divya", "email": "user@example.com", "password": "secret123" }` | `{ "token": "jwt_token", "user": { "id": "u_1", "name": "Divya", "email": "user@example.com" } }` |
| `/api/resume` | `GET` | `Authorization: Bearer <token>` | `None` | `{ "resume": { "personalInfo": {}, "education": [], "experience": [], "skills": [], "summary": "" } }` |
| `/api/resume` | `POST` | `Authorization: Bearer <token>`, `Content-Type: application/json` | `{ "personalInfo": {}, "education": [], "experience": [], "skills": [], "summary": "" }` | `{ "message": "Resume saved successfully", "resume": { ... } }` |
| `/api/ats/score` | `POST` | `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` | `FormData` with `file` | `{ "score": 84, "suggestions": ["Add measurable impact", "Use ATS-friendly section headings"] }` |
| `/api/ats/jd-match` | `POST` | `Authorization: Bearer <token>`, `Content-Type: application/json` | `{ "jobDescription": "We are hiring a frontend engineer..." }` | `{ "matchPercentage": 76, "matchedKeywords": ["React"], "missingKeywords": ["TypeScript"] }` |
| `/api/ai/optimize` | `POST` | `Authorization: Bearer <token>`, `Content-Type: application/json` | `{ "resume": { ... }, "action": "summary" }` or `{ "resume": { ... }, "action": "skills" }` or `{ "resume": { ... }, "action": "optimize" }` | `{ "result": "..." }`, `{ "result": ["Tailwind CSS"] }`, or `{ "result": { ...optimizedResume } }` |
