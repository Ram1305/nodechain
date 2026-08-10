const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Report = require('../models/Report');
const Interest = require('../models/Interest');
const { ok, fail } = require('../utils/response');
const { skipLimit } = require('../utils/paginate');
const { enrichRoom, parseIds } = require('../utils/enrich');
const { firstFile } = require('../middleware/upload');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const { serializeUser, iso } = require('../utils/serialize');

const MEMBER = 0;
const ADMIN = 1;
const REQUEST = 2;
const INVITED = 3;

async function memberStatus(roomId, userId) {
  const m = await RoomMember.findOne({ room_id: roomId, user_id: userId });
  if (!m) return { userRoomStatus: 0, is_mute: 0, member: null };
  // Flutter userRoomStatus conventions vary; map type roughly
  return { userRoomStatus: m.type + 1, is_mute: m.is_mute || 0, member: m };
}

async function createRoom(req, res, next) {
  try {
    const adminId = Number(req.body.admin_id);
    const photoFile = firstFile(req, 'photo');
    let photo = '';
    if (photoFile) photo = await uploadBuffer(photoFile, 'rooms');

    const room = new Room({
      admin_id: adminId,
      title: req.body.title || '',
      desc: req.body.desc || '',
      interest_ids: req.body.interest_ids || '',
      is_private: Number(req.body.is_private || 0),
      is_join_request_enable: Number(req.body.is_join_request_enable || 0),
      photo,
      total_member: 1,
    });
    await room.save();

    await new RoomMember({
      room_id: room.id,
      user_id: adminId,
      type: ADMIN,
    }).save();

    for (const iid of parseIds(room.interest_ids)) {
      await Interest.updateOne({ id: iid }, { $inc: { totalRoomOfInterest: 1 } });
    }

    return ok(res, await enrichRoom(room, adminId, { userRoomStatus: 2 }), 'Room created');
  } catch (e) {
    return next(e);
  }
}

async function editRoom(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const room = await Room.findOne({ id: roomId });
    if (!room) return fail(res, 'Room not found');

    if (req.body.title !== undefined) room.title = req.body.title;
    if (req.body.desc !== undefined) room.desc = req.body.desc;
    if (req.body.interest_ids !== undefined) room.interest_ids = req.body.interest_ids;
    if (req.body.is_private !== undefined) room.is_private = Number(req.body.is_private);
    if (req.body.is_join_request_enable !== undefined) {
      room.is_join_request_enable = Number(req.body.is_join_request_enable);
    }
    if (req.body.admin_id !== undefined) room.admin_id = Number(req.body.admin_id);

    const photoFile = firstFile(req, 'photo');
    if (photoFile) room.photo = await uploadBuffer(photoFile, 'rooms');

    await room.save();
    const status = await memberStatus(room.id, Number(req.body.admin_id || room.admin_id));
    return ok(res, await enrichRoom(room, room.admin_id, status), 'Room updated');
  } catch (e) {
    return next(e);
  }
}

