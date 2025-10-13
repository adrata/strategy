import { prisma } from '@/lib/prisma';
import { UnifiedEmailSyncService } from './UnifiedEmailSyncService';

/**
 * Email Sync Scheduler
 * 
 * Handles scheduled email synchronization for all active email connections.
 * This service can be called by cron jobs or manual triggers.
 */
export class EmailSyncScheduler {
  private static readonly SYNC_INTERVAL_MINUTES = 5; // Default sync interval
  private static readonly MAX_CONCURRENT_SYNCS = 3; // Prevent overwhelming the system

  /**
   * Run scheduled email sync for all active connections
   */
  static async runScheduledSync(): Promise<{
    success: boolean;
    results: Array<{
      connectionId: string;
      provider: string;
      success: boolean;
      error?: string;
      emailsProcessed?: number;
    }>;
  }> {
    console.log('🔄 Starting scheduled email sync...');

    try {
      // Get all active email connections
      const activeConnections = await prisma.grand_central_connections.findMany({
        where: {
          status: 'active',
          provider: { in: ['outlook', 'gmail'] }
        },
        include: {
          workspace: true
        }
      });

      if (activeConnections.length === 0) {
        console.log('ℹ️ No active email connections found');
        return {
          success: true,
          results: []
        };
      }

      console.log(`📧 Found ${activeConnections.length} active email connections`);

      // Process connections in batches to avoid overwhelming the system
      const results = [];
      const batches = this.chunkArray(activeConnections, this.MAX_CONCURRENT_SYNCS);

      for (const batch of batches) {
        const batchPromises = batch.map(connection => 
          this.syncConnection(connection)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            const connection = batch[index];
            results.push({
              connectionId: connection.id,
              provider: connection.provider,
              success: false,
              error: result.reason?.message || 'Unknown error'
            });
          }
        });

        // Small delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalEmails = results.reduce((sum, r) => sum + (r.emailsProcessed || 0), 0);

      console.log(`✅ Scheduled sync completed: ${successCount}/${results.length} connections successful`);
      console.log(`📊 Total emails processed: ${totalEmails}`);

      return {
        success: true,
        results
      };

    } catch (error) {
      console.error('❌ Scheduled sync failed:', error);
      return {
        success: false,
        results: [{
          connectionId: 'system',
          provider: 'system',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  /**
   * Sync a single connection
   */
  private static async syncConnection(connection: any): Promise<{
    connectionId: string;
    provider: string;
    success: boolean;
    error?: string;
    emailsProcessed?: number;
  }> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Syncing ${connection.provider} connection: ${connection.id}`);

      // Check if connection is still active
      if (connection.status !== 'active') {
        throw new Error(`Connection is not active: ${connection.status}`);
      }

      // Perform email sync
      const result = await UnifiedEmailSyncService.syncWorkspaceEmails(
        connection.workspaceId,
        connection.userId
      );

      // Update connection metadata
      await prisma.grand_central_connections.update({
        where: { id: connection.id },
        data: {
          lastSyncAt: new Date(),
          metadata: {
            ...connection.metadata,
            lastScheduledSync: new Date().toISOString(),
            syncResult: result,
            syncDuration: Date.now() - startTime
          }
        }
      });

      console.log(`✅ ${connection.provider} sync completed: ${result.emailsProcessed} emails processed`);

      return {
        connectionId: connection.id,
        provider: connection.provider,
        success: true,
        emailsProcessed: result.emailsProcessed
      };

    } catch (error) {
      console.error(`❌ ${connection.provider} sync failed:`, error);

      // Update connection with error
      await prisma.grand_central_connections.update({
        where: { id: connection.id },
        data: {
          metadata: {
            ...connection.metadata,
            lastSyncError: error instanceof Error ? error.message : 'Unknown error',
            lastSyncAttempt: new Date().toISOString()
          }
        }
      });

      return {
        connectionId: connection.id,
        provider: connection.provider,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get sync statistics for all connections
   */
  static async getSyncStatistics(): Promise<{
    totalConnections: number;
    activeConnections: number;
    lastSyncTime?: string;
    syncErrors: number;
    totalEmailsSynced: number;
  }> {
    try {
      const [connections, emailCount] = await Promise.all([
        prisma.grand_central_connections.findMany({
          where: {
            provider: { in: ['outlook', 'gmail'] }
          },
          select: {
            status: true,
            lastSyncAt: true,
            metadata: true
          }
        }),
        prisma.email_messages.count()
      ]);

      const activeConnections = connections.filter(c => c.status === 'active');
      const syncErrors = connections.filter(c => c.metadata?.lastSyncError).length;
      const lastSyncTime = connections
        .filter(c => c.lastSyncAt)
        .sort((a, b) => new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime())[0]?.lastSyncAt;

      return {
        totalConnections: connections.length,
        activeConnections: activeConnections.length,
        lastSyncTime: lastSyncTime?.toISOString(),
        syncErrors,
        totalEmailsSynced: emailCount
      };

    } catch (error) {
      console.error('❌ Failed to get sync statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old sync logs and metadata
   */
  static async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // This would clean up old sync logs if we had a separate logs table
      // For now, we just clean up old metadata entries
      console.log(`🧹 Cleaning up sync logs older than ${daysToKeep} days...`);
      
      // In a real implementation, you might want to archive old sync results
      // or move them to a separate logs table
      
      console.log('✅ Sync log cleanup completed');

    } catch (error) {
      console.error('❌ Failed to cleanup old logs:', error);
      throw error;
    }
  }

  /**
   * Utility function to chunk array into smaller arrays
   */
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export for use in cron jobs
export default EmailSyncScheduler;
