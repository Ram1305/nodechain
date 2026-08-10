const Post = require('../models/Post');
const Content = require('../models/Content');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const User = require('../models/User');
const Room = require('../models/Room');
const Report = require('../models/Report');
const Follow = require('../models/Follow');
const { ok, fail } = require('../utils/response');
const { skipLimit } = require('../utils/paginate');
const { enrichPost, enrichComment } = require('../utils/enrich');
const { filesByField, firstFile } = require('../middleware/upload');
const { uploadBuffer, uploadMany } = require('../utils/cloudinaryUpload');
const { serializeUser, iso } = require('../utils/serialize');
const { enrichRoom } = require('../utils/enrich');

async function fetchPosts(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const fetchPostType = Number(req.body.fetch_post_type || 0);
    let query = { is_restricted: 0 };

    if (fetchPostType === 1 && myUserId) {
      const follows = await Follow.find({ my_user_id: myUserId });
      const ids = follows.map((f) => f.user_id);
      ids.push(myUserId);
      query.user_id = { $in: ids };
    }

    const posts = await Post.find(query).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const p of posts) data.push(await enrichPost(p, myUserId));

    let suggestedRooms = [];
    if (Number(req.body.should_send_suggested_room) === 1) {
      const rooms = await Room.find({ is_private: 0 }).sort({ id: -1 }).limit(5);
      for (const r of rooms) suggestedRooms.push(await enrichRoom(r, myUserId));
    }

    return res.json({
      status: true,
      message: 'Success',
      data,
      suggestedRooms,
    });
  } catch (e) {
    return next(e);
  }
}

async function addPost(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const contentType = Number(req.body.content_type || 0);
    const post = new Post({
      user_id: userId,
      desc: req.body.desc || '',
      tags: req.body.tags || '',
      interest_ids: req.body.interest_ids || '',
      link_preview_json: req.body.link_preview_json || null,
      content_type: contentType,
    });
    await post.save();

    const contentFiles = [
      ...filesByField(req, 'content'),
      ...filesByField(req, 'content[]'),
    ];
    const thumbFiles = [
      ...filesByField(req, 'thumbnail'),
      ...filesByField(req, 'thumbnail[]'),
    ];
    const contentUrls = await uploadMany(contentFiles, 'posts');
    const thumbUrls = await uploadMany(thumbFiles, 'thumbnails');
    const audioWaves = req.body.audio_waves || '';

    for (let i = 0; i < contentUrls.length; i++) {
      await new Content({
        post_id: post.id,
        content_type: contentType,
        content: contentUrls[i],
        thumbnail: thumbUrls[i] || thumbUrls[0] || '',
        audio_waves: audioWaves,
      }).save();
    }

    const data = await enrichPost(post, userId);
    return ok(res, data, 'Post created');
  } catch (e) {
    return next(e);
  }
}

async function likePost(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const postId = Number(req.body.post_id);
    const existing = await Like.findOne({ user_id: userId, post_id: postId, type: 'post' });
    if (!existing) {
      await new Like({ user_id: userId, post_id: postId, type: 'post' }).save();
      await Post.updateOne({ id: postId }, { $inc: { likes_count: 1 } });
    }
    return ok(res, null, 'Liked');
  } catch (e) {
    return next(e);
  }
}

async function dislikePost(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const postId = Number(req.body.post_id);
    const existing = await Like.findOneAndDelete({ user_id: userId, post_id: postId, type: 'post' });
    if (existing) {
      await Post.updateOne({ id: postId }, { $inc: { likes_count: -1 } });
    }
    return ok(res, null, 'Disliked');
  } catch (e) {
    return next(e);
  }
}

async function deleteMyPost(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const postId = Number(req.body.post_id);
    const post = await Post.findOne({ id: postId, user_id: userId });
    if (!post) return fail(res, 'Post not found');
    await Content.deleteMany({ post_id: postId });
    await Comment.deleteMany({ post_id: postId });
    await Like.deleteMany({ post_id: postId, type: 'post' });
    await Post.deleteOne({ id: postId });
    return ok(res, null, 'Post deleted');
  } catch (e) {
    return next(e);
  }
}

