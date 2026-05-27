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
const dangerousInnerExtensions = new Set([
  '.ade',
  '.adp',
  '.apk',
  '.app',
  '.bat',
  '.bin',
  '.cmd',
  '.com',
  '.cpl',
  '.dll',
  '.dmg',
  '.exe',
  '.hta',
  '.jar',
  '.js',
  '.jse',
  '.lnk',
  '.msi',
  '.ps1',
  '.scr',
  '.sh',
  '.vbe',
  '.vbs',
  '.wsf',
]);

const hasAllowedExtension = (fileName = '') => {
  const lower = String(fileName || '').toLowerCase();
  return Array.from(allowedExtensions).some((extension) => lower.endsWith(extension));
};

const getExtensionParts = (fileName = '') =>
  String(fileName || '')
    .toLowerCase()
    .split(/[\\/]/)
    .pop()
    .split('.')
    .filter(Boolean)
    .slice(1)
    .map((part) => `.${part}`);

const hasDangerousDoubleExtension = (fileName = '') => {
  const parts = getExtensionParts(fileName);
  if (parts.length <= 1) return false;
  return parts.slice(0, -1).some((extension) => dangerousInnerExtensions.has(extension));
};

const isPdf = (buffer) => buffer && buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF';

const isZipBasedOfficeFile = (buffer) =>
  buffer &&
  buffer.length >= 4 &&
  buffer[0] === 0x50 &&
  buffer[1] === 0x4b &&
  (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
  (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

const isReasonableTextFile = (buffer) => {
  if (!buffer || !buffer.length) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  if (sample.includes(0x00)) return false;
  const suspiciousBytes = Array.from(sample).filter((byte) => byte < 0x09 || (byte > 0x0d && byte < 0x20));
  return suspiciousBytes.length / sample.length < 0.02;
};

const validateResumeUploadContent = (req, res, next) => {
  if (!req.file) return next();

  const originalName = req.file.originalname || '';
  const lowerName = originalName.toLowerCase();
  let validContent = false;

  if (hasDangerousDoubleExtension(originalName)) {
    logSecurityEvent('blocked_upload_double_extension', req, { originalname: originalName });
    return res.status(400).json({ error: 'Unsupported resume file type' });
  }

  if (req.file.mimetype === 'application/pdf' && lowerName.endsWith('.pdf')) {
    validContent = isPdf(req.file.buffer);
  } else if (
    req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
    lowerName.endsWith('.docx')
  ) {
    validContent = isZipBasedOfficeFile(req.file.buffer);
  } else if (req.file.mimetype === 'text/plain' && lowerName.endsWith('.txt')) {
    validContent = isReasonableTextFile(req.file.buffer);
  } else if (req.file.mimetype === 'application/msword' && lowerName.endsWith('.doc')) {
    validContent = isReasonableTextFile(req.file.buffer) || Boolean(req.file.buffer?.length);
  }

  if (!validContent) {
    logSecurityEvent('blocked_upload_content_mismatch', req, {
      mimetype: req.file.mimetype,
      originalname: originalName,
    });
    return res.status(400).json({ error: 'Uploaded file content does not match the declared resume type' });
  }

  return next();
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
  validateResumeUploadContent,
};
