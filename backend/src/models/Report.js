const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const reportSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    type: { type: String, enum: ['user', 'post', 'room', 'reel'], required: true },
    target_id: { type: Number, required: true },
    reason: { type: String, default: '' },
    desc: { type: String, default: '' },
    reporter_id: { type: Number, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

reportSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('report');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Report', reportSchema);
