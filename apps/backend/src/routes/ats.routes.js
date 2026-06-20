const express = require('express');
const atsController = require('../controllers/ats.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadLimiter, aiLimiter } = require('../middleware/rateLimit.middleware');
const { createResumeUpload, handleUploadErrors, validateResumeUploadContent } = require('../middleware/upload.middleware');

const router = express.Router();
const uploadResume = createResumeUpload('resume');

// POST /ats/score-file - Score uploaded resume
router.post('/score-file', uploadLimiter, aiLimiter, uploadResume, handleUploadErrors, validateResumeUploadContent, atsController.scoreUploadedResume);

// POST /ats/optimize-file - Optimize uploaded resume
router.post('/optimize-file', uploadLimiter, aiLimiter, uploadResume, handleUploadErrors, validateResumeUploadContent, atsController.optimizeUploadedResume);

// Protect saved-resume and gated ATS routes with auth middleware
router.use(authMiddleware);

// POST /ats/score - Score saved resume
router.post('/score', aiLimiter, atsController.scoreResume);

// POST /ats/recommend-jobs-file - Recommend jobs from uploaded resume
router.post('/recommend-jobs-file', uploadLimiter, aiLimiter, uploadResume, handleUploadErrors, validateResumeUploadContent, atsController.recommendJobsForUploadedResume);

// POST /ats/jd-match - Match resume with job description
router.post('/jd-match', uploadLimiter, aiLimiter, uploadResume, handleUploadErrors, validateResumeUploadContent, atsController.matchWithJD);

module.exports = router;
