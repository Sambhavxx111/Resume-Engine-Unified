const multer = require('multer');
const { logSecurityEvent } = require('../utils/securityLogger');

const MAX_UPLOAD_SIZE_BYTES = parseInt(process.env.MAX_RESUME_UPLOAD_BYTES || `${5 * 1024 * 1024}`, 10);
const RESUME_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const allowedExtensions = new Set(['.pdf', '.txt', '.doc', '.docx']);

const hasAllowedExtension = (fileName = '') => {
  const lower = String(fileName || '').toLowerCase();
  return Array.from(allowedExtensions).some((extension) => lower.endsWith(extension));
};

const createResumeUpload = (fieldName) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: Number.isFinite(MAX_UPLOAD_SIZE_BYTES) ? MAX_UPLOAD_SIZE_BYTES : 5 * 1024 * 1024,
      files: 1,
      fields: 8,
      fieldSize: 100 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (!RESUME_MIME_TYPES.has(file.mimetype) || !hasAllowedExtension(file.originalname)) {
        logSecurityEvent('blocked_upload_type', req, {
          mimetype: file.mimetype,
          originalname: file.originalname,
        });
        return cb(new Error('Unsupported resume file type'));
      }

      cb(null, true);
    },
  });

  return upload.single(fieldName);
};

const handleUploadErrors = (error, req, res, next) => {
  if (!error) return next();

  if (error instanceof multer.MulterError || /Unsupported resume file type/i.test(error.message)) {
    logSecurityEvent('blocked_upload', req, { reason: error.message });
    return res.status(400).json({ error: error.message });
  }

  return next(error);
};

module.exports = {
  createResumeUpload,
  handleUploadErrors,
};
