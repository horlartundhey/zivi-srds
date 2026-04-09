const app = require('./app');
const initializeServer = require('./bootstrap');
const startEmailCronJob = require('./jobs/emailCron');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await initializeServer();

  if (process.env.ENABLE_EMAIL_CRON === 'true') {
    startEmailCronJob();
  }

  app.listen(PORT, () => {
    console.log(`SRDS Server running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error('Failed to start SRDS server:', error.message);
  process.exit(1);
});
