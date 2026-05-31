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

// GET /resume/drafts - List saved drafts without loading one automatically
router.get('/drafts', resumeController.listResumeDrafts);

// POST /resume/drafts - Create a new draft
router.post('/drafts', validateBody(resumeSchema), resumeController.createResumeDraft);

// GET /resume/:resumeId - Fetch a specific draft owned by the current user
router.get('/:resumeId', resumeController.getResumeDraft);

// PUT /resume/:resumeId - Update a specific draft owned by the current user
router.put('/:resumeId', validateBody(resumeSchema), resumeController.updateResumeDraft);

// DELETE /resume/:resumeId - Discard a specific draft owned by the current user
router.delete('/:resumeId', resumeController.discardResumeDraft);

// POST /resume - Save/Update user's resume (validate payload)
router.post('/', validateBody(resumeSchema), resumeController.saveResume);

module.exports = router;
