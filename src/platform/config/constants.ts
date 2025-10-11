/**
 * Platform Constants
 * Centralized configuration constants for the platform
 */

export const DATA_QUALITY_THRESHOLDS = {
  MIN_CONFIDENCE_SCORE: 0.7,
  MIN_COMPLETENESS_RATIO: 0.8,
  MAX_AGE_DAYS: 90,
  MIN_VERIFICATION_LEVEL: 2
};

export const API_RATE_LIMITS = {
  PDL: {
    REQUESTS_PER_MINUTE: 100,
    REQUESTS_PER_DAY: 10000
  },
  CORESIGNAL: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_DAY: 5000
  },
  DEFAULT: {
    REQUESTS_PER_MINUTE: 30,
    REQUESTS_PER_DAY: 1000
  }
};

export const CACHE_DURATIONS = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
  VERY_LONG: 7 * 24 * 60 * 60 * 1000 // 7 days
};