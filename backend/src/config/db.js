const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
    // Prefer IPv4 — avoids common Windows/VPN SRV/DNS failures with Atlas
    family: 4,
  });
  console.log('[db] Connected to MongoDB');
}

module.exports = { connectDb };
