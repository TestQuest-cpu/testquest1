const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Dispute model
const disputeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['bug_rejection', 'unfair_payout', 'payment_delay', 'other'],
    default: 'bug_rejection'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  bugReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BugReport',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  evidence: {
    description: String,
    attachments: [{
      filename: String,
      originalName: String,
      mimetype: String,
      path: String,
      size: Number
    }]
  },
  expectedResolution: {
    type: String,
    required: true
  },
  adminResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    respondedAt: Date,
    resolution: {
      type: String,
      enum: ['approved', 'rejected', 'partial', 'escalated']
    }
  },
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

disputeSchema.index({ project: 1, createdAt: -1 });
disputeSchema.index({ submittedBy: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ type: 1 });
disputeSchema.index({ priority: 1 });
disputeSchema.index({ bugReport: 1 });

const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);

// Bug Report model reference
const bugReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  stepsToReproduce: { type: String, required: true },
  expectedBehavior: { type: String, required: true },
  actualBehavior: { type: String, required: true },
  severity: { type: String, enum: ['critical', 'major', 'minor'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'resolved'], default: 'pending' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    data: Buffer,
    size: Number
  }]
}, { timestamps: true });

const BugReport = mongoose.models.BugReport || mongoose.model('BugReport', bugReportSchema);

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    cachedDb = connection;
    console.log('Connected to MongoDB');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Authentication middleware
function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    const user = authenticateToken(req);
    req.user = user;

    // POST /api/disputes - Create a new dispute
    if (req.method === 'POST') {
      console.log('=== DISPUTE SUBMISSION START ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User ID:', req.user.id);

      const {
        type,
        title,
        description,
        bugReportId,
        expectedResolution,
        evidence
      } = req.body;

      // Validate required fields
      if (!title || !description || !bugReportId || !expectedResolution) {
        console.log('Validation failed - missing fields');
        return res.status(400).json({
          message: 'Title, description, bug report ID, and expected resolution are required'
        });
      }

      console.log('Looking for bug report:', bugReportId);

      // Verify the bug report exists and belongs to the user
      const bugReport = await BugReport.findById(bugReportId);
      if (!bugReport) {
        console.log('Bug report not found in database');
        return res.status(404).json({ message: 'Bug report not found' });
      }

      console.log('Bug report found:', bugReport._id, 'Project:', bugReport.project);
      console.log('Bug report submittedBy:', bugReport.submittedBy.toString());
      console.log('Current user:', req.user.id);

      if (bugReport.submittedBy.toString() !== req.user.id) {
        console.log('User does not own this bug report');
        return res.status(403).json({ message: 'You can only dispute your own bug reports' });
      }

      // Check if a dispute already exists for this bug report
      const existingDispute = await Dispute.findOne({
        bugReport: bugReportId,
        submittedBy: req.user.id,
        status: { $in: ['pending', 'under_review'] }
      });

      if (existingDispute) {
        console.log('Dispute already exists:', existingDispute._id);
        return res.status(400).json({
          message: 'A dispute is already pending for this bug report'
        });
      }

      console.log('Creating new dispute...');

      // Create the dispute
      const dispute = new Dispute({
        type: type || 'bug_rejection',
        title,
        description,
        bugReport: bugReportId,
        project: bugReport.project,
        submittedBy: req.user.id,
        expectedResolution,
        evidence: evidence || {}
      });

      await dispute.save();
      console.log('Dispute saved successfully:', dispute._id);

      // Populate the dispute with related data
      const populatedDispute = await Dispute.findById(dispute._id)
        .populate('bugReport', 'title severity status')
        .populate('project', 'name')
        .populate('submittedBy', 'name email');

      console.log('Dispute created and populated successfully');
      console.log('=== DISPUTE SUBMISSION END ===');

      return res.status(201).json({
        message: 'Dispute submitted successfully',
        dispute: populatedDispute
      });
    }

    // GET /api/disputes - Get user's disputes or disputes for a specific project
    else if (req.method === 'GET') {
      // Handle /api/disputes?projectId=xxx route (for fetching project-specific disputes)
      if (req.query && req.query.projectId) {
        const projectId = req.query.projectId;

        console.log('Fetching disputes for project:', projectId, 'and user:', req.user.id);

        const disputes = await Dispute.find({
          project: projectId,
          submittedBy: req.user.id
        })
          .populate('bugReport', 'title severity status')
          .sort({ createdAt: -1 });

        console.log('Found disputes:', disputes.length);

        return res.json({ disputes });
      }

      // Get all disputes for user
      const { status, type, page = 1, limit = 10 } = req.query;

      // Build filter query
      const filter = { submittedBy: req.user.id };
      if (status) filter.status = status;
      if (type) filter.type = type;

      const disputes = await Dispute.find(filter)
        .populate('bugReport', 'title severity status')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Dispute.countDocuments(filter);

      return res.json({
        disputes,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });
    }

    else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API Error:', error);

    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ message: error.message });
    }

    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
