const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const postSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    user_id: { type: Number, required: true, index: true },
    desc: { type: String, default: '' },
    tags: { type: String, default: '' },
    interest_ids: { type: String, default: '' },
    comments_count: { type: Number, default: 0 },
    likes_count: { type: Number, default: 0 },
    link_preview_json: { type: String, default: null },
    is_restricted: { type: Number, default: 0 },
    content_type: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

postSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('post');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Post', postSchema);
