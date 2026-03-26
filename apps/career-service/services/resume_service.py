import logging
from io import BytesIO
from pathlib import Path
import sys
from typing import Any, Dict, List

import PyPDF2
from docx import Document

sys.path.insert(0, str(Path(__file__).parent.parent))
from ml import clean_text, extract_skills

logger = logging.getLogger(__name__)


class ResumeService:
    def __init__(self):
        self.skill_extractor = None

    async def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        try:
            pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
            extracted_text = []
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text.append(page_text)
            if not extracted_text:
                raise ValueError('Could not extract text from any page in PDF')
            return '\n'.join(extracted_text)
        except Exception as error:
            logger.error('Error extracting PDF text: %s', error)
            raise

    async def extract_text_from_docx(self, docx_content: bytes) -> str:
        try:
            doc = Document(BytesIO(docx_content))
            extracted_text = [paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()]
            if not extracted_text:
                raise ValueError('Could not extract text from DOCX document')
            return '\n'.join(extracted_text)
        except Exception as error:
            logger.error('Error extracting DOCX text: %s', error)
            raise

    async def extract_text_from_txt(self, txt_content: bytes) -> str:
        try:
            text = txt_content.decode('utf-8').strip()
            if not text:
                raise ValueError('TXT file is empty')
            return text
        except UnicodeDecodeError as error:
            logger.error('Error decoding TXT file: %s', error)
            raise ValueError('TXT file encoding is not UTF-8') from error

    async def clean_resume_text(self, text: str) -> str:
        return clean_text(text)

    async def extract_skills(self, resume_text: str) -> List[str]:
        return sorted(set(extract_skills(resume_text))) if resume_text else []

    async def get_resume_data(self, pdf_content: bytes) -> Dict[str, Any]:
        raw_text = await self.extract_text_from_pdf(pdf_content)
        cleaned_text = await self.clean_resume_text(raw_text)
        skills = await self.extract_skills(cleaned_text)
        return {
            'raw_text': raw_text,
            'cleaned_text': cleaned_text,
            'skills': skills,
            'skill_count': len(skills),
        }
