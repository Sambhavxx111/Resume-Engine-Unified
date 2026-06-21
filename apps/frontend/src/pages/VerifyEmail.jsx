import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import Loader from "../components/Loader";
import { API } from "../api/services";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const initialEmail = useMemo(
    () => location.state?.email || searchParams.get("email") || "",
    [location.state?.email, searchParams],
  );
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState(token ? "loading" : "idle");
  const [message, setMessage] = useState(
    location.state?.message || (token ? "Verifying your email..." : "Enter the 6-digit code we sent to your email."),
  );
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
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
        setMessage(error.response?.data?.error || error.response?.data?.message || "This verification link is invalid or expired.");
      }
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setStatus("error");
      setMessage("Please enter the 6-digit verification code.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post(API.verifyEmailOtp, { email, otp: otp.trim() });
      setStatus("success");
      setMessage(data.message || "Email verified successfully. You can sign in now.");
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { email, authPrompt: "Your email is verified. Please sign in." },
        });
      }, 1200);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.error || error.response?.data?.message || "Unable to verify this code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setStatus("error");
      setMessage("Enter your email address first so we can send a fresh code.");
      return;
    }

    setResending(true);
    setStatus("idle");
    try {
      const { data } = await axiosInstance.post(API.resendVerificationOtp, { email });
      setMessage(data.message || "If this email needs verification, a fresh code has been sent.");
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.error || error.response?.data?.message || "Unable to resend the code right now.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="page-shell flex min-h-[calc(100vh-96px)] items-center justify-center">
      <div className="glass-card w-full max-w-lg p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Email Verification</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {token ? "Confirming your account" : "Enter your verification code"}
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          {token
            ? "We are checking your verification link and activating your workspace."
            : "We sent a 6-digit code to your email. Verify it before signing in."}
        </p>

        {token ? null : (
          <form className="mt-8 space-y-5" onSubmit={handleOtpSubmit}>
            <input className="field" type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <input
              className="field text-center text-xl tracking-[0.35em]"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? <Loader label="Verifying..." /> : "Verify Email"}
            </button>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? <Loader label="Sending code..." /> : "Resend Code"}
            </button>
          </form>
        )}

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

          {status === "idle" && message ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-[0_10px_24px_rgba(245,158,11,0.08)]">
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
