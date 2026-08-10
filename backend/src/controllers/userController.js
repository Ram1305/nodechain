const User = require('../models/User');
const Follow = require('../models/Follow');
const Report = require('../models/Report');
const Story = require('../models/Story');
const { ok, fail } = require('../utils/response');
const { skipLimit } = require('../utils/paginate');
const { enrichUser, enrichStory } = require('../utils/enrich');
const { firstFile } = require('../middleware/upload');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const { serializeUser } = require('../utils/serialize');

async function addUser(req, res, next) {
  try {
    const { identity, full_name, device_token, login_type, device_type } = req.body;
    if (!identity) return fail(res, 'identity required');

    let user = await User.findOne({ identity });
    if (!user) {
      user = new User({
        identity,
        full_name: full_name || '',
        username: '',
        device_token: device_token || '',
        login_type: Number(login_type) || 0,
        device_type: Number(device_type) || 0,
      });
      await user.save();
    } else {
      user.device_token = device_token || user.device_token;
      user.device_type = Number(device_type ?? user.device_type);
      user.login_type = Number(login_type ?? user.login_type);
      if (full_name) user.full_name = full_name;
      await user.save();
    }

    const data = await enrichUser(user, user.id);
    return ok(res, data, 'User registered');
  } catch (e) {
    return next(e);
  }
}

async function editProfile(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const user = await User.findOne({ id: userId });
    if (!user) return fail(res, 'User not found');

    const fields = [
      'username',
      'full_name',
      'bio',
      'interest_ids',
      'block_user_ids',
      'saved_music_ids',
      'saved_reel_ids',
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined && req.body[f] !== null) {
        user[f] = String(req.body[f]);
      }
    }
    if (req.body.is_push_notifications !== undefined) {
      user.is_push_notifications = Number(req.body.is_push_notifications);
    }
    if (req.body.is_invited_to_room !== undefined) {
      user.is_invited_to_room = Number(req.body.is_invited_to_room);
    }
    if (req.body.is_verified !== undefined) {
      user.is_verified = Number(req.body.is_verified);
    }

    const profileFile = firstFile(req, 'profile');
    const bgFile = firstFile(req, 'background_image');
    if (profileFile) {
      user.profile = await uploadBuffer(profileFile, 'profiles');
    }
    if (bgFile) {
      user.background_image = await uploadBuffer(bgFile, 'backgrounds');
    }

    await user.save();
    const data = await enrichUser(user, userId);
    return ok(res, data, 'Profile updated');
  } catch (e) {
    return next(e);
  }
}

async function fetchProfile(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const myUserId = Number(req.body.my_user_id);
    const user = await User.findOne({ id: userId });
    if (!user) return fail(res, 'User not found');
    const data = await enrichUser(user, myUserId);
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchRandomProfile(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id);
    const count = await User.countDocuments({ id: { $ne: myUserId }, is_block: 0 });
    if (!count) return fail(res, 'No users found');
    const skip = Math.floor(Math.random() * count);
    const user = await User.findOne({ id: { $ne: myUserId }, is_block: 0 }).skip(skip);
    const data = await enrichUser(user, myUserId);
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function checkUsername(req, res, next) {
  try {
    const username = (req.body.username || '').trim();
    if (!username) return fail(res, 'username required');
    const exists = await User.findOne({ username });
    if (exists) return fail(res, 'Username taken');
    return ok(res, null, 'Username available');
  } catch (e) {
    return next(e);
  }
}

async function logOut(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const user = await User.findOne({ id: userId });
    if (user) {
      user.device_token = '';
      await user.save();
    }
    return ok(res, null, 'Logged out');
  } catch (e) {
    return next(e);
  }
}

async function deleteUser(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    await User.deleteOne({ id: userId });
    await Follow.deleteMany({ $or: [{ user_id: userId }, { my_user_id: userId }] });
    return ok(res, null, 'User deleted');
  } catch (e) {
    return next(e);
  }
}

async function followUser(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const myUserId = Number(req.body.my_user_id);
    const existing = await Follow.findOne({ user_id: userId, my_user_id: myUserId });
    if (!existing) {
      await new Follow({ user_id: userId, my_user_id: myUserId }).save();
      await User.updateOne({ id: userId }, { $inc: { followers: 1 } });
      await User.updateOne({ id: myUserId }, { $inc: { following: 1 } });
    }
    return ok(res, null, 'Followed');
  } catch (e) {
    return next(e);
  }
}

