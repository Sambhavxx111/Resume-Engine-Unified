import asyncio
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class PerplexityClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('PERPLEXITY_API_KEY')
        if not self.api_key:
            raise ValueError('PERPLEXITY_API_KEY must be set for the career coach.')

        self.base_url = os.getenv('PERPLEXITY_API_BASE_URL', 'https://api.perplexity.ai')
        self.model_name = os.getenv('PERPLEXITY_MODEL', 'sonar')
        self.timeout = float(os.getenv('PERPLEXITY_TIMEOUT_SECONDS', '45'))

    async def get_dynamic_response(
        self,
        query: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        system_message = system_prompt or (
            'You are an expert career coach. Give practical, specific, and concise career guidance. '
            'Focus on the user\'s next best move, skill gaps, positioning advice, and realistic actions.'
        )

        user_parts = []
        if context:
            user_parts.append(f'User background: {context}')
        user_parts.append(f'Career question: {query}')
        user_parts.append('Respond in a clean, helpful structure with actionable advice.')
        user_message = '\n\n'.join(user_parts)

        payload = {
            'model': self.model_name,
            'messages': [
                {'role': 'system', 'content': system_message},
                {'role': 'user', 'content': user_message},
            ],
            'temperature': 0.2,
        }

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f'{self.base_url}/chat/completions', json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()

        try:
            content = data['choices'][0]['message']['content']
        except (KeyError, IndexError, TypeError) as error:
            logger.error('Unexpected Perplexity response: %s', data)
            raise ValueError('Perplexity returned an unexpected response.') from error

        if isinstance(content, list):
            content = ''.join(
                part.get('text', '') if isinstance(part, dict) else str(part)
                for part in content
            )

        content = str(content).strip()
        if not content:
            raise ValueError('Perplexity returned an empty response.')

        return content
