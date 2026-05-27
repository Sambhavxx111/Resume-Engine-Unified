from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from typing import List

from services.resume_service import ResumeService

MAX_RESUME_UPLOAD_BYTES = 5 * 1024 * 1024
DANGEROUS_INNER_EXTENSIONS = {
    ".ade",
    ".adp",
    ".apk",
    ".app",
    ".bat",
    ".bin",
    ".cmd",
    ".com",
    ".cpl",
    ".dll",
    ".dmg",
    ".exe",
    ".hta",
    ".jar",
    ".js",
    ".jse",
    ".lnk",
    ".msi",
    ".ps1",
    ".scr",
    ".sh",
    ".vbe",
    ".vbs",
    ".wsf",
}


def has_dangerous_double_extension(filename: str) -> bool:
    parts = filename.lower().split("/")[-1].split("\\")[-1].split(".")
    if len(parts) <= 2:
        return False
    return any(f".{part}" in DANGEROUS_INNER_EXTENSIONS for part in parts[1:-1])


def content_matches_extension(filename: str, content_type: str, content: bytes) -> bool:
    lower_name = filename.lower()
    if not content or len(content) > MAX_RESUME_UPLOAD_BYTES:
        return False

    if lower_name.endswith(".pdf") and content_type in {"application/pdf", "application/x-pdf"}:
        return content.startswith(b"%PDF")

    if lower_name.endswith(".docx") and content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return content.startswith((b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"))

    if lower_name.endswith(".txt") and content_type == "text/plain":
        sample = content[:4096]
        if b"\x00" in sample:
            return False
        suspicious = sum(1 for byte in sample if byte < 9 or 13 < byte < 32)
        return suspicious / max(len(sample), 1) < 0.02

    return False


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
        content = await file.read()
        
        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty.",
            )

        if len(content) > MAX_RESUME_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Uploaded file is too large.",
            )

        if has_dangerous_double_extension(file.filename) or not content_matches_extension(file.filename, file.content_type, content):
            raise HTTPException(
                status_code=400,
                detail="Uploaded file content does not match the declared resume type.",
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
