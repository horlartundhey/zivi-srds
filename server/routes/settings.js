const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { EMAIL_TEMPLATE } = require('../services/emailService');

// GET /api/settings/template — retrieve current email template
router.get('/template', async (req, res) => {
  const template = await Settings.getTemplate(EMAIL_TEMPLATE);
  res.json({ success: true, data: { template, defaultTemplate: EMAIL_TEMPLATE } });
});

// PUT /api/settings/template — update email template
router.put('/template', async (req, res) => {
  const { template } = req.body;
  if (!template || !template.trim()) {
    return res.status(400).json({ success: false, message: 'Template cannot be empty' });
  }
  await Settings.setTemplate(template.trim());
  res.json({ success: true, message: 'Email template updated' });
});

module.exports = router;
