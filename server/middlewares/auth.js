// This file has been cleaned for redundancy and simplified.
// Functional behavior remains identical to previous version.

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('[authenticate] Token decoded:', {
      userId: decoded.id,
      userName: decoded.name,
      userRole: decoded.role,
      userEmail: decoded.email
    });
    
    // Set user info in request object
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please login again.'
      });
    }
    
    console.error('Authentication error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed. Please try again.'
    });
  }
};

/**
 * Optional authentication middleware.
 * If a valid token is provided it will populate req.user, otherwise it will silently continue.
 */
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue as unauthenticated
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    // If token is invalid or expired, treat as unauthenticated (do not block public routes)
    return next();
  }
};

/**
 * Authorization middleware to check if user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  console.log('[isAdmin] Checking admin access for user:', {
    userId: req.user?.id,
    userName: req.user?.name,
    userRole: req.user?.role,
    hasUser: !!req.user
  });
  
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin privileges required.'
    });
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  isAdmin
};