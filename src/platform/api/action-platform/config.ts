import { ActionPlatformConfig } from "@/platform/aos/aos";

// Environment validation
const requiredEnvVars = {
  NEXT_PUBLIC_API_BASE_URL: process['env']['NEXT_PUBLIC_API_BASE_URL'],
} as const;

// Validate required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.warn(`⚠️ Missing environment variable: ${key}`);
  }
}

// Default configuration values (NO HARDCODED WORKSPACE/USER IDs)
const defaultConfig: Omit<ActionPlatformConfig, "workspaceId" | "userId"> = {
  apiUrl: requiredEnvVars.NEXT_PUBLIC_API_BASE_URL || "/api",
  apiBaseUrl: requiredEnvVars.NEXT_PUBLIC_API_BASE_URL || "/api",
  timeout: parseInt(process['env']['NEXT_PUBLIC_TIMEOUT'] || "30000"), // 30 seconds
  enableRealTime: process['env']['NODE_ENV'] === "production",
  enableOfflineMode: true,
  cacheTimeout: parseInt(process['env']['NEXT_PUBLIC_CACHE_TIMEOUT'] || "300000"), // 5 minutes
  retryAttempts: parseInt(process['env']['NEXT_PUBLIC_RETRY_ATTEMPTS'] || "3"),
  retryDelay: parseInt(process['env']['NEXT_PUBLIC_RETRY_DELAY'] || "1000"), // 1 second
};

// Feature flags
export const featureFlags = {
  enableAdvancedAnalytics:
    process['env']['NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS'] === "true",
  enableAIAssistant: process['env']['NEXT_PUBLIC_ENABLE_AI_ASSISTANT'] !== "false", // Default to true
  enableRealTimeSync: process['env']['NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC'] === "true",
  enableBulkOperations:
    process['env']['NEXT_PUBLIC_ENABLE_BULK_OPERATIONS'] === "true",
  enableExportFeatures:
    process['env']['NEXT_PUBLIC_ENABLE_EXPORT_FEATURES'] === "true",
  enableCustomFields: process['env']['NEXT_PUBLIC_ENABLE_CUSTOM_FIELDS'] === "true",
  enableIntegrations: process['env']['NEXT_PUBLIC_ENABLE_INTEGRATIONS'] === "true",
} as const;

// API endpoints configuration
export const apiEndpoints = {
  leads: "/api/data/leads",
  opportunities: "/api/opportunities",
  contacts: "/api/contacts",
  accounts: "/api/accounts",
  partnerships: "/api/partnerships",
  enrichment: "/api/enrichment",
  analytics: "/api/analytics",
  exports: "/api/exports",
  imports: "/api/imports",
  webhooks: "/api/webhooks",
} as const;

// Cache keys for consistent caching
export const cacheKeys = {
  leads: (workspaceId: string, userId: string) =>
    `leads:${workspaceId}:${userId}`,
  opportunities: (workspaceId: string, userId: string) =>
    `opportunities:${workspaceId}:${userId}`,
  contacts: (workspaceId: string, userId: string) =>
    `contacts:${workspaceId}:${userId}`,
  accounts: (workspaceId: string, userId: string) =>
    `accounts:${workspaceId}:${userId}`,
  partnerships: (workspaceId: string, userId: string) =>
    `partnerships:${workspaceId}:${userId}`,
  userPreferences: (userId: string) => `preferences:${userId}`,
  filters: (userId: string, section: string) => `filters:${userId}:${section}`,
} as const;

// Performance optimization settings
export const performanceConfig = {
  // Pagination
  defaultPageSize: 25,
  maxPageSize: 100,

  // Virtual scrolling thresholds
  virtualScrollThreshold: 100,

  // Debounce delays
  searchDebounceMs: 300,
  filterDebounceMs: 500,

  // Batch operation limits
  maxBatchSize: 50,

  // Image optimization
  maxImageSize: 1024 * 1024, // 1MB
  supportedImageTypes: ["image/jpeg", "image/png", "image/webp"],

  // Request timeouts
  apiTimeoutMs: 30000, // 30 seconds
  shortTimeoutMs: 5000, // 5 seconds for quick operations
} as const;

