import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="page-shell">
      <section className="hero-panel panel-grid mx-auto max-w-3xl p-6 text-center sm:p-10">
        <div className="chrome-line" />
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Page not found</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-5xl">
          This page is not available
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
          The link may be old, mistyped, or moved. You can go back to the dashboard and continue from there.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/dashboard" className="button-primary">
            Go to Dashboard
          </Link>
          <Link to="/" className="button-secondary">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default NotFound;
