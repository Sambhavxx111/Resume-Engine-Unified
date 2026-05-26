import { useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { CAREER_API, getCareerServiceBaseUrl } from "../api/careerService";
import { useAuth } from "../context/AuthContext";

const promptOptions = [
  "Which roles should I target with this resume?",
  "What are the top skill gaps I should close next?",
  "How should I improve this resume for stronger applications?",
  "Give me a roadmap with free and paid courses.",
];

const localCoachRoles = [
  {
    key: "frontend developer",
    label: "Frontend Developer",
    keywords: ["react", "javascript", "html", "css", "frontend", "ui", "ux", "vite", "tailwind"],
    strengths: ["React", "JavaScript", "HTML", "CSS", "Responsive UI"],
    gaps: ["Advanced React patterns", "Testing", "Performance optimization", "Accessibility"],
    roadmap: [
      { step: 1, title: "Sharpen frontend foundations", duration: "2-3 weeks", description: "Tighten layout, state, forms, and component composition fundamentals.", skills: ["React", "JavaScript", "CSS architecture"] },
      { step: 2, title: "Build proof projects", duration: "3-4 weeks", description: "Create 2 polished UI projects that show real product thinking and API integration.", skills: ["Portfolio projects", "API integration", "UX polish"] },
      { step: 3, title: "Job-ready positioning", duration: "1-2 weeks", description: "Rewrite resume bullets around shipped UI outcomes, performance wins, and reusable components.", skills: ["Resume positioning", "Storytelling", "Applications"] },
    ],
    resources: {
      free_courses: [
        { title: "Full Stack Open", provider: "University of Helsinki", url: "https://fullstackopen.com/en/", reason: "Strong practical React and API workflow training." },
        { title: "Front End Development Libraries", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/front-end-development-libraries/", reason: "Solid structured practice for React-based interfaces." },
      ],
      paid_courses: [
        { title: "Meta Front-End Developer Certificate", provider: "Coursera", url: "https://www.coursera.org/professional-certificates/meta-front-end-developer", reason: "Useful if you want a guided portfolio-oriented path." },
      ],
    },
  },
  {
    key: "backend developer",
    label: "Backend Developer",
    keywords: ["node", "express", "api", "backend", "server", "sql", "database", "fastapi", "python"],
    strengths: ["API work", "Server logic", "Data handling", "Problem solving"],
    gaps: ["Database design", "Auth and security", "Testing", "Deployment"],
    roadmap: [
      { step: 1, title: "Solidify API fundamentals", duration: "2-3 weeks", description: "Improve routing, validation, error handling, and clean service boundaries.", skills: ["REST APIs", "Validation", "Error handling"] },
      { step: 2, title: "Add production depth", duration: "3-4 weeks", description: "Strengthen authentication, persistence, observability, and deployment basics.", skills: ["Auth", "SQL", "Deployment"] },
      { step: 3, title: "Ship backend proof", duration: "2 weeks", description: "Build one complete backend project with docs, tests, and deployment notes.", skills: ["Testing", "Docs", "Project proof"] },
    ],
    resources: {
      free_courses: [
        { title: "Back End Development and APIs", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/", reason: "Covers core backend workflows in a practical format." },
        { title: "Relational Databases", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/relational-database/", reason: "Useful for improving database depth alongside API work." },
      ],
      paid_courses: [
        { title: "IBM Back-End Development Certificate", provider: "Coursera", url: "https://www.coursera.org/professional-certificates/ibm-backend-development", reason: "Structured way to deepen backend breadth." },
      ],
    },
  },
  {
    key: "full stack developer",
    label: "Full Stack Developer",
    keywords: ["full stack", "fullstack", "mern", "react", "node", "api", "frontend", "backend"],
    strengths: ["Cross-stack flexibility", "Product ownership", "UI + API understanding"],
    gaps: ["Depth in one specialty", "System design", "Testing discipline", "Deployment workflow"],
    roadmap: [
      { step: 1, title: "Choose a primary lane", duration: "1 week", description: "Decide whether frontend or backend is your stronger story, then keep the other as support depth.", skills: ["Positioning", "Role targeting"] },
      { step: 2, title: "Build one complete product", duration: "3-5 weeks", description: "Create an end-to-end app with auth, CRUD, clean UI, and deployment.", skills: ["React", "APIs", "Deployment"] },
      { step: 3, title: "Refine application story", duration: "1-2 weeks", description: "Present yourself as full stack with a clear strongest edge instead of as a generalist only.", skills: ["Resume strategy", "Interview narrative"] },
    ],
    resources: {
      free_courses: [
        { title: "Full Stack Open", provider: "University of Helsinki", url: "https://fullstackopen.com/en/", reason: "One of the strongest free full-stack programs available." },
      ],
      paid_courses: [
        { title: "Full Stack Web Development Search", provider: "Udemy", url: "https://www.udemy.com/courses/search/?q=full%20stack%20web%20development", reason: "Good if you want a guided one-course stack path." },
      ],
    },
  },
  {
    key: "data scientist",
    label: "Data Scientist",
    keywords: ["python", "data", "pandas", "numpy", "machine learning", "sql", "analytics", "power bi", "tableau"],
    strengths: ["Python", "Analysis mindset", "Data storytelling"],
    gaps: ["Statistics", "ML fundamentals", "SQL depth", "Portfolio case studies"],
    roadmap: [
      { step: 1, title: "Strengthen analysis core", duration: "2-3 weeks", description: "Focus on SQL, Pandas, data cleaning, and clear exploratory analysis.", skills: ["SQL", "Pandas", "EDA"] },
      { step: 2, title: "Add model-building basics", duration: "3-4 weeks", description: "Learn practical supervised learning and model evaluation.", skills: ["Machine learning", "Evaluation", "Feature work"] },
      { step: 3, title: "Publish portfolio case studies", duration: "2 weeks", description: "Turn projects into story-driven reports that show business value.", skills: ["Portfolio", "Communication", "Dashboards"] },
    ],
    resources: {
      free_courses: [
        { title: "Machine Learning Crash Course", provider: "Google", url: "https://developers.google.com/machine-learning/crash-course", reason: "Strong practical starting point for ML basics." },
        { title: "Python", provider: "Kaggle Learn", url: "https://www.kaggle.com/learn/python", reason: "Good quick refresh for analytics-focused Python." },
      ],
      paid_courses: [
        { title: "IBM Data Science Certificate", provider: "Coursera", url: "https://www.coursera.org/professional-certificates/ibm-data-science", reason: "Broad structured path into data work." },
      ],
    },
  },
];

function inferRole({ message, skills, jobs }) {
  const haystack = [
    message || "",
    ...(skills || []),
    ...(jobs || []).flatMap((job) => [job.title || "", job.company || ""]),
  ]
    .join(" ")
    .toLowerCase();

  let bestRole = localCoachRoles[0];
  let bestScore = 0;

  for (const role of localCoachRoles) {
    const score = role.keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestRole = role;
    }
  }

  return bestScore > 0 ? bestRole : localCoachRoles[0];
}

function buildLocalCoachFallback({ message, context, skills, jobs }) {
  const role = inferRole({ message, skills, jobs });
  const matchedSkills = (skills || []).filter((skill) =>
    role.keywords.some((keyword) => skill.toLowerCase().includes(keyword) || keyword.includes(skill.toLowerCase())),
  );
  const existingSkills = matchedSkills.length ? matchedSkills.slice(0, 4) : role.strengths.slice(0, 3);
  const missingSkills = role.gaps.slice(0, 4);
  const completionPercentage = Math.min(100, Math.round((existingSkills.length / (existingSkills.length + missingSkills.length)) * 100));

  return {
    status: "success",
    role_detected: role.key,
    is_fallback: true,
    message: `${role.label} looks like the strongest target from your current profile. ${
      existingSkills.length
        ? `You already show promising signals in ${existingSkills.join(", ")}.`
        : "You have some relevant foundations, but your profile needs clearer role positioning."
    } Focus next on ${missingSkills.slice(0, 2).join(" and ")}, then build one strong proof project and align your resume bullets to that target role. ${
      context?.trim() ? "I also used the background you added to keep the advice practical." : ""
    }`,
    suggestions: [
      `Target ${role.label} roles first and tailor your resume to that direction`,
      `Close these gaps next: ${missingSkills.slice(0, 3).join(", ")}`,
      `Build one portfolio project that proves ${role.label.toLowerCase()} fit`,
      "Rewrite resume bullets around outcomes, ownership, and tools used",
      "Apply after tightening one core project and one focused resume pass",
    ],
    roadmap: {
      role: role.label,
      estimated_timeline: "4-8 weeks for a sharper application story",
      skill_analysis: {
        completion_percentage: completionPercentage,
        current_skills_aligned: existingSkills.length,
        missing_count: missingSkills.length,
        existing_skills: existingSkills,
        missing_skills: missingSkills,
      },
      roadmap_steps: role.roadmap,
    },
    resources: role.resources,
  };
}

function buildCoachContext({ chatContext, resumeResult, jobsResult, jobLocation }) {
  const parts = [];

  if (chatContext?.trim()) {
    parts.push(`User background: ${chatContext.trim()}`);
  }

  if (resumeResult?.skills?.length) {
    parts.push(`Extracted resume skills: ${resumeResult.skills.join(", ")}`);
  }

  if (resumeResult?.resume_text?.trim()) {
    parts.push(`Resume text snapshot: ${resumeResult.resume_text.trim().slice(0, 1400)}`);
  }

  if (jobsResult?.length) {
    const topRoles = jobsResult
      .slice(0, 3)
      .map((job) => `${job.title} at ${job.company} in ${job.location}`)
      .join("; ");
    parts.push(`Top matched roles in ${jobLocation}: ${topRoles}`);
  }

  return parts.join("\n\n");
}

function CareerGuidance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const baseURL = useMemo(() => getCareerServiceBaseUrl(), []);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const [jobLocation, setJobLocation] = useState("India");
  const [jobsResult, setJobsResult] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");

  const [chatMessage, setChatMessage] = useState(
    "What roles should I target next with my current resume and how should I improve it?",
  );
  const [chatContext, setChatContext] = useState(
    "I want practical advice based on my current skills, resume, and next career step.",
  );
  const [chatResult, setChatResult] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  const uploadResume = async (event) => {
    event.preventDefault();
    if (!resumeFile) {
      setResumeError("Please upload a PDF, DOCX, or TXT resume first.");
      return;
    }

    setResumeLoading(true);
    setResumeError("");
    setResumeResult(null);
    setJobsResult([]);
    setJobsError("");

    const formData = new FormData();
    formData.append("file", resumeFile);

    try {
      const { data } = await axios.post(`${baseURL}${CAREER_API.uploadResume}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeResult(data);
    } catch (error) {
      setResumeError(error.response?.data?.detail || "Unable to extract resume skills right now.");
    } finally {
      setResumeLoading(false);
    }
  };

  const findJobs = async () => {
    if (!resumeResult?.skills?.length) {
      setJobsError("Upload a resume first so we can match you with the right roles.");
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location,
          authPrompt: "Please log in with your personal email to find matching roles in Career Guidance.",
        },
      });
      return;
    }

    setJobsLoading(true);
    setJobsError("");
    setJobsResult([]);

    try {
      const { data } = await axios.post(`${baseURL}${CAREER_API.matchJobs}`, {
        skills: resumeResult.skills,
        location: jobLocation,
        limit: 6,
      });
      setJobsResult(data.matched_jobs || data.matchedJobs || []);
    } catch (error) {
      setJobsError(error.response?.data?.detail || "Unable to fetch job matches right now.");
    } finally {
      setJobsLoading(false);
    }
  };

  const askCareerCoach = async (event) => {
    event.preventDefault();
    if (!chatMessage.trim()) {
      setChatError("Please enter a question for the career coach.");
      return;
    }

    setChatLoading(true);
    setChatError("");
    setChatResult(null);
    const topMatches = jobsResult.slice(0, 3).map((job) => ({
      title: job.title || "Untitled role",
      company: job.company || "Unknown company",
      location: job.location || "Unknown location",
      url: job.url || "",
    }));

    let context = "";

    try {
      context = buildCoachContext({
        chatContext,
        resumeResult,
        jobsResult,
        jobLocation,
      });

      try {
        const { data } = await axios.post(`${baseURL}${CAREER_API.chatRich}`, {
          message: chatMessage,
          context,
          skills: resumeResult?.skills || [],
          matched_jobs: topMatches,
        });
        setChatResult(data);
      } catch (richError) {
        const { data } = await axios.post(`${baseURL}${CAREER_API.chat}`, {
          message: chatMessage,
          context,
        });
        setChatResult({
          ...data,
          role_detected: data.role_detected || "fallback coach",
          is_fallback: true,
        });
      }
    } catch (error) {
      setChatResult(
        buildLocalCoachFallback({
          message: chatMessage,
          context: context ?? "",
          skills: resumeResult?.skills || [],
          jobs: topMatches,
        }),
      );
    } finally {
      setChatLoading(false);
    }
  };

  const topSkills = resumeResult?.skills || [];
  const jobsCount = jobsResult.length;
  const roadmap = chatResult?.roadmap;
  const resources = chatResult?.resources;
  const skillAnalysis = roadmap?.skill_analysis;

  return (
    <main className="page-shell career-guidance-legacy">
      <div className="ambient-orb left-[-5rem] top-24 h-56 w-56 bg-cyan-400/20" />
      <div className="ambient-orb right-[-4rem] top-80 h-64 w-64 bg-blue-500/20 [animation-delay:1.3s]" />

      <section className="hero-panel panel-grid reveal-soft overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="chrome-line" />
        <div className="spotlight-ring" />
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Career Studio</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Turn your resume into a sharper job strategy.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Upload your resume, uncover the skills it signals, discover relevant opportunities, and get focused guidance in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">Resume insights</span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">Job discovery</span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">Career guidance</span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="metric-tile rounded-[1.7rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Profile Signal</p>
              <p className="mt-3 text-3xl font-semibold text-white">{topSkills.length ? topSkills.length : "--"}</p>
              <p className="mt-2 text-sm text-slate-300">
                {topSkills.length
                  ? "skills detected from your resume"
                  : "upload your resume to reveal your strongest skill signals"}
              </p>
            </div>

            <div className="metric-tile rounded-[1.7rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Opportunity Scan</p>
              <p className="mt-3 text-3xl font-semibold text-white">{jobsCount ? jobsCount : "--"}</p>
              <p className="mt-2 text-sm text-slate-300">
                {jobsCount
                  ? "matching roles surfaced for your current profile"
                  : "run job matching to see which roles fit best"}
              </p>
            </div>

            <div className="metric-tile rounded-[1.7rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Best Use</p>
              <p className="mt-3 text-xl font-semibold text-white">Plan your next move with clarity</p>
              <p className="mt-2 text-sm text-slate-300">
                Use this workspace to move from resume draft to role targeting and action-ready guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="reveal-up delay-2 mt-10 grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-8">
          <article className="glass-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Start Here</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Upload your resume</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  We will read your file, extract the strongest skill signals, and use them to power job discovery and coaching.
                </p>
              </div>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">PDF / DOCX / TXT</span>
            </div>

            <form className="mt-6 space-y-5" onSubmit={uploadResume}>
              <label className="glass-card block p-5">
                <span className="block text-sm text-slate-300">Choose the resume you want to work from</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-slate-950"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                />
              </label>

              {resumeError ? (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
                  {resumeError}
                </div>
              ) : null}

              <button type="submit" className="button-primary w-full" disabled={resumeLoading}>
                {resumeLoading ? <Loader label="Reading your resume..." /> : "Analyze Resume Profile"}
              </button>
            </form>

            {resumeResult ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">Skill profile</h3>
                    <span className="text-sm text-slate-300">{topSkills.length} found</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {topSkills.map((skill) => (
                      <span key={skill} className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">Resume snapshot</h3>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-300">Preview</span>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {resumeResult.resume_text?.slice(0, 520) || "No preview available."}
                  </p>
                </div>
              </div>
            ) : null}
          </article>

          <article className="glass-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Discover Roles</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">See where your profile fits</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Use the skill profile from your resume to surface relevant openings and understand where you are already competitive.
                </p>
              </div>
              <button type="button" className="button-secondary" onClick={findJobs} disabled={jobsLoading}>
                {jobsLoading ? <Loader label="Finding roles..." /> : "Find Matching Roles"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={jobLocation}
                onChange={(event) => setJobLocation(event.target.value)}
                className="field"
                placeholder="Preferred location"
              />
              <div className="glass-card px-4 py-3 text-sm text-slate-300">
                Matched using your extracted skills
              </div>
            </div>

            {jobsError ? (
              <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
                {jobsError}
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              {jobsResult.length ? (
                jobsResult.map((job, index) => (
                  <article
                    key={`${job.job_id || job.id || job.title}-${index}`}
                    className="glass-card p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {job.company} - {job.location}
                        </p>
                      </div>
                      <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                        {(job.match_score * 100 || 0).toFixed(0)}% fit
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      {job.description || "No description available."}
                    </p>
                    {job.url ? (
                      <a href={job.url} target="_blank" rel="noreferrer" className="button-secondary mt-5">
                        View Role
                      </a>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="glass-card p-5 text-sm text-slate-300">
                  Upload your resume, then run role matching to uncover the strongest opportunities for your current profile.
                </div>
              )}
            </div>
          </article>
        </div>

        <article className="glass-card p-6 sm:p-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.88),rgba(8,47,73,0.68))] p-6 shadow-[0_24px_80px_rgba(14,165,233,0.12)]">
            <div className="pointer-events-none absolute -right-16 top-0 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-blue-400/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Career Coach</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    Get a sharper next-step plan
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    Ask about role targeting, resume positioning, missing skills, roadmap design, project ideas, and learning resources. This coach now turns your current profile into a richer guidance panel instead of only a plain text reply.
                  </p>
                </div>

                <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-cyan-300/15 bg-slate-950/55 p-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">Skill Signal</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{topSkills.length || "--"}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {topSkills.length ? "skills available for coaching context" : "upload a resume to personalize guidance"}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-cyan-300/15 bg-slate-950/55 p-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">Role Scan</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{jobsCount || "--"}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {jobsCount ? "matched roles enriching the coach" : "job matches will sharpen role inference"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.6rem] border border-cyan-300/15 bg-cyan-400/5 p-5">
                <p className="text-sm font-medium text-white">Quick prompts</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {promptOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="rounded-full border border-cyan-300/20 bg-slate-950/40 px-4 py-2 text-sm text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-400/15"
                      onClick={() => setChatMessage(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <form className="mt-6 grid gap-5" onSubmit={askCareerCoach}>
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.6rem] border border-cyan-300/15 bg-slate-950/60 p-5 backdrop-blur">
                    <label className="mb-3 block text-sm font-medium uppercase tracking-[0.18em] text-cyan-200">
                      Question
                    </label>
                    <textarea
                      value={chatMessage}
                      onChange={(event) => setChatMessage(event.target.value)}
                      className="min-h-[180px] w-full rounded-[1.4rem] border border-white/10 bg-slate-800/90 px-4 py-3 text-base leading-8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-slate-400 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="Ask about role fit, positioning, missing skills, roadmap, or what to improve next"
                    />
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[1.6rem] border border-cyan-300/15 bg-slate-950/60 p-5 backdrop-blur">
                      <label className="mb-3 block text-sm font-medium uppercase tracking-[0.18em] text-cyan-200">
                        Background
                      </label>
                      <textarea
                        value={chatContext}
                        onChange={(event) => setChatContext(event.target.value)}
                        className="min-h-[132px] w-full rounded-[1.4rem] border border-white/10 bg-slate-800/90 px-4 py-3 text-base leading-8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-slate-400 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
                        placeholder="Add anything extra you want the coach to consider. Your uploaded resume is included automatically."
                      />
                    </div>

                    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/35 p-5">
                      <p className="text-sm font-medium text-white">What the coach now returns</p>
                      <div className="mt-4 grid gap-2 text-sm text-slate-300">
                        <div className="rounded-xl border border-cyan-300/10 bg-slate-800/70 px-3 py-2 text-slate-200">Role recommendation and narrative plan</div>
                        <div className="rounded-xl border border-cyan-300/10 bg-slate-800/70 px-3 py-2 text-slate-200">Skill-gap analysis from your current profile</div>
                        <div className="rounded-xl border border-cyan-300/10 bg-slate-800/70 px-3 py-2 text-slate-200">Step-by-step roadmap and course picks</div>
                      </div>
                    </div>
                  </div>
                </div>

                {chatError ? (
                  <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
                    {chatError}
                  </div>
                ) : null}

                <button type="submit" className="button-primary w-full" disabled={chatLoading}>
                  {chatLoading ? <Loader label="Building your guidance..." /> : "Generate Career Plan"}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {chatResult ? (
              <>
                <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(15,23,42,0.88))] p-6 shadow-[0_24px_60px_rgba(8,47,73,0.2)]">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">Career plan</h3>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {chatResult.is_fallback ? (
                        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">
                          fallback response
                        </span>
                      ) : null}
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                        {chatResult.role_detected ? String(chatResult.role_detected) : "Live response"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                    {chatResult.message}
                  </div>
                </div>

                {skillAnalysis ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-cyan-300/12 bg-slate-950/60 p-5 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Completion</p>
                      <p className="mt-3 text-3xl font-semibold text-white">
                        {Math.round(skillAnalysis.completion_percentage || 0)}%
                      </p>
                      <p className="mt-2 text-sm text-slate-300">matched against the target role roadmap</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-cyan-300/12 bg-slate-950/60 p-5 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Aligned Skills</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{skillAnalysis.current_skills_aligned || 0}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(skillAnalysis.existing_skills || []).length ? (
                          skillAnalysis.existing_skills.map((skill) => (
                            <span key={skill} className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-300">No aligned strengths detected yet.</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-[1.5rem] border border-cyan-300/12 bg-slate-950/60 p-5 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Skill Gaps</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{skillAnalysis.missing_count || 0}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(skillAnalysis.missing_skills || []).length ? (
                          skillAnalysis.missing_skills.map((skill) => (
                            <span key={skill} className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-300">You are ready to focus on projects and positioning.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {roadmap?.roadmap_steps?.length ? (
                  <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(8,47,73,0.72))] p-5 shadow-[0_24px_60px_rgba(8,47,73,0.18)]">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-white">Professional roadmap</h3>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                        {roadmap.estimated_timeline}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4">
                      {roadmap.roadmap_steps.map((step) => (
                        <div key={`${step.step}-${step.title}`} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">Step {step.step}: {step.title}</p>
                            <span className="text-xs uppercase tracking-[0.18em] text-cyan-200">{step.duration}</span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {(step.skills || []).map((skill) => (
                              <span key={`${step.title}-${skill}`} className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(resources?.free_courses?.length || resources?.paid_courses?.length) ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,78,59,0.24),rgba(15,23,42,0.9))] p-5 shadow-[0_24px_60px_rgba(6,78,59,0.15)]">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-white">Free resources</h3>
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">Free</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {(resources?.free_courses || []).map((course) => (
                          <a
                            key={`${course.provider}-${course.title}`}
                            href={course.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-[1.2rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                          >
                            <p className="text-sm font-semibold text-white">{course.title}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-200">{course.provider}</p>
                            <p className="mt-3 text-sm leading-6 text-slate-300">{course.reason}</p>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(120,53,15,0.24),rgba(15,23,42,0.9))] p-5 shadow-[0_24px_60px_rgba(120,53,15,0.14)]">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold text-white">Paid course picks</h3>
                        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">Paid</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {(resources?.paid_courses || []).map((course) => (
                          <a
                            key={`${course.provider}-${course.title}`}
                            href={course.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-[1.2rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                          >
                            <p className="text-sm font-semibold text-white">{course.title}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-200">{course.provider}</p>
                            <p className="mt-3 text-sm leading-6 text-slate-300">{course.reason}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,165,233,0.08),rgba(15,23,42,0.9))] p-5 shadow-[0_24px_60px_rgba(14,165,233,0.12)]">
                  <h3 className="text-lg font-semibold text-white">Immediate next actions</h3>
                  <div className="mt-4 grid gap-3">
                    {(chatResult.suggestions || []).map((suggestion, index) => (
                      <div key={`${suggestion}-${index}`} className="rounded-[1.1rem] border border-cyan-300/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[1.8rem] border border-dashed border-cyan-300/20 bg-cyan-400/5 p-6 text-sm leading-7 text-slate-300">
                Use the coach once your resume is uploaded, or ask directly for a sharper role strategy, stronger positioning, roadmap guidance, and course recommendations.
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

export default CareerGuidance;
