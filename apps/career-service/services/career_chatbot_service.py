"""
Hybrid career guidance chatbot service.

Combines rule-based guidance with Groq for dynamic responses.
"""

import logging
import re
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class CareerChatbotService:
    """Career guidance chatbot service."""

    GREETING_PATTERNS = {
        "hi": "Hello! I'm your career guidance assistant. How can I help you today?",
        "hello": "Hi there! Welcome to the career guidance chatbot. What would you like to know?",
        "hey": "Hey! Happy to help with your career questions.",
        "greetings": "Greetings! What career guidance do you need?",
        "good morning": "Good morning! Ready to explore your career path?",
        "good afternoon": "Good afternoon! How can I assist with your career?",
        "good evening": "Good evening! Let's talk about your career goals.",
    }

    GRATITUDE_PATTERNS = {
        "thanks": "You're welcome! Feel free to ask if you have more questions.",
        "thank you": "Happy to help! Good luck with your career journey!",
        "appreciate": "My pleasure! Don't hesitate to reach out anytime.",
        "grateful": "It's my pleasure to assist you!",
        "thank": "You're welcome! Best of luck!",
    }

    ROLE_KEYWORDS = {
        "ai/ml engineer": {
            "keywords": [
                "ai",
                "ml",
                "machine learning",
                "artificial intelligence",
                "deep learning",
                "neural",
                "tensorflow",
                "pytorch",
            ],
            "variations": [
                "ai engineer",
                "ml engineer",
                "machine learning engineer",
                "ai specialist",
            ],
        },
        "data scientist": {
            "keywords": [
                "data science",
                "data scientist",
                "predictive",
                "statistical",
                "data modeling",
            ],
            "variations": ["data science engineer", "data analyst", "research scientist"],
        },
        "backend developer": {
            "keywords": [
                "backend",
                "api",
                "server",
                "microservice",
                "nodejs",
                "django",
                "flask",
                "express",
            ],
            "variations": ["backend engineer", "server developer", "api developer"],
        },
        "frontend developer": {
            "keywords": [
                "frontend",
                "react",
                "vue",
                "angular",
                "ui",
                "ux",
                "web",
                "javascript",
                "html",
                "css",
            ],
            "variations": ["frontend engineer", "web developer", "ui developer"],
        },
        "full stack developer": {
            "keywords": ["full stack", "fullstack", "mern", "mean", "lamp", "both frontend and backend"],
            "variations": ["full stack engineer", "full stack web developer"],
        },
        "cloud engineer": {
            "keywords": [
                "cloud",
                "aws",
                "azure",
                "gcp",
                "devops",
                "infrastructure",
                "kubernetes",
                "docker",
            ],
            "variations": ["cloud architect", "devops engineer", "infrastructure engineer"],
        },
        "data analyst": {
            "keywords": [
                "data analyst",
                "analytics",
                "tableau",
                "power bi",
                "excel",
                "sql analytics",
                "business intelligence",
            ],
            "variations": ["bi analyst", "analytics engineer", "insights analyst"],
        },
        "cyber security": {
            "keywords": [
                "cyber security",
                "cybersecurity",
                "security",
                "penetration",
                "hacking",
                "encryption",
                "secure",
            ],
            "variations": ["security engineer", "security specialist", "infosec"],
        },
    }

    CAREER_ROADMAPS = {
        "ai/ml engineer": {
            "title": "AI/ML Engineer",
            "overview": "AI/ML Engineers design and implement intelligent systems using machine learning algorithms and deep learning techniques.",
            "skills": [
                "Python programming",
                "Machine Learning (Supervised & Unsupervised)",
                "Deep Learning (Neural Networks, CNNs, RNNs)",
                "TensorFlow and PyTorch",
                "Data Preprocessing and Feature Engineering",
                "Statistics and Mathematics",
                "Natural Language Processing",
                "Computer Vision",
                "Model Deployment and MLOps",
                "Big Data Technologies",
            ],
            "tools": [
                "Python (NumPy, Pandas, Scikit-learn)",
                "TensorFlow and Keras",
                "PyTorch",
                "Jupyter Notebook",
                "Git and GitHub",
                "Docker",
                "AWS SageMaker",
                "MLflow",
                "SQL",
                "Apache Spark",
            ],
            "projects": [
                "Build a sentiment analysis model using NLP",
                "Create an image classification system with CNNs",
                "Develop a recommendation engine for e-commerce",
                "Build a time-series forecasting model",
                "Deploy an ML model as a web service",
            ],
            "learning_path": [
                "Step 1: Master Python programming and data structures",
                "Step 2: Learn statistics, probability, and linear algebra",
                "Step 3: Study supervised learning algorithms",
                "Step 4: Explore unsupervised learning",
                "Step 5: Deep dive into neural networks and deep learning",
                "Step 6: Learn TensorFlow and PyTorch frameworks",
                "Step 7: Practice with real-world datasets and competitions",
                "Step 8: Learn model deployment and MLOps practices",
            ],
        },
        "data scientist": {
            "title": "Data Scientist",
            "overview": "Data Scientists extract insights from data using statistical analysis, machine learning, and data visualization.",
            "skills": [
                "Python and R programming",
                "SQL and database querying",
                "Statistical analysis",
                "Data visualization",
                "Machine learning",
                "Exploratory data analysis",
                "Data cleaning and wrangling",
                "Business acumen",
                "Communication skills",
                "Domain knowledge",
            ],
            "tools": [
                "Python (Pandas, NumPy, Scikit-learn, Matplotlib)",
                "R",
                "SQL",
                "Tableau and Power BI",
                "Jupyter Notebook",
                "Git",
                "Excel",
                "Statistical software",
                "AWS and cloud platforms",
                "Spark",
            ],
            "projects": [
                "Analyze customer churn data and build predictive models",
                "Create interactive dashboards for business metrics",
                "Build a customer segmentation model",
                "Conduct A/B testing and statistical analysis",
                "Develop data-driven insights report",
            ],
            "learning_path": [
                "Step 1: Learn Python, SQL, and Excel fundamentals",
                "Step 2: Master statistics and probability theory",
                "Step 3: Study data exploration and visualization",
                "Step 4: Learn machine learning algorithms",
                "Step 5: Practice data cleaning and preprocessing",
                "Step 6: Develop business analytics skills",
                "Step 7: Work on real datasets and projects",
                "Step 8: Learn communication and storytelling with data",
            ],
        },
        "backend developer": {
            "title": "Backend Developer",
            "overview": "Backend Developers build robust server-side applications, APIs, and databases that power web and mobile applications.",
            "skills": [
                "Server-side programming languages",
                "RESTful API design",
                "Database design and management",
                "Authentication and security",
                "Microservices architecture",
                "Message queues and caching",
                "Testing and debugging",
                "DevOps practices",
                "Problem solving",
                "System design",
            ],
            "tools": [
                "Python (Django, Flask, FastAPI)",
                "Node.js (Express, NestJS)",
                "Java",
                "SQL (MySQL, PostgreSQL)",
                "NoSQL (MongoDB, Redis)",
                "Docker",
                "Git",
                "Postman or Insomnia",
                "AWS or Azure",
                "CI/CD tools",
            ],
            "projects": [
                "Build a RESTful API for a blogging platform",
                "Create a user authentication system",
                "Design a scalable microservices architecture",
                "Implement caching and optimization strategies",
                "Deploy application using Docker and Kubernetes",
            ],
            "learning_path": [
                "Step 1: Choose a backend language",
                "Step 2: Learn web framework basics",
                "Step 3: Master database design and SQL",
                "Step 4: Study REST API architecture and design",
                "Step 5: Learn authentication and security practices",
                "Step 6: Explore database optimization and indexing",
                "Step 7: Study microservices and message queues",
                "Step 8: Learn containerization and deployment",
            ],
        },
        "frontend developer": {
            "title": "Frontend Developer",
            "overview": "Frontend Developers create engaging user interfaces and web experiences using HTML, CSS, and JavaScript.",
            "skills": [
                "HTML and CSS",
                "JavaScript",
                "React, Vue, or Angular",
                "Responsive design",
                "UI/UX principles",
                "State management",
                "API integration",
                "Performance optimization",
                "Testing",
                "Accessibility",
            ],
            "tools": [
                "HTML5 and CSS3",
                "JavaScript (ES6+)",
                "React and Redux",
                "Vue.js and Vuex",
                "Angular",
                "Tailwind CSS and Bootstrap",
                "Git",
                "Chrome DevTools",
                "Webpack and build tools",
                "Figma and design tools",
            ],
            "projects": [
                "Build a responsive portfolio website",
                "Create a weather application with API integration",
                "Develop a todo application with state management",
                "Build an e-commerce product listing page",
                "Create real-time chat application with WebSockets",
            ],
            "learning_path": [
                "Step 1: Master HTML, CSS, and JavaScript fundamentals",
                "Step 2: Learn ES6+ JavaScript features",
                "Step 3: Study responsive design and mobile-first approach",
                "Step 4: Choose a framework (React recommended)",
                "Step 5: Learn state management",
                "Step 6: Master API integration and async operations",
                "Step 7: Study performance optimization techniques",
                "Step 8: Learn testing and accessibility standards",
            ],
        },
        "full stack developer": {
            "title": "Full Stack Developer",
            "overview": "Full Stack Developers have expertise in both frontend and backend, capable of building complete web applications.",
            "skills": [
                "Frontend development",
                "Backend development",
                "Database design",
                "API design",
                "Version control",
                "DevOps basics",
                "System design",
                "Problem solving",
                "Communication",
                "Project management",
            ],
            "tools": [
                "Frontend frameworks",
                "Backend frameworks",
                "SQL and NoSQL databases",
                "Git",
                "Docker",
                "AWS or Azure",
                "Postman",
                "VS Code",
                "npm or pip",
                "CI/CD tools",
            ],
            "projects": [
                "Build a complete social media platform",
                "Create a project management application",
                "Develop an e-learning management system",
                "Build a real-time collaboration tool",
                "Create a SaaS application from scratch",
            ],
            "learning_path": [
                "Step 1: Master frontend basics",
                "Step 2: Master backend basics",
                "Step 3: Learn a frontend framework",
                "Step 4: Learn a backend framework",
                "Step 5: Study database design and SQL",
                "Step 6: Learn API design and integration",
                "Step 7: Study deployment and DevOps practices",
                "Step 8: Build end-to-end projects",
            ],
        },
        "cloud engineer": {
            "title": "Cloud Engineer",
            "overview": "Cloud Engineers design, build, and maintain cloud infrastructure ensuring scalability, security, and reliability.",
            "skills": [
                "Cloud platforms (AWS, Azure, GCP)",
                "Infrastructure as code",
                "Containerization (Docker, Kubernetes)",
                "CI/CD pipelines",
                "Networking and security",
                "Monitoring and logging",
                "Database management",
                "Cost optimization",
                "DevOps practices",
                "Linux administration",
            ],
            "tools": [
                "AWS services",
                "Azure services",
                "Google Cloud Platform",
                "Docker and Kubernetes",
                "Terraform and CloudFormation",
                "Jenkins and GitLab CI",
                "Prometheus and ELK Stack",
                "Git",
                "Linux",
                "Ansible",
            ],
            "projects": [
                "Set up automated CI/CD pipeline",
                "Deploy containerized application to Kubernetes",
                "Design scalable microservices architecture",
                "Implement infrastructure as code using Terraform",
                "Set up monitoring and alerting system",
            ],
            "learning_path": [
                "Step 1: Learn Linux and command-line fundamentals",
                "Step 2: Understand networking and security basics",
                "Step 3: Choose a cloud platform",
                "Step 4: Master core cloud services",
                "Step 5: Learn containerization with Docker",
                "Step 6: Study Kubernetes orchestration",
                "Step 7: Learn infrastructure as code",
                "Step 8: Master CI/CD and DevOps practices",
            ],
        },
        "data analyst": {
            "title": "Data Analyst",
            "overview": "Data Analysts examine data to help organizations make informed business decisions using visualizations and reporting.",
            "skills": [
                "SQL and database querying",
                "Data visualization",
                "Python or Excel",
                "Statistical analysis",
                "Business intelligence tools",
                "Data modeling",
                "Critical thinking",
                "Communication",
                "Problem solving",
                "Domain knowledge",
            ],
            "tools": [
                "Excel and advanced formulas",
                "SQL",
                "Python",
                "Tableau and Power BI",
                "Google Analytics",
                "Looker",
                "Git",
                "Jupyter Notebook",
                "Cloud platforms",
                "SPSS or SAS",
            ],
            "projects": [
                "Create interactive sales dashboard",
                "Analyze customer behavior patterns",
                "Build financial reporting system",
                "Conduct market analysis and trends",
                "Create KPI monitoring dashboards",
            ],
            "learning_path": [
                "Step 1: Master Excel and data fundamentals",
                "Step 2: Learn SQL for data extraction",
                "Step 3: Study statistics and probability",
                "Step 4: Learn data visualization principles",
                "Step 5: Master BI tools",
                "Step 6: Learn Python for data analysis",
                "Step 7: Develop business acumen and domain knowledge",
                "Step 8: Practice with real datasets and projects",
            ],
        },
        "cyber security": {
            "title": "Cyber Security Specialist",
            "overview": "Cyber Security Specialists protect organizations' data and systems from security threats and attacks.",
            "skills": [
                "Network security",
                "Encryption and cryptography",
                "Penetration testing",
                "Security protocols",
                "Vulnerability assessment",
                "Incident response",
                "Compliance and risk management",
                "Malware analysis",
                "Linux and Windows security",
                "Threat intelligence",
            ],
            "tools": [
                "Wireshark",
                "Metasploit",
                "Burp Suite",
                "Nessus",
                "Snort",
                "Linux and Windows",
                "Python and Bash scripting",
                "Git",
                "SIEM tools",
                "Firewalls and VPN",
            ],
            "projects": [
                "Conduct penetration test on web application",
                "Perform vulnerability assessment",
                "Create incident response playbook",
                "Build security monitoring dashboard",
                "Analyze malware and create threat report",
            ],
            "learning_path": [
                "Step 1: Learn networking fundamentals and protocols",
                "Step 2: Study Linux and Windows security",
                "Step 3: Learn cryptography and encryption",
                "Step 4: Study vulnerability assessment",
                "Step 5: Learn penetration testing basics",
                "Step 6: Master incident response procedures",
                "Step 7: Study compliance and regulations",
                "Step 8: Practice with labs and certifications",
            ],
        },
    }

    GENERIC_TECH_ROADMAP = {
        "title": "Technology Career",
        "overview": "Technology offers diverse career paths from development to data science, cloud engineering, and security.",
        "learning_path": [
            "Step 1: Choose a technology area",
            "Step 2: Learn programming fundamentals",
            "Step 3: Master foundational tools",
            "Step 4: Specialize in your chosen area",
            "Step 5: Build projects and gain practical experience",
            "Step 6: Network with other professionals",
            "Step 7: Consider certifications and continuous learning",
            "Step 8: Advance to senior and leadership roles",
        ],
    }

    def __init__(self, use_groq: bool = True):
        self.logger = logger
        self.use_groq = use_groq
        self.llm_client = None

        if use_groq:
            try:
                from services.groq_client import GroqClient

                self.llm_client = GroqClient()
            except Exception as error:
                self.logger.warning("Failed to initialize Groq: %s. Using rule-based responses only.", error)
                self.use_groq = False

    def _normalize_input(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r"[^\w\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def normalize_input(self, text: str) -> str:
        return self._normalize_input(text)

    def _detect_greeting(self, normalized_text: str) -> Optional[str]:
        for pattern, response in self.GREETING_PATTERNS.items():
            if self._contains_term(normalized_text, pattern):
                return response
        return None

    def detect_greeting(self, normalized_text: str) -> Optional[str]:
        return self._detect_greeting(normalized_text)

    def _detect_gratitude(self, normalized_text: str) -> Optional[str]:
        for pattern, response in self.GRATITUDE_PATTERNS.items():
            if self._contains_term(normalized_text, pattern):
                return response
        return None

    def detect_gratitude(self, normalized_text: str) -> Optional[str]:
        return self._detect_gratitude(normalized_text)

    def _contains_term(self, normalized_text: str, term: str) -> bool:
        if not normalized_text or not term:
            return False
        escaped_term = re.escape(term.lower()).replace(r"\ ", r"\s+")
        pattern = rf"(?<!\w){escaped_term}(?!\w)"
        return re.search(pattern, normalized_text) is not None

    def _detect_role(self, normalized_text: str) -> Optional[str]:
        best_match = None
        max_matches = 0

        for role, role_info in self.ROLE_KEYWORDS.items():
            role_terms = role_info["keywords"] + role_info.get("variations", [])
            keyword_count = sum(1 for keyword in role_terms if self._contains_term(normalized_text, keyword))
            if keyword_count > max_matches:
                max_matches = keyword_count
                best_match = role

        return best_match

    def _format_career_guidance(self, roadmap: Dict[str, object]) -> str:
        response = [
            f"{roadmap['title']} Career Path",
            "",
            f"Career Overview:\n{roadmap['overview']}",
            "",
            "Required Skills:",
        ]
        response.extend(f"{index}. {skill}" for index, skill in enumerate(roadmap["skills"], 1))
        response.append("")
        response.append("Recommended Tools and Technologies:")
        response.extend(f"{index}. {tool}" for index, tool in enumerate(roadmap["tools"], 1))
        response.append("")
        response.append("Suggested Projects to Build:")
        response.extend(f"{index}. {project}" for index, project in enumerate(roadmap["projects"], 1))
        response.append("")
        response.append("Step-by-Step Learning Path:")
        response.extend(f"- {step}" for step in roadmap["learning_path"])
        response.append("")
        response.append("Keep practicing and building projects. Consider joining communities and contributing to open source.")
        return "\n".join(response)

    def _generate_clarification_prompt(self) -> str:
        roles_list = ", ".join(role.title() for role in self.ROLE_KEYWORDS.keys())
        return (
            "I'd love to help you with career guidance, but I couldn't identify a specific role from your query.\n\n"
            f"Here are some common technology careers I can guide you on:\n{roles_list}\n\n"
            "Please specify which career path interests you, or ask any technology career-related question."
        )

    async def get_career_guidance_hybrid(self, query: str, context: Optional[str] = None) -> str:
        try:
            rule_response = self.get_career_guidance(query)

            if not self.use_groq or not self.llm_client:
                return rule_response

            normalized = self._normalize_input(query)
            if self._detect_greeting(normalized) or self._detect_gratitude(normalized):
                return rule_response

            detected_role = self._detect_role(normalized)
            complex_prompt = any(word in normalized for word in ["how", "what", "why", "tell", "explain", "advice", "suggest"])

            if not detected_role and complex_prompt:
                try:
                    llm_response = await self.llm_client.get_dynamic_response(
                        query=query,
                        context=context,
                        system_prompt=(
                            "You are an expert career counselor. Provide helpful, practical career guidance. "
                            "Focus on clear, actionable advice and encouragement. Keep responses concise but comprehensive."
                        ),
                    )
                    if llm_response:
                        return llm_response
                except Exception as error:
                    self.logger.warning("Groq enhancement failed, using rule-based response: %s", error)

            return rule_response
        except Exception as error:
            self.logger.error("Error in hybrid guidance: %s", error)
            return self.get_career_guidance(query)

    def get_career_guidance(self, query: str) -> str:
        try:
            if not query or not isinstance(query, str):
                return "Please provide a valid question or query about your career interests."

            normalized = self._normalize_input(query)
            if not normalized:
                return "Your query seems empty. Please ask about a career path or technology role you're interested in."

            greeting_response = self._detect_greeting(normalized)
            if greeting_response:
                return greeting_response

            gratitude_response = self._detect_gratitude(normalized)
            if gratitude_response:
                return gratitude_response

            detected_role = self._detect_role(normalized)
            if detected_role:
                roadmap = self.CAREER_ROADMAPS[detected_role]
                return self._format_career_guidance(roadmap)

            if any(word in normalized for word in ["career", "role", "path", "guidance", "help", "recommend", "suggest", "interested"]):
                if "which" in normalized or "what" in normalized:
                    return self._generate_clarification_prompt()

                response = [
                    "Technology Career Guidance",
                    "",
                    self.GENERIC_TECH_ROADMAP["overview"],
                    "",
                    "General Path for Tech Careers:",
                ]
                response.extend(f"- {step}" for step in self.GENERIC_TECH_ROADMAP["learning_path"])
                response.append("")
                response.append("To get more specific guidance, mention your interest in a particular role like:")
                response.append(", ".join(role.title() for role in self.ROLE_KEYWORDS.keys()))
                return "\n".join(response)

            return self._generate_clarification_prompt()
        except Exception as error:
            self.logger.error("Error in career guidance: %s", error)
            return "I encountered an error while processing your query. Please try again with a specific career role or technology question."


def get_career_guidance(query: str) -> str:
    service = CareerChatbotService()
    return service.get_career_guidance(query)
