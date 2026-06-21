const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");

export function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const browserHostname =
    typeof window !== "undefined" ? window.location.hostname?.trim() : "";
  const browserIsLocal = ["localhost", "127.0.0.1"].includes(browserHostname);

  if (!browserIsLocal && browserHostname) {
    // Production uses the Vercel same-origin /api proxy so auth cookies are
    // first-party on mobile and browsers that block third-party cookies.
    return "";
  }

  if (!configuredUrl) {
    return "http://localhost:3000";
  }

  try {
    const url = new URL(configuredUrl);
    const configuredIsLocal = ["localhost", "127.0.0.1"].includes(url.hostname);

    if (browserIsLocal && configuredIsLocal) {
      url.hostname = "localhost";
    }

    return trimTrailingSlash(url.toString());
  } catch {
    return trimTrailingSlash(configuredUrl);
  }
}
