import asyncio
import logging
from pathlib import Path
import sys
from typing import Any, Dict, List

sys.path.insert(0, str(Path(__file__).parent.parent))
from ml import compute_similarity
from services.adzuna_client import AdzunaClient

logger = logging.getLogger(__name__)


class JobMatcher:
    def __init__(self):
        self.adzuna_client = AdzunaClient()

    async def convert_skills_to_keywords(self, skills: List[str]) -> List[str]:
        if not skills:
            return []

        skill_keyword_map = {
            'python': ['python'],
            'javascript': ['javascript', 'js'],
            'java': ['java'],
            'c++': ['c++'],
            'csharp': ['c#'],
            'go': ['golang', 'go'],
            'django': ['django', 'python'],
            'fastapi': ['fastapi', 'python'],
            'react': ['react', 'reactjs'],
            'vue': ['vue'],
            'angular': ['angular'],
            'node.js': ['nodejs', 'node'],
            'postgresql': ['postgresql', 'postgres'],
            'mongodb': ['mongodb'],
            'aws': ['aws'],
            'docker': ['docker'],
            'kubernetes': ['kubernetes'],
            'machine learning': ['machine learning', 'ml'],
            'tensorflow': ['tensorflow'],
            'pytorch': ['pytorch'],
            'sql': ['sql'],
            'typescript': ['typescript', 'ts'],
        }

        keywords = []
        for skill in [s.lower() for s in skills]:
            keywords.extend(skill_keyword_map.get(skill, [skill]))

        seen = set()
        unique_keywords = []
        for keyword in keywords:
            if keyword not in seen:
                unique_keywords.append(keyword)
                seen.add(keyword)
        return unique_keywords

    async def fetch_adzuna_jobs(self, keywords: List[str], location: str = '', limit: int = 20) -> List[Dict[str, Any]]:
        if not keywords:
            return []

        search_strategies = [keywords[:1], keywords[:2], keywords[:4]]
        jobs = []
        loop = asyncio.get_event_loop()

        for keywords_to_try in search_strategies:
            if not keywords_to_try:
                continue
            query = keywords_to_try[0] if len(keywords_to_try) == 1 else ' '.join(keywords_to_try[:2])
            jobs = await loop.run_in_executor(
                None,
                lambda q=query: self.adzuna_client.fetch_jobs(q, location=location, limit=limit),
            )
            if jobs:
                return jobs

        return jobs

    def _keyword_overlap_score(self, skills: List[str], job: Dict[str, Any]) -> float:
        haystack = f"{job.get('title', '')} {job.get('description', '')}".lower()
        normalized_skills = [skill.lower() for skill in skills if skill]
        if not normalized_skills:
            return 0.0

        matched = sum(1 for skill in normalized_skills if skill in haystack)
        return matched / len(normalized_skills)

    async def calculate_skill_similarity(self, skills: List[str], jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not jobs or not skills:
            return []

        resume_text = ' '.join(skills)
        jobs_with_scores = []
        for job in jobs:
            title = job.get('title', '')
            description = job.get('description', '')
            comparison_text = f'{title} {description}'.strip()
            cosine_score = float(compute_similarity(resume_text, comparison_text))
            overlap_score = self._keyword_overlap_score(skills, job)
            boosted_score = min(1.0, (cosine_score * 0.45) + (overlap_score * 0.55))

            job_with_score = job.copy()
            job_with_score['match_score'] = round(boosted_score, 4)
            jobs_with_scores.append(job_with_score)
        return jobs_with_scores

    async def rank_jobs(self, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return sorted(jobs, key=lambda item: item.get('match_score', 0.0), reverse=True)

    async def find_best_matches(
        self,
        skills: List[str],
        resume_text: str = '',
        location: str = '',
        limit: int = 10,
        min_score: float = 0.0,
    ) -> List[Dict[str, Any]]:
        if not skills:
            return []

        keywords = await self.convert_skills_to_keywords(skills)
        jobs = await self.fetch_adzuna_jobs(keywords=keywords, location=location, limit=limit * 2)
        if not jobs:
            return []

        matching_input = [resume_text] if resume_text.strip() else skills
        scored_jobs = await self.calculate_skill_similarity(matching_input, jobs)
        filtered_jobs = [job for job in scored_jobs if job.get('match_score', 0.0) >= min_score]
        ranked_jobs = await self.rank_jobs(filtered_jobs)
        return ranked_jobs[:limit]

    def close(self):
        if self.adzuna_client:
            self.adzuna_client.close()

    def __del__(self):
        self.close()
