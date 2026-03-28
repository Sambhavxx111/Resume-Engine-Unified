const TAG_PATTERN = /<[^>]*>/g;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const sanitizeString = (value) =>
  String(value ?? "")
    .replace(TAG_PATTERN, " ")
    .replace(CONTROL_CHAR_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();

const sanitizeResumePayload = (value) => {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeResumePayload(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeResumePayload(nestedValue)]),
    );
  }

  return value;
};

module.exports = {
  sanitizeResumePayload,
};
