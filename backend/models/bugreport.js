const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  stepsToReproduce: {
    type: String,
    required: true
  },
  expectedBehavior: {
    type: String,
    required: true
  },
  actualBehavior: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['critical', 'major', 'minor'],
    default: 'minor'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resolved'],
    default: 'pending'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    path: String,
    size: Number,
    data: String // Base64 encoded file data for serverless compatibility
  }],
  developerResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  reward: {
    amount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better query performance
bugReportSchema.index({ project: 1, createdAt: -1 });
bugReportSchema.index({ submittedBy: 1 });
bugReportSchema.index({ status: 1 });
bugReportSchema.index({ 'reward.status': 1 });

module.exports = mongoose.model('BugReport', bugReportSchema);