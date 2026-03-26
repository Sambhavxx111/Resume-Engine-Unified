# Career Service

This service adds career guidance, resume skill extraction, and Adzuna-powered job matching to Resume Engine.

Environment loading order:
1. `apps/career-service/.env`
2. `apps/backend/.env`
3. project root `.env`

This lets the service reuse existing Gemini and Adzuna keys without overwriting the current backend configuration.
