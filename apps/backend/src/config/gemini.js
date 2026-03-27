require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// IMPORTANT: new SDK requires models/ prefix
const MODEL_NAME = process.env.GEMINI_MODEL || "models/gemini-1.5-flash";
const jdMatcherApiKey = process.env.GEMINI_API_KEY_JD_MATCHER;

function resolveApiKey(apiKeyOverride) {
  const resolvedApiKey = apiKeyOverride || process.env.GEMINI_API_KEY;

  if (!resolvedApiKey) {
    throw new Error("GEMINI_API_KEY is missing in .env");
  }

  return resolvedApiKey;
}

async function callGeminiWithTimeout(prompt, options = {}) {
  if (!prompt) throw new Error("Prompt is required");

  const {
    timeoutMs = 15000,
    retries = 2,
    apiKey,
  } = typeof options === "number" ? { timeoutMs: options } : options;

  const genAI = new GoogleGenerativeAI(resolveApiKey(apiKey));
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
  });

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini timeout after ${timeoutMs}ms`)), timeoutMs),
        ),
      ]);
      const response = await result.response;

      if (!response) throw new Error("Empty Gemini response");

      return response.text();
    } catch (error) {
      const isRetryable = error?.status === 503 || error?.status === 429;

      if (isRetryable && attempt < retries - 1) {
        console.log(`Gemini busy. Retrying... (${attempt + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
      } else {
        console.error("Gemini Error:");
        console.error(error);
        throw error;
      }
    }
  }
}

module.exports = {
  callGeminiWithTimeout,
  jdMatcherApiKey,
};
