const { callGeminiWithTimeout, getResumeParsingGeminiOptions } = require('../config/gemini');
const {
  buildImportedResumeData,
  buildResumeTextFromData,
  collectResumeSignals,
  extractResumeKeywords,
  generateSummaryFallback,
  groundImportedResumeData,
  suggestSkillsFallback,
  optimizeResumeFallback,
  optimizeUploadedResumeTextFallback,
} = require('../utils/resumeHeuristics');

// Prompt Templates
const PROMPTS = {
  SUMMARY: (resumeData, resumeText) => `
    Review the full resume and generate a strong, truthful professional summary in 2-3 sentences.
    Base it on the candidate's actual experience, projects, education, and skills.
    Do not invent achievements, tools, or metrics.
    Keep it concise, recruiter-friendly, and suitable for the top of the resume.

    Structured Resume Data:
    ${JSON.stringify(resumeData)}

    Resume Context Text:
    ${resumeText}
    
    Return ONLY a valid JSON object with this structure:
    {
      "summary": "string"
    }
  `,

  SUGGEST_SKILLS: (resumeData, resumeText, existingSkills) => `
    Review the full resume and suggest 5 additional skills that are genuinely supported by the candidate's experience, projects, education, or current skills.
    Do not invent unrelated skills.
    Prefer concrete tools, technologies, and concise competencies that strengthen ATS matching.
    Do not return school names, cities, degrees, certificates, or vague filler phrases.

    Existing Skills:
    ${existingSkills.join(', ')}

    Structured Resume Data:
    ${JSON.stringify(resumeData)}

    Resume Context Text:
    ${resumeText}
    
    Return ONLY a valid JSON object with this structure:
    {
      "suggestedSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "reasoning": "string explaining the suggestions"
    }
  `,

  DIAGNOSE_RESUME: (resumeJson) => `
    Analyze this resume for common weaknesses and areas of improvement. Identify specific issues.
    Resume: ${JSON.stringify(resumeJson)}
    
    Return ONLY a valid JSON object with this structure:
    {
      "issues": ["issue1", "issue2", "issue3"],
      "severity": "high|medium|low",
      "recommendations": ["recommendation1", "recommendation2"],
      "strengths": ["strength1", "strength2"]
    }
  `,

  OPTIMIZE_RESUME: (resumeJson, jobDescription) => `
    Review the full resume and suggest high-value improvements to wording, clarity, ATS alignment, and skill coverage.
    Ground every suggestion in the actual resume content.
    Do not invent achievements, technologies, or metrics.
    If no job description is provided, optimize for a stronger general professional resume.

    Resume: ${JSON.stringify(resumeJson)}
    ${jobDescription ? `Job Description: ${JSON.stringify(jobDescription)}` : ''}
    
    Return ONLY a valid JSON object with this structure:
    {
      "improvements": [
        {
          "section": "string",
          "current": "string",
          "suggested": "string",
          "reason": "string"
        }
      ],
      "priorityImprovements": ["improvement1", "improvement2"],
      "overallAssessment": "string"
    }
  `,

  OPTIMIZE_UPLOADED_RESUME: (resumeText, atsInsights = {}, originalResumeData = {}) => `
    Rewrite this resume into a stronger ATS-friendly version.
    Keep it truthful, concise, and directly usable as resume content.
    Improve section headings, action verbs, measurable impact, and keyword coverage.
    Aim for a 90+ ATS outcome if the content allows it.
    Do NOT invent achievements, companies, degrees, dates, or certifications that are not supported by the original text.
    Do NOT include ATS score numbers, explanations, before/after text, markdown, or commentary inside the resume itself.
    Preserve the candidate's real sections and content coverage. If the original resume contains projects, certifications, publications, achievements, internships, or other custom sections, keep them in the output unless the source truly lacks usable content.
    Prefer improving phrasing and structure over deleting content.
    Return a structured resume JSON that can be rendered directly into a resume layout.
    Use empty strings or empty arrays when a detail is missing instead of hallucinating content.

    Original Resume Text:
    ${resumeText}

    Original Structured Resume Data:
    ${JSON.stringify(originalResumeData)}

    ATS Insights:
    ${JSON.stringify(atsInsights)}

    Return ONLY a valid JSON object with this structure:
    {
      "headline": "short string",
      "optimizedResumeText": "full ATS-optimized plain text resume",
      "optimizedResumeData": {
        "personalInfo": {
          "fullName": "string",
          "title": "string",
          "email": "string",
          "phone": "string",
          "location": "string"
        },
        "summary": "string",
        "skills": ["skill 1", "skill 2"],
        "experience": [
          {
            "company": "string",
            "role": "string",
            "startDate": "YYYY-MM or empty string",
            "endDate": "YYYY-MM or empty string",
            "description": "plain text bullet-style achievements in one string"
          }
        ],
        "education": [
          {
            "institution": "string",
            "degree": "string",
            "fieldOfStudy": "string",
            "startDate": "YYYY-MM or empty string",
            "endDate": "YYYY-MM or empty string",
            "location": "string",
            "score": "string"
          }
        ],
        "customSections": []
      },
      "keyChanges": ["change 1", "change 2", "change 3"]
    }
  `,

  PARSE_RESUME_FOR_BUILDER: (resumeText, originalName = '') => `
    Parse this resume into the exact structured JSON needed by a resume builder form.
    Keep everything truthful to the source resume.
    Do NOT invent facts, achievements, dates, companies, institutions, or links.
    Do NOT use generic filename words such as "resume", "cv", or "final" as part of the person's name.
    The skills array must contain only actual skills, tools, technologies, or concise competencies.
    Never put college names, school names, cities, dates, grades, certifications, job titles, or full bullet sentences into the skills array.
    If something is missing, return an empty string or empty array instead.
    Convert bullet points into plain text strings joined naturally inside description fields.
    Use only these top-level keys and no markdown.

    Original file name:
    ${originalName}

    Resume text:
    ${resumeText}

    Return ONLY a valid JSON object with this exact structure:
    {
      "personalInfo": {
        "fullName": "string",
        "title": "string",
        "email": "string",
        "phone": "string",
        "location": "string",
        "portfolio": "string"
      },
      "education": [
        {
          "institution": "string",
          "degree": "string",
          "fieldOfStudy": "string",
          "startDate": "YYYY-MM or empty string",
          "endDate": "YYYY-MM or empty string",
          "location": "string",
          "score": "string"
        }
      ],
      "experience": [
        {
          "company": "string",
          "role": "string",
          "startDate": "YYYY-MM or empty string",
          "endDate": "YYYY-MM or empty string",
          "description": "string"
        }
      ],
      "skills": ["skill 1", "skill 2"],
      "summary": "string",
      "customSections": [
        {
          "title": "string",
          "items": ["item 1", "item 2"]
        }
      ]
    }
  `,

  RECOMMEND_JOBS_FOR_RESUME: (resumeText) => `
    Analyze this resume text and recommend the most suitable job roles for the candidate.
    Focus on realistic job titles, fit score, matching reason, and the most relevant skills.
    Keep the response concise, recruiter-friendly, and practical.

    Resume Text:
    ${resumeText}

    Return ONLY a valid JSON object with this structure:
    {
      "topCategories": ["category 1", "category 2"],
      "recommendedJobs": [
        {
          "title": "job title",
          "fitScore": 85,
          "jobType": "Full-time",
          "matchReason": "short explanation",
          "keySkills": ["skill 1", "skill 2", "skill 3"]
        }
      ]
    }
  `
};

