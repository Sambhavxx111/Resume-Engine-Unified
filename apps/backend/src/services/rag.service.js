const DEFAULT_RAG_JOB_DESCRIPTION = `
General ATS benchmark for a modern software or professional resume. Prioritize clear contact details,
target role alignment, relevant skills, measurable achievements, project or experience evidence,
education, readable section headings, action verbs, keyword coverage, and ATS-friendly formatting.
`;

const isPrivateHostname = (hostname = '') =>
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|::1$)/i.test(hostname);

const resolveRagBaseUrl = () => {
  const baseUrl = String(process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8010/api/v1').replace(/\/+$/, '');
  const parsed = new URL(baseUrl);
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && parsed.protocol !== 'https:') {
    throw new Error('RAG_SERVICE_URL must use HTTPS in production.');
  }

  if (isProduction && isPrivateHostname(parsed.hostname)) {
    throw new Error('RAG_SERVICE_URL cannot point to a private host in production.');
  }

  return baseUrl;
};

const getRagBaseUrl = () => resolveRagBaseUrl();

const buildPayload = ({ resumeText, parsedResume, jobDescription, role, indexResume = false }) => ({
  resume_text: resumeText || undefined,
  parsed_resume: parsedResume || undefined,
  job_description: String(jobDescription || '').trim() || DEFAULT_RAG_JOB_DESCRIPTION.trim(),
  role: role || undefined,
  index_resume: Boolean(indexResume),
});

const postToRag = async (path, payload) => {
  if (typeof fetch !== 'function') {
    throw new Error('Node fetch API is unavailable for RAG service calls.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.RAG_SERVICE_TIMEOUT_MS || 9000));

  try {
    const response = await fetch(`${getRagBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.detail || data.error || `RAG service returned ${response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
};

const analyzeResumeWithRag = async ({ resumeText, parsedResume, jobDescription, role }) =>
  postToRag('/analyze', buildPayload({ resumeText, parsedResume, jobDescription, role, indexResume: true }));

const optimizeResumeWithRag = async ({ resumeText, parsedResume, jobDescription, role }) =>
  postToRag('/optimize', buildPayload({ resumeText, parsedResume, jobDescription, role, indexResume: false }));

module.exports = {
  DEFAULT_RAG_JOB_DESCRIPTION,
  analyzeResumeWithRag,
  optimizeResumeWithRag,
};