async function fetchPostByUser(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id);
    const userId = Number(req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const posts = await Post.find({ user_id: userId }).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const p of posts) data.push(await enrichPost(p, myUserId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function reportPost(req, res, next) {
  try {
    await new Report({
      type: 'post',
      target_id: Number(req.body.post_id),
      reason: req.body.reason || '',
      desc: req.body.desc || '',
    }).save();
    return ok(res, null, 'Report submitted');
  } catch (e) {
    return next(e);
  }
}

async function addComment(req, res, next) {
  try {
    const comment = new Comment({
      user_id: Number(req.body.user_id),
      post_id: Number(req.body.post_id),
      desc: req.body.desc || '',
    });
    await comment.save();
    await Post.updateOne({ id: comment.post_id }, { $inc: { comments_count: 1 } });
    const data = await enrichComment(comment, comment.user_id);
    return ok(res, data, 'Comment added');
  } catch (e) {
    return next(e);
  }
}

async function deleteComment(req, res, next) {
  try {
    const commentId = Number(req.body.comment_id);
    const userId = Number(req.body.user_id);
    const comment = await Comment.findOne({ id: commentId });
    if (!comment) return fail(res, 'Comment not found');
    if (userId && comment.user_id !== userId) {
      const user = await User.findOne({ id: userId });
      if (!user || !user.is_moderator) return fail(res, 'Not allowed');
    }
    await Comment.deleteOne({ id: commentId });
    await Post.updateOne({ id: comment.post_id }, { $inc: { comments_count: -1 } });
    return ok(res, null, 'Comment deleted');
  } catch (e) {
    return next(e);
  }
}

async function fetchComments(req, res, next) {
  try {
    const postId = Number(req.body.post_id);
    const myUserId = Number(req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const comments = await Comment.find({ post_id: postId }).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const c of comments) data.push(await enrichComment(c, myUserId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function likeDislikeComment(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const commentId = Number(req.body.comment_id);
    const comment = await Comment.findOne({ id: commentId });
    if (!comment) return fail(res, 'Comment not found');
    const existing = await Like.findOne({ user_id: userId, comment_id: commentId, type: 'comment' });
    if (existing) {
      await Like.deleteOne({ id: existing.id });
      comment.comment_like_count = Math.max(0, (comment.comment_like_count || 0) - 1);
    } else {
      await new Like({ user_id: userId, comment_id: commentId, type: 'comment' }).save();
      comment.comment_like_count = (comment.comment_like_count || 0) + 1;
    }
    await comment.save();
    const data = await enrichComment(comment, userId);
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchUsersWhoLikedPost(req, res, next) {
  try {
    const postId = Number(req.body.post_id);
    const likes = await Like.find({ post_id: postId, type: 'post' }).sort({ id: -1 });
    const data = [];
    for (const like of likes) {
      const user = await User.findOne({ id: like.user_id });
      data.push({
        id: like.id,
        user_id: like.user_id,
        post_id: like.post_id,
        created_at: iso(like.created_at),
        updated_at: iso(like.updated_at),
        user: user ? serializeUser(user) : null,
      });
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchPostsByHashtag(req, res, next) {
  try {
    const tag = (req.body.tag || '').replace(/^#/, '');
    const myUserId = Number(req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const posts = await Post.find({ tags: { $regex: tag, $options: 'i' } })
      .sort({ id: -1 })
      .skip(skip)
      .limit(limit);
    const data = [];
    for (const p of posts) data.push(await enrichPost(p, myUserId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchPostByPostId(req, res, next) {
  try {
    const post = await Post.findOne({ id: Number(req.body.post_id) });
    if (!post) return fail(res, 'Post not found');
    const data = await enrichPost(post, Number(req.body.my_user_id));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function uploadFile(req, res, next) {
  try {
    const file = firstFile(req, 'uploadFile') || (req.files && req.files[0]);
    if (!file) return fail(res, 'No file uploaded');
    const url = await uploadBuffer(file, 'uploads');
    return ok(res, url, 'File uploaded');
  } catch (e) {
    return next(e);
  }
}

async function searchPost(req, res, next) {
  try {
    const keyword = (req.body.keyword || '').trim();
    const userId = Number(req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const query = keyword
      ? {
          $or: [
            { desc: { $regex: keyword, $options: 'i' } },
            { tags: { $regex: keyword, $options: 'i' } },
          ],
        }
      : {};
    const posts = await Post.find(query).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const p of posts) data.push(await enrichPost(p, userId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function searchPostByInterestId(req, res, next) {
  try {
    const keyword = (req.body.keyword || '').trim();
    const interestId = String(req.body.interest_id || '');
    const userId = Number(req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const query = {
      interest_ids: { $regex: `(^|,)${interestId}(,|$)` },
    };
    if (keyword) {
      query.$or = [
        { desc: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } },
      ];
    }
    const posts = await Post.find(query).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const p of posts) data.push(await enrichPost(p, userId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function searchHashtag(req, res, next) {
  try {
    const keyword = (req.body.keyword || '').replace(/^#/, '');
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const posts = await Post.find({ tags: { $regex: keyword, $options: 'i' } });
    const map = {};
    for (const p of posts) {
      const tags = String(p.tags || '')
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean);
      for (const t of tags) {
        if (!t.toLowerCase().includes(keyword.toLowerCase())) continue;
        map[t] = (map[t] || 0) + 1;
      }
    }
    const data = Object.entries(map)
      .map(([tag, post_count]) => ({ tag, post_count }))
      .sort((a, b) => b.post_count - a.post_count)
      .slice(skip, skip + limit);
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  fetchPosts,
  addPost,
  likePost,
  dislikePost,
  deleteMyPost,
  fetchPostByUser,
  reportPost,
  addComment,
  deleteComment,
  fetchComments,
  likeDislikeComment,
  fetchUsersWhoLikedPost,
  fetchPostsByHashtag,
  fetchPostByPostId,
  uploadFile,
  searchPost,
  searchPostByInterestId,
  searchHashtag,
};
