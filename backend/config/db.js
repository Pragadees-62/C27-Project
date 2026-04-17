const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sms');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop stale indexes that no longer exist in the schema.
    // The old schema had a unique index on "username" — drop it if it still exists.
    try {
      await conn.connection.collection('users').dropIndex('username_1');
      console.log('Dropped stale index: username_1');
    } catch (e) {
      // Index doesn't exist — nothing to do
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
