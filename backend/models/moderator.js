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
}, {
  timestamps: true
});

// Hash password before saving
moderatorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
moderatorSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
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
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Indexes for better performance
moderatorSchema.index({ email: 1 });
moderatorSchema.index({ username: 1 });
moderatorSchema.index({ status: 1 });

module.exports = mongoose.model('Moderator', moderatorSchema);