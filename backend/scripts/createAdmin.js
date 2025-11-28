require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/admin');

async function createInitialAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testquest', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('Connected to MongoDB');

    // Check if any admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('❌ Admin user already exists. Use the existing admin credentials or reset them.');
      process.exit(0);
    }

    // Create the initial admin
    const initialAdmin = new Admin({
      username: 'admin',
      email: 'admin@testquest.com',
      password: 'AdminPass123!' // This will be hashed automatically
    });

    await initialAdmin.save();
    
    console.log('✅ Initial admin created successfully!');
    console.log('');
    console.log('👤 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Email: admin@testquest.com');
    console.log('   Password: AdminPass123!');
    console.log('');
    console.log('🔐 IMPORTANT SECURITY NOTICE:');
    console.log('   Please change the default password immediately after first login!');
    console.log('');
    console.log('🌐 Access the admin panel at:');
    console.log('   http://localhost:5173/?admin=true');
    console.log('   OR');
    console.log('   http://localhost:5173/admin');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating initial admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  createInitialAdmin();
}

module.exports = createInitialAdmin;