const mongoose = require('mongoose');

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

// Create models only once
let User, ModeratorApplication;

function getModels() {
  if (!User) {
    User = mongoose.models.User || mongoose.model('User', userSchema);
  }
  if (!ModeratorApplication) {
    ModeratorApplication = mongoose.models.ModeratorApplication || mongoose.model('ModeratorApplication', moderatorApplicationSchema);
  }
  return { User, ModeratorApplication };
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
const jwt = require('jsonwebtoken');

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
  const { User } = await connectToDatabase();
  const user = await User.findById(decoded.userId).select('-password');
  
  if (!user) {
    throw new Error('Invalid token - user not found');
  }

  user.accountType = decoded.accountType;
  return user;
};

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
    const { User, ModeratorApplication } = await connectToDatabase();

    // Check for action-based routing
    const { action } = req.query || {};

    // Check moderator application status
    if (action === 'check-moderator-application') {
      if (req.method === 'GET') {
        const user = await authenticateToken(req);

        const application = await ModeratorApplication.findOne({
          userId: user._id
        }).sort({ submittedAt: -1 });

        return res.json({
          application: application
        });
      } else {
        return res.status(405).json({ message: 'Method not allowed' });
      }
    }

    // Setup moderator account after approval
    if (action === 'setup-moderator') {
      if (req.method === 'POST') {
        const user = await authenticateToken(req);
        const { username, email, password, fullName } = req.body;

        // Check if user has an approved application
        const application = await ModeratorApplication.findOne({
          userId: user._id,
          status: 'approved'
        });

        if (!application) {
          return res.status(403).json({ message: 'No approved moderator application found' });
        }

        // Check if moderator account already exists for this user
        const Moderator = mongoose.models.Moderator || mongoose.model('Moderator', new mongoose.Schema({
          username: { type: String, required: true, unique: true },
          email: { type: String, required: true, unique: true },
          password: { type: String, required: true },
          fullName: { type: String, required: true },
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          role: { type: String, default: 'moderator' },
          createdAt: { type: Date, default: Date.now }
        }));

        const existingModerator = await Moderator.findOne({ userId: user._id });
        if (existingModerator) {
          return res.status(400).json({ message: 'Moderator account already exists' });
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create moderator account
        const moderator = new Moderator({
          username,
          email,
          password: hashedPassword,
          fullName,
          userId: user._id,
          role: 'moderator'
        });

        await moderator.save();

        return res.status(201).json({
          message: 'Moderator account created successfully',
          moderator: {
            username: moderator.username,
            email: moderator.email,
            fullName: moderator.fullName
          }
        });
      } else {
        return res.status(405).json({ message: 'Method not allowed' });
      }
    }

    // Submit moderator application
    if (action === 'moderator-application') {
      if (req.method === 'POST') {
        const user = await authenticateToken(req);
        const { examScore } = req.body;

        // Validate exam score
        if (typeof examScore !== 'number' || examScore < 0 || examScore > 100) {
          return res.status(400).json({ message: 'Invalid exam score' });
        }

        // Check if score meets minimum requirement (80%)
        if (examScore < 80) {
          return res.status(400).json({ message: 'Exam score must be at least 80% to apply' });
        }

        // Check if user already has a pending application
        const existingApplication = await ModeratorApplication.findOne({
          userId: user._id,
          status: 'pending'
        });

        if (existingApplication) {
          return res.status(400).json({
            message: 'You already have a pending moderator application',
            application: existingApplication
          });
        }

        // Create new application
        const application = new ModeratorApplication({
          userId: user._id,
          examScore: examScore,
          status: 'pending',
          submittedAt: new Date()
        });

        await application.save();
        await application.populate('userId', 'name email avatar stats');

        return res.status(201).json({
          message: 'Moderator application submitted successfully',
          application: application
        });
      } else {
        return res.status(405).json({ message: 'Method not allowed' });
      }
    }

    if (req.method === 'GET') {
      // Get current user profile and balance
      const user = await authenticateToken(req);

      // Initialize totalCreditsAcquired if it doesn't exist (for existing users)
      if (user.totalCreditsAcquired === undefined || user.totalCreditsAcquired === null) {
        user.totalCreditsAcquired = (user.balance || 0);
        await user.save();
      }

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          accountType: user.accountType,
          balance: user.balance || 0,
          totalEarnings: user.totalEarnings || 0,
          totalCreditsAcquired: user.totalCreditsAcquired || 0,
          avatar: user.avatar,
          badges: user.badges || { firstBlood: false, bugHunter: false, eliteTester: false, bugConqueror: false, bugMaster: false, bugExpert: false },
          stats: user.stats || {
            verifiedBugs: 0,
            totalSubmitted: 0,
            totalApproved: 0,
            totalRejected: 0,
            averageDeveloperRating: 0,
            totalDeveloperRatings: 0,
            reputationScore: 0,
            lastActive: new Date()
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });

    } else if (req.method === 'PUT') {
      // Update user profile (name, avatar, etc. - not balance)
      const user = await authenticateToken(req);
      const { name, avatar } = req.body;

      if (name) user.name = name;
      if (avatar) user.avatar = avatar;

      await user.save();

      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          accountType: user.accountType,
          balance: user.balance || 0,
          totalEarnings: user.totalEarnings || 0,
          totalCreditsAcquired: user.totalCreditsAcquired || 0,
          avatar: user.avatar,
          badges: user.badges || { firstBlood: false, bugHunter: false, eliteTester: false, bugConqueror: false, bugMaster: false, bugExpert: false },
          stats: user.stats || {
            verifiedBugs: 0,
            totalSubmitted: 0,
            totalApproved: 0,
            totalRejected: 0,
            averageDeveloperRating: 0,
            totalDeveloperRatings: 0,
            reputationScore: 0,
            lastActive: new Date()
          },
          updatedAt: user.updatedAt
        }
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('User Profile API Error:', error);
    return res.status(500).json({ 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error'
    });
  }
};