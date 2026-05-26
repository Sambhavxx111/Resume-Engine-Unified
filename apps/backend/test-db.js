const mysql = require('mysql2/promise');
require('dotenv').config();

// Test direct connection
console.log('Testing direct connection...');
mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
})
  .then(conn => {
    console.log('✓ Direct connection works');
    conn.end();
    
    // Now test with pool
    console.log('\nTesting pool connection...');
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    
    return pool.getConnection();
  })
  .then(conn => {
    console.log('✓ Pool connection works');
    conn.release();
  })
  .catch(err => {
    console.error('✗ Error:', err.message);
  });

  
