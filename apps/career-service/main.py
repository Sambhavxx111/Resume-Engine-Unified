import os
import time
from collections import defaultdict, deque
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


def load_environment() -> None:
    service_dir = Path(__file__).resolve().parent
    service_env = service_dir / '.env'
    shared_candidates = [
        service_dir.parent / 'backend' / '.env',
        service_dir.parent.parent / '.env',
    ]

    if service_env.exists():
        load_dotenv(dotenv_path=service_env, override=True)

    for env_file in shared_candidates:
        if env_file.exists():
            load_dotenv(dotenv_path=env_file, override=False)


load_environment()

from api import chatbot, jobs, resume


class HealthCheckResponse(BaseModel):
    status: str = Field(..., description='Service status', example='healthy')
    message: str = Field(
        ...,
        description='Status message',
        example='Resume Engine career service is running successfully',
    )


app = FastAPI(
    title='Resume Engine Career Service',
    description='Career guidance, resume skill extraction, and job matching for Resume Engine.',
    version='1.0.0',
    docs_url='/docs',
    redoc_url=None,
    openapi_url='/openapi.json',
)

is_production = os.getenv('NODE_ENV') == 'production' or os.getenv('ENVIRONMENT') == 'production'
configured_origins = [
    origin.strip()
    for origin in os.getenv('CAREER_SERVICE_CORS_ORIGINS', '').split(',')
    if origin.strip()
]
production_origins = configured_origins or [
    'https://resume-engine-unified-virid.vercel.app',
    'https://resume-engine-unified.vercel.app',
]
local_origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
]
local_origin_regex = (
    r"https?://(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|"
    r"192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])"
    r"(?:\.\d{1,3}){2})(:\d+)?$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=production_origins if is_production else [*local_origins, *configured_origins],
    allow_origin_regex=None if is_production else local_origin_regex,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

_rate_limit_buckets = defaultdict(deque)


@app.middleware('http')
async def security_headers_and_rate_limit(request: Request, call_next):
    client_host = request.client.host if request.client else 'unknown'
    route_key = '/'.join(request.url.path.split('/')[1:3]) or 'root'
    limit = int(os.getenv('CAREER_SERVICE_RATE_LIMIT_MAX', '120'))
    window_seconds = int(os.getenv('CAREER_SERVICE_RATE_LIMIT_WINDOW_SECONDS', '900'))

    if request.url.path.startswith('/api/chatbot'):
        limit = int(os.getenv('CAREER_SERVICE_AI_RATE_LIMIT_MAX', '30'))
    elif request.url.path.startswith('/api/resume'):
        limit = int(os.getenv('CAREER_SERVICE_UPLOAD_RATE_LIMIT_MAX', '20'))

    now = time.time()
    bucket_key = f'{client_host}:{route_key}'
    bucket = _rate_limit_buckets[bucket_key]
    while bucket and bucket[0] <= now - window_seconds:
        bucket.popleft()

    if len(bucket) >= limit:
        return JSONResponse(
            status_code=429,
            content={'detail': 'Too many requests. Please slow down and try again later.'},
        )

    bucket.append(now)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['Permissions-Policy'] = (
        'accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), '
        'display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), '
        'gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), '
        'picture-in-picture=(), usb=(), xr-spatial-tracking=()'
    )
    response.headers['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    if is_production:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

app.include_router(resume.router, prefix='/api/resume', tags=['Resume'])
app.include_router(jobs.router, prefix='/api/jobs', tags=['Jobs'])
app.include_router(chatbot.router, prefix='/api/chatbot', tags=['Chatbot'])


@app.get('/', response_model=HealthCheckResponse, tags=['Health'])
async def health_check() -> HealthCheckResponse:
    return HealthCheckResponse(
        status='healthy',
        message='Resume Engine career service is running successfully',
    )


@app.get('/health', response_model=HealthCheckResponse, tags=['Health'])
async def detailed_health_check() -> HealthCheckResponse:
    return await health_check()


if __name__ == '__main__':
    import uvicorn

    host = os.getenv('HOST') or os.getenv('CAREER_SERVICE_HOST') or '0.0.0.0'
    port = int(os.getenv('PORT') or os.getenv('CAREER_SERVICE_PORT') or '8000')

    uvicorn.run(
        'main:app',
        host=host,
        port=port,
        reload=False,
    )
