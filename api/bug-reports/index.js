const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// const multer = require('multer'); // Disabled for Vercel
// const path = require('path'); // Disabled for Vercel

// ProjectDispute model
const projectDisputeSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['unfair_rejection', 'payment_dispute', 'bias_discrimination', 'communication_issue', 'project_requirements', 'other']
  },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  evidence: { type: String, default: '' },
  expectedResolution: { type: String, default: '' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectName: { type: String, required: true },
  bugReport: { type: mongoose.Schema.Types.ObjectId, ref: 'BugReport' }, // Optional: Related bug report for context
  status: { type: String, enum: ['pending', 'investigating', 'resolved', 'dismissed'], default: 'pending' },
  adminResponse: {
    message: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  },
  resolution: {
    action: String,
    details: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  adminNotes: { type: String, default: '' }
}, { timestamps: true });

// Moderator model
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
  role: {
    type: String,
    default: 'moderator',
    enum: ['moderator', 'senior_moderator', 'head_moderator']
  },
  permissions: {
    viewDisputes: { type: Boolean, default: true },
    resolveDisputes: { type: Boolean, default: true },
    deleteDisputes: { type: Boolean, default: false },
    banUsers: { type: Boolean, default: false },
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
  },
  balance: { type: Number, default: 0 }
}, { timestamps: true });

// Bug Dispute model
const disputeSchema = new mongoose.Schema({
  bugReport: { type: mongoose.Schema.Types.ObjectId, ref: 'BugReport', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  description: { type: String, required: true },
  evidence: { type: String },
  status: { type: String, enum: ['pending', 'investigating', 'resolved', 'dismissed'], default: 'pending' },
  adminResponse: {
    message: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  },
  resolution: {
    action: String, // 'approved', 'rejected', 'partial'
    newRewardAmount: Number,
    details: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' }
}, { timestamps: true });

// BugReport model
const bugReportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  stepsToReproduce: { type: String, required: true },
  expectedBehavior: { type: String, required: true },
  actualBehavior: { type: String, required: true },
  severity: { type: String, required: true, enum: ['critical', 'major', 'minor'], default: 'minor' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'resolved'], default: 'pending' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
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
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  },
  developerRating: {
    rating: { type: Number, min: 1, max: 5 }, // 1-5 star rating
    comment: String,
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ratedAt: Date
  },
  qualityScore: { type: Number, default: 0, min: 0, max: 10 }, // Auto-calculated quality (0-10)
  reward: {
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  adminNotes: { type: String, default: '' }
}, { timestamps: true });

// User model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  accountType: { type: String, required: true, enum: ['tester', 'developer'] },
  isEmailVerified: { type: Boolean, default: false },
  googleId: { type: String, sparse: true },
  githubId: { type: String, sparse: true },
  avatar: { type: String },
  balance: { type: Number, default: 0, min: 0 },
  totalEarnings: { type: Number, default: 0, min: 0 },
  totalCreditsAcquired: { type: Number, default: 0, min: 0 },
  badges: {
    firstBlood: { type: Boolean, default: false }, // First verified bug
    bugHunter: { type: Boolean, default: false }, // 10 verified bugs
    eliteTester: { type: Boolean, default: false }, // 100 verified bugs
    bugConqueror: { type: Boolean, default: false }, // Top 1 on leaderboard
    bugMaster: { type: Boolean, default: false }, // Top 2 on leaderboard
    bugExpert: { type: Boolean, default: false } // Top 3 on leaderboard
  },
  stats: {
    verifiedBugs: { type: Number, default: 0 }, // Count of approved bugs
    totalSubmitted: { type: Number, default: 0 }, // Total bug reports submitted
    totalApproved: { type: Number, default: 0 }, // Total approved reports
    totalRejected: { type: Number, default: 0 }, // Total rejected reports
    averageDeveloperRating: { type: Number, default: 0 }, // Average rating from developers (0-5)
    totalDeveloperRatings: { type: Number, default: 0 }, // Number of ratings received
    reputationScore: { type: Number, default: 0 }, // Calculated reputation (0-100)
    lastActive: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// Project model
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, required: true, trim: true },
  scope: { type: String, required: true },
  objective: { type: String, required: true },
  areasToTest: { type: String, required: true },
  bugRewards: {
    critical: { type: Number, default: 0 },
    major: { type: Number, default: 0 },
    minor: { type: Number, default: 0 }
  },
  totalBounty: { type: Number, required: true, min: 0 },
  remainingBounty: { type: Number, required: true, min: 0 },
  notes: { type: String, default: '' },
  projectLink: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) { 
        const urlPattern = /^https?:\/\/.+\..+/;
        return urlPattern.test(v);
      },
      message: 'Project link must be a valid URL'
    }
  },
  image: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paypalPaymentId: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  completedAt: { type: Date },
  bugReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BugReport' }]
}, { timestamps: true });

