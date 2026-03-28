const resumeModel = require('../models/resume.model');
const { calculateATSScore, calculateATSScoreFallback } = require('../services/ats.service');
const { matchResumeWithJD, matchResumeWithJDFallback } = require('../services/jdMatcher.service');
const {
  recommendJobsForResumeText,
  optimizeUploadedResumeText,
} = require('../services/gemini.service');
const { PDFParse } = require('pdf-parse');

const sendGeminiAwareError = (res, error, fallbackMessage) => {
  const message = String(error?.message || '');
  const isQuotaOrRateLimit =
    error?.status === 429 ||
    /429|Too Many Requests|quota exceeded|rate limit/i.test(message);

  if (isQuotaOrRateLimit) {
    return res.status(429).json({
      error: 'Gemini quota or rate limit reached. Please wait and try again, or update your Gemini plan/key.',
      details: message,
    });
  }

  return res.status(500).json({
    error: fallbackMessage,
    details: message,
  });
};

const sanitizeExtractedResumeText = (text = '', originalName = '') => {
  const normalized = String(text || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !/^(%PDF|obj\b|endobj\b|xref\b|trailer\b|startxref\b|stream\b|endstream\b)/i.test(line) &&
        !/[<>]{2,}/.test(line) &&
        !/^\/[A-Z]/.test(line) &&
        !/(Producer|Creator|CreationDate|ModDate|Type|Length|Filter|Contents)/i.test(line),
    )
    .filter((line) => /[A-Za-z]/.test(line))
    .filter((line) => {
      const symbolCount = (line.match(/[^A-Za-z0-9\s,.+:#&()/-]/g) || []).length;
      return symbolCount < Math.max(6, line.length * 0.18);
    })
    .map((line) => line.replace(/\s+/g, ' ').trim());

  const cleaned = normalized.join('\n').trim();
  if (cleaned.length >= 80) {
    return cleaned;
  }

  return originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
};

const extractUploadedText = async (file) => {
  if (!file) {
    throw new Error('No resume file uploaded');
  }

  let text = '';
  if (file.mimetype === 'application/pdf') {
    let parser;

    try {
      parser = new PDFParse({ data: file.buffer });
      const pdfData = await parser.getText();
      text = pdfData?.text || '';
    } catch (pdfError) {
      console.error('PDF parsing warning:', pdfError.message);
      text = file.originalname || 'uploaded resume';
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        await parser.destroy().catch(() => {});
      }
    }
  } else {
    text = file.buffer.toString('utf-8');
  }

  if (!text.trim()) {
    text = file.originalname || 'uploaded resume';
  }

  return sanitizeExtractedResumeText(text, file.originalname || 'uploaded resume');
};

const SECTION_NAME_MAP = {
  contact: 'contact',
  'professional_summary': 'summary',
  summary: 'summary',
  profile: 'summary',
  experience: 'experience',
  'work_experience': 'experience',
  education: 'education',
  skills: 'skills',
  technical_skills: 'skills',
  projects: 'projects',
  certifications: 'certifications',
  achievements: 'achievements',
};

const normalizeSectionName = (line = '') =>
  SECTION_NAME_MAP[line.toLowerCase().replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '_')] ||
  line.toLowerCase().replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '_');

const sanitizeOptimizedLines = (resumeText = '') =>
  String(resumeText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^ATS OPTIMIZATION DRAFT$/i.test(line))
    .filter((line) => !/^ORIGINAL CONTENT FOR REFERENCE$/i.test(line))
    .filter((line) => !/^Rewrite your summary/i.test(line))
    .filter((line) => !/^Add your best email/i.test(line))
    .filter((line) => !/^Highlight one strong project/i.test(line))
    .map((line) => line.replace(/\s+/g, ' ').trim());

const filterFilled = (items = []) => items.filter(Boolean);

const extractContactDetails = (lines = []) => {
  const contactText = lines.join(' ');
  const email = contactText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone =
    contactText.match(/(\+?\d[\d\s\-()]{7,}\d)/)?.[0]?.trim() || '';
  const location = lines.find((line) => {
    if (!line) return false;
    if (email && line.includes(email)) return false;
    if (phone && line.includes(phone)) return false;
    return /(india|dehradun|uttarakhand|delhi|mumbai|bangalore|hyderabad|pune|remote|onsite|hybrid|[A-Z][a-z]+,\s*[A-Z][a-z]+)/i.test(
      line,
    );
  }) || '';

  return { email, phone, location };
};

