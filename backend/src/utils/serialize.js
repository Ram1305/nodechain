function iso(date) {
  if (!date) return null;
  return new Date(date).toISOString();
}

function serializeInterest(i) {
  if (!i) return null;
  return {
    id: i.id,
    title: i.title,
    created_at: iso(i.created_at || i.createdAt),
    updated_at: iso(i.updated_at || i.updatedAt),
    totalRoomOfInterest: i.totalRoomOfInterest ?? 0,
  };
}

function serializeSettingCommon(item) {
  if (!item) return null;
  return {
    id: item.id,
    title: item.title,
    created_at: iso(item.created_at || item.createdAt),
    updated_at: iso(item.updated_at || item.updatedAt),
  };
}

function serializeUser(user, extras = {}) {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  return {
    id: u.id,
    identity: u.identity,
    username: u.username,
    full_name: u.full_name,
    bio: u.bio,
    interest_ids: u.interest_ids || '',
    profile: u.profile || '',
    background_image: u.background_image || '',
    is_push_notifications: u.is_push_notifications ?? 1,
    is_invited_to_room: u.is_invited_to_room ?? 1,
    is_verified: u.is_verified ?? 0,
    is_block: u.is_block ?? 0,
    block_user_ids: u.block_user_ids || '',
    following: u.following ?? 0,
    followers: u.followers ?? 0,
    login_type: u.login_type ?? 0,
    device_type: u.device_type ?? 0,
    device_token: u.device_token || '',
    is_moderator: u.is_moderator ?? 0,
    created_at: iso(u.created_at || u.createdAt),
    updated_at: iso(u.updated_at || u.updatedAt),
    followingStatus: extras.followingStatus ?? u.followingStatus ?? 0,
    saved_music_ids: u.saved_music_ids || '',
    saved_reel_ids: u.saved_reel_ids || '',
    interest: (extras.interest || u.interest || []).map(serializeInterest).filter(Boolean),
    stories: extras.stories || u.stories || undefined,
  };
}

function serializeContent(c) {
  if (!c) return null;
  const o = c.toObject ? c.toObject() : c;
  return {
    id: o.id,
    post_id: o.post_id,
    content_type: o.content_type,
    content: o.content,
    thumbnail: o.thumbnail || '',
    audio_waves: o.audio_waves || '',
    created_at: iso(o.created_at || o.createdAt),
    updated_at: iso(o.updated_at || o.updatedAt),
  };
}

function serializePost(post, extras = {}) {
  if (!post) return null;
  const p = post.toObject ? post.toObject() : post;
  return {
    id: p.id,
    user_id: p.user_id,
    desc: p.desc || '',
    tags: p.tags || '',
    interest_ids: p.interest_ids || '',
    comments_count: p.comments_count ?? 0,
    likes_count: p.likes_count ?? 0,
    link_preview_json: p.link_preview_json || null,
    is_restricted: p.is_restricted ?? 0,
    content_type: p.content_type,
    created_at: iso(p.created_at || p.createdAt),
    updated_at: iso(p.updated_at || p.updatedAt),
    is_like: extras.is_like ?? p.is_like ?? 0,
    content: (extras.content || p.content || []).map(serializeContent),
    user: extras.user ? serializeUser(extras.user) : p.user ? serializeUser(p.user) : null,
  };
}

function serializeComment(comment, extras = {}) {
  if (!comment) return null;
  const c = comment.toObject ? comment.toObject() : comment;
  return {
    id: c.id,
    user_id: c.user_id,
    post_id: c.post_id,
    desc: c.desc || '',
    created_at: iso(c.created_at || c.createdAt),
    updated_at: iso(c.updated_at || c.updatedAt),
    is_like: extras.is_like ?? c.is_like ?? 0,
    comment_like_count: c.comment_like_count ?? 0,
    user: extras.user ? serializeUser(extras.user) : c.user ? serializeUser(c.user) : null,
  };
}

function serializeRoom(room, extras = {}) {
  if (!room) return null;
  const r = room.toObject ? room.toObject() : room;
  return {
    id: r.id,
    admin_id: r.admin_id,
    photo: r.photo || '',
    title: r.title || '',
    desc: r.desc || '',
    interest_ids: r.interest_ids || '',
    is_private: r.is_private ?? 0,
    is_join_request_enable: r.is_join_request_enable ?? 0,
    total_member: r.total_member ?? 0,
    created_at: iso(r.created_at || r.createdAt),
    updated_at: iso(r.updated_at || r.updatedAt),
    userRoomStatus: extras.userRoomStatus ?? r.userRoomStatus ?? 0,
    is_mute: extras.is_mute ?? r.is_mute ?? 0,
    interests: (extras.interests || r.interests || []).map(serializeInterest),
    admin: extras.admin ? serializeUser(extras.admin) : r.admin ? serializeUser(r.admin) : null,
    roomUsers: extras.roomUsers || r.roomUsers || [],
  };
}

function serializeStory(story, extras = {}) {
  if (!story) return null;
  const s = story.toObject ? story.toObject() : story;
  return {
    id: s.id,
    user_id: s.user_id,
    type: s.type,
    duration: s.duration ?? 0,
    content: s.content || '',
    thumbnail: s.thumbnail || '',
    view_by_user_ids: s.view_by_user_ids || '',
    created_at: iso(s.created_at || s.createdAt),
    updated_at: iso(s.updated_at || s.updatedAt),
    user: extras.user ? serializeUser(extras.user) : s.user ? serializeUser(s.user) : null,
  };
}

