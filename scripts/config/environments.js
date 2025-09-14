#!/usr/bin/env node

/**
 * Centralized Environment Configuration for Adrata Scripts
 *
 * This file contains all environment-specific configurations to eliminate
 * inconsistencies across scripts and improve security by centralizing credentials.
 *
 * Usage:
 *   const { getEnvironment } = require('./scripts/config/environments');
 *   const config = getEnvironment('dev'); // or 'prod'
 */

// Read environment variables with fallbacks
const DEV_DATABASE_URL =
  process.env.DEV_DATABASE_URL ||
  "postgresql://rosssylvester:Themill08!@localhost:5432/magic";
const PROD_DATABASE_URL =
  process.env.PROD_DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

// Apple Configuration
const APPLE_CONFIG = {
  appleId: process.env.APPLE_ID || "ross@adrata.com",
  teamId: process.env.APPLE_TEAM_ID || "V3SXNV75CQ",
  appId: process.env.APPLE_APP_ID || "bbtr-nfpl-okay-vwqv",
  notaryProfile: "adrata-notarize",
};

// Environment Configurations
const ENVIRONMENTS = {
  dev: {
    name: "Development",
    database: {
      url: DEV_DATABASE_URL,
      host: "localhost",
      port: 5432,
      database: "magic",
      ssl: false,
    },
    workspace: {
      id: "c854dff0-27db-4e79-a47b-787b0618a353",
      name: "Adrata Development",
    },
    user: {
      id: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
      email: "dan@adrata.com",
      name: "Dan Mirolli",
    },
    api: {
      baseUrl: "http://localhost:3000",
      port: 3000,
    },
    features: {
      enrichment: true,
      analytics: true,
      debugMode: true,
    },
  },

  prod: {
    name: "Production",
    database: {
      url: PROD_DATABASE_URL,
      host: "ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech",
      database: "neondb",
      ssl: true,
    },
    workspace: {
      id: "adrata",
      name: "adrata",
    },
    user: {
      id: "dan-production-user-2025",
      email: "dan@adrata.com",
      name: "Dan Mirolli",
    },
    api: {
      baseUrl: "https://app.adrata.com",
      port: 443,
    },
    features: {
      enrichment: true,
      analytics: true,
      debugMode: false,
    },
  },

  // Local test environment (in-memory or SQLite)
  test: {
    name: "Test",
    database: {
      url: "file:./test.db",
      provider: "sqlite",
    },
    workspace: {
      id: "test-workspace-id",
      name: "Test Workspace",
    },
    user: {
      id: "test-user-id",
      email: "test@adrata.com",
      name: "Test User",
    },
    api: {
      baseUrl: "http://localhost:3003",
      port: 3003,
    },
    features: {
      enrichment: false,
      analytics: false,
      debugMode: true,
    },
  },
};

/**
 * Get environment configuration by name
 * @param {string} envName - Environment name ('dev', 'prod', 'test')
 * @returns {object} Environment configuration
 */
function getEnvironment(envName) {
  if (!envName) {
    throw new Error("Environment name is required. Use: dev, prod, or test");
  }

  const env = ENVIRONMENTS[envName.toLowerCase()];
  if (!env) {
    throw new Error(
      `Unknown environment: ${envName}. Valid environments: ${Object.keys(ENVIRONMENTS).join(", ")}`,
    );
  }

  return {
    ...env,
    apple: APPLE_CONFIG,
    envName: envName.toLowerCase(),
  };
}

/**
 * Get all available environment names
 * @returns {string[]} Array of environment names
 */
function getEnvironmentNames() {
  return Object.keys(ENVIRONMENTS);
}

/**
 * Validate environment configuration
 * @param {string} envName - Environment name to validate
 * @returns {object} Validation result
 */
