from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from typing import List

from services.resume_service import ResumeService


# Response Models
class ResumeUploadResponse(BaseModel):
    """Response model for resume upload."""
    status: str = Field(..., description="Operation status", example="success")
    skills: List[str] = Field(
        ...,
        description="List of extracted skills from resume",
        example=["Python", "FastAPI", "React", "PostgreSQL", "Machine Learning"],
    )
    resume_text: str = Field(
        ...,
        description="Extracted text from PDF resume",
        example="John Doe\nSoftware Engineer with 5+ years of experience...",
    )


# Initialize router
router = APIRouter()

# Initialize resume service
resume_service = ResumeService()


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    summary="Upload and Extract Resume",
    response_description="Extracted skills and resume text",
    responses={
        200: {"description": "Successfully extracted resume data"},
        400: {"description": "Invalid file type or corrupted file"},
        422: {"description": "Missing file"},
    },
    status_code=200,
)
async def upload_resume(file: UploadFile = File(...)) -> ResumeUploadResponse:
    """
    Upload a resume file (PDF, DOCX, or TXT) and extract skills using NLP.
    
    Args:
        file: Resume file to upload (PDF, DOCX, or TXT)
        
    Returns:
        ResumeUploadResponse containing:
        - status: "success"
        - skills: List of extracted skills
        - resume_text: Full extracted text from resume
        
    Raises:
        HTTPException: If file is invalid or cannot be processed
    """
    # Validate file type and extension
    allowed_types = [
        "application/pdf",
        "application/x-pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ]
    
    filename_lower = file.filename.lower()
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload PDF, DOCX, or TXT file.",
        )
    
    if not (filename_lower.endswith(".pdf") or filename_lower.endswith(".docx") or filename_lower.endswith(".txt")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file extension. Only .pdf, .docx, and .txt files are accepted.",
        )
    
    try:
        # Read file
        content = await file.read()
        
        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty.",
            )
        
        # Extract text based on file type
        if filename_lower.endswith(".pdf"):
            resume_text = await resume_service.extract_text_from_pdf(content)
        elif filename_lower.endswith(".docx"):
            resume_text = await resume_service.extract_text_from_docx(content)
        elif filename_lower.endswith(".txt"):
            resume_text = await resume_service.extract_text_from_txt(content)
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type.",
            )
        
        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the file. It may be corrupted or empty.",
            )
        
        # Extract skills using NLP
        skills = await resume_service.extract_skills(resume_text)
        
        return ResumeUploadResponse(
            status="success",
            skills=skills,
            resume_text=resume_text,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing resume: {str(e)}",
        )
    finally:
        await file.close()
