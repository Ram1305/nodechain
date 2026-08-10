const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const contentSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    post_id: { type: Number, required: true, index: true },
    content_type: { type: Number, default: 0 },
    content: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    audio_waves: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

contentSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('content');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Content', contentSchema);
