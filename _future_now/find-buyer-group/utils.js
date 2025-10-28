/**
 * Shared utilities for buyer group discovery
 */

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain name
 */
function extractDomain(url) {
  if (!url) return '';
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
  return match ? match[1] : url;
}

/**
 * Extract LinkedIn company ID from URL
 * @param {string} linkedinUrl - LinkedIn company URL
 * @returns {string|null} LinkedIn company ID
 */
function extractLinkedInId(linkedinUrl) {
  if (!linkedinUrl) return null;
  const match = linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Parse full name into first and last name
 * @param {string} fullName - Full name to parse
 * @returns {object} Object with firstName and lastName
 */
function parseName(fullName) {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(' ');
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  };
}

/**
 * Deduplicate array of items by key
 * @param {Array} items - Array to deduplicate
 * @param {string} key - Key to deduplicate by (default: 'id')
 * @returns {Array} Deduplicated array
 */
function deduplicate(items, key = 'id') {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item[key])) return false;
    seen.add(item[key]);
    return true;
  });
}

/**
 * Delay execution for specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random string for IDs
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
function generateRandomString(length = 9) {
  return Math.random().toString(36).substr(2, length);
}

/**
 * Calculate overall confidence score from individual scores
 * @param {object} scores - Individual scores
 * @returns {number} Overall confidence (0-100)
 */
function calculateOverallConfidence(scores) {
  const weights = {
    seniority: 0.25,
    departmentFit: 0.20,
    influence: 0.20,
    championPotential: 0.15,
    crossFunctional: 0.10,
    geoAlignment: 0.10
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [key, weight] of Object.entries(weights)) {
    if (scores[key] !== undefined) {
      weightedSum += scores[key] * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Check if data is fresh (less than specified days old)
 * @param {object} data - Data object with updatedAt field
 * @param {number} maxDays - Maximum age in days
 * @returns {boolean} True if data is fresh
 */
function isDataFresh(data, maxDays = 30) {
  if (!data || !data.updatedAt) return false;
  const daysDiff = (Date.now() - new Date(data.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff < maxDays;
}

/**
 * Sanitize string for database storage
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
function sanitizeString(str, maxLength = 255) {
  if (!str) return '';
  return str.toString().substring(0, maxLength).trim();
}

/**
 * Create unique ID with timestamp
 * @param {string} prefix - Prefix for ID
 * @returns {string} Unique ID
 */
function createUniqueId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${generateRandomString()}`;
}

module.exports = {
  extractDomain,
  extractLinkedInId,
  parseName,
  deduplicate,
  delay,
  generateRandomString,
  calculateOverallConfidence,
  formatCurrency,
  formatPercentage,
  isDataFresh,
  sanitizeString,
  createUniqueId
};
