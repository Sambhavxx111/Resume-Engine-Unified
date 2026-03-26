import logging
import os
from typing import Any, Dict, List

import requests
from requests.exceptions import ConnectionError, HTTPError, Timeout

logger = logging.getLogger(__name__)


class AdzunaClient:
    BASE_URL = 'https://api.adzuna.com/v1/api/jobs'
    SEARCH_ENDPOINT = '{base_url}/{country_code}/search/{page}'
    DEFAULT_TIMEOUT = 15
    MAX_PAGES = 5
    RESULTS_PER_PAGE = 30

    COUNTRY_CODES = {
        'india': 'in',
        'uk': 'gb',
        'usa': 'us',
        'canada': 'ca',
        'australia': 'au',
    }

    def __init__(self):
        self.app_id = os.getenv('ADZUNA_APP_ID')
        self.api_key = os.getenv('ADZUNA_API_KEY')
        self.session = requests.Session()
        self.session.timeout = self.DEFAULT_TIMEOUT

        if not self.app_id or not self.api_key:
            raise ValueError('ADZUNA_APP_ID and ADZUNA_API_KEY must be set for career job matching.')

    def _get_country_code(self, location: str = 'India') -> str:
        return self.COUNTRY_CODES.get(location.lower().strip(), 'in')

    def _generate_search_query(self, keywords: str) -> str:
        query = (keywords or '').strip()
        if not query:
            raise ValueError('At least one search keyword is required for Adzuna job matching.')
        return query

    def _get_random_page(self) -> int:
        import random
        return random.randint(1, self.MAX_PAGES)

    def _normalize_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        job_id = job_data.get('id', '')
        return {
            'title': job_data.get('title', 'Unknown Position'),
            'company': job_data.get('company', {}).get('display_name', 'Unknown Company'),
            'location': job_data.get('location', {}).get('display_name', 'Unknown Location'),
            'description': job_data.get('description', 'No description available'),
            'job_id': job_id,
            'salary_min': job_data.get('salary_min'),
            'salary_max': job_data.get('salary_max'),
            'url': job_data.get('redirect_url', ''),
            'posted_date': job_data.get('created', ''),
            'id': job_id,
            'source': 'adzuna',
        }

    def fetch_jobs(self, keywords: str, location: str = 'India', limit: int = 5) -> List[Dict[str, Any]]:
        limit = max(1, min(limit, 50))
        url = self.SEARCH_ENDPOINT.format(
            base_url=self.BASE_URL,
            country_code=self._get_country_code(location),
            page=self._get_random_page(),
        )
        params = {
            'app_id': self.app_id,
            'app_key': self.api_key,
            'what': self._generate_search_query(keywords),
            'results_per_page': self.RESULTS_PER_PAGE,
            'sort_by': 'date',
        }
        if location and location.strip().lower() != 'any':
            params['where'] = location

        try:
            response = self.session.get(url, params=params, timeout=self.DEFAULT_TIMEOUT)
            response.raise_for_status()
            data = response.json()
            if 'results' not in data:
                raise ValueError('Adzuna response did not include results.')

            normalized_jobs = [self._normalize_job(job) for job in data.get('results', [])]
            if not normalized_jobs:
                raise ValueError('Adzuna returned no jobs for the provided search criteria.')
            return normalized_jobs[:limit]
        except Timeout as error:
            logger.error('Adzuna request timed out: %s', error)
            raise RuntimeError('Adzuna request timed out while fetching job matches.') from error
        except ConnectionError as error:
            logger.error('Adzuna connection error: %s', error)
            raise RuntimeError('Unable to connect to Adzuna for job matching.') from error
        except HTTPError as error:
            logger.error('Adzuna HTTP error: %s', error)
            raise RuntimeError('Adzuna rejected the job matching request.') from error
        except Exception:
            raise

    def close(self):
        if self.session:
            self.session.close()

    def __del__(self):
        self.close()
