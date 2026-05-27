import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Loader from './components/Loader';
import Navbar from './components/Navbar';

const ATSAnalysis = lazy(() => import('./pages/ATSAnalysis'));
const CareerGuidance = lazy(() => import('./pages/CareerGuidance'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const JDMatcher = lazy(() => import('./pages/JDMatcher'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

function App() {
  const location = useLocation();
  const pageToneClass = (() => {
    if (location.pathname === "/resume") return "tone-resume";
    if (location.pathname === "/ats") return "tone-ats";
    if (location.pathname === "/jd-match") return "tone-jd";
    if (location.pathname === "/career-guidance") return "tone-career";
    if (location.pathname === "/dashboard") return "tone-dashboard";
    if (
      location.pathname === "/login" ||
      location.pathname === "/signup" ||
      location.pathname === "/verify-email" ||
      location.pathname === "/reset-password"
    ) return "tone-auth";
    return "tone-landing";
  })();

  return (
    <div className={`app-shell ${pageToneClass} min-h-screen bg-slate-50 text-slate-900`}>
      <div className="page-vibe page-vibe-primary" />
      <div className="page-vibe page-vibe-secondary" />
      <div className="page-vibe page-vibe-tertiary" />
      <Navbar />
      <div key={location.pathname} className="route-stage">
        <Suspense
          fallback={
            <main className="page-shell">
              <div className="glass-card flex min-h-[280px] items-center justify-center p-8">
                <Loader label="Loading page..." />
              </div>
            </main>
          }
        >
          <Routes location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resume" element={<ResumeBuilder />} />
            <Route path="/ats" element={<ATSAnalysis />} />
            <Route path="/jd-match" element={<JDMatcher />} />
            <Route path="/career-guidance" element={<CareerGuidance />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default App;
