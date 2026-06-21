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
  await addColumnIfMissing('users', 'email_otp_hash', 'VARCHAR(255) NULL');
  await addColumnIfMissing('users', 'email_otp_expires_at', 'DATETIME NULL');
  await addColumnIfMissing('users', 'email_otp_attempts', 'INT NOT NULL DEFAULT 0');
  await addColumnIfMissing('users', 'email_otp_last_sent_at', 'DATETIME NULL');
  await addColumnIfMissing('users', 'google_id', 'VARCHAR(255) NULL');
  await addColumnIfMissing('users', 'auth_provider', "VARCHAR(50) NOT NULL DEFAULT 'email'");
  await pool.execute(`
    UPDATE users
    SET email_verified_at = COALESCE(email_verified_at, created_at, NOW())
    WHERE email_verified_at IS NULL
      AND email_verification_token_hash IS NULL
  `);
};

const createUser = async (name, email, passwordHash, verificationTokenHash, verificationExpiresAt, otpHash = null, otpExpiresAt = null) => {
  try {
    const query = `
      INSERT INTO users
        (name, email, password_hash, email_verification_token_hash, email_verification_expires_at, email_otp_hash, email_otp_expires_at, email_otp_attempts, email_otp_last_sent_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, CASE WHEN ? IS NULL THEN NULL ELSE NOW() END, NOW())
    `;
    const [result] = await pool.execute(query, [
      name,
      email,
      passwordHash,
      verificationTokenHash,
      verificationExpiresAt,
      otpHash,
      otpExpiresAt,
      otpHash,
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


const findUserByGoogleId = async (googleId) => {
  try {
    const query = 'SELECT * FROM users WHERE google_id = ?';
    const [rows] = await pool.execute(query, [googleId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(`Error finding user by Google id: ${error.message}`);
  }
};

const createGoogleUser = async ({ name, email, googleId, passwordHash }) => {
  try {
    const query = `
      INSERT INTO users
        (name, email, password_hash, google_id, auth_provider, email_verified_at, created_at, last_login_at)
      VALUES (?, ?, ?, ?, 'google', NOW(), NOW(), NOW())
    `;
    const [result] = await pool.execute(query, [name, email, passwordHash, googleId]);
    return result;
  } catch (error) {
    throw new Error(`Error creating Google user: ${error.message}`);
  }
};

const linkGoogleAccount = async (userId, googleId) => {
  try {
    const query = `
      UPDATE users
      SET google_id = ?,
          auth_provider = CASE WHEN auth_provider = 'email' THEN 'email_google' ELSE auth_provider END,
          email_verified_at = COALESCE(email_verified_at, NOW()),
          last_login_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [googleId, userId]);
    return result;
  } catch (error) {
    throw new Error(`Error linking Google account: ${error.message}`);
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


const storeEmailOtp = async (email, otpHash, expiresAt) => {
  try {
    const query = `
      UPDATE users
      SET email_otp_hash = ?,
          email_otp_expires_at = ?,
          email_otp_attempts = 0,
          email_otp_last_sent_at = NOW(),
          email_verification_token_hash = NULL,
          email_verification_expires_at = NULL
      WHERE email = ?
        AND email_verified_at IS NULL
    `;
    const [result] = await pool.execute(query, [otpHash, expiresAt, email]);
    return result;
  } catch (error) {
    throw new Error(`Error storing email OTP: ${error.message}`);
  }
};

const verifyEmailOtp = async (email, otpHash, maxAttempts = 5) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT id, email_otp_hash, email_otp_expires_at, email_otp_attempts
       FROM users
       WHERE email = ? AND email_verified_at IS NULL
       FOR UPDATE`,
      [email],
    );

    const user = rows[0];
    if (!user) {
      await connection.rollback();
      return { verified: false, reason: 'invalid' };
    }

    if (!user.email_otp_hash || !user.email_otp_expires_at || new Date(user.email_otp_expires_at).getTime() <= Date.now()) {
      await connection.rollback();
      return { verified: false, reason: 'expired' };
    }

    if (Number(user.email_otp_attempts || 0) >= maxAttempts) {
      await connection.rollback();
      return { verified: false, reason: 'locked' };
    }

    if (user.email_otp_hash !== otpHash) {
      await connection.execute(
        'UPDATE users SET email_otp_attempts = email_otp_attempts + 1 WHERE id = ?',
        [user.id],
      );
      await connection.commit();
      return { verified: false, reason: 'invalid' };
    }

    await connection.execute(
      `UPDATE users
       SET email_verified_at = NOW(),
           email_otp_hash = NULL,
           email_otp_expires_at = NULL,
           email_otp_attempts = 0,
           email_verification_token_hash = NULL,
           email_verification_expires_at = NULL
       WHERE id = ?`,
      [user.id],
    );
    await connection.commit();
    return { verified: true, userId: user.id };
  } catch (error) {
    await connection.rollback();
    throw new Error(`Error verifying email OTP: ${error.message}`);
  } finally {
    connection.release();
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
  createGoogleUser,
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  linkGoogleAccount,
  markEmailVerified,
  storeEmailOtp,
  storeEmailVerificationToken,
  storePasswordResetToken,
  resetPasswordByToken,
  verifyEmailOtp,
  recordFailedLogin,
  recordSuccessfulLogin,
};