function validateEnvironment(envName) {
  try {
    const env = getEnvironment(envName);
    const issues = [];

    // Check required fields
    if (!env.database.url) issues.push("Missing database URL");
    if (!env.workspace.id) issues.push("Missing workspace ID");
    if (!env.user.id) issues.push("Missing user ID");
    if (!env.api.baseUrl) issues.push("Missing API base URL");

    // Check Apple configuration for desktop builds
    if (!env.apple.teamId) issues.push("Missing Apple Team ID");
    if (!env.apple.appleId) issues.push("Missing Apple ID");

    return {
      valid: issues.length === 0,
      issues,
      environment: env,
    };
  } catch (error) {
    return {
      valid: false,
      issues: [error.message],
      environment: null,
    };
  }
}

/**
 * Get environment configuration for Prisma
 * @param {string} envName - Environment name
 * @returns {object} Prisma-compatible configuration
 */
function getPrismaConfig(envName) {
  const env = getEnvironment(envName);
  return {
    datasources: {
      db: {
        url: env.database.url,
      },
    },
  };
}

/**
 * Create environment-specific .env content
 * @param {string} envName - Environment name
 * @returns {string} .env file content
 */
function generateEnvFile(envName) {
  const env = getEnvironment(envName);

  return `# ${env.name} Environment Configuration
# Generated on ${new Date().toISOString()}

# Database Configuration
DATABASE_URL="${env.database.url}"

# Workspace Configuration
WORKSPACE_ID="${env.workspace.id}"
USER_ID="${env.user.id}"

# API Configuration  
NEXT_PUBLIC_API_BASE_URL="${env.api.baseUrl}"

# Apple Configuration (for desktop builds)
APPLE_ID="${env.apple.appleId}"
APPLE_TEAM_ID="${env.apple.teamId}"
APPLE_APP_ID="${env.apple.appId}"

# Feature Flags
NEXT_PUBLIC_ENRICHMENT_ENABLED="${env.features.enrichment}"
NEXT_PUBLIC_ANALYTICS_ENABLED="${env.features.analytics}"
NEXT_PUBLIC_DEBUG_MODE="${env.features.debugMode}"

# Desktop Configuration
NEXT_PUBLIC_IS_DESKTOP="false"
NEXT_PUBLIC_USE_STATIC_EXPORT="false"
`;
}

// CLI Usage
if (require.main === module) {
  const envName = process.argv[2];

  if (!envName) {
    console.log("📋 Available Environments:");
    getEnvironmentNames().forEach((name) => {
      const env = getEnvironment(name);
      console.log(`  • ${name}: ${env.name}`);
    });
    console.log("\nUsage: node scripts/config/environments.js <env-name>");
    process.exit(0);
  }

  if (envName === "--validate-all") {
    console.log("🔍 Validating all environments...\n");
    getEnvironmentNames().forEach((name) => {
      const result = validateEnvironment(name);
      const status = result.valid ? "✅" : "❌";
      console.log(
        `${status} ${name}: ${result.valid ? "Valid" : result.issues.join(", ")}`,
      );
    });
    process.exit(0);
  }

  try {
    const env = getEnvironment(envName);
    const validation = validateEnvironment(envName);

    console.log(`🌍 ${env.name} Environment Configuration:`);
    console.log(
      `   Database: ${env.database.host || "Local"}${env.database.ssl ? " (SSL)" : ""}`,
    );
    console.log(`   Workspace: ${env.workspace.name}`);
    console.log(`   API: ${env.api.baseUrl}`);
    console.log(`   Apple: ${env.apple.appleId} (${env.apple.teamId})`);
    console.log(
      `   Status: ${validation.valid ? "✅ Valid" : "❌ Issues: " + validation.issues.join(", ")}`,
    );

    if (process.argv.includes("--generate-env")) {
      const envContent = generateEnvFile(envName);
      console.log("\n📄 .env file content:");
      console.log(envContent);
    }
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  getEnvironment,
  getEnvironmentNames,
  validateEnvironment,
  getPrismaConfig,
  generateEnvFile,
  ENVIRONMENTS,
};
