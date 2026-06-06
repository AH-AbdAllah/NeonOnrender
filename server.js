require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 1. Confirm database connectivity before binding to socket
    await testConnection();

    // 2. Start Express Listener
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`TaskFlow Server started successfully.`);
      console.log(`Listening on http://localhost:${PORT}`);
      console.log(`Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal initialization error. Stopping server startup:', error.message);
    process.exit(1);
  }
}

startServer();
