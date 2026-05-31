export const API = {
  login: "/api/auth/login",
  signup: "/api/auth/signup",
  verifyEmail: "/api/auth/verify-email",
  resetPassword: "/api/auth/reset-password",
  me: "/api/auth/me",
  logout: "/api/auth/logout",
  getResume: "/api/resume",
  listResumeDrafts: "/api/resume/drafts",
  createResumeDraft: "/api/resume/drafts",
  getResumeDraft: (resumeId) => `/api/resume/${resumeId}`,
  updateResumeDraft: (resumeId) => `/api/resume/${resumeId}`,
  discardResumeDraft: (resumeId) => `/api/resume/${resumeId}`,
  importResumeFile: "/api/resume/import-file",
  saveResume: "/api/resume",
  atsScore: "/api/ats/score",
  atsScoreFile: "/api/ats/score-file",
  atsOptimizeFile: "/api/ats/optimize-file",
  jdMatch: "/api/ats/jd-match",
  recommendJobsFile: "/api/ats/recommend-jobs-file",
  aiSummary: "/api/ai/summary",
  aiSkills: "/api/ai/skills",
  aiOptimize: "/api/ai/optimize",
};

export const API_CONTRACT = [
  {
    key: "login",
    endpoint: API.login,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    requestBody: { email: "user@example.com", password: "secret123" },
    response: {
      token: "jwt_token",
      user: { id: "u_1", name: "Divya", email: "user@example.com" },
    },
  },
  {
    key: "signup",
    endpoint: API.signup,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    requestBody: {
      name: "Divya",
      email: "user@example.com",
      password: "secret123",
    },
    response: {
      token: "jwt_token",
      user: { id: "u_1", name: "Divya", email: "user@example.com" },
    },
  },
  {
    key: "getResume",
    endpoint: API.getResume,
    method: "GET",
    headers: { Authorization: "Bearer <token>" },
    requestBody: null,
    response: {
      resume: {
        personalInfo: {
          fullName: "Divya Sharma",
          email: "user@example.com",
          phone: "+91 9876543210",
          location: "Bengaluru, India",
          title: "Frontend Engineer",
        },
        education: [
          {
            institution: "ABC University",
            degree: "B.Tech",
            fieldOfStudy: "Computer Science",
            startDate: "2019-07",
            endDate: "2023-05",
          },
        ],
        experience: [
          {
            company: "Tech Labs",
            role: "Frontend Developer",
            startDate: "2023-06",
            endDate: "Present",
            description: "Built responsive web applications.",
          },
        ],
        skills: ["React", "Tailwind CSS", "REST APIs"],
        summary: "Experienced frontend engineer with strong product instincts.",
      },
    },
  },
  {
    key: "saveResume",
    endpoint: API.saveResume,
    method: "POST",
    headers: {
      Authorization: "Bearer <token>",
      "Content-Type": "application/json",
    },
    requestBody: {
      personalInfo: {},
      education: [],
      experience: [],
      skills: [],
      summary: "",
    },
    response: {
      message: "Resume saved successfully",
      resume: {},
    },
  },
  {
    key: "atsScore",
    endpoint: API.atsScore,
    method: "POST",
    headers: {
      Authorization: "Bearer <token>",
      "Content-Type": "multipart/form-data",
    },
    requestBody: { file: "<FormData file>" },
    response: {
      score: 84,
      suggestions: [
        "Add measurable impact to experience bullets",
        "Use ATS-friendly section headings",
      ],
    },
  },
  {
    key: "jdMatch",
    endpoint: API.jdMatch,
    method: "POST",
    headers: {
      Authorization: "Bearer <token>",
      "Content-Type": "application/json",
    },
    requestBody: {
      jobDescription: "We are hiring a frontend engineer with React experience.",
    },
    response: {
      matchPercentage: 76,
      matchedKeywords: ["React", "REST APIs"],
      missingKeywords: ["TypeScript"],
    },
  },
  {
    key: "recommendJobsFile",
    endpoint: API.recommendJobsFile,
    method: "POST",
    headers: {
      Authorization: "Bearer <token>",
      "Content-Type": "multipart/form-data",
    },
    requestBody: {
      resume: "<FormData file>",
    },
    response: {
      message: "Recommended jobs generated successfully",
      recommendedJobs: [
        {
          title: "Frontend Developer",
          fitScore: 84,
          jobType: "Full-time",
          matchReason: "Strong overlap in React, APIs, and frontend delivery.",
          keySkills: ["React", "JavaScript", "REST APIs"],
        },
      ],
      topCategories: ["Frontend Engineering", "Software Development"],
    },
  },
  {
    key: "aiOptimize",
    endpoint: API.aiOptimize,
    method: "POST",
    headers: {
      Authorization: "Bearer <token>",
      "Content-Type": "application/json",
    },
    requestBody: {
      resume: {},
      action: "summary | skills | optimize",
    },
    response: {
      result: "Generated output string, array, or optimized resume object based on action",
    },
  },
];

