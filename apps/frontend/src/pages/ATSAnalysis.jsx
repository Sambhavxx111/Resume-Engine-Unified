import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { API } from "../api/services";
import Loader from "../components/Loader";
import { exportOptimizedUploadPdf } from "../utils/pdf";
import { useAuth } from "../context/AuthContext";

function ATSAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [optimizedUpload, setOptimizedUpload] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please upload a PDF or DOC resume file.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setOptimizedUpload(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const { data } = await axiosInstance.post(API.atsScoreFile, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "ATS analysis failed. Please try again with another file.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeUploadedResume = async () => {
    if (!file) {
      setError("Upload a resume file first so it can be optimized.");
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location,
          authPrompt: "Please log in with your personal email to optimize and download your uploaded resume.",
        },
      });
      return;
    }

    setOptimizing(true);
    setError("");
    setOptimizedUpload(null);

    const formData = new FormData();
    formData.append("resume", file);

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
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to optimize the uploaded resume right now.",
      );
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
              <span className="block text-sm font-medium text-slate-600">Select PDF or DOC file</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-slate-950"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
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
              disabled={loading}
            >
              {loading ? <Loader label="Analyzing resume..." /> : "Run ATS Analysis"}
            </button>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-[20px] border border-cyan-300/80 bg-[linear-gradient(135deg,rgba(8,47,73,0.98),rgba(14,116,144,0.96)_52%,rgba(34,211,238,0.88))] px-5 py-3.5 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_20px_40px_rgba(8,47,73,0.24)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_24px_48px_rgba(8,47,73,0.28)] hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!file || optimizing || loading}
              onClick={handleOptimizeUploadedResume}
            >
              {optimizing ? <Loader label="Optimizing & downloading..." /> : "Optimize Uploaded Resume & Download"}
            </button>
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
            </div>
          ) : null}

          {result ? (
            <div className="mt-6 space-y-6">
              <div className="glass-card p-6">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">ATS Score</p>
                <p className="mt-3 text-5xl font-bold text-slate-900">
                  {result.totalScore ?? result.score ?? "--"}
                </p>
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
