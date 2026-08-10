const express = require('express');
const common = require('../controllers/commonController');
const user = require('../controllers/userController');
const post = require('../controllers/postController');
const room = require('../controllers/roomController');
const story = require('../controllers/storyController');
const reel = require('../controllers/reelController');
const music = require('../controllers/musicController');
const moderator = require('../controllers/moderatorController');
const { uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

function postRoute(path, ...handlers) {
  router.post(`/${path}`, ...handlers);
}

// Common
postRoute('fetchSetting', common.fetchSetting);
postRoute('fetchPlatformNotification', common.fetchPlatformNotification);
postRoute('fetchUserNotification', common.fetchUserNotification);
postRoute('fetchFAQs', common.fetchFAQs);
postRoute('generateAgoraToken', common.generateAgoraToken);
postRoute('pushNotificationToSingleUser', common.pushNotificationToSingleUser);

// User
postRoute('addUser', user.addUser);
postRoute('editProfile', uploadMiddleware, user.editProfile);
postRoute('fetchProfile', user.fetchProfile);
postRoute('fetchRandomProfile', user.fetchRandomProfile);
postRoute('checkUsername', user.checkUsername);
postRoute('logOut', user.logOut);
postRoute('deleteUser', user.deleteUser);
postRoute('followUser', user.followUser);
postRoute('unfollowUser', user.unfollowUser);
postRoute('fetchFollowingList', user.fetchFollowingList);
postRoute('fetchFollowersList', user.fetchFollowersList);
postRoute('searchProfile', user.searchProfile);
postRoute('UserBlockedByUser', user.blockUser);
postRoute('UserUnblockedByUser', user.unblockUser);
postRoute('fetchBlockedUserList', user.fetchBlockedUserList);
postRoute('reportUser', user.reportUser);
postRoute('profileVerification', uploadMiddleware, user.profileVerification);

// Post
postRoute('fetchPosts', post.fetchPosts);
postRoute('likePost', post.likePost);
postRoute('dislikePost', post.dislikePost);
postRoute('deleteMyPost', post.deleteMyPost);
postRoute('addPost', uploadMiddleware, post.addPost);
postRoute('fetchPostByUser', post.fetchPostByUser);
postRoute('reportPost', post.reportPost);
postRoute('addComment', post.addComment);
postRoute('deleteComment', post.deleteComment);
postRoute('fetchComments', post.fetchComments);
postRoute('fetchPostsByHashtag', post.fetchPostsByHashtag);
postRoute('fetchPostByPostId', post.fetchPostByPostId);
postRoute('uploadFile', uploadMiddleware, post.uploadFile);
postRoute('searchPost', post.searchPost);
postRoute('searchPostByInterestId', post.searchPostByInterestId);
postRoute('likeDislikeComment', post.likeDislikeComment);
postRoute('fetchUsersWhoLikedPost', post.fetchUsersWhoLikedPost);
postRoute('searchHashtag', post.searchHashtag);

// Room
postRoute('createRoom', uploadMiddleware, room.createRoom);
postRoute('editRoom', uploadMiddleware, room.editRoom);
postRoute('fetchMyOwnRooms', room.fetchMyOwnRooms);
postRoute('fetchRoomsByInterest', room.fetchRoomsByInterest);
postRoute('fetchRandomRooms', room.fetchRandomRooms);
postRoute('fetchRoomDetail', room.fetchRoomDetail);
postRoute('reportRoom', room.reportRoom);
postRoute('joinOrRequestRoom', room.joinOrRequestRoom);
postRoute('acceptInvitation', room.acceptInvitation);
postRoute('rejectInvitation', room.rejectInvitation);
postRoute('getInvitationList', room.getInvitationList);
postRoute('inviteUserToRoom', room.inviteUserToRoom);
postRoute('leaveThisRoom', room.leaveThisRoom);
postRoute('fetchRoomRequestList', room.fetchRoomRequestList);
postRoute('acceptRoomRequest', room.acceptRoomRequest);
postRoute('rejectRoomRequest', room.rejectRoomRequest);
postRoute('deleteRoom', room.deleteRoom);
postRoute('fetchRoomUsersList', room.fetchRoomUsersList);
postRoute('fetchRoomAdmins', room.fetchRoomAdmins);
postRoute('removeUserFromRoom', room.removeUserFromRoom);
postRoute('makeRoomAdmin', room.makeRoomAdmin);
postRoute('removeAdminFromRoom', room.removeAdminFromRoom);
postRoute('searchUserForInvitation', room.searchUserForInvitation);
postRoute('muteUnmuteRoomNotification', room.muteUnmuteRoomNotification);
postRoute('fetchRoomsIAmIn', room.fetchRoomsIAmIn);

// Story
postRoute('fetchStory', story.fetchStory);
postRoute('viewStory', story.viewStory);
postRoute('createStory', uploadMiddleware, story.createStory);
postRoute('deleteStory', story.deleteStory);
postRoute('fetchStoryByID', story.fetchStoryByID);

// Music
postRoute('fetchMusicWithSearch', music.fetchMusicWithSearch);
postRoute('fetchMusicCategories', music.fetchMusicCategories);
postRoute('fetchMusicByCategory', music.fetchMusicByCategory);
postRoute('fetchSavedMusic', music.fetchSavedMusic);

// Reel
postRoute('uploadReel', uploadMiddleware, reel.uploadReel);
postRoute('fetchReelsOnExplore', reel.fetchReelsOnExplore);
postRoute('fetchReelsByHashtag', reel.fetchReelsByHashtag);
postRoute('fetchReelsByMusic', reel.fetchReelsByMusic);
postRoute('fetchReelsByUserId', reel.fetchReelsByUserId);
postRoute('fetchSavedReels', reel.fetchSavedReels);
postRoute('fetchReelById', reel.fetchReelById);
postRoute('searchReelsByInterestId', reel.searchReelsByInterestId);
postRoute('likeDislikeReel', reel.likeDislikeReel);
postRoute('addReelComment', reel.addReelComment);
postRoute('fetchReelComments', reel.fetchReelComments);
postRoute('deleteReelComment', reel.deleteReelComment);
postRoute('reportReel', reel.reportReel);
postRoute('increaseReelViewCount', reel.increaseReelViewCount);
postRoute('deleteReel', reel.deleteReel);

// Moderator
postRoute('Moderator/deletePostByModerator', moderator.deletePostByModerator);
postRoute('Moderator/deleteCommentByModerator', moderator.deleteCommentByModerator);
postRoute('Moderator/deleteRoomByModerator', moderator.deleteRoomByModerator);
postRoute('Moderator/deleteStoryByModerator', moderator.deleteStoryByModerator);
postRoute('Moderator/userBlockByModerator', moderator.userBlockByModerator);
postRoute('Moderator/deleteReelCommentByModerator', moderator.deleteReelCommentByModerator);
postRoute('Moderator/deleteReelByModerator', moderator.deleteReelByModerator);

module.exports = router;
