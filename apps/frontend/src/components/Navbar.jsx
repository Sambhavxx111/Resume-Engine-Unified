import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const protectedLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/resume', label: 'Resume Builder' },
  { to: '/ats', label: 'ATS Analyzer' },
  { to: '/jd-match', label: 'JD Matcher' },
  { to: '/career-guidance', label: 'Career Guidance' },
];

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/65 backdrop-blur-2xl">
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex flex-shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/95 shadow-glow">
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
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">Resume Engine</p>
            <p className="text-sm text-slate-300">Resume Builder + ATS + Career Guidance</p>
          </div>
        </Link>

        <nav className="hidden items-center justify-center gap-2 px-6 md:flex">
          {isAuthenticated &&
            protectedLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-400/20 to-blue-500/20 text-white shadow-[0_12px_24px_rgba(34,211,238,0.14)]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
        </nav>

        <div className="flex flex-shrink-0 items-center justify-end gap-3 justify-self-end">
          {isAuthenticated ? (
            <button type="button" className="button-secondary" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="button-secondary">Login</Link>
              <Link to="/signup" className="button-primary hidden sm:inline-flex">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
