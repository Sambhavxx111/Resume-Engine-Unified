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

const AiOptimizationIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.75 14 8l4.75 1-3.25 3.25.5 4.75L12 14.75 7.75 17l.5-4.75L5 9l4.75-1L12 3.75Z" />
    <path d="M18.25 3.75v3.5" />
    <path d="M20 5.5h-3.5" />
    <path d="M5.75 17.5V21" />
    <path d="M7.5 19.25H4" />
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
    title: "AI Optimization",
    description: "Generate summaries, surface missing skills, and polish your resume for stronger outcomes.",
    to: "/resume",
    cta: "Use AI Tools",
    icon: AiOptimizationIcon,
  },
];

function Landing() {
  return (
    <main className="page-shell">
      <div className="ambient-orb left-[-6rem] top-8 h-56 w-56 bg-cyan-400/20" />
      <div className="ambient-orb right-[-4rem] top-48 h-64 w-64 bg-blue-500/20 [animation-delay:2s]" />

      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 shadow-[0_18px_35px_rgba(34,211,238,0.12)]">
            Design-led resume intelligence for ambitious applicants
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Build a sharper resume and measure how well it lands.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Resume Engine blends a polished resume builder with ATS analysis, job description matching,
              and AI-powered optimization in one fast workflow.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="metric-tile">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Realtime</p>
              <p className="mt-3 text-2xl font-semibold text-white">ATS + AI</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Workflow</p>
              <p className="mt-3 text-2xl font-semibold text-white">One Hub</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Output</p>
              <p className="mt-3 text-2xl font-semibold text-white">PDF Ready</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/dashboard" className="button-primary">
              Continue as Guest
            </Link>
            <Link to="/signup" className="button-secondary">
              Create Account
            </Link>
            <Link to="/login" className="button-secondary">
              Login
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -translate-y-5 rounded-[2rem] bg-cyan-400/20 blur-3xl" />
          <div className="hero-panel panel-grid p-6 shadow-glow">
            <div className="chrome-line" />
            <div className="spotlight-ring" />
            <div className="animate-float rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_26px_65px_rgba(8,47,73,0.38)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Live Snapshot</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Candidate Readiness</h2>
                </div>
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">ATS Score</p>
                  <p className="text-3xl font-bold text-white">89</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Summary quality</p>
                  <div className="mt-3 h-3 rounded-full bg-slate-800">
                    <div className="h-3 w-[82%] rounded-full bg-cyan-300" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="metric-tile">
                    <p className="text-sm text-slate-300">JD Match</p>
                    <p className="mt-2 text-3xl font-semibold text-white">76%</p>
                  </div>
                  <div className="metric-tile">
                    <p className="text-sm text-slate-300">Missing Skills</p>
                    <p className="mt-2 text-3xl font-semibold text-white">3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.title}
            to={feature.to}
            className="feature-card"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 shadow-[0_14px_30px_rgba(34,211,238,0.14)]">
              <feature.icon />
            </div>
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
            <div className="mt-5 inline-flex items-center text-sm font-semibold text-cyan-300">
              {feature.cta}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default Landing;
