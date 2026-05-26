from typing import Any, Dict, List, Optional

from services.career_chatbot_service import CareerChatbotService
from services.course_recommender import CourseRecommender
from services.roadmap_service import RoadmapService


class CareerGuidanceService:
    """Builds structured career guidance with roadmap and learning resources."""

    ROLE_MAPPING = {
        "ai/ml engineer": "machine learning engineer",
        "data scientist": "data scientist",
        "backend developer": "backend developer",
        "frontend developer": "frontend developer",
        "full stack developer": "full stack developer",
        "cloud engineer": "devops engineer",
        "data analyst": "data scientist",
        "cyber security": "cyber security",
    }

    def __init__(self):
        self.chatbot = CareerChatbotService(use_groq=True)
        self.roadmap_service = RoadmapService()
        self.course_recommender = CourseRecommender()

    async def generate_guidance(
        self,
        message: str,
        context: str = "",
        current_skills: Optional[List[str]] = None,
        matched_jobs: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        current_skills = current_skills or []
        matched_jobs = matched_jobs or []

        normalized = self.chatbot.normalize_input(message)
        greeting = self.chatbot.detect_greeting(normalized)
        gratitude = self.chatbot.detect_gratitude(normalized)

        if greeting:
            return {
                "status": "success",
                "message": greeting,
                "suggestions": [
                    "Ask which roles fit your current resume best",
                    "Ask for a step-by-step roadmap to a target job",
                    "Ask for free and paid course recommendations",
                ],
                "role_detected": "greeting",
                "is_clarification": False,
            }

        if gratitude:
            return {
                "status": "success",
                "message": gratitude,
                "suggestions": [
                    "Ask for the next best role to target",
                    "Ask for resume improvement advice",
                    "Ask for a roadmap with courses and projects",
                ],
                "role_detected": "gratitude",
                "is_clarification": False,
            }

        if self._is_dsa_query(normalized):
            return self._build_dsa_guidance(current_skills)

        detected_role = self._detect_target_role(normalized, matched_jobs)
        if not detected_role:
            return {
                "status": "success",
                "message": self.chatbot._generate_clarification_prompt(),
                "suggestions": [
                    "Frontend Developer",
                    "Backend Developer",
                    "Full Stack Developer",
                    "Data Scientist",
                    "Machine Learning Engineer",
                    "DevOps Engineer",
                ],
                "role_detected": "unclear",
                "is_clarification": True,
            }

        roadmap = await self.roadmap_service.generate_roadmap(
            target_role=detected_role,
            current_skills=current_skills,
        )

        narrative = await self._build_narrative(
            role=detected_role,
            message=message,
            context=context,
            current_skills=current_skills,
            roadmap=roadmap,
        )

        resources = self.course_recommender.recommend(detected_role)
        next_actions = self._build_next_actions(roadmap, current_skills)

        return {
            "status": "success",
            "message": narrative,
            "suggestions": next_actions,
            "role_detected": detected_role,
            "is_clarification": False,
            "roadmap": roadmap,
            "resources": resources,
            "matched_job_snapshot": self._summarize_jobs(matched_jobs),
        }

    def _detect_target_role(
        self,
        normalized_message: str,
        matched_jobs: List[Dict[str, Any]],
    ) -> Optional[str]:
        detected_role = self.chatbot._detect_role(normalized_message)
        if detected_role:
            return self.ROLE_MAPPING.get(detected_role, detected_role)

        for job in matched_jobs[:3]:
            title = (job.get("title") or "").lower()
            inferred_role = self.chatbot._detect_role(self.chatbot._normalize_input(title))
            if inferred_role:
                return self.ROLE_MAPPING.get(inferred_role, inferred_role)

        return None

    async def _build_narrative(
        self,
        role: str,
        message: str,
        context: str,
        current_skills: List[str],
        roadmap: Dict[str, Any],
    ) -> str:
        role_title = roadmap.get("role", role.title())
        skill_analysis = roadmap.get("skill_analysis", {})
        missing = skill_analysis.get("missing_skills", [])[:4]
        existing = skill_analysis.get("existing_skills", [])[:4]
        steps = roadmap.get("roadmap_steps", [])[:3]

        fallback = (
            f"{role_title} looks like the strongest target based on your question. "
            f"You already have {', '.join(existing) if existing else 'some relevant foundation'}, "
            f"and the next gap to close is {', '.join(missing) if missing else 'hands-on projects and job-ready positioning'}. "
            f"Prioritize {' -> '.join(step.get('title', '') for step in steps if step.get('title')) or 'core fundamentals, projects, and applications'}."
        )

        try:
            return await self.chatbot.get_career_guidance_hybrid(
                query=message,
                context=(
                    f"{context}\n"
                    f"Target role: {role_title}\n"
                    f"Current skills: {', '.join(current_skills) if current_skills else 'not provided'}\n"
                    f"Missing skills: {', '.join(missing) if missing else 'not identified'}\n"
                    f"Top roadmap steps: {', '.join(step.get('title', '') for step in steps)}"
                ).strip(),
            )
        except Exception:
            return fallback

    def _build_next_actions(self, roadmap: Dict[str, Any], current_skills: List[str]) -> List[str]:
        actions: List[str] = []
        skill_analysis = roadmap.get("skill_analysis", {})
        missing = skill_analysis.get("missing_skills", [])

        if missing:
            actions.append(f"Close the highest-value gaps first: {', '.join(missing[:3])}")

        if current_skills:
            actions.append(f"Reposition your existing strengths more clearly: {', '.join(current_skills[:4])}")

        first_step = next(iter(roadmap.get("roadmap_steps", [])), None)
        if first_step:
            actions.append(f"Start with: {first_step.get('title', 'the first roadmap step')}")

        actions.append("Build one portfolio project for each major roadmap phase")
        actions.append("Use the free and paid course cards below to plan a realistic study stack")

        return actions[:5]

    def _summarize_jobs(self, matched_jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [
            {
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "location": job.get("location", ""),
                "url": job.get("url", ""),
            }
            for job in matched_jobs[:3]
        ]

    def _is_dsa_query(self, normalized_message: str) -> bool:
        dsa_terms = [
            "dsa",
            "data structures",
            "algorithms",
            "leetcode",
            "coding interview",
            "competitive programming",
        ]
        return any(self.chatbot._contains_term(normalized_message, term) for term in dsa_terms)

    def _build_dsa_guidance(self, current_skills: List[str]) -> Dict[str, Any]:
        required_skills = [
            "arrays",
            "strings",
            "linked lists",
            "stacks and queues",
            "trees and graphs",
            "recursion",
            "dynamic programming",
            "greedy algorithms",
            "time and space complexity",
            "interview problem solving",
        ]
        normalized_current_skills = {skill.strip().lower() for skill in current_skills if skill}
        existing_skills = [skill for skill in required_skills if skill.lower() in normalized_current_skills]
        missing_skills = [skill for skill in required_skills if skill.lower() not in normalized_current_skills]
        total_required = len(required_skills)
        current_skills_aligned = len(existing_skills)
        missing_count = len(missing_skills)
        completion_percentage = round((current_skills_aligned / total_required) * 100) if total_required else 0

        roadmap = {
            "role": "DSA / Interview Preparation",
            "description": "Structured preparation track for coding rounds, problem solving, and core CS fundamentals.",
            "salary_range": "Depends on target software role",
            "required_skills": required_skills,
            "skill_analysis": {
                "role": "DSA / Interview Preparation",
                "total_required": total_required,
                "current_skills_aligned": current_skills_aligned,
                "missing_skills": missing_skills,
                "missing_count": missing_count,
                "completion_percentage": completion_percentage,
                "existing_skills": existing_skills,
            },
            "roadmap_steps": [
                {
                    "step": 1,
                    "title": "Master Complexity Basics",
                    "description": "Understand Big-O, common tradeoffs, and how to evaluate brute force vs optimized solutions.",
                    "skills": ["big o", "time complexity", "space complexity"],
                    "duration": "1-2 weeks",
                    "resources": ["NeetCode complexity primers", "Abdul Bari complexity videos", "Big-O cheat sheets"],
                    "difficulty": "beginner",
                },
                {
                    "step": 2,
                    "title": "Core Data Structures",
                    "description": "Work through arrays, strings, hash maps, linked lists, stacks, queues, heaps, trees, and graphs.",
                    "skills": ["arrays", "hash maps", "trees", "graphs"],
                    "duration": "4-6 weeks",
                    "resources": ["NeetCode roadmap", "GeeksforGeeks DSA track", "LeetCode study plans"],
                    "difficulty": "beginner",
                },
                {
                    "step": 3,
                    "title": "Pattern-Based Problem Solving",
                    "description": "Learn sliding window, two pointers, binary search, BFS/DFS, backtracking, greedy, and dynamic programming patterns.",
                    "skills": ["sliding window", "binary search", "dynamic programming"],
                    "duration": "4-6 weeks",
                    "resources": ["NeetCode 150", "Striver A2Z DSA sheet", "LeetCode patterns"],
                    "difficulty": "intermediate",
                },
                {
                    "step": 4,
                    "title": "Mock Interviews and Timed Practice",
                    "description": "Simulate interview conditions, explain your thought process, and review mistakes systematically.",
                    "skills": ["communication", "interview strategy", "problem review"],
                    "duration": "Ongoing",
                    "resources": ["Pramp", "Interviewing.io", "LeetCode timed contests"],
                    "difficulty": "advanced",
                },
            ],
            "total_steps": 4,
            "estimated_timeline": "2-3 months for consistent interview prep",
        }

        resources = {
            "free_courses": [
                {
                    "title": "JavaScript Algorithms and Data Structures",
                    "provider": "freeCodeCamp",
                    "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
                    "format": "Free certification",
                    "reason": "Solid structured DSA practice if you prefer JavaScript.",
                },
                {
                    "title": "Striver A2Z DSA Course / Sheet",
                    "provider": "Take U Forward",
                    "url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
                    "format": "Free roadmap",
                    "reason": "One of the most practical structured DSA progressions for interview prep.",
                },
                {
                    "title": "NeetCode Roadmap",
                    "provider": "NeetCode",
                    "url": "https://neetcode.io/roadmap",
                    "format": "Free roadmap",
                    "reason": "Great for moving through problems by topic and difficulty.",
                },
                {
                    "title": "DSA YouTube Track",
                    "provider": "YouTube",
                    "url": "https://www.youtube.com/results?search_query=dsa+full+course+interview+prep",
                    "format": "Free video search",
                    "reason": "Helpful for long-form explanations, topic playlists, and interview prep walkthroughs.",
                },
            ],
            "paid_courses": [
                {
                    "title": "Algorithms, Part I",
                    "provider": "Coursera",
                    "url": "https://www.coursera.org/learn/algorithms-part1",
                    "format": "Paid course",
                    "reason": "Classic foundational algorithms course with strong theory and implementation depth.",
                },
                {
                    "title": "Data Structures and Algorithms Search",
                    "provider": "Udemy",
                    "url": "https://www.udemy.com/courses/search/?q=data%20structures%20and%20algorithms",
                    "format": "Paid marketplace search",
                    "reason": "Useful if you want guided problem-solving practice in your preferred language.",
                },
            ],
        }

        suggestions = [
            "Start with arrays, strings, hashing, and Big-O before touching dynamic programming",
            "Solve problems by pattern, not by random topic hopping",
            "Track mistakes in a revision sheet and revisit them weekly",
            "Pair DSA prep with one target role like frontend, backend, or SDE",
            f"Use your existing strengths alongside DSA prep: {', '.join(current_skills[:4])}" if current_skills else "Combine DSA prep with one or two role-specific projects",
        ]

        return {
            "status": "success",
            "message": (
                "For DSA, you should not be pushed into an ML roadmap. "
                "Treat this as interview-prep and CS-foundation work: master complexity analysis, core data structures, "
                "problem-solving patterns, and then timed mock interviews."
            ),
            "suggestions": suggestions[:5],
            "role_detected": "dsa / interview preparation",
            "is_clarification": False,
            "roadmap": roadmap,
            "resources": resources,
            "matched_job_snapshot": [],
        }
