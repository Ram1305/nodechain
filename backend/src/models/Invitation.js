const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const invitationSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    room_id: { type: Number, required: true, index: true },
    user_id: { type: Number, required: true, index: true },
    invited_by: { type: Number, required: true },
    type: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

invitationSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('invitation');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Invitation', invitationSchema);
