const express = require('express');
const resumeController = require('../controllers/resume.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const { resumeSchema } = require('../validators/resume.validator');

const router = express.Router();

// Protect all routes with auth middleware
router.use(authMiddleware);

// GET /resume - Get user's resume
router.get('/', resumeController.getResume);

// POST /resume - Save/Update user's resume (validate payload)
router.post('/', validateBody(resumeSchema), resumeController.saveResume);

module.exports = router;