// Create models only once
let User, Project, BugReport, ProjectDispute, Moderator, Dispute;

function getModels() {
  if (!User) {
    User = mongoose.models.User || mongoose.model('User', userSchema);
  }
  if (!Project) {
    Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
  }
  if (!BugReport) {
    BugReport = mongoose.models.BugReport || mongoose.model('BugReport', bugReportSchema);
  }
  if (!ProjectDispute) {
    ProjectDispute = mongoose.models.ProjectDispute || mongoose.model('ProjectDispute', projectDisputeSchema);
  }
  if (!Moderator) {
    Moderator = mongoose.models.Moderator || mongoose.model('Moderator', moderatorSchema);
  }
  if (!Dispute) {
    Dispute = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);
  }
  return { User, Project, BugReport, ProjectDispute, Moderator, Dispute };
}

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return getModels();
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    return getModels();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// JWT verification
const authenticateToken = async (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Access token required');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check if this is an admin token
  if (decoded.role) {
    return {
      _id: decoded.adminId || decoded.userId,
      accountType: 'admin',
      role: decoded.role
    };
  }

  // Regular user token
  const { User } = await connectToDatabase();
  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    throw new Error('Invalid token - user not found');
  }

  // Initialize badges and stats if they don't exist (for existing users)
  if (!user.badges) {
    user.badges = {
      firstBlood: false,
      bugHunter: false,
      eliteTester: false,
      bugConqueror: false,
      bugMaster: false,
      bugExpert: false
    };
  }
  if (!user.stats) {
    user.stats = {
      verifiedBugs: 0,
      totalSubmitted: 0,
      totalApproved: 0,
      totalRejected: 0,
      averageDeveloperRating: 0,
      totalDeveloperRatings: 0,
      reputationScore: 0,
      lastActive: new Date()
    };
  }

  user.accountType = decoded.accountType;
  return user;
};

// Calculate Reputation Score
// Formula: (Accuracy Rate × 40%) + (Developer Ratings × 30%) + (Activity Level × 20%) + (Report Quality × 10%)
async function calculateReputationScore(userId) {
  try {
    const { User, BugReport } = await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return 0;

    // Initialize stats if they don't exist
    if (!user.stats) {
      user.stats = {
        verifiedBugs: 0,
        totalSubmitted: 0,
        totalApproved: 0,
        totalRejected: 0,
        averageDeveloperRating: 0,
        totalDeveloperRatings: 0,
        reputationScore: 0,
        lastActive: new Date()
      };
    }

  // 1. Accuracy Rate (40%) - Percentage of approved reports
  const totalSubmitted = user.stats.totalSubmitted || 0;
  const totalApproved = user.stats.totalApproved || 0;
  const accuracyRate = totalSubmitted > 0 ? (totalApproved / totalSubmitted) * 100 : 0;
  const accuracyScore = (accuracyRate / 100) * 40;

  // 2. Developer Ratings (30%) - Average rating from developers (1-5 stars)
  const avgRating = user.stats.averageDeveloperRating || 0;
  const ratingScore = (avgRating / 5) * 30;

  // 3. Activity Level (20%) - Based on reports in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentReports = await BugReport.countDocuments({
    submittedBy: userId,
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Scale: 0 reports = 0, 10+ reports = max score
  const activityScore = Math.min((recentReports / 10) * 20, 20);

  // 4. Report Quality (10%) - Average quality score of approved reports
  const approvedReports = await BugReport.find({
    submittedBy: userId,
    status: 'approved'
  }).select('qualityScore');

  let avgQualityScore = 0;
  if (approvedReports.length > 0) {
    const totalQuality = approvedReports.reduce((sum, report) => sum + (report.qualityScore || 5), 0);
    avgQualityScore = totalQuality / approvedReports.length;
  }
  const qualityScore = (avgQualityScore / 10) * 10;

    // Calculate final reputation score (0-100)
    const reputationScore = Math.round(accuracyScore + ratingScore + activityScore + qualityScore);

    // Update user's reputation score
    await User.findByIdAndUpdate(userId, {
      $set: { 'stats.reputationScore': reputationScore }
    });

    return reputationScore;
  } catch (error) {
    console.error('Error calculating reputation score:', error);
    return 0; // Return 0 on error to prevent crashes
  }
}

