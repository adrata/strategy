/**
 * Calendar Sync Scheduler Service
 * Automatically syncs calendar events for all active accounts based on their sync frequency
 */

import { PrismaClient } from '@prisma/client';
import { CalendarSyncService } from './calendar-sync-service';

const prisma = new PrismaClient();

export class CalendarSyncScheduler {
  private static instance: CalendarSyncScheduler
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  static getInstance(): CalendarSyncScheduler {
    if (!CalendarSyncScheduler.instance) {
      CalendarSyncScheduler['instance'] = new CalendarSyncScheduler();
    }
    return CalendarSyncScheduler.instance;
  }

  /**
   * Start the calendar sync scheduler
   */
  startScheduler(): void {
    if (this.isRunning) {
      console.log('📅 Calendar sync scheduler is already running');
      return;
    }

    console.log('🚀 Starting calendar sync scheduler...');
    
    // Run initial sync check
    this.runSyncCheck();
    
    // Set up interval to check every 5 minutes
    this['syncInterval'] = setInterval(() => {
      this.runSyncCheck();
    }, 5 * 60 * 1000); // 5 minutes

    this['isRunning'] = true;
    console.log('✅ Calendar sync scheduler started (checking every 5 minutes)');
  }

  /**
   * Stop the calendar sync scheduler
   */
  stopScheduler(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this['syncInterval'] = null;
    }
    this['isRunning'] = false;
    console.log('⏹️ Calendar sync scheduler stopped');
  }

  /**
   * Check which accounts need calendar syncing and sync them
   */
  private async runSyncCheck(): Promise<void> {
    try {
      console.log('🕐 Running calendar sync check...');
      
      const now = new Date();
      
      // Get all active email accounts that have auto-sync enabled and support calendar
      const allAccounts = await prisma.email_accounts.findMany({
        where: {
          isActive: true,
          autoSync: true,
          syncStatus: {
            in: ['healthy', 'warning']
          },
          platform: {
            in: ['outlook', 'google'] // Only platforms that support calendar
          }
        },
        select: {
          id: true,
          email: true,
          platform: true,
          workspaceId: true,
          userId: true,
          lastSyncAt: true,
          syncFrequency: true
        }
      });

      // Filter accounts that actually need syncing based on their individual sync frequency
      const accountsToSync = allAccounts.filter(account => {
        if (!account.lastSyncAt) {
          return true; // Never synced before
        }
        
        const timeSinceLastSync = now.getTime() - account.lastSyncAt.getTime();
        const syncIntervalMs = account.syncFrequency * 60 * 1000; // Convert minutes to milliseconds
        
        return timeSinceLastSync >= syncIntervalMs;
      });

      console.log(`📅 Found ${accountsToSync.length} accounts that need calendar syncing out of ${allAccounts.length} total accounts`);

      for (const account of accountsToSync) {
        try {
          console.log(`📅 Syncing calendar for ${account.email} (${account.platform})`);
          
          // Use the CalendarSyncService to sync calendar events
          const calendarSyncService = CalendarSyncService.getInstance();
          const result = await calendarSyncService.syncCalendarEvents(
            account.userId,
            account.workspaceId,
            account.platform as 'microsoft' | 'google'
          );
          
          if (result.success) {
            console.log(`✅ Calendar sync completed for ${account.email}: ${result.eventsCreated} created, ${result.eventsUpdated} updated`);
            
            // Update the account's last sync time
            await prisma.email_accounts.update({
              where: { id: account.id },
              data: { lastSyncAt: new Date() }
            });
          } else {
            console.error(`❌ Calendar sync failed for ${account.email}:`, result.errors);
            
            // Update sync status to warning if it fails
            await prisma.email_accounts.update({
              where: { id: account.id },
              data: { 
                syncStatus: 'warning',
                lastSyncAt: new Date() // Still update to avoid immediate retry
              }
            });
          }
          
        } catch (error) {
          console.error(`❌ Error syncing calendar for ${account.email}:`, error);
          
          // Update sync status to error
          await prisma.email_accounts.update({
            where: { id: account.id },
            data: { 
              syncStatus: 'error',
              lastSyncAt: new Date() // Still update to avoid immediate retry
            }
          });
        }
      }

      if (accountsToSync['length'] === 0) {
        console.log('📅 No accounts need calendar syncing at this time');
      }

    } catch (error) {
      console.error('❌ Error in calendar sync check:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextCheck?: Date } {
    return {
      isRunning: this.isRunning,
      nextCheck: this.syncInterval ? new Date(Date.now() + 5 * 60 * 1000) : undefined
    };
  }

  /**
   * Force a sync check (useful for testing or manual triggers)
   */
  async forceSyncCheck(): Promise<void> {
    console.log('🔄 Forcing calendar sync check...');
    await this.runSyncCheck();
  }

  /**
   * Sync calendar for a specific account
   */
  async syncAccount(accountId: string): Promise<boolean> {
    try {
      const account = await prisma.email_accounts.findUnique({
        where: { id: accountId },
        select: {
          id: true,
          email: true,
          platform: true,
          workspaceId: true,
          userId: true
        }
      });

      if (!account) {
        console.error(`❌ Account ${accountId} not found`);
        return false;
      }

      if (!['outlook', 'google'].includes(account.platform)) {
        console.error(`❌ Platform ${account.platform} does not support calendar sync`);
        return false;
      }

      console.log(`📅 Manually syncing calendar for ${account.email} (${account.platform})`);
      
      const calendarSyncService = CalendarSyncService.getInstance();
      const result = await calendarSyncService.syncCalendarEvents(
        account.userId,
        account.workspaceId,
        account.platform as 'microsoft' | 'google'
      );
      
      if (result.success) {
        console.log(`✅ Manual calendar sync completed for ${account.email}: ${result.eventsCreated} created, ${result.eventsUpdated} updated`);
        
        // Update the account's last sync time
        await prisma.email_accounts.update({
          where: { id: account.id },
          data: { lastSyncAt: new Date() }
        });
        
        return true;
      } else {
        console.error(`❌ Manual calendar sync failed for ${account.email}:`, result.errors);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ Error in manual calendar sync for account ${accountId}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const calendarSyncScheduler = CalendarSyncScheduler.getInstance();
