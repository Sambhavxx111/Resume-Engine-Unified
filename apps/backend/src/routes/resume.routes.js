const express = require('express');
const multer = require('multer');
const resumeController = require('../controllers/resume.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const { resumeSchema } = require('../validators/resume.validator');

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

// POST /resume/import-file - Parse uploaded resume into builder structure
router.post('/import-file', upload.single('file'), resumeController.importResumeFromFile);

// Protect saved-resume routes with auth middleware
router.use(authMiddleware);

// GET /resume - Get user's resume
router.get('/', resumeController.getResume);

// POST /resume - Save/Update user's resume (validate payload)
router.post('/', validateBody(resumeSchema), resumeController.saveResume);

module.exports = router;
