const resumeModel = require('../models/resume.model');
const { sanitizeResumePayload } = require('../utils/sanitizeResume');

const saveResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeJson = sanitizeResumePayload(req.body);

    if (!resumeJson || Object.keys(resumeJson).length === 0) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    // Check if resume exists
    const existingResume = await resumeModel.getResumeByUserId(userId);

    if (existingResume) {
      // Update existing resume
      await resumeModel.updateResume(userId, resumeJson);
      return res.status(200).json({
        message: 'Resume updated successfully',
        userId,
      });
    } else {
      // Create new resume
      const result = await resumeModel.createResume(userId, resumeJson);
      return res.status(201).json({
        message: 'Resume created successfully',
        userId,
        resumeId: result.insertId,
      });
    }
  } catch (error) {
    console.error('Save resume error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getResume = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch resume
    const resume = await resumeModel.getResumeByUserId(userId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.status(200).json({
      message: 'Resume fetched successfully',
      resume: resume.resume_json,
      atsScore: resume.ats_score,
      createdAt: resume.created_at,
      updatedAt: resume.updated_at,
    });
  } catch (error) {
    console.error('Get resume error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  saveResume,
  getResume,
};
