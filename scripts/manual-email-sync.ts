#!/usr/bin/env tsx

/**
 * Manually trigger email sync for all active connections
 * Use this to catch up if cron isn't running
 */

import 'dotenv/config';
import { UnifiedEmailSyncService } from '../src/platform/services/UnifiedEmailSyncService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🔄 Manual Email Sync Trigger\n');
  
  // Get all active email connections
  const activeConnections = await prisma.grand_central_connections.findMany({
    where: {
      provider: { in: ['outlook', 'gmail'] },
      status: 'active'
    },
    select: {
      workspaceId: true,
      userId: true,
      provider: true,
      nangoConnectionId: true,
      lastSyncAt: true
    },
    distinct: ['workspaceId', 'userId']
  });
  
  if (activeConnections.length === 0) {
    console.log('❌ No active email connections found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📧 Found ${activeConnections.length} active email connection(s)\n`);
  
  const results = [];
  let totalEmailsProcessed = 0;
  
  for (const connection of activeConnections) {
    try {
      console.log(`📧 Syncing emails for workspace ${connection.workspaceId}, user ${connection.userId}...`);
      console.log(`   Provider: ${connection.provider}`);
      console.log(`   Last Sync: ${connection.lastSyncAt || 'Never'}\n`);
      
      const syncResult = await UnifiedEmailSyncService.syncWorkspaceEmails(
        connection.workspaceId,
        connection.userId
      );
      
      const emailCount = Array.isArray(syncResult) 
        ? syncResult.reduce((sum, r) => sum + (r.count || 0), 0)
        : 0;
      
      totalEmailsProcessed += emailCount;
      
      results.push({
        workspaceId: connection.workspaceId,
        userId: connection.userId,
        provider: connection.provider,
        success: true,
        emailsProcessed: emailCount
      });
      
      console.log(`✅ Synced ${emailCount} email(s) for workspace ${connection.workspaceId}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to sync emails for workspace ${connection.workspaceId}:`, error.message);
      console.error(`   Stack: ${error.stack}\n`);
      
      results.push({
        workspaceId: connection.workspaceId,
        userId: connection.userId,
        provider: connection.provider,
        success: false,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log('📊 Sync Summary:');
  console.log(`   Total Connections: ${activeConnections.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failureCount}`);
  console.log(`   Total Emails Processed: ${totalEmailsProcessed}\n`);
  
  if (failureCount > 0) {
    console.log('❌ Some syncs failed. Check errors above.');
  } else {
    console.log('✅ All syncs completed successfully!');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);

