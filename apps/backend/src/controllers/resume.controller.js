const resumeModel = require('../models/resume.model');
const { sanitizeResumePayload } = require('../utils/sanitizeResume');
const { parseResumeForBuilder } = require('../services/gemini.service');
const { withOptionalDetails } = require('../utils/safeError');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const sanitizeExtractedResumeText = (text = '') => {
  const normalized = String(text || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !/^(%PDF|obj\b|endobj\b|xref\b|trailer\b|startxref\b|stream\b|endstream\b)/i.test(line) &&
        !/[<>]{2,}/.test(line) &&
        !/^\/[A-Z]/.test(line) &&
        !/(Producer|Creator|CreationDate|ModDate|Type|Length|Filter|Contents)/i.test(line),
    )
    .filter((line) => /[A-Za-z]/.test(line))
    .map((line) => line.replace(/\s+/g, ' ').trim());

  const cleaned = normalized.join('\n').trim();
  return cleaned.length >= 80 ? cleaned : '';
};

const extractUploadedText = async (file) => {
  if (!file) {
    throw new Error('No resume file uploaded');
  }

  let text = '';
  if (file.mimetype === 'application/pdf') {
    let parser;

    try {
      parser = new PDFParse({ data: file.buffer });
      const pdfData = await parser.getText();
      text = pdfData?.text || '';
    } catch (pdfError) {
      console.error('PDF parsing warning:', pdfError.message);
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        await parser.destroy().catch(() => {});
      }
    }
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result?.value || '';
    } catch (docxError) {
      console.error('DOCX parsing warning:', docxError.message);
      throw new Error('Unable to extract text from this DOCX file. Please try PDF, TXT, or a simpler DOCX export.');
    }
  } else if (file.mimetype === 'text/plain') {
    text = file.buffer.toString('utf-8');
  } else {
    throw new Error('Unsupported resume file type. Please upload PDF, DOCX, or TXT.');
  }

  const cleanedText = sanitizeExtractedResumeText(text);
  if (!cleanedText) {
    throw new Error(
      'This resume does not contain enough selectable text to import reliably. Please upload the original PDF/DOCX/TXT resume instead of a scanned image or screenshot-style PDF.',
    );
  }

  return cleanedText;
};

const getResumeIdParam = (req) => {
  const resumeId = Number(req.params.resumeId);
  return Number.isInteger(resumeId) && resumeId > 0 ? resumeId : null;
};

const saveResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeJson = sanitizeResumePayload(req.body);

    if (!resumeJson || Object.keys(resumeJson).length === 0) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const existingResume = await resumeModel.getResumeByUserId(userId);

    if (existingResume) {
      await resumeModel.updateResume(userId, resumeJson);
      return res.status(200).json({
        message: 'Resume updated successfully',
        userId,
        resumeId: existingResume.id,
      });
    }

    const result = await resumeModel.createResume(userId, resumeJson, { isActive: true });
    return res.status(201).json({
      message: 'Resume created successfully',
      userId,
      resumeId: result.insertId,
    });
  } catch (error) {
    console.error('Save resume error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const listResumeDrafts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const drafts = await resumeModel.listResumesByUserId(userId);

    return res.status(200).json({
      message: 'Resume drafts fetched successfully',
      resumes: drafts,
    });
  } catch (error) {
    console.error('List resume drafts error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const createResumeDraft = async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeJson = sanitizeResumePayload(req.body);

    if (!resumeJson || Object.keys(resumeJson).length === 0) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const result = await resumeModel.createResume(userId, resumeJson, { status: 'draft', isActive: false });

    return res.status(201).json({
      message: 'Draft saved successfully',
      userId,
      resumeId: result.insertId,
    });
  } catch (error) {
    console.error('Create resume draft error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const resume = await resumeModel.getResumeByUserId(userId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.status(200).json({
      message: 'Resume fetched successfully',
      resumeId: resume.id,
      resume: resume.resume_json,
      atsScore: resume.ats_score,
      createdAt: resume.created_at,
      updatedAt: resume.updated_at,
    });
  } catch (error) {
    console.error('Get resume error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getResumeDraft = async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeId = getResumeIdParam(req);

    if (!resumeId) {
      return res.status(400).json({ error: 'Valid resume id is required' });
    }

    const resume = await resumeModel.getResumeByIdForUser(userId, resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    await resumeModel.setActiveResumeForUser(userId, resumeId);

    return res.status(200).json({
      message: 'Resume draft fetched successfully',
      resumeId: resume.id,
      resume: resume.resume_json,
      atsScore: resume.ats_score,
      createdAt: resume.created_at,
      updatedAt: resume.updated_at,
    });
  } catch (error) {
    console.error('Get resume draft error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateResumeDraft = async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeId = getResumeIdParam(req);
    const resumeJson = sanitizeResumePayload(req.body);

    if (!resumeId) {
      return res.status(400).json({ error: 'Valid resume id is required' });
    }

    if (!resumeJson || Object.keys(resumeJson).length === 0) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const result = await resumeModel.updateResumeByIdForUser(userId, resumeId, resumeJson, { status: 'draft' });
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.status(200).json({
      message: 'Draft saved successfully',
      userId,
      resumeId,
    });
  } catch (error) {
    console.error('Update resume draft error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const discardResumeDraft = async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeId = getResumeIdParam(req);

    if (!resumeId) {
      return res.status(400).json({ error: 'Valid resume id is required' });
    }

    const result = await resumeModel.discardResumeByIdForUser(userId, resumeId);
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.status(200).json({
      message: 'Resume discarded successfully',
      resumeId,
    });
  } catch (error) {
    console.error('Discard resume draft error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const importResumeFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const extractedText = await extractUploadedText(req.file);
    const parsed = await parseResumeForBuilder(extractedText, req.file.originalname || 'uploaded resume');

    return res.status(200).json({
      message: 'Resume parsed successfully',
      resume: parsed.resumeData,
      extractedText,
      fileName: req.file.originalname || 'uploaded resume',
    });
  } catch (error) {
    console.error('Import resume from file error:', error.message);
    if (/does not contain enough selectable text/i.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json(withOptionalDetails({
      error: 'Unable to parse the uploaded resume right now.',
    }, error));
  }
};

module.exports = {
  saveResume,
  getResume,
  listResumeDrafts,
  createResumeDraft,
  getResumeDraft,
  updateResumeDraft,
  discardResumeDraft,
  importResumeFromFile,
};
