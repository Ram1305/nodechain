const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const Setting = require('../models/Setting');
const PlatformNotification = require('../models/PlatformNotification');
const UserNotification = require('../models/UserNotification');
const FaqCategory = require('../models/FaqCategory');
const User = require('../models/User');
const Post = require('../models/Post');
const Room = require('../models/Room');
const Reel = require('../models/Reel');
const { ok, fail, okToken } = require('../utils/response');
const { skipLimit } = require('../utils/paginate');
const { serializeSettings, serializeUser, serializePost, serializeRoom, serializeReel, iso } = require('../utils/serialize');
const { agora } = require('../config/env');
const Interest = require('../models/Interest');

async function fetchSetting(req, res, next) {
  try {
    let setting = await Setting.findOne().sort({ id: 1 });
    if (!setting) {
      return fail(res, 'Settings not found. Run npm run seed');
    }
    const interests = await Interest.find().sort({ id: 1 });
    const data = serializeSettings(setting);
    data.interests = interests.map((i) => ({
      id: i.id,
      title: i.title,
      created_at: iso(i.created_at),
      updated_at: iso(i.updated_at),
      totalRoomOfInterest: i.totalRoomOfInterest ?? 0,
    }));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchPlatformNotification(req, res, next) {
  try {
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const list = await PlatformNotification.find().sort({ id: -1 }).skip(skip).limit(limit);
    return ok(
      res,
      list.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        created_at: iso(n.created_at),
        updated_at: iso(n.updated_at),
      }))
    );
  } catch (e) {
    return next(e);
  }
}

async function fetchUserNotification(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const list = await UserNotification.find({ my_user_id: myUserId }).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const n of list) {
      const item = {
        id: n.id,
        my_user_id: n.my_user_id,
        user_id: n.user_id,
        post_id: n.post_id,
        room_id: n.room_id,
        type: n.type,
        created_at: iso(n.created_at),
        updated_at: iso(n.updated_at),
        user: null,
        post: null,
        room: null,
        reel: null,
      };
      if (n.user_id) {
        const u = await User.findOne({ id: n.user_id });
        item.user = u ? serializeUser(u) : null;
      }
      if (n.post_id) {
        const p = await Post.findOne({ id: n.post_id });
        item.post = p ? serializePost(p) : null;
      }
      if (n.room_id) {
        const r = await Room.findOne({ id: n.room_id });
        item.room = r ? serializeRoom(r) : null;
      }
      if (n.reel_id) {
        const reel = await Reel.findOne({ id: n.reel_id });
        item.reel = reel ? serializeReel(reel) : null;
      }
      data.push(item);
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchFAQs(req, res, next) {
  try {
    const cats = await FaqCategory.find({ is_deleted: 0 }).sort({ id: 1 });
    return ok(
      res,
      cats.map((c) => ({
        id: c.id,
        title: c.title,
        is_deleted: c.is_deleted,
        created_at: iso(c.created_at),
        updated_at: iso(c.updated_at),
        faqs: (c.faqs || []).map((f) => ({
          id: f.id,
          faqs_type_id: f.faqs_type_id,
          question: f.question,
          answer: f.answer,
          created_at: iso(f.created_at),
          updated_at: iso(f.updated_at),
        })),
      }))
    );
  } catch (e) {
    return next(e);
  }
}

async function generateAgoraToken(req, res, next) {
  try {
    const channelName = req.body.channelName;
    if (!channelName) return fail(res, 'channelName required');
    if (!agora.appId || !agora.appCertificate) {
      return fail(res, 'Agora credentials not configured in .env');
    }
    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expire = Math.floor(Date.now() / 1000) + 3600;
    const token = RtcTokenBuilder.buildTokenWithUid(
      agora.appId,
      agora.appCertificate,
      channelName,
      uid,
      role,
      expire
    );
    return okToken(res, token);
  } catch (e) {
    return next(e);
  }
}

async function pushNotificationToSingleUser(req, res) {
  console.log('[pushNotificationToSingleUser]', req.body);
  return ok(res, null, 'Notification queued');
}

module.exports = {
  fetchSetting,
  fetchPlatformNotification,
  fetchUserNotification,
  fetchFAQs,
  generateAgoraToken,
  pushNotificationToSingleUser,
};
