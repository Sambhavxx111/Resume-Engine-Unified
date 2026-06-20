const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export function getCareerServiceBaseUrl() {
  const configuredUrl = import.meta.env.VITE_CAREER_SERVICE_URL?.trim();
  const browserHostname =
    typeof window !== 'undefined' ? window.location.hostname?.trim() : '';
  const browserIsLocal = ['localhost', '127.0.0.1'].includes(browserHostname);

  if (!configuredUrl) {
    if (browserIsLocal || !browserHostname) {
      return 'http://localhost:8000';
    }

    if (typeof console !== 'undefined') {
      console.warn('VITE_CAREER_SERVICE_URL is not set. Career service requests require a configured production URL.');
    }
    return '';
  }

  try {
    const url = new URL(configuredUrl);
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
  chatRich: '/api/chatbot/query-rich',
  chatStructured: '/api/chatbot/query-structured',
};
