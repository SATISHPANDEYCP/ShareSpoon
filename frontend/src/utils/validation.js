/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
export const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: [],
  };

  if (password.length < 6) {
    result.isValid = false;
    result.errors.push('Password must be at least 6 characters');
  }

  return result;
};

/**
 * Validate required fields
 * @param {object} data - Data object to validate
 * @param {array} requiredFields - Array of required field names
 * @returns {object} Validation result
 */
export const validateRequired = (data, requiredFields) => {
  const errors = {};

  requiredFields.forEach((field) => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors[field] = `${field} is required`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate quantity unit text.
 * Requires at least one alphabetic character and max length 30.
 * @param {string} unit - Unit label to validate
 * @returns {boolean} True if valid
 */
export const isValidQuantityUnit = (unit) => {
  const normalized = String(unit || '').trim();
  return normalized.length > 0 && normalized.length <= 30 && /[A-Za-z]/.test(normalized);
};

/**
 * Normalize quantity unit for safe display.
 * Falls back to "units" for invalid values.
 * @param {string} unit - Unit label
 * @returns {string} Safe unit label
 */
export const normalizeQuantityUnit = (unit) => {
  const normalized = String(unit || '').trim();
  if (isValidQuantityUnit(normalized)) {
    return normalized;
  }
  return 'units';
};
