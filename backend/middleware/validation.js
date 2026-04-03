import { body, param, query, validationResult } from 'express-validator';

const parseJsonIfString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/**
 * Middleware to handle validation errors
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Auth validation rules
 */
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  validate
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validate
];

export const verifyOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),

  validate
];

export const resendOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  validate
];

/**
 * Food Post validation rules
 */
export const createPostValidation = [
  body('pickupLocation')
    .customSanitizer(parseJsonIfString),

  body('hygieneChecklist')
    .optional({ checkFalsy: true })
    .customSanitizer(parseJsonIfString),

  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('foodType')
    .notEmpty().withMessage('Food type is required')
    .isIn(['Cooked Meal', 'Raw Vegetables', 'Fruits', 'Grains', 'Dairy', 'Bakery', 'Packaged Food', 'Other'])
    .withMessage('Invalid food type'),
  
  body('quantity')
    .trim()
    .notEmpty().withMessage('Quantity is required'),
  
  body('expiryTime')
    .notEmpty().withMessage('Expiry time is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry time must be in the future');
      }
      return true;
    }),
  
  body('pickupLocation')
    .custom((value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Pickup location is required');
      }

      if (value.type && value.type !== 'Point') {
        throw new Error('Pickup location type must be Point');
      }

      if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
        throw new Error('Coordinates must be an array of [longitude, latitude]');
      }

      const lng = Number(value.coordinates[0]);
      const lat = Number(value.coordinates[1]);

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        throw new Error('Coordinates must be numbers');
      }

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error('Invalid coordinate values');
      }

      value.type = 'Point';
      value.coordinates = [lng, lat];
      return true;
    }),
  
  validate
];

/**
 * Request validation rules
 */
export const createRequestValidation = [
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
  
  body('pickupTime')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  validate
];

/**
 * Review validation rules
 */
export const createReviewValidation = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  
  validate
];

export const updateReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),

  validate
];

/**
 * ID parameter validation
 */
export const idValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  
  validate
];

/**
 * Pagination validation
 */
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  validate
];
