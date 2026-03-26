const { callGeminiWithTimeout } = require('../config/gemini');

// Common stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'can', 'that', 'this', 'it', 'its', 'you', 'we', 'i',
  'our', 'your', 'their', 'what', 'which', 'who', 'when', 'where', 'why',
  'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'no', 'not',
  'only', 'same', 'so', 'than', 'too', 'very', 'as', 'if', 'also', 'as',
  'job', 'position', 'role', 'team', 'company', 'work', 'working', 'works'
]);

const JD_MATCH_PROMPT = (resumeJson, jobDescription) => `
Compare the following resume against the provided job description and return a concise ATS-style match analysis.

Resume:
${JSON.stringify(resumeJson)}

Job Description:
${JSON.stringify(jobDescription)}

Return ONLY valid JSON in this exact structure:
{
  "matchScore": 0,
  "matchPercentage": "0%",
  "matchedKeywords": [],
  "missingKeywords": [],
  "criticalMissingKeywords": [],
  "summary": {
    "matched": 0,
    "total": 0,
    "matchedKeywordsList": "",
    "resumeSkillsCount": 0,
    "jdRequiredCount": 0
  }
}

Rules:
- matchScore must be a number from 0 to 100.
- matchPercentage must match matchScore.
- All keyword arrays must contain strings only.
- criticalMissingKeywords should be the top missing keywords, max 5.
`;

const parseGeminiJson = (text) => {
  const jsonMatch = String(text || '').match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : text);
};

const normalizePercentage = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric * 100) / 100));
};

const normalizeKeywordArray = (value, limit = Infinity) =>
  (Array.isArray(value) ? value : [])
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim())
    .slice(0, limit);

// Extract text from JSON object
const extractText = (data) => {
  let text = '';
  if (typeof data === 'object' && data !== null) {
    Object.values(data).forEach(value => {
      if (typeof value === 'string') {
        text += ' ' + value;
      } else if (Array.isArray(value)) {
        text += ' ' + value.join(' ');
      } else if (typeof value === 'object') {
        text += ' ' + extractText(value);
      }
    });
  } else if (typeof data === 'string') {
    text = data;
  }
  return text.toLowerCase();
};

// Extract keywords from text
const extractKeywords = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Extract words and tech terms
  const words = text.match(/\b[a-z+#.\-]{2,}\b/gi) || [];
  
  // Filter out stop words and short words
  const keywords = words.filter(word => 
    !STOP_WORDS.has(word.toLowerCase()) &&
    word.length > 2
  );

  // Count frequency and return top keywords
  const frequency = {};
  keywords.forEach(keyword => {
    const lower = keyword.toLowerCase();
    frequency[lower] = (frequency[lower] || 0) + 1;
  });

  // Sort by frequency and get top 30 unique keywords
  const sortedKeywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([keyword]) => keyword);

  return sortedKeywords;
};

// Calculate keyword overlap and matching
const calculateMatchScore = (jdKeywords, resumeKeywords) => {
  const jdSet = new Set(jdKeywords);
  const resumeSet = new Set(resumeKeywords);

  // Find matched keywords
  const matchedKeywords = jdKeywords.filter(keyword => 
    resumeKeywords.includes(keyword)
  );

  // Find missing keywords (in JD but not in resume)
  const missingKeywords = jdKeywords.filter(keyword => 
    !resumeKeywords.includes(keyword)
  );

  // Calculate match score as percentage
  const matchScore = (matchedKeywords.length / jdKeywords.length) * 100;

  return {
    matchScore: Math.round(matchScore * 100) / 100,
    matchedKeywords,
    missingKeywords,
    matchedCount: matchedKeywords.length,
    totalJDKeywords: jdKeywords.length
  };
};

// Main function
const matchResumeWithJDFallback = (resumeJson, jobDescription) => {
  try {
    if (!resumeJson || !jobDescription) {
      throw new Error('Resume and job description are required');
    }

    // Extract text from both
    const resumeText = extractText(resumeJson);
    const jdText = extractText(jobDescription);

    if (!resumeText || !jdText) {
      throw new Error('Unable to extract text from resume or job description');
    }

    // Extract keywords
    const jdKeywords = extractKeywords(jdText);
    const resumeKeywords = extractKeywords(resumeText);

    if (jdKeywords.length === 0) {
      throw new Error('No keywords extracted from job description');
    }

    // Calculate match
    const matchData = calculateMatchScore(jdKeywords, resumeKeywords);

    // Categorize keywords by importance (based on presence in resume)
    const criticalMissing = matchData.missingKeywords.slice(0, 5); // Top 5 missing

    return {
      matchScore: matchData.matchScore,
      matchPercentage: `${matchData.matchScore}%`,
      matchedKeywords: matchData.matchedKeywords,
      missingKeywords: matchData.missingKeywords,
      criticalMissingKeywords: criticalMissing,
      summary: {
        matched: matchData.matchedCount,
        total: matchData.totalJDKeywords,
        matchedKeywordsList: matchData.matchedKeywords.join(', '),
        resumeSkillsCount: resumeKeywords.length,
        jdRequiredCount: jdKeywords.length
      }
    };
  } catch (error) {
    console.error('JD Matching error:', error.message);
    throw new Error(`Error matching resume with job description: ${error.message}`);
  }
};

const matchResumeWithJD = async (resumeJson, jobDescription) => {
  try {
    if (!resumeJson || !jobDescription) {
      throw new Error('Resume and job description are required');
    }

    const rawText = await callGeminiWithTimeout(JD_MATCH_PROMPT(resumeJson, jobDescription), {
      timeoutMs: 25000,
      retries: 2,
    });
    const parsed = parseGeminiJson(rawText);
    const matchScore = normalizePercentage(parsed.matchScore);
    const matchedKeywords = normalizeKeywordArray(parsed.matchedKeywords);
    const missingKeywords = normalizeKeywordArray(parsed.missingKeywords);
    const criticalMissingKeywords = normalizeKeywordArray(
      parsed.criticalMissingKeywords?.length ? parsed.criticalMissingKeywords : missingKeywords,
      5,
    );

    return {
      matchScore,
      matchPercentage: `${matchScore}%`,
      matchedKeywords,
      missingKeywords,
      criticalMissingKeywords,
      summary: {
        matched: Number(parsed.summary?.matched) || matchedKeywords.length,
        total: Number(parsed.summary?.total) || (matchedKeywords.length + missingKeywords.length),
        matchedKeywordsList:
          typeof parsed.summary?.matchedKeywordsList === 'string'
            ? parsed.summary.matchedKeywordsList
            : matchedKeywords.join(', '),
        resumeSkillsCount: Number(parsed.summary?.resumeSkillsCount) || extractKeywords(extractText(resumeJson)).length,
        jdRequiredCount: Number(parsed.summary?.jdRequiredCount) || (matchedKeywords.length + missingKeywords.length),
      }
    };
  } catch (error) {
    console.error('JD Matching error, falling back to local matching:', error.message);
    return matchResumeWithJDFallback(resumeJson, jobDescription);
  }
};

module.exports = {
  matchResumeWithJD,
  matchResumeWithJDFallback,
  extractKeywords,
  extractText
};
