import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader";
import PasswordField from "../components/PasswordField";
import { getApiBaseUrl } from "../api/baseUrl";
import { API } from "../api/services";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setFormState((prev) => ({ ...prev, email: location.state.email }));
    }

    const oauthStatus = searchParams.get("oauth");
    if (oauthStatus === "google_failed") {
      setError("Google login could not be completed. Please try again.");
      return;
    }
    if (oauthStatus === "google_config_error") {
      setError("Google login is not configured yet.");
      return;
    }
    if (oauthStatus === "google_unverified") {
      setError("Google did not confirm this email address. Please use another Google account.");
      return;
    }

    if (location.state?.fromSignupDuplicate) {
      setInfo("This email is already registered. Please log in instead.");
      return;
    }

    if (location.state?.authPrompt) {
      setInfo(location.state.authPrompt);
    }
  }, [location.state, searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = () => {
    const baseURL = getApiBaseUrl();
    window.location.href = `${baseURL}${API.googleLogin}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      await login(formState);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (requestError) {
      if (!requestError.response) {
        setError("Cannot reach the backend right now. Make sure the API server is running and reachable.");
        return;
      }

      const apiMessage =
        requestError.response?.data?.message ||
        requestError.response?.data?.error ||
        "Unable to sign in. Please try again.";

      if (requestError.response?.data?.requiresEmailVerification) {
        navigate("/verify-email", {
          replace: true,
          state: { email: requestError.response.data.email || formState.email, message: apiMessage },
        });
        return;
      }

      setError(apiMessage);
    } finally {
      setSubmitting(false);
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

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="inline-flex w-full items-center justify-center gap-3 rounded-[18px] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition hover:bg-slate-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base font-bold text-blue-600">G</span>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>

        <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
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
            disabled={submitting}
          >
            {submitting ? <Loader label="Signing in..." /> : "Login"}
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
