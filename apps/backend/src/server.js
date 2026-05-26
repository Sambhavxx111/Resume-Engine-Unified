require('dotenv').config();
const app = require('./App');
const pool = require('./config/db');
const userModel = require('./models/user.model');
const { ensureDatabaseSchema } = require('./services/schema.service');

const PORT = process.env.PORT || 3000;
let server;

const startServer = async () => {
  try {
    await ensureDatabaseSchema();
    console.log('Database schema verified');
    await userModel.ensureAuthSchema();
    console.log('Auth schema verified');
  } catch (error) {
    console.error('Auth schema verification failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

const shutdown = () => {
  console.log('Shutdown signal received: closing HTTP server');
  if (!server) {
    pool.end();
    process.exit(0);
  }

  server.close(() => {
    console.log('HTTP server closed');
    pool.end();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
