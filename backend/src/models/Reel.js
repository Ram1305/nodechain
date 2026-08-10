const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const reelSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    user_id: { type: Number, required: true, index: true },
    interest_ids: { type: String, default: '' },
    music_id: { type: Number, default: null },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    hashtags: { type: String, default: '' },
    comments_count: { type: Number, default: 0 },
    likes_count: { type: Number, default: 0 },
    views_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

reelSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('reel');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Reel', reelSchema);
