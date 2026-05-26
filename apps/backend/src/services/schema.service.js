const pool = require('../config/db');

const ensureDatabaseSchema = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      email_verified_at DATETIME NULL,
      email_verification_token_hash VARCHAR(255) NULL,
      email_verification_expires_at DATETIME NULL,
      password_reset_token_hash VARCHAR(255) NULL,
      password_reset_expires_at DATETIME NULL,
      failed_login_attempts INT NOT NULL DEFAULT 0,
      locked_until DATETIME NULL,
      last_login_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_users_email (email),
      INDEX idx_users_verification_token (email_verification_token_hash),
      INDEX idx_users_reset_token (password_reset_token_hash)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      resume_json LONGTEXT,
      ats_score INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_resumes_user_id (user_id),
      CONSTRAINT fk_resumes_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);
};

module.exports = {
  ensureDatabaseSchema,
};

