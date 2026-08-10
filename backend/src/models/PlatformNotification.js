const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const platformNotificationSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

platformNotificationSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('platformNotification');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('PlatformNotification', platformNotificationSchema);
