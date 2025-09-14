/**
 * Email Sync Scheduler Service
 * Automatically syncs emails for all active accounts based on their sync frequency
 */

import { PrismaClient } from '@prisma/client';
import { EmailPlatformIntegrator } from './email-platform-integrator';

const prisma = new PrismaClient();

export class EmailSyncScheduler {
  private static instance: EmailSyncScheduler;
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  static getInstance(): EmailSyncScheduler {
    if (!EmailSyncScheduler.instance) {
      EmailSyncScheduler['instance'] = new EmailSyncScheduler();
    }
    return EmailSyncScheduler.instance;
  }

  /**
   * Start the email sync scheduler
   */
  startScheduler(): void {
    if (this.isRunning) {
      console.log('📧 Email sync scheduler is already running');
      return;
    }

    console.log('🚀 Starting email sync scheduler...');
    this['isRunning'] = true;
    
    // Run every 2 minutes to check for accounts that need syncing
    this['syncInterval'] = setInterval(async () => {
      await this.runSyncCheck();
    }, 2 * 60 * 1000); // 2 minutes
    
    // Run initial check
    this.runSyncCheck();
  }

  /**
   * Stop the email sync scheduler
   */
  stopScheduler(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this['syncInterval'] = null;
    }
    this['isRunning'] = false;
    console.log('⏹️ Email sync scheduler stopped');
  }

  /**
   * Check which accounts need syncing and sync them
   */
  private async runSyncCheck(): Promise<void> {
    try {
      console.log('🕐 Running email sync check...');
      
      const now = new Date();
      
      // Get all active email accounts that have auto-sync enabled
      const allAccounts = await prisma.email_accounts.findMany({
        where: {
          isActive: true,
          autoSync: true,
          syncStatus: {
            in: ['healthy', 'warning']
          }
        },
        select: {
          id: true,
          email: true,
          platform: true,
          workspaceId: true,
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

      console.log(`📧 Found ${accountsToSync.length} accounts that need syncing out of ${allAccounts.length} total accounts`);

      for (const account of accountsToSync) {
        try {
          console.log(`🔄 Syncing account: ${account.email} (${account.platform})`);
          
          if (account['platform'] === 'outlook') {
            const result = await EmailPlatformIntegrator.syncOutlookEmails(account.id);
            
            if (result.success) {
              console.log(`✅ Synced ${result.count} emails for ${account.email}`);
              
              // Link the synced emails to contacts/leads/accounts
              if (result.count > 0) {
                console.log(`🔗 Linking ${result.count} emails to entities...`);
                await this.linkEmailsToEntities(account.workspaceId);
              }
            } else {
              console.error(`❌ Sync failed for ${account.email}: ${result.error}`);
            }
          } else {
            console.log(`⏭️ Skipping unsupported platform: ${account.platform}`);
          }
          
          // Small delay between accounts to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error syncing account ${account.email}:`, error);
        }
      }
      
      console.log(`✅ Email sync check completed for ${accountsToSync.length} accounts`);
      
    } catch (error) {
      console.error('❌ Error in email sync scheduler:', error);
    }
  }

  /**
   * Link emails to contacts, leads, accounts, and prospects
   */
  private async linkEmailsToEntities(workspaceId: string): Promise<void> {
    try {
      console.log(`🔗 Linking emails to entities for workspace: ${workspaceId}`);
      
      // Get recent unlinked emails (last 24 hours)
      const recentEmails = await prisma.email_messages.findMany({
        where: {
          accountId: {
            in: await this.getAccountIdsForWorkspace(workspaceId)
          },
          receivedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: {
          id: true,
          from: true,
          to: true,
          subject: true,
          receivedAt: true
        },
        take: 100 // Limit to prevent overwhelming
      });
      
      console.log(`📧 Found ${recentEmails.length} recent emails to link`);
      
      let linkedCount = 0;
      
      for (const email of recentEmails) {
        try {
          const associations = await this.findEmailAssociations(email, workspaceId);
          
          if (associations.length > 0) {
            await this.createEmailAssociations(email.id, associations);
            linkedCount++;
          }
        } catch (error) {
          console.error(`❌ Error linking email ${email.id}:`, error);
        }
      }
      
      console.log(`✅ Linked ${linkedCount} emails to entities`);
      
    } catch (error) {
      console.error('❌ Error in linkEmailsToEntities:', error);
    }
  }
  
  /**
   * Get account IDs for a workspace
   */
  private async getAccountIdsForWorkspace(workspaceId: string): Promise<string[]> {
    const accounts = await prisma.email_accounts.findMany({
      where: { workspaceId },
      select: { id: true }
    });
    return accounts.map(a => a.id);
  }
  
  /**
   * Find associations for an email
   */
  private async findEmailAssociations(email: any, workspaceId: string): Promise<any[]> {
    const associations: any[] = [];
    const allEmails = [email.from, ...email.to];
    const emailDomains = allEmails.map(e => e.split('@')[1]).filter(Boolean);
    
    // Find contacts by email
    const contacts = await prisma.contacts.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { email: { in: allEmails } },
          { workEmail: { in: allEmails } },
          { personalEmail: { in: allEmails } },
          { secondaryEmail: { in: allEmails } }
        ]
      },
      select: { id: true, accountId: true }
    });
    
    for (const contact of contacts) {
      associations.push({
        type: 'contact',
        entityId: contact.id,
        confidence: 0.9
      });
      
      if (contact.accountId) {
        associations.push({
          type: 'account',
          entityId: contact.accountId,
          confidence: 0.8
        });
      }
    }
    
    // Find leads by email
    const leads = await prisma.leads.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { email: { in: allEmails } },
          { workEmail: { in: allEmails } },
          { personalEmail: { in: allEmails } },
          { companyDomain: { in: emailDomains } }
        ]
      },
      select: { id: true }
    });
    
    for (const lead of leads) {
      associations.push({
        type: 'lead',
        entityId: lead.id,
        confidence: 0.85
      });
    }
    
    // Find accounts by domain
    const accounts = await prisma.accounts.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { email: { in: allEmails } },
          { website: { contains: emailDomains[0] } }
        ]
      },
      select: { id: true }
    });
    
    for (const account of accounts) {
      associations.push({
        type: 'account',
        entityId: account.id,
        confidence: 0.7
      });
    }
    
    return associations;
  }
  
  /**
   * Create email associations in junction tables
   */
  private async createEmailAssociations(emailId: string, associations: any[]): Promise<void> {
    for (const association of associations) {
      try {
        switch (association.type) {
          case 'contact':
            await prisma.emailToContact.create({
              data: { A: emailId, B: association.entityId }
            });
            break;
          case 'lead':
            await prisma.emailToLead.create({
              data: { A: emailId, B: association.entityId }
            });
            break;
          case 'account':
            await prisma.emailToAccount.create({
              data: { A: emailId, B: association.entityId }
            });
            break;
        }
      } catch (error) {
        // Ignore duplicate key errors
        if (!error.message.includes('Unique constraint')) {
          console.error(`❌ Error creating association:`, error);
        }
      }
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextCheck?: Date } {
    return {
      isRunning: this.isRunning,
      nextCheck: this.isRunning ? new Date(Date.now() + 2 * 60 * 1000) : undefined
    };
  }
}

// Export singleton instance
export const emailSyncScheduler = EmailSyncScheduler.getInstance();