// Auto-calculate quality score for a bug report
function calculateQualityScore(bugReport) {
  let score = 5; // Base score

  // Check completeness
  if (bugReport.description && bugReport.description.length > 100) score += 1;
  if (bugReport.stepsToReproduce && bugReport.stepsToReproduce.length > 50) score += 1;
  if (bugReport.expectedBehavior && bugReport.expectedBehavior.length > 30) score += 1;
  if (bugReport.actualBehavior && bugReport.actualBehavior.length > 30) score += 1;

  // Bonus for attachments
  if (bugReport.attachments && bugReport.attachments.length > 0) score += 1;

  return Math.min(score, 10); // Cap at 10
}

// Multer disabled for Vercel compatibility
// File uploads temporarily disabled

// Handle project disputes
const handleProjectDisputes = async (req, res, { User, Project, ProjectDispute }) => {
  if (req.method === 'POST') {
    // Submit new project dispute
    const user = await authenticateToken(req);

    if (user.accountType !== 'tester') {
      return res.status(403).json({
        message: 'Tester account required to submit project disputes'
      });
    }

    const {
      category,
      subject,
      description,
      evidence,
      expectedResolution,
      projectId,
      projectName,
      bugReportId
    } = req.body;

    // Validate required fields
    if (!category || !subject || !description || !projectId) {
      return res.status(400).json({
        message: 'Missing required fields: category, subject, description, projectId'
      });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // If bugReportId is provided, verify it exists and belongs to this user/project
    if (bugReportId) {
      const bugReport = await BugReport.findById(bugReportId);
      if (!bugReport) {
        return res.status(404).json({ message: 'Bug report not found' });
      }
      if (bugReport.submittedBy.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Bug report does not belong to you' });
      }
      if (bugReport.project.toString() !== projectId) {
        return res.status(400).json({ message: 'Bug report does not belong to this project' });
      }
    }

    // Create project dispute
    const projectDispute = new ProjectDispute({
      category,
      subject,
      description,
      evidence: evidence || '',
      expectedResolution: expectedResolution || '',
      submittedBy: user._id,
      project: projectId,
      projectName: projectName || project.name,
      bugReport: bugReportId || undefined, // Optional: include if provided
      status: 'pending',
      priority: category === 'payment_dispute' ? 'high' : 'medium'
    });

    await projectDispute.save();

    // Populate for response
    await projectDispute.populate([
      { path: 'submittedBy', select: 'name email avatar' },
      { path: 'project', select: 'name postedBy' }
    ]);

    return res.status(201).json({
      message: 'Project dispute submitted successfully',
      dispute: projectDispute
    });
  }

  // GET method for retrieving project disputes
  else if (req.method === 'GET') {
    const user = await authenticateToken(req);
    const { projectId } = req.query;

    const filter = { submittedBy: user._id };
    if (projectId) {
      filter.project = projectId;
    }

    const projectDisputes = await ProjectDispute.find(filter)
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      projectDisputes: projectDisputes || []
    });
  }

  return res.status(405).json({ message: 'Method not allowed for project disputes' });
};

// JWT verification for moderators
const authenticateModerator = async (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Access token required');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.type !== 'moderator') {
    throw new Error('Moderator access required');
  }

  const { Moderator } = await connectToDatabase();
  const moderator = await Moderator.findById(decoded.moderatorId).select('-password');

  if (!moderator || moderator.status !== 'active') {
    throw new Error('Invalid or inactive moderator account');
  }

  return moderator;
};

