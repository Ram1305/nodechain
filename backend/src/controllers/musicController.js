const Music = require('../models/Music');
const MusicCategory = require('../models/MusicCategory');
const User = require('../models/User');
const { ok } = require('../utils/response');
const { skipLimit } = require('../utils/paginate');
const { serializeMusic, iso } = require('../utils/serialize');
const { parseIds } = require('../utils/enrich');

async function fetchMusicWithSearch(req, res, next) {
  try {
    const keyword = (req.body.keyword || '').trim();
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const query = { is_deleted: 0 };
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { artist: { $regex: keyword, $options: 'i' } },
      ];
    }
    const list = await Music.find(query).sort({ id: -1 }).skip(skip).limit(limit);
    return ok(res, list.map(serializeMusic));
  } catch (e) {
    return next(e);
  }
}

async function fetchMusicCategories(req, res, next) {
  try {
    const cats = await MusicCategory.find({ is_deleted: 0 }).sort({ id: 1 });
    return ok(
      res,
      cats.map((c) => ({
        id: c.id,
        title: c.title,
        is_deleted: c.is_deleted,
        musics_count: c.musics_count,
        created_at: iso(c.created_at),
        updated_at: iso(c.updated_at),
      }))
    );
  } catch (e) {
    return next(e);
  }
}

async function fetchMusicByCategory(req, res, next) {
  try {
    const categoryId = Number(req.body.category_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const list = await Music.find({ category_id: categoryId, is_deleted: 0 })
      .sort({ id: -1 })
      .skip(skip)
      .limit(limit);
    return ok(res, list.map(serializeMusic));
  } catch (e) {
    return next(e);
  }
}

async function fetchSavedMusic(req, res, next) {
  try {
    const userId = Number(req.body.user_id || req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const user = await User.findOne({ id: userId });
    const ids = parseIds(user?.saved_music_ids);
    const list = await Music.find({ id: { $in: ids }, is_deleted: 0 })
      .sort({ id: -1 })
      .skip(skip)
      .limit(limit);
    return ok(res, list.map(serializeMusic));
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  fetchMusicWithSearch,
  fetchMusicCategories,
  fetchMusicByCategory,
  fetchSavedMusic,
};
