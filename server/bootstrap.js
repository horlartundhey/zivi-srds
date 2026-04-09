const connectDB = require('./config/db');
const { verifyTransporter } = require('./services/emailService');

let initializationPromise;

const initializeServer = async () => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await connectDB();
      await verifyTransporter();
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
};

module.exports = initializeServer;
