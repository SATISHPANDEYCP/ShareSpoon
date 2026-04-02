import jwt from 'jsonwebtoken';

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token expires in 30 days
  });
};

/**
 * Send token response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Generate token
  const token = generateToken(user._id);

  // Remove password from output
  const userObject = user.toObject();
  delete userObject.password;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userObject
  });
};
