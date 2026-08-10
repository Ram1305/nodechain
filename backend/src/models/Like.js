const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const likeSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    user_id: { type: Number, required: true, index: true },
    post_id: { type: Number, index: true },
    comment_id: { type: Number, index: true },
    reel_id: { type: Number, index: true },
    type: { type: String, enum: ['post', 'comment', 'reel'], required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

likeSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('like');
  }
  this.updated_at = new Date();
});

likeSchema.index({ user_id: 1, post_id: 1, type: 1 });
likeSchema.index({ user_id: 1, comment_id: 1, type: 1 });
likeSchema.index({ user_id: 1, reel_id: 1, type: 1 });

module.exports = mongoose.model('Like', likeSchema);
