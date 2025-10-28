#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * Validates that all required environment variables are set for Grand Central
 * email integration to work properly in production.
 */

const requiredEnvVars = {
  // Nango Configuration
  nango: [
    'NANGO_SECRET_KEY',
    'NANGO_PUBLIC_KEY',
    'NANGO_HOST',
    'NANGO_WEBHOOK_SECRET'
  ],
  
  // Microsoft OAuth
  microsoft: [
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET'
  ],
  
  // Google OAuth
  google: [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ],
  
  // Application URLs
  app: [
    'NEXT_PUBLIC_APP_URL',
    'OAUTH_REDIRECT_BASE_URL'
  ],
  
  // Database
  database: [
    'DATABASE_URL'
  ],
  
  // Authentication
  auth: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
};

const optionalEnvVars = {
  // Email Sync Configuration
  emailSync: [
    'EMAIL_SYNC_ENABLED',
    'EMAIL_SYNC_INTERVAL_MINUTES',
    'EMAIL_SYNC_BATCH_SIZE',
    'EMAIL_SYNC_MAX_RETRIES'
  ],
  
  // Monitoring
  monitoring: [
    'ENABLE_EMAIL_SYNC_MONITORING',
    'EMAIL_SYNC_ALERT_EMAIL'
  ]
};

function validateEnvironment() {
  console.log('🔍 Validating Grand Central Email Integration Environment...\n');
  
  let allValid = true;
  const missing = [];
  const present = [];
  
  // Check required environment variables
  for (const [category, vars] of Object.entries(requiredEnvVars)) {
    console.log(`📋 Checking ${category} variables:`);
    
    for (const varName of vars) {
      const value = process.env[varName];
      if (!value) {
        console.log(`  ❌ ${varName} - MISSING`);
        missing.push(varName);
        allValid = false;
      } else {
        console.log(`  ✅ ${varName} - Set (${value.substring(0, 8)}...)`);
        present.push(varName);
      }
    }
    console.log();
  }
  
  // Check optional environment variables
  console.log('📋 Checking optional variables:');
  for (const [category, vars] of Object.entries(optionalEnvVars)) {
    console.log(`  ${category}:`);
    for (const varName of vars) {
      const value = process.env[varName];
      if (value) {
        console.log(`    ✅ ${varName} - Set`);
      } else {
        console.log(`    ⚪ ${varName} - Not set (optional)`);
      }
    }
  }
  console.log();
  
  // Summary
  console.log('📊 Validation Summary:');
  console.log(`  ✅ Present: ${present.length} variables`);
  console.log(`  ❌ Missing: ${missing.length} variables`);
  console.log(`  📈 Total required: ${Object.values(requiredEnvVars).flat().length} variables`);
  console.log();
  
  if (allValid) {
    console.log('🎉 All required environment variables are present!');
    console.log('✅ Grand Central email integration is ready for production.');
  } else {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    console.log();
    console.log('🔧 Please set the missing variables in your Vercel environment:');
    console.log('   vercel env add <VARIABLE_NAME>');
    console.log();
    console.log('📖 See the production audit plan for detailed setup instructions.');
  }
  
  // Additional checks
  console.log('\n🔍 Additional Checks:');
  
  // Check if Nango host is accessible
  const nangoHost = process.env.NANGO_HOST || 'https://api.nango.dev';
  console.log(`  📡 Nango Host: ${nangoHost}`);
  
  // Check OAuth redirect URLs
  const baseUrl = process.env.OAUTH_REDIRECT_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://action.adrata.com';
  console.log(`  🔗 OAuth Base URL: ${baseUrl}`);
  console.log(`  📧 Microsoft Redirect: ${baseUrl}/outlook/auth_callback/`);
  console.log(`  📧 Google Redirect: ${baseUrl}/api/auth/oauth/callback`);
  console.log(`  📧 Webhook URL: ${baseUrl}/api/webhooks/nango/email`);
  
  // Check database URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    if (dbUrl.startsWith('postgresql://')) {
      console.log('  🗄️ Database: PostgreSQL (✅)');
    } else {
      console.log('  🗄️ Database: Unknown format (⚠️)');
    }
  }
  
  console.log();
  
  if (allValid) {
    console.log('🚀 Next Steps:');
    console.log('  1. Configure Nango integrations in dashboard');
    console.log('  2. Set up Azure AD and Google Cloud Console');
    console.log('  3. Configure webhook URL in Nango');
    console.log('  4. Test OAuth flows in staging');
    console.log('  5. Deploy to production');
  }
  
  return allValid;
}

// Run validation
const isValid = validateEnvironment();
process.exit(isValid ? 0 : 1);
