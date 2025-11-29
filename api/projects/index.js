const mongoose = require('mongoose');

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
  totalCreditsAcquired: { type: Number, default: 0, min: 0 }
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
        // More flexible URL validation
        const urlPattern = /^https?:\/\/.+\..+/;
        return urlPattern.test(v);
      },
      message: 'Project link must be a valid URL (e.g., https://example.com)'
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

// Set remainingBounty to totalBounty when creating new project
projectSchema.pre('save', function(next) {
  if (this.isNew) {
    this.remainingBounty = this.totalBounty;
  }
  next();
});

// Create models only once
let User, Project;

function getModels() {
  if (!User) {
    User = mongoose.models.User || mongoose.model('User', userSchema);
  }
  if (!Project) {
    Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
  }
  return { User, Project };
}

async function connectToDatabase() {
  // Check if we're already connected
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
const jwt = require('jsonwebtoken');

const authenticateToken = async (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth Debug - Headers:', {
    authHeader: authHeader ? authHeader.substring(0, 30) + '...' : 'No header',
    hasToken: !!token
  });

  if (!token) {
    throw new Error('Access token required');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Auth Debug - Decoded JWT:', {
    userId: decoded.userId,
    accountType: decoded.accountType,
    exp: decoded.exp,
    iat: decoded.iat
  });

  const { User } = await connectToDatabase();
  const user = await User.findById(decoded.userId).select('-password');
  
  if (!user) {
    throw new Error('Invalid token - user not found');
  }

  console.log('Auth Debug - Database user:', {
    userId: user._id,
    name: user.name,
    email: user.email,
    dbAccountType: user.accountType
  });

  // Use accountType from JWT token (more reliable than database)
  user.accountType = decoded.accountType;
  
  console.log('Auth Debug - Final user object:', {
    userId: user._id,
    finalAccountType: user.accountType,
    name: user.name,
    email: user.email
  });

  return user;
};

// Bug Report Schema for leaderboards
const bugReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  severity: { type: String, enum: ['critical', 'major', 'minor'], default: 'minor' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'resolved'], default: 'pending' },
  reward: {
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' }
  }
}, { timestamps: true });

