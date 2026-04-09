require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('express-async-errors');

const express = require('express');
const cors = require('cors');

const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/students');
const uploadRoutes = require('./routes/upload');
const emailRoutes = require('./routes/email');
const settingsRoutes = require('./routes/settings');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