async function fetchMyOwnRooms(req, res, next) {
  try {
    const userId = Number(req.body.user_id || req.body.admin_id || req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const rooms = await Room.find({ admin_id: userId }).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const r of rooms) {
      const status = await memberStatus(r.id, userId);
      data.push(await enrichRoom(r, userId, status));
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchRoomsByInterest(req, res, next) {
  try {
    const interestId = String(req.body.interest_id || '');
    const myUserId = Number(req.body.my_user_id || req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const rooms = await Room.find({
      interest_ids: { $regex: `(^|,)${interestId}(,|$)` },
      is_private: 0,
    })
      .sort({ id: -1 })
      .skip(skip)
      .limit(limit);
    const data = [];
    for (const r of rooms) {
      const status = await memberStatus(r.id, myUserId);
      data.push(await enrichRoom(r, myUserId, status));
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchRandomRooms(req, res, next) {
  try {
    const myUserId = Number(req.body.my_user_id || req.body.user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const rooms = await Room.find({ is_private: 0 }).sort({ id: -1 }).skip(skip).limit(limit);
    const data = [];
    for (const r of rooms) {
      const status = await memberStatus(r.id, myUserId);
      data.push(await enrichRoom(r, myUserId, status));
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchRoomDetail(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const myUserId = Number(req.body.my_user_id || req.body.user_id);
    const room = await Room.findOne({ id: roomId });
    if (!room) return fail(res, 'Room not found');
    const shouldShow = Number(req.body.should_show_member || 0);
    const extras = await memberStatus(roomId, myUserId);
    if (shouldShow) {
      const members = await RoomMember.find({ room_id: roomId, type: { $in: [MEMBER, ADMIN] } });
      const roomUsers = [];
      for (const m of members) {
        const u = await User.findOne({ id: m.user_id });
        if (u) roomUsers.push(serializeUser(u));
      }
      extras.roomUsers = roomUsers;
    }
    return ok(res, await enrichRoom(room, myUserId, extras));
  } catch (e) {
    return next(e);
  }
}

async function reportRoom(req, res, next) {
  try {
    await new Report({
      type: 'room',
      target_id: Number(req.body.room_id),
      reason: req.body.reason || '',
      desc: req.body.desc || '',
    }).save();
    return ok(res, null, 'Report submitted');
  } catch (e) {
    return next(e);
  }
}

async function joinOrRequestRoom(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    const room = await Room.findOne({ id: roomId });
    if (!room) return fail(res, 'Room not found');

    let member = await RoomMember.findOne({ room_id: roomId, user_id: userId });
    if (member && (member.type === MEMBER || member.type === ADMIN)) {
      return ok(res, await enrichRoom(room, userId, await memberStatus(roomId, userId)), 'Already member');
    }

    const type = room.is_join_request_enable || room.is_private ? REQUEST : MEMBER;
    if (member) {
      member.type = type;
      await member.save();
    } else {
      member = await new RoomMember({ room_id: roomId, user_id: userId, type }).save();
    }

    if (type === MEMBER) {
      room.total_member = (room.total_member || 0) + 1;
      await room.save();
    }

    return ok(res, await enrichRoom(room, userId, await memberStatus(roomId, userId)), 'Joined/requested');
  } catch (e) {
    return next(e);
  }
}

async function acceptInvitation(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    const inv = await Invitation.findOne({ room_id: roomId, user_id: userId });
    if (inv) await Invitation.deleteOne({ id: inv.id });

    let member = await RoomMember.findOne({ room_id: roomId, user_id: userId });
    if (!member) {
      member = await new RoomMember({ room_id: roomId, user_id: userId, type: MEMBER }).save();
      await Room.updateOne({ id: roomId }, { $inc: { total_member: 1 } });
    } else {
      member.type = MEMBER;
      await member.save();
    }
    return ok(res, null, 'Invitation accepted');
  } catch (e) {
    return next(e);
  }
}

async function rejectInvitation(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    await Invitation.deleteMany({ room_id: roomId, user_id: userId });
    await RoomMember.deleteMany({ room_id: roomId, user_id: userId, type: INVITED });
    return ok(res, null, 'Invitation rejected');
  } catch (e) {
    return next(e);
  }
}

async function getInvitationList(req, res, next) {
  try {
    const userId = Number(req.body.user_id || req.body.my_user_id);
    const list = await Invitation.find({ user_id: userId }).sort({ id: -1 });
    const data = [];
    for (const inv of list) {
      const room = await Room.findOne({ id: inv.room_id });
      const user = await User.findOne({ id: inv.invited_by });
      const invitedUser = await User.findOne({ id: inv.user_id });
      data.push({
        id: inv.id,
        room_id: inv.room_id,
        user_id: inv.user_id,
        invited_by: inv.invited_by,
        type: inv.type,
        created_at: iso(inv.created_at),
        updated_at: iso(inv.updated_at),
        room: room ? await enrichRoom(room, userId) : null,
        user: user ? serializeUser(user) : null,
        invited_user: invitedUser ? serializeUser(invitedUser) : null,
      });
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function inviteUserToRoom(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    const invitedBy = Number(req.body.my_user_id || req.body.admin_id);
    await new Invitation({
      room_id: roomId,
      user_id: userId,
      invited_by: invitedBy,
      type: 0,
    }).save();
    let member = await RoomMember.findOne({ room_id: roomId, user_id: userId });
    if (member) {
      member.type = INVITED;
      await member.save();
    } else {
      await new RoomMember({ room_id: roomId, user_id: userId, type: INVITED }).save();
    }
    return ok(res, null, 'Invitation sent');
  } catch (e) {
    return next(e);
  }
}

async function leaveThisRoom(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    const member = await RoomMember.findOneAndDelete({ room_id: roomId, user_id: userId });
    if (member && (member.type === MEMBER || member.type === ADMIN)) {
      await Room.updateOne({ id: roomId }, { $inc: { total_member: -1 } });
    }
    return ok(res, null, 'Left room');
  } catch (e) {
    return next(e);
  }
}

async function fetchRoomRequestList(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const members = await RoomMember.find({ room_id: roomId, type: REQUEST });
    const data = [];
    for (const m of members) {
      const user = await User.findOne({ id: m.user_id });
      data.push({
        id: m.id,
        room_id: m.room_id,
        user_id: m.user_id,
        type: m.type,
        is_mute: m.is_mute,
        created_at: iso(m.created_at),
        updated_at: iso(m.updated_at),
        user: user ? serializeUser(user) : null,
      });
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function acceptRoomRequest(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    const member = await RoomMember.findOne({ room_id: roomId, user_id: userId });
    if (!member) return fail(res, 'Request not found');
    member.type = MEMBER;
    await member.save();
    await Room.updateOne({ id: roomId }, { $inc: { total_member: 1 } });
    return ok(res, null, 'Request accepted');
  } catch (e) {
    return next(e);
  }
}

async function rejectRoomRequest(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    await RoomMember.deleteMany({ room_id: roomId, user_id: userId, type: REQUEST });
    return ok(res, null, 'Request rejected');
  } catch (e) {
    return next(e);
  }
}

async function deleteRoom(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    await Room.deleteOne({ id: roomId });
    await RoomMember.deleteMany({ room_id: roomId });
    await Invitation.deleteMany({ room_id: roomId });
    return ok(res, null, 'Room deleted');
  } catch (e) {
    return next(e);
  }
}

async function fetchRoomUsersList(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const members = await RoomMember.find({ room_id: roomId, type: { $in: [MEMBER, ADMIN] } });
    const data = [];
    for (const m of members) {
      const user = await User.findOne({ id: m.user_id });
      data.push({
        id: m.id,
        room_id: m.room_id,
        user_id: m.user_id,
        type: m.type,
        is_mute: m.is_mute,
        created_at: iso(m.created_at),
        updated_at: iso(m.updated_at),
        user: user ? serializeUser(user) : null,
      });
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function fetchRoomAdmins(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const members = await RoomMember.find({ room_id: roomId, type: ADMIN });
    const data = [];
    for (const m of members) {
      const user = await User.findOne({ id: m.user_id });
      data.push({
        id: m.id,
        room_id: m.room_id,
        user_id: m.user_id,
        type: m.type,
        is_mute: m.is_mute,
        created_at: iso(m.created_at),
        updated_at: iso(m.updated_at),
        user: user ? serializeUser(user) : null,
      });
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

async function removeUserFromRoom(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    const member = await RoomMember.findOneAndDelete({ room_id: roomId, user_id: userId });
    if (member && (member.type === MEMBER || member.type === ADMIN)) {
      await Room.updateOne({ id: roomId }, { $inc: { total_member: -1 } });
    }
    return ok(res, null, 'User removed');
  } catch (e) {
    return next(e);
  }
}

async function makeRoomAdmin(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    await RoomMember.findOneAndUpdate(
      { room_id: roomId, user_id: userId },
      { type: ADMIN },
      { upsert: true }
    );
    return ok(res, null, 'Admin assigned');
  } catch (e) {
    return next(e);
  }
}

async function removeAdminFromRoom(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    await RoomMember.findOneAndUpdate({ room_id: roomId, user_id: userId }, { type: MEMBER });
    return ok(res, null, 'Admin removed');
  } catch (e) {
    return next(e);
  }
}

async function searchUserForInvitation(req, res, next) {
  try {
    const keyword = (req.body.keyword || '').trim();
    const myUserId = Number(req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const query = { id: { $ne: myUserId }, is_block: 0 };
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { full_name: { $regex: keyword, $options: 'i' } },
      ];
    }
    const list = await User.find(query).skip(skip).limit(limit);
    return ok(res, list.map(serializeUser));
  } catch (e) {
    return next(e);
  }
}

async function muteUnmuteRoomNotification(req, res, next) {
  try {
    const roomId = Number(req.body.room_id);
    const userId = Number(req.body.user_id);
    const isMute = Number(req.body.is_mute ?? 1);
    await RoomMember.findOneAndUpdate({ room_id: roomId, user_id: userId }, { is_mute: isMute });
    return ok(res, null, 'Mute updated');
  } catch (e) {
    return next(e);
  }
}

async function fetchRoomsIAmIn(req, res, next) {
  try {
    const userId = Number(req.body.user_id || req.body.my_user_id);
    const { skip, limit } = skipLimit(req.body.start, req.body.limit);
    const memberships = await RoomMember.find({
      user_id: userId,
      type: { $in: [MEMBER, ADMIN] },
    })
      .sort({ id: -1 })
      .skip(skip)
      .limit(limit);
    const data = [];
    for (const m of memberships) {
      const room = await Room.findOne({ id: m.room_id });
      if (room) {
        data.push(
          await enrichRoom(room, userId, {
            userRoomStatus: m.type + 1,
            is_mute: m.is_mute,
          })
        );
      }
    }
    return ok(res, data);
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  createRoom,
  editRoom,
  fetchMyOwnRooms,
  fetchRoomsByInterest,
  fetchRandomRooms,
  fetchRoomDetail,
  reportRoom,
  joinOrRequestRoom,
  acceptInvitation,
  rejectInvitation,
  getInvitationList,
  inviteUserToRoom,
  leaveThisRoom,
  fetchRoomRequestList,
  acceptRoomRequest,
  rejectRoomRequest,
  deleteRoom,
  fetchRoomUsersList,
  fetchRoomAdmins,
  removeUserFromRoom,
  makeRoomAdmin,
  removeAdminFromRoom,
  searchUserForInvitation,
  muteUnmuteRoomNotification,
  fetchRoomsIAmIn,
};
