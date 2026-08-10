const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const userNotificationSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    my_user_id: { type: Number, required: true, index: true },
    user_id: { type: Number, default: null },
    post_id: { type: Number, default: null },
    room_id: { type: Number, default: null },
    reel_id: { type: Number, default: null },
    type: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

userNotificationSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('userNotification');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('UserNotification', userNotificationSchema);