// Generate leaderboards function
async function generateLeaderboards(req, res) {
  try {
    const { User } = await connectToDatabase();

    // Create BugReport model if not already created
    const BugReport = mongoose.models.BugReport || mongoose.model('BugReport', bugReportSchema);

    // Get all testers with their bug reports and rewards
    const leaderboardData = await User.aggregate([
      {
        // Only include testers
        $match: { accountType: 'tester' }
      },
      {
        // Look up bug reports for each user
        $lookup: {
          from: 'bugreports',
          localField: '_id',
          foreignField: 'submittedBy',
          as: 'bugReports'
        }
      },
      {
        // Add computed fields
        $addFields: {
          // Total bug reports submitted
          totalBugReports: { $size: '$bugReports' },

          // Approved bug reports count
          approvedBugReports: {
            $size: {
              $filter: {
                input: '$bugReports',
                cond: { $eq: ['$$this.status', 'approved'] }
              }
            }
          },

          // Total rewards earned (paid rewards only)
          totalRewards: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$bugReports',
                    cond: { $eq: ['$$this.reward.status', 'paid'] }
                  }
                },
                as: 'report',
                in: '$$report.reward.amount'
              }
            }
          },

          // Count unique projects participated in
          projectsParticipated: {
            $size: {
              $setUnion: {
                $map: {
                  input: '$bugReports',
                  as: 'report',
                  in: '$$report.project'
                }
              }
            }
          },

          // Calculate reputation score
          reputationScore: {
            $add: [
              // Base points for approved reports
              {
                $multiply: [
                  {
                    $size: {
                      $filter: {
                        input: '$bugReports',
                        cond: { $eq: ['$$this.status', 'approved'] }
                      }
                    }
                  },
                  10
                ]
              },
              // Bonus points for critical bugs
              {
                $multiply: [
                  {
                    $size: {
                      $filter: {
                        input: '$bugReports',
                        cond: {
                          $and: [
                            { $eq: ['$$this.status', 'approved'] },
                            { $eq: ['$$this.severity', 'critical'] }
                          ]
                        }
                      }
                    }
                  },
                  50
                ]
              },
              // Bonus points for major bugs
              {
                $multiply: [
                  {
                    $size: {
                      $filter: {
                        input: '$bugReports',
                        cond: {
                          $and: [
                            { $eq: ['$$this.status', 'approved'] },
                            { $eq: ['$$this.severity', 'major'] }
                          ]
                        }
                      }
                    }
                  },
                  25
                ]
              }
            ]
          }
        }
      },
      {
        // Only include users who have participated (have at least 1 bug report)
        $match: { totalBugReports: { $gt: 0 } }
      },
      {
        // Sort by total credits acquired (highest first)
        $sort: { totalCreditsAcquired: -1, reputationScore: -1, totalRewards: -1, approvedBugReports: -1 }
      },
      {
        // Limit to top 50
        $limit: 50
      },
      {
        // Project only the fields we need
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          totalBugReports: 1,
          approvedBugReports: 1,
          totalRewards: 1,
          projectsParticipated: 1,
          reputationScore: 1,
          totalCreditsAcquired: 1,
          createdAt: 1,
          badges: 1, // Include badges
          stats: 1 // Include stats (verifiedBugs count)
        }
      }
    ]);

    // Add rank to each user
    const rankedData = leaderboardData.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // Award top 3 leaderboard badges
    // First, clear all top 3 badges from everyone
    await User.updateMany(
      { accountType: 'tester' },
      {
        $set: {
          'badges.bugConqueror': false,
          'badges.bugMaster': false,
          'badges.bugExpert': false
        }
      }
    );

    // Award badges to current top 3
    if (rankedData.length >= 1) {
      await User.findByIdAndUpdate(rankedData[0]._id, {
        $set: { 'badges.bugConqueror': true }
      });
    }
    if (rankedData.length >= 2) {
      await User.findByIdAndUpdate(rankedData[1]._id, {
        $set: { 'badges.bugMaster': true }
      });
    }
    if (rankedData.length >= 3) {
      await User.findByIdAndUpdate(rankedData[2]._id, {
        $set: { 'badges.bugExpert': true }
      });
    }

    // Refresh the ranked data to include updated badges
    for (let i = 0; i < Math.min(3, rankedData.length); i++) {
      const updatedUser = await User.findById(rankedData[i]._id).select('badges');
      if (updatedUser) {
        rankedData[i].badges = updatedUser.badges;
      }
    }

    // Get summary statistics
    const stats = await User.aggregate([
      { $match: { accountType: 'tester' } },
      {
        $lookup: {
          from: 'bugreports',
          localField: '_id',
          foreignField: 'submittedBy',
          as: 'bugReports'
        }
      },
      {
        $match: { 'bugReports.0': { $exists: true } }
      },
      {
        $group: {
          _id: null,
          totalActiveTesters: { $sum: 1 },
          totalBugReports: { $sum: { $size: '$bugReports' } },
          totalRewardsPaid: {
            $sum: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$bugReports',
                      cond: { $eq: ['$$this.reward.status', 'paid'] }
                    }
                  },
                  as: 'report',
                  in: '$$report.reward.amount'
                }
              }
            }
          }
        }
      }
    ]);

    return res.json({
      leaderboards: {
        rankings: rankedData,
        statistics: stats[0] || {
          totalActiveTesters: 0,
          totalBugReports: 0,
          totalRewardsPaid: 0
        }
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating leaderboards:', error);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { User, Project } = await connectToDatabase();

    if (req.method === 'POST') {
      // Create new project
      const user = await authenticateToken(req);
      
      // Debug logging
      console.log('User attempting to create project:', {
        userId: user._id,
        accountType: user.accountType,
        name: user.name,
        email: user.email
      });
      
      if (user.accountType !== 'developer') {
        console.log('Access denied - user account type:', user.accountType);
        return res.status(403).json({
          message: 'Developer account required',
          debug: { userAccountType: user.accountType }
        });
      }

      const {
        name, platform, scope, objective, areasToTest,
        bugRewards, totalBudget, totalBounty, notes, projectLink, image
      } = req.body;

      // Accept either totalBudget (new) or totalBounty (legacy) for backward compatibility
      const budgetAmount = totalBudget || totalBounty;

      // Validate required fields
      if (!name || !platform || !scope || !objective || !areasToTest || !budgetAmount || !projectLink) {
        return res.status(400).json({
          message: 'Missing required fields: name, platform, scope, objective, areasToTest, totalBudget, projectLink',
          received: { name, platform, scope, objective, areasToTest, totalBudget: budgetAmount, projectLink }
        });
      }

      // Validate minimum budget of $20
      const budgetValue = parseFloat(budgetAmount);
      if (budgetValue < 20) {
        return res.status(400).json({
          message: 'Minimum project budget is $20',
          received: budgetValue
        });
      }

      // Additional validation for projectLink
      const urlPattern = /^https?:\/\/.+\..+/;
      if (!urlPattern.test(projectLink)) {
        return res.status(400).json({ 
          message: 'Invalid project link format. Must be a valid URL (e.g., https://example.com)',
          received: projectLink
        });
      }

      // Handle bug rewards - now expecting an object with critical, major, minor fields
      let parsedBugRewards = {};
      if (typeof bugRewards === 'object' && bugRewards !== null) {
        parsedBugRewards = {
          critical: parseFloat(bugRewards.critical) || 0,
          major: parseFloat(bugRewards.major) || 0,
          minor: parseFloat(bugRewards.minor) || 0
        };
      } else if (typeof bugRewards === 'string') {
        // Backward compatibility - parse text format
        try {
          const lines = bugRewards.split('\n');
          lines.forEach(line => {
            if (line.toLowerCase().includes('critical')) {
              const match = line.match(/\$?(\d+)/);
              if (match) parsedBugRewards.critical = parseInt(match[1]);
            } else if (line.toLowerCase().includes('major')) {
              const match = line.match(/\$?(\d+)/);
              if (match) parsedBugRewards.major = parseInt(match[1]);
            } else if (line.toLowerCase().includes('minor')) {
              const match = line.match(/\$?(\d+)/);
              if (match) parsedBugRewards.minor = parseInt(match[1]);
            }
          });
        } catch (error) {
          parsedBugRewards = { critical: 0, major: 0, minor: 0 };
        }
      } else {
        parsedBugRewards = { critical: 0, major: 0, minor: 0 };
      }

      const project = new Project({
        name,
        postedBy: user._id,
        platform,
        scope,
        objective,
        areasToTest,
        bugRewards: parsedBugRewards,
        totalBudget: budgetValue, // Total amount paid by developer
        // platformFee, totalBounty, and remainingBounty are calculated automatically by pre-save hook
        notes: notes || '',
        projectLink,
        image: image || '',
        status: 'pending',
        paymentStatus: 'pending'
      });

      await project.save();

      // Create transaction record for platform fee
      const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({
        type: String,
        amount: Number,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
        status: String,
        description: String,
        metadata: Object
      }, { timestamps: true }));

      await Transaction.create({
        type: 'platform_fee',
        amount: project.platformFee,
        user: user._id,
        project: project._id,
        status: 'completed',
        description: `Platform fee (${project.platformFeePercentage}%) for project: ${project.name}`,
        metadata: {
          platformFee: project.platformFee,
          bountyPool: project.totalBounty,
          feePercentage: project.platformFeePercentage,
          totalBudget: project.totalBudget
        }
      });

      await project.populate('postedBy', 'name email');

      return res.status(201).json({
        message: 'Project created successfully',
        project,
        feeBreakdown: {
          totalBudget: project.totalBudget,
          platformFee: project.platformFee,
          platformFeePercentage: project.platformFeePercentage,
          bountyPool: project.totalBounty
        }
      });

    } else if (req.method === 'GET') {
      // Check if this is a specific project request (has 'id' parameter)
      const { id, leaderboards, status, page = 1, limit = 10, myProjects } = req.query;

      // Handle myProjects query parameter
      if (myProjects === 'true') {
        const user = await authenticateToken(req);

        if (user.accountType !== 'developer') {
          return res.status(403).json({ message: 'Developer account required' });
        }

        const projects = await Project.find({ postedBy: user._id })
          .populate('postedBy', 'name email avatar')
          .sort({ createdAt: -1 });

        return res.json({
          projects,
          total: projects.length
        });
      }

      if (id) {
        // Get project by ID - optimized query
        const project = await Project.findById(id).lean(); // Use lean() for better performance

        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }

        return res.json(project);
      }

      if (leaderboards === 'true') {
        // Return leaderboards data
        return await generateLeaderboards(req, res);
      }

      // Get all projects (with filtering)
      let filter = {};
      if (status) {
        filter.status = status;
      } else {
        // By default, only show approved projects to testers
        // Admins/developers can explicitly request other statuses using ?status=pending
        filter.status = 'approved';
      }

      const projects = await Project.find(filter)
        .populate('postedBy', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Project.countDocuments(filter);

      return res.json({
        projects,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: error.message });
  }
};