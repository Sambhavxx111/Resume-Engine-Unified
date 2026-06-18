const routeLoaders = {
  "/": () => import("../pages/Landing"),
  "/dashboard": () => import("../pages/Dashboard"),
  "/resume": () => import("../pages/ResumeBuilder"),
  "/ats": () => import("../pages/ATSAnalysis"),
  "/jd-match": () => import("../pages/JDMatcher"),
  "/career-guidance": () => import("../pages/CareerGuidance"),
  "/login": () => import("../pages/Login"),
  "/signup": () => import("../pages/Signup"),
};

const loadedRoutes = new Set();

export function preloadRoute(path) {
  const loader = routeLoaders[path];
  if (!loader || loadedRoutes.has(path)) return;

  loadedRoutes.add(path);
  loader().catch(() => {
    loadedRoutes.delete(path);
  });
}

export function preloadPrimaryRoutes() {
  const run = () => {
    ["/dashboard", "/resume", "/ats"].forEach(preloadRoute);
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 2500 });
    return;
  }

  window.setTimeout(run, 1200);
}
