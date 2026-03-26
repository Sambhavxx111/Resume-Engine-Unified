// Strong action verbs for resume
const ACTION_VERBS = [
  'developed', 'built', 'optimized', 'implemented', 'designed', 'led',
  'improved', 'created', 'engineered', 'managed', 'coordinated', 'deployed',
  'established', 'enhanced', 'accelerated', 'achieved', 'spearheaded',
  'pioneered', 'transformed', 'increased', 'reduced', 'launched',
  'directed', 'supervised', 'executed', 'contributed', 'collaborated',
  'mentored', 'innovated', 'streamlined', 'maximized', 'minimized'
];

// Calculate keyword match percentage
const calculateKeywordMatch = (resumeKeywords, jdKeywords) => {
  try {
    // Validate inputs
    if (!Array.isArray(resumeKeywords) || !Array.isArray(jdKeywords)) {
      return 0;
    }

    if (jdKeywords.length === 0) {
      return 0;
    }

    // Convert to lowercase for comparison
    const resumeLower = resumeKeywords.map(k => k.toLowerCase());
    const jdLower = jdKeywords.map(k => k.toLowerCase());

    // Count matches
    let matchCount = 0;
    jdLower.forEach(keyword => {
      if (resumeLower.includes(keyword)) {
        matchCount++;
      }
    });

    // Calculate percentage
    const matchPercentage = (matchCount / jdKeywords.length) * 100;

    return Math.round(matchPercentage * 100) / 100; // Round to 2 decimals
  } catch (error) {
    console.error('Error calculating keyword match:', error.message);
    return 0;
  }
};

// Detect quantified achievements in text
const detectQuantifiedAchievements = (text) => {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      return {
        score: 0,
        count: 0,
        achievements: []
      };
    }

    const lowerText = text.toLowerCase();

    // Regex patterns for quantified achievements
    const patterns = [
      { pattern: /\d+%/g, name: 'percentage' },           // Percentages (e.g., 50%)
      { pattern: /\$[\d,]+(?:\.\d{2})?/g, name: 'money' }, // Money (e.g., $1,000 or $1,000.00)
      { pattern: /\d+[xX]\s*(?:increase|growth|improvement)/g, name: 'multiplier' }, // Multipliers
      { pattern: /\d+(?:\.\d+)?\s*(?:million|billion|thousand|k)/gi, name: 'largeNumber' }, // Large numbers
      { pattern: /\d{3,}/g, name: 'largeDigits' }         // Numbers with 3+ digits
    ];

    const achievements = [];
    let totalMatches = 0;

    patterns.forEach(({ pattern, name }) => {
      const matches = text.match(pattern) || [];
      totalMatches += matches.length;
      if (matches.length > 0) {
        achievements.push({
          type: name,
          count: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    });

    // Score based on achievement count
    // 0 = 0, 1-2 = 40, 3-5 = 70, 6+ = 100
    let score = 0;
    if (totalMatches === 0) score = 0;
    else if (totalMatches <= 2) score = 40;
    else if (totalMatches <= 5) score = 70;
    else score = 100;

    return {
      score,
      count: totalMatches,
      achievements
    };
  } catch (error) {
    console.error('Error detecting quantified achievements:', error.message);
    return {
      score: 0,
      count: 0,
      achievements: []
    };
  }
};

// Check section completeness
const checkSectionCompleteness = (resumeJson) => {
  try {
    // Validate input
    if (!resumeJson || typeof resumeJson !== 'object') {
      return {
        score: 0,
        completeSections: 0,
        totalSections: 0,
        missingSections: []
      };
    }

    const requiredSections = ['experience', 'education', 'skills'];
    const keysLower = Object.keys(resumeJson).map(k => k.toLowerCase());
    const completeSections = [];
    const missingSections = [];

    requiredSections.forEach(section => {
      const hasSection = keysLower.some(key => key.includes(section));
      if (hasSection) {
        completeSections.push(section);
      } else {
        missingSections.push(section);
      }
    });

    // Score: 33% per section
    const score = (completeSections.length / requiredSections.length) * 100;

    return {
      score: Math.round(score * 100) / 100,
      completeSections: completeSections.length,
      totalSections: requiredSections.length,
      missingSections
    };
  } catch (error) {
    console.error('Error checking section completeness:', error.message);
    return {
      score: 0,
      completeSections: 0,
      totalSections: 3,
      missingSections: ['experience', 'education', 'skills']
    };
  }
};

// Detect action verbs in text
const detectActionVerbs = (text) => {
  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      return {
        score: 0,
        count: 0,
        detectedVerbs: []
      };
    }

    const lowerText = text.toLowerCase();
    const detectedVerbs = [];
    let totalCount = 0;

    // Check for each action verb
    ACTION_VERBS.forEach(verb => {
      const regex = new RegExp(`\\b${verb}\\b`, 'gi');
      const matches = text.match(regex) || [];
      totalCount += matches.length;

      if (matches.length > 0) {
        detectedVerbs.push({
          verb,
          count: matches.length
        });
      }
    });

    // Score based on verb count
    // 0-2 = 30, 3-5 = 60, 6-10 = 80, 10+ = 100
    let score = 0;
    if (totalCount === 0) score = 0;
    else if (totalCount <= 2) score = 30;
    else if (totalCount <= 5) score = 60;
    else if (totalCount <= 10) score = 80;
    else score = 100;

    return {
      score,
      count: totalCount,
      detectedVerbs: detectedVerbs.sort((a, b) => b.count - a.count)
    };
  } catch (error) {
    console.error('Error detecting action verbs:', error.message);
    return {
      score: 0,
      count: 0,
      detectedVerbs: []
    };
  }
};

module.exports = {
  calculateKeywordMatch,
  detectQuantifiedAchievements,
  checkSectionCompleteness,
  detectActionVerbs
};
