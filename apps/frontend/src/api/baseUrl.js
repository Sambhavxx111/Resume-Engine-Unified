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
    const hasBrowserHost = Boolean(browserHostname);
    const browserIsLocal = ["localhost", "127.0.0.1"].includes(browserHostname);
    const configuredIsLocal = ["localhost", "127.0.0.1"].includes(url.hostname);

    if (hasBrowserHost && browserIsLocal) {
      url.hostname = "localhost";
    } else if (
      hasBrowserHost &&
      !browserIsLocal &&
      (configuredIsLocal || url.hostname !== browserHostname)
    ) {
      url.hostname = browserHostname;
    }

    return trimTrailingSlash(url.toString());
  } catch {
    return trimTrailingSlash(configuredUrl);
  }
}
