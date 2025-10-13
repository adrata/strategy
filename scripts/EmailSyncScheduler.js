const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Email Sync Scheduler
 * 
 * Simplified scheduler that works with Nango connections.
 * Replaces the legacy EmailSyncScheduler with a cleaner approach.
 */
class EmailSyncScheduler {
  /**
   * Run scheduled sync for all active email connections
   * This should be called by your job scheduler (e.g., cron job)
   */
  static async scheduleSync() {
    console.log('📧 Starting scheduled email sync...');
    
    try {
      // Get all active email connections grouped by workspace
      const activeConnections = await prisma.grand_central_connections.findMany({
        where: {
          provider: { in: ['outlook', 'gmail'] },
          status: 'active'
        },
        select: {
          workspaceId: true,
          userId: true,
          provider: true,
          nangoConnectionId: true
        },
        distinct: ['workspaceId', 'userId']
      });
      
      if (activeConnections.length === 0) {
        console.log('📧 No active email connections found');
        return { success: true, message: 'No active connections' };
      }
      
      console.log(`📧 Found ${activeConnections.length} active email connections`);
      
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      
      // Process each workspace/user combination
      for (const connection of activeConnections) {
        try {
          console.log(`📧 Syncing emails for workspace: ${connection.workspaceId}`);
          
          const result = await this.syncWorkspaceEmails(
            connection.workspaceId,
            connection.userId
          );
          
          results.push({
            workspaceId: connection.workspaceId,
            userId: connection.userId,
            success: true,
            results: result
          });
          
          successCount++;
          console.log(`✅ Workspace ${connection.workspaceId} sync completed`);
          
        } catch (error) {
          console.error(`❌ Failed to sync workspace ${connection.workspaceId}:`, error);
          
          results.push({
            workspaceId: connection.workspaceId,
            userId: connection.userId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          errorCount++;
        }
      }
      
      console.log(`📧 Scheduled sync completed: ${successCount} successful, ${errorCount} errors`);
      
      return {
        success: true,
        summary: {
          total: activeConnections.length,
          successful: successCount,
          errors: errorCount
        },
        results
      };
      
    } catch (error) {
      console.error('❌ Scheduled email sync failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Sync emails for a specific workspace
   */
  static async syncWorkspace(workspaceId) {
    console.log(`📧 Manual sync requested for workspace: ${workspaceId}`);
    
    try {
      // Find active email connections for this workspace
      const connections = await prisma.grand_central_connections.findMany({
        where: {
          workspaceId,
          provider: { in: ['outlook', 'gmail'] },
          status: 'active'
        },
        select: {
          userId: true,
          provider: true
        },
        distinct: ['userId']
      });
      
      if (connections.length === 0) {
        return {
          success: false,
          error: 'No active email connections found for this workspace'
        };
      }
      
      const results = [];
      
      for (const connection of connections) {
        const result = await this.syncWorkspaceEmails(
          workspaceId,
          connection.userId
        );
        
        results.push({
          userId: connection.userId,
          result
        });
      }
      
      return {
        success: true,
        results
      };
      
    } catch (error) {
      console.error(`❌ Manual sync failed for workspace ${workspaceId}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get sync statistics
   */
  static async getSyncStats() {
    try {
      const [totalConnections, activeConnections, recentSyncs] = await Promise.all([
        prisma.grand_central_connections.count({
          where: {
            provider: { in: ['outlook', 'gmail'] }
          }
        }),
        prisma.grand_central_connections.count({
          where: {
            provider: { in: ['outlook', 'gmail'] },
            status: 'active'
          }
        }),
        prisma.email_messages.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ]);
      
      return {
        totalConnections,
        activeConnections,
        recentSyncs,
        inactiveConnections: totalConnections - activeConnections
      };
      
    } catch (error) {
      console.error('❌ Failed to get sync stats:', error);
      
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Simple email sync for workspace (placeholder implementation)
   * In a real implementation, this would use Nango to fetch emails
   */
  static async syncWorkspaceEmails(workspaceId, userId) {
    console.log(`📧 Syncing emails for workspace ${workspaceId}, user ${userId}`);
    
    // This is a placeholder - in reality you would:
    // 1. Get Nango connections for this workspace/user
    // 2. Fetch emails from each provider
    // 3. Store them in email_messages table
    // 4. Link them to people/companies
    // 5. Create action records
    
    // For now, just return a mock result
    return {
      success: true,
      count: 0,
      message: 'Email sync completed (placeholder implementation)'
    };
  }
}

module.exports = { EmailSyncScheduler };
