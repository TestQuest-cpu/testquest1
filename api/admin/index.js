const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

// Import PayPal functionality (temporarily commented to fix login)
// const { createPayPalClient, PAYPAL_CONFIG } = require('../../backend/config/paypal');

// PayPal Payout Configuration
const PAYPAL_CONFIG = {
  baseURL: 'https://api-m.sandbox.paypal.com', // Change to api-m.paypal.com for production
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET
};

// Get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_CONFIG.baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal auth failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Send PayPal payout
async function sendPayPalPayout(amount, recipientEmail, withdrawalId, recipientName) {
  console.log('=== PayPal Payout Request ===');
  console.log('Amount:', amount);
  console.log('Recipient Email:', recipientEmail);
  console.log('Withdrawal ID:', withdrawalId);
  console.log('Has PayPal Credentials:', !!PAYPAL_CONFIG.clientId && !!PAYPAL_CONFIG.clientSecret);

  if (!PAYPAL_CONFIG.clientId || !PAYPAL_CONFIG.clientSecret) {
    throw new Error('PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.');
  }

  const accessToken = await getPayPalAccessToken();
  console.log('PayPal access token obtained:', accessToken ? 'Yes' : 'No');

  const payoutRequest = {
    sender_batch_header: {
      sender_batch_id: `withdrawal_${withdrawalId}_${Date.now()}`,
      email_subject: 'You have received a payment from TestQuest',
      email_message: `Congratulations! Your withdrawal of $${amount} has been processed.`
    },
    items: [{
      recipient_type: 'EMAIL',
      amount: {
        value: amount.toFixed(2),
        currency: 'USD'
      },
      receiver: recipientEmail,
      note: `TestQuest withdrawal - ${withdrawalId}`,
      sender_item_id: withdrawalId,
      recipient_wallet: 'PAYPAL'
    }]
  };

  console.log('Payout request body:', JSON.stringify(payoutRequest, null, 2));

  const response = await fetch(`${PAYPAL_CONFIG.baseURL}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payoutRequest)
  });

  console.log('PayPal response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('=== PayPal Payout Failed ===');
    console.error('Status:', response.status);
    console.error('Error data:', JSON.stringify(errorData, null, 2));

    // Extract more detailed error message
    const errorMessage = errorData.message ||
                        errorData.error_description ||
                        (errorData.details && errorData.details[0]?.issue) ||
                        'PayPal payout failed';

    throw new Error(`PayPal Payout Error: ${errorMessage}`);
  }

  const data = await response.json();
  console.log('=== PayPal Payout Successful ===');
  console.log('Response data:', JSON.stringify(data, null, 2));

  return {
    batch_id: data.batch_header.payout_batch_id,
    payout_item_id: data.links.find(link => link.rel === 'items')?.href || '',
    batch_status: data.batch_header.batch_status
  };
}

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    required: true,
    enum: ['super_admin', 'moderator', 'finance_admin'],
    default: 'moderator'
  },
  permissions: [String],
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

// User Schema
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
  lastLogin: { type: Date },
  // Ban/suspension fields
  isBanned: { type: Boolean, default: false },
  bannedAt: { type: Date },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  banReason: { type: String },
  // Soft delete fields
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  deletionReason: { type: String }
}, { timestamps: true });

// Project Schema
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

// BugReport Schema
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
    size: Number
  }],
  developerResponse: {
    message: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  },
  reward: {
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  adminNotes: { type: String, default: '' }
}, { timestamps: true });

// Withdrawal Schema
const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 100 },
  paypalEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending' },
  paypalPayoutId: { type: String }, // PayPal payout batch ID
  paypalItemId: { type: String }, // PayPal payout item ID
  processedAt: { type: Date },
  completedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  adminNotes: { type: String, default: '' }
}, { timestamps: true });

// Moderator Application Schema
const moderatorApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  examScore: { type: Number, required: true, min: 0, max: 100 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt: { type: Date },
  reviewNotes: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
const BugReport = mongoose.models.BugReport || mongoose.model('BugReport', bugReportSchema);
const ModeratorApplication = mongoose.models.ModeratorApplication || mongoose.model('ModeratorApplication', moderatorApplicationSchema);
const Withdrawal = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);

// Connect to MongoDB
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    cachedDb = connection;
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

// Verify admin token
async function verifyAdminToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Admin access token required');
  }

  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_ADMIN_SUFFIX';
  const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
  
  if (decoded.type !== 'admin') {
    throw new Error('Invalid token type - admin access required');
  }

  const admin = await Admin.findById(decoded.adminId).select('-password');
  
  if (!admin) {
    throw new Error('Invalid token - admin not found');
  }

  if (!admin.isActive) {
    throw new Error('Admin account is deactivated');
  }

  return admin;
}

async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Allow current deployment URLs and localhost for development
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://test-quest-seven.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ];

  if (origin) {
    // Allow any origin that contains test-quest and vercel.app (for preview deployments)
    if ((origin.includes('test-quest') && origin.includes('vercel.app')) || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://test-quest-seven.vercel.app');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://test-quest-seven.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();
    const { action } = req.query;

    // Handle different admin actions based on query parameter
    switch (action) {
      case 'login':
        return handleAdminLogin(req, res);
      case 'me':
        return handleAdminProfile(req, res);
      case 'approve-project':
        return handleProjectApproval(req, res);
      case 'stats':
        return handlePlatformStats(req, res);
      case 'users':
        return handleUsersManagement(req, res);
      case 'bug-reports':
        return handleBugReportsManagement(req, res);
      case 'withdrawals':
        return handleWithdrawalManagement(req, res);
      case 'moderator-applications':
        return handleModeratorApplications(req, res);
      case 'migrate-credits':
        return handleMigrateCredits(req, res);
      default:
        return res.status(404).json({ message: 'Admin action not found' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    res.status(500).json({ message: error.message });
  }
}

// Handle admin login
async function handleAdminLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Find admin by username or email
  const admin = await Admin.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: username?.toLowerCase() }
    ]
  });

  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check password
  const isPasswordCorrect = await admin.comparePassword(password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Update last login
  admin.lastLogin = new Date();
  await admin.save();

  // Generate JWT token
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_ADMIN_SUFFIX';
  const token = jwt.sign(
    { 
      adminId: admin._id, 
      username: admin.username,
      role: admin.role,
      type: 'admin'
    },
    ADMIN_JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    message: 'Login successful',
    token,
    admin: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      lastLogin: admin.lastLogin
    }
  });
}

// Handle admin profile
async function handleAdminProfile(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const admin = await verifyAdminToken(req);

    res.json({
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Admin token expired' });
    }
    return res.status(403).json({ message: error.message });
  }
}

// Handle project approval
async function handleProjectApproval(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const admin = await verifyAdminToken(req);
    const { projectId, action } = req.body;

    if (!projectId || !action) {
      return res.status(400).json({ message: 'Project ID and action are required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either approve or reject' });
    }

    const project = await Project.findById(projectId).populate('postedBy', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'pending') {
      return res.status(400).json({ message: 'Project has already been processed' });
    }

    // Update project status
    if (action === 'approve') {
      project.status = 'approved';
      project.approvedBy = admin._id;
      project.approvedAt = new Date();
    } else {
      project.status = 'rejected';
      project.rejectedAt = new Date();
      project.rejectionReason = req.body.reason || 'No reason provided';
    }

    await project.save();

    res.json({
      message: `Project ${action}d successfully`,
      project: {
        id: project._id,
        name: project.name,
        status: project.status,
        approvedBy: action === 'approve' ? admin.username : undefined,
        approvedAt: project.approvedAt,
        rejectedAt: project.rejectedAt,
        rejectionReason: project.rejectionReason
      }
    });

  } catch (error) {
    console.error('Project approval error:', error);
    return res.status(403).json({ message: error.message });
  }
}

// Handle platform statistics
async function handlePlatformStats(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const admin = await verifyAdminToken(req);

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalTesters = await User.countDocuments({ accountType: 'tester' });
    const totalDevelopers = await User.countDocuments({ accountType: 'developer' });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    
    // Get recent user registrations (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({ 
      createdAt: { $gte: weekAgo } 
    });

    // Get project statistics
    const totalProjects = await Project.countDocuments();
    const pendingProjects = await Project.countDocuments({ status: 'pending' });
    const approvedProjects = await Project.countDocuments({ status: 'approved' });
    const rejectedProjects = await Project.countDocuments({ status: 'rejected' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });

    // Get new projects this week
    const newProjectsThisWeek = await Project.countDocuments({ 
      createdAt: { $gte: weekAgo } 
    });

    // Get bug report statistics
    const totalBugReports = await BugReport.countDocuments();
    const pendingBugReports = await BugReport.countDocuments({ status: 'pending' });
    const approvedBugReports = await BugReport.countDocuments({ status: 'approved' });
    const rejectedBugReports = await BugReport.countDocuments({ status: 'rejected' });
    const resolvedBugReports = await BugReport.countDocuments({ status: 'resolved' });

    // Get new bug reports this week
    const newBugReportsThisWeek = await BugReport.countDocuments({ 
      createdAt: { $gte: weekAgo } 
    });

    // Get financial statistics
    const totalBountyResults = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalBounty: { $sum: '$totalBounty' },
          remainingBounty: { $sum: '$remainingBounty' }
        }
      }
    ]);

    const totalBounty = totalBountyResults[0]?.totalBounty || 0;
    const remainingBounty = totalBountyResults[0]?.remainingBounty || 0;
    const paidOut = totalBounty - remainingBounty;

    // Get user balances total
    const userBalancesResults = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUserBalances: { $sum: '$balance' }
        }
      }
    ]);
    const totalUserBalances = userBalancesResults[0]?.totalUserBalances || 0;

    // Get bug report severity distribution
    const severityStats = await BugReport.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const severityDistribution = {
      critical: 0,
      major: 0,
      minor: 0
    };
    severityStats.forEach(stat => {
      severityDistribution[stat._id] = stat.count;
    });

    res.json({
      message: 'Platform statistics retrieved successfully',
      stats: {
        users: {
          total: totalUsers,
          testers: totalTesters,
          developers: totalDevelopers,
          verified: verifiedUsers,
          newThisWeek: newUsersThisWeek,
          verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0
        },
        projects: {
          total: totalProjects,
          pending: pendingProjects,
          approved: approvedProjects,
          rejected: rejectedProjects,
          completed: completedProjects,
          newThisWeek: newProjectsThisWeek,
          approvalRate: totalProjects > 0 ? Math.round((approvedProjects / totalProjects) * 100) : 0
        },
        bugReports: {
          total: totalBugReports,
          pending: pendingBugReports,
          approved: approvedBugReports,
          rejected: rejectedBugReports,
          resolved: resolvedBugReports,
          newThisWeek: newBugReportsThisWeek,
          approvalRate: totalBugReports > 0 ? Math.round((approvedBugReports / totalBugReports) * 100) : 0,
          severity: severityDistribution
        },
        financial: {
          totalBounty,
          remainingBounty,
          paidOut,
          totalUserBalances,
          utilizationRate: totalBounty > 0 ? Math.round((paidOut / totalBounty) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Platform stats error:', error);
    return res.status(403).json({ message: error.message });
  }
}

// Handle users management
async function handleUsersManagement(req, res) {
  try {
    const admin = await verifyAdminToken(req);

    if (req.method === 'GET') {
      // Get users with pagination and filtering
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        accountType = '', 
        status = '', 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;

      // Build filter query
      let filter = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (accountType) {
        filter.accountType = accountType;
      }
      
      if (status === 'verified') {
        filter.isEmailVerified = true;
      } else if (status === 'unverified') {
        filter.isEmailVerified = false;
      } else if (status === 'banned') {
        filter.isBanned = true;
      } else if (status === 'active') {
        filter.isBanned = { $ne: true };
        filter.isEmailVerified = true;
      }

      // Build sort object
      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get users with pagination
      const users = await User.find(filter)
        .select('-password')
        .sort(sortObj)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Add activity data for each user
      const usersWithStats = await Promise.all(users.map(async (user) => {
        // Get user's bug reports count
        const bugReportsCount = await BugReport.countDocuments({ submittedBy: user._id });
        
        // Get user's projects count (for developers)
        const projectsCount = await Project.countDocuments({ postedBy: user._id });
        
        // Get user's earnings (approved bug reports)
        const earnings = await BugReport.aggregate([
          { 
            $match: { 
              submittedBy: user._id, 
              status: 'approved' 
            } 
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$reward.amount' } 
            } 
          }
        ]);

        return {
          ...user,
          stats: {
            bugReports: bugReportsCount,
            projects: projectsCount,
            earnings: earnings[0]?.total || 0,
            lastActivity: user.lastLogin || user.updatedAt
          }
        };
      }));

      const total = await User.countDocuments(filter);

      return res.json({
        users: usersWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });

    } else if (req.method === 'PUT') {
      // Update user (ban/unban, verify email, etc.)
      const { userId, action, reason } = req.body;

      if (!userId || !action) {
        return res.status(400).json({ message: 'User ID and action are required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let updateData = {};
      let message = '';

      switch (action) {
        case 'ban':
          updateData = {
            isBanned: true,
            bannedAt: new Date(),
            bannedBy: admin._id,
            banReason: reason || 'No reason provided'
          };
          message = `User ${user.name} has been banned`;
          break;

        case 'unban':
          updateData = {
            $unset: { 
              isBanned: 1,
              bannedAt: 1,
              bannedBy: 1,
              banReason: 1
            }
          };
          message = `User ${user.name} has been unbanned`;
          break;

        case 'verify':
          updateData = { isEmailVerified: true };
          message = `User ${user.name} has been verified`;
          break;

        case 'unverify':
          updateData = { isEmailVerified: false };
          message = `User ${user.name} has been unverified`;
          break;

        case 'update-balance':
          const { newBalance } = req.body;
          if (typeof newBalance !== 'number' || newBalance < 0) {
            return res.status(400).json({ message: 'Invalid balance amount' });
          }

          // Calculate the difference to add to totalCreditsAcquired
          const currentBalance = user.balance || 0;
          const balanceDifference = newBalance - currentBalance;

          // Initialize totalCreditsAcquired if it doesn't exist
          if (user.totalCreditsAcquired === undefined || user.totalCreditsAcquired === null) {
            user.totalCreditsAcquired = currentBalance;
          }

          // Update balance and add difference to totalCreditsAcquired
          user.balance = newBalance;
          user.totalCreditsAcquired = (user.totalCreditsAcquired || 0) + balanceDifference;

          await user.save();

          message = `User ${user.name} balance updated to ${newBalance} credits`;

          // Return early since we already saved
          return res.json({
            message,
            user: {
              ...user.toObject(),
              password: undefined
            }
          });
          break;

        default:
          return res.status(400).json({ message: 'Invalid action' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select('-password');

      console.log('Updated user after balance change:', {
        balance: updatedUser.balance,
        totalEarnings: updatedUser.totalEarnings
      });

      return res.json({
        message,
        user: updatedUser
      });

    } else if (req.method === 'DELETE') {
      // Delete user (soft delete - mark as deleted)
      const { userId, reason } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user has active projects or bug reports
      const activeProjects = await Project.countDocuments({ 
        postedBy: userId, 
        status: { $in: ['pending', 'approved'] }
      });
      
      const activeBugReports = await BugReport.countDocuments({ 
        submittedBy: userId, 
        status: { $in: ['pending', 'approved'] }
      });

      if (activeProjects > 0 || activeBugReports > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete user with active projects or bug reports. Ban the user instead.' 
        });
      }

      // Soft delete - mark as deleted
      const deletedUser = await User.findByIdAndUpdate(
        userId,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: admin._id,
          deletionReason: reason || 'No reason provided',
          // Anonymize user data
          name: `Deleted User ${userId.slice(-6)}`,
          email: `deleted_${userId}@example.com`
        },
        { new: true }
      ).select('-password');

      return res.json({
        message: `User account has been deleted`,
        user: deletedUser
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Users management error:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Handle bug reports management
async function handleBugReportsManagement(req, res) {
  try {
    const admin = await verifyAdminToken(req);

    if (req.method === 'GET') {
      // Get bug reports with advanced filtering and admin details
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        severity = '', 
        status = '', 
        projectId = '',
        submittedBy = '',
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        dateFrom = '',
        dateTo = '',
        rewardMin = '',
        rewardMax = ''
      } = req.query;

      // Build filter query
      let filter = {};
      
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (severity) {
        filter.severity = severity;
      }
      
      if (status) {
        filter.status = status;
      }

      if (projectId) {
        filter.project = projectId;
      }

      if (submittedBy) {
        filter.submittedBy = submittedBy;
      }

      // Date range filtering
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) {
          filter.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = endDate;
        }
      }

      // Build sort object
      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get bug reports with pagination and population
      const bugReports = await BugReport.find(filter)
        .populate({
          path: 'submittedBy',
          select: 'name email accountType avatar balance'
        })
        .populate({
          path: 'project',
          select: 'name postedBy platform totalBounty bugRewards',
          populate: {
            path: 'postedBy',
            select: 'name email'
          }
        })
        .populate({
          path: 'reward.approvedBy',
          select: 'username email role'
        })
        .sort(sortObj)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Apply reward filtering after population
      let filteredReports = bugReports;
      if (rewardMin || rewardMax) {
        filteredReports = bugReports.filter(report => {
          const reward = report.reward?.amount || 0;
          if (rewardMin && reward < parseFloat(rewardMin)) return false;
          if (rewardMax && reward > parseFloat(rewardMax)) return false;
          return true;
        });
      }

      const total = await BugReport.countDocuments(filter);

      // Get summary statistics
      const summaryStats = await BugReport.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            pendingReports: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            approvedReports: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            rejectedReports: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            resolvedReports: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            totalRewards: { $sum: '$reward.amount' },
            criticalBugs: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
            majorBugs: { $sum: { $cond: [{ $eq: ['$severity', 'major'] }, 1, 0] } },
            minorBugs: { $sum: { $cond: [{ $eq: ['$severity', 'minor'] }, 1, 0] } }
          }
        }
      ]);

      return res.json({
        bugReports: filteredReports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        summary: summaryStats[0] || {
          totalReports: 0,
          pendingReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          resolvedReports: 0,
          totalRewards: 0,
          criticalBugs: 0,
          majorBugs: 0,
          minorBugs: 0
        }
      });

    } else if (req.method === 'PUT') {
      // Update bug report status and rewards (admin version)
      const { bugReportId, action, rewardAmount, adminNotes, reason } = req.body;

      if (!bugReportId || !action) {
        return res.status(400).json({ message: 'Bug report ID and action are required' });
      }

      const bugReport = await BugReport.findById(bugReportId)
        .populate('submittedBy', 'name email balance')
        .populate('project', 'name postedBy bugRewards remainingBounty');

      if (!bugReport) {
        return res.status(404).json({ message: 'Bug report not found' });
      }

      const project = await Project.findById(bugReport.project._id);
      let message = '';
      let updateData = {};

      switch (action) {
        case 'approve':
          if (bugReport.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending bug reports can be approved' });
          }

          const calculatedReward = rewardAmount || project.bugRewards[bugReport.severity] || 0;
          
          if (project.remainingBounty < calculatedReward) {
            return res.status(400).json({ 
              message: 'Insufficient remaining bounty for this reward amount',
              remainingBounty: project.remainingBounty,
              requestedAmount: calculatedReward
            });
          }

          updateData = {
            status: 'approved',
            'reward.amount': calculatedReward,
            'reward.status': 'approved',
            'reward.approvedBy': admin._id,
            'reward.approvedAt': new Date(),
            adminNotes: adminNotes || ''
          };

          // Update project's remaining bounty
          project.remainingBounty -= calculatedReward;
          await project.save();

          // Add to tester's balance
          if (bugReport.submittedBy) {
            await User.findByIdAndUpdate(
              bugReport.submittedBy._id,
              { $inc: { balance: calculatedReward } }
            );
          }

          message = `Bug report approved with $${calculatedReward} reward`;
          break;

        case 'reject':
          if (bugReport.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending bug reports can be rejected' });
          }

          updateData = {
            status: 'rejected',
            'reward.status': 'rejected',
            adminNotes: adminNotes || reason || 'Rejected by admin'
          };
          message = 'Bug report rejected';
          break;

        case 'resolve':
          if (!['approved', 'pending'].includes(bugReport.status)) {
            return res.status(400).json({ message: 'Only approved or pending bug reports can be resolved' });
          }

          updateData = {
            status: 'resolved',
            adminNotes: adminNotes || 'Resolved by admin'
          };
          message = 'Bug report marked as resolved';
          break;

        case 'reopen':
          if (bugReport.status !== 'resolved') {
            return res.status(400).json({ message: 'Only resolved bug reports can be reopened' });
          }

          updateData = {
            status: 'approved',
            adminNotes: (bugReport.adminNotes || '') + '\n\nReopened by admin: ' + (reason || 'No reason provided')
          };
          message = 'Bug report reopened';
          break;

        case 'update-reward':
          if (bugReport.status !== 'approved') {
            return res.status(400).json({ message: 'Only approved bug reports can have reward updates' });
          }

          const newReward = parseFloat(rewardAmount);
          const oldReward = bugReport.reward?.amount || 0;
          const rewardDifference = newReward - oldReward;

          if (rewardDifference > project.remainingBounty) {
            return res.status(400).json({ 
              message: 'Insufficient bounty for reward increase',
              availableBounty: project.remainingBounty
            });
          }

          updateData = {
            'reward.amount': newReward,
            adminNotes: (bugReport.adminNotes || '') + `\n\nReward updated from $${oldReward} to $${newReward} by admin`
          };

          // Update balances
          project.remainingBounty -= rewardDifference;
          await project.save();

          if (bugReport.submittedBy && rewardDifference !== 0) {
            await User.findByIdAndUpdate(
              bugReport.submittedBy._id,
              { $inc: { balance: rewardDifference } }
            );
          }

          message = `Reward updated to $${newReward}`;
          break;

        default:
          return res.status(400).json({ message: 'Invalid action' });
      }

      const updatedReport = await BugReport.findByIdAndUpdate(
        bugReportId,
        updateData,
        { new: true }
      ).populate([
        { path: 'submittedBy', select: 'name email avatar balance' },
        { path: 'project', select: 'name postedBy bugRewards remainingBounty' },
        { path: 'reward.approvedBy', select: 'username email' }
      ]);

      return res.json({
        message,
        bugReport: updatedReport,
        updatedProjectBounty: project.remainingBounty
      });

    } else if (req.method === 'DELETE') {
      // Delete bug report (admin only, with safety checks)
      const { bugReportId, reason } = req.body;

      if (!bugReportId) {
        return res.status(400).json({ message: 'Bug report ID is required' });
      }

      const bugReport = await BugReport.findById(bugReportId)
        .populate('project', 'remainingBounty');

      if (!bugReport) {
        return res.status(404).json({ message: 'Bug report not found' });
      }

      // If approved, refund the reward back to project
      if (bugReport.status === 'approved' && bugReport.reward?.amount > 0) {
        await Project.findByIdAndUpdate(
          bugReport.project._id,
          { $inc: { remainingBounty: bugReport.reward.amount } }
        );

        // Deduct from user's balance if they still exist
        if (bugReport.submittedBy) {
          await User.findByIdAndUpdate(
            bugReport.submittedBy,
            { $inc: { balance: -bugReport.reward.amount } }
          );
        }
      }

      // Remove from project's bug reports array
      await Project.findByIdAndUpdate(
        bugReport.project._id,
        { $pull: { bugReports: bugReportId } }
      );

      await BugReport.findByIdAndDelete(bugReportId);

      return res.json({
        message: 'Bug report deleted successfully',
        refundedAmount: bugReport.status === 'approved' ? bugReport.reward?.amount || 0 : 0
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Bug reports management error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Handle withdrawal management
async function handleWithdrawalManagement(req, res) {
  try {
    const admin = await verifyAdminToken(req);

    if (req.method === 'GET') {
      // Get withdrawal requests with pagination and filtering
      const {
        page = 1,
        limit = 10,
        status = '',
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        dateFrom = '',
        dateTo = ''
      } = req.query;

      // Build filter query
      let filter = {};

      if (status) {
        filter.status = status;
      }

      if (search) {
        // Search by user name, email, or PayPal email
        const users = await User.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');

        filter.$or = [
          { userId: { $in: users.map(u => u._id) } },
          { paypalEmail: { $regex: search, $options: 'i' } }
        ];
      }

      // Date range filtering
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) {
          filter.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = endDate;
        }
      }

      // Build sort object
      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get withdrawals with pagination and population
      const withdrawals = await Withdrawal.find(filter)
        .populate({
          path: 'userId',
          select: 'name email accountType balance'
        })
        .populate({
          path: 'processedBy',
          select: 'username email role'
        })
        .sort(sortObj)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Withdrawal.countDocuments(filter);

      // Get summary statistics
      const summaryStats = await Withdrawal.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pendingRequests: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            processingRequests: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
            completedRequests: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            rejectedRequests: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            totalAmount: { $sum: '$amount' },
            pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
            completedAmount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } }
          }
        }
      ]);

      return res.json({
        withdrawals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalWithdrawals: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        summary: summaryStats[0] || {
          totalRequests: 0,
          pendingRequests: 0,
          processingRequests: 0,
          completedRequests: 0,
          rejectedRequests: 0,
          totalAmount: 0,
          pendingAmount: 0,
          completedAmount: 0
        }
      });

    } else if (req.method === 'PUT') {
      // Process withdrawal request (approve, reject, complete)
      const { withdrawalId, action, adminNotes, rejectionReason } = req.body;

      if (!withdrawalId || !action) {
        return res.status(400).json({ message: 'Withdrawal ID and action are required' });
      }

      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('userId', 'name email balance');

      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal request not found' });
      }

      let updateData = {};
      let message = '';

      switch (action) {
        case 'approve':
          if (withdrawal.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending withdrawals can be approved' });
          }

          // Check if user still has sufficient balance
          if (withdrawal.userId.balance < withdrawal.amount) {
            return res.status(400).json({
              message: 'User has insufficient balance for this withdrawal',
              userBalance: withdrawal.userId.balance,
              requestedAmount: withdrawal.amount
            });
          }

          try {
            // Send PayPal payout automatically
            // Convert credits to USD (100 credits = 1 USD)
            const CREDITS_PER_USD = 1;
            const amountInCredits = withdrawal.amount;
            const amountInUSD = amountInCredits / CREDITS_PER_USD;

            const payoutResult = await sendPayPalPayout(
              amountInUSD, // Send USD amount to PayPal
              withdrawal.paypalEmail,
              withdrawal._id.toString(),
              withdrawal.userId.name
            );

            updateData = {
              status: 'completed', // Changed from 'processing' to 'completed' since payout is sent
              processedAt: new Date(),
              completedAt: new Date(),
              processedBy: admin._id,
              paypalPayoutId: payoutResult.batch_id,
              paypalItemId: payoutResult.payout_item_id,
              adminNotes: adminNotes || 'Approved and paid automatically via PayPal'
            };

            // Deduct amount from user balance (in credits)
            await User.findByIdAndUpdate(
              withdrawal.userId._id,
              { $inc: { balance: -amountInCredits } }
            );

            message = `Withdrawal of ${amountInCredits.toLocaleString()} credits ($${amountInUSD.toFixed(2)}) approved and PayPal payout sent successfully`;
          } catch (payoutError) {
            console.error('PayPal payout failed:', payoutError);

            // Don't deduct balance if payout failed
            updateData = {
              status: 'failed',
              processedAt: new Date(),
              processedBy: admin._id,
              failureReason: payoutError.message,
              adminNotes: adminNotes || `Payout failed: ${payoutError.message}`
            };

            message = `Withdrawal approval failed: ${payoutError.message}`;
          }
          break;

        case 'reject':
          if (!['pending', 'processing'].includes(withdrawal.status)) {
            return res.status(400).json({ message: 'Only pending or processing withdrawals can be rejected' });
          }

          updateData = {
            status: 'rejected',
            rejectedAt: new Date(),
            processedBy: admin._id,
            rejectionReason: rejectionReason || 'Rejected by admin',
            adminNotes: adminNotes || ''
          };

          // If it was processing, refund the balance
          if (withdrawal.status === 'processing') {
            await User.findByIdAndUpdate(
              withdrawal.userId._id,
              { $inc: { balance: withdrawal.amount } }
            );
          }

          message = `Withdrawal of $${withdrawal.amount} rejected`;
          break;

        case 'complete':
          if (withdrawal.status !== 'processing') {
            return res.status(400).json({ message: 'Only processing withdrawals can be completed' });
          }

          const { paypalPayoutId, paypalItemId } = req.body;

          updateData = {
            status: 'completed',
            completedAt: new Date(),
            paypalPayoutId: paypalPayoutId || '',
            paypalItemId: paypalItemId || '',
            adminNotes: adminNotes || 'Completed by admin'
          };

          message = `Withdrawal of $${withdrawal.amount} completed successfully`;
          break;

        default:
          return res.status(400).json({ message: 'Invalid action' });
      }

      const updatedWithdrawal = await Withdrawal.findByIdAndUpdate(
        withdrawalId,
        updateData,
        { new: true }
      ).populate([
        { path: 'userId', select: 'name email balance' },
        { path: 'processedBy', select: 'username email' }
      ]);

      return res.json({
        message,
        withdrawal: updatedWithdrawal
      });

    } else if (req.method === 'DELETE') {
      // Delete withdrawal request (admin only, for cleanup)
      const { withdrawalId, reason } = req.body;

      if (!withdrawalId) {
        return res.status(400).json({ message: 'Withdrawal ID is required' });
      }

      const withdrawal = await Withdrawal.findById(withdrawalId);

      if (!withdrawal) {
        return res.status(404).json({ message: 'Withdrawal request not found' });
      }

      // Only allow deletion of rejected or very old completed withdrawals
      if (!['rejected', 'completed'].includes(withdrawal.status)) {
        return res.status(400).json({
          message: 'Only rejected or completed withdrawals can be deleted'
        });
      }

      await Withdrawal.findByIdAndDelete(withdrawalId);

      return res.json({
        message: 'Withdrawal request deleted successfully'
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Withdrawal management error:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Handle moderator applications
async function handleModeratorApplications(req, res) {
  try {
    const { status } = req.query;

    if (req.method === 'GET') {
      // Admin can see all applications
      await verifyAdminToken(req);

      let filter = {};
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        filter.status = status;
      }

      const applications = await ModeratorApplication.find(filter)
        .populate('userId', 'name email avatar accountType stats')
        .populate('reviewedBy', 'username email')
        .sort({ submittedAt: -1 });

      return res.json({
        applications: applications,
        isAdmin: true
      });

    } else if (req.method === 'PUT') {
      // Update application status (admin only)
      const admin = await verifyAdminToken(req);
      const { applicationId, status, reviewNotes } = req.body;

      if (!applicationId) {
        return res.status(400).json({ message: 'Application ID required' });
      }

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be approved or rejected' });
      }

      const application = await ModeratorApplication.findById(applicationId);

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (application.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending applications can be reviewed' });
      }

      // Update application
      application.status = status;
      application.reviewedBy = admin._id;
      application.reviewedAt = new Date();
      application.reviewNotes = reviewNotes || '';

      await application.save();
      await application.populate('userId', 'name email avatar stats');
      await application.populate('reviewedBy', 'username email');

      return res.json({
        message: `Application ${status} successfully`,
        application: application
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Moderator applications error:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Handle migration of totalCreditsAcquired for existing users
async function handleMigrateCredits(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await verifyAdminToken(req);

    // Find all users where totalCreditsAcquired is undefined or null
    const users = await User.find({
      $or: [
        { totalCreditsAcquired: { $exists: false } },
        { totalCreditsAcquired: null }
      ]
    });

    let updatedCount = 0;

    for (const user of users) {
      // Initialize totalCreditsAcquired to balance + totalEarnings (best guess)
      // This assumes balance reflects total acquired minus withdrawals
      const totalCreditsAcquired = (user.balance || 0) + (user.totalEarnings || 0);

      await User.findByIdAndUpdate(user._id, {
        totalCreditsAcquired: totalCreditsAcquired
      });

      updatedCount++;
    }

    return res.json({
      message: `Successfully initialized totalCreditsAcquired for ${updatedCount} users`,
      updatedCount
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = handler;
