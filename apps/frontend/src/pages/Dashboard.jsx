import { Link } from 'react-router-dom';

const ResumeBuilderIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3.75h6l4.25 4.25V20.25A1.75 1.75 0 0 1 16.5 22h-9A1.75 1.75 0 0 1 5.75 20.25v-14.75A1.75 1.75 0 0 1 7.5 3.75Z" />
    <path d="M14 3.75v4.5h4.5" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
);

const AtsAnalyzerIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.75 5.75h9.5a1.75 1.75 0 0 1 1.75 1.75v9.5a1.75 1.75 0 0 1-1.75 1.75h-9.5A1.75 1.75 0 0 1 4 17V7.5a1.75 1.75 0 0 1 1.75-1.75Z" />
    <path d="M8.5 14.5l2.25-2.25 1.75 1.75 3-3" />
    <path d="M8.5 9.5h7" />
  </svg>
);

const CareerGuidanceIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4.75c4 0 7.25 3.25 7.25 7.25S16 19.25 12 19.25 4.75 16 4.75 12 8 4.75 12 4.75Z" />
    <path d="M12 8.5v3.5l2.5 1.75" />
    <path d="M8 19.25h8" />
  </svg>
);

const JdMatcherIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.75 6.75h6.5a1.75 1.75 0 0 1 1.75 1.75V15a1.75 1.75 0 0 1-1.75 1.75h-6.5A1.75 1.75 0 0 1 4 15V8.5a1.75 1.75 0 0 1 1.75-1.75Z" />
    <path d="M9 9.75h3" />
    <path d="M9 12.5h2" />
    <path d="M15.5 8.25h4.75" />
    <path d="M17.875 5.875v4.75" />
    <path d="M16.25 14.75l1.25 1.25 2.5-2.75" />
  </svg>
);

const cards = [
  {
    title: 'Resume Builder',
    description: 'Maintain your full professional profile in one structured workspace.',
    cta: 'Open Builder',
    to: '/resume',
    icon: ResumeBuilderIcon,
  },
  {
    title: 'ATS Analyzer',
    description: 'Upload your latest file and uncover formatting or keyword gaps quickly.',
    cta: 'Analyze Resume',
    to: '/ats',
    icon: AtsAnalyzerIcon,
  },
  {
    title: 'Career Guidance',
    description: 'Turn your resume into skills, live job matches, and Gemini-backed career coaching.',
    cta: 'Open Career Module',
    to: '/career-guidance',
    icon: CareerGuidanceIcon,
  },
  {
    title: 'JD Matcher',
    description: 'Check resume-to-job alignment quickly and identify what each application still needs.',
    cta: 'Open JD Matcher',
    to: '/jd-match',
    icon: JdMatcherIcon,
  },
];

function Dashboard() {
  return (
    <main className="page-shell">
      <div className="ambient-orb left-[-5rem] top-24 h-60 w-60 bg-cyan-400/20" />
      <div className="ambient-orb right-[-4rem] top-56 h-64 w-64 bg-blue-500/20 [animation-delay:1.5s]" />

      <section className="hero-panel panel-grid reveal-soft overflow-hidden p-8 sm:p-10">
        <div className="chrome-line" />
        <div className="spotlight-ring" />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Dashboard</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl">
              Everything you need to move from resume draft to application-ready.
            </h1>
            <p className="mt-4 max-w-2xl text-[17px] leading-8 text-slate-500">
              Use the builder to shape your experience, run ATS scans for compatibility, and continue straight into job discovery and career coaching.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/92 p-6 shadow-[0_22px_60px_rgba(148,163,184,0.12)]">
            <p className="text-sm font-medium text-slate-700">Workflow readiness</p>
            <div className="mt-4 space-y-4">
              <div className="metric-tile">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Resume completeness</span>
                  <span className="text-lg font-semibold text-slate-900">High</span>
                </div>
              </div>
              <div className="metric-tile">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">ATS insights</span>
                  <span className="text-lg font-semibold text-slate-900">Ready</span>
                </div>
              </div>
              <div className="metric-tile">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Career guidance</span>
                  <span className="text-lg font-semibold text-slate-900">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="reveal-up delay-2 mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="feature-card">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] border border-slate-200 bg-slate-900 shadow-sm">
              <div className="text-white">
                <card.icon />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            <Link to={card.to} className="button-primary mt-6">
              {card.cta}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Dashboard;
