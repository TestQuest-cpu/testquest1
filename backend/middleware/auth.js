const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const requireDeveloper = (req, res, next) => {
  if (req.user.accountType !== 'developer') {
    return res.status(403).json({ message: 'Developer account required' });
  }
  next();
};

const requireTester = (req, res, next) => {
  if (req.user.accountType !== 'tester') {
    return res.status(403).json({ message: 'Tester account required' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.accountType !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireDeveloper,
  requireTester,
  requireAdmin
};