const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/admin');
const { authenticateAdmin, requireSuperAdmin, adminRateLimit, logAdminAction, ADMIN_JWT_SECRET } = require('../middleware/adminAuth');
const router = express.Router();

// Rate limiting for login attempts
const loginRateLimit = adminRateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

// Admin login
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!admin) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({ 
        message: 'Account is locked due to multiple failed login attempts. Please try again later.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({ 
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check password
    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      // Increment login attempts
      await admin.incLoginAttempts();
      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Reset login attempts on successful login
    await admin.resetLoginAttempts();

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token with admin type
    const token = jwt.sign(
      { 
        adminId: admin._id, 
        username: admin.username,
        role: admin.role,
        type: 'admin' // Important: this distinguishes admin tokens
      },
      ADMIN_JWT_SECRET,
      { expiresIn: '8h' } // Shorter expiry for admin tokens
    );

    // Log successful login
    console.log(`[ADMIN LOGIN] ${new Date().toISOString()} - Admin ${admin.username} (${admin.email}) logged in - IP: ${req.ip}`);

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
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Get current admin profile
router.get('/me', authenticateAdmin, (req, res) => {
  res.json({
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      email: req.admin.email,
      role: req.admin.role,
      permissions: req.admin.permissions,
      lastLogin: req.admin.lastLogin,
      createdAt: req.admin.createdAt
    }
  });
});

// Change password
router.patch('/change-password', authenticateAdmin, adminRateLimit(3, 60 * 60 * 1000), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'New password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Verify current password
    const isCurrentPasswordCorrect = await req.admin.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({ 
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    req.admin.password = newPassword;
    await req.admin.save();

    console.log(`[ADMIN PASSWORD CHANGE] ${new Date().toISOString()} - Admin ${req.admin.username} changed password - IP: ${req.ip}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Admin password change error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Create new admin (super admin only)
router.post('/create', authenticateAdmin, requireSuperAdmin, logAdminAction('CREATE_ADMIN'), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Username, email, password, and role are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Admin with this username or email already exists',
        code: 'ADMIN_EXISTS'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      username,
      email,
      password,
      role,
      createdBy: req.admin._id
    });

    await newAdmin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
        isActive: newAdmin.isActive,
        createdAt: newAdmin.createdAt
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// List all admins (super admin only)
router.get('/list', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-password -passwordResetToken -twoFactorSecret')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({ admins });
  } catch (error) {
    console.error('Admin list error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Update admin status (super admin only)
router.patch('/:adminId/status', authenticateAdmin, requireSuperAdmin, logAdminAction('UPDATE_ADMIN_STATUS'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        message: 'isActive field must be a boolean',
        code: 'INVALID_STATUS'
      });
    }

    // Prevent super admin from deactivating themselves
    if (adminId === req.admin._id.toString() && !isActive) {
      return res.status(400).json({ 
        message: 'Cannot deactivate your own account',
        code: 'CANNOT_DEACTIVATE_SELF'
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        message: 'Admin not found',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    admin.isActive = isActive;
    await admin.save();

    res.json({
      message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Admin status update error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateAdmin, (req, res) => {
  console.log(`[ADMIN LOGOUT] ${new Date().toISOString()} - Admin ${req.admin.username} (${req.admin.email}) logged out - IP: ${req.ip}`);
  
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;