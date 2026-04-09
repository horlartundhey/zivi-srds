const Student = require('../models/Student');
const EmailLog = require('../models/EmailLog');
const { sendResultEmail, EMAIL_TEMPLATE } = require('./emailService');
const Settings = require('../models/Settings');
const getAppUrl = require('../config/appUrl');

const DAILY_LIMIT = 300;
const MAX_RETRIES = 3;
let isProcessing = false;

const getQueueState = () => ({ isProcessing });

/**
 * Processes the send queue.
 * Sends up to (DAILY_LIMIT - sentToday) queued emails.
 * Called by cron job and on-demand.
 */
const processQueue = async () => {
  if (isProcessing) {
    return { sent: 0, skipped: 0, failed: 0, limitReached: false, alreadyProcessing: true };
  }

  isProcessing = true;

  try {
  const sentToday = await EmailLog.getSentToday();
  const remaining = DAILY_LIMIT - sentToday;

  if (remaining <= 0) {
    console.log(`[Queue] Daily limit (${DAILY_LIMIT}) reached. Will resume tomorrow.`);
    return { sent: 0, skipped: 0, failed: 0, limitReached: true };
  }

  // Fetch queued students (oldest first), up to the remaining quota
  const queued = await Student.find({ emailStatus: 'queued' })
    .populate('classId', 'name')
    .sort({ queuedAt: 1 })
    .limit(remaining);

  if (queued.length === 0) {
    console.log('[Queue] No queued emails to process.');
    return { sent: 0, skipped: 0, failed: 0, limitReached: false };
  }

  // Fetch the current email template once (falls back to default if not customised)
  let emailTemplate;
  try {
    emailTemplate = await Settings.getTemplate(EMAIL_TEMPLATE);
  } catch {
    emailTemplate = EMAIL_TEMPLATE;
  }

  let sent = 0;
  let failed = 0;
  const appUrl = getAppUrl();

  for (const student of queued) {
    if (!student.resultFileUrl) {
      // No result uploaded — skip but keep queued
      continue;
    }

    try {
      await sendResultEmail({
        studentName: student.name,
        className: student.classId?.name || 'N/A',
        parentEmail: student.parentEmail,
        resultLink: `${appUrl}/api/students/${student._id}/download`,
        template: emailTemplate,
      });

      student.emailStatus = 'sent';
      student.sentAt = new Date();
      student.retryCount = 0;
      student.lastFailureReason = null;
      student.queuedAt = null;
      await student.save();
      await EmailLog.incrementToday();
      sent++;
    } catch (error) {
      student.retryCount += 1;
      student.lastFailureReason = error.message || 'Unknown error';
      if (student.retryCount >= MAX_RETRIES) {
        student.emailStatus = 'failed';
      } else {
        student.emailStatus = 'pending';
      }
      student.queuedAt = null;
      await student.save();
      failed++;
      console.error(`[Queue] Failed to send to ${student.parentEmail}:`, error.message);
    }
  }

  console.log(`[Queue] Processed: ${sent} sent, ${failed} failed.`);
  return { sent, failed, limitReached: false };
  } finally {
    isProcessing = false;
  }
};

/**
 * Adds all students in a class to the queue (Mode A: Send All).
 * Only queues students with a result uploaded and status != sent.
 */
const queueClass = async (classId) => {
  const students = await Student.find({
    classId,
    resultFileUrl: { $ne: null },
    emailStatus: { $in: ['pending', 'failed'] },
  });

  const now = new Date();
  const ids = students.map((s) => s._id);

  await Student.updateMany(
    { _id: { $in: ids } },
    { emailStatus: 'queued', queuedAt: now }
  );

  return students.length;
};

/**
 * Adds first N students in a class to the queue (Mode B: Send Partial).
 */
const queuePartialClass = async (classId, limit) => {
  const students = await Student.find({
    classId,
    resultFileUrl: { $ne: null },
    emailStatus: { $in: ['pending', 'failed'] },
  })
    .sort({ createdAt: 1 })
    .limit(limit);

  const now = new Date();
  const ids = students.map((s) => s._id);

  await Student.updateMany(
    { _id: { $in: ids } },
    { emailStatus: 'queued', queuedAt: now }
  );

  return students.length;
};

/**
 * Re-queue failed students in a class for retry.
 */
const requeueFailed = async (classId) => {
  const result = await Student.updateMany(
    { classId, emailStatus: 'failed', retryCount: { $lt: MAX_RETRIES } },
    { emailStatus: 'queued', queuedAt: new Date() }
  );
  return result.modifiedCount;
};

module.exports = { processQueue, queueClass, queuePartialClass, requeueFailed, getQueueState };
