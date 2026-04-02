import { format, formatDistance, formatRelative, isPast } from 'date-fns';

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy');
};

/**
 * Format date with time
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date with time
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy hh:mm a');
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

/**
 * Format date relative to now (e.g., "today at 3:30 PM")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (date) => {
  if (!date) return 'N/A';
  return formatRelative(new Date(date), new Date());
};

/**
 * Check if date is expired
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isExpired = (date) => {
  if (!date) return false;
  return isPast(new Date(date));
};

/**
 * Get time until expiry
 * @param {Date|string} date - Expiry date
 * @returns {string} Time until expiry or "Expired"
 */
export const getTimeUntilExpiry = (date) => {
  if (!date) return 'N/A';
  if (isExpired(date)) return 'Expired';
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};
