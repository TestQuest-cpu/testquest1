const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    trim: true
  },
  scope: {
    type: String,
    required: true
  },
  objective: {
    type: String,
    required: true
  },
  areasToTest: {
    type: String,
    required: true
  },
  bugRewards: {
    critical: { type: Number, default: 0 },
    major: { type: Number, default: 0 },
    minor: { type: Number, default: 0 }
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 20 // Minimum $20 budget
  },
  platformFee: {
    type: Number,
    default: 0 // 15% of totalBudget
  },
  platformFeePercentage: {
    type: Number,
    default: 15 // 15% platform fee
  },
  totalBounty: {
    type: Number,
    default: 0,
    min: 0 // 85% of totalBudget after platform fee
  },
  remainingBounty: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    default: ''
  },
  projectLink: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Project link must be a valid URL'
    }
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paypalOrderId: {
    type: String
  },
  paypalPaymentId: {
    type: String
  },
  platformFeePayoutId: {
    type: String // PayPal payout batch ID for platform fee
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  completedAt: {
    type: Date
  },
  bugReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BugReport'
  }]
}, {
  timestamps: true
});

// Calculate platform fee and bounty pool when creating new project
projectSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('totalBudget')) {
    // Calculate 15% platform fee
    this.platformFee = Math.round(this.totalBudget * (this.platformFeePercentage / 100) * 100) / 100;

    // Calculate 85% bounty pool (totalBudget - platformFee)
    this.totalBounty = Math.round((this.totalBudget - this.platformFee) * 100) / 100;

    // Set remaining bounty to total bounty for new projects
    if (this.isNew) {
      this.remainingBounty = this.totalBounty;
    }
  }
  next();
});

// Index for better query performance
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ postedBy: 1 });

module.exports = mongoose.model('Project', projectSchema);