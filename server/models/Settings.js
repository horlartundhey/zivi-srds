const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  { emailTemplate: { type: String, required: true } },
  { timestamps: true }
);

// Singleton helpers — there is ever only one Settings document
settingsSchema.statics.getTemplate = async function (defaultTemplate) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ emailTemplate: defaultTemplate });
  }
  return settings.emailTemplate;
};

settingsSchema.statics.setTemplate = async function (template) {
  let settings = await this.findOne();
  if (!settings) {
    return this.create({ emailTemplate: template });
  }
  settings.emailTemplate = template;
  await settings.save();
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
