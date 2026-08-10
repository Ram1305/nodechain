const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const userSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    identity: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: '', index: true },
    full_name: { type: String, default: '' },
    bio: { type: String, default: '' },
    interest_ids: { type: String, default: '' },
    profile: { type: String, default: '' },
    background_image: { type: String, default: '' },
    is_push_notifications: { type: Number, default: 1 },
    is_invited_to_room: { type: Number, default: 1 },
    is_verified: { type: Number, default: 0 },
    is_block: { type: Number, default: 0 },
    block_user_ids: { type: String, default: '' },
    following: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    login_type: { type: Number, default: 0 },
    device_type: { type: Number, default: 0 },
    device_token: { type: String, default: '' },
    is_moderator: { type: Number, default: 0 },
    saved_music_ids: { type: String, default: '' },
    saved_reel_ids: { type: String, default: '' },
    verification_document: { type: String, default: '' },
    verification_selfie: { type: String, default: '' },
    verification_document_type: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

userSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('user');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('User', userSchema);
