import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import Loader from "../components/Loader";
import { API } from "../api/services";

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    let isMounted = true;

    const verify = async () => {
      try {
        const { data } = await axiosInstance.post(API.verifyEmail, { token });
        if (!isMounted) return;
        setStatus("success");
        setMessage(data.message || "Email verified successfully. You can sign in now.");
        setTimeout(() => {
          navigate("/login", {
            replace: true,
            state: { authPrompt: "Your email is verified. Please sign in." },
          });
        }, 1500);
      } catch (error) {
        if (!isMounted) return;
        setStatus("error");
        setMessage(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "This verification link is invalid or expired.",
        );
      }
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <main className="page-shell flex min-h-[calc(100vh-96px)] items-center justify-center">
      <div className="glass-card w-full max-w-lg p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Email Verification</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Confirming your account</h1>
        <p className="mt-3 text-sm text-slate-300">
          We are checking your verification link and activating your workspace.
        </p>

        <div className="mt-8">
          {status === "loading" ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              <Loader label={message} />
            </div>
          ) : null}

          {status === "success" ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
              {message}
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
              {message}
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Back to{" "}
          <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
            sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default VerifyEmail;
