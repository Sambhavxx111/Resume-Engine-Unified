import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/resume', label: 'Resume Builder' },
  { to: '/ats', label: 'ATS Analyzer' },
  { to: '/jd-match', label: 'JD Matcher' },
  { to: '/career-guidance', label: 'Career Guidance' },
];

function Navbar() {
  const { isAuthenticated, authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showGuestNotice, setShowGuestNotice] = useState(false);
  const [guestModeActive, setGuestModeActive] = useState(false);
  const isCareerGuidance = location.pathname === "/career-guidance";
  const useDarkCareerNavbar = isCareerGuidance && isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 72);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    setShowGuestNotice(Boolean(location.state?.guestModeNotice));
    setGuestModeActive(Boolean(location.state?.guestModeNotice));
  }, [location.pathname, location.state]);

  const handleLogout = () => {
    logout();
    navigate('/dashboard');
  };

  const handleGuestAccess = () => {
    if (location.pathname === '/dashboard') {
      setShowGuestNotice((current) => !current);
      setGuestModeActive(true);
      return;
    }

    navigate('/dashboard', { state: { guestModeNotice: true } });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-2 pt-3 sm:px-6 sm:pt-4 lg:px-8">
      <div
        className={`nav-shell mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[22px] px-3 py-3 backdrop-blur-2xl sm:grid-cols-[auto_1fr_auto] sm:gap-4 sm:rounded-[26px] sm:px-6 ${
          useDarkCareerNavbar
            ? "border border-slate-600/70 bg-slate-900/82 shadow-[0_20px_60px_rgba(2,6,23,0.42)]"
            : "border border-slate-200/90 bg-white/82 shadow-[0_20px_60px_rgba(148,163,184,0.15)]"
        }`}
      >
        <Link to="/" className="flex min-w-0 flex-shrink items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-slate-900 shadow-sm transition duration-200 hover:scale-[1.03] sm:h-11 sm:w-11">
            <svg viewBox="0 0 64 64" className="h-8 w-8 drop-shadow-[0_6px_16px_rgba(34,211,238,0.18)]" aria-hidden="true">
              <defs>
                <linearGradient id="resume-engine-gear" x1="12%" y1="12%" x2="88%" y2="88%">
                  <stop offset="0%" stopColor="#2e516d" />
                  <stop offset="45%" stopColor="#4c6f91" />
                  <stop offset="100%" stopColor="#9caec0" />
                </linearGradient>
                <linearGradient id="resume-engine-r" x1="18%" y1="12%" x2="86%" y2="88%">
                  <stop offset="0%" stopColor="#1bc4ff" />
                  <stop offset="100%" stopColor="#09a7e2" />
                </linearGradient>
              </defs>
              <g transform="translate(32 32)">
                <path
                  d="M0-25.5 L4.2-25.5 L5.1-20.5 A16.5 16.5 0 0 1 9.6-18.6 L13.8-21.7 L16.9-18.6 L13.8-14.3 A16.5 16.5 0 0 1 15.7-9.8 L20.7-8.8 L20.7-4.6 L15.7-3.6 A16.5 16.5 0 0 1 13.8 0.9 L16.9 5.1 L13.8 8.2 L9.6 5.2 A16.5 16.5 0 0 1 5.1 7 L4.2 12.1 L0 12.1 L-1 7 A16.5 16.5 0 0 1 -5.4 5.2 L-9.7 8.2 L-12.7 5.1 L-9.7 0.9 A16.5 16.5 0 0 1 -11.5 -3.6 L-16.5 -4.6 L-16.5 -8.8 L-11.5 -9.8 A16.5 16.5 0 0 1 -9.7 -14.3 L-12.7 -18.6 L-9.7 -21.7 L-5.4 -18.6 A16.5 16.5 0 0 1 -1 -20.5 Z"
                  fill="none"
                  stroke="url(#resume-engine-gear)"
                  strokeWidth="5.8"
                  strokeLinejoin="round"
                />
                <circle r="17.5" fill="#0b1722" />
                <path
                  d="M-7.8 -9.2 H3.9 C9 -9.2 12.2 -6.2 12.2 -1.4 C12.2 3.2 9.3 6.1 4.5 6.4 L11.8 14 H5.5 L-0.7 7.3 H-7.8 V16.6 H-13.2 V2.4 H2.6 C5.1 2.4 6.8 0.9 6.8 -1.3 C6.8 -3.6 5.1 -5 2.5 -5 H-7.8 Z"
                  fill="url(#resume-engine-r)"
                />
              </g>
            </svg>
          </div>
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${useDarkCareerNavbar ? "text-slate-400" : "text-slate-500"}`}>Resume Engine</p>
            <p className={`truncate text-xs font-bold sm:text-sm ${useDarkCareerNavbar ? "text-white" : "text-slate-900"}`}>Resume Builder + ATS + Career Guidance</p>
          </div>
        </Link>

        <nav className="hidden items-center justify-center gap-2 px-6 md:flex">
          {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-[14px] font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : useDarkCareerNavbar
                        ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
        </nav>

        <div className="relative flex min-w-0 flex-shrink-0 items-center justify-end gap-2 justify-self-end sm:gap-3">
          {authLoading ? (
            <div className={`h-11 w-[8.5rem] rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] ${useDarkCareerNavbar ? "border-slate-700 bg-slate-950/70" : "border-slate-200 bg-white/70"}`} />
          ) : isAuthenticated ? (
            <button type="button" className="button-secondary" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGuestAccess}
                aria-expanded={showGuestNotice}
                aria-controls="guest-mode-notice"
                className={`rounded-full px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] transition sm:text-xs sm:tracking-[0.2em] ${
                  guestModeActive
                    ? useDarkCareerNavbar
                      ? "border border-cyan-400/70 bg-cyan-400/20 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                      : "border border-cyan-200 bg-cyan-50 text-cyan-700 shadow-[0_10px_25px_rgba(34,211,238,0.16)]"
                    : useDarkCareerNavbar
                      ? "border border-slate-600 bg-slate-800/90 text-slate-300 hover:bg-slate-800"
                      : "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span className="hidden sm:inline">Continue as Guest</span>
                <span className="sm:hidden">Guest</span>
              </button>
              <Link
                to="/login"
                className={`inline-flex items-center justify-center rounded-[18px] border px-4 py-2 text-sm font-semibold shadow-[0_14px_26px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 ${
                  useDarkCareerNavbar
                    ? "border-white/15 bg-white/10 !text-white [color:#ffffff] hover:bg-white/15"
                    : "border-slate-200 bg-white !text-slate-700 [color:#334155] hover:bg-slate-50"
                }`}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="hidden items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold !text-white [color:#ffffff] shadow-[0_16px_30px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800 hover:!text-white sm:inline-flex"
              >
                Get Started
              </Link>
              {showGuestNotice ? (
                <div
                  id="guest-mode-notice"
                  className={`absolute right-0 top-[calc(100%+0.75rem)] w-[min(22rem,calc(100vw-2rem))] rounded-[24px] border p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)] ${
                    useDarkCareerNavbar
                      ? "border-slate-700 bg-slate-900/95 text-slate-100"
                      : "border-slate-200 bg-white/95 text-slate-900"
                  }`}
                >
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                    useDarkCareerNavbar ? "text-slate-400" : "text-slate-500"
                  }`}>
                    Guest Access
                  </p>
                  <button
                    type="button"
                    aria-label="Close guest access notice"
                    onClick={() => setShowGuestNotice(false)}
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border transition ${
                      useDarkCareerNavbar
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12" />
                      <path d="M18 6 6 18" />
                    </svg>
                  </button>
                  <p className={`mt-2 text-sm leading-6 ${
                    useDarkCareerNavbar ? "text-slate-200" : "text-slate-600"
                  }`}>
                    Guest mode is temporary. You can try public upload tools in this browser session, but drafts, saved resumes, history, and gated analysis require signup or login.
                  </p>
                  <div className={`mt-3 space-y-1 rounded-[18px] border px-3 py-3 text-xs leading-5 ${
                    useDarkCareerNavbar
                      ? "border-slate-700 bg-slate-950/40 text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}>
                    <p>Temporary: uploads and unsaved edits.</p>
                    <p>Saved after login: resume drafts, account workspace, and protected analysis.</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link to="/login" className="button-primary">
                      Login
                    </Link>
                    <Link to="/signup" className="button-secondary">
                      Register
                    </Link>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
