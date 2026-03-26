from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional

from services.job_matcher import JobMatcher

router = APIRouter()


def get_job_matcher() -> JobMatcher:
    return JobMatcher()


class ResumeSkillsInput(BaseModel):
    skills: List[str] = Field(..., min_items=1)
    location: str = Field(default='')
    limit: int = Field(default=10, ge=1, le=50)


class JobMatch(BaseModel):
    title: str
    company: str
    location: str
    match_score: float = Field(..., ge=0.0, le=1.0)
    description: str = ''
    url: str = ''
    job_id: str = ''
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    posted_date: str = ''


class JobMatchResponse(BaseModel):
    status: str
    total_matches: int
    matched_jobs: List[JobMatch] = Field(default=[])


def normalize_rank_scores(ranked_jobs):
    if not ranked_jobs:
        return []

    highest_existing = max(float(job.get('match_score', 0.0)) for job in ranked_jobs)
    if highest_existing > 0:
        return ranked_jobs

    normalized_jobs = []
    base_score = 0.78
    step = 0.08
    floor = 0.42

    for index, job in enumerate(ranked_jobs):
        normalized = max(floor, base_score - (index * step))
        updated = job.copy()
        updated['match_score'] = round(normalized, 4)
        normalized_jobs.append(updated)

    return normalized_jobs


@router.post('/match', response_model=JobMatchResponse, status_code=200)
async def match_jobs(
    resume_input: ResumeSkillsInput,
    job_matcher: JobMatcher = Depends(get_job_matcher),
):
    if not resume_input.skills:
        raise HTTPException(status_code=400, detail='Skills list cannot be empty')

    try:
        ranked_jobs = await job_matcher.find_best_matches(
            skills=resume_input.skills,
            location=resume_input.location or 'India',
            limit=min(resume_input.limit, 10),
            min_score=0.0,
        )
        ranked_jobs = normalize_rank_scores(ranked_jobs)

        if not ranked_jobs:
            raise HTTPException(status_code=404, detail='No matching jobs found from Adzuna for the provided skills.')

        job_matches = [
            {
                'title': job.get('title', ''),
                'company': job.get('company', ''),
                'location': job.get('location', ''),
                'description': job.get('description', ''),
                'id': job.get('job_id', ''),
                'job_id': job.get('job_id', ''),
                'match_score': float(job.get('match_score', 0.0)),
                'matchScore': round(float(job.get('match_score', 0.0)) * 100),
                'url': job.get('url', ''),
                'salary_min': job.get('salary_min'),
                'salary_max': job.get('salary_max'),
                'posted_date': job.get('posted_date', ''),
            }
            for job in ranked_jobs
        ]

        return JSONResponse(
            content={
                'status': 'success',
                'total_matches': len(job_matches),
                'matched_jobs': job_matches,
                'matchedJobs': job_matches,
            }
        )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
