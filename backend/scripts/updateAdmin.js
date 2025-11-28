require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function updateAdminCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get new credentials from command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Usage: node updateAdmin.js <new_username> <new_password> [new_email]');
      console.log('Example: node updateAdmin.js myadmin MySecurePassword123! admin@mydomain.com');
      process.exit(1);
    }

    const [newUsername, newPassword, newEmail] = args;

    if (newPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the admin document
    const updateData = {
      username: newUsername.toLowerCase(),
      password: hashedPassword,
      updatedAt: new Date()
    };

    if (newEmail) {
      updateData.email = newEmail.toLowerCase();
    }

    const result = await mongoose.connection.db.collection('admins').updateOne(
      {}, // Find the first admin (since we only have one admin role now)
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      console.log('❌ No admin found in database');
      process.exit(1);
    }

    if (result.modifiedCount === 0) {
      console.log('⚠️ Admin found but no changes were made (credentials might be the same)');
    } else {
      console.log('✅ Admin credentials updated successfully!');
    }

    // Verify the update
    const updatedAdmin = await mongoose.connection.db.collection('admins').findOne(
      {},
      { projection: { password: 0 } } // Don't show password
    );

    console.log('');
    console.log('🔐 Updated Admin Details:');
    console.log('   Username:', updatedAdmin.username);
    console.log('   Email:', updatedAdmin.email);
    console.log('   Updated:', updatedAdmin.updatedAt);
    console.log('');
    console.log('🌐 You can now login at:');
    console.log('   https://testquest-five.vercel.app/?admin=true');
    console.log('');
    console.log('⚠️ IMPORTANT: Please logout and login again if you were already logged in!');

    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('❌ Error updating admin credentials:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  updateAdminCredentials();
}

module.exports = updateAdminCredentials;