// Security settings
export const securityConfig = {
  // Content Security Policy
  enableCSP: process['env']['NODE_ENV'] === "production",

  // Rate limiting (client-side awareness)
  rateLimitRpm: 100, // Requests per minute

  // Input sanitization
  maxInputLength: 10000,
  allowedFileTypes: [
    "text/csv",
    "application/json",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],

  // Session management
  sessionTimeoutMs: 8 * 60 * 60 * 1000, // 8 hours

  // Audit logging
  enableAuditLog: process['env']['NODE_ENV'] === "production",
} as const;

// Error reporting configuration
export const errorConfig = {
  enableErrorReporting: process['env']['NODE_ENV'] === "production",
  enableConsoleLogging: process['env']['NODE_ENV'] === "development",
  errorReportingEndpoint: process['env']['NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT'],
  maxErrorsPerSession: 50,
  errorBatchSize: 10,
} as const;

// Internationalization settings
export const i18nConfig = {
  defaultLocale: "en-US",
  supportedLocales: ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE"],
  fallbackLocale: "en-US",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "HH:mm",
  currencyFormat: "USD",
} as const;

// Create configuration with user context (REQUIRED)
export function createActionPlatformConfig(
  workspaceId: string,
  userId: string,
): ActionPlatformConfig {
  if (!workspaceId) {
    throw new Error(
      "Workspace ID is required - cannot create config without authenticated workspace",
    );
  }

  if (!userId) {
    throw new Error(
      "User ID is required - cannot create config without authenticated user",
    );
  }

  return {
    ...defaultConfig,
    workspaceId,
    userId,
  };
}

// Validate configuration
export function validateConfig(config: ActionPlatformConfig): boolean {
  const errors: string[] = [];

  if (!config.workspaceId) {
    errors.push(
      "Workspace ID is required - must be provided from authentication context",
    );
  }

  if (!config.userId) {
    errors.push(
      "User ID is required - must be provided from authentication context",
    );
  }

  if (!config.apiBaseUrl) {
    errors.push("API base URL is required");
  }

  if (config.retryAttempts < 0 || config?.retryAttempts > 10) {
    errors.push("Retry attempts must be between 0 and 10");
  }

  if (config.retryDelay < 100 || config?.retryDelay > 10000) {
    errors.push("Retry delay must be between 100ms and 10s");
  }

  if (config.cacheTimeout < 10000 || config?.cacheTimeout > 3600000) {
    errors.push("Cache timeout must be between 10s and 1h");
  }

  if (errors?.length > 0) {
    console.error("Configuration validation errors:", errors);
    return false;
  }

  return true;
}

// Get environment-specific configuration
export function getEnvironmentConfig() {
  const isDevelopment = process['env']['NODE_ENV'] === "development";
  const isProduction = process['env']['NODE_ENV'] === "production";
  const isTest = process['env']['NODE_ENV'] === "test";

  return {
    isDevelopment,
    isProduction,
    isTest,
    enableDebugLogging:
      isDevelopment || process['env']['NEXT_PUBLIC_DEBUG'] === "true",
    enablePerformanceMonitoring: isProduction,
    enableMockData:
      isDevelopment && process['env']['NEXT_PUBLIC_ENABLE_MOCK_DATA'] === "true",
    apiMockDelay: isDevelopment
      ? parseInt(process['env']['NEXT_PUBLIC_API_MOCK_DELAY'] || "500")
      : 0,
  };
}

// Note: No default config export since workspace/user IDs are required
// Use createActionPlatformConfig(workspaceId, userId) instead
export type { ActionPlatformConfig };

