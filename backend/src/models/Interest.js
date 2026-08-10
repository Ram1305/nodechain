const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const interestSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    title: { type: String, required: true },
    totalRoomOfInterest: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

interestSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('interest');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Interest', interestSchema);
