import logging
import os
from typing import Optional

import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            logger.warning('GEMINI_API_KEY not found in environment variables')
            raise ValueError('GEMINI_API_KEY must be set in environment variables or passed.')

        genai.configure(api_key=self.api_key)
        self.model_name = os.getenv('CAREER_SERVICE_GEMINI_MODEL', 'gemini-2.5-flash')
        self.model = genai.GenerativeModel(self.model_name)

    async def get_dynamic_response(
        self,
        query: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        prompt = system_prompt or (
            'You are an expert career counselor. Provide clear, actionable, well-structured '
            'career guidance with practical next steps, role-specific skills, and realistic advice.'
        )
        full_prompt = prompt + '\n\n'
        if context:
            full_prompt += f'User background: {context}\n\n'
        full_prompt += (
            f'Career question: {query}\n\n'
            'Respond completely and practically. Use short sections when useful.'
        )

        response = self.model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=1600,
                temperature=0.4,
                top_p=0.85,
                top_k=32,
            ),
        )
        return response.text if response.text else ''
