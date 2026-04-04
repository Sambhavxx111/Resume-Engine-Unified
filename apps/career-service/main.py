import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

allowed_origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
]

configured_origins = os.getenv('CAREER_SERVICE_CORS_ORIGINS', '')
allowed_origins.extend(origin.strip() for origin in configured_origins.split(',') if origin.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

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
