const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");

export function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const browserHostname =
    typeof window !== "undefined" ? window.location.hostname?.trim() : "";
  const browserIsLocal = ["localhost", "127.0.0.1"].includes(browserHostname);

  if (!configuredUrl) {
    // In local development we default to the Node API on port 3000.
    // In production the API base URL must be provided explicitly via env.
    if (!browserIsLocal && browserHostname && typeof console !== "undefined") {
      console.warn("VITE_API_BASE_URL is not set. API requests will use same-origin URLs.");
    }
    return browserIsLocal || !browserHostname ? "http://localhost:3000" : "";
  }

  try {
    const url = new URL(configuredUrl);
    const configuredIsLocal = ["localhost", "127.0.0.1"].includes(url.hostname);

    // Only rewrite the hostname during local development so a shared env value
    // like http://127.0.0.1:3000 still works from localhost in the browser.
    if (browserIsLocal && configuredIsLocal) {
      url.hostname = "localhost";
    }

    return trimTrailingSlash(url.toString());
  } catch {
    return trimTrailingSlash(configuredUrl);
  }
}
