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
    const hasBrowserHost = Boolean(browserHostname);
    const browserIsLocal = ['localhost', '127.0.0.1'].includes(browserHostname);
    const configuredIsLocal = ['localhost', '127.0.0.1'].includes(url.hostname);

    if (hasBrowserHost && browserIsLocal) {
      url.hostname = 'localhost';
    } else if (hasBrowserHost && !browserIsLocal && (configuredIsLocal || url.hostname !== browserHostname)) {
      url.hostname = browserHostname;
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
