#!/usr/bin/env node

// Set Neon.tech Optimized Environment Variables in Vercel
// This script only sets the environment variables without deploying

const { execSync } = require('child_process');

console.log('🔧 [VERCEL-ENV] Setting Neon.tech optimized environment variables...');

// Critical Neon-optimized environment variables
const criticalEnvVars = {
  // Optimized database URL with connection pooling
  'DATABASE_URL': 'postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000',
  
  // Regional optimization (matches Neon East US 2)
  'VERCEL_REGION': 'iad1',
  'NEXT_PUBLIC_VERCEL_REGION': 'iad1',
  
  // Performance monitoring
  'ENABLE_DB_PERFORMANCE_MONITORING': 'true',
  'ENABLE_NEON_PERFORMANCE_DASHBOARD': 'true',
  
  // Production settings
  'NODE_ENV': 'production',
  'NEXT_PUBLIC_API_BASE_URL': 'https://app.adrata.com/api',
  'NEXT_PUBLIC_API_URL': 'https://app.adrata.com'
};

async function setEnvironmentVariables() {
  console.log(`📋 [VERCEL-ENV] Setting ${Object.keys(criticalEnvVars).length} critical environment variables...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [key, value] of Object.entries(criticalEnvVars)) {
    try {
      console.log(`⏳ Setting ${key}...`);
      
      // Try to set the environment variable
      try {
        execSync(`echo "${value}" | vercel env add ${key} production`, {
          stdio: 'pipe',
          encoding: 'utf8'
        });
        console.log(`✅ Set ${key}`);
        successCount++;
      } catch (addError) {
        if (addError.message.includes('already exists')) {
          console.log(`⏭️  ${key} already exists, updating...`);
          // Remove and re-add to update
          execSync(`vercel env rm ${key} production --yes`, { stdio: 'pipe' });
          execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: 'pipe' });
          console.log(`✅ Updated ${key}`);
          successCount++;
        } else {
          throw addError;
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to set ${key}:`, error.message.split('\n')[0]);
      errorCount++;
    }
  }
  
  console.log(`\n📊 [VERCEL-ENV] Summary:`);
  console.log(`✅ Successfully set: ${successCount} variables`);
  console.log(`❌ Failed: ${errorCount} variables`);
  
  if (successCount > 0) {
    console.log('\n🚀 [VERCEL-ENV] Critical Neon optimizations applied to Vercel!');
    console.log('🔧 Next steps:');
    console.log('  1. Deploy your application: vercel --prod');
    console.log('  2. Monitor performance: https://app.adrata.com/api/admin/neon-performance');
    console.log('  3. Check Neon dashboard for autoscaling');
  }
  
  return { successCount, errorCount };
}

async function main() {
  try {
    // Check if Vercel CLI is available
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('✅ [VERCEL-ENV] Vercel CLI detected');
    } catch (error) {
      console.error('❌ [VERCEL-ENV] Vercel CLI not found. Please install: npm i -g vercel');
      process.exit(1);
    }
    
    // Check if user is logged in to Vercel
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      console.log('✅ [VERCEL-ENV] Vercel authentication verified');
    } catch (error) {
      console.error('❌ [VERCEL-ENV] Not logged in to Vercel. Please run: vercel login');
      process.exit(1);
    }
    
    const results = await setEnvironmentVariables();
    
    if (results.errorCount === 0) {
      console.log('\n🎯 [VERCEL-ENV] ALL ENVIRONMENT VARIABLES SET SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.log(`\n⚠️  [VERCEL-ENV] Completed with ${results.errorCount} errors`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 [VERCEL-ENV] Fatal error:', error);
    process.exit(1);
  }
}

main();
