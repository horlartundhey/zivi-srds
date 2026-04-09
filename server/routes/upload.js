const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Student = require('../models/Student');

// Use memory storage — we'll stream the buffer directly to Cloudinary v2 SDK
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

/**
 * Upload a buffer to Cloudinary as a raw/PDF resource.
 * Returns { secure_url, public_id }
 */
const uploadBufferToCloudinary = (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'srds/results',
        resource_type: 'raw',
        public_id: publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// POST /api/upload/:studentId — upload a result PDF for a student
router.post('/:studentId', upload.single('result'), async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  // If student already had a file, delete old one from Cloudinary
  if (student.resultPublicId) {
    try {
      await cloudinary.uploader.destroy(student.resultPublicId, { resource_type: 'raw' });
    } catch {
      // non-fatal, continue
    }
  }

  const publicId = `student_${student._id}_${Date.now()}`;
  const result = await uploadBufferToCloudinary(req.file.buffer, publicId);

  student.resultFileUrl = result.secure_url;
  student.resultPublicId = result.public_id;
  // Reset email status if a new result is uploaded
  if (student.emailStatus === 'sent') {
    student.emailStatus = 'pending';
    student.sentAt = null;
  }
  await student.save();

  res.json({ success: true, data: { resultFileUrl: student.resultFileUrl, student } });
});

// DELETE /api/upload/:studentId — remove uploaded result
router.delete('/:studentId', async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  if (student.resultPublicId) {
    await cloudinary.uploader.destroy(student.resultPublicId, { resource_type: 'raw' });
  }

  student.resultFileUrl = null;
  student.resultPublicId = null;
  await student.save();

  res.json({ success: true, message: 'Result file removed' });
});

module.exports = router;
