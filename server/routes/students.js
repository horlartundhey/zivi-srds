const express = require('express');
const https = require('https');
const http = require('http');
const router = express.Router();
const Student = require('../models/Student');

// GET /api/students/:id/download — proxy PDF with correct filename & Content-Disposition
router.get('/:id/download', async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student || !student.resultFileUrl) {
    return res.status(404).json({ success: false, message: 'Student or result not found' });
  }
  const safe = (student.name || 'Result')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '') || 'Result';
  const filename = `${safe}.pdf`;
  const lib = student.resultFileUrl.startsWith('https') ? https : http;
  const fileReq = lib.get(student.resultFileUrl, (fileRes) => {
    if (fileRes.statusCode !== 200) {
      return res.status(502).json({ success: false, message: `Storage fetch failed (${fileRes.statusCode})` });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fileRes.pipe(res);
  });
  fileReq.on('error', () => res.status(500).json({ success: false, message: 'Failed to fetch PDF' }));
});

// GET all students in a class
router.get('/class/:classId', async (req, res) => {
  const students = await Student.find({ classId: req.params.classId })
    .populate('classId', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: students });
});

// GET single student
router.get('/:id', async (req, res) => {
  const student = await Student.findById(req.params.id).populate('classId', 'name');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: student });
});

// POST create student
router.post('/', async (req, res) => {
  const { name, parentEmail, classId } = req.body;
  if (!name || !parentEmail || !classId) {
    return res.status(400).json({ success: false, message: 'name, parentEmail, and classId are required' });
  }
  const student = await Student.create({ name, parentEmail, classId });
  res.status(201).json({ success: true, data: student });
});

// PUT update student
router.put('/:id', async (req, res) => {
  const { name, parentEmail } = req.body;
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { name, parentEmail },
    { new: true, runValidators: true }
  );
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: student });
});

// DELETE student
router.delete('/:id', async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, message: 'Student deleted' });
});

module.exports = router;
