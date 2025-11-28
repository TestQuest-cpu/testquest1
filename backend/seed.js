require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

// Test accounts data
const testAccounts = [
  {
    name: 'Test Developer',
    email: 'dev@test.com',
    password: 'password123',
    accountType: 'developer'
  },
  {
    name: 'Test Tester',
    email: 'tester@test.com',
    password: 'password123',
    accountType: 'tester'
  },
  {
    name: 'John Developer',
    email: 'john@dev.com',
    password: 'password123',
    accountType: 'developer'
  },
  {
    name: 'Jane Tester',
    email: 'jane@tester.com',
    password: 'password123',
    accountType: 'tester'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testquest');
    console.log('Connected to MongoDB');

    // Clear existing test users
    await User.deleteMany({ 
      email: { $in: testAccounts.map(acc => acc.email) }
    });
    console.log('Cleared existing test accounts');

    // Create test accounts
    for (const accountData of testAccounts) {
      const user = new User(accountData);
      await user.save();
      console.log(`✅ Created ${accountData.accountType}: ${accountData.email}`);
    }

    console.log('\n🎉 Test accounts created successfully!');
    console.log('\nYou can now login with:');
    console.log('Developer: dev@test.com / password123');
    console.log('Tester: tester@test.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();