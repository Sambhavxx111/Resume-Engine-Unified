import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import Loader from "../components/Loader";
import PasswordField from "../components/PasswordField";
import { API } from "../api/services";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(searchParams.get("token") || "");
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post(API.resetPassword, { token, password });
      setInfo(data.message || "Password reset successfully. Please sign in again.");
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { authPrompt: "Password reset complete. Please sign in." },
        });
      }, 1500);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.message ||
          "Unable to reset your password right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell flex min-h-[calc(100vh-96px)] items-center justify-center">
      <div className="glass-card w-full max-w-lg p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Password Reset</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Choose a new password</h1>
        <p className="mt-3 text-sm text-slate-300">
          Set a strong password with uppercase, lowercase, a number, and a special character.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <PasswordField
            name="password"
            placeholder="New password"
            minLength={10}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <PasswordField
            name="confirmPassword"
            placeholder="Confirm new password"
            minLength={10}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {error ? (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
              {info}
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? <Loader label="Resetting password..." /> : "Reset password"}
          </button>
        </form>

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

export default ResetPassword;
