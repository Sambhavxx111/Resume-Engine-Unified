const { callGeminiWithTimeout } = require('../config/gemini');

// Common action verbs to look for
const ACTION_VERBS = [
  'developed', 'designed', 'implemented', 'created', 'built', 'managed',
  'led', 'coordinated', 'improved', 'optimized', 'increased', 'decreased',
  'established', 'enhanced', 'accelerated', 'achieved', 'accomplished',
  'transformed', 'spearheaded', 'pioneered', 'engineered', 'deployed'
];

// Common keywords in tech/business resumes
const COMMON_KEYWORDS = [
  'project', 'team', 'communication', 'problem-solving', 'analysis',
  'planning', 'execution', 'leadership', 'innovation', 'collaboration'
];

const ATS_ANALYSIS_PROMPT = (resumeJson, jobDescription) => `
Analyze the following resume for ATS scoring.
${jobDescription ? `Also consider this job description: ${JSON.stringify(jobDescription)}` : 'No job description was provided.'}

Resume JSON:
${JSON.stringify(resumeJson)}

Return ONLY valid JSON with this exact structure:
{
  "totalScore": 0,
  "breakdown": {
    "keywordMatch": { "score": 0, "weight": "30%", "matched": 0, "total": 0 },
    "quantifiedAchievements": { "score": 0, "weight": "20%", "count": 0 },
    "sectionCompleteness": { "score": 0, "weight": "20%", "completeSections": 0, "totalSections": 3 },
    "actionVerbs": { "score": 0, "weight": "15%", "count": 0 },
    "formatCompliance": { "score": 0, "weight": "15%", "issues": [] }
  },
  "missingKeywords": [],
  "missingSections": []
}

Rules:
- totalScore and all score values must be numbers from 0 to 100.
- missingKeywords and missingSections must be arrays of strings.
- Keep the breakdown internally consistent with the total score.
`;

const parseGeminiJson = (text) => {
  const jsonMatch = String(text || '').match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : text);
};

const sanitizeScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric * 100) / 100));
};

const normalizeAtsResponse = (result = {}) => ({
  totalScore: sanitizeScore(result.totalScore),
  breakdown: {
    keywordMatch: {
      score: sanitizeScore(result.breakdown?.keywordMatch?.score),
      weight: '30%',
      matched: Number(result.breakdown?.keywordMatch?.matched) || 0,
      total: Number(result.breakdown?.keywordMatch?.total) || 0,
    },
    quantifiedAchievements: {
      score: sanitizeScore(result.breakdown?.quantifiedAchievements?.score),
      weight: '20%',
      count: Number(result.breakdown?.quantifiedAchievements?.count) || 0,
    },
    sectionCompleteness: {
      score: sanitizeScore(result.breakdown?.sectionCompleteness?.score),
      weight: '20%',
      completeSections: Number(result.breakdown?.sectionCompleteness?.completeSections) || 0,
      totalSections: Number(result.breakdown?.sectionCompleteness?.totalSections) || 3,
    },
    actionVerbs: {
      score: sanitizeScore(result.breakdown?.actionVerbs?.score),
      weight: '15%',
      count: Number(result.breakdown?.actionVerbs?.count) || 0,
    },
    formatCompliance: {
      score: sanitizeScore(result.breakdown?.formatCompliance?.score),
      weight: '15%',
      issues: Array.isArray(result.breakdown?.formatCompliance?.issues)
        ? result.breakdown.formatCompliance.issues.filter((issue) => typeof issue === 'string')
        : [],
    },
  },
  missingKeywords: Array.isArray(result.missingKeywords)
    ? result.missingKeywords.filter((keyword) => typeof keyword === 'string')
    : [],
  missingSections: Array.isArray(result.missingSections)
    ? result.missingSections.filter((section) => typeof section === 'string')
    : [],
});

// Extract all text from resume JSON
const extractText = (resumeJson) => {
  if (typeof resumeJson === 'string') {
    return resumeJson.toLowerCase();
  }

  if (Array.isArray(resumeJson)) {
    return resumeJson.map((value) => extractText(value)).join(' ').toLowerCase();
  }

  let text = '';
  if (typeof resumeJson === 'object' && resumeJson !== null) {
    Object.values(resumeJson).forEach(value => {
      if (typeof value === 'string') {
        text += ' ' + value;
      } else if (Array.isArray(value)) {
        text += ' ' + value.map((item) => extractText(item)).join(' ');
      } else if (typeof value === 'object') {
        text += ' ' + extractText(value);
      }
    });
  }
  return text.toLowerCase();
};

// Check keyword match percentage
const calculateKeywordScore = (text, jobDescription) => {
  let keywordsToCheck = COMMON_KEYWORDS;
  let matchedCount = 0;

  // If job description provided, extract its keywords
  if (jobDescription) {
    const jdText = extractText(jobDescription);
    const words = jdText.match(/\b[\w.+#-]+\b/g) || [];
    keywordsToCheck = [...new Set(words.filter(Boolean))].slice(0, 20); // Top 20 unique words
  }

  if (!keywordsToCheck.length) {
    keywordsToCheck = COMMON_KEYWORDS;
  }

  keywordsToCheck.forEach(keyword => {
    if (text.includes(keyword)) {
      matchedCount++;
    }
  });

  const matchPercentage = (matchedCount / keywordsToCheck.length) * 100;
  return {
    score: Math.min(100, matchPercentage),
    matchedKeywords: matchedCount,
    totalKeywords: keywordsToCheck.length,
    missingKeywords: keywordsToCheck.filter(kw => !text.includes(kw))
  };
};

// Detect quantified achievements
const calculateQuantificationScore = (text) => {
  const patterns = [
    /\d+%/g,                    // Percentages
    /\$[\d,]+/g,                // Money
    /\d+(?:x|times)/g,          // Multipliers
    /\d+\s*(?:million|thousand|billion)/gi,  // Large numbers
    /\d{3,}/g,                  // Numbers with 3+ digits
  ];

  let totalMatches = 0;
  patterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    totalMatches += matches.length;
  });

  // Score based on number of quantified achievements
  // 0-2 = 40, 3-5 = 60, 6-10 = 80, 10+ = 100
  let score = Math.min(40, totalMatches * 10);
  if (totalMatches >= 3) score = 60;
  if (totalMatches >= 6) score = 80;
  if (totalMatches >= 10) score = 100;

  return {
    score,
    quantifiedAchievements: totalMatches
  };
};

