const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

async function verifyExistingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all existing users to verified
    const result = await User.updateMany(
      { isEmailVerified: false },
      { $set: { isEmailVerified: true } }
    );

    console.log(`✓ Auto-verified ${result.modifiedCount} existing users`);

    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyExistingUsers();
