const { callGeminiWithTimeout, getResumeParsingGeminiOptions } = require('../config/gemini');
const {
  buildImportedResumeData,
  generateSummaryFallback,
  groundImportedResumeData,
  suggestSkillsFallback,
  optimizeResumeFallback,
  optimizeUploadedResumeTextFallback,
} = require('../utils/resumeHeuristics');

// Prompt Templates
const PROMPTS = {
  SUMMARY: (data) => `
    Analyze the following resume data and generate a professional summary (2-3 sentences).
    Resume Data: ${JSON.stringify(data)}
    
    Return ONLY a valid JSON object with this structure:
    {
      "summary": "string"
    }
  `,

  SUGGEST_SKILLS: (existingSkills) => `
    Based on the following existing skills, suggest 5 additional relevant skills that would enhance a tech resume.
    Existing Skills: ${existingSkills.join(', ')}
    
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
    Optimize the resume to better match the job description. Suggest improvements to content and phrasing.
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

  OPTIMIZE_UPLOADED_RESUME: (resumeText, atsInsights = {}) => `
    Rewrite this resume into a stronger ATS-friendly version.
    Keep it truthful, concise, and directly usable as resume content.
    Improve section headings, action verbs, measurable impact, and keyword coverage.
    Aim for a 90+ ATS outcome if the content allows it.
    Do NOT invent achievements, companies, degrees, dates, or certifications that are not supported by the original text.
    Do NOT include ATS score numbers, explanations, before/after text, markdown, or commentary inside the resume itself.
    Return a structured resume JSON that can be rendered directly into a resume layout.
    Use empty strings or empty arrays when a detail is missing instead of hallucinating content.

    Original Resume Text:
    ${resumeText}

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
            "endDate": "YYYY-MM or empty string"
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
          "endDate": "YYYY-MM or empty string"
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
    // Handle text-only resume data
    let resumeContent = data;
    if (typeof data === 'string') {
      resumeContent = { rawContent: data };
    } else if (data.text && !data.experience) {
      resumeContent = { rawContent: data.text };
    }
    const prompt = PROMPTS.SUMMARY(resumeContent);

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
        summary: generateSummaryFallback(resumeContent),
      };
    }
  } catch (error) {
    console.error('Generate summary error:', error.message);
    throw new Error(`Error generating summary: ${error.message}`);
  }
};

// Suggest relevant skills
const suggestSkills = async (existingSkills) => {
  try {
    if (!Array.isArray(existingSkills) || existingSkills.length === 0) {
      throw new Error('Existing skills must be a non-empty array');
    }

    const prompt = PROMPTS.SUGGEST_SKILLS(existingSkills);

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
        suggestedSkills: parsed.suggestedSkills,
        reasoning: parsed.reasoning || 'Skills suggested based on current profile'
      };
    } catch (apiError) {
      console.warn('Gemini skill suggestion unavailable, returning local fallback skills');
      return {
        success: true,
        ...suggestSkillsFallback(existingSkills),
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

const optimizeUploadedResumeText = async (resumeText, atsInsights = {}) => {
  try {
    if (!resumeText || typeof resumeText !== 'string') {
      throw new Error('Resume text is required');
    }

    const prompt = PROMPTS.OPTIMIZE_UPLOADED_RESUME(resumeText, atsInsights);

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
          ? parsed.optimizedResumeData
          : null;

      return {
        success: true,
        headline: parsed.headline || 'ATS-ready revision prepared',
        optimizedResumeText: parsed.optimizedResumeText,
        optimizedResumeData,
        keyChanges: Array.isArray(parsed.keyChanges) ? parsed.keyChanges : []
      };
    } catch (apiError) {
      console.warn('Gemini uploaded optimization unavailable, returning local fallback draft');
      return {
        success: true,
        ...optimizeUploadedResumeTextFallback(resumeText, atsInsights),
      };
    }
  } catch (error) {
    console.error('Optimize uploaded resume text error:', error.message);
    throw new Error(`Error optimizing uploaded resume text: ${error.message}`);
  }
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
          education: Array.isArray(parsed.education) ? parsed.education : [],
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
