const pool = require('../config/db');

const parseResumeRow = (row) => {
  if (!row) {
    return null;
  }

  const resume = { ...row };
  if (typeof resume.resume_json === 'string') {
    resume.resume_json = JSON.parse(resume.resume_json);
  }

  return resume;
};

const deriveResumeTitle = (resumeJson = {}) => {
  const personalInfo = resumeJson.personalInfo || {};
  const name = String(personalInfo.fullName || personalInfo.name || '').replace(/\s+/g, ' ').trim();
  const title = String(personalInfo.title || '').replace(/\s+/g, ' ').trim();

  if (name && title) {
    return `${name} - ${title}`.slice(0, 255);
  }

  return (name || title || 'Untitled resume').slice(0, 255);
};

const listResumesByUserId = async (userId) => {
  try {
    const [rows] = await pool.execute(
      `
        SELECT id, title, status, is_active, ats_score, created_at, updated_at
        FROM resumes
        WHERE user_id = ? AND deleted_at IS NULL AND status <> 'discarded'
        ORDER BY updated_at DESC, id DESC
      `,
      [userId],
    );

    return rows;
  } catch (error) {
    throw new Error(`Error listing resumes: ${error.message}`);
  }
};

const createResume = async (userId, resumeJson, options = {}) => {
  try {
    const title = options.title || deriveResumeTitle(resumeJson);
    const status = options.status || 'draft';
    const isActive = options.isActive ? 1 : 0;
    const query = `
      INSERT INTO resumes (user_id, resume_json, title, status, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [userId, JSON.stringify(resumeJson), title, status, isActive]);
    return result;
  } catch (error) {
    throw new Error(`Error creating resume: ${error.message}`);
  }
};

const updateResumeByIdForUser = async (userId, resumeId, resumeJson, options = {}) => {
  try {
    const title = options.title || deriveResumeTitle(resumeJson);
    const status = options.status || 'draft';
    const query = `
      UPDATE resumes
      SET resume_json = ?, title = ?, status = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `;
    const [result] = await pool.execute(query, [JSON.stringify(resumeJson), title, status, resumeId, userId]);
    return result;
  } catch (error) {
    throw new Error(`Error updating resume: ${error.message}`);
  }
};

const updateResume = async (userId, resumeJson) => {
  try {
    const existingResume = await getResumeByUserId(userId);
    if (!existingResume) {
      return createResume(userId, resumeJson, { isActive: true });
    }

    return updateResumeByIdForUser(userId, existingResume.id, resumeJson, {
      title: deriveResumeTitle(resumeJson),
      status: existingResume.status || 'draft',
    });
  } catch (error) {
    throw new Error(`Error updating resume: ${error.message}`);
  }
};

const getResumeByUserId = async (userId) => {
  try {
    const query = `
      SELECT *
      FROM resumes
      WHERE user_id = ? AND deleted_at IS NULL AND status <> 'discarded'
      ORDER BY is_active DESC, updated_at DESC, id DESC
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [userId]);

    return parseResumeRow(rows[0]);
  } catch (error) {
    throw new Error(`Error fetching resume: ${error.message}`);
  }
};

const getResumeByIdForUser = async (userId, resumeId) => {
  try {
    const query = `
      SELECT *
      FROM resumes
      WHERE id = ? AND user_id = ? AND deleted_at IS NULL AND status <> 'discarded'
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [resumeId, userId]);

    return parseResumeRow(rows[0]);
  } catch (error) {
    throw new Error(`Error fetching resume: ${error.message}`);
  }
};

const setActiveResumeForUser = async (userId, resumeId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute('UPDATE resumes SET is_active = 0 WHERE user_id = ?', [userId]);
    const [result] = await connection.execute(
      'UPDATE resumes SET is_active = 1, updated_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [resumeId, userId],
    );
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw new Error(`Error activating resume: ${error.message}`);
  } finally {
    connection.release();
  }
};

const discardResumeByIdForUser = async (userId, resumeId) => {
  try {
    const query = `
      UPDATE resumes
      SET status = 'discarded', is_active = 0, deleted_at = NOW(), updated_at = NOW()
      WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `;
    const [result] = await pool.execute(query, [resumeId, userId]);
    return result;
  } catch (error) {
    throw new Error(`Error discarding resume: ${error.message}`);
  }
};

const updateATSScore = async (userId, score) => {
  try {
    const existingResume = await getResumeByUserId(userId);
    if (!existingResume) {
      return { affectedRows: 0 };
    }

    const query = 'UPDATE resumes SET ats_score = ?, updated_at = NOW() WHERE id = ? AND user_id = ?';
    const [result] = await pool.execute(query, [score, existingResume.id, userId]);
    return result;
  } catch (error) {
    throw new Error(`Error updating ATS score: ${error.message}`);
  }
};

module.exports = {
  createResume,
  updateResume,
  updateResumeByIdForUser,
  getResumeByUserId,
  getResumeByIdForUser,
  listResumesByUserId,
  setActiveResumeForUser,
  discardResumeByIdForUser,
  updateATSScore,
};
