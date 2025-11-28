const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Moderator = require('../models/moderator');

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts, please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderator login
router.post('/login', loginLimiter, async (req, res) => {
  try {
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
    const isPasswordValid = await moderator.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await moderator.updateLastLogin();

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

    res.json({
      message: 'Login successful',
      token,
      moderator: {
        id: moderator._id,
        username: moderator.username,
        email: moderator.email,
        role: moderator.role,
        fullName: moderator.fullName,
        permissions: moderator.permissions,
        lastLogin: moderator.lastLogin,
        profile: moderator.profile
      }
    });

  } catch (error) {
    console.error('Moderator login error:', error);
    res.status(500).json({
      error: 'Server error during login'
    });
  }
});

// Get moderator profile
router.get('/profile', async (req, res) => {
  try {
    // Extract token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'moderator') {
      return res.status(403).json({ error: 'Moderator access required' });
    }

    // Get moderator details
    const moderator = await Moderator.findById(decoded.moderatorId).select('-password');
    if (!moderator) {
      return res.status(404).json({ error: 'Moderator not found' });
    }

    res.json({
      moderator: {
        id: moderator._id,
        username: moderator.username,
        email: moderator.email,
        role: moderator.role,
        fullName: moderator.fullName,
        permissions: moderator.permissions,
        lastLogin: moderator.lastLogin,
        profile: moderator.profile,
        stats: moderator.stats
      }
    });

  } catch (error) {
    console.error('Get moderator profile error:', error);
    res.status(500).json({
      error: 'Server error fetching profile'
    });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', async (req, res) => {
  try {
    // Could add token blacklisting here if needed
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Moderator logout error:', error);
    res.status(500).json({
      error: 'Server error during logout'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'moderator') {
      return res.status(403).json({ error: 'Invalid token type' });
    }

    const moderator = await Moderator.findById(decoded.moderatorId).select('username role status permissions');
    if (!moderator || moderator.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive moderator' });
    }

    res.json({
      valid: true,
      moderator: {
        id: moderator._id,
        username: moderator.username,
        role: moderator.role,
        permissions: moderator.permissions
      }
    });

  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Invalid token'
    });
  }
});

module.exports = router;