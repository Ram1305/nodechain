const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const settingCommonSchema = new mongoose.Schema(
  {
    id: { type: Number },
    title: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const settingSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    app_name: { type: String, default: 'Chatter' },
    setRoomUsersLimit: { type: Number, default: 50 },
    minute_limit_in_creating_story: { type: Number, default: 1 },
    minute_limit_in_audio_post: { type: Number, default: 5 },
    minute_limit_in_choosing_video_for_story: { type: Number, default: 1 },
    minute_limit_in_choosing_video_for_post: { type: Number, default: 5 },
    max_images_can_be_uploaded_in_one_post: { type: Number, default: 10 },
    ad_banner_android: { type: String, default: '' },
    ad_interstitial_android: { type: String, default: '' },
    ad_banner_iOS: { type: String, default: '' },
    ad_interstitial_iOS: { type: String, default: '' },
    is_admob_on: { type: Number, default: 0 },
    audio_space_hosts_limit: { type: Number, default: 5 },
    audio_space_listeners_limit: { type: Number, default: 50 },
    audio_space_duration_in_minutes: { type: Number, default: 60 },
    duration_limit_in_reel: { type: Number, default: 30 },
    is_sight_engine_enabled: { type: Number, default: 0 },
    sight_engine_api_user: { type: String, default: '' },
    sight_engine_api_secret: { type: String, default: '' },
    sight_engine_image_workflow_id: { type: String, default: '' },
    sight_engine_video_workflow_id: { type: String, default: '' },
    storage_type: { type: Number, default: 0 },
    fetch_post_type: { type: Number, default: 0 },
    support_email: { type: String, default: 'support@chatter.app' },
    is_in_app_purchase_enabled: { type: Number, default: 0 },
    interests: [settingCommonSchema],
    documentType: [settingCommonSchema],
    reportReasons: [settingCommonSchema],
    restrictedUsernames: [settingCommonSchema],
    is_maintenance_mode: { type: Number, default: 0 },
    maintenance_message: { type: String, default: '' },
    android_app_version: { type: String, default: '1.0.0' },
    ios_app_version: { type: String, default: '1.0.0' },
    play_store_download_link: { type: String, default: '' },
    app_store_download_link: { type: String, default: '' },
    is_force_app_update: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

settingSchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('setting');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('Setting', settingSchema);