const normalizeComparable = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const mergeUniqueStrings = (preferred = [], fallback = [], limit = 24) => {
  const seen = new Set();
  return [...preferred, ...fallback]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeComparable(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
};

const mergeEntriesByIdentity = (preferred = [], fallback = [], identityFields = []) => {
  const buildKey = (item = {}) => {
    const composite = identityFields
      .map((field) => String(item?.[field] || '').trim())
      .filter(Boolean)
      .join('|');

    return normalizeComparable(composite || JSON.stringify(item || {}));
  };

  const merged = [];
  const seen = new Set();

  [...preferred, ...fallback].forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const key = buildKey(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  return merged;
};

const mergeCustomSections = (preferred = [], fallback = []) => {
  const mergedByTitle = new Map();

  fallback.forEach((section) => {
    const title = String(section?.title || '').trim();
    if (!title) return;
    mergedByTitle.set(normalizeComparable(title), {
      title,
      items: Array.isArray(section?.items) ? section.items.filter(Boolean) : [],
    });
  });

  preferred.forEach((section) => {
    const title = String(section?.title || '').trim();
    if (!title) return;
    const key = normalizeComparable(title);
    const existing = mergedByTitle.get(key);
    mergedByTitle.set(key, {
      title,
      items: mergeUniqueStrings(
        Array.isArray(section?.items) ? section.items : [],
        existing?.items || [],
        12,
      ),
    });
  });

  return Array.from(mergedByTitle.values()).filter((section) => section.title && section.items.length);
};

const mergeOptimizedUploadedResumeData = (optimizedResumeData = {}, originalResumeData = {}) => ({
  ...originalResumeData,
  ...optimizedResumeData,
  personalInfo: {
    ...(originalResumeData.personalInfo || {}),
    ...(optimizedResumeData.personalInfo || {}),
    fullName:
      optimizedResumeData.personalInfo?.fullName ||
      optimizedResumeData.personalInfo?.name ||
      originalResumeData.personalInfo?.fullName ||
      originalResumeData.personalInfo?.name ||
      '',
    title:
      optimizedResumeData.personalInfo?.title ||
      originalResumeData.personalInfo?.title ||
      '',
    email:
      optimizedResumeData.personalInfo?.email ||
      originalResumeData.personalInfo?.email ||
      '',
    phone:
      optimizedResumeData.personalInfo?.phone ||
      originalResumeData.personalInfo?.phone ||
      '',
    location:
      optimizedResumeData.personalInfo?.location ||
      originalResumeData.personalInfo?.location ||
      '',
    portfolio:
      optimizedResumeData.personalInfo?.portfolio ||
      originalResumeData.personalInfo?.portfolio ||
      '',
  },
  summary: optimizedResumeData.summary || originalResumeData.summary || '',
  skills: mergeUniqueStrings(optimizedResumeData.skills || [], originalResumeData.skills || [], 24),
  experience: mergeEntriesByIdentity(
    optimizedResumeData.experience || [],
    originalResumeData.experience || [],
    ['role', 'company', 'description'],
  ),
  education: mergeEntriesByIdentity(
    optimizedResumeData.education || [],
    originalResumeData.education || [],
    ['degree', 'institution', 'fieldOfStudy'],
  ),
  customSections: mergeCustomSections(
    optimizedResumeData.customSections || [],
    originalResumeData.customSections || [],
  ),
});

// Safe JSON parsing
const parseGeminiJSON = (text) => {
  try {
    // Try to extract JSON from text if it contains other content
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.warn('Failed to parse Gemini response as JSON, returning empty object');
    console.warn('Response text:', text.substring(0, 200));
    return {};
  }
};

// Generate professional summary
const generateSummary = async (data) => {
  try {
    const { resumeData, resumeText } = normalizeResumeContext(data);
    const prompt = PROMPTS.SUMMARY(resumeData, resumeText);

    if (process.env.GEMINI_DEBUG === 'true') {
      console.warn('SUMMARY prompt length:', prompt.length);
    }

    try {
      const rawText = await callGeminiWithTimeout(prompt, { timeoutMs: 30000, retries: 2 });

      if (process.env.GEMINI_DEBUG === 'true') console.warn('Raw summary response:', String(rawText).substring(0, 1000));

      const parsed = parseGeminiJSON(String(rawText));

      if (!parsed.summary) {
        throw new Error('Missing summary in response');
      }

      return {
        success: true,
        summary: parsed.summary
      };
    } catch (apiError) {
      console.warn('Gemini summary unavailable, returning local fallback summary');
      return {
        success: true,
        summary: generateSummaryFallback(resumeData),
      };
    }
  } catch (error) {
    console.error('Generate summary error:', error.message);
    throw new Error(`Error generating summary: ${error.message}`);
  }
};

// Suggest relevant skills
const suggestSkills = async (resumeData, existingSkills = []) => {
  try {
    if (!resumeData || typeof resumeData !== 'object') {
      throw new Error('Resume data must be a valid object');
    }

    const { resumeData: normalizedResumeData, resumeText } = normalizeResumeContext(resumeData);
    const normalizedExistingSkills = Array.isArray(existingSkills) ? existingSkills.filter(Boolean) : [];
    const derivedExistingSkills =
      normalizedExistingSkills.length
        ? normalizedExistingSkills
        : [
            ...(Array.isArray(normalizedResumeData.skills) ? normalizedResumeData.skills : []),
            ...extractResumeKeywords(normalizedResumeData, 8),
          ].slice(0, 8);
    const prompt = PROMPTS.SUGGEST_SKILLS(normalizedResumeData, resumeText, derivedExistingSkills);

    if (process.env.GEMINI_DEBUG === 'true') console.warn('SUGGEST_SKILLS prompt length:', prompt.length);

    try {
      const rawText = await callGeminiWithTimeout(prompt, { timeoutMs: 30000, retries: 2 });

      if (process.env.GEMINI_DEBUG === 'true') console.warn('Raw suggestSkills response:', String(rawText).substring(0, 1000));

      const parsed = parseGeminiJSON(String(rawText));

      if (!parsed.suggestedSkills || !Array.isArray(parsed.suggestedSkills)) {
        throw new Error('Invalid response');
      }

      return {
        success: true,
        suggestedSkills: parsed.suggestedSkills
          .filter((skill) => typeof skill === 'string' && skill.trim())
          .slice(0, 5),
        reasoning: parsed.reasoning || 'Skills suggested based on current profile'
      };
    } catch (apiError) {
      console.warn('Gemini skill suggestion unavailable, returning local fallback skills');
      return {
        success: true,
        ...suggestSkillsFallback(normalizedResumeData, derivedExistingSkills),
      };
    }
  } catch (error) {
    console.error('Suggest skills error:', error.message);
    throw new Error(`Error suggesting skills: ${error.message}`);
  }
};

// Diagnose resume for issues
const diagnoseResume = async (resumeJson) => {
  try {
    if (!resumeJson || typeof resumeJson !== 'object') {
      throw new Error('Resume must be a valid JSON object');
    }

    // Handle text-only resume data
    let resumeContent = resumeJson;
    if (resumeJson.text && !resumeJson.experience) {
      resumeContent = {
        rawContent: resumeJson.text,
        type: 'text'
      };
    }

    const prompt = PROMPTS.DIAGNOSE_RESUME(resumeContent);

    if (process.env.GEMINI_DEBUG === 'true') console.warn('DIAGNOSE prompt length:', prompt.length);

    try {
      const rawText = await callGeminiWithTimeout(prompt, { timeoutMs: 30000, retries: 2 });

      if (process.env.GEMINI_DEBUG === 'true') console.warn('Raw diagnose response:', String(rawText).substring(0, 1000));

      const parsed = parseGeminiJSON(String(rawText));

      if (!parsed.issues || !Array.isArray(parsed.issues)) {
        throw new Error('Invalid response structure');
      }

      return {
        success: true,
        issues: parsed.issues,
        severity: parsed.severity || 'medium',
        recommendations: parsed.recommendations || [],
        strengths: parsed.strengths || []
      };
    } catch (apiError) {
      console.warn('Gemini API error or timeout, returning fallback diagnosis');
      if (process.env.GEMINI_DEBUG === 'true') {
        console.error('Gemini diagnose error:', apiError && apiError.stack ? apiError.stack : apiError);
      }
      // Return quick fallback diagnosis
      return {
        success: true,
        issues: ['Content clarity', 'Keyword optimization'],
        severity: 'medium',
        recommendations: ['Review for clarity and conciseness', 'Add industry keywords'],
        strengths: ['Experience included', 'Contact info provided']
      };
    }
  } catch (error) {
    console.error('Diagnose resume error:', error.message);
    throw new Error(`Error diagnosing resume: ${error.message}`);
  }
};

// Optimize resume based on job description
const optimizeResume = async (resumeJson, jobDescription = null) => {
  try {
    console.log('optimizeResume called');

    if (!resumeJson || typeof resumeJson !== 'object') {
      throw new Error('Resume must be a valid JSON object');
    }

    // Handle text-only resume data
    let resumeContent = resumeJson;
    if (resumeJson.text && !resumeJson.experience) {
      resumeContent = {
        rawContent: resumeJson.text,
        type: 'text'
      };
    }

    const prompt = PROMPTS.OPTIMIZE_RESUME(resumeContent, jobDescription);

    if (process.env.GEMINI_DEBUG === 'true') console.warn('OPTIMIZE prompt length:', prompt.length);

    try {
      const rawText = await callGeminiWithTimeout(prompt, { timeoutMs: 30000, retries: 2 });

      if (process.env.GEMINI_DEBUG === 'true') console.warn('Raw optimize response:', String(rawText).substring(0, 1000));

      const parsed = parseGeminiJSON(String(rawText));

      if (!parsed.improvements || !Array.isArray(parsed.improvements)) {
        throw new Error('Invalid response structure');
      }

      return {
        success: true,
        improvements: parsed.improvements,
        priorityImprovements: parsed.priorityImprovements || [],
        overallAssessment: parsed.overallAssessment || 'Resume reviewed and improvements suggested'
      };
    } catch (apiError) {
      console.warn('Gemini optimization unavailable, returning local fallback suggestions');
      return {
        success: true,
        ...optimizeResumeFallback(resumeContent, jobDescription),
      };
    }
  } catch (error) {
    console.error('Optimize resume error:', error.message);
    throw new Error(`Error optimizing resume: ${error.message}`);
  }
};

const optimizeUploadedResumeText = async (resumeText, atsInsights = {}, originalName = 'uploaded resume') => {
  try {
    if (!resumeText || typeof resumeText !== 'string') {
      throw new Error('Resume text is required');
    }

    const originalResumeData = groundImportedResumeData(
      buildImportedResumeData(resumeText, originalName),
      resumeText,
      originalName,
    );
    const prompt = PROMPTS.OPTIMIZE_UPLOADED_RESUME(resumeText, atsInsights, originalResumeData);

    try {
      const rawText = await callGeminiWithTimeout(prompt, {
        timeoutMs: 20000,
        retries: 2,
      });
      const parsed = parseGeminiJSON(String(rawText));

      if (!parsed.optimizedResumeText || typeof parsed.optimizedResumeText !== 'string') {
        throw new Error('Invalid optimized resume response');
      }

      const optimizedResumeData =
        parsed.optimizedResumeData && typeof parsed.optimizedResumeData === 'object'
          ? mergeOptimizedUploadedResumeData(
              groundImportedResumeData(parsed.optimizedResumeData, resumeText, originalName),
              originalResumeData,
            )
          : null;

      return {
        success: true,
        headline: parsed.headline || 'ATS-ready revision prepared',
        optimizedResumeText: parsed.optimizedResumeText,
        optimizedResumeData,
        keyChanges: Array.isArray(parsed.keyChanges) ? parsed.keyChanges : []
      };
    } catch (apiError) {
      if (isGeminiQuotaOrConfigError(apiError)) {
        throw apiError;
      }

      console.warn('Gemini uploaded optimization unavailable, returning local fallback draft');
      return {
        success: true,
        ...optimizeUploadedResumeTextFallback(resumeText, atsInsights),
      };
    }
  } catch (error) {
    console.error('Optimize uploaded resume text error:', error.message);
    const wrappedError = new Error(`Error optimizing uploaded resume text: ${error.message}`);
    wrappedError.status = error?.status;
    throw wrappedError;
  }
};

const isGeminiQuotaOrConfigError = (error) => {
  const message = String(error?.message || '');
  return (
    error?.status === 429 ||
    /429|Too Many Requests|quota exceeded|rate limit|GEMINI_API_KEY is missing/i.test(message)
  );
};

const normalizeResumeContext = (data) => {
  if (typeof data === 'string') {
    return {
      resumeData: { rawContent: data },
      resumeText: String(data),
    };
  }

  if (data?.text && !data?.experience) {
    return {
      resumeData: { rawContent: data.text },
      resumeText: String(data.text),
    };
  }

  const resumeData = data && typeof data === 'object' ? data : {};
  const resumeText =
    buildResumeTextFromData(resumeData) ||
    collectResumeSignals(resumeData) ||
    JSON.stringify(resumeData);

  return { resumeData, resumeText };
};

const parseResumeForBuilder = async (resumeText, originalName = '') => {
  try {
    if (!resumeText || typeof resumeText !== 'string') {
      throw new Error('Resume text is required');
    }

    const prompt = PROMPTS.PARSE_RESUME_FOR_BUILDER(resumeText, originalName);

    try {
      const rawText = await callGeminiWithTimeout(prompt, {
        timeoutMs: 25000,
        retries: 2,
        ...getResumeParsingGeminiOptions(),
      });
      const parsed = parseGeminiJSON(String(rawText));

      if (!parsed || typeof parsed !== 'object' || !parsed.personalInfo) {
        throw new Error('Invalid parsed resume response');
      }

      return {
        success: true,
        resumeData: groundImportedResumeData({
          personalInfo: {
            fullName: parsed.personalInfo?.fullName || '',
            title: parsed.personalInfo?.title || '',
            email: parsed.personalInfo?.email || '',
            phone: parsed.personalInfo?.phone || '',
            location: parsed.personalInfo?.location || '',
            portfolio: parsed.personalInfo?.portfolio || '',
          },
          education: Array.isArray(parsed.education)
            ? parsed.education.map((item) => ({
                institution: item?.institution || '',
                degree: item?.degree || '',
                fieldOfStudy: item?.fieldOfStudy || '',
                startDate: item?.startDate || '',
                endDate: item?.endDate || '',
                location: item?.location || '',
                score: item?.score || '',
              }))
            : [],
          experience: Array.isArray(parsed.experience) ? parsed.experience : [],
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          summary: parsed.summary || '',
          customSections: Array.isArray(parsed.customSections) ? parsed.customSections : [],
        }, resumeText, originalName),
      };
    } catch (apiError) {
      console.warn('Gemini resume parsing unavailable, returning local fallback parse');
      return {
        success: true,
        resumeData: groundImportedResumeData(buildImportedResumeData(resumeText, originalName), resumeText, originalName),
      };
    }
  } catch (error) {
    console.error('Parse resume for builder error:', error.message);
    throw new Error(`Error parsing resume for builder: ${error.message}`);
  }
};

const recommendJobsForResumeText = async (resumeText) => {
  try {
    if (!resumeText || typeof resumeText !== 'string') {
      throw new Error('Resume text is required');
    }

    const prompt = PROMPTS.RECOMMEND_JOBS_FOR_RESUME(resumeText);

    try {
      const rawText = await callGeminiWithTimeout(prompt, { timeoutMs: 15000, retries: 2 });
      const parsed = parseGeminiJSON(String(rawText));

      if (!Array.isArray(parsed.recommendedJobs)) {
        throw new Error('Invalid job recommendation response');
      }

      return {
        success: true,
        topCategories: Array.isArray(parsed.topCategories) ? parsed.topCategories : [],
        recommendedJobs: parsed.recommendedJobs.map((job) => ({
          title: job.title || 'Software Developer',
          fitScore: Number(job.fitScore) || 75,
          jobType: job.jobType || 'Full-time',
          matchReason: job.matchReason || 'Your resume shows relevant overlap for this role.',
          keySkills: Array.isArray(job.keySkills) ? job.keySkills.slice(0, 6) : [],
        })),
      };
    } catch (apiError) {
      console.warn('Gemini API error or timeout, returning fallback job recommendations');

      const lowerResume = resumeText.toLowerCase();
      const hasFrontend = /(react|frontend|javascript|html|css|tailwind|ui)/i.test(lowerResume);
      const hasBackend = /(node|express|api|backend|server|sql|database)/i.test(lowerResume);
      const hasData = /(python|data|analysis|ml|machine learning|pandas)/i.test(lowerResume);
      const hasCloud = /(aws|docker|kubernetes|cloud|devops)/i.test(lowerResume);

      const recommendedJobs = [];

      if (hasFrontend) {
        recommendedJobs.push({
          title: 'Frontend Developer',
          fitScore: 88,
          jobType: 'Full-time',
          matchReason: 'Your resume shows strong frontend, UI, and web development alignment.',
          keySkills: ['React', 'JavaScript', 'HTML', 'CSS', 'REST APIs'],
        });
      }

      if (hasBackend) {
        recommendedJobs.push({
          title: 'Full Stack Developer',
          fitScore: hasFrontend ? 86 : 79,
          jobType: 'Full-time',
          matchReason: 'You have backend and application-building signals that fit product engineering roles.',
          keySkills: ['Node.js', 'APIs', 'Databases', 'JavaScript', 'System Design'],
        });
      }

      if (hasData) {
        recommendedJobs.push({
          title: 'Software Developer Intern',
          fitScore: 80,
          jobType: 'Internship',
          matchReason: 'Your technical foundation and project experience align well with early-career software roles.',
          keySkills: ['Problem Solving', 'Python', 'DSA', 'Projects'],
        });
      }

      if (hasCloud) {
        recommendedJobs.push({
          title: 'Cloud Support Engineer',
          fitScore: 78,
          jobType: 'Full-time',
          matchReason: 'Your resume includes infrastructure and cloud signals that support platform-oriented roles.',
          keySkills: ['AWS', 'Docker', 'Deployment', 'Monitoring'],
        });
      }

      if (!recommendedJobs.length) {
        recommendedJobs.push(
          {
            title: 'Software Developer',
            fitScore: 82,
            jobType: 'Full-time',
            matchReason: 'Your resume shows general software engineering potential across common product roles.',
            keySkills: ['Programming', 'Problem Solving', 'Projects', 'Communication'],
          },
          {
            title: 'Associate Software Engineer',
            fitScore: 79,
            jobType: 'Full-time',
            matchReason: 'Your profile fits early-career software roles that value adaptable technical foundations.',
            keySkills: ['Coding', 'Debugging', 'Teamwork'],
          },
        );
      }

      return {
        success: true,
        topCategories: Array.from(
          new Set(
            recommendedJobs.map((job) => {
              if (/frontend/i.test(job.title)) return 'Frontend Engineering';
              if (/cloud/i.test(job.title)) return 'Cloud & Platform';
              if (/full stack/i.test(job.title)) return 'Full Stack Development';
              return 'Software Development';
            }),
          ),
        ),
        recommendedJobs: recommendedJobs.slice(0, 5),
      };
    }
  } catch (error) {
    console.error('Recommend jobs for resume text error:', error.message);
    throw new Error(`Error recommending jobs for resume text: ${error.message}`);
  }
};

module.exports = {
  generateSummary,
  suggestSkills,
  diagnoseResume,
  optimizeResume,
  optimizeUploadedResumeText,
  recommendJobsForResumeText,
  parseResumeForBuilder
};