const inferProfessionalTitle = (lines = []) =>
  lines.find((line) =>
    /(engineer|developer|analyst|intern|manager|designer|specialist|consultant|architect|undergraduate|student)/i.test(
      line,
    ),
  ) || '';

const splitSkillTokens = (lines = []) =>
  Array.from(
    new Set(
      lines
        .flatMap((line) => line.split(/[,|/]/))
        .map((skill) => skill.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean),
    ),
  ).slice(0, 16);

const inferSummary = (lines = [], title = '') => {
  const longLine = lines.find(
    (line) =>
      line.length > 70 &&
      !/^(contact|summary|experience|education|skills|projects|certifications|achievements)$/i.test(
        line,
      ),
  );

  if (longLine) {
    return longLine;
  }

  if (title) {
    return `Results-driven ${title.toLowerCase()} with relevant technical skills and hands-on project experience.`;
  }

  return 'Results-driven candidate with relevant technical skills and hands-on project experience.';
};

const buildExperienceItems = (lines = []) => {
  if (!lines.length) return [];

  const groups = [];
  let current = null;

  lines.forEach((line) => {
    const cleaned = line.replace(/^[-*]\s*/, '').trim();
    if (!cleaned) return;

    const looksLikeHeading =
      !line.startsWith('-') &&
      !line.startsWith('*') &&
      cleaned.length < 90 &&
      /(^[A-Z])/.test(cleaned);

    if (!current || looksLikeHeading) {
      if (current) groups.push(current);
      current = { heading: cleaned, details: [] };
      return;
    }

    current.details.push(cleaned);
  });

  if (current) groups.push(current);

  return groups.map((group) => {
    const metaLine =
      group.details.find((item) => /\b(20\d{2}|present|current|intern|remote|hybrid)\b/i.test(item)) || '';
    const detailLines = group.details.filter((item) => item !== metaLine);
    return {
      company: '',
      role: group.heading,
      startDate: '',
      endDate: metaLine,
      description: detailLines.join(' ').trim(),
    };
  });
};

const buildEducationItems = (lines = []) => {
  if (!lines.length) return [];

  return [
    {
      institution: lines[1] || '',
      degree: lines[0] || '',
      fieldOfStudy: lines[2] || '',
      startDate: '',
      endDate: lines.find((line) => /\b(20\d{2}|present|current)\b/i.test(line)) || '',
    },
  ];
};

const buildUploadedResumeJson = (text, originalName) => {
  const lines = sanitizeOptimizedLines(text);
  const introLines = [];
  const sectionMap = {};
  let currentSection = 'summary';
  sectionMap[currentSection] = [];

  lines.forEach((line) => {
    if (/^[A-Z][A-Z\s&/-]{2,}$/.test(line)) {
      currentSection = normalizeSectionName(line);
      if (!sectionMap[currentSection]) {
        sectionMap[currentSection] = [];
      }
      return;
    }

    if (currentSection === 'summary') {
      introLines.push(line);
    }

    sectionMap[currentSection].push(line.replace(/^[-*]\s*/, ''));
  });

  const derivedName = String(originalName || 'uploaded resume')
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();

  const introName =
    introLines.find((line) => /^[A-Z][A-Za-z\s.]{4,40}$/.test(line) && !/@/.test(line)) || '';
  const contactDetails = extractContactDetails([...(sectionMap.contact || []), ...lines]);
  const title = inferProfessionalTitle([...introLines, ...(sectionMap.summary || [])]);
  const skills = splitSkillTokens(sectionMap.skills || []);
  const experience = buildExperienceItems(sectionMap.experience || []);
  const education = buildEducationItems(sectionMap.education || []);
  const summaryLines = (sectionMap.summary || []).filter((line) => line.length > 25);

  return {
    personalInfo: {
      name: introName || derivedName,
      fullName: introName || derivedName,
      title,
      email: contactDetails.email,
      phone: contactDetails.phone,
      location: contactDetails.location,
    },
    summary: summaryLines.join(' ').trim() || inferSummary(lines, title),
    skills,
    experience,
    education,
    customSections: Object.entries(sectionMap)
      .filter(([key]) => !['summary', 'skills', 'experience', 'education', 'contact'].includes(key))
      .map(([key, values]) => ({
        title: key.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase()),
        items: values,
      })),
    raw_text: text,
  };
};

