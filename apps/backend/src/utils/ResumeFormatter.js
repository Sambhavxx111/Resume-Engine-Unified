// Validate ATS format compliance
const validateATSFormat = (resumeJson) => {
  try {
    // Validate input
    if (!resumeJson || typeof resumeJson !== 'object') {
      return {
        isValid: false,
        score: 0,
        errors: ['Resume must be a valid JSON object'],
        warnings: [],
        details: {}
      };
    }

    const errors = [];
    const warnings = [];
    const details = {};

    // 1. Check for empty sections
    const sectionCheck = checkForEmptySections(resumeJson);
    details.emptySections = sectionCheck;
    if (sectionCheck.hasEmptySections) {
      warnings.push(`Empty sections found: ${sectionCheck.emptySections.join(', ')}`);
    }

    // 2. Check skills array
    const skillsCheck = validateSkillsSection(resumeJson);
    details.skills = skillsCheck;
    if (!skillsCheck.isValid) {
      errors.push(skillsCheck.error);
    }

    // 3. Check summary/professional summary
    const summaryCheck = validateSummary(resumeJson);
    details.summary = summaryCheck;
    if (!summaryCheck.isValid) {
      warnings.push(summaryCheck.warning);
    }

    // 4. Check experience section
    const experienceCheck = validateExperience(resumeJson);
    details.experience = experienceCheck;
    if (!experienceCheck.isValid) {
      warnings.push(experienceCheck.warning);
    }

    // 5. Check education section
    const educationCheck = validateEducation(resumeJson);
    details.education = educationCheck;

    // Calculate score (0-100)
    let score = 100;
    score -= errors.length * 25;      // Each error: -25 points
    score -= warnings.length * 10;    // Each warning: -10 points
    score = Math.max(0, score);

    const isValid = errors.length === 0;

    return {
      isValid,
      score: Math.round(score),
      errors,
      warnings,
      details,
      recommendations: generateRecommendations(errors, warnings, details)
    };
  } catch (error) {
    console.error('Error validating ATS format:', error.message);
    return {
      isValid: false,
      score: 0,
      errors: ['Error validating resume format'],
      warnings: [],
      details: {}
    };
  }
};

// Check for empty sections
const checkForEmptySections = (resumeJson) => {
  const emptySections = [];
  const allowedEmpty = ['photo', 'portfolio', 'certifications'];

  Object.entries(resumeJson).forEach(([key, value]) => {
    // Skip allowed empty sections
    if (allowedEmpty.some(allowed => key.toLowerCase().includes(allowed))) {
      return;
    }

    // Check if section is empty
    if (value === null || value === undefined || value === '') {
      emptySections.push(key);
    } else if (Array.isArray(value) && value.length === 0) {
      emptySections.push(key);
    } else if (typeof value === 'object' && Object.keys(value).length === 0) {
      emptySections.push(key);
    }
  });

  return {
    hasEmptySections: emptySections.length > 0,
    emptySections
  };
};

// Validate skills section
const validateSkillsSection = (resumeJson) => {
  const keysLower = Object.keys(resumeJson).map(k => k.toLowerCase());
  const skillsKey = keysLower.find(k => k.includes('skill'));

  if (!skillsKey) {
    return {
      isValid: false,
      error: 'Skills section is missing'
    };
  }

  const skillsValue = resumeJson[Object.keys(resumeJson)[Object.keys(resumeJson).map(k => k.toLowerCase()).indexOf(skillsKey)]];

  if (Array.isArray(skillsValue)) {
    if (skillsValue.length === 0) {
      return {
        isValid: false,
        error: 'Skills array is empty'
      };
    }
    return {
      isValid: true,
      count: skillsValue.length
    };
  } else if (typeof skillsValue === 'string' && skillsValue.trim().length === 0) {
    return {
      isValid: false,
      error: 'Skills section is empty'
    };
  }

  return {
    isValid: true
  };
};

// Validate summary/professional summary
const validateSummary = (resumeJson) => {
  const keysLower = Object.keys(resumeJson).map(k => k.toLowerCase());
  const summaryKeyIndex = keysLower.findIndex(k => k.includes('summary') || k.includes('professional'));

  if (summaryKeyIndex === -1) {
    return {
      isValid: false,
      warning: 'Professional summary/objective is missing'
    };
  }

  const summaryKey = Object.keys(resumeJson)[summaryKeyIndex];
  const summaryValue = resumeJson[summaryKey];

  if (typeof summaryValue === 'string') {
    const length = summaryValue.trim().length;

    if (length === 0) {
      return {
        isValid: false,
        warning: 'Summary is empty'
      };
    }

    if (length < 50) {
      return {
        isValid: false,
        warning: `Summary is too short (${length} chars, minimum 50)`
      };
    }

    return {
      isValid: true,
      length
    };
  }

  return {
    isValid: false,
    warning: 'Summary format is invalid'
  };
};

// Validate experience section
const validateExperience = (resumeJson) => {
  const keysLower = Object.keys(resumeJson).map(k => k.toLowerCase());
  const experienceKeyIndex = keysLower.findIndex(k => k.includes('experience') || k.includes('work'));

  if (experienceKeyIndex === -1) {
    return {
      isValid: false,
      warning: 'Work experience section is missing'
    };
  }

  const experienceKey = Object.keys(resumeJson)[experienceKeyIndex];
  const experienceValue = resumeJson[experienceKey];

  if (Array.isArray(experienceValue)) {
    if (experienceValue.length === 0) {
      return {
        isValid: false,
        warning: 'Work experience list is empty'
      };
    }
    return {
      isValid: true,
      count: experienceValue.length
    };
  }

  return {
    isValid: false,
    warning: 'Experience format is invalid'
  };
};

// Validate education section
const validateEducation = (resumeJson) => {
  const keysLower = Object.keys(resumeJson).map(k => k.toLowerCase());
  const educationKeyIndex = keysLower.findIndex(k => k.includes('education'));

  if (educationKeyIndex === -1) {
    return {
      isValid: false,
      warning: 'Education section is missing'
    };
  }

  const educationKey = Object.keys(resumeJson)[educationKeyIndex];
  const educationValue = resumeJson[educationKey];

  if (Array.isArray(educationValue)) {
    if (educationValue.length === 0) {
      return {
        isValid: false,
        warning: 'Education list is empty'
      };
    }
    return {
      isValid: true,
      count: educationValue.length
    };
  }

  return {
    isValid: true
  };
};

// Generate recommendations
const generateRecommendations = (errors, warnings, details) => {
  const recommendations = [];

  if (details.skills && !details.skills.isValid) {
    recommendations.push('Add at least 5 relevant skills to your resume');
  }

  if (details.summary && !details.summary.isValid) {
    recommendations.push('Write a professional summary of at least 50 characters');
  }

  if (details.experience && !details.experience.isValid) {
    recommendations.push('Add at least one work experience entry');
  }

  if (details.emptySections && details.emptySections.hasEmptySections) {
    recommendations.push('Remove or fill in empty sections');
  }

  return recommendations;
};

module.exports = {
  validateATSFormat,
  checkForEmptySections,
  validateSkillsSection,
  validateSummary,
  validateExperience,
  validateEducation
};
