const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const browserHostname =
    typeof window !== "undefined" ? window.location.hostname?.trim() : "";

  if (!configuredUrl) {
    return browserHostname ? `http://${browserHostname}:3000` : "http://localhost:3000";
  }

  try {
    const url = new URL(configuredUrl);
    const browserIsLocal = ["localhost", "127.0.0.1"].includes(browserHostname);
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
