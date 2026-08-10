const Post = require('../models/Post');
const Content = require('../models/Content');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const Invitation = require('../models/Invitation');
const Story = require('../models/Story');
const User = require('../models/User');
const Reel = require('../models/Reel');
const ReelComment = require('../models/ReelComment');
const { ok, fail } = require('../utils/response');

async function deletePostByModerator(req, res, next) {
  try {
    const postId = Number(req.body.post_id);
    await Content.deleteMany({ post_id: postId });
    await Comment.deleteMany({ post_id: postId });
    await Like.deleteMany({ post_id: postId, type: 'post' });
    await Post.deleteOne({ id: postId });
    return ok(res, null, 'Post deleted by moderator');
  } catch (e) {
    return next(e);
  }
}

async function deleteCommentByModerator(req, res, next) {
  try {
    const commentId = Number(req.body.comment_id);
    const comment = await Comment.findOne({ id: commentId });
    if (comment) {
      await Comment.deleteOne({ id: commentId });
      await Post.updateOne({ id: comment.post_id }, { $inc: { comments_count: -1 } });
    }
    return ok(res, null, 'Comment deleted by moderator');
  } catch (e) {
    return next(e);
  }
}

async function deleteRoomByModerator(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    await Room.deleteOne({ id: roomId });
    await RoomMember.deleteMany({ room_id: roomId });
    await Invitation.deleteMany({ room_id: roomId });
    return ok(res, null, 'Room deleted by moderator');
  } catch (e) {
    return next(e);
  }
}

async function deleteStoryByModerator(req, res, next) {
  try {
    await Story.deleteOne({ id: Number(req.body.story_id) });
    return ok(res, null, 'Story deleted by moderator');
  } catch (e) {
    return next(e);
  }
}

async function userBlockByModerator(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const user = await User.findOne({ id: userId });
    if (!user) return fail(res, 'User not found');
    user.is_block = 1;
    await user.save();
    return ok(res, null, 'User blocked by moderator');
  } catch (e) {
    return next(e);
  }
}

async function deleteReelCommentByModerator(req, res, next) {
  try {
    const commentId = Number(req.body.reel_comment_id || req.body.comment_id);
    const comment = await ReelComment.findOne({ id: commentId });
    if (comment) {
      await ReelComment.deleteOne({ id: commentId });
      await Reel.updateOne({ id: comment.reel_id }, { $inc: { comments_count: -1 } });
    }
    return ok(res, null, 'Reel comment deleted by moderator');
  } catch (e) {
    return next(e);
  }
}

async function deleteReelByModerator(req, res, next) {
  try {
    const reelId = Number(req.body.reel_id);
    await ReelComment.deleteMany({ reel_id: reelId });
    await Like.deleteMany({ reel_id: reelId, type: 'reel' });
    await Reel.deleteOne({ id: reelId });
    return ok(res, null, 'Reel deleted by moderator');
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  deletePostByModerator,
  deleteCommentByModerator,
  deleteRoomByModerator,
  deleteStoryByModerator,
  userBlockByModerator,
  deleteReelCommentByModerator,
  deleteReelByModerator,
};
