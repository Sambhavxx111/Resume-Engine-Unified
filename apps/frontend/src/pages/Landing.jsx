import { Link } from "react-router-dom";

const ResumeBuilderIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3.75h6l4.25 4.25V20.25A1.75 1.75 0 0 1 16.5 22h-9A1.75 1.75 0 0 1 5.75 20.25v-14.75A1.75 1.75 0 0 1 7.5 3.75Z" />
    <path d="M14 3.75v4.5h4.5" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
);

const AtsAnalyzerIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.75 5.75h9.5a1.75 1.75 0 0 1 1.75 1.75v9.5a1.75 1.75 0 0 1-1.75 1.75h-9.5A1.75 1.75 0 0 1 4 17V7.5a1.75 1.75 0 0 1 1.75-1.75Z" />
    <path d="M8.5 14.5l2.25-2.25 1.75 1.75 3-3" />
    <path d="M8.5 9.5h7" />
  </svg>
);

const JdMatcherIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.75 6.75h6.5a1.75 1.75 0 0 1 1.75 1.75V15a1.75 1.75 0 0 1-1.75 1.75h-6.5A1.75 1.75 0 0 1 4 15V8.5a1.75 1.75 0 0 1 1.75-1.75Z" />
    <path d="M9 9.75h3" />
    <path d="M9 12.5h2" />
    <path d="M15.5 8.25h4.75" />
    <path d="M17.875 5.875v4.75" />
    <path d="M16.25 14.75l1.25 1.25 2.5-2.75" />
  </svg>
);

const CareerGuidanceIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4.75c4 0 7.25 3.25 7.25 7.25S16 19.25 12 19.25 4.75 16 4.75 12 8 4.75 12 4.75Z" />
    <path d="M12 8.5v3.5l2.5 1.75" />
    <path d="M8 19.25h8" />
  </svg>
);

const features = [
  {
    title: "Resume Builder",
    description: "Edit structured sections quickly and keep your content ready for every application.",
    to: "/resume",
    cta: "Open Builder",
    icon: ResumeBuilderIcon,
  },
  {
    title: "ATS Analyzer",
    description: "Upload PDF or DOC files and get scoring with actionable formatting and keyword feedback.",
    to: "/ats",
    cta: "Run ATS Check",
    icon: AtsAnalyzerIcon,
  },
  {
    title: "JD Matcher",
    description: "Compare your resume against job descriptions and spot alignment gaps before you apply.",
    to: "/jd-match",
    cta: "Match Against JD",
    icon: JdMatcherIcon,
  },
  {
    title: "Career Guidance",
    description: "Explore skill insights, live job matches, and guided next steps tailored to your resume.",
    to: "/career-guidance",
    cta: "Open Career Module",
    icon: CareerGuidanceIcon,
  },
];

function Landing() {
  return (
    <main className="page-shell">
      <div className="ambient-orb left-[-6rem] top-8 h-56 w-56 bg-cyan-400/20" />
      <div className="ambient-orb right-[-4rem] top-48 h-64 w-64 bg-blue-500/20 [animation-delay:2s]" />

      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
        <div className="space-y-8">
          <div className="reveal-up inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm">
            Resume intelligence for ambitious applicants
          </div>
          <div className="reveal-up delay-1 space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-7xl">
              Build a sharper resume with a cleaner, more production-ready workflow.
            </h1>
            <p className="max-w-2xl text-[17px] font-medium leading-8 text-slate-500">
              Resume Engine blends a polished resume builder with ATS analysis, job description matching,
              and AI-powered optimization in one fast workflow.
            </p>
          </div>
          <div className="reveal-up delay-2 grid gap-4 sm:grid-cols-3">
            <div className="metric-tile">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Realtime</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">ATS + AI</p>
            </div>
            <div className="metric-tile">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Workflow</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">One Hub</p>
            </div>
            <div className="metric-tile">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Output</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">PDF Ready</p>
            </div>
          </div>
          <div className="reveal-up delay-3 flex flex-wrap gap-4">
            <Link to="/signup" className="button-primary">
              Create Account
            </Link>
            <Link to="/login" className="button-secondary">
              Login
            </Link>
          </div>
        </div>

        <div className="reveal-soft delay-2 relative">
          <div className="absolute inset-0 -translate-y-5 rounded-[2rem] bg-sky-100/80 blur-3xl" />
          <div className="hero-panel panel-grid p-6 shadow-glow">
            <div className="chrome-line" />
            <div className="spotlight-ring" />
            <div className="animate-float rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_60px_rgba(148,163,184,0.16)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Live Snapshot</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Candidate Readiness</h2>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">ATS Score</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">89</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Summary quality</p>
                  <div className="mt-3 h-3 rounded-full bg-slate-200">
                    <div className="h-3 w-[82%] rounded-full bg-slate-900" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="metric-tile">
                    <p className="text-sm text-slate-500">JD Match</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">76%</p>
                  </div>
                  <div className="metric-tile">
                    <p className="text-sm text-slate-500">Missing Skills</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reveal-up delay-4 mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <Link
            key={feature.title}
            to={feature.to}
            className="feature-card"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] border border-slate-200 bg-slate-900 shadow-sm">
              <div className="text-white">
                <feature.icon />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">{feature.description}</p>
            <div className="mt-5 inline-flex items-center text-sm font-semibold text-slate-900">
              {feature.cta}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default Landing;
