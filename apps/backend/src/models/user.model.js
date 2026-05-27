const pool = require('../config/db');

const addColumnIfMissing = async (table, column, definition) => {
  try {
    await pool.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      throw error;
    }
  }
};

const ensureAuthSchema = async () => {
  await addColumnIfMissing('users', 'email_verified_at', 'DATETIME NULL');
  await addColumnIfMissing('users', 'email_verification_token_hash', 'VARCHAR(255) NULL');
  await addColumnIfMissing('users', 'email_verification_expires_at', 'DATETIME NULL');
  await addColumnIfMissing('users', 'password_reset_token_hash', 'VARCHAR(255) NULL');
  await addColumnIfMissing('users', 'password_reset_expires_at', 'DATETIME NULL');
  await addColumnIfMissing('users', 'failed_login_attempts', 'INT NOT NULL DEFAULT 0');
  await addColumnIfMissing('users', 'locked_until', 'DATETIME NULL');
  await addColumnIfMissing('users', 'last_login_at', 'DATETIME NULL');
  await pool.execute(`
    UPDATE users
    SET email_verified_at = COALESCE(email_verified_at, created_at, NOW())
    WHERE email_verified_at IS NULL
      AND email_verification_token_hash IS NULL
  `);
};

const createUser = async (name, email, passwordHash, verificationTokenHash, verificationExpiresAt) => {
  try {
    const query = `
      INSERT INTO users
        (name, email, password_hash, email_verification_token_hash, email_verification_expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await pool.execute(query, [
      name,
      email,
      passwordHash,
      verificationTokenHash,
      verificationExpiresAt,
    ]);
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

const markEmailVerified = async (tokenHash) => {
  try {
    const query = `
      UPDATE users
      SET email_verified_at = NOW(),
          email_verification_token_hash = NULL,
          email_verification_expires_at = NULL
      WHERE email_verification_token_hash = ?
        AND email_verification_expires_at > NOW()
    `;
    const [result] = await pool.execute(query, [tokenHash]);
    return result;
  } catch (error) {
    throw new Error(`Error verifying email: ${error.message}`);
  }
};

const storeEmailVerificationToken = async (email, tokenHash, expiresAt) => {
  try {
    const query = `
      UPDATE users
      SET email_verification_token_hash = ?, email_verification_expires_at = ?
      WHERE email = ?
        AND email_verified_at IS NULL
    `;
    const [result] = await pool.execute(query, [tokenHash, expiresAt, email]);
    return result;
  } catch (error) {
    throw new Error(`Error storing email verification token: ${error.message}`);
  }
};

const storePasswordResetToken = async (email, tokenHash, expiresAt) => {
  try {
    const query = `
      UPDATE users
      SET password_reset_token_hash = ?, password_reset_expires_at = ?
      WHERE email = ?
    `;
    const [result] = await pool.execute(query, [tokenHash, expiresAt, email]);
    return result;
  } catch (error) {
    throw new Error(`Error storing password reset token: ${error.message}`);
  }
};

const resetPasswordByToken = async (tokenHash, passwordHash) => {
  try {
    const query = `
      UPDATE users
      SET password_hash = ?,
          password_reset_token_hash = NULL,
          password_reset_expires_at = NULL,
          failed_login_attempts = 0,
          locked_until = NULL
      WHERE password_reset_token_hash = ?
        AND password_reset_expires_at > NOW()
    `;
    const [result] = await pool.execute(query, [passwordHash, tokenHash]);
    return result;
  } catch (error) {
    throw new Error(`Error resetting password: ${error.message}`);
  }
};

const recordFailedLogin = async (userId, maxAttempts = 5, lockMinutes = 15) => {
  try {
    const query = `
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE
            WHEN failed_login_attempts + 1 >= ? THEN DATE_ADD(NOW(), INTERVAL ? MINUTE)
            ELSE locked_until
          END
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [maxAttempts, lockMinutes, userId]);
    return result;
  } catch (error) {
    throw new Error(`Error recording failed login: ${error.message}`);
  }
};

const recordSuccessfulLogin = async (userId) => {
  try {
    const query = `
      UPDATE users
      SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [userId]);
    return result;
  } catch (error) {
    throw new Error(`Error recording successful login: ${error.message}`);
  }
};

module.exports = {
  ensureAuthSchema,
  createUser,
  findUserByEmail,
  findUserById,
  markEmailVerified,
  storeEmailVerificationToken,
  storePasswordResetToken,
  resetPasswordByToken,
  recordFailedLogin,
  recordSuccessfulLogin,
};
