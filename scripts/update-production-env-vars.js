#!/usr/bin/env node

/**
 * 🔧 Update Production Environment Variables
 * 
 * This script updates the production environment variables on Vercel
 * with the correct workspace and user IDs.
 */

const { execSync } = require('child_process');

console.log('🔧 [VERCEL-ENV] Updating production environment variables...');

// Production environment variables that need to be updated
const productionEnvVars = {
  'NEXT_PUBLIC_WORKSPACE_ID': 'adrata',
  'DEFAULT_WORKSPACE_ID': 'adrata', 
  'DEFAULT_USER_ID': 'dan-production-user-2025'
};

async function updateEnvironmentVariables() {
  console.log(`📋 [VERCEL-ENV] Updating ${Object.keys(productionEnvVars).length} environment variables...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [key, value] of Object.entries(productionEnvVars)) {
    try {
      console.log(`⏳ Updating ${key}...`);
      
      // Remove existing variable if it exists
      try {
        execSync(`vercel env rm ${key} production --yes`, { 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        console.log(`🗑️  Removed existing ${key}`);
      } catch (removeError) {
        // Variable might not exist, that's okay
        console.log(`ℹ️  ${key} didn't exist or couldn't be removed`);
      }
      
      // Add the new variable
      execSync(`echo "${value}" | vercel env add ${key} production`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      console.log(`✅ Updated ${key} = ${value}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Failed to update ${key}:`, error.message.split('\n')[0]);
      errorCount++;
    }
  }
  
  console.log(`\n📊 [VERCEL-ENV] Summary:`);
  console.log(`✅ Successfully updated: ${successCount} variables`);
  console.log(`❌ Failed: ${errorCount} variables`);
  
  if (successCount > 0) {
    console.log('\n🚀 Environment variables updated successfully!');
    console.log('🔄 Production deployment will use the new values on next deploy.');
  }
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some variables failed to update. Please check the errors above.');
  }
}

updateEnvironmentVariables().catch(console.error);
