import logging
import asyncio
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.career_chatbot_service import CareerChatbotService
from services.career_guidance_service import CareerGuidanceService
from services.response_converter import ResponseStructureConverter

logger = logging.getLogger(__name__)


class ChatQuery(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    context: Optional[str] = Field(default="", max_length=4000)
    skills: List[str] = Field(default=[], max_length=100)
    matched_jobs: List[Dict[str, Any]] = Field(default=[], max_length=10)


class ChatResponse(BaseModel):
    status: str = Field(...)
    message: str = Field(...)
    suggestions: List[str] = Field(default=[])


router = APIRouter()
career_chatbot = CareerChatbotService(use_groq=True)
career_guidance = CareerGuidanceService()
response_converter = ResponseStructureConverter()


@router.post("/query", response_model=ChatResponse, status_code=200)
async def chat_query(query: ChatQuery) -> ChatResponse:
    if not query.message or not query.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        response_text = await career_chatbot.get_career_guidance_hybrid(
            query=query.message.strip(),
            context=query.context if query.context else None,
        )
        return ChatResponse(
            status="success",
            message=response_text,
            suggestions=_extract_suggestions(response_text),
        )
    except Exception as error:
        logger.error("Error in chatbot query: %s", error, exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing your query. Please try again.")


@router.post("/query-rich", response_model=dict, status_code=200)
async def chat_query_rich(query: ChatQuery) -> dict:
    if not query.message or not query.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        return await career_guidance.generate_guidance(
            message=query.message.strip(),
            context=query.context or "",
            current_skills=query.skills or [],
            matched_jobs=query.matched_jobs or [],
        )
    except Exception as error:
        logger.error("Error in rich chatbot query: %s", error, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error processing your career guidance request. Please try again.",
        )


@router.post("/query-structured", response_model=dict, status_code=200)
async def chat_query_structured(query: ChatQuery) -> dict:
    if not query.message or not query.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        return await asyncio.to_thread(response_converter.get_structured_response, query.message.strip())
    except Exception as error:
        logger.error("Error in structured chatbot query: %s", error, exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing your query. Please try again.")


def _extract_suggestions(response_text: str) -> List[str]:
    suggestions = []
    extract_keywords = [
        "learn",
        "master",
        "study",
        "focus on",
        "build",
        "practice",
        "explore",
        "understand",
        "develop",
    ]

    for line in response_text.split("\n"):
        line_lower = line.lower().strip()
        for keyword in extract_keywords:
            if keyword in line_lower:
                suggestion = line.strip().lstrip("-*0123456789. ").strip()
                if suggestion and len(suggestion) > 5 and suggestion not in suggestions:
                    suggestions.append(suggestion)
                    break
        if len(suggestions) >= 3:
            break

    if not suggestions:
        suggestions = [
            "Define your career goal clearly.",
            "Create a focused learning roadmap.",
            "Build portfolio projects that prove your fit.",
        ]

    return suggestions[:3]
