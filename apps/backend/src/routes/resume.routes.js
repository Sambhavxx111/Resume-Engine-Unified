const express = require('express');
const resumeController = require('../controllers/resume.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const { resumeSchema } = require('../validators/resume.validator');
const { uploadLimiter, aiLimiter } = require('../middleware/rateLimit.middleware');
const { createResumeUpload, handleUploadErrors, validateResumeUploadContent } = require('../middleware/upload.middleware');

const router = express.Router();
const uploadFile = createResumeUpload('file');

// POST /resume/import-file - Parse uploaded resume into builder structure
router.post('/import-file', uploadLimiter, aiLimiter, uploadFile, handleUploadErrors, validateResumeUploadContent, resumeController.importResumeFromFile);

// Protect saved-resume routes with auth middleware
router.use(authMiddleware);

// GET /resume - Get user's resume
router.get('/', resumeController.getResume);

// POST /resume - Save/Update user's resume (validate payload)
router.post('/', validateBody(resumeSchema), resumeController.saveResume);

module.exports = router;
