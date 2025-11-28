const mongoose = require('mongoose');
const User = require('../models/user');
const Admin = require('../models/admin');
require('dotenv').config();

async function clearAllUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Count existing records
    const userCount = await User.countDocuments();
    const adminCount = await Admin.countDocuments();

    console.log(`Found ${userCount} users and ${adminCount} admins`);

    // Delete all users
    const userResult = await User.deleteMany({});
    console.log(`Deleted ${userResult.deletedCount} users`);

    // Delete all admins
    const adminResult = await Admin.deleteMany({});
    console.log(`Deleted ${adminResult.deletedCount} admins`);

    console.log('Database cleared successfully!');

  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
clearAllUsers();