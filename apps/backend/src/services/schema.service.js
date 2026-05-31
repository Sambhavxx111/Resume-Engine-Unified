const pool = require('../config/db');

const columnExists = async (tableName, columnName) => {
  const [rows] = await pool.execute(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [tableName, columnName],
  );

  return Number(rows[0]?.count || 0) > 0;
};

const ensureColumn = async (tableName, columnName, definition) => {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
};

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
      title VARCHAR(255) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      is_active TINYINT(1) NOT NULL DEFAULT 0,
      deleted_at DATETIME NULL,
      ats_score INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_resumes_user_id (user_id),
      CONSTRAINT fk_resumes_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  await ensureColumn('resumes', 'title', 'VARCHAR(255) NULL');
  await ensureColumn('resumes', 'status', "VARCHAR(32) NOT NULL DEFAULT 'draft'");
  await ensureColumn('resumes', 'is_active', 'TINYINT(1) NOT NULL DEFAULT 0');
  await ensureColumn('resumes', 'deleted_at', 'DATETIME NULL');
};

module.exports = {
  ensureDatabaseSchema,
};
