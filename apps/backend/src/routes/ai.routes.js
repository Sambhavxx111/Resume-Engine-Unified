const express = require('express');
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const { resumeDataSchema, suggestSkillsSchema, optimizeSchema } = require('../validators/ai.validator');
const { aiLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// Allow guests to use AI tools while still attaching auth when available.
router.use(authMiddleware.optionalAuthMiddleware);

router.use(aiLimiter);

// POST /ai/summary - Generate resume summary
router.post('/summary', validateBody(resumeDataSchema), aiController.generateSummary);

// POST /ai/skills - Suggest skills
router.post('/skills', validateBody(suggestSkillsSchema), aiController.suggestSkills);

// POST /ai/optimize - Optimize resume
router.post('/optimize', validateBody(optimizeSchema), aiController.optimizeResume);

module.exports = router;
