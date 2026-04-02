import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verify JWT token
 * Middleware to authenticate users via JWT
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token invalid.'
        });
      }

      // Check if user is banned
      if (req.user.isBanned) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been banned. Contact support.'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive. Contact support.'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Token failed verification.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message
    });
  }
};

/**
 * Admin authorization middleware
 * Check if user has admin role
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for public routes that need user info if available
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
          // Token invalid, but continue without user
          req.user = null;
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};
