import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authLoading } = useAuth();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (location.state?.email) {
      setFormState((prev) => ({ ...prev, email: location.state.email }));
    }

    if (location.state?.fromSignupDuplicate) {
      setInfo("This email is already registered. Please log in instead.");
      return;
    }

    if (location.state?.authPrompt) {
      setInfo(location.state.authPrompt);
    }
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    try {
      await login(formState);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (requestError) {
      if (!requestError.response) {
        setError(
          "Cannot reach the backend right now. Make sure the API server is running and reachable.",
        );
        return;
      }

      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to sign in. Please try again.",
      );
    }
  };

  return (
    <main className="page-shell flex min-h-[calc(100vh-96px)] items-center justify-center">
      <div className="glass-card w-full max-w-lg p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Welcome Back</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Sign in to your workspace</h1>
        <p className="mt-3 text-sm text-slate-300">
          Access your saved resume, ATS reports, job-match insights, and gated downloads with your personal email login.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <input className="field" type="email" name="email" placeholder="Email address" value={formState.email} onChange={handleChange} required />
          <PasswordField name="password" placeholder="Password" value={formState.password} onChange={handleChange} required />

          {error ? (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-[0_10px_24px_rgba(245,158,11,0.08)]">
              {info}
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 hover:!text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={authLoading}
          >
            {authLoading ? <Loader label="Signing in..." /> : "Login"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Need an account?{" "}
          <Link to="/signup" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
