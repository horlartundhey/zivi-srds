const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const EmailLog = require('../models/EmailLog');
const { processQueue, queueClass, queuePartialClass, requeueFailed, getQueueState } = require('../services/queueProcessor');
const { sendResultEmail } = require('../services/emailService');
const getAppUrl = require('../config/appUrl');

// GET /api/email/status/:classId — get email status summary for a class
router.get('/status/:classId', async (req, res) => {
  const students = await Student.find({ classId: req.params.classId });
  const sendableStatuses = ['pending', 'queued', 'failed'];
  const summary = {
    total: students.length,
    withResult: students.filter((s) => s.resultFileUrl).length,
    pending: students.filter((s) => s.emailStatus === 'pending').length,
    queued: students.filter((s) => s.emailStatus === 'queued').length,
    sent: students.filter((s) => s.emailStatus === 'sent').length,
    failed: students.filter((s) => s.emailStatus === 'failed').length,
    sendable: students.filter((s) => s.resultFileUrl && sendableStatuses.includes(s.emailStatus)).length,
    pendingWithResult: students.filter((s) => s.resultFileUrl && s.emailStatus === 'pending').length,
  };
  const sentToday = await EmailLog.getSentToday();
  const remainingToday = Math.max(0, 300 - sentToday);
  res.json({ success: true, data: { summary, sentToday, remainingToday, processing: getQueueState().isProcessing } });
});

// POST /api/email/queue/:classId — Mode A: queue all students in class
router.post('/queue/:classId', async (req, res) => {
  const count = await queueClass(req.params.classId);
  if (count === 0) {
    return res.status(400).json({
      success: false,
      message: 'No students with uploaded results are ready to send.',
    });
  }

  const result = await processQueue();

  res.json({
    success: true,
    message: `${count} student(s) queued and processed.`,
    data: { queued: count, processing: false, result },
  });
});

// POST /api/email/queue-partial/:classId — Mode B: queue first N students
router.post('/queue-partial/:classId', async (req, res) => {
  const limit = parseInt(req.body.limit);
  if (!limit || limit < 1) {
    return res.status(400).json({ success: false, message: 'A valid limit (number) is required' });
  }
  const count = await queuePartialClass(req.params.classId, limit);
  if (count === 0) {
    return res.status(400).json({
      success: false,
      message: 'No students with uploaded results are ready to send.',
    });
  }

  const result = await processQueue();

  res.json({
    success: true,
    message: `${count} student(s) queued (partial send) and processed.`,
    data: { queued: count, processing: false, result },
  });
});

// POST /api/email/process — manually trigger queue processing
router.post('/process', async (req, res) => {
  const result = await processQueue();
  res.json({ success: true, data: result });
});

// GET /api/email/process — Vercel Cron entrypoint
router.get('/process', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const result = await processQueue();
  res.json({ success: true, data: result });
});

// POST /api/email/retry/:classId — retry all failed emails in a class
router.post('/retry/:classId', async (req, res) => {
  const count = await requeueFailed(req.params.classId);
  const result = await processQueue();
  res.json({
    success: true,
    message: `${count} failed email(s) re-queued for retry.`,
    data: result,
  });
});

// POST /api/email/reset-class/:classId — reset sent/failed students to pending (for re-send)
router.post('/reset-class/:classId', async (req, res) => {
  const result = await Student.updateMany(
    { classId: req.params.classId, emailStatus: { $in: ['sent', 'failed'] } },
    { emailStatus: 'pending', sentAt: null, retryCount: 0, lastFailureReason: null, queuedAt: null }
  );
  res.json({ success: true, message: `${result.modifiedCount} student(s) reset to pending` });
});

// POST /api/email/test — send a test email to verify SMTP config
router.post('/test', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ success: false, message: 'Provide a "to" email address' });
  try {
    await sendResultEmail({
      studentName: 'Test Student',
      className: 'Test Class',
      parentEmail: to,
      resultLink: 'https://example.com/test-result.pdf',
    });
    res.json({ success: true, message: `Test email sent to ${to}. Check inbox (and spam).` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/email/daily-log — get sending history
router.get('/daily-log', async (req, res) => {
  const logs = await EmailLog.find().sort({ date: -1 }).limit(30);
  res.json({ success: true, data: logs });
});

// GET /api/email/preview/:studentId — preview email content for a student
router.get('/preview/:studentId', async (req, res) => {
  const student = await Student.findById(req.params.studentId).populate('classId', 'name');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  const appUrl = getAppUrl(req);
  res.json({
    success: true,
    data: {
      studentName: student.name,
      className: student.classId?.name || 'N/A',
      parentEmail: student.parentEmail,
      resultLink: `${appUrl}/api/students/${student._id}/download`,
      hasResult: !!student.resultFileUrl,
    },
  });
});

module.exports = router;
