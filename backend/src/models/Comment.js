const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const commentSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    user_id: { type: Number, required: true, index: true },
    post_id: { type: Number, required: true, index: true },
    desc: { type: String, default: '' },
    comment_like_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

commentSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('comment');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Comment', commentSchema);
