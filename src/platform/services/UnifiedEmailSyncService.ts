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
    console.log(`📧 [EMAIL SYNC] ========================================`);
    console.log(`📧 [EMAIL SYNC] Starting email sync for workspace: ${workspaceId}, user: ${userId}`);
    console.log(`📧 [EMAIL SYNC] ========================================`);
    
    // Verify workspace exists and log current email count
    const currentEmailCount = await prisma.email_messages.count({
      where: { workspaceId }
    });
    console.log(`📧 [EMAIL SYNC] Current email count in database for workspace ${workspaceId}: ${currentEmailCount}`);
    
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
   * Historical email sync - syncs all emails from a specific start date
   * Bypasses the normal 30-day limit for one-time historical imports
   */
  static async syncHistoricalEmails(
    workspaceId: string,
    userId: string,
    nangoConnectionId: string,
    startDate: Date
  ): Promise<{ success: boolean; count: number; error?: string }> {
    console.log(`📧 [HISTORICAL SYNC] ========================================`);
    console.log(`📧 [HISTORICAL SYNC] Starting historical email sync`);
    console.log(`📧 [HISTORICAL SYNC] Workspace: ${workspaceId}`);
    console.log(`📧 [HISTORICAL SYNC] Connection: ${nangoConnectionId}`);
    console.log(`📧 [HISTORICAL SYNC] Start Date: ${startDate.toISOString()}`);
    console.log(`📧 [HISTORICAL SYNC] ========================================`);
    
    // Get connection to determine provider
    const connection = await prisma.grand_central_connections.findUnique({
      where: { nangoConnectionId },
      select: {
        provider: true,
        workspaceId: true,
        userId: true
      }
    });
    
    if (!connection) {
      return {
        success: false,
        count: 0,
        error: `Connection not found: ${nangoConnectionId}`
      };
    }
    
    if (connection.workspaceId !== workspaceId) {
      return {
        success: false,
        count: 0,
        error: 'Workspace mismatch'
      };
    }
    
    const provider = connection.provider as 'outlook' | 'gmail';
    
    // Call the private sync method with historical date override
    return await this.syncProviderEmailsHistorical(
      provider,
      workspaceId,
      userId,
      nangoConnectionId,
      startDate
    );
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
    console.log(`📧 [EMAIL SYNC] ========================================`);
    console.log(`📧 [EMAIL SYNC] Starting custom EMAIL sync for ${provider}`);
    console.log(`📧 [EMAIL SYNC] Connection: ${nangoConnectionId}`);
    console.log(`📧 [EMAIL SYNC] Workspace: ${workspaceId}, User: ${userId}`);
    console.log(`📧 [EMAIL SYNC] NOTE: This is EMAIL sync only. Calendar syncs are handled separately.`);
    console.log(`📧 [EMAIL SYNC] NOTE: If Nango's built-in sync is also enabled, it may cause conflicts. Consider disabling it in Nango dashboard.`);
    console.log(`📧 [EMAIL SYNC] ========================================`);
    const operation = provider === 'outlook' 
      ? 'outlook_read_emails' 
      : 'gmail_read_emails';
    
    // Find the database connection record first (needed for reconnection detection)
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
    
    // CRITICAL FIX: Use connection-specific lastSyncAt instead of querying all emails
    // This ensures each connection tracks its own sync state independently
    // Without this, multiple connections of the same provider share sync state incorrectly
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Step 4: Verify connection state - log connection details
    console.log(`🔍 [EMAIL SYNC] Connection state verification:`, {
      connectionId: connection.id,
      nangoConnectionId: connection.nangoConnectionId,
      provider,
      providerConfigKey: connection.providerConfigKey,
      status: connection.status,
      lastSyncAt: connection.lastSyncAt ? new Date(connection.lastSyncAt).toISOString() : null,
      createdAt: connection.createdAt ? new Date(connection.createdAt).toISOString() : null,
      metadata: connection.metadata
    });
    
    // Step 2: Fix date filter logic - check if emails exist in DB for this connection
    // If connection has lastSyncAt but no emails exist, treat as first sync
    const existingEmailCount = await prisma.email_messages.count({
      where: {
        workspaceId,
        provider
      }
    });
    
    console.log(`📊 [EMAIL SYNC] Existing email count in database for ${provider}: ${existingEmailCount}`);
    
    // Use connection.lastSyncAt if available, otherwise fall back to email-based lookup
    let lastSync: Date;
    let lastSyncSource: 'connection' | 'emails' | 'default';
    
    if (connection.lastSyncAt) {
      // Use the connection's own last sync time (connection-specific)
      lastSync = new Date(connection.lastSyncAt);
      lastSyncSource = 'connection';
      console.log(`📧 [EMAIL SYNC] Using connection-specific lastSyncAt: ${lastSync.toISOString()} for connection ${nangoConnectionId}`);
    } else {
      // Fallback: query emails for this specific connection if possible
      // For now, use provider-wide query but log that we're doing so
      const emailBasedLastSync = await this.getLastSyncTime(workspaceId, provider, nangoConnectionId);
      lastSync = emailBasedLastSync;
      lastSyncSource = 'emails';
      console.log(`📧 [EMAIL SYNC] Connection has no lastSyncAt, using email-based lookup: ${lastSync.toISOString()}`);
    }
    
    // Check if this is a first-time sync or reconnection
    const isFirstSync = lastSync.getTime() <= sevenDaysAgo.getTime();
    
    // CRITICAL FIX: If connection has lastSyncAt but no emails exist in DB, treat as first sync
    // This handles the case where lastSyncAt was set on connection creation but no emails were actually synced
    const hasNoEmailsButHasLastSync = connection.lastSyncAt && existingEmailCount === 0;
    
    // Also check if connection was recently activated (within last 5 minutes) - indicates reconnection
    const connectionRecentlyActivated = connection.metadata && 
      (connection.metadata as any).connectedAt &&
      (new Date((connection.metadata as any).connectedAt).getTime() > Date.now() - 5 * 60 * 1000);
    
    // CRITICAL: If we have suspiciously low email count, treat as incomplete first sync
    // This ensures we catch up on missed emails even if some were synced
    // Goal: We want ALL emails from Outlook, not just recent ones
    const LOW_EMAIL_THRESHOLD = 50; // If we have fewer than 50 emails, treat as incomplete first sync
    const hasLowEmailCount = existingEmailCount > 0 && existingEmailCount < LOW_EMAIL_THRESHOLD;
    
    // For first-time syncs, recent reconnections, OR if we have lastSyncAt but no emails, OR if email count is low, fetch last 30 days
    // For subsequent syncs, use last sync time minus 1 hour for safety window
    let filterDate: Date;
    if (isFirstSync || connectionRecentlyActivated || hasNoEmailsButHasLastSync || hasLowEmailCount) {
      // First sync, reconnection, lastSyncAt exists but no emails, or low email count: fetch last 30 days to catch up
      const reason = hasNoEmailsButHasLastSync 
        ? 'lastSyncAt exists but no emails in DB' 
        : hasLowEmailCount
          ? `Only ${existingEmailCount} emails found (threshold: ${LOW_EMAIL_THRESHOLD}) - fetching 30 days to ensure completeness`
          : isFirstSync 
            ? 'First-time' 
            : 'Reconnection';
      filterDate = thirtyDaysAgo;
      console.log(`📧 [EMAIL SYNC] ${reason} sync detected for connection ${nangoConnectionId}, fetching last 30 days of emails`);
    } else {
      // Subsequent sync: use last sync time minus 1 hour for safety window
      const lastSyncMinusOneHour = new Date(lastSync.getTime() - 60 * 60 * 1000);
      filterDate = lastSyncMinusOneHour < oneHourAgo ? lastSyncMinusOneHour : oneHourAgo;
      console.log(`📧 [EMAIL SYNC] Incremental sync for connection ${nangoConnectionId}, using 1-hour window from last sync`);
    }
    
    // Don't go back more than 30 days (reasonable limit for performance)
    let finalFilterDate = filterDate < thirtyDaysAgo ? thirtyDaysAgo : filterDate;
    
    // CRITICAL: Ensure date is not in the future (can happen with bad data)
    const now = new Date();
    if (finalFilterDate > now) {
      console.warn(`⚠️ [EMAIL SYNC] Filter date ${finalFilterDate.toISOString()} is in the future! Using 30 days ago instead.`);
      finalFilterDate = thirtyDaysAgo;
    }
    
    // Format date for Microsoft Graph API (ISO 8601 format)
    const filterDateISO = finalFilterDate.toISOString();
    
    console.log(`📧 [EMAIL SYNC] Connection ${nangoConnectionId} (${provider}): Fetching emails since ${filterDateISO}`);
    console.log(`📧 [EMAIL SYNC] Last sync source: ${lastSyncSource}, Last sync time: ${lastSync.toISOString()}, Window: ${isFirstSync || connectionRecentlyActivated || hasNoEmailsButHasLastSync ? '30-day' : '1-hour'}`);
    console.log(`📧 [EMAIL SYNC] Date filter breakdown:`, {
      isFirstSync,
      connectionRecentlyActivated,
      hasNoEmailsButHasLastSync,
      existingEmailCount,
      filterDate: filterDate.toISOString(),
      finalFilterDate: finalFilterDate.toISOString(),
      filterDateISO
    });
    
    // Initialize Nango client
    const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
    if (!secretKey) {
      throw new Error('NANGO_SECRET_KEY or NANGO_SECRET_KEY_DEV environment variable is not set');
    }
    
    const nango = new Nango({
      secretKey,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });
    
    // Fetch emails from multiple folders (inbox for received, sentitems for sent)
    // Microsoft Graph API OData filters: dates should be ISO 8601 strings WITHOUT quotes
    // Format: YYYY-MM-DDTHH:mm:ss.fffZ (NO quotes - Microsoft Graph doesn't accept them in OData filters)
    // IMPORTANT: Inbox always uses receivedDateTime, sent folder uses sentDateTime
    // Reference: Microsoft Graph API documentation requires dates without quotes in $filter
    // The API treats quoted dates as Edm.String instead of Edm.DateTimeOffset, causing 400 errors
    const foldersToSync = provider === 'outlook' 
      ? [
          { folder: 'inbox', filter: `receivedDateTime ge ${filterDateISO}`, orderby: 'receivedDateTime desc' },
          { folder: 'sentitems', filter: `sentDateTime ge ${filterDateISO}`, orderby: 'sentDateTime desc' }
        ]
      : [
          { folder: 'inbox', q: `after:${Math.floor(finalFilterDate.getTime() / 1000)}` },
          { folder: 'sent', q: `after:${Math.floor(finalFilterDate.getTime() / 1000)}` }
        ];
    
    // Log the exact date filters being used
    console.log(`📧 [EMAIL SYNC] Date filter configuration:`);
    console.log(`   - Filter date: ${filterDateISO}`);
    console.log(`   - Filter date (Unix timestamp for Gmail): ${Math.floor(finalFilterDate.getTime() / 1000)}`);
    foldersToSync.forEach(folder => {
      if (provider === 'outlook') {
        console.log(`   - ${folder.folder}: ${folder.filter}`);
      } else {
        console.log(`   - ${folder.folder}: ${folder.q}`);
      }
    });
    
    let allEmails: any[] = [];
    
    // Fetch from each folder with pagination
    for (const folderConfig of foldersToSync) {
      try {
        let nextLink: string | null = null;
        let pageCount = 0;
        const maxPages = 50; // Safety limit: max 50 pages (5000 emails per folder)
        let folderEmailCount = 0; // Track emails per folder
        let consecutiveEmptyPages = 0; // Track consecutive empty pages for better pagination logic
        
        console.log(`📧 [EMAIL SYNC] Starting pagination for ${folderConfig.folder} folder (provider: ${provider})`);
        
        do {
          let endpoint: string;
          let queryParams: URLSearchParams;
          
          if (provider === 'outlook') {
            if (nextLink) {
              // Use the nextLink URL directly (it's a full URL from Microsoft Graph)
              // Extract the path and query from the nextLink
              try {
                const url = new URL(nextLink);
                endpoint = url.pathname + url.search;
                // Remove the host part since Nango proxy expects relative paths
                endpoint = endpoint.replace('https://graph.microsoft.com', '');
                // Ensure it starts with /v1.0 or /beta
                if (!endpoint.startsWith('/v1.0') && !endpoint.startsWith('/beta')) {
                  // If pathname doesn't include version, add it
                  endpoint = '/v1.0' + endpoint;
                }
              } catch (urlError) {
                console.error(`❌ [EMAIL SYNC] Invalid nextLink URL: ${nextLink}`, urlError);
                nextLink = null;
                break;
              }
            } else {
              endpoint = `/v1.0/me/mailFolders/${folderConfig.folder}/messages`;
              queryParams = new URLSearchParams();
              queryParams.append('$top', '100'); // Fetch 100 per page
              if (folderConfig.filter) {
                queryParams.append('$filter', folderConfig.filter);
              }
              if (folderConfig.orderby) {
                queryParams.append('$orderby', folderConfig.orderby);
              }
              endpoint += `?${queryParams.toString()}`;
            }
            console.log(`📧 [EMAIL SYNC] Outlook endpoint (page ${pageCount + 1}): ${endpoint}`);
            if (pageCount === 0) {
              console.log(`📧 [EMAIL SYNC] Date filter: ${folderConfig.filter || 'none'}`);
            }
          } else {
            // Gmail pagination - messages.list returns message IDs, we'll need to fetch full details
            // Note: messages.list doesn't support format parameter (that's for messages.get)
            endpoint = '/gmail/v1/users/me/messages';
            queryParams = new URLSearchParams();
            queryParams.append('maxResults', '100');
            if (nextLink) {
              // Gmail pagination - nextLink is just "pageToken=..." from previous iteration
              if (nextLink.startsWith('pageToken=')) {
                const pageToken = nextLink.replace('pageToken=', '');
                queryParams.append('pageToken', pageToken);
              } else {
                // Try to parse as URL (legacy format)
                try {
                  const url = new URL(nextLink);
                  const pageToken = url.searchParams.get('pageToken');
                  if (pageToken) {
                    queryParams.append('pageToken', pageToken);
                  }
                } catch (e) {
                  console.warn(`⚠️ [EMAIL SYNC] Could not parse Gmail nextLink: ${nextLink}`);
                }
              }
            }
            if (folderConfig.q) {
              // Gmail query syntax: combine date filter with folder
              const dateQuery = folderConfig.q;
              const folderQuery = folderConfig.folder === 'inbox' ? 'in:inbox' : 'in:sent';
              queryParams.append('q', `${dateQuery} ${folderQuery}`);
            } else {
              // Default to inbox if no query
              queryParams.append('q', 'in:inbox');
            }
            endpoint += `?${queryParams.toString()}`;
            console.log(`📧 [EMAIL SYNC] Gmail endpoint (page ${pageCount + 1}): ${endpoint}`);
            if (pageCount === 0) {
              console.log(`📧 [EMAIL SYNC] Gmail query: ${queryParams.get('q') || 'none'}`);
            }
          }
          
          const result = await retryWithBackoff(
            async () => {
              try {
                // Log the exact API call being made
                console.log(`📡 [EMAIL SYNC] Making API call:`, {
                  provider,
                  folder: folderConfig.folder,
                  page: pageCount + 1,
                  endpoint,
                  providerConfigKey: connection.providerConfigKey,
                  connectionId: connection.nangoConnectionId
                });
                
                const response = await nango.proxy({
                  providerConfigKey: connection.providerConfigKey,
                  connectionId: connection.nangoConnectionId,
                  endpoint,
                  method: 'GET'
                });
                
                const responseData = response.data || response;
                
                // Step 1: Add comprehensive API response logging
                console.log(`📡 [EMAIL SYNC] API Response received:`, {
                  provider,
                  folder: folderConfig.folder,
                  page: pageCount + 1,
                  responseType: typeof responseData,
                  responseKeys: responseData ? Object.keys(responseData) : [],
                  hasValue: provider === 'outlook' ? !!responseData.value : false,
                  hasMessages: provider === 'gmail' ? !!responseData.messages : false,
                  valueLength: provider === 'outlook' ? (Array.isArray(responseData.value) ? responseData.value.length : 'not array') : 'N/A',
                  messagesLength: provider === 'gmail' ? (Array.isArray(responseData.messages) ? responseData.messages.length : 'not array') : 'N/A',
                  hasNextLink: provider === 'outlook' ? !!responseData['@odata.nextLink'] : false,
                  hasNextPageToken: provider === 'gmail' ? !!responseData.nextPageToken : false,
                  responsePreview: JSON.stringify(responseData).substring(0, 500)
                });
                
                // Return raw response data - we'll process it after fetching
                return {
                  success: true,
                  data: responseData
                };
              } catch (nangoError: any) {
                const errorMessage = nangoError instanceof Error ? nangoError.message : String(nangoError);
                
                // Extract detailed error information from Nango/API response
                let apiErrorDetails: any = null;
                if (nangoError?.response?.data) {
                  apiErrorDetails = nangoError.response.data;
                } else if (nangoError?.response) {
                  apiErrorDetails = nangoError.response;
                } else if (nangoError?.data) {
                  apiErrorDetails = nangoError.data;
                }
                
                // Log the full error response for debugging
                console.error(`❌ [EMAIL SYNC] Nango proxy error for ${folderConfig.folder} (page ${pageCount + 1}):`, {
                  message: errorMessage,
                  status: nangoError?.response?.status || nangoError?.status,
                  statusText: nangoError?.response?.statusText,
                  apiErrorDetails: apiErrorDetails ? JSON.stringify(apiErrorDetails, null, 2) : null,
                  errorBody: nangoError?.response?.data || nangoError?.data,
                  stack: nangoError instanceof Error ? nangoError.stack : undefined,
                  providerConfigKey: connection.providerConfigKey,
                  connectionId: connection.nangoConnectionId,
                  endpoint,
                  filter: folderConfig.filter || folderConfig.q
                });
                
                // Check for rate limiting errors
                if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('quota') || nangoError?.response?.status === 429) {
                  console.warn(`⚠️ [EMAIL SYNC] Rate limit detected, waiting longer before retry...`);
                  // Wait longer for rate limits
                  await new Promise(resolve => setTimeout(resolve, 5000));
                }
                
                throw nangoError;
              }
            },
            `Email fetch from ${provider} ${folderConfig.folder} (page ${pageCount + 1})`
          );
          
          if (result.success && result.data) {
            // Step 3: Add API response validation
            let emails: any[] = [];
            if (provider === 'outlook') {
              // Validate Outlook response structure
              if (!result.data.hasOwnProperty('value')) {
                console.warn(`⚠️ [EMAIL SYNC] Outlook API response missing 'value' property. Response keys:`, Object.keys(result.data));
                console.warn(`⚠️ [EMAIL SYNC] Full response:`, JSON.stringify(result.data).substring(0, 1000));
              }
              emails = result.data.value || [];
              console.log(`📧 [EMAIL SYNC] Outlook response: ${emails.length} emails found in 'value' array`);
            } else {
              // Gmail: messages.list returns { messages: [{ id, threadId }, ...], nextPageToken: ... }
              // Validate Gmail response structure
              if (!result.data.hasOwnProperty('messages')) {
                console.warn(`⚠️ [EMAIL SYNC] Gmail API response missing 'messages' property. Response keys:`, Object.keys(result.data));
                console.warn(`⚠️ [EMAIL SYNC] Full response:`, JSON.stringify(result.data).substring(0, 1000));
              }
              const messageIds = result.data.messages || [];
              console.log(`📧 [EMAIL SYNC] Gmail response: ${messageIds.length} message IDs found in 'messages' array`);
              
              // Gmail messages.list only returns IDs, we need to fetch full message details
              // Fetch full messages in batches to avoid rate limits
              if (messageIds.length > 0) {
                console.log(`📧 [EMAIL SYNC] Fetching full details for ${messageIds.length} Gmail messages...`);
                
                // Fetch full message details in parallel (batch of 10 at a time to avoid rate limits)
                const batchSize = 10;
                for (let i = 0; i < messageIds.length; i += batchSize) {
                  const batch = messageIds.slice(i, i + batchSize);
                  const batchPromises = batch.map(async (msg: any) => {
                    try {
                      const fullMessageResponse = await retryWithBackoff(
                        async () => {
                          const fullResponse = await nango.proxy({
                            providerConfigKey: connection.providerConfigKey,
                            connectionId: connection.nangoConnectionId,
                            endpoint: `/gmail/v1/users/me/messages/${msg.id}?format=full`,
                            method: 'GET'
                          });
                          return fullResponse.data || fullResponse;
                        },
                        `Gmail message get ${msg.id}`
                      );
                      return fullMessageResponse;
                    } catch (error) {
                      const errorMsg = error instanceof Error ? error.message : String(error);
                      console.error(`❌ [EMAIL SYNC] Failed to fetch full Gmail message ${msg.id}:`, errorMsg);
                      
                      // Check for rate limits
                      if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('quota')) {
                        console.warn(`⚠️ [EMAIL SYNC] Rate limit while fetching Gmail message ${msg.id}, waiting...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        // Try once more after delay
                        try {
                          const retryResponse = await nango.proxy({
                            providerConfigKey: connection.providerConfigKey,
                            connectionId: connection.nangoConnectionId,
                            endpoint: `/gmail/v1/users/me/messages/${msg.id}?format=full`,
                            method: 'GET'
                          });
                          return retryResponse.data || retryResponse;
                        } catch (retryError) {
                          console.error(`❌ [EMAIL SYNC] Retry failed for Gmail message ${msg.id}`);
                        }
                      }
                      
                      // Return minimal message data if fetch fails
                      return {
                        id: msg.id,
                        threadId: msg.threadId,
                        snippet: '',
                        payload: { headers: [] },
                        labelIds: [],
                        internalDate: String(Date.now())
                      };
                    }
                  });
                  
                  const batchResults = await Promise.all(batchPromises);
                  emails = emails.concat(batchResults.filter(Boolean));
                  
                  // Small delay between batches to avoid rate limits
                  if (i + batchSize < messageIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                }
                
                console.log(`✅ [EMAIL SYNC] Fetched full details for ${emails.length} Gmail messages`);
              }
            }
            
            // Log page results
            console.log(`📧 [EMAIL SYNC] Page ${pageCount + 1} of ${folderConfig.folder}: Found ${emails.length} emails`);
            
            if (emails.length > 0) {
              allEmails = allEmails.concat(emails);
              folderEmailCount += emails.length;
              consecutiveEmptyPages = 0; // Reset empty page counter
              console.log(`📧 [EMAIL SYNC] Page ${pageCount + 1} summary: ${emails.length} emails added, ${folderEmailCount} total in ${folderConfig.folder} folder`);
            } else {
              consecutiveEmptyPages++;
              console.log(`📧 [EMAIL SYNC] Page ${pageCount + 1} returned 0 emails (consecutive empty pages: ${consecutiveEmptyPages})`);
            }
            
            // Get next page link
            if (provider === 'outlook') {
              // Microsoft Graph uses @odata.nextLink
              nextLink = result.data['@odata.nextLink'] || null;
              if (nextLink) {
                console.log(`📧 [EMAIL SYNC] Outlook has next page: ${nextLink.substring(0, 100)}...`);
              } else {
                console.log(`📧 [EMAIL SYNC] Outlook pagination complete: No @odata.nextLink found`);
              }
            } else {
              // Gmail uses nextPageToken
              const nextPageToken = result.data.nextPageToken;
              if (nextPageToken) {
                // Store just the token, we'll reconstruct the URL
                nextLink = `pageToken=${nextPageToken}`;
                console.log(`📧 [EMAIL SYNC] Gmail has next page token`);
              } else {
                nextLink = null;
                console.log(`📧 [EMAIL SYNC] Gmail pagination complete: No nextPageToken found`);
              }
            }
            
            pageCount++;
            
            // Safety check: don't fetch more than maxPages
            if (pageCount >= maxPages) {
              console.log(`⚠️ [EMAIL SYNC] Reached max pages (${maxPages}) for ${folderConfig.folder}, stopping pagination`);
              console.log(`📧 [EMAIL SYNC] Pagination stopped reason: Max pages limit reached`);
              nextLink = null;
            }
            
            // Improved pagination continuation logic: Don't stop on first empty page if we haven't fetched many emails
            // Continue until we get 2-3 consecutive empty pages or hit max pages
            if (emails.length === 0) {
              // Only stop if we've had multiple consecutive empty pages OR if we've already fetched a reasonable amount
              if (consecutiveEmptyPages >= 2) {
                console.log(`📧 [EMAIL SYNC] Pagination stopped reason: ${consecutiveEmptyPages} consecutive empty pages`);
                nextLink = null;
              } else if (folderEmailCount >= 100) {
                // If we've fetched 100+ emails and get an empty page, it's likely the end
                console.log(`📧 [EMAIL SYNC] Pagination stopped reason: Empty page after fetching ${folderEmailCount} emails`);
                nextLink = null;
              } else {
                // Continue to next page even if this one was empty (might be sparse results)
                console.log(`📧 [EMAIL SYNC] Continuing pagination despite empty page (only ${folderEmailCount} emails fetched so far, ${consecutiveEmptyPages} empty pages)`);
              }
            }
          } else {
            console.log(`❌ [EMAIL SYNC] Page ${pageCount + 1} fetch failed or returned no data`);
            nextLink = null;
          }
        } while (nextLink);
        
        console.log(`✅ [EMAIL SYNC] Completed fetching from ${folderConfig.folder}: ${folderEmailCount} emails from this folder, ${allEmails.length} total emails so far`);
        console.log(`📧 [EMAIL SYNC] Pagination summary for ${folderConfig.folder}: ${pageCount} pages fetched, ${folderEmailCount} emails found`);
      } catch (error) {
        console.error(`❌ [EMAIL SYNC] Failed to fetch from ${folderConfig.folder}:`, error);
        // Continue with other folders even if one fails
      }
    }
    
    console.log(`📧 [EMAIL SYNC] Total emails fetched: ${allEmails.length} (from ${foldersToSync.length} folders)`);
    
    // Get previous email count BEFORE storing (for comparison)
    const previousEmailCount = await prisma.email_messages.count({
      where: {
        workspaceId,
        provider
      }
    });
    
    // Store all emails
    let count = 0;
    let errorCount = 0;
    console.log(`📧 [EMAIL SYNC] Starting to store ${allEmails.length} emails...`);
    console.log(`📧 [EMAIL SYNC] Previous email count in database: ${previousEmailCount}`);
    
    for (const email of allEmails) {
      try {
        await this.storeEmailMessage(email, provider, workspaceId);
        count++;
        if (count % 10 === 0) {
          console.log(`📧 [EMAIL SYNC] Stored ${count}/${allEmails.length} emails so far...`);
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error(`❌ [EMAIL SYNC] Failed to store email ${email.id || 'unknown'}:`, {
          error: errorMessage,
          stack: errorStack,
          emailPreview: {
            id: email.id,
            subject: email.subject || email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value,
            from: email.from?.emailAddress?.address || email.payload?.headers?.find((h: any) => h.name === 'From')?.value
          }
        });
        
        // Log first few errors in detail for debugging
        if (errorCount <= 3) {
          console.error(`❌ [EMAIL SYNC] Email data that failed:`, JSON.stringify(email, null, 2).substring(0, 500));
        }
      }
    }
    
    // Step 5: Add Sync Verification Summary
    console.log(`✅ [EMAIL SYNC] Successfully stored ${count} emails, ${errorCount} failed out of ${allEmails.length} total`);
    
    // Get current email count after storing
    const currentEmailCount = await prisma.email_messages.count({
      where: {
        workspaceId,
        provider
      }
    });
    
    // Calculate new emails added (current - previous)
    const newEmailsAdded = currentEmailCount - previousEmailCount;
    
    // Comprehensive sync summary
    console.log(`📊 [EMAIL SYNC] ========================================`);
    console.log(`📊 [EMAIL SYNC] Sync Verification Summary:`);
    console.log(`📊 [EMAIL SYNC] ========================================`);
    console.log(`   - Workspace ID: ${workspaceId}`);
    console.log(`   - Provider: ${provider}`);
    console.log(`   - Connection ID: ${nangoConnectionId}`);
    console.log(`   - Total emails fetched from API: ${allEmails.length}`);
    console.log(`   - Emails stored successfully: ${count}`);
    console.log(`   - Emails failed to store: ${errorCount}`);
    console.log(`   - Previous total emails in database: ${previousEmailCount}`);
    console.log(`   - Current total emails in database: ${currentEmailCount}`);
    console.log(`   - New emails added this sync: ${newEmailsAdded}`);
    console.log(`   - Success rate: ${allEmails.length > 0 ? Math.round((count / allEmails.length) * 100) : 0}%`);
    console.log(`📊 [EMAIL SYNC] ========================================`);
    
    if (errorCount > 0) {
      console.warn(`⚠️ [EMAIL SYNC] ${errorCount} emails failed to store out of ${allEmails.length} total`);
      console.warn(`⚠️ [EMAIL SYNC] This may indicate data validation issues or API response format problems`);
    }
    
    if (allEmails.length === 0) {
      console.warn(`⚠️ [EMAIL SYNC] No emails were fetched from the API. This could indicate:`);
      console.warn(`   - Date filter is too restrictive`);
      console.warn(`   - No emails exist in the specified date range`);
      console.warn(`   - API connection or authentication issues`);
    }
    
    // Update last sync time - CRITICAL: Update the connection record, not just rely on email timestamps
    await this.updateLastSyncTime(workspaceId, provider, nangoConnectionId, count > 0);
    
    return { success: true, count, fetched: allEmails.length, failed: errorCount };
  }
  
  /**
   * Historical sync - same as syncProviderEmails but bypasses 30-day limit
   */
  private static async syncProviderEmailsHistorical(
    provider: 'outlook' | 'gmail',
    workspaceId: string,
    userId: string,
    nangoConnectionId: string,
    startDate: Date
  ): Promise<{ success: boolean; count: number; error?: string }> {
    console.log(`📧 [HISTORICAL SYNC] Starting historical sync for ${provider}`);
    console.log(`📧 [HISTORICAL SYNC] Start date: ${startDate.toISOString()}`);
    
    // Ensure start date is not in the future
    const now = new Date();
    const finalStartDate = startDate > now ? now : startDate;
    
    // Format date for API
    const filterDateISO = finalStartDate.toISOString();
    
    console.log(`📧 [HISTORICAL SYNC] Using filter date: ${filterDateISO}`);
    
    // Initialize Nango client
    const secretKey = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;
    if (!secretKey) {
      return { success: false, count: 0, error: 'NANGO_SECRET_KEY not set' };
    }
    
    const nango = new Nango({
      secretKey,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });
    
    // Fetch emails from multiple folders (same as regular sync but with custom date)
    const foldersToSync = provider === 'outlook' 
      ? [
          { folder: 'inbox', filter: `receivedDateTime ge ${filterDateISO}`, orderby: 'receivedDateTime desc' },
          { folder: 'sentitems', filter: `sentDateTime ge ${filterDateISO}`, orderby: 'sentDateTime desc' }
        ]
      : [
          { folder: 'inbox', q: `after:${Math.floor(finalStartDate.getTime() / 1000)}` },
          { folder: 'sent', q: `after:${Math.floor(finalStartDate.getTime() / 1000)}` }
        ];
    
    let totalCount = 0;
    let errorCount = 0;
    const allEmails: any[] = [];
    
    // Process each folder (reuse the same pagination logic from syncProviderEmails)
    // For brevity, we'll call the existing sync logic but with the custom date
    // Actually, let's copy the pagination logic but use our custom date
    
    // Get existing email count to avoid duplicates
    // Note: email_messages doesn't have nangoConnectionId, only workspaceId and provider
    const existingEmailCount = await prisma.email_messages.count({
      where: {
        workspaceId,
        provider
      }
    });
    
    console.log(`📧 [HISTORICAL SYNC] Existing emails: ${existingEmailCount}`);
    
    // Use the same folder sync logic but with our custom date
    // We'll reuse most of the syncProviderEmails logic
    // For now, let's create a simplified version that fetches all emails
    
    // Process folders
    for (const folderConfig of foldersToSync) {
      console.log(`📧 [HISTORICAL SYNC] Syncing ${folderConfig.folder} folder...`);
      
      let pageCount = 0;
      let nextLink: string | null = null;
      const MAX_PAGES = 1000; // Safety limit
      
      do {
        try {
          let endpoint: string;
          
          if (provider === 'outlook') {
            if (nextLink) {
              endpoint = nextLink;
            } else {
              const baseUrl = folderConfig.folder === 'inbox' 
                ? 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages'
                : 'https://graph.microsoft.com/v1.0/me/mailFolders/sentitems/messages';
              
              const queryParams = new URLSearchParams({
                '$filter': folderConfig.filter!,
                '$orderby': folderConfig.orderby!,
                '$top': '50',
                '$select': 'id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,body,bodyPreview,isRead,importance,hasAttachments,conversationId,internetMessageId'
              });
              
              endpoint = `${baseUrl}?${queryParams.toString()}`;
            }
          } else {
            // Gmail
            if (nextLink) {
              endpoint = nextLink;
            } else {
              const queryParams = new URLSearchParams({
                q: folderConfig.q!,
                maxResults: '50'
              });
              endpoint = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams.toString()}`;
            }
          }
          
          const result = await nango.proxy({
            method: 'GET',
            endpoint,
            connectionId: nangoConnectionId,
            providerConfigKey: provider === 'outlook' ? 'outlook' : 'gmail'
          });
          
          const emails = provider === 'outlook' 
            ? (result.data.value || [])
            : (result.data.messages || []);
          
          if (emails.length > 0) {
            // For Gmail, fetch full message details
            if (provider === 'gmail') {
              const fullEmails = await Promise.all(
                emails.map(async (msg: any) => {
                  try {
                    const msgResult = await nango.proxy({
                      method: 'GET',
                      endpoint: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                      connectionId: nangoConnectionId,
                      providerConfigKey: 'gmail'
                    });
                    return msgResult.data;
                  } catch (error) {
                    return null;
                  }
                })
              );
              allEmails.push(...fullEmails.filter(Boolean));
            } else {
              allEmails.push(...emails);
            }
          }
          
          nextLink = provider === 'outlook' 
            ? result.data['@odata.nextLink'] || null
            : result.data.nextPageToken 
              ? `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${folderConfig.q}&maxResults=50&pageToken=${result.data.nextPageToken}`
              : null;
          
          pageCount++;
          
          if (pageCount % 10 === 0) {
            console.log(`📧 [HISTORICAL SYNC] Processed ${pageCount} pages, ${allEmails.length} emails so far...`);
          }
          
        } catch (error: any) {
          console.error(`❌ [HISTORICAL SYNC] Error:`, error.message);
          errorCount++;
          nextLink = null;
        }
      } while (nextLink && pageCount < MAX_PAGES);
    }
    
    // Store all emails
    console.log(`📧 [HISTORICAL SYNC] Storing ${allEmails.length} emails...`);
    
    for (const email of allEmails) {
      try {
        await this.storeEmailMessage(email, provider, workspaceId);
        totalCount++;
      } catch (error: any) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`❌ [HISTORICAL SYNC] Error storing:`, error.message);
        }
      }
    }
    
    // Update last sync time
    await this.updateLastSyncTime(workspaceId, provider, nangoConnectionId, totalCount > 0);
    
    console.log(`✅ [HISTORICAL SYNC] Complete: ${totalCount} emails stored, ${errorCount} errors`);
    
    // Auto-link emails to people and companies
    console.log(`📧 [HISTORICAL SYNC] Auto-linking emails to entities...`);
    const linkResult = await this.linkEmailsToEntities(workspaceId);
    console.log(`✅ [HISTORICAL SYNC] Auto-linking completed: ${linkResult.linked} emails linked`);
    
    // Create action records for timeline
    console.log(`📧 [HISTORICAL SYNC] Creating action records for emails...`);
    const actionResult = await this.createEmailActions(workspaceId);
    console.log(`✅ [HISTORICAL SYNC] Action creation completed: ${actionResult.created} actions created`);
    
    return { success: true, count: totalCount };
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
    
    // Validate required fields
    if (!emailData.messageId) {
      throw new Error(`Missing messageId for email: ${JSON.stringify(email).substring(0, 200)}`);
    }
    
    if (!emailData.from) {
      throw new Error(`Missing from field for email ${emailData.messageId}`);
    }
    
    // Ensure 'to' is an array and not empty (at least one recipient)
    if (!Array.isArray(emailData.to) || emailData.to.length === 0) {
      // If no 'to' recipients, try to extract from email data
      if (provider === 'outlook' && email.toRecipients) {
        emailData.to = email.toRecipients.map((r: any) => r.emailAddress?.address).filter(Boolean);
      } else if (provider === 'gmail' && email.payload?.headers) {
        const toHeader = email.payload.headers.find((h: any) => h.name === 'To');
        if (toHeader?.value) {
          emailData.to = [toHeader.value];
        }
      }
      
      // If still empty, skip saving this email (likely a draft)
      if (!Array.isArray(emailData.to) || emailData.to.length === 0) {
        console.log(`⏭️ [EMAIL SYNC] Skipping email ${emailData.messageId} - no 'to' recipients (likely a draft)`);
        return; // Skip saving drafts
      }
    }
    
    // Truncate 'from' field if too long (varchar(300) limit)
    if (emailData.from.length > 300) {
      console.warn(`⚠️ [EMAIL SYNC] Truncating 'from' field for email ${emailData.messageId} (was ${emailData.from.length} chars)`);
      emailData.from = emailData.from.substring(0, 300);
    }
    
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
      // For sent emails, receivedDateTime might not be set, so use sentDateTime as fallback
      const receivedDateTime = email.receivedDateTime || email.sentDateTime;
      
      // Validate and parse dates
      let sentAt: Date;
      let receivedAt: Date;
      try {
        sentAt = email.sentDateTime ? new Date(email.sentDateTime) : new Date();
        receivedAt = receivedDateTime ? new Date(receivedDateTime) : sentAt;
      } catch (e) {
        console.warn(`⚠️ [EMAIL SYNC] Invalid date for email ${email.id}, using current date`);
        sentAt = new Date();
        receivedAt = new Date();
      }
      
      // Extract email addresses safely
      const extractEmailAddress = (recipient: any): string => {
        if (!recipient) return '';
        if (typeof recipient === 'string') return recipient;
        if (recipient.emailAddress?.address) return recipient.emailAddress.address;
        if (recipient.emailAddress?.name) return recipient.emailAddress.name;
        return '';
      };
      
      return {
        messageId: email.id || String(Date.now()), // Fallback if missing
        threadId: email.conversationId || null,
        subject: email.subject || '(No Subject)',
        body: email.body?.content || email.bodyPreview || '',
        bodyHtml: email.body?.contentType === 'html' ? email.body.content : null,
        from: extractEmailAddress(email.from) || 'unknown@example.com',
        to: (email.toRecipients || []).map(extractEmailAddress).filter(Boolean),
        cc: (email.ccRecipients || []).map(extractEmailAddress).filter(Boolean),
        bcc: (email.bccRecipients || []).map(extractEmailAddress).filter(Boolean),
        sentAt,
        receivedAt,
        isRead: email.isRead || false,
        isImportant: email.importance === 'high',
        attachments: email.attachments || [],
        labels: email.categories || []
      };
    } else {
      // Gmail format - handle both full messages and message IDs
      // If we only have an ID, we can't get full details (would need separate API call)
      // For now, use what we have from format=full
      
      const headers = email.payload?.headers || [];
      const getHeader = (name: string): string => {
        const header = headers.find((h: any) => h.name === name);
        return header?.value || '';
      };
      
      // Parse email addresses from headers (may contain "Name <email@domain.com>")
      const parseEmailAddress = (headerValue: string): string[] => {
        if (!headerValue) return [];
        // Extract emails from strings like "Name <email@domain.com>" or just "email@domain.com"
        const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
        return headerValue.match(emailRegex) || [];
      };
      
      // Validate and parse dates
      let sentAt: Date;
      let receivedAt: Date;
      try {
        if (email.internalDate) {
          const timestamp = parseInt(email.internalDate);
          if (!isNaN(timestamp)) {
            sentAt = new Date(timestamp);
            receivedAt = new Date(timestamp);
          } else {
            throw new Error('Invalid timestamp');
          }
        } else {
          // Try to parse from Date header
          const dateHeader = getHeader('Date');
          if (dateHeader) {
            sentAt = new Date(dateHeader);
            receivedAt = new Date(dateHeader);
          } else {
            sentAt = new Date();
            receivedAt = new Date();
          }
        }
      } catch (e) {
        console.warn(`⚠️ [EMAIL SYNC] Invalid date for Gmail email ${email.id}, using current date`);
        sentAt = new Date();
        receivedAt = new Date();
      }
      
      const toHeader = getHeader('To');
      const ccHeader = getHeader('Cc');
      const bccHeader = getHeader('Bcc');
      
      return {
        messageId: email.id || String(Date.now()), // Fallback if missing
        threadId: email.threadId || null,
        subject: getHeader('Subject') || '(No Subject)',
        body: email.snippet || email.payload?.body?.data || '',
        bodyHtml: null, // Gmail API requires separate call for full HTML body
        from: parseEmailAddress(getHeader('From'))[0] || 'unknown@example.com',
        to: parseEmailAddress(toHeader),
        cc: parseEmailAddress(ccHeader),
        bcc: parseEmailAddress(bccHeader),
        sentAt,
        receivedAt,
        isRead: !email.labelIds?.includes('UNREAD'),
        isImportant: email.labelIds?.includes('IMPORTANT') || false,
        attachments: email.payload?.parts?.filter((p: any) => p.filename) || [],
        labels: email.labelIds || []
      };
    }
  }
  
  /**
   * Auto-link emails to people and companies
   * Enhanced to link company emails even when person isn't found
   */
  /**
   * Extract domain from email address
   */
  private static extractDomain(email: string | null | undefined): string | null {
    if (!email || typeof email !== 'string') return null;
    const match = email.toLowerCase().trim().match(/@([^@]+)$/);
    return match ? match[1] : null;
  }

  /**
   * Normalize domain for matching (remove www, http/https, etc.)
   */
  private static normalizeDomain(domain: string | null | undefined): string | null {
    if (!domain) return null;
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .trim();
  }

  /**
   * Extract base domain (e.g., "example.com" from "mail.example.com")
   */
  private static extractBaseDomain(domain: string | null | undefined): string | null {
    if (!domain) return null;
    const normalized = this.normalizeDomain(domain);
    if (!normalized) return null;
    const parts = normalized.split('.');
    if (parts.length >= 2) {
      // Return last two parts (e.g., "example.com")
      return parts.slice(-2).join('.');
    }
    return normalized;
  }

  private static async linkEmailsToEntities(workspaceId: string) {
    // Process in batches - get all unlinked emails
    let skip = 0;
    const batchSize = 1000;
    let linkedToPerson = 0;
    let linkedToCompany = 0;
    let hasMore = true;

    while (hasMore) {
      const unlinkedEmails = await prisma.email_messages.findMany({
        where: {
          workspaceId,
          OR: [
            { personId: null },
            { companyId: null }
          ]
        },
        take: batchSize,
        skip: skip
      });

      if (unlinkedEmails.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`📧 [EMAIL LINKING] Processing batch: ${unlinkedEmails.length} emails (skip: ${skip})`);

      for (const email of unlinkedEmails) {
        // Extract email addresses
        const emailAddresses = [
          email.from,
          ...(email.to || []),
          ...(email.cc || []),
          ...(email.bcc || [])
        ].filter(Boolean).map(e => e.toLowerCase().trim());
        
        let personId = email.personId;
        let companyId = email.companyId;
        
        // Find matching person
        if (!personId && emailAddresses.length > 0) {
          const person = await prisma.people.findFirst({
            where: {
              workspaceId,
              deletedAt: null,
              OR: [
                { email: { in: emailAddresses } },
                { workEmail: { in: emailAddresses } },
                { personalEmail: { in: emailAddresses } }
              ]
            },
            include: {
              company: {
                select: {
                  id: true
                }
              }
            }
          });
          
          if (person) {
            personId = person.id;
            if (!companyId && person.companyId) {
              companyId = person.companyId;
            }
          }
        }
        
        // If no person found, try to link to company by email domain
        if (!companyId && emailAddresses.length > 0) {
          // Extract domains from email addresses
          const domains = emailAddresses
            .map(e => this.extractDomain(e))
            .filter(Boolean) as string[];
          
          if (domains.length > 0) {
            // Normalize domains
            const normalizedDomains = domains
              .map(d => this.normalizeDomain(d))
              .filter(Boolean) as string[];

            const baseDomains = normalizedDomains
              .map(d => this.extractBaseDomain(d))
              .filter(Boolean) as string[];

            // Get all unique domains to search
            const allDomains = [...new Set([...normalizedDomains, ...baseDomains])];

            // First, try exact domain match
            let company = await prisma.companies.findFirst({
              where: {
                workspaceId,
                deletedAt: null,
                OR: [
                  { domain: { in: allDomains } },
                  { email: { in: emailAddresses } }
                ]
              }
            });

            // If no exact match, try website contains domain
            if (!company && allDomains.length > 0) {
              const companies = await prisma.companies.findMany({
                where: {
                  workspaceId,
                  deletedAt: null,
                  website: { not: null }
                },
                select: {
                  id: true,
                  name: true,
                  domain: true,
                  website: true
                }
              });

              for (const domain of allDomains) {
                const matchingCompany = companies.find(c => {
                  if (!c.website) return false;
                  const normalizedWebsite = this.normalizeDomain(c.website);
                  return normalizedWebsite === domain || 
                         (normalizedWebsite && domain && (
                           normalizedWebsite.includes(domain) ||
                           domain.includes(normalizedWebsite)
                         ));
                });

                if (matchingCompany) {
                  company = matchingCompany;
                  break;
                }
              }
            }
            
            if (company) {
              companyId = company.id;
            }
          }
        }
        
        // Update email if we found links
        if (personId !== email.personId || companyId !== email.companyId) {
          await prisma.email_messages.update({
            where: { id: email.id },
            data: {
              personId: personId || null,
              companyId: companyId || null
            }
          });
          
          if (personId) linkedToPerson++;
          if (companyId) linkedToCompany++;

          // Classify engagement after linking
          if (personId || companyId) {
            const { EngagementClassificationService } = await import('./engagement-classification-service');
            await EngagementClassificationService.classifyFromEmail({
              id: email.id,
              subject: email.subject,
              body: email.body,
              threadId: email.threadId,
              inReplyTo: email.inReplyTo || null,
              from: email.from,
              to: email.to || null,
              personId: personId || null,
              companyId: companyId || null,
              workspaceId
            });
          }
        }
      }

      skip += batchSize;
      hasMore = unlinkedEmails.length === batchSize;
    }
    
    console.log(`✅ [EMAIL LINKING] Linked ${linkedToPerson} emails to people, ${linkedToCompany} emails to companies`);
    return { linked: linkedToPerson, linkedToCompany };
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

        // Classify engagement after linking
        const { EngagementClassificationService } = await import('./engagement-classification-service');
        await EngagementClassificationService.classifyFromEmail({
          id: email.id,
          subject: email.subject,
          body: email.body,
          threadId: email.threadId,
          inReplyTo: email.inReplyTo || null,
          from: email.from,
          to: email.to || null,
          personId: personId,
          companyId: person.companyId,
          workspaceId
        });
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
        // Build description with email details
        const emailDetails = [];
        emailDetails.push(`From: ${email.from}`);
        if (email.to && email.to.length > 0) {
          emailDetails.push(`To: ${email.to.join(', ')}`);
        }
        if (email.cc && email.cc.length > 0) {
          emailDetails.push(`CC: ${email.cc.join(', ')}`);
        }
        if (email.threadId) {
          emailDetails.push(`Thread: ${email.threadId}`);
        }
        emailDetails.push(`\n${email.body.substring(0, 400)}`);
        
        const description = emailDetails.join('\n');

        await prisma.actions.create({
          data: {
            workspaceId,
            userId: workspaceUser.userId,
            companyId: email.companyId,
            personId: email.personId,
            type: 'EMAIL',
            subject: email.subject || '(No Subject)',
            description: description,
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
   * Returns the most recent email's receivedAt or sentAt time, or 7 days ago if no emails exist
   * This handles both incoming (receivedAt) and outgoing (sentAt) emails
   * 
   * NOTE: This is a fallback method. The primary method should use connection.lastSyncAt
   * This method queries all emails for a provider, which can cause issues with multiple connections
   * 
   * @param workspaceId - Workspace ID
   * @param provider - Provider name ('outlook' or 'gmail')
   * @param nangoConnectionId - Optional connection ID for connection-specific lookup (future enhancement)
   */
  private static async getLastSyncTime(
    workspaceId: string, 
    provider: string, 
    nangoConnectionId?: string
  ): Promise<Date> {
    // TODO: Future enhancement - query emails filtered by connection metadata
    // For now, this queries all emails for the provider (fallback only)
    // The main sync logic should use connection.lastSyncAt instead
    
    // Get the most recent email by either receivedAt or sentAt
    const lastReceivedEmail = await prisma.email_messages.findFirst({
      where: {
        workspaceId,
        provider
      },
      orderBy: { receivedAt: 'desc' },
      select: { receivedAt: true, sentAt: true }
    });
    
    const lastSentEmail = await prisma.email_messages.findFirst({
      where: {
        workspaceId,
        provider
      },
      orderBy: { sentAt: 'desc' },
      select: { receivedAt: true, sentAt: true }
    });
    
    // Find the most recent timestamp from either received or sent emails
    let mostRecentTime: Date | null = null;
    
    if (lastReceivedEmail?.receivedAt) {
      mostRecentTime = lastReceivedEmail.receivedAt;
    }
    
    if (lastSentEmail?.sentAt) {
      if (!mostRecentTime || lastSentEmail.sentAt > mostRecentTime) {
        mostRecentTime = lastSentEmail.sentAt;
      }
    }
    
    if (mostRecentTime) {
      // Return the exact time - the sync function will create a 1-hour safety window
      console.log(`📧 [EMAIL SYNC] Most recent email at: ${mostRecentTime.toISOString()} (provider-wide query, not connection-specific)`);
      if (nangoConnectionId) {
        console.warn(`⚠️ [EMAIL SYNC] Using provider-wide email query for connection ${nangoConnectionId}. Connection should have lastSyncAt set.`);
      }
      return mostRecentTime;
    }
    
    // Default to 7 days ago if no previous sync
    const defaultDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    console.log(`📧 [EMAIL SYNC] No previous emails found, using default date: ${defaultDate.toISOString()}`);
    return defaultDate;
  }
  
  /**
   * Update last sync time for a connection
   * CRITICAL: This updates the connection record's lastSyncAt field
   * This ensures each connection tracks its own sync state independently
   * 
   * @param workspaceId - Workspace ID
   * @param provider - Provider name
   * @param nangoConnectionId - Connection ID to update
   * @param syncSuccessful - Whether the sync was successful (only update if true)
   */
  private static async updateLastSyncTime(
    workspaceId: string, 
    provider: string, 
    nangoConnectionId: string,
    syncSuccessful: boolean = true
  ) {
    if (!syncSuccessful) {
      console.log(`📧 [EMAIL SYNC] Sync was not successful, not updating lastSyncAt for connection ${nangoConnectionId}`);
      return;
    }
    
    try {
      // Update the connection record's lastSyncAt field
      // This is the source of truth for when this specific connection last synced
      await prisma.grand_central_connections.updateMany({
        where: {
          workspaceId,
          provider,
          nangoConnectionId,
          status: 'active'
        },
        data: {
          lastSyncAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ [EMAIL SYNC] Updated lastSyncAt for connection ${nangoConnectionId} (${provider})`);
    } catch (error) {
      console.error(`❌ [EMAIL SYNC] Failed to update lastSyncAt for connection ${nangoConnectionId}:`, error);
      // Don't throw - this is not critical enough to fail the sync
    }
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