async function unfollowUser(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const myUserId = Number(req.body.my_user_id);
    const existing = await Follow.findOneAndDelete({ user_id: userId, my_user_id: myUserId });
    if (existing) {
      await User.updateOne({ id: userId }, { $inc: { followers: -1 } });
      await User.updateOne({ id: myUserId }, { $inc: { following: -1 } });
    }
    return ok(res, null, 'Unfollowed');
  } catch (e) {
    return next(e);
  }
}

async function blockUser(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const myUserId = Number(req.body.my_user_id);
    const me = await User.findOne({ id: myUserId });
    if (!me) return fail(res, 'User not found');
    const ids = new Set(
      String(me.block_user_ids || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    ids.add(String(userId));
    me.block_user_ids = Array.from(ids).join(',');
    await me.save();
    return ok(res, null, 'User blocked');
  } catch (e) {
    return next(e);
  }
}

async function unblockUser(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const myUserId = Number(req.body.my_user_id);
    const me = await User.findOne({ id: myUserId });
    if (!me) return fail(res, 'User not found');
    const ids = String(me.block_user_ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter((id) => id && id !== String(userId));
    me.block_user_ids = ids.join(',');
    await me.save();
    const data = await enrichUser(me, myUserId);
    return ok(res, data, 'User unblocked');
  } catch (e) {
    return next(e);
  }
}

async function fetchFollowingList(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const follows = await Follow.find({ my_user_id: myUserId }).skip(skip).limit(limit).sort({ id: -1 });
    const users = [];
    for (const f of follows) {
      const u = await User.findOne({ id: f.user_id });
      if (u) users.push(await enrichUser(u, myUserId));
    }
    return ok(res, users);
  } catch (e) {
    return next(e);
  }
}

async function fetchFollowersList(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const keyword = (req.body.keyword || '').trim();
    const follows = await Follow.find({ user_id: userId }).sort({ id: -1 });
    let users = [];
    for (const f of follows) {
      const u = await User.findOne({ id: f.my_user_id });
      if (!u) continue;
      if (keyword) {
        const q = keyword.toLowerCase();
        if (
          !(u.username || '').toLowerCase().includes(q) &&
          !(u.full_name || '').toLowerCase().includes(q)
        ) {
          continue;
        }
      }
      users.push(await enrichUser(u, userId));
    }
    users = users.slice(skip, skip + limit);
    return ok(res, users);
  } catch (e) {
    return next(e);
  }
}

async function searchProfile(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id);
    const keyword = (req.body.keyword || '').trim();
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const query = {
      id: { $ne: myUserId },
      is_block: 0,
    };
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { full_name: { $regex: keyword, $options: 'i' } },
      ];
    }
    const list = await User.find(query).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const u of list) data.push(await enrichUser(u, myUserId));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchBlockedUserList(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id);
    const me = await User.findOne({ id: myUserId });
    if (!me) return ok(res, []);
    const ids = String(me.block_user_ids || '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    const list = await User.find({ id: { $in: ids } });
    const data = list.map((u) => serializeUser(u));
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function reportUser(req, res, next) {
  try {
    await new Report({
      type: 'user',
      target_id: Number(req.body.user_id),
      reason: req.body.reason || '',
      desc: req.body.desc || '',
    }).save();
    return ok(res, null, 'Report submitted');
  } catch (e) {
    return next(e);
  }
}

async function profileVerification(req, res, next) {
  try {
    const userId = Number(req.body.user_id);
    const user = await User.findOne({ id: userId });
    if (!user) return fail(res, 'User not found');
    if (req.body.full_name) user.full_name = req.body.full_name;
    user.verification_document_type = req.body.document_type || '';
    const doc = firstFile(req, 'document');
    const selfie = firstFile(req, 'selfie');
    if (doc) user.verification_document = await uploadBuffer(doc, 'verification');
    if (selfie) user.verification_selfie = await uploadBuffer(selfie, 'verification');
    user.is_verified = 1;
    await user.save();
    return ok(res, null, 'Verification request submitted');
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  addUser,
  editProfile,
  fetchProfile,
  fetchRandomProfile,
  checkUsername,
  logOut,
  deleteUser,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  fetchFollowingList,
  fetchFollowersList,
  searchProfile,
  fetchBlockedUserList,
  reportUser,
  profileVerification,
};
