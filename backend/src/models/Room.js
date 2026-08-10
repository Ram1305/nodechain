const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const roomSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    admin_id: { type: Number, required: true, index: true },
    photo: { type: String, default: '' },
    title: { type: String, default: '' },
    desc: { type: String, default: '' },
    interest_ids: { type: String, default: '' },
    is_private: { type: Number, default: 0 },
    is_join_request_enable: { type: Number, default: 0 },
    total_member: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

roomSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('room');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Room', roomSchema);
