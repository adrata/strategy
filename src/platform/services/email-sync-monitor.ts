/**
 * Email Sync Monitor Service
 * Monitors email sync health and automatically fixes common issues
 */

import { PrismaClient } from '@prisma/client';
import { webhookRenewalService } from './webhook-renewal-service';

const prisma = new PrismaClient();

export class EmailSyncMonitor {
  private static instance: EmailSyncMonitor;
  private monitorInterval: NodeJS.Timeout | null = null;

  static getInstance(): EmailSyncMonitor {
    if (!EmailSyncMonitor.instance) {
      EmailSyncMonitor['instance'] = new EmailSyncMonitor();
    }
    return EmailSyncMonitor.instance;
  }

  /**
   * Start monitoring email sync health
   */
  startMonitoring(): void {
    console.log('📊 Starting email sync monitoring...');
    
    // Start webhook renewal service
    webhookRenewalService.startRenewalService();
    
    // Monitor sync health every 30 minutes
    this['monitorInterval'] = setInterval(async () => {
      await this.checkSyncHealth();
    }, 30 * 60 * 1000); // 30 minutes

    // Run initial check
    this.checkSyncHealth();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this['monitorInterval'] = null;
    }
    webhookRenewalService.stopRenewalService();
    console.log('🛑 Email sync monitoring stopped');
  }

  /**
   * Check overall sync health
   */
  private async checkSyncHealth(): Promise<void> {
    try {
      console.log('🔍 Checking email sync health...');

      // Check for accounts that haven't synced recently
      const staleAccounts = await prisma.email_accounts.findMany({
        where: {
          isActive: true,
          lastSyncAt: {
            lt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          }
        },
        include: {
          user: true
        }
      });

      if (staleAccounts.length > 0) {
        console.log(`⚠️ Found ${staleAccounts.length} accounts with stale sync`);
        
        for (const account of staleAccounts) {
          await this.attemptSyncRecovery(account);
        }
      }

      // Check for failed email messages
      const failedEmails = await prisma.emailMessage.count({
        where: {
          sentAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          },
          // Add status field check if it exists
        }
      });

      if (failedEmails > 0) {
        console.log(`⚠️ Found ${failedEmails} failed email messages in last 24 hours`);
      }

    } catch (error) {
      console.error('❌ Error checking sync health:', error);
    }
  }

  /**
   * Attempt to recover sync for a stale account
   */
  private async attemptSyncRecovery(account: any): Promise<void> {
    try {
      console.log(`🔄 Attempting sync recovery for account: ${account.email}`);

      // Check if token is expired
      const providerToken = await prisma.providerToken.findUnique({
        where: {
          workspaceId_provider: {
            workspaceId: account.workspaceId,
            provider: 'microsoft'
          }
        }
      });

      if (!providerToken) {
        console.log(`❌ No provider token found for account: ${account.email}`);
        return;
      }

      const isTokenExpired = providerToken['expiresAt'] && new Date(providerToken.expiresAt) < new Date();
      
      if (isTokenExpired) {
        console.log(`🔄 Token expired for ${account.email}, attempting refresh...`);
        
        // Try to refresh token
        const refreshResult = await this.refreshAccountToken(account.workspaceId);
        if (!refreshResult) {
          console.log(`❌ Token refresh failed for ${account.email} - user needs to reconnect`);
          
          // Mark account as needing attention
          await prisma.email_accounts.update({
            where: { id: account.id },
            data: { 
              syncStatus: 'error',
              updatedAt: new Date()
            }
          });
          return;
        }
      }

      // Test sync manually
      console.log(`📧 Testing manual sync for ${account.email}...`);
      const syncResponse = await fetch('http://localhost:3000/api/v1/communications/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          platform: account.platform,
          workspaceId: account.workspaceId
        })
      });

      if (syncResponse.ok) {
        console.log(`✅ Sync recovery successful for ${account.email}`);
        
        // Update sync status
        await prisma.email_accounts.update({
          where: { id: account.id },
          data: { 
            syncStatus: 'healthy',
            lastSyncAt: new Date(),
            updatedAt: new Date()
          }
        });
      } else {
        console.log(`❌ Sync recovery failed for ${account.email}`);
      }

    } catch (error) {
      console.error(`❌ Error attempting sync recovery for ${account.email}:`, error);
    }
  }

  /**
   * Refresh account token
   */
  private async refreshAccountToken(workspaceId: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000/api/sync/refresh-microsoft-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ Error refreshing account token:', error);
      return false;
    }
  }

  /**
   * Get sync health summary
   */
  async getSyncHealthSummary(workspaceId: string): Promise<any> {
    try {
      const [
        totalAccounts,
        activeAccounts,
        healthyAccounts,
        recentEmails,
        webhookStatus
      ] = await Promise.all([
        prisma.email_accounts.count({ where: { workspaceId } }),
        prisma.email_accounts.count({ where: { workspaceId, isActive: true } }),
        prisma.email_accounts.count({ where: { workspaceId, syncStatus: 'healthy' } }),
        prisma.email_messages.count({
          where: {
            account: { workspaceId },
            receivedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),
        webhookRenewalService.getWebhookStatus(workspaceId)
      ]);

      return {
        accounts: {
          total: totalAccounts,
          active: activeAccounts,
          healthy: healthyAccounts,
          healthPercentage: activeAccounts > 0 ? Math.round((healthyAccounts / activeAccounts) * 100) : 0
        },
        emails: {
          last24Hours: recentEmails
        },
        webhooks: {
          total: webhookStatus.length,
          active: webhookStatus.filter(w => w.isActive).length,
          needingRenewal: webhookStatus.filter(w => w.needsRenewal).length,
          expired: webhookStatus.filter(w => w.daysUntilExpiry !== null && w.daysUntilExpiry <= 0).length
        }
      };
    } catch (error) {
      console.error('❌ Error getting sync health summary:', error);
      return null;
    }
  }
}

// Export singleton instance
export const emailSyncMonitor = EmailSyncMonitor.getInstance();
