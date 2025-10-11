/**
 * SYSTEM CONSTANTS AND CONFIGURATION
 * 
 * Centralized configuration for magic numbers, thresholds, and system settings
 */

// ============================================================================
// DATA QUALITY THRESHOLDS
// ============================================================================

export const DATA_QUALITY_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 50,
  POOR: 25,
  MINIMUM_ACCEPTABLE: 30
} as const;

// ============================================================================
// SALES INTENT SCORING
// ============================================================================

export const SALES_INTENT_LEVELS = {
  CRITICAL: { min: 80, max: 100, label: 'Critical' },
  HIGH: { min: 60, max: 79, label: 'High' },
  MEDIUM: { min: 40, max: 59, label: 'Medium' },
  LOW: { min: 20, max: 39, label: 'Low' },
  MINIMAL: { min: 0, max: 19, label: 'Minimal' }
} as const;

export const SALES_INTENT_WEIGHTS = {
  JOB_POSTINGS: 0.4,
  HIRING_TREND: 0.3,
  GROWTH_SIGNALS: 0.2,
  MARKET_POSITION: 0.1
} as const;

// ============================================================================
// API RATE LIMITS
// ============================================================================

export const API_RATE_LIMITS = {
  PDL: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_DAY: 10000
  },
  CORESIGNAL: {
    REQUESTS_PER_MINUTE: 100,
    REQUESTS_PER_DAY: 50000
  },
  CLAUDE: {
    REQUESTS_PER_MINUTE: 20,
    REQUESTS_PER_DAY: 1000
  }
} as const;

// ============================================================================
// CACHING CONFIGURATION
// ============================================================================

export const CACHE_TTL = {
  PERSON_DATA: 24 * 60 * 60 * 1000, // 24 hours
  COMPANY_DATA: 12 * 60 * 60 * 1000, // 12 hours
  SALES_INTENT: 6 * 60 * 60 * 1000, // 6 hours
  AI_ANALYSIS: 7 * 24 * 60 * 60 * 1000, // 7 days
  ROLE_VARIATIONS: 30 * 24 * 60 * 60 * 1000 // 30 days
} as const;

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  DEFAULT_PAGE: 1
} as const;

// ============================================================================
// AI CONFIGURATION
// ============================================================================

export const AI_CONFIG = {
  CLAUDE: {
    DEFAULT_TEMPERATURE: 0.7,
    MAX_TOKENS: 2000,
    TIMEOUT_MS: 30000,
    MAX_RETRIES: 2
  },
  CONFIDENCE_THRESHOLDS: {
    HIGH: 80,
    MEDIUM: 60,
    LOW: 40
  }
} as const;

// ============================================================================
// SENIORITY LEVELS
// ============================================================================

export const SENIORITY_LEVELS = {
  C_LEVEL: ['CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CPO', 'CRO', 'CISO'],
  VP_LEVEL: ['VP', 'Vice President', 'Senior VP', 'Executive VP'],
  DIRECTOR_LEVEL: ['Director', 'Senior Director', 'Managing Director'],
  MANAGER_LEVEL: ['Manager', 'Senior Manager', 'Lead', 'Principal'],
  INDIVIDUAL_CONTRIBUTOR: ['Engineer', 'Developer', 'Analyst', 'Specialist', 'Coordinator']
} as const;

// ============================================================================
// DEPARTMENT MAPPING
// ============================================================================

export const DEPARTMENT_KEYWORDS = {
  ENGINEERING: ['engineer', 'developer', 'architect', 'devops', 'sre', 'platform'],
  SALES: ['sales', 'account', 'revenue', 'business development', 'partnership'],
  MARKETING: ['marketing', 'growth', 'demand', 'content', 'brand', 'digital'],
  PRODUCT: ['product', 'pm', 'strategy', 'roadmap', 'feature'],
  FINANCE: ['finance', 'accounting', 'treasury', 'controller', 'cfo'],
  HR: ['hr', 'people', 'talent', 'recruiting', 'culture'],
  OPERATIONS: ['operations', 'ops', 'process', 'efficiency', 'optimization']
} as const;

// ============================================================================
// TIME FRAMES
// ============================================================================

export const TIME_FRAMES = {
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_QUARTER: 'last_quarter',
  LAST_6_MONTHS: 'last_6_months',
  LAST_YEAR: 'last_year'
} as const;

// ============================================================================
// ERROR RETRY CONFIGURATION
// ============================================================================

export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_MULTIPLIER: 2
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  LINKEDIN_REGEX: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_]+\/?$/,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_COMPANY_LENGTH: 2,
  MAX_COMPANY_LENGTH: 200
} as const;
