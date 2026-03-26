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
];

function Dashboard() {
  return (
    <main className="page-shell">
      <div className="ambient-orb left-[-5rem] top-24 h-60 w-60 bg-cyan-400/20" />
      <div className="ambient-orb right-[-4rem] top-56 h-64 w-64 bg-blue-500/20 [animation-delay:1.5s]" />

      <section className="hero-panel panel-grid overflow-hidden p-8 sm:p-10">
        <div className="chrome-line" />
        <div className="spotlight-ring" />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Dashboard</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-white">
              Everything you need to go from resume draft to application-ready and career-guided.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Use the builder to shape your experience, run ATS scans for compatibility, and continue straight into job discovery and career coaching.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_26px_65px_rgba(8,47,73,0.34)]">
            <p className="text-sm text-slate-300">Workflow readiness</p>
            <div className="mt-4 space-y-4">
              <div className="metric-tile">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Resume completeness</span>
                  <span className="text-lg font-semibold text-white">High</span>
                </div>
              </div>
              <div className="metric-tile">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">ATS insights</span>
                  <span className="text-lg font-semibold text-white">Ready</span>
                </div>
              </div>
              <div className="metric-tile">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Career guidance</span>
                  <span className="text-lg font-semibold text-white">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="feature-card">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 shadow-glow">
              <card.icon />
            </div>
            <h2 className="text-2xl font-semibold text-white">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
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
