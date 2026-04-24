/**
 * Utility functions for safe array operations to prevent read-only errors
 */

/**
 * Safely creates a copy of an array and sorts it
 * @param {Array} arr - Array to sort
 * @returns {Array} - Sorted copy of the array
 */
export const safeSortArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...arr].sort();
};

/**
 * Safely creates a copy of an array
 * @param {Array} arr - Array to copy
 * @returns {Array} - Copy of the array
 */
export const safeArrayCopy = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...arr];
};

/**
 * Safely joins array elements after creating a copy
 * @param {Array} arr - Array to join
 * @param {string} separator - Separator for join operation
 * @returns {string} - Joined string
 */
export const safeArrayJoin = (arr, separator = ',') => {
  if (!Array.isArray(arr)) return '';
  return [...arr].join(separator);
};

/**
 * Creates a stable key from an array of IDs by sorting and joining
 * @param {Array} ids - Array of IDs
 * @returns {string} - Stable key string
 */
export const createStableKey = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return '';
  return [...ids].sort().join(',');
};

/**
 * Deep clone an object to prevent mutation issues
 * @param {any} obj - Object to clone
 * @returns {any} - Deep cloned object
 */
export const safeDeepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.warn('Failed to deep clone object:', error);
    return obj;
  }
};

export default {
  safeSortArray,
  safeArrayCopy,
  safeArrayJoin,
  createStableKey,
  safeDeepClone
};