const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const followSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    user_id: { type: Number, required: true, index: true },
    my_user_id: { type: Number, required: true, index: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

followSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('follow');
  }
  this.updated_at = new Date();
});

followSchema.index({ user_id: 1, my_user_id: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);
