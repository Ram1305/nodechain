const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const musicSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    category_id: { type: Number, required: true, index: true },
    title: { type: String, default: '' },
    sound: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    artist: { type: String, default: '' },
    image: { type: String, default: '' },
    is_deleted: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

musicSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('music');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Music', musicSchema);
