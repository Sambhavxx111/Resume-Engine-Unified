import { useState } from "react";
import axiosInstance from "../api/axios";
import { API } from "../api/services";
import Loader from "../components/Loader";
import { exportOptimizedUploadPdf } from "../utils/pdf";

const getUploadErrorMessage = (requestError, fallback) => {
  const rawMessage =
    requestError.response?.data?.message ||
    requestError.response?.data?.error ||
    requestError.message ||
    "";

  if (/file too large|too large|limit/i.test(rawMessage)) {
    return "That file is too large. Please upload a resume under the allowed size limit.";
  }

  if (/unsupported|type|declared resume type|content does not match/i.test(rawMessage)) {
    return "Unsupported file. Please upload a clean PDF, DOCX, or TXT resume.";
  }

  if (/extract|readable|selectable|scan|scanned|quality/i.test(rawMessage)) {
    return "We could not read enough text from this resume. Please upload the original text-based PDF, DOCX, or TXT file instead of a scan or screenshot.";
  }

  return rawMessage || fallback;
};

function ATSAnalysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [optimizedUpload, setOptimizedUpload] = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please choose a resume file first. PDF, DOCX, or TXT works best.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setOptimizedUpload(null);

    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription.trim()) {
      formData.append("jobDescription", jobDescription.trim());
    }

    try {
      const { data } = await axiosInstance.post(API.atsScoreFile, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(data);
    } catch (requestError) {
      setError(getUploadErrorMessage(requestError, "ATS analysis failed. Please try again with another file."));
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeUploadedResume = async () => {
    if (!file) {
      setError("Please choose a resume file first so it can be optimized.");
      return;
    }

    setOptimizing(true);
    setError("");
    setOptimizedUpload(null);

    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription.trim()) {
      formData.append("jobDescription", jobDescription.trim());
    }

    try {
      const { data } = await axiosInstance.post(API.atsOptimizeFile, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setOptimizedUpload(data);
      try {
        exportOptimizedUploadPdf(
          data.fileName,
          data.headline,
          data.optimizedResumeText,
          data.optimizedResumeData,
        );
      } catch (exportError) {
        console.error("Optimized resume PDF export failed:", exportError);
        setError("Resume optimized successfully, but the automatic PDF download failed.");
      }
    } catch (requestError) {
      setError(getUploadErrorMessage(requestError, "Unable to optimize the uploaded resume right now."));
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="ambient-orb left-[-5rem] top-20 h-52 w-52 bg-cyan-400/20" />
      <div className="ambient-orb right-[-4rem] top-56 h-60 w-60 bg-blue-500/20 [animation-delay:1s]" />

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hero-panel panel-grid reveal-soft p-6 sm:p-8">
          <div className="chrome-line" />
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">ATS Analyzer</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl">
            Upload your resume for a compatibility check
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-8 text-slate-500">
            Review how your resume reads in an ATS-style scan, then download an optimized version if you want a stronger draft to work from.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="glass-card block p-5">
              <span className="block text-sm font-medium text-slate-600">Select PDF, DOCX, or TXT file</span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                Privacy: your resume is used only for this ATS analysis and optimization request.
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-slate-950"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            <label className="glass-card block p-5">
              <span className="block text-sm font-medium text-slate-600">Target job description or role context</span>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                className="mt-4 min-h-[140px] w-full rounded-[18px] border border-white/70 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                placeholder="Optional, but recommended. Paste the JD here for a sharper RAG-based ATS score and optimized resume."
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!file || loading || optimizing}
            >
              {loading ? <Loader label="Analyzing resume..." /> : file ? "Run ATS Analysis" : "Choose a Resume to Analyze"}
            </button>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-[20px] border border-cyan-300/80 bg-[linear-gradient(135deg,rgba(8,47,73,0.98),rgba(14,116,144,0.96)_52%,rgba(34,211,238,0.88))] px-5 py-3.5 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_20px_40px_rgba(8,47,73,0.24)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_24px_48px_rgba(8,47,73,0.28)] hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!file || optimizing || loading}
              onClick={handleOptimizeUploadedResume}
            >
              {optimizing ? <Loader label="Optimizing & downloading..." /> : file ? "Optimize Uploaded Resume & Download" : "Choose a Resume to Optimize"}
            </button>
            <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              Beta note: resume optimization is still in development. The generated draft may not be perfect, so review and edit it manually before using it.
            </p>
          </form>
        </div>

        <div className="hero-panel panel-grid reveal-soft delay-2 p-6 sm:p-8">
          <div className="chrome-line" />
          <h2 className="section-title">Analysis Result</h2>

          {!result && !loading ? (
            <div className="glass-card mt-6 p-5 text-sm text-slate-300">
              Upload a resume to see score insights and suggestions here.
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6">
              <Loader label="Preparing ATS insight report..." />
              <p className="mt-3 text-sm text-slate-500">Reading the resume, checking ATS sections, and comparing job-description signals.</p>
            </div>
          ) : null}

          {result ? (
            <div className="mt-6 space-y-6">
              <div className="glass-card p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">ATS Score</p>
                <p className="mt-3 text-5xl font-bold text-slate-900">
                  {result.totalScore ?? result.score ?? "--"}
                </p>
                {result.source ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    {result.source}
                  </p>
                ) : null}
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-slate-900">Suggestions</h3>
                <div className="mt-4 space-y-3">
                  {Array.isArray(result.suggestions) && result.suggestions.length ? (
                    result.suggestions.map((suggestion, index) => (
                      <div key={`${suggestion}-${index}`} className="metric-tile text-sm font-medium text-slate-700">
                        {suggestion}
                      </div>
                    ))
                  ) : result.suggestions?.message ? (
                    <>
                      <div className="metric-tile text-sm font-medium text-slate-700">
                        {result.suggestions.message}
                      </div>
                      {Array.isArray(result.missingSections) && result.missingSections.length
                        ? result.missingSections.map((item) => (
                            <div key={item} className="metric-tile text-sm font-medium text-slate-700">
                              Missing section: {item}
                            </div>
                          ))
                        : null}
                      {Array.isArray(result.missingKeywords) && result.missingKeywords.length
                        ? result.missingKeywords.slice(0, 6).map((item) => (
                            <div key={item} className="metric-tile text-sm font-medium text-slate-700">
                              Missing keyword: {item}
                            </div>
                          ))
                        : null}
                    </>
                  ) : (
                    <p className="text-sm text-slate-300">No suggestions returned from the API.</p>
                  )}
                </div>
              </div>

              {optimizedUpload ? (
                <div className="glass-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Optimized Resume Downloaded</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        {optimizedUpload.headline ||
                          "Your ATS-optimized resume draft has been generated and downloaded."}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="metric-tile px-4 py-3 text-center">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Before</p>
                        <p className="mt-1 text-3xl font-bold text-slate-900">{optimizedUpload.originalScore ?? "--"}</p>
                      </div>
                      <div className="metric-tile px-4 py-3 text-center">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">After</p>
                        <p className="mt-1 text-3xl font-bold text-slate-900">{optimizedUpload.optimizedScore ?? "--"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 metric-tile text-sm font-medium text-slate-700">
                    Score gain: {optimizedUpload.scoreGain ?? 0}
                  </div>

                  <div className="mt-4 metric-tile text-sm font-medium text-slate-700">
                    {optimizedUpload.targetScoreReached
                      ? "The optimized draft reached the 90+ ATS target."
                      : "The optimizer pushed the draft upward, but the current content still needs stronger raw material to cross 90 honestly."}
                  </div>

                  {Array.isArray(optimizedUpload.keyChanges) && optimizedUpload.keyChanges.length ? (
                    <div className="mt-5 space-y-3">
                      {optimizedUpload.keyChanges.map((item, index) => (
                        <div key={`${item}-${index}`} className="metric-tile text-sm font-medium text-slate-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default ATSAnalysis;
