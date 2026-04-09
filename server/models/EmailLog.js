const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    date: {
      type: String, // stored as YYYY-MM-DD for easy daily lookup
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

emailLogSchema.statics.getTodayLog = async function () {
  const today = new Date().toISOString().slice(0, 10);
  let log = await this.findOne({ date: today });
  if (!log) {
    log = await this.create({ date: today, count: 0 });
  }
  return log;
};

emailLogSchema.statics.incrementToday = async function () {
  const today = new Date().toISOString().slice(0, 10);
  return this.findOneAndUpdate(
    { date: today },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
};

emailLogSchema.statics.getSentToday = async function () {
  const log = await this.getTodayLog();
  return log.count;
};

module.exports = mongoose.model('EmailLog', emailLogSchema);
