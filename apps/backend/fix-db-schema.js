const mysql = require('mysql2/promise');
require('dotenv').config();

const fixDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
    });
    console.log('✓ Connected to MySQL server');
    
    // Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS resume_engine');
    console.log('✓ Database created/verified');
    
    // Select database
    await connection.query('USE resume_engine');
    console.log('✓ Database selected');
    
    // Drop old tables if they exist
    await connection.query('DROP TABLE IF EXISTS resumes');
    await connection.query('DROP TABLE IF EXISTS users');
    console.log('✓ Old tables dropped');
    
    // Create users table with correct schema
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email_verified_at DATETIME NULL,
        email_verification_token_hash VARCHAR(255) NULL,
        email_verification_expires_at DATETIME NULL,
        password_reset_token_hash VARCHAR(255) NULL,
        password_reset_expires_at DATETIME NULL,
        failed_login_attempts INT NOT NULL DEFAULT 0,
        locked_until DATETIME NULL,
        last_login_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created with correct schema');
    
    // Create resumes table with correct schema
    await connection.query(`
      CREATE TABLE resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        resume_json LONGTEXT,
        ats_score INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Resumes table created with correct schema');
    
    console.log('\n✓ All database schema fixes completed successfully!');
    connection.end();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

fixDatabase();
