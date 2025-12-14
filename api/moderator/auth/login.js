import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

// Moderator Schema
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
    averageResolutionTime: { type: Number, default: 0 },
    lastActivity: Date
  }
}, {
  timestamps: true
});

// Compare password method
moderatorSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcryptjs.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Update last login
moderatorSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.stats.lastActivity = new Date();
  return this.save();
};

// Get full name
moderatorSchema.virtual('fullName').get(function() {
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

const Moderator = mongoose.models.Moderator || mongoose.model('Moderator', moderatorSchema);

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    isConnected = true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    // Set JSON content type
    res.setHeader('Content-Type', 'application/json');

    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://testquest-five.vercel.app',
      'https://testquest1.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    if (origin && (allowedOrigins.includes(origin) || (origin.includes('testquest') && origin.includes('vercel.app')))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    await connectToDatabase();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Find moderator by username or email
    const moderator = await Moderator.findOne({
      $or: [
        { username: username.toLowerCase().trim() },
        { email: username.toLowerCase().trim() }
      ]
    });

    if (!moderator) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check if moderator is active
    if (moderator.status !== 'active') {
      return res.status(403).json({
        error: 'Account is suspended or inactive'
      });
    }

    // Verify password
    const isPasswordValid = await moderator.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await moderator.updateLastLogin();

    // Generate JWT token
    const token = jwt.sign(
      {
        moderatorId: moderator._id,
        username: moderator.username,
        type: 'moderator'
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      moderator: {
        id: moderator._id,
        username: moderator.username,
        email: moderator.email,
        fullName: moderator.fullName,
        permissions: moderator.permissions,
        lastLogin: moderator.lastLogin,
        profile: moderator.profile
      }
    });

  } catch (error) {
    console.error('Moderator login error:', error);
    res.status(500).json({
      error: 'Server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
