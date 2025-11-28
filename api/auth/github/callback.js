import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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
    minlength: 6
  },
  accountType: {
    type: String,
    required: true,
    enum: ['tester', 'developer']
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    sparse: true
  },
  githubId: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcryptjs.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

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

async function getGitHubUserInfo(accessToken) {
  const [userResponse, emailResponse] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
    fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
  ]);
  
  const user = await userResponse.json();
  const emails = await emailResponse.json();
  const primaryEmail = emails.find(email => email.primary);
  
  return { ...user, email: primaryEmail.email };
}

async function exchangeCodeForToken(code) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  
  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    // Get the actual domain from the request headers
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    if (!code) {
      return res.redirect(`${baseUrl}?error=no_code`);
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code);

    if (tokenData.error) {
      return res.redirect(`${baseUrl}?error=token_error`);
    }

    // Get user info from GitHub
    const githubUser = await getGitHubUserInfo(tokenData.access_token);

    await connectToDatabase();

    // Find or create user
    let user = await User.findOne({ email: githubUser.email });

    if (!user) {
      // Create new user - default to developer account type for GitHub users
      user = new User({
        name: githubUser.name || githubUser.login,
        email: githubUser.email,
        password: 'oauth_user', // Placeholder for OAuth users
        accountType: 'developer', // Default account type for GitHub users
        githubId: githubUser.id,
        avatar: githubUser.avatar_url,
        isEmailVerified: true
      });
      await user.save();
    } else {
      // Update existing user with GitHub ID if not set
      if (!user.githubId) {
        user.githubId = githubUser.id;
        user.avatar = githubUser.avatar_url;
        user.isEmailVerified = true;
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, accountType: user.accountType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${baseUrl}?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      avatar: user.avatar
    }))}`);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    res.redirect(`${baseUrl}?error=oauth_failed`);
  }
}