const pool = require('../config/db');

const createResume = async (userId, resumeJson) => {
  try {
    const query = 'INSERT INTO resumes (user_id, resume_json, created_at) VALUES (?, ?, NOW())';
    const [result] = await pool.execute(query, [userId, JSON.stringify(resumeJson)]);
    return result;
  } catch (error) {
    throw new Error(`Error creating resume: ${error.message}`);
  }
};

const updateResume = async (userId, resumeJson) => {
  try {
    const query = 'UPDATE resumes SET resume_json = ?, updated_at = NOW() WHERE user_id = ?';
    const [result] = await pool.execute(query, [JSON.stringify(resumeJson), userId]);
    return result;
  } catch (error) {
    throw new Error(`Error updating resume: ${error.message}`);
  }
};

const getResumeByUserId = async (userId) => {
  try {
    const query = 'SELECT * FROM resumes WHERE user_id = ?';
    const [rows] = await pool.execute(query, [userId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    // Parse JSON if it's stored as string
    const resume = rows[0];
    if (typeof resume.resume_json === 'string') {
      resume.resume_json = JSON.parse(resume.resume_json);
    }
    
    return resume;
  } catch (error) {
    throw new Error(`Error fetching resume: ${error.message}`);
  }
};

const updateATSScore = async (userId, score) => {
  try {
    const query = 'UPDATE resumes SET ats_score = ?, updated_at = NOW() WHERE user_id = ?';
    const [result] = await pool.execute(query, [score, userId]);
    return result;
  } catch (error) {
    throw new Error(`Error updating ATS score: ${error.message}`);
  }
};

module.exports = {
  createResume,
  updateResume,
  getResumeByUserId,
  updateATSScore,
};
