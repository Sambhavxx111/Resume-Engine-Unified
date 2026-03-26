const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const { resumeDataSchema, suggestSkillsSchema, optimizeSchema } = require('../validators/ai.validator');

const router = express.Router();

// Protect all routes with auth middleware
router.use(authMiddleware);

// Apply strict rate limiting to AI routes only
const aiLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: parseInt(process.env.AI_RATE_LIMIT_MAX || '10', 10),
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many requests to AI endpoints. Please try again later.' }
});

router.use(aiLimiter);

// POST /ai/summary - Generate resume summary
router.post('/summary', validateBody(resumeDataSchema), aiController.generateSummary);

// POST /ai/skills - Suggest skills
router.post('/skills', validateBody(suggestSkillsSchema), aiController.suggestSkills);

// POST /ai/optimize - Optimize resume
router.post('/optimize', validateBody(optimizeSchema), aiController.optimizeResume);

module.exports = router;
