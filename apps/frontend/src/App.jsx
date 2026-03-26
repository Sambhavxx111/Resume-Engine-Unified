import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

const ATSAnalysis = lazy(() => import('./pages/ATSAnalysis'));
const CareerGuidance = lazy(() => import('./pages/CareerGuidance'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
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
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
            <Route path="/ats" element={<ProtectedRoute><ATSAnalysis /></ProtectedRoute>} />
            <Route path="/jd-match" element={<Navigate to="/career-guidance" replace />} />
            <Route path="/career-guidance" element={<ProtectedRoute><CareerGuidance /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default App;
