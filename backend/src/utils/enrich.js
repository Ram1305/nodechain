const Interest = require('../models/Interest');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Content = require('../models/Content');
const Music = require('../models/Music');
const {
  serializeUser,
  serializePost,
  serializeReel,
  serializeRoom,
  serializeInterest,
  serializeComment,
  serializeReelComment,
  serializeStory,
} = require('./serialize');

function parseIds(str) {
  if (!str) return [];
  return String(str)
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

async function getInterestsByIds(idsStr) {
  const ids = parseIds(idsStr);
  if (!ids.length) return [];
  const list = await Interest.find({ id: { $in: ids } });
  return list.map(serializeInterest);
}

async function followingStatus(myUserId, targetUserId) {
  if (!myUserId || !targetUserId || Number(myUserId) === Number(targetUserId)) return 0;
  const f = await Follow.findOne({ my_user_id: Number(myUserId), user_id: Number(targetUserId) });
  return f ? 1 : 0;
}

async function enrichUser(user, myUserId) {
  if (!user) return null;
  const interest = await getInterestsByIds(user.interest_ids);
  const status = await followingStatus(myUserId, user.id);
  return serializeUser(user, { interest, followingStatus: status });
}

async function enrichPost(post, myUserId) {
  if (!post) return null;
  const [user, content, liked] = await Promise.all([
    User.findOne({ id: post.user_id }),
    Content.find({ post_id: post.id }),
    myUserId
      ? Like.findOne({ user_id: Number(myUserId), post_id: post.id, type: 'post' })
      : null,
  ]);
  return serializePost(post, {
    user: user ? await enrichUser(user, myUserId) : null,
    content,
    is_like: liked ? 1 : 0,
  });
}

async function enrichComment(comment, myUserId) {
  if (!comment) return null;
  const [user, liked] = await Promise.all([
    User.findOne({ id: comment.user_id }),
    myUserId
      ? Like.findOne({ user_id: Number(myUserId), comment_id: comment.id, type: 'comment' })
      : null,
  ]);
  return serializeComment(comment, {
    user: user ? serializeUser(user) : null,
    is_like: liked ? 1 : 0,
  });
}

async function enrichReel(reel, myUserId) {
  if (!reel) return null;
  const [user, music, liked, follow] = await Promise.all([
    User.findOne({ id: reel.user_id }),
    reel.music_id ? Music.findOne({ id: reel.music_id }) : null,
    myUserId
      ? Like.findOne({ user_id: Number(myUserId), reel_id: reel.id, type: 'reel' })
      : null,
    myUserId && reel.user_id
      ? Follow.findOne({ my_user_id: Number(myUserId), user_id: reel.user_id })
      : null,
  ]);
  return serializeReel(reel, {
    user: user ? serializeUser(user) : null,
    music,
    is_like: liked ? 1 : 0,
    is_follow: follow ? 1 : 0,
  });
}

async function enrichRoom(room, myUserId, extras = {}) {
  if (!room) return null;
  const admin = await User.findOne({ id: room.admin_id });
  const interests = await getInterestsByIds(room.interest_ids);
  return serializeRoom(room, {
    admin: admin ? serializeUser(admin) : null,
    interests,
    userRoomStatus: extras.userRoomStatus ?? 0,
    is_mute: extras.is_mute ?? 0,
    roomUsers: extras.roomUsers || [],
  });
}

async function enrichStory(story, myUserId) {
  if (!story) return null;
  const user = await User.findOne({ id: story.user_id });
  return serializeStory(story, { user: user ? serializeUser(user) : null });
}

async function enrichReelComment(comment) {
  if (!comment) return null;
  const user = await User.findOne({ id: comment.user_id });
  return serializeReelComment(comment, { user: user ? serializeUser(user) : null });
}

module.exports = {
  parseIds,
  getInterestsByIds,
  followingStatus,
  enrichUser,
  enrichPost,
  enrichComment,
  enrichReel,
  enrichRoom,
  enrichStory,
  enrichReelComment,
};
