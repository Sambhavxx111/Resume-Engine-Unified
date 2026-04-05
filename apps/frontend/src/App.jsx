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
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const Signup = lazy(() => import('./pages/Signup'));

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
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
