const {
  generateSummary,
  suggestSkills,
  diagnoseResume,
  optimizeResume
} = require('../services/gemini.service');
const resumeModel = require('../models/resume.model');
const { sanitizeResumePayload } = require('../utils/sanitizeResume');

const generateSummaryController = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const resumeData = sanitizeResumePayload(req.body.resumeData);

    // Validate input
    if (!resumeData || typeof resumeData !== 'object') {
      return res.status(400).json({ error: 'Valid resume data is required' });
    }

    // Call Gemini service
    const result = await generateSummary(resumeData);

    return res.status(200).json({
      message: 'Summary generated successfully',
      summary: result.summary,
      userId
    });
  } catch (error) {
    console.error('Generate summary error:', error.message);
    return res.status(500).json({ error: 'Error generating summary' });
  }
};

const suggestSkillsController = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const existingSkills = sanitizeResumePayload(req.body.existingSkills || []);
    const resumeData = sanitizeResumePayload(req.body.resumeData);

    // Validate input
    if (!resumeData || typeof resumeData !== 'object') {
      return res.status(400).json({
        error: 'Valid resume data is required'
      });
    }

    // Call Gemini service
    const result = await suggestSkills(resumeData, existingSkills);

    return res.status(200).json({
      message: 'Skills suggested successfully',
      currentSkills: existingSkills,
      suggestedSkills: result.suggestedSkills,
      reasoning: result.reasoning,
      userId
    });
  } catch (error) {
    console.error('Suggest skills error:', error.message);
    return res.status(500).json({ error: 'Error suggesting skills' });
  }
};

const optimizeResumeController = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const resumeData = sanitizeResumePayload(req.body.resumeData);
    const jobDescription = sanitizeResumePayload(req.body.jobDescription || null);

    // Validate input
    if (!resumeData || typeof resumeData !== 'object') {
      return res.status(400).json({ error: 'Valid resume data is required' });
    }

    // Call Gemini service
    const result = await optimizeResume(resumeData, jobDescription || null);

    return res.status(200).json({
      message: 'Resume optimization suggestions generated',
      improvements: result.improvements,
      priorityImprovements: result.priorityImprovements,
      overallAssessment: result.overallAssessment,
      userId
    });
  } catch (error) {
    console.error('Optimize resume error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Error optimizing resume',
      details: error.message
    });
  }
};

const diagnoseResumeController = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const resumeData = sanitizeResumePayload(req.body.resumeData);

    // Validate input
    if (!resumeData || typeof resumeData !== 'object') {
      return res.status(400).json({ error: 'Valid resume data is required' });
    }

    // Call Gemini service
    const result = await diagnoseResume(resumeData);

    return res.status(200).json({
      message: 'Resume diagnosis completed',
      issues: result.issues,
      severity: result.severity,
      recommendations: result.recommendations,
      strengths: result.strengths,
      userId
    });
  } catch (error) {
    console.error('Diagnose resume error:', error.message);
    return res.status(500).json({ error: 'Error diagnosing resume' });
  }
};

module.exports = {
  generateSummary: generateSummaryController,
  suggestSkills: suggestSkillsController,
  optimizeResume: optimizeResumeController,
  diagnoseResume: diagnoseResumeController
};
