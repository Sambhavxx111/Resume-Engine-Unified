import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const protectedLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/resume', label: 'Resume Builder' },
  { to: '/ats', label: 'ATS Analyzer' },
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-300/20 to-blue-500/20 shadow-glow">
            <span className="text-lg font-bold text-cyan-300">RB</span>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">Resume Engine</p>
            <p className="text-sm text-slate-300">Resume Builder + ATS + Career Guidance</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
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

        <div className="flex items-center gap-3">
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
