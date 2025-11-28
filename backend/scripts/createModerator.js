require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const moderatorSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  permissions: {
    viewDisputes: { type: Boolean, default: true },
    resolveDisputes: { type: Boolean, default: true },
    deleteDisputes: { type: Boolean, default: true },
    banUsers: { type: Boolean, default: true },
    viewAnalytics: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    timezone: { type: String, default: 'UTC' }
  },
  stats: {
    totalDisputes: { type: Number, default: 0 },
    resolvedDisputes: { type: Number, default: 0 },
    averageResolutionTime: { type: Number, default: 0 }, // in hours
    lastActivity: Date
  }
}, { timestamps: true });

const Moderator = mongoose.models.Moderator || mongoose.model('Moderator', moderatorSchema);

async function createModerator() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Default moderator credentials
    const username = process.env.MODERATOR_USERNAME || 'moderator';
    const email = process.env.MODERATOR_EMAIL || 'moderator@testquest.com';
    const password = process.env.MODERATOR_PASSWORD || 'ModeratorPass123!';

    // Check if moderator already exists
    const existingModerator = await Moderator.findOne({
      $or: [{ username }, { email }]
    });

    if (existingModerator) {
      console.log('Moderator already exists with this username or email');
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create moderator
    const moderator = new Moderator({
      username,
      email,
      password: hashedPassword,
      permissions: {
        viewDisputes: true,
        resolveDisputes: true,
        deleteDisputes: true,
        banUsers: true,
        viewAnalytics: true
      },
      status: 'active',
      profile: {
        firstName: 'Test',
        lastName: 'Moderator',
        timezone: 'UTC'
      },
      stats: {
        totalDisputes: 0,
        resolvedDisputes: 0,
        averageResolutionTime: 0
      }
    });

    await moderator.save();

    console.log('✅ Moderator created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('⚠️  Please change the default password after first login');

  } catch (error) {
    console.error('Error creating moderator:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
createModerator();