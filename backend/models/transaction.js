const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'project_creation', // When developer creates project
      'platform_fee', // 15% platform commission
      'bug_reward', // Payment to tester for bug
      'withdrawal', // Tester withdraws earnings
      'refund' // Refund to developer
    ]
  },
  amount: {
    type: Number,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  bugReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BugReport'
  },
  paypalPaymentId: {
    type: String
  },
  paypalPayoutId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    platformFee: Number,
    bountyPool: Number,
    feePercentage: Number,
    recipientEmail: String
  }
}, {
  timestamps: true
});

// Index for better query performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ project: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
