from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class RoadmapStep:
    order: int
    title: str
    description: str
    skills_to_learn: List[str]
    estimated_duration: str
    resources: List[str]
    difficulty: str


class RoadmapService:
    """Service for generating role roadmaps and skill-gap analysis."""

    ROLE_DEFINITIONS = {
        "data scientist": {
            "title": "Data Scientist",
            "description": "Professional specializing in data analysis, machine learning, and insights",
            "required_skills": [
                "python",
                "statistics",
                "machine learning",
                "sql",
                "data visualization",
                "pandas",
                "numpy",
                "scikit-learn",
                "tensorflow",
                "data cleaning",
            ],
            "salary_range": "$80k - $150k",
        },
        "backend developer": {
            "title": "Backend Developer",
            "description": "Professional building server-side applications and APIs",
            "required_skills": [
                "python",
                "java",
                "sql",
                "rest api",
                "microservices",
                "databases",
                "docker",
                "git",
                "linux",
                "api design",
            ],
            "salary_range": "$70k - $130k",
        },
        "frontend developer": {
            "title": "Frontend Developer",
            "description": "Professional building user interfaces and web applications",
            "required_skills": [
                "html",
                "css",
                "javascript",
                "react",
                "responsive design",
                "web performance",
                "browser devtools",
                "git",
                "api integration",
                "accessibility",
            ],
            "salary_range": "$65k - $120k",
        },
        "full stack developer": {
            "title": "Full Stack Developer",
            "description": "Professional with expertise in both frontend and backend development",
            "required_skills": [
                "html",
                "css",
                "javascript",
                "python",
                "react",
                "nodejs",
                "sql",
                "databases",
                "git",
                "docker",
                "rest api",
                "web performance",
            ],
            "salary_range": "$75k - $140k",
        },
        "devops engineer": {
            "title": "DevOps Engineer",
            "description": "Professional managing infrastructure, deployment, and operations",
            "required_skills": [
                "linux",
                "docker",
                "kubernetes",
                "aws",
                "ci/cd",
                "git",
                "infrastructure as code",
                "monitoring",
                "networking",
                "shell scripting",
            ],
            "salary_range": "$85k - $150k",
        },
        "machine learning engineer": {
            "title": "Machine Learning Engineer",
            "description": "Professional developing ML systems and deploying models",
            "required_skills": [
                "python",
                "machine learning",
                "deep learning",
                "tensorflow",
                "pytorch",
                "data preprocessing",
                "statistics",
                "mlops",
                "docker",
                "model deployment",
            ],
            "salary_range": "$100k - $180k",
        },
    }

    LEARNING_PATHS = {
        "data scientist": [
            RoadmapStep(1, "Master Python Fundamentals", "Learn core Python programming, data types, and control flow", ["python", "programming basics"], "4-6 weeks", ["Python Official Tutorial", "Codecademy Python Course", "Real Python Blog"], "beginner"),
            RoadmapStep(2, "Data Manipulation and Cleaning", "Master Pandas and NumPy for working with datasets", ["pandas", "numpy", "data cleaning"], "3-4 weeks", ["DataCamp: Pandas Track", "Kaggle: Pandas Tutorial", "Real Python: Pandas"], "beginner"),
            RoadmapStep(3, "SQL and Database Basics", "Learn SQL for data querying and database management", ["sql", "databases", "data retrieval"], "3-4 weeks", ["Mode Analytics SQL Tutorial", "LeetCode Database Problems", "W3Schools SQL"], "beginner"),
            RoadmapStep(4, "Statistics and Math for ML", "Build mathematical foundation for machine learning", ["statistics", "probability", "linear algebra"], "6-8 weeks", ["3Blue1Brown: Essence of Linear Algebra", "StatQuest Videos", "Khan Academy Statistics"], "intermediate"),
            RoadmapStep(5, "Introduction to Machine Learning", "Learn ML algorithms, training, and evaluation", ["machine learning", "scikit-learn", "model evaluation"], "6-8 weeks", ["Andrew Ng ML Course", "Scikit-learn Documentation", "Fast.ai ML Course"], "intermediate"),
            RoadmapStep(6, "Data Visualization", "Learn to create compelling data visualizations", ["data visualization", "matplotlib", "seaborn"], "3-4 weeks", ["Matplotlib Documentation", "Seaborn Tutorial", "Edward Tufte: Visualization Principles"], "intermediate"),
            RoadmapStep(7, "Deep Learning and Neural Networks", "Master deep learning with TensorFlow and PyTorch", ["deep learning", "tensorflow", "pytorch"], "8-10 weeks", ["TensorFlow Official Tutorials", "Deep Learning Specialization", "Fast.ai: Part 1"], "advanced"),
            RoadmapStep(8, "Real-world Projects and Portfolio", "Build end-to-end ML projects and contribute to open source", ["project management", "best practices", "deployment"], "Ongoing", ["Kaggle Competitions", "GitHub Projects", "Personal Blog/Portfolio"], "advanced"),
        ],
        "backend developer": [
            RoadmapStep(1, "Core Programming Language", "Master a backend language such as Python, Java, or Go", ["python", "oop", "programming fundamentals"], "6-8 weeks", ["Official Language Docs", "Codecademy Courses", "LeetCode Practice"], "beginner"),
            RoadmapStep(2, "Web Framework Basics", "Learn a web framework such as FastAPI, Django, or Spring", ["fastapi", "api development", "routing"], "4-6 weeks", ["FastAPI Documentation", "Tutorial Projects", "Real Python Articles"], "beginner"),
            RoadmapStep(3, "Database Fundamentals", "Learn SQL and relational database design", ["sql", "database design", "indexing"], "4-6 weeks", ["SQL Tutorial Sites", "Database Design Courses", "Normalization Concepts"], "intermediate"),
            RoadmapStep(4, "API Design and REST", "Master REST API design principles and best practices", ["rest api", "api design", "versioning"], "3-4 weeks", ["REST API Design Rules", "JSON Schema", "API Security"], "intermediate"),
            RoadmapStep(5, "Authentication and Security", "Learn JWT, OAuth, and security best practices", ["authentication", "security", "jwt"], "3-4 weeks", ["OWASP Guidelines", "Authentication Patterns", "Security Courses"], "intermediate"),
            RoadmapStep(6, "Docker and Containerization", "Master Docker for consistent deployment", ["docker", "containerization", "deployment"], "3-4 weeks", ["Docker Official Docs", "Docker Compose", "Container Best Practices"], "intermediate"),
            RoadmapStep(7, "Microservices and Advanced Patterns", "Learn microservices architecture and design patterns", ["microservices", "message queues", "design patterns"], "6-8 weeks", ["Microservices Patterns", "System Design Concepts", "Distributed Systems Courses"], "advanced"),
            RoadmapStep(8, "Testing and CI/CD", "Master testing frameworks and CI/CD pipelines", ["testing", "ci/cd", "git workflows"], "4-6 weeks", ["Testing Frameworks", "GitHub Actions", "Jenkins Tutorials"], "advanced"),
        ],
        "frontend developer": [
            RoadmapStep(1, "HTML and CSS Fundamentals", "Master semantic HTML and CSS layout techniques", ["html", "css", "web standards"], "4-6 weeks", ["MDN Web Docs", "Codecademy HTML/CSS", "CSS-Tricks"], "beginner"),
            RoadmapStep(2, "JavaScript Core", "Learn JavaScript fundamentals and ES6+", ["javascript", "dom", "async programming"], "6-8 weeks", ["Eloquent JavaScript", "You Don't Know JS", "JavaScript.info"], "beginner"),
            RoadmapStep(3, "Responsive Design", "Master mobile-first and responsive design principles", ["responsive design", "media queries", "flexbox", "grid"], "3-4 weeks", ["Responsive Design Guide", "CSS Flexbox", "CSS Grid"], "beginner"),
            RoadmapStep(4, "React Framework", "Learn React and component-based development", ["react", "components", "hooks", "state management"], "8-10 weeks", ["React Official Docs", "React Tutorials", "Real World React"], "intermediate"),
            RoadmapStep(5, "State Management", "Master state management tools such as Redux, Context, or Zustand", ["redux", "state management", "data flow"], "4-6 weeks", ["Redux Documentation", "Redux Toolkit", "State Management Patterns"], "intermediate"),
            RoadmapStep(6, "API Integration", "Learn to fetch and manage API data in frontend", ["rest api", "fetch", "axios", "error handling"], "3-4 weeks", ["Fetch API Docs", "Axios Tutorials", "API Integration Patterns"], "intermediate"),
            RoadmapStep(7, "Testing and Performance", "Master testing frameworks and performance optimization", ["testing", "jest", "performance", "web vitals"], "5-6 weeks", ["Jest Documentation", "React Testing Library", "Web Performance Guide"], "advanced"),
            RoadmapStep(8, "Advanced Topics and Portfolio", "Learn TypeScript, animations, and build real projects", ["typescript", "animations", "build tools"], "Ongoing", ["TypeScript Handbook", "Framer Motion", "Portfolio Projects"], "advanced"),
        ],
    }

    async def identify_missing_skills(self, current_skills: List[str], target_role: str) -> Dict[str, Any]:
        target_role_lower = target_role.lower()
        if target_role_lower not in self.ROLE_DEFINITIONS:
            return {"error": f"Unknown role: {target_role}", "available_roles": list(self.ROLE_DEFINITIONS.keys())}

        role_def = self.ROLE_DEFINITIONS[target_role_lower]
        required_skills = role_def["required_skills"]
        current_skills_lower = [skill.lower() for skill in current_skills]

        missing_skills = [skill for skill in required_skills if skill.lower() not in current_skills_lower]
        existing_skills = [skill for skill in required_skills if skill.lower() in current_skills_lower]

        return {
            "role": role_def["title"],
            "total_required": len(required_skills),
            "current_skills_aligned": len(existing_skills),
            "missing_skills": missing_skills,
            "missing_count": len(missing_skills),
            "completion_percentage": round((len(existing_skills) / len(required_skills)) * 100) if required_skills else 0,
            "existing_skills": existing_skills,
        }

    async def generate_roadmap(self, target_role: str, current_skills: List[str] = None) -> Dict[str, Any]:
        current_skills = current_skills or []
        target_role_lower = target_role.lower()

        if target_role_lower not in self.ROLE_DEFINITIONS:
            return {"error": f"Unknown role: {target_role}", "available_roles": list(self.ROLE_DEFINITIONS.keys())}

        role_def = self.ROLE_DEFINITIONS[target_role_lower]
        learning_path = self.LEARNING_PATHS.get(target_role_lower, [])
        skill_analysis = await self.identify_missing_skills(current_skills, target_role)

        roadmap_steps = [
            {
                "step": step.order,
                "title": step.title,
                "description": step.description,
                "skills": step.skills_to_learn,
                "duration": step.estimated_duration,
                "resources": step.resources,
                "difficulty": step.difficulty,
            }
            for step in learning_path
        ]

        return {
            "role": role_def["title"],
            "description": role_def["description"],
            "salary_range": role_def["salary_range"],
            "required_skills": role_def["required_skills"],
            "skill_analysis": skill_analysis,
            "roadmap_steps": roadmap_steps,
            "total_steps": len(roadmap_steps),
            "estimated_timeline": "3-6 months for focused learning",
        }
