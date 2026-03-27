const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export function getCareerServiceBaseUrl() {
  const configuredUrl = import.meta.env.VITE_CAREER_SERVICE_URL?.trim();
  const browserHostname =
    typeof window !== 'undefined' ? window.location.hostname?.trim() : '';

  if (!configuredUrl) {
    return browserHostname ? `http://${browserHostname}:8000` : 'http://localhost:8000';
  }

  try {
    const url = new URL(configuredUrl);
    const browserIsLocal = ['localhost', '127.0.0.1'].includes(browserHostname);
    const configuredIsLocal = ['localhost', '127.0.0.1'].includes(url.hostname);

    // Only normalize localhost variants in local development. In production,
    // preserve the configured external service hostname.
    if (browserIsLocal && configuredIsLocal) {
      url.hostname = 'localhost';
    }

    return trimTrailingSlash(url.toString());
  } catch {
    return trimTrailingSlash(configuredUrl);
  }
}

export const CAREER_API = {
  uploadResume: '/api/resume/upload',
  matchJobs: '/api/jobs/match',
  chat: '/api/chatbot/query',
  chatStructured: '/api/chatbot/query-structured',
};
