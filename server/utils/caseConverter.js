/**
 * Utilities for converting between snake_case and camelCase
 */

export const ALLOWED_STAGES = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
];

export const FUNNEL_STAGES = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
];

/**
 * Converts a snake_case string to camelCase
 * @param {string} str 
 * @returns {string}
 */
export function snakeToCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts an object's keys from snake_case to camelCase
 * @param {any} obj 
 * @returns {any}
 */
export function toCamelCase(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      newObj[camelKey] = toCamelCase(value);
    }
    return newObj;
  }

  return obj;
}
