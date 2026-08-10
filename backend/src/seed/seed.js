require('dotenv').config();
const { connectDb } = require('../config/db');
const Setting = require('../models/Setting');
const Interest = require('../models/Interest');
const MusicCategory = require('../models/MusicCategory');
const Music = require('../models/Music');
const FaqCategory = require('../models/FaqCategory');
const PlatformNotification = require('../models/PlatformNotification');
const Counter = require('../models/Counter');

async function ensureCounter(name, seq) {
  await Counter.findOneAndUpdate({ _id: name }, { $max: { seq } }, { upsert: true });
}

async function seed() {
  await connectDb();

  await Setting.deleteMany({});
  await Interest.deleteMany({});
  await MusicCategory.deleteMany({});
  await Music.deleteMany({});
  await FaqCategory.deleteMany({});
  await PlatformNotification.deleteMany({});

  const interestTitles = [
    'Music',
    'Sports',
    'Travel',
    'Food',
    'Technology',
    'Fashion',
    'Gaming',
    'Art',
    'Movies',
    'Fitness',
  ];

  const interests = [];
  for (let i = 0; i < interestTitles.length; i++) {
    const interest = await new Interest({
      id: i + 1,
      title: interestTitles[i],
    }).save();
    interests.push(interest);
  }
  await ensureCounter('interest', interestTitles.length);

  const documentType = [
    { id: 1, title: 'Passport', created_at: new Date(), updated_at: new Date() },
    { id: 2, title: 'Driving License', created_at: new Date(), updated_at: new Date() },
    { id: 3, title: 'National ID', created_at: new Date(), updated_at: new Date() },
  ];
  const reportReasons = [
    { id: 1, title: 'Spam', created_at: new Date(), updated_at: new Date() },
    { id: 2, title: 'Harassment', created_at: new Date(), updated_at: new Date() },
    { id: 3, title: 'Inappropriate content', created_at: new Date(), updated_at: new Date() },
    { id: 4, title: 'Other', created_at: new Date(), updated_at: new Date() },
  ];
  const restrictedUsernames = [
    { id: 1, title: 'admin', created_at: new Date(), updated_at: new Date() },
    { id: 2, title: 'support', created_at: new Date(), updated_at: new Date() },
    { id: 3, title: 'chatter', created_at: new Date(), updated_at: new Date() },
  ];

  await new Setting({
    id: 1,
    app_name: 'Chatter',
    setRoomUsersLimit: 50,
    minute_limit_in_creating_story: 1,
    minute_limit_in_audio_post: 5,
    minute_limit_in_choosing_video_for_story: 1,
    minute_limit_in_choosing_video_for_post: 5,
    max_images_can_be_uploaded_in_one_post: 10,
    audio_space_hosts_limit: 5,
    audio_space_listeners_limit: 50,
    audio_space_duration_in_minutes: 60,
    duration_limit_in_reel: 30,
    support_email: 'support@chatter.app',
    interests: interests.map((i) => ({
      id: i.id,
      title: i.title,
      created_at: i.created_at,
      updated_at: i.updated_at,
    })),
    documentType,
    reportReasons,
    restrictedUsernames,
  }).save();
  await ensureCounter('setting', 1);

  const catTitles = ['Trending', 'Pop', 'Hip Hop', 'Electronic', 'Lo-fi'];
  for (let i = 0; i < catTitles.length; i++) {
    const cat = await new MusicCategory({
      id: i + 1,
      title: catTitles[i],
      musics_count: 1,
    }).save();
    await new Music({
      id: i + 1,
      category_id: cat.id,
      title: `${catTitles[i]} Beat`,
      artist: 'Chatter',
      sound: 'https://res.cloudinary.com/demo/video/upload/docs/walking_talking.mp4',
      image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      duration: 30,
    }).save();
  }
  await ensureCounter('musicCategory', catTitles.length);
  await ensureCounter('music', catTitles.length);

  await new FaqCategory({
    id: 1,
    title: 'General',
    faqs: [
      {
        id: 1,
        faqs_type_id: 1,
        question: 'What is Chatter?',
        answer: 'Chatter is a social app for posts, rooms, stories, and reels.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        faqs_type_id: 1,
        question: 'How do I edit my profile?',
        answer: 'Open your profile and tap Edit to update photo, bio, and interests.',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
  }).save();
  await ensureCounter('faqCategory', 1);

  await new PlatformNotification({
    id: 1,
    title: 'Welcome to Chatter',
    description: 'Your backend is ready. Configure Cloudinary in .env for media uploads.',
  }).save();
  await ensureCounter('platformNotification', 1);

  console.log('[seed] Done');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed', err);
  process.exit(1);
});