function serializeMusic(music) {
  if (!music) return null;
  const m = music.toObject ? music.toObject() : music;
  return {
    id: m.id,
    category_id: m.category_id,
    title: m.title || '',
    sound: m.sound || '',
    duration: m.duration ?? 0,
    artist: m.artist || '',
    image: m.image || '',
    is_deleted: m.is_deleted ?? 0,
    created_at: iso(m.created_at || m.createdAt),
    updated_at: iso(m.updated_at || m.updatedAt),
  };
}

function serializeReel(reel, extras = {}) {
  if (!reel) return null;
  const r = reel.toObject ? reel.toObject() : reel;
  return {
    id: r.id,
    user_id: r.user_id,
    interest_ids: r.interest_ids || '',
    music_id: r.music_id ?? null,
    description: r.description || '',
    content: r.content || '',
    thumbnail: r.thumbnail || '',
    hashtags: r.hashtags || '',
    comments_count: r.comments_count ?? 0,
    likes_count: r.likes_count ?? 0,
    views_count: r.views_count ?? 0,
    created_at: iso(r.created_at || r.createdAt),
    updated_at: iso(r.updated_at || r.updatedAt),
    is_like: extras.is_like ?? r.is_like ?? 0,
    is_follow: extras.is_follow ?? r.is_follow ?? 0,
    music: extras.music ? serializeMusic(extras.music) : r.music ? serializeMusic(r.music) : null,
    user: extras.user ? serializeUser(extras.user) : r.user ? serializeUser(r.user) : null,
  };
}

function serializeReelComment(comment, extras = {}) {
  if (!comment) return null;
  const c = comment.toObject ? comment.toObject() : comment;
  return {
    id: c.id,
    user_id: c.user_id,
    reel_id: c.reel_id,
    description: c.description || '',
    created_at: iso(c.created_at || c.createdAt),
    updated_at: iso(c.updated_at || c.updatedAt),
    user: extras.user ? serializeUser(extras.user) : c.user ? serializeUser(c.user) : null,
  };
}

function serializeSettings(settings) {
  if (!settings) return null;
  const s = settings.toObject ? settings.toObject() : settings;
  return {
    id: s.id,
    app_name: s.app_name,
    setRoomUsersLimit: s.setRoomUsersLimit,
    minute_limit_in_creating_story: s.minute_limit_in_creating_story,
    minute_limit_in_audio_post: s.minute_limit_in_audio_post,
    minute_limit_in_choosing_video_for_story: s.minute_limit_in_choosing_video_for_story,
    minute_limit_in_choosing_video_for_post: s.minute_limit_in_choosing_video_for_post,
    max_images_can_be_uploaded_in_one_post: s.max_images_can_be_uploaded_in_one_post,
    ad_banner_android: s.ad_banner_android || '',
    ad_interstitial_android: s.ad_interstitial_android || '',
    ad_banner_iOS: s.ad_banner_iOS || '',
    ad_interstitial_iOS: s.ad_interstitial_iOS || '',
    is_admob_on: s.is_admob_on ?? 0,
    audio_space_hosts_limit: s.audio_space_hosts_limit,
    audio_space_listeners_limit: s.audio_space_listeners_limit,
    audio_space_duration_in_minutes: s.audio_space_duration_in_minutes,
    duration_limit_in_reel: s.duration_limit_in_reel,
    is_sight_engine_enabled: s.is_sight_engine_enabled ?? 0,
    sight_engine_api_user: s.sight_engine_api_user || '',
    sight_engine_api_secret: s.sight_engine_api_secret || '',
    sight_engine_image_workflow_id: s.sight_engine_image_workflow_id || '',
    sight_engine_video_workflow_id: s.sight_engine_video_workflow_id || '',
    storage_type: s.storage_type ?? 0,
    fetch_post_type: s.fetch_post_type ?? 0,
    support_email: s.support_email || '',
    is_in_app_purchase_enabled: s.is_in_app_purchase_enabled ?? 0,
    created_at: iso(s.created_at || s.createdAt),
    updated_at: iso(s.updated_at || s.updatedAt),
    interests: (s.interests || []).map(serializeInterest),
    documentType: (s.documentType || []).map(serializeSettingCommon),
    reportReasons: (s.reportReasons || []).map(serializeSettingCommon),
    restrictedUsernames: (s.restrictedUsernames || []).map(serializeSettingCommon),
    is_maintenance_mode: s.is_maintenance_mode ?? 0,
    maintenance_message: s.maintenance_message || '',
    android_app_version: s.android_app_version || '1.0.0',
    ios_app_version: s.ios_app_version || '1.0.0',
    play_store_download_link: s.play_store_download_link || '',
    app_store_download_link: s.app_store_download_link || '',
    is_force_app_update: s.is_force_app_update ?? 0,
  };
}

module.exports = {
  iso,
  serializeInterest,
  serializeSettingCommon,
  serializeUser,
  serializeContent,
  serializePost,
  serializeComment,
  serializeRoom,
  serializeStory,
  serializeMusic,
  serializeReel,
  serializeReelComment,
  serializeSettings,
};
