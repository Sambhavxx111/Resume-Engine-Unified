import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { signup, authLoading } = useAuth();
  const [formState, setFormState] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    try {
      await signup(formState);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      if (!requestError.response) {
        setError(
          "Cannot reach the backend right now. Make sure the API server is running and reachable.",
        );
        return;
      }

      const apiMessage =
        requestError.response?.data?.message ||
        requestError.response?.data?.error ||
        "Unable to create account. Please try again.";

      if (requestError.response?.status === 409) {
        setInfo("Account already found. Redirecting to login...");
        setTimeout(() => {
          navigate("/login", {
            replace: true,
            state: { email: formState.email, fromSignupDuplicate: true },
          });
        }, 1200);
        return;
      }

      setError(apiMessage);
    }
  };

  return (
    <main className="page-shell flex min-h-[calc(100vh-96px)] items-center justify-center">
      <div className="glass-card w-full max-w-lg p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">New Account</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Create your resume workspace</h1>
        <p className="mt-3 text-sm text-slate-300">
          Set up your account to start building resumes, checking ATS scores, and optimizing faster.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <input className="field" type="text" name="name" placeholder="Full name" value={formState.name} onChange={handleChange} required />
          <input className="field" type="email" name="email" placeholder="Email address" value={formState.email} onChange={handleChange} required />
          <input className="field" type="password" name="password" placeholder="Password" minLength={6} value={formState.password} onChange={handleChange} required />

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {info}
            </div>
          ) : null}

          <button type="submit" className="button-primary w-full" disabled={authLoading}>
            {authLoading ? <Loader label="Creating account..." /> : "Signup"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Signup;
