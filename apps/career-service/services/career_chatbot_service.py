"""
Hybrid Career Guidance Chatbot Service

Combines rule-based logic with Gemini AI for dynamic, personalized career guidance.
- Rule-based: Fast, predefined responses for standard queries
- Gemini AI: Dynamic responses for complex/open-ended questions
Supports intelligent role detection, greeting/gratitude recognition, and structured responses.
"""

import re
import logging
import asyncio
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)


class CareerChatbotService:
    """Rule-based career guidance chatbot service."""
    
    # Greeting patterns
    GREETING_PATTERNS = {
        "hi": "Hello! I'm your career guidance assistant. How can I help you today?",
        "hello": "Hi there! Welcome to the career guidance chatbot. What would you like to know?",
        "hey": "Hey! Happy to help with your career questions.",
        "greetings": "Greetings! What career guidance do you need?",
        "good morning": "Good morning! Ready to explore your career path?",
        "good afternoon": "Good afternoon! How can I assist with your career?",
        "good evening": "Good evening! Let's talk about your career goals.",
    }
    
    # Gratitude patterns
    GRATITUDE_PATTERNS = {
        "thanks": "You're welcome! Feel free to ask if you have more questions.",
        "thank you": "Happy to help! Good luck with your career journey!",
        "appreciate": "My pleasure! Don't hesitate to reach out anytime.",
        "grateful": "It's my pleasure to assist you!",
        "thank": "You're welcome! Best of luck!",
    }
    
    # Role detection with keyword variations
    ROLE_KEYWORDS = {
        "ai/ml engineer": {
            "keywords": ["ai", "ml", "machine learning", "artificial intelligence", "deep learning", "neural", "tensorflow", "pytorch"],
            "variations": ["ai engineer", "ml engineer", "machine learning engineer", "ai specialist"],
        },
        "data scientist": {
            "keywords": ["data science", "data scientist", "predictive", "statistical", "data modeling"],
            "variations": ["data science engineer", "data analyst", "research scientist"],
        },
        "backend developer": {
            "keywords": ["backend", "api", "server", "microservice", "nodejs", "django", "flask", "express"],
            "variations": ["backend engineer", "server developer", "api developer"],
        },
        "frontend developer": {
            "keywords": ["frontend", "react", "vue", "angular", "ui", "ux", "web", "javascript", "html", "css"],
            "variations": ["frontend engineer", "web developer", "ui developer"],
        },
        "full stack developer": {
            "keywords": ["full stack", "fullstack", "mern", "mean", "lamp", "both frontend and backend"],
            "variations": ["full stack engineer", "full stack web developer"],
        },
        "cloud engineer": {
            "keywords": ["cloud", "aws", "azure", "gcp", "devops", "infrastructure", "kubernetes", "docker"],
            "variations": ["cloud architect", "devops engineer", "infrastructure engineer"],
        },
        "data analyst": {
            "keywords": ["data analyst", "analytics", "tableau", "power bi", "excel", "sql analytics", "business intelligence"],
            "variations": ["bi analyst", "analytics engineer", "insights analyst"],
        },
        "cyber security": {
            "keywords": ["cyber security", "cybersecurity", "security", "penetration", "hacking", "encryption", "secure"],
            "variations": ["security engineer", "security specialist", "infosec"],
        },
    }
    
    # Comprehensive career roadmaps
    CAREER_ROADMAPS = {
        "ai/ml engineer": {
            "title": "AI/ML Engineer",
            "overview": "AI/ML Engineers design and implement intelligent systems using machine learning algorithms and deep learning techniques.",
            "skills": [
                "Python programming",
                "Machine Learning (Supervised & Unsupervised)",
                "Deep Learning (Neural Networks, CNNs, RNNs)",
                "TensorFlow & PyTorch",
                "Data Preprocessing & Feature Engineering",
                "Statistics & Mathematics",
                "Natural Language Processing (NLP)",
                "Computer Vision",
                "Model Deployment & MLOps",
                "Big Data Technologies (Spark, Hadoop)",
            ],
            "tools": [
                "Python (NumPy, Pandas, Scikit-learn)",
                "TensorFlow & Keras",
                "PyTorch",
                "Jupyter Notebook",
                "Git & GitHub",
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
                "Step 3: Study supervised learning algorithms (regression, classification)",
                "Step 4: Explore unsupervised learning (clustering, dimensionality reduction)",
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
                "Python & R programming",
                "SQL & Database Querying",
                "Statistical Analysis",
                "Data Visualization",
                "Machine Learning",
                "Exploratory Data Analysis (EDA)",
                "Data Cleaning & Wrangling",
                "Business Acumen",
                "Communication Skills",
                "Domain Knowledge",
            ],
            "tools": [
                "Python (Pandas, NumPy, Scikit-learn, Matplotlib)",
                "R",
                "SQL",
                "Tableau & Power BI",
                "Jupyter Notebook",
                "Git",
                "Excel",
                "Statistical Software (SAS, SPSS)",
                "AWS & Cloud Platforms",
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
                "RESTful API Design",
                "Database Design & Management",
                "Authentication & Security",
                "Microservices Architecture",
                "Message Queues & Caching",
                "Testing & Debugging",
                "DevOps Practices",
                "Problem Solving",
                "System Design",
            ],
            "tools": [
                "Python (Django, Flask, FastAPI)",
                "Node.js (Express, NestJS)",
                "Java",
                "SQL (MySQL, PostgreSQL)",
                "NoSQL (MongoDB, Redis)",
                "Docker",
                "Git",
                "Postman / Insomnia",
                "AWS / Azure",
                "CI/CD Tools (Jenkins, GitLab CI)",
            ],
            "projects": [
                "Build a RESTful API for a blogging platform",
                "Create a user authentication system",
                "Design a scalable microservices architecture",
                "Implement caching and optimization strategies",
                "Deploy application using Docker and Kubernetes",
            ],
            "learning_path": [
                "Step 1: Choose a backend language (Python, Node.js, Java)",
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
                "HTML & CSS",
                "JavaScript",
                "React / Vue / Angular",
                "Responsive Design",
                "UI/UX Principles",
                "State Management",
                "API Integration",
                "Performance Optimization",
                "Testing",
                "Accessibility",
            ],
            "tools": [
                "HTML5 & CSS3",
                "JavaScript (ES6+)",
                "React & Redux",
                "Vue.js & Vuex",
                "Angular",
                "Tailwind CSS & Bootstrap",
                "Git",
                "Chrome DevTools",
                "Webpack & Build Tools",
                "Figma & Design Tools",
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
                "Step 5: Learn state management (Redux, Context API)",
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
                "Frontend: React, Vue, Angular",
                "Backend: Python, Node.js, Java",
                "Databases: SQL & NoSQL",
                "Git",
                "Docker",
                "AWS / Azure",
                "Postman",
                "VS Code",
                "npm / pip",
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
                "Step 1: Master frontend basics (HTML, CSS, JavaScript)",
                "Step 2: Master backend basics (Python/Node.js)",
                "Step 3: Learn a frontend framework (React)",
                "Step 4: Learn a backend framework (Django/Express)",
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
                "Infrastructure as Code",
                "Containerization (Docker, Kubernetes)",
                "CI/CD pipelines",
                "Networking & Security",
                "Monitoring & Logging",
                "Database management",
                "Cost optimization",
                "DevOps practices",
                "Linux administration",
            ],
            "tools": [
                "AWS (EC2, S3, RDS, Lambda)",
                "Azure (VMs, App Service, CosmosDB)",
                "Google Cloud Platform",
                "Docker & Kubernetes",
                "Terraform & CloudFormation",
                "Jenkins & GitLab CI",
                "Prometheus & ELK Stack",
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
                "Step 3: Choose a cloud platform (AWS recommended)",
                "Step 4: Master core cloud services",
                "Step 5: Learn containerization with Docker",
                "Step 6: Study Kubernetes orchestration",
                "Step 7: Learn Infrastructure as Code",
                "Step 8: Master CI/CD and DevOps practices",
            ],
        },
        "data analyst": {
            "title": "Data Analyst",
            "overview": "Data Analysts examine data to help organizations make informed business decisions using visualizations and reporting.",
            "skills": [
                "SQL & Database Querying",
                "Data Visualization",
                "Python / Excel",
                "Statistical Analysis",
                "Business Intelligence Tools",
                "Data Modeling",
                "Critical Thinking",
                "Communication",
                "Problem Solving",
                "Domain Knowledge",
            ],
            "tools": [
                "Excel & Advanced Formulas",
                "SQL (MySQL, PostgreSQL)",
                "Python (Pandas, Matplotlib)",
                "Tableau & Power BI",
                "Google Analytics",
                "Looker",
                "Git",
                "Jupyter Notebook",
                "AWS / Cloud platforms",
                "SPSS / SAS",
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
                "Step 5: Master BI tools (Tableau or Power BI)",
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
                "Encryption & Cryptography",
                "Penetration testing",
                "Security protocols",
                "Vulnerability assessment",
                "Incident response",
                "Compliance & Risk management",
                "Malware analysis",
                "Linux & Windows security",
                "Threat intelligence",
            ],
            "tools": [
                "Wireshark (Network analysis)",
                "Metasploit (Penetration testing)",
                "Burp Suite (Web security)",
                "Nessus (Vulnerability scanning)",
                "Snort (Network intrusion detection)",
                "Linux & Windows",
                "Python & Bash scripting",
                "Git",
                "SIEM tools (Splunk, ELK)",
                "Firewalls & VPN",
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
    
    # Generic tech career roadmap for unclear queries
    GENERIC_TECH_ROADMAP = {
        "title": "Technology Career",
        "overview": "Technology offers diverse career paths from development to data science, cloud engineering, and security.",
        "skills": [
            "Programming fundamentals",
            "Problem solving",
            "System thinking",
            "Version control (Git)",
            "Communication",
            "Continuous learning",
            "Collaboration",
            "Technical documentation",
        ],
        "tools": [
            "Programming languages (Python, JavaScript, Java)",
            "Git & GitHub",
            "VS Code or IDE of choice",
            "Command line tools",
            "Documentation tools",
        ],
        "projects": [
            "Build a personal portfolio website",
            "Contribute to open-source projects",
            "Create a full-stack application",
            "Build a mobile application",
            "Join hackathons and competitions",
        ],
        "learning_path": [
            "Step 1: Choose a technology area (Frontend, Backend, Data, Cloud, Security)",
            "Step 2: Learn programming fundamentals",
            "Step 3: Master foundational tools (Git, command line, IDE)",
            "Step 4: Specialize in your chosen area",
            "Step 5: Build projects and gain practical experience",
            "Step 6: Network with other professionals",
            "Step 7: Consider certifications and continuous learning",
            "Step 8: Advance to senior and leadership roles",
        ],
    }
    
    def __init__(self, use_gemini: bool = True):
        """
        Initialize the chatbot service.
        
        Args:
            use_gemini: Whether to enable Gemini AI for enhanced responses
        """
        self.logger = logger
        self.use_gemini = use_gemini
        self.gemini_client = None
        
        if use_gemini:
            try:
                from services.gemini_client import GeminiClient
                self.gemini_client = GeminiClient()
            except Exception as e:
                self.logger.warning(f"Failed to initialize Gemini: {str(e)}. Using rule-based responses only.")
                self.use_gemini = False

    
    def _normalize_input(self, text: str) -> str:
        """
        Normalize user input for processing.
        
        Args:
            text: Raw user input
            
        Returns:
            Normalized lowercase text without punctuation
        """
        # Convert to lowercase
        text = text.lower().strip()
        
        # Remove punctuation
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _detect_greeting(self, normalized_text: str) -> Optional[str]:
        """
        Detect if input is a greeting.
        
        Args:
            normalized_text: Normalized user input
            
        Returns:
            Greeting response if detected, None otherwise
        """
        for pattern, response in self.GREETING_PATTERNS.items():
            if pattern in normalized_text:
                return response
        
        return None
    
    def _detect_gratitude(self, normalized_text: str) -> Optional[str]:
        """
        Detect if input is gratitude/thanks.
        
        Args:
            normalized_text: Normalized user input
            
        Returns:
            Gratitude response if detected, None otherwise
        """
        for pattern, response in self.GRATITUDE_PATTERNS.items():
            if pattern in normalized_text:
                return response
        
        return None
    
    def _detect_role(self, normalized_text: str) -> Optional[str]:
        """
        Detect career role from user input using keyword matching.
        
        Args:
            normalized_text: Normalized user input
            
        Returns:
            Detected role name or None if no role matched
        """
        best_match = None
        max_matches = 0
        
        for role, role_info in self.ROLE_KEYWORDS.items():
            keyword_count = sum(
                1 for keyword in role_info["keywords"]
                if keyword in normalized_text
            )
            
            if keyword_count > max_matches:
                max_matches = keyword_count
                best_match = role
        
        return best_match
    
    def _format_career_guidance(self, role: str, roadmap: Dict) -> str:
        """
        Format career guidance response in a structured way.
        
        Args:
            role: Career role
            roadmap: Career roadmap data
            
        Returns:
            Formatted guidance as string
        """
        response = []
        
        # Title
        response.append(f"🎯 **{roadmap['title']} Career Path**\n")
        
        # Overview
        response.append(f"📋 **Career Overview:**\n{roadmap['overview']}\n")
        
        # Required Skills
        response.append("💼 **Required Skills:**")
        for i, skill in enumerate(roadmap['skills'], 1):
            response.append(f"  {i}. {skill}")
        response.append("")
        
        # Recommended Tools
        response.append("🛠️ **Recommended Tools & Technologies:**")
        for i, tool in enumerate(roadmap['tools'], 1):
            response.append(f"  {i}. {tool}")
        response.append("")
        
        # Suggested Projects
        response.append("🚀 **Suggested Projects to Build:**")
        for i, project in enumerate(roadmap['projects'], 1):
            response.append(f"  {i}. {project}")
        response.append("")
        
        # Learning Path
        response.append("📚 **Step-by-Step Learning Path:**")
        for step in roadmap['learning_path']:
            response.append(f"  • {step}")
        response.append("")
        
        response.append("💡 Keep practicing and building projects! Consider joining communities and contributing to open-source.")
        
        return "\n".join(response)
    
    def _generate_clarification_prompt(self) -> str:
        """
        Generate a prompt asking for clarification on career role.
        
        Returns:
            Clarification prompt message
        """
        roles_list = list(self.ROLE_KEYWORDS.keys())
        roles_str = ", ".join([r.title() for r in roles_list])
        
        return f"""I'd love to help you with career guidance! However, I couldn't identify a specific role from your query.

🎓 Here are some common technology careers I can guide you on:
• {roles_str}

Could you please specify which career path interests you? Or feel free to ask any technology career-related question!"""
    
    async def get_career_guidance_hybrid(self, query: str, context: Optional[str] = None) -> str:
        """
        Get career guidance using hybrid approach (rule-based + Gemini).
        
        Uses rule-based responses for standard queries, and Gemini for complex/open-ended questions.
        
        Args:
            query: User's career question or query
            context: Optional user context (current role, skills, experience)
            
        Returns:
            Career guidance response (rule-based or Gemini-enhanced)
        """
        try:
            # First, try to get rule-based response
            rule_response = self.get_career_guidance(query)
            
            # If Gemini is not available, return rule-based response
            if not self.use_gemini or not self.gemini_client:
                return rule_response
            
            # Check if this is a simple greeting/gratitude - don't enhance these
            normalized = self._normalize_input(query)
            if self._detect_greeting(normalized) or self._detect_gratitude(normalized):
                return rule_response
            
            # For complex queries (open-ended questions), enhance with Gemini
            # Check if it's asking about a specific role we know
            detected_role = self._detect_role(normalized)
            
            # If a specific role is detected, return rule-based response
            # If no specific role detected but it's asking about careers, enhance with Gemini
            if not detected_role and any(word in normalized for word in ["how", "what", "why", "tell", "explain", "advice", "suggest"]):
                # This is a complex question - use Gemini
                try:
                    gemini_response = await self.gemini_client.get_dynamic_response(
                        query=query,
                        context=context,
                        system_prompt="""You are an expert career counselor. Provide helpful, practical career guidance.
Focus on clear, actionable advice and encouragement. Keep responses concise but comprehensive."""
                    )
                    if gemini_response:
                        return gemini_response
                except Exception as e:
                    self.logger.warning(f"Gemini enhancement failed, using rule-based response: {str(e)}")
            
            return rule_response
            
        except Exception as e:
            self.logger.error(f"Error in hybrid guidance: {str(e)}")
            return self.get_career_guidance(query)
    
    def get_career_guidance(self, query: str) -> str:
        """
        Get personalized career guidance based on user query.
        
        Args:
            query: User's career-related question or query
            
        Returns:
            Formatted career guidance response
        """
        try:
            # Validate input
            if not query or not isinstance(query, str):
                return "Please provide a valid question or query about your career interests."
            
            # Normalize input
            normalized = self._normalize_input(query)
            
            if not normalized:
                return "Your query seems empty. Please ask about a career path or technology role you're interested in!"
            
            # Check for greetings
            greeting_response = self._detect_greeting(normalized)
            if greeting_response:
                return greeting_response
            
            # Check for gratitude
            gratitude_response = self._detect_gratitude(normalized)
            if gratitude_response:
                return gratitude_response
            
            # Detect role
            detected_role = self._detect_role(normalized)
            
            if detected_role:
                # Found a matching role
                roadmap = self.CAREER_ROADMAPS[detected_role]
                return self._format_career_guidance(detected_role, roadmap)
            
            # No role detected - check if it's asking about roles or generic tech
            if any(word in normalized for word in ["career", "role", "path", "guidance", "help", "recommend", "suggest", "interested"]):
                # User is asking about careers generally
                if "which" in normalized or "what" in normalized or "which" in normalized:
                    return self._generate_clarification_prompt()
                
                # Show generic tech career info
                roadmap = self.GENERIC_TECH_ROADMAP
                response = f"""🌟 **Technology Career Guidance**

{roadmap['overview']}

"""
                response += "\n📚 **General Path for Tech Careers:**"
                for step in roadmap['learning_path']:
                    response += f"\n  • {step}"
                response += "\n\n💡 To get more specific guidance, mention your interest in a particular role like:\n"
                roles_list = list(self.ROLE_KEYWORDS.keys())
                response += ", ".join([r.title() for r in roles_list])
                return response
            
            # Completely unclear query
            return self._generate_clarification_prompt()
        
        except Exception as e:
            self.logger.error(f"Error in career guidance: {str(e)}")
            return "I encountered an error while processing your query. Please try again with a specific career role or technology question!"


# Module-level convenience function
def get_career_guidance(query: str) -> str:
    """
    Convenience function to get career guidance without creating service explicitly.
    
    Args:
        query: User's career question or query
        
    Returns:
        Career guidance response
        
    Example:
        >>> from services.career_chatbot_service import get_career_guidance
        >>> guidance = get_career_guidance("How do I become a data scientist?")
        >>> print(guidance)
    """
    service = CareerChatbotService()
    return service.get_career_guidance(query)
