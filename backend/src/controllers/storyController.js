const Story = require('../models/Story');
const User = require('../models/User');
const Follow = require('../models/Follow');
const { ok, fail } = require('../utils/response');
const { enrichStory } = require('../utils/enrich');
const { firstFile, filesByField } = require('../middleware/upload');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const { serializeUser, serializeStory } = require('../utils/serialize');

async function fetchStory(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id || req.body.user_id);
    const follows = await Follow.find({ my_user_id: myUserId });
    const userIds = follows.map((f) => f.user_id);
    userIds.push(myUserId);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({
      user_id: { $in: userIds },
      created_at: { $gte: since },
    }).sort({ id: -1 });

    const byUser = {};
    for (const s of stories) {
      if (!byUser[s.user_id]) byUser[s.user_id] = [];
      byUser[s.user_id].push(s);
    }

    const data = [];
    for (const uid of Object.keys(byUser)) {
      const user = await User.findOne({ id: Number(uid) });
      if (!user) continue;
      const serialized = serializeUser(user);
      serialized.stories = byUser[uid].map((s) => serializeStory(s, { user: serialized }));
      data.push(serialized);
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchStoryByID(req, res, next) {
  try {
    const story = await Story.findOne({ id: Number(req.body.story_id) });
    if (!story) return fail(res, 'Story not found');
    const data = await enrichStory(story);
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function createStory(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    let contentUrl = req.body.content || '';
    let thumbUrl = req.body.thumbnail || '';

    const contentFile = firstFile(req, 'content') || filesByField(req, 'content')[0];
    const thumbFile = firstFile(req, 'thumbnail');
    if (contentFile) contentUrl = await uploadBuffer(contentFile, 'stories');
    if (thumbFile) thumbUrl = await uploadBuffer(thumbFile, 'stories');

    // Flutter sometimes uploads via uploadFile first and passes URL
    if (!contentUrl && req.body.fileURL) contentUrl = req.body.fileURL;

    const story = new Story({
      user_id: userId,
      type: Number(req.body.type || 0),
      duration: Number(req.body.duration || 0),
      content: contentUrl,
      thumbnail: thumbUrl,
    });
    await story.save();
    return ok(res, await enrichStory(story), 'Story created');
  } catch (e) {
    return next(e);
  }
}

async function viewStory(req, res, next) {
  try {
    const storyId = Number(req.body.story_id);
    const userId = Number(req.body.user_id);
    const story = await Story.findOne({ id: storyId });
    if (!story) return fail(res, 'Story not found');
    const ids = new Set(
      String(story.view_by_user_ids || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    ids.add(String(userId));
    story.view_by_user_ids = Array.from(ids).join(',');
    await story.save();
    return ok(res, null, 'Story viewed');
  } catch (e) {
    return next(e);
  }
}

async function deleteStory(req, res, next) {
  try {
    const storyId = Number(req.body.story_id);
    const userId = Number(req.body.my_user_id || req.body.user_id);
    const story = await Story.findOne({ id: storyId });
    if (!story) return fail(res, 'Story not found');
    if (userId && story.user_id !== userId) {
      const user = await User.findOne({ id: userId });
      if (!user?.is_moderator) return fail(res, 'Not allowed');
    }
    await Story.deleteOne({ id: storyId });
    return ok(res, null, 'Story deleted');
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  fetchStory,
  fetchStoryByID,
  createStory,
  viewStory,
  deleteStory,
};
