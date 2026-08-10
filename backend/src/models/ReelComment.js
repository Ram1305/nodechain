const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const reelCommentSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    user_id: { type: Number, required: true, index: true },
    reel_id: { type: Number, required: true, index: true },
    description: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

reelCommentSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('reelComment');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('ReelComment', reelCommentSchema);
