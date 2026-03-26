import { useMemo, useState } from 'react';
import axios from 'axios';
import Loader from '../components/Loader';
import { CAREER_API, getCareerServiceBaseUrl } from '../api/careerService';

const promptOptions = [
  'Which roles should I target with this resume?',
  'What are the top skill gaps I should close next?',
  'How should I improve this resume for stronger applications?',
];

function buildCoachContext({ chatContext, resumeResult, jobsResult, jobLocation }) {
  const parts = [];

  if (chatContext?.trim()) {
    parts.push(`User background: ${chatContext.trim()}`);
  }

  if (resumeResult?.skills?.length) {
    parts.push(`Extracted resume skills: ${resumeResult.skills.join(', ')}`);
  }

  if (resumeResult?.resume_text?.trim()) {
    parts.push(`Resume text snapshot: ${resumeResult.resume_text.trim().slice(0, 1400)}`);
  }

  if (jobsResult?.length) {
    const topRoles = jobsResult
      .slice(0, 3)
      .map((job) => `${job.title} at ${job.company} in ${job.location}`)
      .join('; ');
    parts.push(`Top matched roles in ${jobLocation}: ${topRoles}`);
  }

  return parts.join('\n\n');
}

function CareerGuidance() {
  const baseURL = useMemo(() => getCareerServiceBaseUrl(), []);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeResult, setResumeResult] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState('');

  const [jobLocation, setJobLocation] = useState('India');
  const [jobsResult, setJobsResult] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');

  const [chatMessage, setChatMessage] = useState(
    'What roles should I target next with my current resume and how should I improve it?',
  );
  const [chatContext, setChatContext] = useState(
    'I want practical advice based on my current skills, resume, and next career step.',
  );
  const [chatResult, setChatResult] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const uploadResume = async (event) => {
    event.preventDefault();
    if (!resumeFile) {
      setResumeError('Please upload a PDF, DOCX, or TXT resume first.');
      return;
    }

    setResumeLoading(true);
    setResumeError('');
    setResumeResult(null);
    setJobsResult([]);
    setJobsError('');

    const formData = new FormData();
    formData.append('file', resumeFile);

    try {
      const { data } = await axios.post(`${baseURL}${CAREER_API.uploadResume}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResumeResult(data);
    } catch (error) {
      setResumeError(error.response?.data?.detail || 'Unable to extract resume skills right now.');
    } finally {
      setResumeLoading(false);
    }
  };

  const findJobs = async () => {
    if (!resumeResult?.skills?.length) {
      setJobsError('Upload a resume first so we can match you with the right roles.');
      return;
    }

    setJobsLoading(true);
    setJobsError('');
    setJobsResult([]);

    try {
      const { data } = await axios.post(`${baseURL}${CAREER_API.matchJobs}`, {
        skills: resumeResult.skills,
        location: jobLocation,
        limit: 6,
      });
      setJobsResult(data.matched_jobs || data.matchedJobs || []);
    } catch (error) {
      setJobsError(error.response?.data?.detail || 'Unable to fetch job matches right now.');
    } finally {
      setJobsLoading(false);
    }
  };

  const askCareerCoach = async (event) => {
    event.preventDefault();
    if (!chatMessage.trim()) {
      setChatError('Please enter a question for the career coach.');
      return;
    }

    setChatLoading(true);
    setChatError('');
    setChatResult(null);

    try {
      const context = buildCoachContext({
        chatContext,
        resumeResult,
        jobsResult,
        jobLocation,
      });
      const { data } = await axios.post(`${baseURL}${CAREER_API.chat}`, {
        message: chatMessage,
        context,
      });
      setChatResult(data);
    } catch (error) {
      setChatError(error.response?.data?.detail || 'The career coach could not answer right now.');
    } finally {
      setChatLoading(false);
    }
  };

  const topSkills = resumeResult?.skills || [];
  const jobsCount = jobsResult.length;

  return (
    <main className="page-shell">
      <div className="ambient-orb left-[-5rem] top-24 h-56 w-56 bg-cyan-400/15" />
      <div className="ambient-orb right-[-4rem] top-80 h-64 w-64 bg-blue-500/20 [animation-delay:1.3s]" />

      <section className="hero-panel overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="chrome-line" />
        <div className="spotlight-ring" />
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Career Studio</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Turn your resume into a sharper job strategy.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Upload your resume, uncover the skills it signals, discover relevant opportunities,
              and get focused career guidance in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                Resume insights
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                Job discovery
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                AI career guidance
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="metric-tile rounded-[2rem] border border-white/10 bg-slate-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Profile Signal</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {topSkills.length ? topSkills.length : '--'}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {topSkills.length
                  ? 'skills detected from your resume'
                  : 'upload your resume to reveal your strongest skill signals'}
              </p>
            </div>

            <div className="metric-tile rounded-[2rem] border border-white/10 bg-slate-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Opportunity Scan</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {jobsCount ? jobsCount : '--'}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {jobsCount
                  ? 'matching roles surfaced for your current profile'
                  : 'run job matching to see which roles fit best'}
              </p>
            </div>

            <div className="metric-tile rounded-[2rem] border border-white/10 bg-slate-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Best Use</p>
              <p className="mt-3 text-xl font-semibold text-white">Plan your next move with clarity</p>
              <p className="mt-2 text-sm text-slate-300">
                Use this workspace to move from resume draft to role targeting and action-ready guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-8">
          <article className="glass-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Start Here</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Upload your resume</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  We will read your file, extract the strongest skill signals, and use them to power job discovery and coaching.
                </p>
              </div>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                PDF / DOCX / TXT
              </span>
            </div>

            <form className="mt-6 space-y-5" onSubmit={uploadResume}>
              <label className="block rounded-3xl border border-dashed border-cyan-300/20 bg-slate-900/70 p-6 text-center shadow-[0_22px_55px_rgba(8,47,73,0.25)]">
                <span className="block text-sm text-slate-300">Choose the resume you want to work from</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-slate-950"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                />
              </label>

              {resumeError ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {resumeError}
                </div>
              ) : null}

              <button type="submit" className="button-primary w-full" disabled={resumeLoading}>
                {resumeLoading ? <Loader label="Reading your resume..." /> : 'Analyze Resume Profile'}
              </button>
            </form>

            {resumeResult ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">Skill profile</h3>
                    <span className="text-sm text-slate-300">{topSkills.length} found</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {topSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">Resume snapshot</h3>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Preview</span>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {resumeResult.resume_text?.slice(0, 520) || 'No preview available.'}
                  </p>
                </div>
              </div>
            ) : null}
          </article>

          <article className="glass-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Discover Roles</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">See where your profile fits</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Use the skill profile from your resume to surface relevant openings and understand where you are already competitive.
                </p>
              </div>
              <button type="button" className="button-secondary" onClick={findJobs} disabled={jobsLoading}>
                {jobsLoading ? <Loader label="Finding roles..." /> : 'Find Matching Roles'}
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
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Matched using your extracted skills
              </div>
            </div>

            {jobsError ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {jobsError}
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              {jobsResult.length ? (
                jobsResult.map((job, index) => (
                  <article
                    key={`${job.job_id || job.id || job.title}-${index}`}
                    className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {job.company} • {job.location}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                        {(job.match_score * 100 || 0).toFixed(0)}% fit
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      {job.description || 'No description available.'}
                    </p>
                    {job.url ? (
                      <a href={job.url} target="_blank" rel="noreferrer" className="button-secondary mt-5">
                        View Role
                      </a>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-400">
                  Upload your resume, then run role matching to uncover the strongest opportunities for your current profile.
                </div>
              )}
            </div>
          </article>
        </div>

        <article className="glass-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Career Coach</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Get a sharper next-step plan</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Ask for role targeting, resume positioning, skill gaps, or project direction. The coach will turn your current profile into a practical action plan.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-sm font-medium text-white">Quick prompts</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {promptOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-white"
                  onClick={() => setChatMessage(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={askCareerCoach}>
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-medium text-white">Question</label>
              <textarea
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                className="field min-h-[120px]"
                placeholder="Ask about role fit, positioning, missing skills, or what to improve next"
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-medium text-white">Background</label>
              <textarea
                value={chatContext}
                onChange={(event) => setChatContext(event.target.value)}
                className="field min-h-[110px]"
                placeholder="Add anything extra you want the coach to consider. Your uploaded resume is included automatically."
              />
            </div>

            {chatError ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {chatError}
              </div>
            ) : null}

            <button type="submit" className="button-primary w-full" disabled={chatLoading}>
              {chatLoading ? <Loader label="Building your guidance..." /> : 'Generate Career Plan'}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            {chatResult ? (
              <>
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white">Career plan</h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                      Live response
                    </span>
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                    {chatResult.message}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                  <h3 className="text-lg font-semibold text-white">Immediate next actions</h3>
                  <div className="mt-4 grid gap-3">
                    {(chatResult.suggestions || []).map((suggestion, index) => (
                      <div
                        key={`${suggestion}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-sm text-slate-400">
                Use the coach once your resume is uploaded, or ask directly for a sharper role strategy, stronger positioning, and better next steps.
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

export default CareerGuidance;
