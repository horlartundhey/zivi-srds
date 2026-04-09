const cron = require('node-cron');
const { processQueue } = require('../services/queueProcessor');

/**
 * Runs every day at 8:00 AM server time.
 * Resumes processing any emails still queued from previous days.
 */
const startEmailCronJob = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Daily email queue processing started...');
    try {
      const result = await processQueue();
      console.log('[Cron] Done:', result);
    } catch (err) {
      console.error('[Cron] Error processing queue:', err.message);
    }
  });

  console.log('[Cron] Email queue scheduler registered (runs daily at 8:00 AM).');
};

module.exports = startEmailCronJob;
