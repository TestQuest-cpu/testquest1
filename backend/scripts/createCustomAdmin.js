require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/admin');

async function createCustomAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testquest', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('Connected to MongoDB');

    // Check if this specific admin already exists
    const existingAdmin = await Admin.findOne({ username: 'superidol_admin' });
    if (existingAdmin) {
      console.log('❌ Admin user "superidol_admin" already exists.');
      process.exit(0);
    }

    // Create the custom admin
    const customAdmin = new Admin({
      username: 'superidol_admin',
      email: 'superidol_admin@testquest.com',
      password: 'admin_superidol', // This will be hashed automatically
      role: 'super_admin'
    });

    await customAdmin.save();

    console.log('✅ Custom admin created successfully!');
    console.log('');
    console.log('👤 Admin Credentials:');
    console.log('   Username: superidol_admin');
    console.log('   Email: superidol_admin@testquest.com');
    console.log('   Password: admin_superidol');
    console.log('   Role: super_admin');
    console.log('');
    console.log('🌐 Access the admin panel at:');
    console.log('   http://localhost:5173/?admin=true');
    console.log('   OR');
    console.log('   http://localhost:5173/admin');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating custom admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  createCustomAdmin();
}

module.exports = createCustomAdmin;