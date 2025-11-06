import { prisma } from '@/lib/prisma';
import { Nango } from '@nangohq/node';

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
    console.log(`📧 [EMAIL SYNC] Starting email sync for workspace: ${workspaceId}, user: ${userId}`);
    
    const connections = await prisma.grand_central_connections.findMany({
      where: {
        workspaceId,
        provider: { in: ['outlook', 'gmail'] },
        status: 'active'
      }
    });
    
    console.log(`📧 [EMAIL SYNC] Found ${connections.length} active connection(s) for workspace ${workspaceId}`);
    
    if (connections.length === 0) {
      console.log(`📧 [EMAIL SYNC] No active email connections found for workspace: ${workspaceId}`);
      return [];
    }
    
    // Log connection details
    connections.forEach(conn => {
      console.log(`📧 [EMAIL SYNC] Connection: ${conn.provider}, ID: ${conn.nangoConnectionId}, ConfigKey: ${conn.providerConfigKey}`);
    });
    
    const results = [];
    
    for (const connection of connections) {
      try {
        console.log(`📧 [EMAIL SYNC] Syncing emails from ${connection.provider} (connection: ${connection.nangoConnectionId})...`);
        
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
        
        console.log(`✅ [EMAIL SYNC] ${connection.provider} sync completed: ${result.count} emails processed`);
      } catch (error) {
        console.error(`❌ [EMAIL SYNC] Failed to sync ${connection.provider}:`, error);
        console.error(`❌ [EMAIL SYNC] Error details:`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          connectionId: connection.nangoConnectionId,
          provider: connection.provider
        });
        results.push({ 
          provider: connection.provider, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
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
    nangoConnectionId: string
  ): Promise<{ success: boolean; count: number; error?: string }> {
    const operation = provider === 'outlook' 
      ? 'outlook_read_emails' 
      : 'gmail_read_emails';
    
    // Get last sync time to only fetch new emails
    // Use a more lenient approach: fetch last 24 hours OR since last sync, whichever is more recent
    const lastSync = await this.getLastSyncTime(workspaceId, provider);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filterDate = lastSync > oneDayAgo ? lastSync : oneDayAgo;
    
    // Format date for Microsoft Graph API (ISO 8601 format)
    const filterDateISO = filterDate.toISOString();
    
    console.log(`📧 [EMAIL SYNC] Fetching emails since: ${filterDateISO} (last sync: ${lastSync.toISOString()})`);
    
    const params = provider === 'outlook' 
      ? { 
          top: 100, 
          filter: `receivedDateTime ge ${filterDateISO}`,
          orderby: 'receivedDateTime desc',
          folder: 'inbox'
        }
      : {
          maxResults: 100,
          q: `after:${Math.floor(filterDate.getTime() / 1000)}`
        };
    
    // Find the database connection record
    const connection = await prisma.grand_central_connections.findFirst({
      where: {
        workspaceId,
        userId,
        provider,
        nangoConnectionId,
        status: 'active'
      }
    });
    
    if (!connection) {
      throw new Error(`Active ${provider} connection not found for workspace ${workspaceId}`);
    }
    
    // Initialize Nango client
    const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
    if (!secretKey) {
      throw new Error('NANGO_SECRET_KEY or NANGO_SECRET_KEY_DEV environment variable is not set');
    }
    
    const nango = new Nango({
      secretKey,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });
    
    // Build endpoint with query parameters for Outlook
    let endpoint = provider === 'outlook' 
      ? '/v1.0/me/mailFolders/inbox/messages'
      : '/gmail/v1/users/me/messages';
    
    // Add query parameters for Outlook
    // Microsoft Graph API requires URL-encoded OData query parameters
    if (provider === 'outlook') {
      const queryParams = new URLSearchParams();
      if (params.top) queryParams.append('$top', params.top.toString());
      if (params.filter) {
        // URL encode the filter parameter properly
        queryParams.append('$filter', params.filter);
      }
      if (params.orderby) queryParams.append('$orderby', params.orderby);
      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`;
      }
      console.log(`📧 [EMAIL SYNC] Outlook endpoint with params: ${endpoint}`);
    } else {
      // Gmail query parameters
      const queryParams = new URLSearchParams();
      if (params.maxResults) queryParams.append('maxResults', params.maxResults.toString());
      if (params.q) queryParams.append('q', params.q);
      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`;
      }
    }
    
    // Call Nango proxy directly
    console.log(`📧 [EMAIL SYNC] Calling Nango proxy:`, {
      providerConfigKey: connection.providerConfigKey,
      connectionId: connection.nangoConnectionId,
      endpoint,
      method: 'GET'
    });
    
    const result = await retryWithBackoff(
      async () => {
        try {
          const response = await nango.proxy({
            providerConfigKey: connection.providerConfigKey,
            connectionId: connection.nangoConnectionId,
            endpoint,
            method: 'GET'
          });
          
          const responseData = response.data || response;
          console.log(`📧 [EMAIL SYNC] Nango response received, data keys:`, Object.keys(responseData));
          console.log(`📧 [EMAIL SYNC] Response has 'value' key:`, 'value' in responseData);
          console.log(`📧 [EMAIL SYNC] Response has 'messages' key:`, 'messages' in responseData);
          
          // Log email count for debugging
          const emailArray = responseData.value || responseData.messages || [];
          console.log(`📧 [EMAIL SYNC] Found ${Array.isArray(emailArray) ? emailArray.length : 0} emails in response`);
          
          return {
            success: true,
            data: responseData
          };
        } catch (nangoError) {
          console.error(`❌ [EMAIL SYNC] Nango proxy error:`, {
            message: nangoError instanceof Error ? nangoError.message : 'Unknown error',
            stack: nangoError instanceof Error ? nangoError.stack : undefined,
            providerConfigKey: connection.providerConfigKey,
            connectionId: connection.nangoConnectionId,
            endpoint
          });
          throw nangoError;
        }
      },
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
   * Reverse linking: Link existing emails to a newly created person
   * Called when a person is created to find and link their existing emails
   */
  static async linkExistingEmailsToPerson(
    personId: string,
    workspaceId: string,
    personEmails: string[]
  ): Promise<{ linked: number; actionsCreated: number }> {
    if (!personEmails || personEmails.length === 0) {
      return { linked: 0, actionsCreated: 0 };
    }

    console.log(`🔗 [EMAIL LINKING] Linking existing emails to person ${personId} with emails:`, personEmails);

    // Normalize email addresses (lowercase, trim)
    const normalizedEmails = personEmails
      .filter(Boolean)
      .map(email => email.toLowerCase().trim());

    if (normalizedEmails.length === 0) {
      return { linked: 0, actionsCreated: 0 };
    }

    // Find unlinked emails matching any of the person's email addresses
    const matchingEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId,
        personId: null,
        OR: [
          { from: { in: normalizedEmails } },
          { to: { hasSome: normalizedEmails } },
          { cc: { hasSome: normalizedEmails } }
        ]
      },
      take: 1000 // Limit to prevent performance issues
    });

    if (matchingEmails.length === 0) {
      console.log(`📧 [EMAIL LINKING] No matching emails found for person ${personId}`);
      return { linked: 0, actionsCreated: 0 };
    }

    // Get person details to get companyId
    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: { companyId: true }
    });

    if (!person) {
      console.warn(`⚠️ [EMAIL LINKING] Person ${personId} not found`);
      return { linked: 0, actionsCreated: 0 };
    }

    // Link all matching emails
    let linked = 0;
    for (const email of matchingEmails) {
      try {
        await prisma.email_messages.update({
          where: { id: email.id },
          data: {
            personId: personId,
            companyId: person.companyId
          }
        });
        linked++;
      } catch (error) {
        console.error(`❌ [EMAIL LINKING] Failed to link email ${email.id}:`, error);
      }
    }

    // Create action records for linked emails
    let actionsCreated = 0;
    const linkedEmailIds = matchingEmails.map(e => e.id);
    
    // Get workspace user for action assignment
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        isActive: true
      }
    });

    if (workspaceUser) {
      for (const email of matchingEmails) {
        try {
          // Check if action already exists
          const existingAction = await prisma.actions.findFirst({
            where: {
              workspaceId,
              personId: personId,
              type: 'EMAIL',
              subject: email.subject,
              completedAt: email.receivedAt
            }
          });

          if (!existingAction) {
            await prisma.actions.create({
              data: {
                workspaceId,
                userId: workspaceUser.userId,
                companyId: person.companyId,
                personId: personId,
                type: 'EMAIL',
                subject: email.subject,
                description: email.body.substring(0, 500),
                status: 'COMPLETED',
                completedAt: email.receivedAt,
                createdAt: email.receivedAt,
                updatedAt: email.receivedAt
              }
            });
            actionsCreated++;
          }
        } catch (error) {
          console.error(`❌ [EMAIL LINKING] Failed to create action for email ${email.id}:`, error);
        }
      }
    }

    console.log(`✅ [EMAIL LINKING] Linked ${linked} emails and created ${actionsCreated} actions for person ${personId}`);
    
    return { linked, actionsCreated };
  }
  
  /**
   * Create action records for emails (unified timeline)
   */
  private static async createEmailActions(workspaceId: string) {
    // Find emails with linked people that might need actions
    const emailsWithPeople = await prisma.email_messages.findMany({
      where: {
        workspaceId,
        personId: { not: null }
      },
      take: 1000 // Process in batches
    });
    
    if (emailsWithPeople.length === 0) {
      return { created: 0 };
    }
    
    // Find the workspace user to assign actions to
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId,
        isActive: true
      }
    });
    
    if (!workspaceUser) {
      console.warn(`⚠️ No active workspace user found for workspace: ${workspaceId}`);
      return { created: 0 };
    }
    
    // Get all existing EMAIL actions for people in this workspace to avoid duplicates
    // Actions are matched by personId, subject, and completedAt
    const personIds = [...new Set(emailsWithPeople.map(e => e.personId!).filter(Boolean))];
    const existingActions = await prisma.actions.findMany({
      where: {
        workspaceId,
        personId: { in: personIds },
        type: 'EMAIL'
      },
      select: {
        personId: true,
        subject: true,
        completedAt: true
      }
    });
    
    // Create a Set of action keys for fast lookup
    const actionKeys = new Set(
      existingActions.map(a => `${a.personId}|${a.subject}|${a.completedAt?.getTime()}`)
    );
    
    let created = 0;
    
    for (const email of emailsWithPeople) {
      if (!email.personId) continue;
      
      // Check if action already exists
      const actionKey = `${email.personId}|${email.subject}|${email.receivedAt.getTime()}`;
      if (actionKeys.has(actionKey)) {
        continue; // Action already exists
      }
      
      try {
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
        
        // Add to set to avoid duplicates in this batch
        actionKeys.add(actionKey);
      } catch (error) {
        console.error(`❌ Failed to create action for email ${email.id}:`, error);
      }
    }
    
    return { created };
  }
  
  /**
   * Get last sync time for a provider
   * Returns the most recent email's receivedAt time, or 7 days ago if no emails exist
   */
  private static async getLastSyncTime(workspaceId: string, provider: string): Promise<Date> {
    const lastEmail = await prisma.email_messages.findFirst({
      where: {
        workspaceId,
        provider
      },
      orderBy: { receivedAt: 'desc' },
      select: { receivedAt: true }
    });
    
    if (lastEmail?.receivedAt) {
      // Subtract 5 minutes to account for any timing discrepancies
      const lastSyncTime = new Date(lastEmail.receivedAt.getTime() - 5 * 60 * 1000);
      console.log(`📧 [EMAIL SYNC] Last email received at: ${lastEmail.receivedAt.toISOString()}, using filter: ${lastSyncTime.toISOString()}`);
      return lastSyncTime;
    }
    
    // Default to 7 days ago if no previous sync
    const defaultDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    console.log(`📧 [EMAIL SYNC] No previous emails found, using default date: ${defaultDate.toISOString()}`);
    return defaultDate;
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
    const [total, linked] = await Promise.all([
      prisma.email_messages.count({ where: { workspaceId } }),
      prisma.email_messages.count({ where: { workspaceId, personId: { not: null } } })
    ]);
    
    // Count emails that have corresponding actions
    // Actions are matched by personId, subject, and completedAt
    const emailsWithPeople = await prisma.email_messages.findMany({
      where: {
        workspaceId,
        personId: { not: null }
      },
      select: {
        personId: true,
        subject: true,
        receivedAt: true
      },
      take: 10000 // Reasonable limit for stats
    });
    
    if (emailsWithPeople.length === 0) {
      return {
        total,
        linked,
        withActions: 0,
        linkRate: total > 0 ? Math.round((linked / total) * 100) : 0,
        actionRate: 0
      };
    }
    
    // Get all EMAIL actions for people in this workspace
    const personIds = [...new Set(emailsWithPeople.map(e => e.personId!).filter(Boolean))];
    const actionMatches = await prisma.actions.findMany({
      where: {
        workspaceId,
        type: 'EMAIL',
        personId: { in: personIds }
      },
      select: {
        personId: true,
        subject: true,
        completedAt: true
      }
    });
    
    const actionKeys = new Set(
      actionMatches.map(a => `${a.personId}|${a.subject}|${a.completedAt?.getTime()}`)
    );
    
    const withActions = emailsWithPeople.filter(email => 
      actionKeys.has(`${email.personId}|${email.subject}|${email.receivedAt.getTime()}`)
    ).length;
    
    return {
      total,
      linked,
      withActions,
      linkRate: total > 0 ? Math.round((linked / total) * 100) : 0,
      actionRate: total > 0 ? Math.round((withActions / total) * 100) : 0
    };
  }
}
