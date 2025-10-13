#!/usr/bin/env node

/**
 * Email Sync Cron Job Setup
 * 
 * This script sets up the scheduled email sync using the new EmailSyncScheduler.
 * It can be run as a cron job or as a standalone service.
 */

const { EmailSyncScheduler } = require('./EmailSyncScheduler');

async function runEmailSync() {
  console.log('📧 Starting scheduled email sync...');
  console.log(`⏰ Time: ${new Date().toISOString()}\n`);
  
  try {
    const result = await EmailSyncScheduler.scheduleSync();
    
    if (result.success) {
      console.log('✅ Email sync completed successfully!');
      console.log(`📊 Summary: ${result.summary?.successful || 0} successful, ${result.summary?.errors || 0} errors`);
      
      if (result.results && result.results.length > 0) {
        console.log('\n📋 Detailed Results:');
        result.results.forEach((workspaceResult, index) => {
          if (workspaceResult.success) {
            console.log(`   ${index + 1}. Workspace ${workspaceResult.workspaceId}: ✅ Success`);
            if (workspaceResult.results) {
              workspaceResult.results.forEach(providerResult => {
                console.log(`      - ${providerResult.provider}: ${providerResult.count} emails processed`);
              });
            }
          } else {
            console.log(`   ${index + 1}. Workspace ${workspaceResult.workspaceId}: ❌ ${workspaceResult.error}`);
          }
        });
      }
    } else {
      console.log('❌ Email sync failed:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Email sync error:', error);
    process.exit(1);
  }
}

// Run the sync
runEmailSync();
