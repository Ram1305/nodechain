const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const storySchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    user_id: { type: Number, required: true, index: true },
    type: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    content: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    view_by_user_ids: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

storySchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('story');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Story', storySchema);
