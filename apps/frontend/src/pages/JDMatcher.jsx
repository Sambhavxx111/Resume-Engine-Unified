import { useState } from "react";
import axiosInstance from "../api/axios";
import { API } from "../api/services";
import Loader from "../components/Loader";

function JDMatcher() {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!resumeFile) {
      setError("Please upload your resume before running the matcher.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste a job description before running the matcher.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      const { data } = await axiosInstance.post(API.jdMatch, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(data);
    } catch (requestError) {
      const details = requestError.response?.data?.details;
      setError(
        details
          ? `${requestError.response?.data?.error || "JD matching failed"}: ${details}`
          : requestError.response?.data?.error ||
            requestError.response?.data?.message ||
            "Unable to calculate the job description match right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="ambient-orb left-[-4rem] top-16 h-52 w-52 bg-cyan-400/20" />
      <div className="ambient-orb right-[-4rem] top-72 h-60 w-60 bg-blue-500/20 [animation-delay:2s]" />

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="hero-panel p-6 sm:p-8">
            <div className="chrome-line" />
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Job Description Matcher</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Compare your resume against a target role</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Upload your resume, paste the target job description, and get a direct analysis of how well your resume fits that role.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block rounded-[2rem] border border-dashed border-cyan-300/25 bg-slate-950/40 p-6 text-center">
                <span className="block text-sm uppercase tracking-[0.24em] text-cyan-200">
                  Resume Upload
                </span>
                <span className="mt-3 block text-sm text-slate-300">
                  PDF, DOC, or DOCX resume
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="mt-5 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-slate-950"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                />
                {resumeFile ? (
                  <span className="mt-4 block text-sm text-white">{resumeFile.name}</span>
                ) : null}
              </label>

              <textarea
                className="field min-h-72"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
              />

              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button type="submit" className="button-primary w-full" disabled={loading}>
                {loading ? <Loader label="Matching..." /> : "Analyze Resume Against JD"}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="hero-panel p-6 sm:p-8">
          <div className="chrome-line" />
          <h2 className="text-2xl font-semibold text-white">Match Results</h2>

          {!result && !loading ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
              Upload a resume and paste a job description to see the match score, keyword overlap, and missing requirements.
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6">
              <Loader label="Scoring your job match..." />
            </div>
          ) : null}

          {result ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/18 to-blue-500/12 p-6 shadow-[0_24px_60px_rgba(34,211,238,0.16)]">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Match Percentage</p>
                <p className="mt-3 text-5xl font-bold text-white">
                  {result.matchPercentage ?? "--"}%
                </p>
                {result.fileName ? (
                  <p className="mt-3 text-sm text-slate-300">Analyzed file: {result.fileName}</p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <h3 className="text-lg font-semibold text-white">Matched Keywords</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.isArray(result.matchedKeywords) && result.matchedKeywords.length ? (
                    result.matchedKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No matched keywords were returned.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <h3 className="text-lg font-semibold text-white">Missing Keywords</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.isArray(result.missingKeywords) && result.missingKeywords.length ? (
                    result.missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-100"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No missing keywords were returned.</p>
                  )}
                </div>
              </div>
              {result.summary ? (
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                  <h3 className="text-lg font-semibold text-white">Analysis Summary</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      Matched requirements: {result.summary.matched ?? "--"} / {result.summary.total ?? "--"}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      Resume skills detected: {result.summary.resumeSkillsCount ?? "--"}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      JD requirements detected: {result.summary.jdRequiredCount ?? "--"}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      {result.isStrongMatch ? "Strong fit for this role" : "Needs improvement for this role"}
                    </div>
                  </div>
                </div>
              ) : null}

              {result.recommendations ? (
                <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                  <h3 className="text-lg font-semibold text-white">Recommendation</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{result.recommendations}</p>
                </div>
              ) : null}
            </div>
          ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default JDMatcher;
