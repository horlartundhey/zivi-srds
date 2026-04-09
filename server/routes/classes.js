const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Student = require('../models/Student');

// GET all classes with student counts
router.get('/', async (req, res) => {
  const classes = await Class.find().sort({ createdAt: -1 });
  const classIds = classes.map((c) => c._id);

  const counts = await Student.aggregate([
    { $match: { classId: { $in: classIds } } },
    {
      $group: {
        _id: '$classId',
        total: { $sum: 1 },
        uploaded: { $sum: { $cond: [{ $ne: ['$resultFileUrl', null] }, 1, 0] } },
      },
    },
  ]);

  const countMap = {};
  counts.forEach((c) => {
    countMap[c._id.toString()] = { total: c.total, uploaded: c.uploaded };
  });

  const data = classes.map((cls) => ({
    ...cls.toObject(),
    studentCount: countMap[cls._id.toString()]?.total || 0,
    uploadedCount: countMap[cls._id.toString()]?.uploaded || 0,
  }));

  res.json({ success: true, data });
});

// POST create class
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Class name is required' });
  }
  const existing = await Class.findOne({ name: name.trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Class already exists' });
  }
  const newClass = await Class.create({ name: name.trim() });
  res.status(201).json({ success: true, data: newClass });
});

// PUT rename class
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Class name is required' });
  }
  const duplicate = await Class.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'A class with that name already exists' });
  }
  const updated = await Class.findByIdAndUpdate(
    req.params.id,
    { name: name.trim() },
    { new: true, runValidators: true }
  );
  if (!updated) return res.status(404).json({ success: false, message: 'Class not found' });
  res.json({ success: true, data: updated });
});

// DELETE class (only if no students)
router.delete('/:id', async (req, res) => {
  const studentCount = await Student.countDocuments({ classId: req.params.id });
  if (studentCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete class with ${studentCount} student(s). Remove students first.`,
    });
  }
  const deleted = await Class.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Class not found' });
  res.json({ success: true, message: 'Class deleted' });
});

module.exports = router;