const stripScoreLanguage = (text = '') =>
  text
    .split('\n')
    .filter((line) => !/\b(score|gain|before|after)\b/i.test(line))
    .join('\n')
    .trim();

const scoreResumeSafely = async (resumeJson, jobDescription = null) => {
  try {
    return await calculateATSScore(resumeJson, jobDescription);
  } catch (error) {
    console.error('Primary ATS scoring failed, using local fallback:', error.message);
    return calculateATSScoreFallback(resumeJson, jobDescription);
  }
};

const scoreResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobDescription = req.body.jobDescription || null;

    // Fetch resume from database
    const resume = await resumeModel.getResumeByUserId(userId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Get resume JSON
    const resumeJson = resume.resume_json;

    // Calculate ATS score
    const scoreData = await scoreResumeSafely(resumeJson, jobDescription);

    // Check if optimization is needed
    const needsOptimization = scoreData.totalScore < 80;

    // Save score to database
    await resumeModel.updateATSScore(userId, scoreData.totalScore);

    return res.status(200).json({
      message: 'Resume scored successfully',
      totalScore: scoreData.totalScore,
      breakdown: scoreData.breakdown,
      missingKeywords: scoreData.missingKeywords,
      missingSections: scoreData.missingSections,
      needsOptimization,
      suggestions: needsOptimization ? {
        message: 'Your resume score is below 80. Consider optimizing it.',
        focus: scoreData.breakdown,
        missingItems: scoreData.missingSections
      } : null
    });
  } catch (error) {
    console.error('Score resume error:', error.message);
    return sendGeminiAwareError(res, error, 'Error scoring resume');
  }
};

const matchWithJD = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    let resumeJson;
    let fileName = null;

    if (req.file) {
      let text;
      try {
        text = await extractUploadedText(req.file);
      } catch (extractError) {
        console.error('Uploaded resume extraction warning:', extractError.message);
        text = req.file.originalname || 'uploaded resume';
      }
      resumeJson = buildUploadedResumeJson(text, req.file.originalname);
      fileName = req.file.originalname || 'uploaded_resume';
    } else {
      const userId = req.user.userId;
      const resume = await resumeModel.getResumeByUserId(userId);

      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      resumeJson = resume.resume_json;
    }

    let matchResult;
    try {
      matchResult = await matchResumeWithJD(resumeJson, jobDescription);
    } catch (matchError) {
      console.error('Primary JD matching failed, using local fallback:', matchError.message);
      matchResult = matchResumeWithJDFallback(resumeJson, jobDescription);
    }
    const isStrongMatch = matchResult.matchScore >= 70;

    return res.status(200).json({
      message: req.file
        ? 'Uploaded resume matched with job description'
        : 'Resume matched with job description',
      ...(fileName ? { fileName } : {}),
      matchScore: matchResult.matchScore,
      matchPercentage: matchResult.matchPercentage,
      isStrongMatch,
      matchedKeywords: matchResult.matchedKeywords,
      missingKeywords: matchResult.missingKeywords,
      criticalMissingKeywords: matchResult.criticalMissingKeywords,
      summary: matchResult.summary,
      recommendations: isStrongMatch 
        ? 'Your resume is a strong match for this position!'
        : `Focus on acquiring: ${matchResult.criticalMissingKeywords.slice(0, 3).join(', ')}`
    });
  } catch (error) {
    console.error('Match with JD error:', error.message);
    return sendGeminiAwareError(res, error, 'Error matching resume with job description');
  }
};

const scoreUploadedResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const text = await extractUploadedText(req.file);
    const fakeJson = buildUploadedResumeJson(text, req.file.originalname);

    const jobDescription = req.body.jobDescription || null;
    const scoreData = await scoreResumeSafely(fakeJson, jobDescription);
    const needsOptimization = scoreData.totalScore < 80;

    return res.status(200).json({
      message: 'Uploaded resume scored successfully',
      totalScore: scoreData.totalScore,
      breakdown: scoreData.breakdown,
      missingKeywords: scoreData.missingKeywords,
      missingSections: scoreData.missingSections,
      needsOptimization,
      suggestions: needsOptimization ? {
        message: 'Your resume score is below 80. Consider optimizing it.',
        focus: scoreData.breakdown,
        missingItems: scoreData.missingSections
      } : null
    });
  } catch (error) {
    console.error('Score uploaded resume error:', error.message);
    return sendGeminiAwareError(res, error, 'Error scoring uploaded file');
  }
};

const recommendJobsForUploadedResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const text = await extractUploadedText(req.file);
    const recommendations = await recommendJobsForResumeText(text);

    return res.status(200).json({
      message: 'Recommended jobs generated successfully',
      ...recommendations,
      fileName: req.file.originalname || 'uploaded_resume',
    });
  } catch (error) {
    console.error('Recommend jobs for uploaded resume error:', error.message);
    return sendGeminiAwareError(res, error, 'Error recommending jobs for uploaded resume');
  }
};

const optimizeUploadedResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const text = await extractUploadedText(req.file);
    const uploadedResumeJson = buildUploadedResumeJson(text, req.file.originalname);
    const originalScoreData = await scoreResumeSafely(uploadedResumeJson, null);

    const optimized = await optimizeUploadedResumeText(text, {
      totalScore: originalScoreData.totalScore,
      breakdown: originalScoreData.breakdown,
      missingKeywords: originalScoreData.missingKeywords,
      missingSections: originalScoreData.missingSections,
      targetScore: 90,
    });

    const bestOptimizedText = stripScoreLanguage(optimized.optimizedResumeText);
    const optimizedResumeJson =
      optimized.optimizedResumeData && typeof optimized.optimizedResumeData === 'object'
        ? {
            ...optimized.optimizedResumeData,
            raw_text: bestOptimizedText,
            personalInfo: {
              ...(optimized.optimizedResumeData.personalInfo || {}),
              name:
                optimized.optimizedResumeData.personalInfo?.fullName ||
                optimized.optimizedResumeData.personalInfo?.name ||
                req.file.originalname,
            },
            skills: Array.isArray(optimized.optimizedResumeData.skills)
              ? filterFilled(optimized.optimizedResumeData.skills)
              : [],
            experience: Array.isArray(optimized.optimizedResumeData.experience)
              ? optimized.optimizedResumeData.experience
              : [],
            education: Array.isArray(optimized.optimizedResumeData.education)
              ? optimized.optimizedResumeData.education
              : [],
            customSections: Array.isArray(optimized.optimizedResumeData.customSections)
              ? optimized.optimizedResumeData.customSections
              : [],
          }
        : buildUploadedResumeJson(bestOptimizedText, req.file.originalname);
    const optimizedScoreData = await scoreResumeSafely(optimizedResumeJson, null);

    return res.status(200).json({
      message: 'Uploaded resume optimized successfully',
      headline: optimized.headline,
      originalScore: originalScoreData.totalScore,
      optimizedScore: optimizedScoreData.totalScore,
      scoreGain: Math.round((optimizedScoreData.totalScore - originalScoreData.totalScore) * 100) / 100,
      keyChanges: optimized.keyChanges,
      optimizedResumeText: bestOptimizedText,
      optimizedResumeData: optimizedResumeJson,
      optimizedBreakdown: optimizedScoreData.breakdown,
      optimizedMissingKeywords: optimizedScoreData.missingKeywords,
      optimizedMissingSections: optimizedScoreData.missingSections,
      targetScoreReached: optimizedScoreData.totalScore >= 90,
      fileName: req.file.originalname || 'optimized_resume'
    });
  } catch (error) {
    console.error('Optimize uploaded resume error:', error.message);
    return sendGeminiAwareError(res, error, 'Error optimizing uploaded resume');
  }
};

module.exports = {
  scoreResume,
  scoreUploadedResume,
  matchWithJD,
  recommendJobsForUploadedResume,
  optimizeUploadedResume
};



