const express = require('express');
const multer = require('multer');
const atsController = require('../controllers/ats.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();
const MAX_UPLOAD_SIZE_BYTES = parseInt(process.env.MAX_RESUME_UPLOAD_BYTES || `${5 * 1024 * 1024}`, 10);
const allowedMimeTypes = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number.isFinite(MAX_UPLOAD_SIZE_BYTES) ? MAX_UPLOAD_SIZE_BYTES : 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Unsupported resume file type'));
    }
    cb(null, true);
  },
});

// Protect all routes with auth middleware
router.use(authMiddleware);

// POST /ats/score - Score resume
router.post('/score', atsController.scoreResume);

// POST /ats/score-file - Score uploaded resume
router.post('/score-file', upload.single('resume'), atsController.scoreUploadedResume);

// POST /ats/optimize-file - Optimize uploaded resume
router.post('/optimize-file', upload.single('resume'), atsController.optimizeUploadedResume);

// POST /ats/recommend-jobs-file - Recommend jobs from uploaded resume
router.post('/recommend-jobs-file', upload.single('resume'), atsController.recommendJobsForUploadedResume);

// POST /ats/jd-match - Match resume with job description
router.post('/jd-match', upload.single('resume'), atsController.matchWithJD);

module.exports = router;
