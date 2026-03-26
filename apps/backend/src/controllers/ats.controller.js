const resumeModel = require('../models/resume.model');
const { calculateATSScore } = require('../services/ats.service');
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

const buildUploadedResumeJson = (text, originalName) => ({
  personalInfo: { name: originalName },
  raw_text: text,
  experience: text.toLowerCase().includes('experience') ? [{}] : undefined,
  education: text.toLowerCase().includes('education') ? [{}] : undefined,
  skills: text.toLowerCase().includes('skills') ? [{}] : undefined,
});

const stripScoreLanguage = (text = '') =>
  text
    .split('\n')
    .filter((line) => !/\b(score|gain|before|after)\b/i.test(line))
    .join('\n')
    .trim();

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
    const scoreData = await calculateATSScore(resumeJson, jobDescription);

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
    const scoreData = await calculateATSScore(fakeJson, jobDescription);
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
    const originalScoreData = await calculateATSScore(uploadedResumeJson, null);

    const optimized = await optimizeUploadedResumeText(text, {
      totalScore: originalScoreData.totalScore,
      breakdown: originalScoreData.breakdown,
      missingKeywords: originalScoreData.missingKeywords,
      missingSections: originalScoreData.missingSections,
      targetScore: 90,
    });

    const bestOptimizedText = stripScoreLanguage(optimized.optimizedResumeText);
    const optimizedResumeJson = buildUploadedResumeJson(bestOptimizedText, req.file.originalname);
    const optimizedScoreData = await calculateATSScore(optimizedResumeJson, null);

    return res.status(200).json({
      message: 'Uploaded resume optimized successfully',
      headline: optimized.headline,
      originalScore: originalScoreData.totalScore,
      optimizedScore: optimizedScoreData.totalScore,
      scoreGain: Math.round((optimizedScoreData.totalScore - originalScoreData.totalScore) * 100) / 100,
      keyChanges: optimized.keyChanges,
      optimizedResumeText: bestOptimizedText,
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



