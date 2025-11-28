const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

// Use a different JWT secret for admin tokens for added security
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_ADMIN_SUFFIX';

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'Admin access token required',
        code: 'TOKEN_MISSING'
      });
    }

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    
    // Verify this is actually an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({ 
        message: 'Invalid token type - admin access required',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    const admin = await Admin.findById(decoded.adminId).select('-password -passwordResetToken -twoFactorSecret');
    
    if (!admin) {
      return res.status(401).json({ 
        message: 'Invalid token - admin not found',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    // Check if admin account is active
    if (!admin.isActive) {
      return res.status(403).json({ 
        message: 'Admin account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if admin account is locked
    if (admin.isLocked) {
      return res.status(423).json({ 
        message: 'Admin account is locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Admin token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      message: 'Invalid or corrupted admin token',
      code: 'TOKEN_INVALID'
    });
  }
};

// Middleware to check if admin has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ 
        message: 'Admin authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.admin.hasPermission(permission)) {
      return res.status(403).json({ 
        message: `Permission denied. Required permission: ${permission}`,
        code: 'PERMISSION_DENIED',
        requiredPermission: permission
      });
    }

    next();
  };
};

// Middleware to check if admin has specific role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ 
        message: 'Admin authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.admin.role !== role) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${role}`,
        code: 'ROLE_REQUIRED',
        requiredRole: role
      });
    }

    next();
  };
};

// Middleware to check if admin is super admin
const requireSuperAdmin = requireRole('super_admin');

// Rate limiting middleware for admin actions
const adminRateLimit = (maxAttempts = 100, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const adminId = req.admin?._id?.toString();
    if (!adminId) return next();

    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [id, data] of attempts.entries()) {
      attempts.set(id, data.filter(timestamp => timestamp > windowStart));
      if (attempts.get(id).length === 0) {
        attempts.delete(id);
      }
    }
    
    const adminAttempts = attempts.get(adminId) || [];
    
    if (adminAttempts.length >= maxAttempts) {
      return res.status(429).json({
        message: 'Too many admin actions. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    adminAttempts.push(now);
    attempts.set(adminId, adminAttempts);
    
    next();
  };
};

// Log admin actions for audit trail
const logAdminAction = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log successful actions (status 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`[ADMIN ACTION] ${new Date().toISOString()} - Admin ${req.admin?.username} (${req.admin?.email}) performed: ${action} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticateAdmin,
  requirePermission,
  requireRole,
  requireSuperAdmin,
  adminRateLimit,
  logAdminAction,
  ADMIN_JWT_SECRET
};