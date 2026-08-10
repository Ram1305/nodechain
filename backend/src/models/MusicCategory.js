const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const musicCategorySchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    title: { type: String, required: true },
    is_deleted: { type: Number, default: 0 },
    musics_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

musicCategorySchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('musicCategory');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('MusicCategory', musicCategorySchema);