// Check section completeness
const calculateSectionScore = (resumeJson) => {
  const requiredSections = ['experience', 'education', 'skills'];
  let completeSections = 0;

  requiredSections.forEach(section => {
    const hasSection = resumeJson[section] || 
                      resumeJson[section.toLowerCase()] ||
                      Object.keys(resumeJson).some(key => 
                        key.toLowerCase().includes(section));
    if (hasSection) {
      completeSections++;
    }
  });

  // Score: 33% per section
  const score = (completeSections / requiredSections.length) * 100;
  const missingSections = requiredSections.filter(section => {
    return !(resumeJson[section] || 
            resumeJson[section.toLowerCase()] ||
            Object.keys(resumeJson).some(key => 
              key.toLowerCase().includes(section)));
  });

  return {
    score,
    completeSections,
    totalSections: requiredSections.length,
    missingSections
  };
};

// Detect action verbs
const calculateActionVerbScore = (text) => {
  let verbCount = 0;

  ACTION_VERBS.forEach(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = text.match(regex) || [];
    verbCount += matches.length;
  });

  // Score: 0-2 verbs = 30, 3-5 = 60, 6-10 = 80, 10+ = 100
  let score = Math.min(30, verbCount * 15);
  if (verbCount >= 3) score = 60;
  if (verbCount >= 6) score = 80;
  if (verbCount >= 10) score = 100;

  return {
    score,
    actionVerbCount: verbCount
  };
};

// Check format compliance
const calculateFormatScore = (resumeJson) => {
  let score = 100;
  let issues = [];

  // Check if it's an object
  if (typeof resumeJson !== 'object' || resumeJson === null) {
    score -= 50;
    issues.push('Invalid format: not a JSON object');
  }

  // Check for key fields
  const hasRequiredFields = Object.keys(resumeJson).length > 0;
  if (!hasRequiredFields) {
    score -= 30;
    issues.push('Missing required fields');
  }

  // Check for empty values
  const text = extractText(resumeJson);
  if (text.trim().length < 50) {
    score -= 20;
    issues.push('Resume content too short');
  }

  return {
    score: Math.max(0, score),
    issues
  };
};

// Main function
const calculateATSScoreFallback = (resumeJson, jobDescription = null) => {
  try {
    if (!resumeJson || typeof resumeJson !== 'object') {
      throw new Error('Invalid resume format');
    }

    const text = extractText(resumeJson);

    // Calculate individual scores
    const keywordData = calculateKeywordScore(text, jobDescription);
    const quantData = calculateQuantificationScore(text);
    const sectionData = calculateSectionScore(resumeJson);
    const verbData = calculateActionVerbScore(text);
    const formatData = calculateFormatScore(resumeJson);

    // Calculate weighted total
    const weightedTotal = 
      (keywordData.score * 0.30) +
      (quantData.score * 0.20) +
      (sectionData.score * 0.20) +
      (verbData.score * 0.15) +
      (formatData.score * 0.15);

    const totalScore = Math.round(weightedTotal * 100) / 100;

    return {
      totalScore,
      breakdown: {
        keywordMatch: {
          score: Math.round(keywordData.score * 100) / 100,
          weight: '30%',
          matched: keywordData.matchedKeywords,
          total: keywordData.totalKeywords
        },
        quantifiedAchievements: {
          score: Math.round(quantData.score * 100) / 100,
          weight: '20%',
          count: quantData.quantifiedAchievements
        },
        sectionCompleteness: {
          score: Math.round(sectionData.score * 100) / 100,
          weight: '20%',
          completeSections: sectionData.completeSections,
          totalSections: sectionData.totalSections
        },
        actionVerbs: {
          score: Math.round(verbData.score * 100) / 100,
          weight: '15%',
          count: verbData.actionVerbCount
        },
        formatCompliance: {
          score: Math.round(formatData.score * 100) / 100,
          weight: '15%',
          issues: formatData.issues
        }
      },
      missingKeywords: keywordData.missingKeywords,
      missingSections: sectionData.missingSections
    };
  } catch (error) {
    console.error('ATS Score calculation error:', error.message);
    throw new Error(`Error calculating ATS score: ${error.message}`);
  }
};

const calculateATSScore = async (resumeJson, jobDescription = null) => {
  try {
    if (!resumeJson || typeof resumeJson !== 'object') {
      throw new Error('Invalid resume format');
    }

    const prompt = ATS_ANALYSIS_PROMPT(resumeJson, jobDescription);
    const rawText = await callGeminiWithTimeout(prompt, {
      timeoutMs: 25000,
      retries: 2,
    });
    const parsed = parseGeminiJson(rawText);
    return normalizeAtsResponse(parsed);
  } catch (error) {
    console.error('ATS Score calculation error:', error.message);
    throw new Error(`Error calculating ATS score: ${error.message}`);
  }
};

module.exports = {
  calculateATSScore,
  calculateATSScoreFallback,
};