const handler = async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    console.log('Bug Report API - Method:', req.method, 'URL:', req.url);
    console.log('Request body type:', req.body?.type);
    console.log('Request body keys:', Object.keys(req.body || {}));

    const { User, Project, BugReport, ProjectDispute, Moderator, Dispute } = await connectToDatabase();

    // Handle project disputes at /api/bug-reports/project-disputes or with action query
    const path = req.url?.split('?')[0];
    const { action } = req.query || {};
    if (path === '/project-disputes' || req.body?.type === 'project_dispute' || action === 'get-project-disputes') {
      return handleProjectDisputes(req, res, { User, Project, ProjectDispute });
    }

    // Handle moderator authentication routes - check for both paths
    if (path === '/moderator/login' || path.includes('moderator/login') || req.body?.type === 'moderator_login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

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
      const isPasswordValid = await bcrypt.compare(password, moderator.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Update last login
      moderator.lastLogin = new Date();
      moderator.stats.lastActivity = new Date();
      await moderator.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          moderatorId: moderator._id,
          username: moderator.username,
          role: moderator.role,
          type: 'moderator'
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' } // 8 hour session
      );

      return res.json({
        message: 'Login successful',
        token,
        moderator: {
          id: moderator._id,
          username: moderator.username,
          email: moderator.email,
          role: moderator.role,
          fullName: moderator.profile.firstName && moderator.profile.lastName
            ? `${moderator.profile.firstName} ${moderator.profile.lastName}`
            : moderator.username,
          permissions: moderator.permissions,
          lastLogin: moderator.lastLogin,
          profile: moderator.profile,
          balance: moderator.balance || 0
        }
      });
    }

    // Handle moderator token verification
    if (path === '/moderator/verify' || path.includes('moderator/verify') || req.body?.type === 'moderator_verify') {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      try {
        const moderator = await authenticateModerator(req);
        return res.json({
          valid: true,
          moderator: {
            id: moderator._id,
            username: moderator.username,
            role: moderator.role,
            permissions: moderator.permissions,
            balance: moderator.balance || 0
          }
        });
      } catch (error) {
        return res.status(401).json({
          valid: false,
          error: error.message
        });
      }
    }

    // Handle disputes listing for moderators
    if (path === '/moderator/disputes' || path === '/moderator/disputes/all' || path.includes('moderator/disputes') || req.body?.type === 'moderator_disputes') {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const moderator = await authenticateModerator(req);

      const { type, status, priority, page = 1, limit = 50 } = req.query;

      let projectDisputes = [];
      let bugDisputes = [];

      // Fetch project disputes
      if (!type || type === 'project') {
        let projectFilter = {};
        if (status) projectFilter.status = status;
        if (priority) projectFilter.priority = priority;

        projectDisputes = await ProjectDispute.find(projectFilter)
          .populate('submittedBy', 'name email')
          .populate('project', 'name')
          .populate('bugReport', 'title description severity status stepsToReproduce expectedBehavior actualBehavior submittedBy') // Include bug report details + submitter
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);

        // For each project dispute, fetch all bug reports for that project
        for (let dispute of projectDisputes) {
          if (dispute.project && dispute.project._id) {
            const allProjectBugReports = await BugReport.find({ project: dispute.project._id })
              .populate('submittedBy', 'name email')
              .select('title severity status createdAt submittedBy description stepsToReproduce expectedBehavior actualBehavior')
              .sort({ createdAt: -1 });

            // Attach to dispute object
            dispute._doc.allProjectBugReports = allProjectBugReports;
          }
        }
      }

      // Fetch bug disputes
      if (!type || type === 'bug') {
        let bugFilter = {};
        if (status) bugFilter.status = status;
        if (priority) bugFilter.priority = priority;

        bugDisputes = await Dispute.find(bugFilter)
          .populate('submittedBy', 'name email')
          .populate('bugReport', 'title')
          .populate('bugReport.project', 'name')
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);
      }

      return res.json({
        projectDisputes: projectDisputes || [],
        bugDisputes: bugDisputes || [],
        total: {
          project: projectDisputes.length,
          bug: bugDisputes.length,
          combined: projectDisputes.length + bugDisputes.length
        }
      });
    }

    // Handle dispute resolution (check this BEFORE general PUT handler)
    console.log('Checking moderator resolve condition:', {
      method: req.method,
      bodyType: req.body?.type,
      hasDisputeId: !!req.body?.disputeId
    });

    if (req.method === 'PUT' && req.body?.type === 'moderator_resolve') {
      console.log('=== MODERATOR DISPUTE RESOLUTION MATCHED ===');
      const moderator = await authenticateModerator(req);
      console.log('Moderator authenticated:', moderator.username);

      if (!moderator.permissions.resolveDisputes) {
        return res.status(403).json({
          error: 'Insufficient permissions to resolve disputes'
        });
      }

      const { disputeId, disputeType, action, response, resolution, bugReportOverride } = req.body;

      if (!disputeId || !disputeType || !action) {
        return res.status(400).json({
          error: 'disputeId, disputeType, and action are required'
        });
      }

      let dispute;
      let Model = disputeType === 'project' ? ProjectDispute : Dispute;

      dispute = await Model.findById(disputeId)
        .populate('submittedBy', 'name email balance totalEarnings stats')
        .populate('project', 'name bugRewards remainingBounty');
      if (!dispute) {
        return res.status(404).json({ error: 'Dispute not found' });
      }

      let bugReportUpdated = false;
      let rewardGranted = false;
      let rewardAmount = 0;

      // Handle bug report override if provided (for project disputes)
      if (bugReportOverride && disputeType === 'project' && dispute.bugReport) {
        const { bugReportId, newSeverity, newStatus, grantReward } = bugReportOverride;

        const bugReport = await BugReport.findById(bugReportId).populate('project', 'bugRewards remainingBounty');
        if (!bugReport) {
          return res.status(404).json({ error: 'Bug report not found' });
        }

        const tester = await User.findById(dispute.submittedBy._id);
        if (!tester) {
          return res.status(404).json({ error: 'Tester not found' });
        }

        const project = await Project.findById(bugReport.project._id);
        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }

        // Update severity if provided
        if (newSeverity && ['critical', 'major', 'minor'].includes(newSeverity)) {
          bugReport.severity = newSeverity;
          bugReportUpdated = true;
        }

        // Update status if provided
        if (newStatus && ['pending', 'approved', 'rejected'].includes(newStatus)) {
          bugReport.status = newStatus;
          bugReportUpdated = true;
        }

        // Grant reward if requested
        if (grantReward) {
          const finalSeverity = newSeverity || bugReport.severity;
          const newRewardAmount = project.bugRewards[finalSeverity] || 0;

          if (newRewardAmount > 0) {
            // Calculate the amount already paid (if any)
            const alreadyPaid = (bugReport.reward && bugReport.reward.status === 'paid')
              ? bugReport.reward.amount
              : 0;

            // Calculate the difference to grant
            const rewardDifference = newRewardAmount - alreadyPaid;

            if (rewardDifference > 0) {
              // Only grant if there's a positive difference
              if (project.remainingBounty >= rewardDifference) {
                // Deduct from project's remaining bounty (only the difference)
                project.remainingBounty -= rewardDifference;

                // Add to tester's balance and totalEarnings (only the difference)
                tester.balance += rewardDifference;
                tester.totalEarnings += rewardDifference;

                // Update bug report reward to new total amount
                bugReport.reward = {
                  amount: newRewardAmount,
                  status: 'paid',
                  approvedBy: moderator._id,
                  approvedAt: new Date()
                };

                // Update tester stats (only if this is the first time being approved)
                if (!tester.stats) tester.stats = {};

                // Only increment verifiedBugs if this bug wasn't already counted
                const wasAlreadyApproved = alreadyPaid > 0;
                if (!wasAlreadyApproved) {
                  tester.stats.verifiedBugs = (tester.stats.verifiedBugs || 0) + 1;
                  tester.stats.totalApproved = (tester.stats.totalApproved || 0) + 1;

                  // Award first blood badge if this is their first approved bug
                  if (tester.stats.verifiedBugs === 1 && tester.badges) {
                    tester.badges.firstBlood = true;
                  }

                  // Award bug hunter badge if they reach 10 verified bugs
                  if (tester.stats.verifiedBugs === 10 && tester.badges) {
                    tester.badges.bugHunter = true;
                  }

                  // Award elite tester badge if they reach 100 verified bugs
                  if (tester.stats.verifiedBugs === 100 && tester.badges) {
                    tester.badges.eliteTester = true;
                  }
                }

                await tester.save();
                await project.save();

                rewardGranted = true;
                rewardAmount = rewardDifference;
                bugReportUpdated = true;
              } else {
                return res.status(400).json({
                  error: 'Insufficient funds in project reward pool',
                  remainingBounty: project.remainingBounty,
                  requestedAmount: rewardDifference,
                  alreadyPaid: alreadyPaid,
                  newTotalReward: newRewardAmount
                });
              }
            } else if (rewardDifference < 0) {
              // If the new reward is less than what was already paid, we can't take money back
              return res.status(400).json({
                error: 'Cannot reduce reward amount. Tester has already been paid more than the new severity reward.',
                alreadyPaid: alreadyPaid,
                newRewardAmount: newRewardAmount
              });
            } else {
              // rewardDifference === 0, already paid the correct amount
              return res.status(400).json({
                error: 'Tester has already been paid the correct amount for this severity level',
                alreadyPaid: alreadyPaid
              });
            }
          } else {
            return res.status(400).json({
              error: 'No reward configured for this severity level'
            });
          }
        }

        if (bugReportUpdated) {
          await bugReport.save();
        }
      }

      // Update dispute based on action
      if (action === 'investigate') {
        dispute.status = 'investigating';
        if (response) {
          dispute.adminResponse = {
            message: response,
            respondedBy: moderator._id,
            respondedAt: new Date()
          };
        }
      } else if (action === 'resolve') {
        dispute.status = 'resolved';
        if (resolution) {
          dispute.resolution = {
            action: resolution.action || 'Issue resolved',
            details: resolution.details || '',
            resolvedBy: moderator._id,
            resolvedAt: new Date()
          };
        }

      } else if (action === 'dismiss') {
        dispute.status = 'dismissed';
        if (response) {
          dispute.adminResponse = {
            message: response,
            respondedBy: moderator._id,
            respondedAt: new Date()
          };
        }
      }

      await dispute.save();

      // ALWAYS update moderator balance when resolving
      console.log('🔍 Checking moderator credit update:', {
        action,
        disputeStatus: dispute.status,
        moderatorId: moderator._id,
        currentBalance: moderator.balance
      });

      let updatedModeratorBalance = moderator.balance || 0;
      if (action === 'resolve' && dispute.status === 'resolved') {
        console.log('✅ Updating moderator balance with $inc operation...');

        // First ensure the moderator has a balance field (initialize if missing)
        if (moderator.balance === undefined || moderator.balance === null) {
          await Moderator.findByIdAndUpdate(moderator._id, { balance: 0 });
          console.log('Initialized balance field to 0');
        }

        // Use atomic update to ensure the balance is incremented correctly
        const updatedModerator = await Moderator.findByIdAndUpdate(
          moderator._id,
          {
            $inc: {
              balance: 100,
              'stats.resolvedDisputes': 1,
              'stats.totalDisputes': 1
            }
          },
          { new: true }
        );
        updatedModeratorBalance = updatedModerator.balance;
        console.log('💰 Moderator balance updated!', {
          oldBalance: moderator.balance,
          newBalance: updatedModerator.balance,
          increment: 100
        });
      } else {
        console.log('❌ Not updating balance - condition not met');
      }

      return res.json({
        message: `Dispute ${action}d successfully`,
        dispute,
        bugReportUpdated,
        rewardGranted,
        rewardAmount,
        moderatorBalance: updatedModeratorBalance
      });
    }

    if (req.method === 'POST') {
      // Submit new bug report
      console.log('POST /api/bug-reports - Starting bug report submission');
      console.log('Content-Type:', req.headers['content-type']);

      const user = await authenticateToken(req);
      console.log('User authenticated:', user._id, 'Account type:', user.accountType);

      if (user.accountType !== 'tester') {
        return res.status(403).json({
          message: 'Tester account required'
        });
      }

      // Accept JSON with base64-encoded attachments
      console.log('Processing JSON request');
      const {
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        severity,
        projectId,
        attachments
      } = req.body;

      // Validate required fields
      if (!title || !description || !stepsToReproduce || !expectedBehavior || !actualBehavior || !projectId) {
        return res.status(400).json({
          message: 'Missing required fields: title, description, stepsToReproduce, expectedBehavior, actualBehavior, projectId'
        });
      }

      // Verify project exists and is approved
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      if (project.status !== 'approved') {
        return res.status(400).json({ message: 'Can only submit bug reports for approved projects' });
      }

      // Process attachments (base64-encoded files)
      const processedAttachments = (attachments || []).map(att => ({
        data: att.data,
        mimetype: att.mimetype,
        originalName: att.originalName,
        size: att.data ? Buffer.from(att.data, 'base64').length : 0
      }));

      // Create bug report and calculate quality score
      const qualityScore = calculateQualityScore({
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        attachments: processedAttachments
      });

      const bugReport = new BugReport({
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        severity: severity || 'minor',
        submittedBy: user._id,
        project: projectId,
        status: 'pending',
        attachments: processedAttachments,
        qualityScore
      });

      await bugReport.save();

      // Update tester stats
      const tester = await User.findById(user._id);
      if (tester && tester.stats) {
        tester.stats.totalSubmitted = (tester.stats.totalSubmitted || 0) + 1;
        tester.stats.lastActive = new Date();
        await tester.save();

        // Recalculate reputation score
        await calculateReputationScore(user._id);
      }

      // Add bug report reference to project
      project.bugReports.push(bugReport._id);
      await project.save();

      // Populate for response
      await bugReport.populate([
        { path: 'submittedBy', select: 'name email avatar' },
        { path: 'project', select: 'name postedBy' }
      ]);

      return res.status(201).json({
        message: 'Bug report submitted successfully',
        bugReport
      });

    } else if (req.method === 'PUT') {
      // Update bug report status (approve/reject)
      const user = await authenticateToken(req);
      const { bugReportId, action, developerResponse, rating, ratingComment, overrideSeverity } = req.body;

      if (!bugReportId || !action) {
        return res.status(400).json({
          message: 'Bug report ID and action are required'
        });
      }

      if (!['approve', 'reject', 'resolve'].includes(action)) {
        return res.status(400).json({
          message: 'Action must be approve, reject, or resolve'
        });
      }

      const bugReport = await BugReport.findById(bugReportId).populate('project').populate('submittedBy');
      if (!bugReport) {
        return res.status(404).json({ message: 'Bug report not found' });
      }

      const project = await Project.findById(bugReport.project._id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check permissions
      if (user.accountType === 'developer') {
        // Developers can only update bug reports for their own projects
        if (project.postedBy.toString() !== user._id.toString()) {
          return res.status(403).json({ message: 'You can only manage bug reports for your own projects' });
        }
      } else if (user.accountType !== 'admin') {
        return res.status(403).json({ message: 'Only developers and admins can update bug report status' });
      }

      if (bugReport.status !== 'pending') {
        return res.status(400).json({ message: 'Bug report has already been processed' });
      }

      // Handle severity override if provided
      if (overrideSeverity && ['critical', 'major', 'minor'].includes(overrideSeverity)) {
        bugReport.severity = overrideSeverity;
      }

      // Update bug report status
      if (action === 'approve') {
        // Calculate reward amount based on severity (original or overridden)
        const rewardAmount = project.bugRewards[bugReport.severity] || 0;
        
        // Check if project has enough remaining bounty
        if (project.remainingBounty < rewardAmount) {
          return res.status(400).json({ 
            message: 'Insufficient remaining bounty to approve this bug report',
            remainingBounty: project.remainingBounty,
            requiredAmount: rewardAmount
          });
        }

        // Update bug report
        bugReport.status = 'approved';
        bugReport.reward.amount = rewardAmount;
        bugReport.reward.status = 'paid';
        bugReport.reward.approvedBy = user._id;
        bugReport.reward.approvedAt = new Date();

        // Deduct from project's remaining bounty
        console.log('Before deduction - remainingBounty:', project.remainingBounty);
        project.remainingBounty -= rewardAmount;
        console.log('After deduction - remainingBounty:', project.remainingBounty);

        // Add to tester's balance and total earnings
        const tester = await User.findById(bugReport.submittedBy._id);
        if (tester) {
          console.log('Before payment - tester balance:', tester.balance);
          tester.balance = (tester.balance || 0) + rewardAmount;
          tester.totalEarnings = (tester.totalEarnings || 0) + rewardAmount;
          tester.totalCreditsAcquired = (tester.totalCreditsAcquired || 0) + rewardAmount;
          console.log('After payment - tester balance:', tester.balance, 'totalEarnings:', tester.totalEarnings, 'totalCreditsAcquired:', tester.totalCreditsAcquired);

          // Initialize stats and badges if not exist
          if (!tester.stats) tester.stats = { verifiedBugs: 0 };
          if (!tester.badges) tester.badges = { firstBlood: false, bugHunter: false, eliteTester: false };

          // Increment verified bugs count
          tester.stats.verifiedBugs = (tester.stats.verifiedBugs || 0) + 1;
          tester.stats.totalApproved = (tester.stats.totalApproved || 0) + 1;
          tester.stats.lastActive = new Date();

          // Award badges based on milestones
          const verifiedCount = tester.stats.verifiedBugs;

          if (verifiedCount === 1 && !tester.badges.firstBlood) {
            tester.badges.firstBlood = true;
            console.log('🏆 Badge awarded: First Blood!');
          }

          if (verifiedCount >= 10 && !tester.badges.bugHunter) {
            tester.badges.bugHunter = true;
            console.log('🏆 Badge awarded: Bug Hunter!');
          }

          if (verifiedCount >= 100 && !tester.badges.eliteTester) {
            tester.badges.eliteTester = true;
            console.log('🏆 Badge awarded: Elite Tester!');
          }

          await tester.save();

          // Recalculate reputation score after approval
          await calculateReputationScore(tester._id);
        }

        await project.save();
        console.log('Project saved with remainingBounty:', project.remainingBounty);

      } else if (action === 'reject') {
        bugReport.status = 'rejected';
        bugReport.reward.status = 'rejected';

        // Update tester rejection stats
        const tester = await User.findById(bugReport.submittedBy._id);
        if (tester && tester.stats) {
          tester.stats.totalRejected = (tester.stats.totalRejected || 0) + 1;
          tester.stats.lastActive = new Date();
          await tester.save();

          // Recalculate reputation score after rejection
          await calculateReputationScore(tester._id);
        }
      } else if (action === 'resolve') {
        bugReport.status = 'resolved';
      }

      // Add developer response if provided
      if (developerResponse) {
        bugReport.developerResponse = {
          message: developerResponse,
          respondedBy: user._id,
          respondedAt: new Date()
        };
      }

      // Add developer rating if provided (optional)
      if (rating && rating >= 1 && rating <= 5) {
        bugReport.developerRating = {
          rating: rating,
          comment: ratingComment || '',
          ratedBy: user._id,
          ratedAt: new Date()
        };

        // Update tester's average developer rating
        const tester = await User.findById(bugReport.submittedBy._id);
        if (tester && tester.stats) {
          const currentTotal = (tester.stats.averageDeveloperRating || 0) * (tester.stats.totalDeveloperRatings || 0);
          const newTotal = currentTotal + rating;
          const newCount = (tester.stats.totalDeveloperRatings || 0) + 1;

          tester.stats.averageDeveloperRating = newTotal / newCount;
          tester.stats.totalDeveloperRatings = newCount;
          await tester.save();

          // Recalculate reputation score with new rating
          await calculateReputationScore(tester._id);
        }
      }

      await bugReport.save();
      await bugReport.populate([
        { path: 'submittedBy', select: 'name email avatar balance' },
        { path: 'project', select: 'name postedBy bugRewards remainingBounty' },
        { path: 'developerResponse.respondedBy', select: 'name email' }
      ]);

      return res.json({
        message: `Bug report ${action}d successfully`,
        bugReport,
        updatedProjectBounty: project.remainingBounty
      });

    } else if (req.method === 'GET') {
      // Get bug reports with filters
      const { projectId, status, page = 1, limit = 10, myReports } = req.query;

      // Allow public access to approved bug reports for a specific project
      if (projectId && status === 'approved' && !myReports) {
        const filter = {
          project: projectId,
          status: 'approved'
        };

        const bugReports = await BugReport.find(filter)
          .populate('submittedBy', 'name avatar')
          .populate('project', 'name')
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);

        const total = await BugReport.countDocuments(filter);

        return res.json({
          bugReports: bugReports || [],
          totalPages: Math.ceil(total / limit) || 0,
          currentPage: parseInt(page) || 1,
          total: total || 0
        });
      }

      // For all other requests, require authentication
      const user = await authenticateToken(req);

      let filter = {};

      // If myReports is requested, filter to current user's reports
      if (myReports === 'true') {
        filter.submittedBy = user._id;

        // For my-reports, also apply additional filters
        if (status) filter.status = status;
        if (projectId) filter.project = projectId;

        const bugReports = await BugReport.find(filter)
          .populate('project', 'name')
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);

        const total = await BugReport.countDocuments(filter);

        return res.json({
          bugReports: bugReports || [],
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        });
      }

      // Filter by project if provided
      if (projectId) {
        filter.project = projectId;
      }

      // Filter by status if provided
      if (status) {
        filter.status = status;
      }

      // Role-based filtering
      if (user.accountType === 'admin') {
        // Admins can see all bug reports
        if (projectId) {
          filter.project = projectId;
        }
        // No additional filtering for admins
      } else if (user.accountType === 'tester') {
        // Testers can only see their own bug reports
        filter.submittedBy = user._id;
      } else if (user.accountType === 'developer') {
        // Developers can see bug reports for their projects
        const developerProjects = await Project.find({ postedBy: user._id }).select('_id');
        const developerProjectIds = developerProjects.map(p => p._id.toString());
        
        if (projectId) {
          // If a specific project is requested, ensure the developer owns it
          if (developerProjectIds.includes(projectId.toString())) {
            filter.project = projectId;
          } else {
            // Developer doesn't own this project, return empty results
            return res.json({
              bugReports: [],
              totalPages: 0,
              currentPage: page,
              total: 0
            });
          }
        } else {
          // If no specific project requested, show all bug reports for developer's projects
          filter.project = { $in: developerProjects.map(p => p._id) };
        }
      }

      const bugReports = await BugReport.find(filter)
        .populate('submittedBy', 'name email avatar')
        .populate('project', 'name postedBy bugRewards')
        .populate('developerResponse.respondedBy', 'name email')
        .sort({ createdAt: 1 }) // Sort by oldest first for first-come-first-serve
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await BugReport.countDocuments(filter);

      // Implement first-come-first-serve blur logic within same severity
      // Only for developers viewing their project's bug reports
      if (user.accountType === 'developer' && projectId) {
        const severityGroups = { critical: [], major: [], minor: [] };

        // Group by severity
        bugReports.forEach(report => {
          if (severityGroups[report.severity]) {
            severityGroups[report.severity].push(report);
          }
        });

        // For each severity level, mark all except the first pending report as blurred
        bugReports.forEach(report => {
          const groupReports = severityGroups[report.severity];

          // Find the first pending report in this severity group
          const firstPending = groupReports.find(r => r.status === 'pending');

          // If this report is pending and NOT the first pending report, mark it as blurred
          if (report.status === 'pending' && firstPending && report._id.toString() !== firstPending._id.toString()) {
            report._doc.isBlurred = true;
            report._doc.blurReason = `Waiting for first ${report.severity} bug to be reviewed`;
          } else {
            report._doc.isBlurred = false;
          }
        });
      }

      return res.json({
        bugReports: bugReports || [],
        totalPages: Math.ceil(total / limit) || 0,
        currentPage: parseInt(page) || 1,
        total: total || 0
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Bug Report API Error:', error);
    console.error('Error stack:', error.stack);

    // Ensure we always return JSON
    if (!res.headersSent) {
      return res.status(500).json({
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error'
      });
    }
  }
};

// Export handler as default
module.exports = handler;