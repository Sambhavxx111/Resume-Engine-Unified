"""
Response structure converter for career guidance.

Converts text-based career guidance responses into structured JSON format.
"""

from typing import List, Dict, Any, Optional
from services.career_chatbot_service import CareerChatbotService


class ResponseStructureConverter:
    """Converts chatbot text responses to structured format."""
    
    def __init__(self):
        """Initialize converter with chatbot service."""
        self.chatbot = CareerChatbotService()
    
    def detect_response_type(self, query: str) -> str:
        """Determine response type from query."""
        normalized = self.chatbot._normalize_input(query)
        
        # Check for greeting
        if self.chatbot._detect_greeting(normalized):
            return "greeting"
        
        # Check for gratitude
        if self.chatbot._detect_gratitude(normalized):
            return "gratitude"
        
        # Check for role
        if self.chatbot._detect_role(normalized):
            return "career_guidance"
        
        return "generic"
    
    def extract_skills(self, roadmap: Dict[str, Any]) -> List[str]:
        """Extract skills from career roadmap."""
        return roadmap.get("skills", [])
    
    def extract_tools(self, roadmap: Dict[str, Any]) -> List[str]:
        """Extract tools from career roadmap."""
        return roadmap.get("tools", [])
    
    def extract_projects(self, roadmap: Dict[str, Any]) -> List[str]:
        """Extract projects from career roadmap."""
        return roadmap.get("projects", [])
    
    def parse_learning_steps(self, learning_path: List[str]) -> List[Dict[str, Any]]:
        """Parse learning path into structured steps."""
        steps = []
        for i, step_text in enumerate(learning_path, 1):
            # Remove bullet points and step prefix
            clean_text = step_text.strip().lstrip("•-•·").strip()
            
            # Extract title and description
            if ":" in clean_text:
                title, description = clean_text.split(":", 1)
                title = title.replace(f"Step {i}", "").strip()
                description = description.strip()
            else:
                title = clean_text
                description = ""
            
            steps.append({
                "step_number": i,
                "title": title,
                "description": description,
            })
        
        return steps
    
    def get_structured_response(self, query: str) -> Dict[str, Any]:
        """
        Get structured career guidance response.
        
        Args:
            query: User query
            
        Returns:
            Structured response dictionary
        """
        normalized = self.chatbot._normalize_input(query)
        
        # Check response type
        response_type = self.detect_response_type(query)
        
        if response_type == "greeting":
            return {
                "status": "success",
                "role_detected": "greeting",
                "is_clarification": False,
                "message": self.chatbot._detect_greeting(normalized),
                "suggestions": [],
            }
        
        elif response_type == "gratitude":
            return {
                "status": "success",
                "role_detected": "gratitude",
                "is_clarification": False,
                "message": self.chatbot._detect_gratitude(normalized),
                "suggestions": [],
            }
        
        elif response_type == "career_guidance":
            detected_role = self.chatbot._detect_role(normalized)
            
            if detected_role and detected_role in self.chatbot.CAREER_ROADMAPS:
                roadmap = self.chatbot.CAREER_ROADMAPS[detected_role]
                
                learning_steps = self.parse_learning_steps(roadmap["learning_path"])
                
                return {
                    "status": "success",
                    "role_detected": detected_role,
                    "is_clarification": False,
                    "overview": {
                        "title": roadmap["title"],
                        "description": roadmap["overview"],
                    },
                    "skills": {
                        "category": "Required Skills",
                        "items": self.extract_skills(roadmap),
                    },
                    "tools": {
                        "category": "Recommended Tools & Technologies",
                        "items": self.extract_tools(roadmap),
                    },
                    "projects": {
                        "category": "Suggested Projects to Build",
                        "items": self.extract_projects(roadmap),
                    },
                    "learning_path": {
                        "category": "Step-by-Step Learning Path",
                        "steps": learning_steps,
                    },
                    "suggestions": [
                        "Start building projects to gain practical experience",
                        "Join online communities and contribute to open-source",
                        "Consider pursuing relevant certifications",
                    ],
                }
        
        # Generic/unclear response
        return {
            "status": "success",
            "role_detected": "unclear",
            "is_clarification": True,
            "message": self.chatbot._generate_clarification_prompt(),
            "suggestions": list(self.chatbot.ROLE_KEYWORDS.keys()),
        }
