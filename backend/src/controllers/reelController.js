const Reel = require('../models/Reel');
const ReelComment = require('../models/ReelComment');
const Like = require('../models/Like');
const User = require('../models/User');
const Report = require('../models/Report');
const { ok, fail } = require('../utils/response');
const { skipLimit } = require('../utils/paginate');
const { enrichReel, enrichReelComment, parseIds } = require('../utils/enrich');
const { firstFile } = require('../middleware/upload');
const { uploadBuffer } = require('../utils/cloudinaryUpload');

async function uploadReel(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const contentFile = firstFile(req, 'content');
    const thumbFile = firstFile(req, 'thumbnail');
    if (!contentFile) return fail(res, 'content file required');

    const content = await uploadBuffer(contentFile, 'reels');
    const thumbnail = thumbFile ? await uploadBuffer(thumbFile, 'reels') : '';

    const reel = new Reel({
      user_id: userId,
      description: req.body.description || '',
      interest_ids: req.body.interest_ids || '',
      hashtags: req.body.hashtags || '',
      music_id: req.body.music_id ? Number(req.body.music_id) : null,
      content,
      thumbnail,
    });
    await reel.save();
    return ok(res, await enrichReel(reel, userId), 'Reel uploaded');
  } catch (e) {
    return next(e);
  }
}

async function fetchReelsOnExplore(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const reels = await Reel.find().sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const r of reels) data.push(await enrichReel(r, myUserId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchReelsByHashtag(req, res, next) {
  try {
    const tag = (req.body.tag || '').replace(/^#/, '');
    const userId = Number(req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const reels = await Reel.find({ hashtags: { $regex: tag, $options: 'i' } })
      .sort({ id: -1 })
      .skip(skip)
      .limit(limit);
    const data = [];
    for (const r of reels) data.push(await enrichReel(r, userId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchReelsByMusic(req, res, next) {
  try {
    const musicId = Number(req.body.music_id);
    const userId = Number(req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const reels = await Reel.find({ music_id: musicId }).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const r of reels) data.push(await enrichReel(r, userId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchReelsByUserId(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const myUserId = Number(req.body.my_user_id || userId);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const reels = await Reel.find({ user_id: userId }).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const r of reels) data.push(await enrichReel(r, myUserId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchSavedReels(req, res, next) {
  try {
    const userId = Number(req.body.user_id || req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const user = await User.findOne({ id: userId });
    const ids = parseIds(user?.saved_reel_ids);
    const reels = await Reel.find({ id: { $in: ids } })
      .sort({ id: -1 })
      .skip(skip)
      .limit(limit);
    const data = [];
    for (const r of reels) data.push(await enrichReel(r, userId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchReelById(req, res, next) {
  try {
    const reel = await Reel.findOne({ id: Number(req.body.reel_id) });
    if (!reel) return fail(res, 'Reel not found');
    return ok(res, await enrichReel(reel, Number(req.body.user_id || req.body.my_user_id)));
  } catch (e) {
    return next(e);
  }
}

async function searchReelsByInterestId(req, res, next) {
  try {
    const keyword = (req.body.keyword || '').trim();
    const interestId = req.body.interest_id ? String(req.body.interest_id) : null;
    const userId = Number(req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const query = {};
    if (interestId) {
      query.interest_ids = { $regex: `(^|,)${interestId}(,|$)` };
    }
    if (keyword) {
      query.$or = [
        { description: { $regex: keyword, $options: 'i' } },
        { hashtags: { $regex: keyword, $options: 'i' } },
      ];
    }
    const reels = await Reel.find(query).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const r of reels) data.push(await enrichReel(r, userId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function likeDislikeReel(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const reelId = Number(req.body.reel_id);
    const reel = await Reel.findOne({ id: reelId });
    if (!reel) return fail(res, 'Reel not found');
    const existing = await Like.findOne({ user_id: userId, reel_id: reelId, type: 'reel' });
    if (existing) {
      await Like.deleteOne({ id: existing.id });
      reel.likes_count = Math.max(0, (reel.likes_count || 0) - 1);
    } else {
      await new Like({ user_id: userId, reel_id: reelId, type: 'reel' }).save();
      reel.likes_count = (reel.likes_count || 0) + 1;
    }
    await reel.save();
    return ok(res, await enrichReel(reel, userId));
  } catch (e) {
    return next(e);
  }
}

async function addReelComment(req, res, next) {
  try {
    const comment = new ReelComment({
      user_id: Number(req.body.user_id),
      reel_id: Number(req.body.reel_id),
      description: req.body.description || '',
    });
    await comment.save();
    await Reel.updateOne({ id: comment.reel_id }, { $inc: { comments_count: 1 } });
    return ok(res, await enrichReelComment(comment), 'Comment added');
  } catch (e) {
    return next(e);
  }
}

async function fetchReelComments(req, res, next) {
  try {
    const reelId = Number(req.body.reel_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const comments = await ReelComment.find({ reel_id: reelId }).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const c of comments) data.push(await enrichReelComment(c));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function deleteReelComment(req, res, next) {
  try {
    const commentId = Number(req.body.comment_id || req.body.reel_comment_id);
    const comment = await ReelComment.findOne({ id: commentId });
    if (!comment) return fail(res, 'Comment not found');
    await ReelComment.deleteOne({ id: commentId });
    await Reel.updateOne({ id: comment.reel_id }, { $inc: { comments_count: -1 } });
    return ok(res, null, 'Comment deleted');
  } catch (e) {
    return next(e);
  }
}

async function reportReel(req, res, next) {
  try {
    await new Report({
      type: 'reel',
      target_id: Number(req.body.reel_id),
      reason: req.body.reason || '',
      desc: req.body.desc || '',
    }).save();
    return ok(res, null, 'Report submitted');
  } catch (e) {
    return next(e);
  }
}

async function increaseReelViewCount(req, res, next) {
  try {
    const reelId = Number(req.body.reel_id);
    await Reel.updateOne({ id: reelId }, { $inc: { views_count: 1 } });
    return ok(res, null, 'View counted');
  } catch (e) {
    return next(e);
  }
}

async function deleteReel(req, res, next) {
  try {
    const reelId = Number(req.body.reel_id);
    const userId = Number(req.body.user_id || req.body.my_user_id);
    const reel = await Reel.findOne({ id: reelId });
    if (!reel) return fail(res, 'Reel not found');
    if (userId && reel.user_id !== userId) {
      const user = await User.findOne({ id: userId });
      if (!user?.is_moderator) return fail(res, 'Not allowed');
    }
    await ReelComment.deleteMany({ reel_id: reelId });
    await Like.deleteMany({ reel_id: reelId, type: 'reel' });
    await Reel.deleteOne({ id: reelId });
    return ok(res, null, 'Reel deleted');
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  uploadReel,
  fetchReelsOnExplore,
  fetchReelsByHashtag,
  fetchReelsByMusic,
  fetchReelsByUserId,
  fetchSavedReels,
  fetchReelById,
  searchReelsByInterestId,
  likeDislikeReel,
  addReelComment,
  fetchReelComments,
  deleteReelComment,
  reportReel,
  increaseReelViewCount,
  deleteReel,
};
