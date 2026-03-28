import { useState } from "react";
import axiosInstance from "../api/axios";
import { API } from "../api/services";
import Loader from "../components/Loader";
import { exportOptimizedUploadPdf } from "../utils/pdf";

function ATSAnalysis() {
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
      exportOptimizedUploadPdf(
        data.fileName,
        data.headline,
        data.optimizedResumeText,
        data.optimizedResumeData,
      );
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
      <div className="ambient-orb right-[-4rem] top-56 h-60 w-60 bg-blue-500/15 [animation-delay:1s]" />

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hero-panel p-6 sm:p-8">
          <div className="chrome-line" />
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">ATS Analyzer</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Upload your resume for a compatibility check</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            The analyzer accepts resume files through `FormData` and returns an ATS score with
            improvement suggestions.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block rounded-3xl border border-dashed border-cyan-300/20 bg-slate-900/70 p-6 text-center shadow-[0_22px_55px_rgba(8,47,73,0.25)]">
              <span className="block text-sm text-slate-300">Select PDF or DOC file</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-slate-950"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button type="submit" className="button-primary w-full" disabled={loading}>
              {loading ? <Loader label="Analyzing resume..." /> : "Run ATS Analysis"}
            </button>

            <button
              type="button"
              className="button-secondary w-full"
              disabled={!file || optimizing || loading}
              onClick={handleOptimizeUploadedResume}
            >
              {optimizing ? <Loader label="Optimizing & downloading..." /> : "Optimize Uploaded Resume & Download"}
            </button>
          </form>
        </div>

        <div className="hero-panel p-6 sm:p-8">
          <div className="chrome-line" />
          <h2 className="text-2xl font-semibold text-white">Analysis Result</h2>
          {!result && !loading ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
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
              <div className="rounded-[2rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-400/15 to-cyan-400/10 p-6 shadow-[0_24px_60px_rgba(16,185,129,0.16)]">
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">ATS Score</p>
                <p className="mt-3 text-5xl font-bold text-white">
                  {result.totalScore ?? result.score ?? "--"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <h3 className="text-lg font-semibold text-white">Suggestions</h3>
                <div className="mt-4 space-y-3">
                  {Array.isArray(result.suggestions) && result.suggestions.length ? (
                    result.suggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                      >
                        {suggestion}
                      </div>
                    ))
                  ) : result.suggestions?.message ? (
                    <>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                        {result.suggestions.message}
                      </div>
                      {Array.isArray(result.missingSections) && result.missingSections.length ? (
                        result.missingSections.map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
                          >
                            Missing section: {item}
                          </div>
                        ))
                      ) : null}
                      {Array.isArray(result.missingKeywords) && result.missingKeywords.length ? (
                        result.missingKeywords.slice(0, 6).map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
                          >
                            Missing keyword: {item}
                          </div>
                        ))
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">No suggestions returned from the API.</p>
                  )}
                </div>
              </div>

              {optimizedUpload ? (
                <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Optimized Resume Downloaded
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90">
                        {optimizedUpload.headline ||
                          "Your ATS-optimized resume draft has been generated and downloaded."}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                          Before
                        </p>
                        <p className="mt-1 text-3xl font-bold text-white">
                          {optimizedUpload.originalScore ?? "--"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                          After
                        </p>
                        <p className="mt-1 text-3xl font-bold text-white">
                          {optimizedUpload.optimizedScore ?? "--"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-100">
                    Score gain: {optimizedUpload.scoreGain ?? 0}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-100">
                    {optimizedUpload.targetScoreReached
                      ? "The optimized draft reached the 90+ ATS target."
                      : "The optimizer pushed the draft upward, but the current content still needs stronger raw material to cross 90 honestly."}
                  </div>

                  {Array.isArray(optimizedUpload.keyChanges) && optimizedUpload.keyChanges.length ? (
                    <div className="mt-5 space-y-3">
                      {optimizedUpload.keyChanges.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-100"
                        >
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