export const monacoConfig = {
  // Production Mode Configuration
  productionMode: process['env']['MONACO_PRODUCTION_MODE'] === "true",
  enableRealData: process['env']['MONACO_ENABLE_REAL_DATA'] === "true",
  disableMockData: process['env']['MONACO_DISABLE_MOCK_DATA'] === "true",

  // BrightData API Configuration
  brightData: {
    apiKey: process['env']['BRIGHTDATA_API_KEY'],
    baseUrl:
      process['env']['BRIGHTDATA_BASE_URL'] ||
      "https://api.brightdata.com/datasets/v3",

    // Critical Business Intelligence Datasets
    datasets: {
      linkedinCompanies:
        process['env']['BRIGHTDATA_DATASET_LINKEDINCOMPANIES'] ||
        "gd_l1viktl72bvl7bjuj0",
      linkedinPeople:
        process['env']['BRIGHTDATA_DATASET_LINKEDINPEOPLE'] ||
        "gd_l1viktl72bvl7bjuj0",
      b2bEnrichment:
        process['env']['BRIGHTDATA_DATASET_B2BENRICHMENT'] || "gd_ld7ll037kqy322v05",

      // High Priority Market Intelligence
      competitorAnalysis:
        process['env']['BRIGHTDATA_DATASET_COMPETITORANALYSIS'] ||
        "gd_lgfcz12mk6og7lvhs",
      newsPress:
        process['env']['BRIGHTDATA_DATASET_NEWSPRESS'] || "gd_lnsxoxzi1omrwnka5r",
      marketResearch:
        process['env']['BRIGHTDATA_DATASET_MARKETRESEARCH'] || "gd_lgfcz12mk6og7lvhs",
      techStack:
        process['env']['BRIGHTDATA_DATASET_TECHSTACK'] || "gd_l88xvdka1uao86xvlb",
      builtwithData:
        process['env']['BRIGHTDATA_DATASET_BUILTWITHDATA'] || "gd_ld73zt91j10sphddj",
      g2Reviews:
        process['env']['BRIGHTDATA_DATASET_G2REVIEWS'] || "gd_l88xvdka1uao86xvlb",

      // Medium Priority Intelligence
      financialData:
        process['env']['BRIGHTDATA_DATASET_FINANCIALDATA'] || "gd_lmrpz3vxmz972ghd7",
      fundingData:
        process['env']['BRIGHTDATA_DATASET_FUNDINGDATA'] || "gd_l1vijqt9jfj7olije",
      socialMedia:
        process['env']['BRIGHTDATA_DATASET_SOCIALMEDIA'] || "gd_lk5ns7kz21pck8jpis",
      jobPostings:
        process['env']['BRIGHTDATA_DATASET_JOBPOSTINGS'] || "gd_l4dx9j9sscpvs7no2",

      // Enhancement Intelligence
      esgData:
        process['env']['BRIGHTDATA_DATASET_ESGDATA'] || "gd_l3lh4ev31oqrvvblv6",
    },
  },

  // Phone Enrichment APIs
  phoneEnrichment: {
    apollo: {
      apiKey: process['env']['APOLLO_API_KEY'],
      enabled: !!process['env']['APOLLO_API_KEY'],
    },
    zoominfo: {
      apiKey: process['env']['ZOOMINFO_API_KEY'],
      enabled: !!process['env']['ZOOMINFO_API_KEY'],
    },
    clearbit: {
      apiKey: process['env']['CLEARBIT_API_KEY'],
      enabled: !!process['env']['CLEARBIT_API_KEY'],
    },
    hunter: {
      apiKey: process['env']['HUNTER_API_KEY'],
      enabled: !!process['env']['HUNTER_API_KEY'],
    },
  },

  // Pipeline Configuration
  pipeline: {
    enabledSteps: {
      core: true,
      enrichment: true,
      intelligence: true,
      phoneEnrichment: true,
      social: true,
      financial: true,
      legal: false,
      advanced: false,
    },

    // Performance & Cost Optimization
    optimization: {
      enableCaching: true,
      cacheTTL: 86400000, // 24 hours
      maxConcurrentRequests: 10,
      costThreshold: 5.0,
      qualityThreshold: 70,
    },

    // Monitoring & Alerting
    monitoring: {
      enableMetrics: true,
      alertOnFailures: true,
      performanceTracking: true,
      costTracking: true,
    },
  },
};
