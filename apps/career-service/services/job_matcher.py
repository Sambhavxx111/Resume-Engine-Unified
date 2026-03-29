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
            # Core software
            'python': ['python'],
            'javascript': ['javascript', 'js'],
            'java': ['java'],
            'c++': ['c++'],
            'csharp': ['c#', '.net'],
            'go': ['golang', 'go'],
            'typescript': ['typescript', 'ts'],
            'sql': ['sql'],
            'postgresql': ['postgresql', 'postgres'],
            'mongodb': ['mongodb'],
            'mysql': ['mysql', 'sql'],
            'oracle': ['oracle', 'pl/sql'],
            'django': ['django', 'python'],
            'fastapi': ['fastapi', 'python'],
            'flask': ['flask', 'python'],
            'spring boot': ['spring boot', 'java'],
            'react': ['react', 'reactjs'],
            'vue': ['vue', 'vuejs'],
            'angular': ['angular'],
            'node.js': ['nodejs', 'node'],
            'express': ['express', 'nodejs'],
            'php': ['php'],
            'laravel': ['laravel', 'php'],
            'ruby on rails': ['ruby on rails', 'ruby'],

            # Data / AI / analytics
            'machine learning': ['machine learning', 'ml'],
            'deep learning': ['deep learning', 'neural networks'],
            'data science': ['data science', 'data scientist'],
            'data analysis': ['data analysis', 'data analyst'],
            'data analytics': ['data analytics', 'data analyst'],
            'business intelligence': ['business intelligence', 'bi analyst'],
            'power bi': ['power bi', 'bi'],
            'tableau': ['tableau', 'data visualization'],
            'excel': ['excel', 'spreadsheets'],
            'statistics': ['statistics', 'statistical analysis'],
            'tensorflow': ['tensorflow'],
            'pytorch': ['pytorch'],
            'nlp': ['nlp', 'natural language processing'],
            'computer vision': ['computer vision', 'image processing'],

            # Cloud / DevOps / infra
            'aws': ['aws', 'cloud'],
            'azure': ['azure', 'cloud'],
            'gcp': ['gcp', 'google cloud', 'cloud'],
            'docker': ['docker', 'containers'],
            'kubernetes': ['kubernetes', 'k8s'],
            'devops': ['devops', 'ci/cd', 'deployment'],
            'linux': ['linux', 'unix'],
            'terraform': ['terraform', 'infrastructure as code'],
            'ansible': ['ansible', 'automation'],
            'jenkins': ['jenkins', 'ci/cd'],
            'networking': ['networking', 'network engineer'],

            # Cybersecurity
            'cybersecurity': ['cybersecurity', 'information security'],
            'cyber security': ['cybersecurity', 'information security'],
            'vapt': ['vapt', 'penetration testing', 'vulnerability assessment'],
            'penetration testing': ['penetration testing', 'ethical hacking'],
            'siem': ['siem', 'soc'],
            'incident response': ['incident response', 'soc'],
            'digital forensics': ['digital forensics', 'forensics'],
            'threat intelligence': ['threat intelligence', 'security analyst'],

            # Testing / QA
            'qa': ['qa', 'quality assurance', 'tester'],
            'testing': ['testing', 'qa'],
            'selenium': ['selenium', 'automation testing'],
            'automation testing': ['automation testing', 'qa automation'],
            'manual testing': ['manual testing', 'software tester'],

            # Mobile / frontend design
            'android': ['android', 'android developer'],
            'ios': ['ios', 'ios developer'],
            'flutter': ['flutter', 'dart'],
            'react native': ['react native', 'mobile developer'],
            'ui/ux': ['ui/ux', 'ux designer', 'ui designer'],
            'ui ux': ['ui/ux', 'ux designer', 'ui designer'],
            'figma': ['figma', 'ui designer'],
            'graphic design': ['graphic design', 'designer'],

            # Business / product / operations
            'business analysis': ['business analyst', 'requirement analysis'],
            'business analyst': ['business analyst', 'requirement analysis'],
            'product management': ['product manager', 'product management'],
            'project management': ['project manager', 'project management'],
            'agile': ['agile', 'scrum'],
            'scrum': ['scrum', 'agile'],
            'operations': ['operations', 'operations executive'],
            'supply chain': ['supply chain', 'logistics'],
            'logistics': ['logistics', 'supply chain'],
            'hr': ['human resources', 'hr'],
            'recruitment': ['recruitment', 'talent acquisition'],
            'marketing': ['marketing', 'digital marketing'],
            'digital marketing': ['digital marketing', 'seo', 'sem'],
            'seo': ['seo', 'search engine optimization'],
            'sales': ['sales', 'business development'],
            'customer support': ['customer support', 'client support'],
            'content writing': ['content writer', 'copywriter'],

            # Finance / commerce
            'finance': ['finance', 'financial analyst'],
            'accounting': ['accounting', 'accountant'],
            'tally': ['tally', 'accounting'],
            'taxation': ['taxation', 'tax analyst'],
            'investment banking': ['investment banking', 'financial analyst'],

            # Core engineering / manufacturing
            'mechanical engineering': ['mechanical engineer', 'manufacturing'],
            'mechanical': ['mechanical engineer', 'manufacturing'],
            'civil engineering': ['civil engineer', 'construction'],
            'civil': ['civil engineer', 'construction'],
            'electrical engineering': ['electrical engineer', 'power systems'],
            'electrical': ['electrical engineer', 'power systems'],
            'electronics': ['electronics engineer', 'embedded systems'],
            'embedded systems': ['embedded systems', 'firmware'],
            'automobile engineering': ['automobile engineer', 'automotive'],
            'autocad': ['autocad', 'design engineer'],
            'solidworks': ['solidworks', 'mechanical design'],
            'catia': ['catia', 'design engineer'],
            'matlab': ['matlab', 'simulation'],
            'plc': ['plc', 'automation engineer'],

            # Healthcare / life sciences / education
            'nursing': ['nurse', 'nursing'],
            'pharmacy': ['pharmacist', 'pharmacy'],
            'biotechnology': ['biotechnology', 'biotech'],
            'biology': ['biology', 'life sciences'],
            'chemistry': ['chemistry', 'chemist'],
            'teacher': ['teacher', 'teaching'],
            'teaching': ['teacher', 'teaching'],
            'education': ['teacher', 'education'],

            # Legal / misc professional domains
            'law': ['legal', 'lawyer'],
            'legal research': ['legal research', 'legal'],
            'journalism': ['journalist', 'content writer'],
            'media': ['media', 'communications'],
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
