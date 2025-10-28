import { prisma } from '@/lib/prisma';
import { NangoService } from '@/app/[workspace]/grand-central/services/NangoService';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second base delay
const MAX_RETRY_DELAY_MS = 30000; // 30 seconds max delay

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        console.error(`❌ ${operationName} failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_DELAY_MS * Math.pow(2, attempt - 1),
        MAX_RETRY_DELAY_MS
      );
      
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Unified Email Sync Service
 * 
 * Replaces legacy email services with a clean, Nango-powered approach.
 * Handles email sync, auto-linking to people/companies, and action creation.
 */
export class UnifiedEmailSyncService {
  /**
   * Sync emails from all connected providers for a workspace
   */
  static async syncWorkspaceEmails(workspaceId: string, userId: string) {
    console.log(`📧 Starting email sync for workspace: ${workspaceId}`);
    
    const connections = await prisma.grand_central_connections.findMany({
      where: {
        workspaceId,
        provider: { in: ['outlook', 'gmail'] },
        status: 'active'
      }
    });
    
    if (connections.length === 0) {
      console.log(`📧 No active email connections found for workspace: ${workspaceId}`);
      return [];
    }
    
    const results = [];
    
    for (const connection of connections) {
      try {
        console.log(`📧 Syncing emails from ${connection.provider}...`);
        
        const result = await this.syncProviderEmails(
          connection.provider as 'outlook' | 'gmail',
          workspaceId,
          userId,
          connection.nangoConnectionId
        );
        
        results.push({ 
          provider: connection.provider, 
          connectionId: connection.nangoConnectionId,
          ...result 
        });
        
        console.log(`✅ ${connection.provider} sync completed: ${result.count} emails processed`);
      } catch (error) {
        console.error(`❌ Failed to sync ${connection.provider}:`, error);
        results.push({ 
          provider: connection.provider, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          count: 0 
        });
      }
    }
    
    // Auto-link emails to people and companies
    console.log(`📧 Auto-linking emails to entities...`);
    const linkResult = await this.linkEmailsToEntities(workspaceId);
    console.log(`✅ Auto-linking completed: ${linkResult.linked} emails linked`);
    
    // Create action records for timeline
    console.log(`📧 Creating action records for emails...`);
    const actionResult = await this.createEmailActions(workspaceId);
    console.log(`✅ Action creation completed: ${actionResult.created} actions created`);
    
    return results;
  }
  
  /**
   * Sync emails from a specific provider
   */
  private static async syncProviderEmails(
    provider: 'outlook' | 'gmail',
    workspaceId: string,
    userId: string,
    connectionId: string
  ): Promise<{ success: boolean; count: number; error?: string }> {
    const operation = provider === 'outlook' 
      ? 'outlook_read_emails' 
      : 'gmail_read_emails';
    
    // Get last sync time to only fetch new emails
    const lastSync = await this.getLastSyncTime(workspaceId, provider);
    const filterDate = lastSync.toISOString();
    
    const params = provider === 'outlook' 
      ? { 
          top: 100, 
          filter: `receivedDateTime ge ${filterDate}`,
          orderby: 'receivedDateTime desc'
        }
      : {
          maxResults: 100,
          q: `after:${Math.floor(lastSync.getTime() / 1000)}`
        };
    
    const result = await retryWithBackoff(
      () => NangoService.executeOperation(operation, params, workspaceId, userId),
      `Email fetch from ${provider}`
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch emails from provider');
    }
    
    const emails = result.data?.value || result.data?.messages || [];
    let count = 0;
    
    for (const email of emails) {
      try {
        await this.storeEmailMessage(email, provider, workspaceId);
        count++;
      } catch (error) {
        console.error(`❌ Failed to store email ${email.id}:`, error);
      }
    }
    
    // Update last sync time
    await this.updateLastSyncTime(workspaceId, provider);
    
    return { success: true, count };
  }
  
  /**
   * Store email message in database
   */
  private static async storeEmailMessage(
    email: any, 
    provider: 'outlook' | 'gmail', 
    workspaceId: string
  ) {
    const emailData = this.normalizeEmailData(email, provider);
    
    await prisma.email_messages.upsert({
      where: {
        provider_messageId_workspaceId: {
          provider,
          messageId: emailData.messageId,
          workspaceId
        }
      },
      create: {
        workspaceId,
        provider,
        messageId: emailData.messageId,
        threadId: emailData.threadId,
        subject: emailData.subject,
        body: emailData.body,
        bodyHtml: emailData.bodyHtml,
        from: emailData.from,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        sentAt: emailData.sentAt,
        receivedAt: emailData.receivedAt,
        isRead: emailData.isRead,
        isImportant: emailData.isImportant,
        attachments: emailData.attachments,
        labels: emailData.labels,
      },
      update: {
        isRead: emailData.isRead,
        updatedAt: new Date()
      }
    });
  }
  
  /**
   * Normalize email data from different providers
   */
  private static normalizeEmailData(email: any, provider: 'outlook' | 'gmail') {
    if (provider === 'outlook') {
      return {
        messageId: email.id,
        threadId: email.conversationId,
        subject: email.subject || '(No Subject)',
        body: email.body?.content || email.bodyPreview || '',
        bodyHtml: email.body?.contentType === 'html' ? email.body.content : null,
        from: email.from?.emailAddress?.address || email.from?.emailAddress?.name || 'unknown@example.com',
        to: email.toRecipients?.map((r: any) => r.emailAddress.address) || [],
        cc: email.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
        bcc: email.bccRecipients?.map((r: any) => r.emailAddress.address) || [],
        sentAt: new Date(email.sentDateTime),
        receivedAt: new Date(email.receivedDateTime),
        isRead: email.isRead || false,
        isImportant: email.importance === 'high',
        attachments: email.attachments || [],
        labels: email.categories || []
      };
    } else {
      // Gmail format
      return {
        messageId: email.id,
        threadId: email.threadId,
        subject: email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(No Subject)',
        body: email.snippet || '',
        bodyHtml: null, // Gmail API requires separate call for full body
        from: email.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'unknown@example.com',
        to: email.payload?.headers?.filter((h: any) => h.name === 'To').map((h: any) => h.value) || [],
        cc: email.payload?.headers?.filter((h: any) => h.name === 'Cc').map((h: any) => h.value) || [],
        bcc: email.payload?.headers?.filter((h: any) => h.name === 'Bcc').map((h: any) => h.value) || [],
        sentAt: new Date(parseInt(email.internalDate)),
        receivedAt: new Date(parseInt(email.internalDate)),
        isRead: !email.labelIds?.includes('UNREAD'),
        isImportant: email.labelIds?.includes('IMPORTANT') || false,
        attachments: email.payload?.parts?.filter((p: any) => p.filename) || [],
        labels: email.labelIds || []
      };
    }
  }
  
  /**
   * Auto-link emails to people and companies
   */
  private static async linkEmailsToEntities(workspaceId: string) {
    const unlinkedEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId,
        personId: null,
        companyId: null
      },
      take: 1000 // Process in batches
    });
    
    let linked = 0;
    
    for (const email of unlinkedEmails) {
      // Extract email addresses
      const emailAddresses = [
        email.from,
        ...email.to,
        ...email.cc
      ].filter(Boolean);
      
      // Find matching person
      const person = await prisma.people.findFirst({
        where: {
          workspaceId,
          OR: [
            { email: { in: emailAddresses } },
            { workEmail: { in: emailAddresses } },
            { personalEmail: { in: emailAddresses } }
          ]
        }
      });
      
      if (person) {
        await prisma.email_messages.update({
          where: { id: email.id },
          data: {
            personId: person.id,
            companyId: person.companyId
          }
        });
        linked++;
      }
    }
    
    return { linked };
  }
  
  /**
   * Create action records for emails (unified timeline)
   */
  private static async createEmailActions(workspaceId: string) {
    const emailsWithoutActions = await prisma.email_messages.findMany({
      where: {
        workspaceId,
        personId: { not: null },
        NOT: {
          actions: {
            some: {}
          }
        }
      },
      take: 1000 // Process in batches
    });
    
    let created = 0;
    
    for (const email of emailsWithoutActions) {
      if (email.personId) {
        // Find the workspace user to assign the action to
        const workspaceUser = await prisma.workspace_users.findFirst({
          where: {
            workspaceId,
            isActive: true
          }
        });
        
        if (workspaceUser) {
          await prisma.actions.create({
            data: {
              workspaceId,
              userId: workspaceUser.userId,
              companyId: email.companyId,
              personId: email.personId,
              type: 'EMAIL',
              subject: email.subject,
              description: email.body.substring(0, 500),
              status: 'COMPLETED',
              completedAt: email.receivedAt,
              createdAt: email.receivedAt,
              updatedAt: email.receivedAt
            }
          });
          created++;
        }
      }
    }
    
    return { created };
  }
  
  /**
   * Get last sync time for a provider
   */
  private static async getLastSyncTime(workspaceId: string, provider: string): Promise<Date> {
    const lastEmail = await prisma.email_messages.findFirst({
      where: {
        workspaceId,
        provider
      },
      orderBy: { receivedAt: 'desc' }
    });
    
    // Default to 7 days ago if no previous sync
    return lastEmail?.receivedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }
  
  /**
   * Update last sync time (handled by storing emails)
   */
  private static async updateLastSyncTime(workspaceId: string, provider: string) {
    // This is handled by the email storage itself
    // Could add a separate sync tracking table if needed
  }
  
  /**
   * Get email statistics for a workspace
   */
  static async getEmailStats(workspaceId: string) {
    const [total, linked, withActions] = await Promise.all([
      prisma.email_messages.count({ where: { workspaceId } }),
      prisma.email_messages.count({ where: { workspaceId, personId: { not: null } } }),
      prisma.email_messages.count({
        where: {
          workspaceId,
          actions: { some: {} }
        }
      })
    ]);
    
    return {
      total,
      linked,
      withActions,
      linkRate: total > 0 ? Math.round((linked / total) * 100) : 0,
      actionRate: total > 0 ? Math.round((withActions / total) * 100) : 0
    };
  }
}
