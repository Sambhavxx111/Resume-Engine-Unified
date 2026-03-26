import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.groq_client import GroqClient

logger = logging.getLogger(__name__)


class ChatQuery(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    context: Optional[str] = Field(default='')


class ChatResponse(BaseModel):
    status: str = Field(...)
    message: str = Field(...)
    suggestions: List[str] = Field(default=[])


router = APIRouter()
groq_client = GroqClient()


@router.post('/query', response_model=ChatResponse, status_code=200)
async def chat_query(query: ChatQuery) -> ChatResponse:
    if not query.message or not query.message.strip():
        raise HTTPException(status_code=400, detail='Message cannot be empty.')

    try:
        response_text = await groq_client.get_dynamic_response(
            query=query.message.strip(),
            context=query.context if query.context else None,
            system_prompt=(
                'You are the in-product career coach for a resume and job strategy app. '
                'Use the provided context as the source of truth. If resume details are present in context, '
                'do not say you cannot access the resume and do not ask the user to upload it again. '
                'Keep the answer concise and practical. Limit the main response to 3 short sections: '
                'Best-fit roles, top gaps, and next actions. Use short bullets or very short paragraphs. '
                'Avoid long introductions, disclaimers, repeated questions, and generic filler.'
            ),
        )
        suggestions = _extract_suggestions(response_text)
        return ChatResponse(status='success', message=response_text, suggestions=suggestions)
    except Exception as error:
        logger.error('Error in career coach query: %s', error, exc_info=True)
        raise HTTPException(status_code=500, detail='Groq career coach is unavailable right now.')


@router.post('/query-structured', response_model=dict, status_code=200)
async def chat_query_structured(query: ChatQuery) -> dict:
    if not query.message or not query.message.strip():
        raise HTTPException(status_code=400, detail='Message cannot be empty.')

    try:
        response_text = await groq_client.get_dynamic_response(
            query=query.message.strip(),
            context=query.context if query.context else None,
            system_prompt=(
                'You are the in-product career coach for a resume and job strategy app. '
                'Use the provided context as the source of truth. If resume details are present in context, '
                'do not say you cannot access the resume and do not ask for the resume again. '
                'Respond in very short sections with direct, actionable advice. Cover best-fit roles, '
                'top gaps, and the next 3 actions only.'
            ),
        )
        return {
            'status': 'success',
            'role_detected': 'groq',
            'is_clarification': False,
            'message': response_text,
            'suggestions': _extract_suggestions(response_text),
        }
    except Exception as error:
        logger.error('Error in structured career coach query: %s', error, exc_info=True)
        raise HTTPException(status_code=500, detail='Groq career coach is unavailable right now.')


def _extract_suggestions(response_text: str) -> List[str]:
    suggestions = []
    extract_keywords = [
        'learn', 'focus on', 'build', 'practice', 'develop', 'improve', 'target', 'update', 'highlight'
    ]

    for line in response_text.split('\n'):
        cleaned = line.strip().lstrip('-*1234567890. ').strip()
        lower = cleaned.lower()
        if not cleaned:
            continue
        if any(keyword in lower for keyword in extract_keywords):
            if cleaned not in suggestions:
                suggestions.append(cleaned)
        if len(suggestions) >= 3:
            break

    if not suggestions:
        suggestions = [
            'Target one role family and align your resume to it.',
            'Strengthen the strongest project that proves your fit.',
            'Close the top one or two skill gaps before the next applications.',
        ]

    return suggestions[:3]
