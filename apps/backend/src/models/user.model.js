const pool = require('../config/db');

const createUser = async (name, email, passwordHash) => {
  try {
    const query = 'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, NOW())';
    const [result] = await pool.execute(query, [name, email, passwordHash]);
    return result;
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
};

const findUserByEmail = async (email) => {
  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Error finding user by email: ${error.message}`);
  }
};

const findUserById = async (id) => {
  try {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Error finding user by id: ${error.message}`);
  }
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};
