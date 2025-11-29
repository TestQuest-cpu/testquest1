import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCreditsAcquired: {
    type: Number,
    default: 0,
    min: 0
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

// PendingUser Schema - for email verification before account creation
const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  password: { type: String, required: true },
  accountType: { type: String, required: true, enum: ['tester', 'developer'] },
  verificationToken: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

const PendingUser = mongoose.models.PendingUser || mongoose.model('PendingUser', pendingUserSchema);

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    isConnected = true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    // Set JSON content type first
    res.setHeader('Content-Type', 'application/json');

    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Allow current deployment URLs
    const origin = req.headers.origin;
    if (origin && (origin.includes('test-quest') && origin.includes('vercel.app'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://test-quest-seven.vercel.app');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    await connectToDatabase();

    const { action } = req.query;

    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      case 'register':
        return await handleRegister(req, res);
      case 'verify-email':
        return await handleVerifyEmail(req, res);
      default:
        return res.status(404).json({ message: 'Auth action not found' });
    }
  } catch (error) {
    console.error('Function error:', error);
    console.error('Error stack:', error.stack);

    // Make sure we always return JSON
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Handle login
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        accountType: user.accountType
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Handle registration
async function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, password, accountType } = req.body;

  // Validate input
  if (!name || !email || !password || !accountType) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!['tester', 'developer'].includes(accountType)) {
    return res.status(400).json({ message: 'Account type must be either tester or developer' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Check if there's a pending registration for this email
    const existingPending = await PendingUser.findOne({ email: email.toLowerCase() });
    if (existingPending) {
      // Delete old pending registration
      await PendingUser.deleteOne({ email: email.toLowerCase() });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create pending user (account not created yet)
    // Store password in plain text temporarily - will be hashed when real account is created
    const pendingUser = new PendingUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Plain text - will be hashed by User model pre-save hook
      accountType,
      verificationToken,
      expiresAt
    });

    await pendingUser.save();

    // Send verification email
    await sendVerificationEmail(pendingUser, verificationToken);

    res.status(201).json({
      message: 'Registration initiated. Please check your email to complete account creation.',
      email: pendingUser.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A registration for this email is already pending' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Handle email verification - creates account from pending user
async function handleVerifyEmail(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required' });
  }

  try {
    // Find pending user with valid token (MongoDB TTL will auto-delete expired ones)
    const pendingUser = await PendingUser.findOne({ verificationToken: token });

    if (!pendingUser) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    // Check if user already exists (in case they verified twice)
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      // Clean up pending user and return success
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.json({ message: 'Account already created. Please log in.' });
    }

    // Create the actual user account (already verified)
    const user = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Plain text - will be hashed by pre-save hook
      accountType: pendingUser.accountType,
      isEmailVerified: true // Account is verified from the start
    });

    await user.save();

    // Delete pending user
    await PendingUser.deleteOne({ _id: pendingUser._id });

    res.json({
      message: 'Account created successfully! You can now log in.',
      accountCreated: true
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Send verification email
async function sendVerificationEmail(pendingUser, token) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  // Create email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Email HTML template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; background: #7C3AED; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        .link { color: #7C3AED; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Welcome to TestQuest!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${pendingUser.name}</strong>,</p>
          <p>Thank you for signing up for TestQuest as a <strong>${pendingUser.accountType}</strong>!</p>
          <p>Click the button below to complete your account creation:</p>
          <center>
            <a href="${verificationUrl}" class="button">Create My Account</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p class="link">${verificationUrl}</p>
          <p><strong>Important:</strong> This link will expire in 48 hours.</p>
          <p>If you didn't request this account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TestQuest. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"TestQuest" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: pendingUser.email,
      subject: 'Complete your TestQuest account creation',
      html: htmlContent,
      text: `Hi ${pendingUser.name},\n\nClick the link below to complete your TestQuest account creation:\n${verificationUrl}\n\nThis link will expire in 48 hours.\n\nIf you didn't request this, please ignore this email.`
    });

    console.log(`✓ Verification email sent to ${pendingUser.email}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    // Log details but don't throw - we want registration to continue even if email fails
    console.log('\n=== EMAIL FALLBACK - VERIFICATION LINK ===');
    console.log(`To: ${pendingUser.email}`);
    console.log(`Link: ${verificationUrl}`);
    console.log('==========================================\n');
  }
}