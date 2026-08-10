const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const roomMemberSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    room_id: { type: Number, required: true, index: true },
    user_id: { type: Number, required: true, index: true },
    type: { type: Number, default: 0 }, // 0 member, 1 admin, 2 request, 3 invited
    is_mute: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

roomMemberSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('roomMember');
  }
  this.updated_at = new Date();
});

roomMemberSchema.index({ room_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('RoomMember', roomMemberSchema);
