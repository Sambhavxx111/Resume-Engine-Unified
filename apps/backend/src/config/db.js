require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'resume_engine',
  port: process.env.DB_PORT || 3306,
};

// Avoid printing sensitive values in logs; only show non-sensitive connection info
console.log('Attempting to connect with config:', {
  host: config.host,
  user: config.user,
  database: config.database,
  port: config.port,
});

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ MySQL Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('✗ Database connection failed');
    console.error('Error Code:', error.code);
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error Message:', error.message);
      console.error('SQL Error:', error.sqlMessage);
      console.error('SQL State:', error.sqlState);
    }
    process.exit(1);
  }
};

// Initialize connection on module load
testConnection();

module.exports = pool;
