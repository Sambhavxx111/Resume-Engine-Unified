from typing import Dict, List
from urllib.parse import quote_plus


class CourseRecommender:
    """Curated free and paid learning resources by role."""

    ROLE_ALIASES = {
        "ai/ml engineer": "machine learning engineer",
        "ml engineer": "machine learning engineer",
        "machine learning engineer": "machine learning engineer",
        "data scientist": "data scientist",
        "data analyst": "data scientist",
        "backend developer": "backend developer",
        "frontend developer": "frontend developer",
        "full stack developer": "full stack developer",
        "cloud engineer": "devops engineer",
        "devops engineer": "devops engineer",
        "cyber security": "cyber security",
    }

    COURSE_LIBRARY: Dict[str, Dict[str, List[Dict[str, str]]]] = {
        "data scientist": {
            "free": [
                {
                    "title": "Machine Learning Crash Course",
                    "provider": "Google",
                    "url": "https://developers.google.com/machine-learning/crash-course",
                    "format": "Free course",
                    "reason": "Strong foundation in ML concepts, model training, and evaluation.",
                },
                {
                    "title": "Practical Deep Learning for Coders",
                    "provider": "fast.ai",
                    "url": "https://course.fast.ai/",
                    "format": "Free course",
                    "reason": "Project-first deep learning course for building real portfolio work.",
                },
                {
                    "title": "Python",
                    "provider": "Kaggle Learn",
                    "url": "https://www.kaggle.com/learn/python",
                    "format": "Free micro-course",
                    "reason": "Quick way to strengthen Python fundamentals for analytics work.",
                },
            ],
            "paid": [
                {
                    "title": "IBM Data Science Professional Certificate",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/professional-certificates/ibm-data-science",
                    "format": "Paid certificate",
                    "reason": "Broad path covering Python, SQL, analysis, and applied projects.",
                },
                {
                    "title": "Machine Learning Specialization",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/specializations/machine-learning-introduction",
                    "format": "Paid specialization",
                    "reason": "Well-known structured ML progression from fundamentals to practice.",
                },
                {
                    "title": "Data Science Bootcamp Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=data%20science%20bootcamp",
                    "format": "Paid marketplace search",
                    "reason": "Flexible lower-cost options if you want shorter guided programs.",
                },
            ],
        },
        "machine learning engineer": {
            "free": [
                {
                    "title": "Practical Deep Learning for Coders",
                    "provider": "fast.ai",
                    "url": "https://course.fast.ai/",
                    "format": "Free course",
                    "reason": "Strong hands-on track for shipping ML projects instead of only theory.",
                },
                {
                    "title": "Machine Learning Crash Course",
                    "provider": "Google",
                    "url": "https://developers.google.com/machine-learning/crash-course",
                    "format": "Free course",
                    "reason": "Useful for model evaluation, embeddings, and ML system basics.",
                },
                {
                    "title": "Python",
                    "provider": "Kaggle Learn",
                    "url": "https://www.kaggle.com/learn/python",
                    "format": "Free micro-course",
                    "reason": "Good refresh if your coding fundamentals need tightening first.",
                },
            ],
            "paid": [
                {
                    "title": "Deep Learning Specialization",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/specializations/deep-learning",
                    "format": "Paid specialization",
                    "reason": "Covers neural networks, sequence models, and modern DL basics.",
                },
                {
                    "title": "Machine Learning Specialization",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/specializations/machine-learning-introduction",
                    "format": "Paid specialization",
                    "reason": "Balanced coverage of core ML concepts before advanced deployment work.",
                },
                {
                    "title": "MLOps Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=mlops",
                    "format": "Paid marketplace search",
                    "reason": "Useful once you are ready to focus on deployment and production workflows.",
                },
            ],
        },
        "frontend developer": {
            "free": [
                {
                    "title": "Responsive Web Design",
                    "provider": "freeCodeCamp",
                    "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
                    "format": "Free certification",
                    "reason": "Solid base for layout, accessibility, and clean UI implementation.",
                },
                {
                    "title": "Front End Development Libraries",
                    "provider": "freeCodeCamp",
                    "url": "https://www.freecodecamp.org/learn/front-end-development-libraries/",
                    "format": "Free certification",
                    "reason": "Good next step for React and state-driven interfaces.",
                },
                {
                    "title": "Full Stack Open",
                    "provider": "University of Helsinki",
                    "url": "https://fullstackopen.com/en/",
                    "format": "Free course",
                    "reason": "Deep practical curriculum for modern React and API-driven apps.",
                },
            ],
            "paid": [
                {
                    "title": "Meta Front-End Developer Professional Certificate",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer",
                    "format": "Paid certificate",
                    "reason": "Structured frontend path with portfolio-friendly assignments.",
                },
                {
                    "title": "React Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=react",
                    "format": "Paid marketplace search",
                    "reason": "Useful if you want a narrower React-focused option.",
                },
                {
                    "title": "Frontend System Design Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=frontend%20system%20design",
                    "format": "Paid marketplace search",
                    "reason": "Helpful when moving from junior build skills to professional architecture thinking.",
                },
            ],
        },
        "backend developer": {
            "free": [
                {
                    "title": "Full Stack Open",
                    "provider": "University of Helsinki",
                    "url": "https://fullstackopen.com/en/",
                    "format": "Free course",
                    "reason": "Strong practical path for API design, Node, testing, and backend architecture.",
                },
                {
                    "title": "Relational Databases",
                    "provider": "freeCodeCamp",
                    "url": "https://www.freecodecamp.org/learn/relational-database/",
                    "format": "Free certification",
                    "reason": "Builds SQL and database fundamentals that backend roles require.",
                },
                {
                    "title": "Backend APIs and Microservices",
                    "provider": "freeCodeCamp",
                    "url": "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
                    "format": "Free certification",
                    "reason": "Useful for request handling, APIs, middleware, and service patterns.",
                },
            ],
            "paid": [
                {
                    "title": "IBM Back-End Development Professional Certificate",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/professional-certificates/ibm-backend-development",
                    "format": "Paid certificate",
                    "reason": "Broad curriculum covering backend development, containers, and deployment.",
                },
                {
                    "title": "FastAPI Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=fastapi",
                    "format": "Paid marketplace search",
                    "reason": "Good if you want a Python-specific backend route aligned to this project stack.",
                },
                {
                    "title": "System Design Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=system%20design",
                    "format": "Paid marketplace search",
                    "reason": "Useful as you move from CRUD APIs to scalable backend design.",
                },
            ],
        },
        "full stack developer": {
            "free": [
                {
                    "title": "Full Stack Open",
                    "provider": "University of Helsinki",
                    "url": "https://fullstackopen.com/en/",
                    "format": "Free course",
                    "reason": "One of the strongest free full-stack tracks for frontend and backend together.",
                },
                {
                    "title": "JavaScript Algorithms and Data Structures",
                    "provider": "freeCodeCamp",
                    "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
                    "format": "Free certification",
                    "reason": "Useful foundation before deeper React and Node work.",
                },
                {
                    "title": "Back End Development and APIs",
                    "provider": "freeCodeCamp",
                    "url": "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
                    "format": "Free certification",
                    "reason": "Adds API and backend fundamentals to the frontend base.",
                },
            ],
            "paid": [
                {
                    "title": "Meta Front-End Developer Professional Certificate",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer",
                    "format": "Paid certificate",
                    "reason": "Strong frontend half of a full-stack learning plan.",
                },
                {
                    "title": "IBM Back-End Development Professional Certificate",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/professional-certificates/ibm-backend-development",
                    "format": "Paid certificate",
                    "reason": "Pairs well with frontend training to make a full-stack path.",
                },
                {
                    "title": "Full Stack Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=full%20stack%20web%20development",
                    "format": "Paid marketplace search",
                    "reason": "Useful if you want a single course that covers the entire stack faster.",
                },
            ],
        },
        "devops engineer": {
            "free": [
                {
                    "title": "Docker Curriculum",
                    "provider": "Docker",
                    "url": "https://docker-curriculum.com/",
                    "format": "Free course",
                    "reason": "Hands-on starting point for containers and deployment basics.",
                },
                {
                    "title": "Introduction to DevOps",
                    "provider": "IBM SkillsBuild",
                    "url": "https://skillsbuild.org/learn/course/introduction-to-devops",
                    "format": "Free course",
                    "reason": "Good overview of DevOps practices, lifecycle, and collaboration model.",
                },
                {
                    "title": "Kubernetes Basics",
                    "provider": "Kubernetes",
                    "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
                    "format": "Free tutorial",
                    "reason": "Great intro to orchestration once Docker fundamentals are comfortable.",
                },
            ],
            "paid": [
                {
                    "title": "DevOps on AWS Search",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/search?query=aws%20devops",
                    "format": "Paid catalog search",
                    "reason": "Useful when you want cloud-aligned DevOps specialization.",
                },
                {
                    "title": "DevOps Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=devops",
                    "format": "Paid marketplace search",
                    "reason": "Flexible options for Docker, CI/CD, Terraform, and Kubernetes.",
                },
                {
                    "title": "Terraform Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=terraform",
                    "format": "Paid marketplace search",
                    "reason": "Helpful for infrastructure-as-code once basics are in place.",
                },
            ],
        },
        "cyber security": {
            "free": [
                {
                    "title": "Introduction to Cybersecurity",
                    "provider": "Cisco",
                    "url": "https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity",
                    "format": "Free course",
                    "reason": "Good first pass through core security concepts and careers.",
                },
                {
                    "title": "Pre-Security Learning Path",
                    "provider": "TryHackMe",
                    "url": "https://tryhackme.com/path/outline/presecurity",
                    "format": "Free guided path",
                    "reason": "Hands-on environment for networking, Linux, and security basics.",
                },
                {
                    "title": "OWASP Web Security Testing Guide",
                    "provider": "OWASP",
                    "url": "https://owasp.org/www-project-web-security-testing-guide/",
                    "format": "Free reference",
                    "reason": "Strong professional reference once you start practical security work.",
                },
            ],
            "paid": [
                {
                    "title": "Google Cybersecurity Professional Certificate",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/professional-certificates/google-cybersecurity",
                    "format": "Paid certificate",
                    "reason": "Structured beginner-to-junior security learning path.",
                },
                {
                    "title": "Cyber Security Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=cyber%20security",
                    "format": "Paid marketplace search",
                    "reason": "Flexible options for networking, penetration testing, and SOC skills.",
                },
                {
                    "title": "Security+ Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=security%2B",
                    "format": "Paid marketplace search",
                    "reason": "Helpful if you want certification-focused preparation.",
                },
            ],
        },
    }

    def recommend(self, role: str) -> Dict[str, List[Dict[str, str]]]:
        normalized_role = self.ROLE_ALIASES.get(role.lower(), role.lower())
        role_courses = self.COURSE_LIBRARY.get(normalized_role)

        if role_courses:
            return {
                "free_courses": self._append_youtube(role, role_courses["free"]),
                "paid_courses": role_courses["paid"],
            }

        return {
            "free_courses": self._append_youtube(role, self._generic_free(role)),
            "paid_courses": self._generic_paid(role),
        }

    def _append_youtube(self, role: str, items: List[Dict[str, str]]) -> List[Dict[str, str]]:
        search_url = f"https://www.youtube.com/results?search_query={quote_plus(role + ' roadmap full course')}"
        return [
            *items,
            {
                "title": f"{role.title()} YouTube Learning Track",
                "provider": "YouTube",
                "url": search_url,
                "format": "Free video search",
                "reason": "Use this to compare free long-form course options, playlists, and current creator recommendations.",
            },
        ]

    def _generic_free(self, role: str) -> List[Dict[str, str]]:
        query = quote_plus(role)
        return [
            {
                "title": f"{role.title()} Learning Search",
                "provider": "Class Central",
                "url": f"https://www.classcentral.com/search?q={query}",
                "format": "Free catalog search",
                "reason": "Good way to discover free university and platform-hosted options.",
            },
            {
                "title": f"{role.title()} Learning Path",
                "provider": "YouTube",
                "url": f"https://www.youtube.com/results?search_query={quote_plus(role + ' full course')}",
                "format": "Free video search",
                "reason": "Useful for beginner-friendly walkthroughs, playlists, and roadmap videos.",
            },
        ]

    def _generic_paid(self, role: str) -> List[Dict[str, str]]:
        query = quote_plus(role)
        return [
            {
                "title": f"{role.title()} Courses",
                "provider": "Coursera",
                "url": f"https://www.coursera.org/search?query={query}",
                "format": "Paid catalog search",
                "reason": "Structured certificate and specialization options from major providers.",
            },
            {
                "title": f"{role.title()} Courses",
                "provider": "Udemy",
                "url": f"https://www.udemy.com/courses/search/?q={query}",
                "format": "Paid marketplace search",
                "reason": "Flexible budget-friendly options with many practical implementations.",
            },
        ]
