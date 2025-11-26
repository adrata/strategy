/**
 * 🧠 AI CONTEXT SERVICE
 * 
 * Modular service for building comprehensive AI context
 * Handles user, application, and data context assembly
 * 
 * 🚀 PERFORMANCE: Session-level caching to avoid rebuilding context per message
 */

// import { WorkspaceDataRouter } from '../../services/workspace-data-router';

import { authFetch } from '@/platform/api-fetch';
import { getPrismaClient } from '@/platform/database/connection-pool';

// 🚀 SESSION-LEVEL CONTEXT CACHE
// Caches full built context per user+workspace+record to avoid rebuilding every message
interface CachedSessionContext {
  context: EnhancedAIContext;
  timestamp: number;
  recordId?: string;
  appType: string;
}

const sessionContextCache = new Map<string, CachedSessionContext>();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of sessionContextCache.entries()) {
    if (now - cached.timestamp > SESSION_CACHE_TTL) {
      sessionContextCache.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface ListViewContext {
  visibleRecords: any[];
  activeSection: string;
  appliedFilters: {
    searchQuery?: string;
    verticalFilter?: string;
    statusFilter?: string;
    priorityFilter?: string;
    sortField?: string;
    sortDirection?: string;
    page?: number; // Current page number for pagination
    pageSize?: number; // Records per page
  };
  totalCount: number;
  lastUpdated: Date;
  currentPage?: number; // Explicit current page (if different from appliedFilters.page)
  totalPages?: number; // Total number of pages
}

export interface AIContextConfig {
  userId: string;
  workspaceId: string;
  appType: string;
  currentRecord?: any;
  recordType?: string;
  listViewContext?: ListViewContext;
  conversationHistory?: any[];
  documentContext?: any; // Add document context
}

export interface EnhancedAIContext {
  userContext: string;
  applicationContext: string;
  dataContext: string;
  recordContext: string;
  listViewContext: string;
  systemContext: string;
  documentContext: string; // Add document context
}

export class AIContextService {
  
  /**
   * Build comprehensive AI context from configuration
   * 🚀 OPTIMIZED: Uses session-level caching to avoid rebuilding every message
   */
  static async buildContext(config: AIContextConfig): Promise<EnhancedAIContext> {
    const {
      userId,
      workspaceId,
      appType,
      currentRecord,
      recordType,
      listViewContext,
      conversationHistory = [],
      documentContext
    } = config;

    const contextStartTime = Date.now();
    
    // 🚀 SESSION CACHE CHECK: Reuse cached context if same user/workspace/record
    const recordId = currentRecord?.id || 'no-record';
    const cacheKey = `${userId}-${workspaceId}-${recordId}`;
    const cached = sessionContextCache.get(cacheKey);
    
    if (cached && 
        (Date.now() - cached.timestamp) < SESSION_CACHE_TTL &&
        cached.appType === appType) {
      // Cache hit - reuse context but update list view context (it changes frequently)
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 [AIContextService] Using cached session context:', {
          cacheKey,
          cacheAge: `${Math.round((Date.now() - cached.timestamp) / 1000)}s`,
          recordId
        });
      }
      
      // Update only the parts that change frequently
      const updatedContext = {
        ...cached.context,
        listViewContext: this.buildListViewContext(listViewContext),
        documentContext: this.buildDocumentContext(documentContext),
        systemContext: await this.buildSystemContext(conversationHistory, userId)
      };
      
      return updatedContext;
    }

    // OPTIMIZATION: Parallelize independent context building operations
    // Build synchronous contexts first (no DB queries)
    const applicationContext = this.buildApplicationContext(appType);
    const listViewContextString = this.buildListViewContext(listViewContext);
    const documentContextString = this.buildDocumentContext(documentContext);

    // 🏆 FIX: Add individual timeouts to each context builder to prevent hanging
    // OPTIMIZATION: Parallelize all async context building (independent operations) with timeout protection
    // Reduced from 15s to 5s for faster perceived performance - fallbacks provide graceful degradation
    const contextBuilderTimeout = 5000; // 5 seconds max per context builder
    
    const createTimeoutPromise = (ms: number) => 
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Context builder timeout after ${ms}ms`)), ms));
    
    const [userContext, dataContext, recordContext, systemContext] = await Promise.all([
      Promise.race([
        this.buildUserContext(userId, workspaceId),
        createTimeoutPromise(contextBuilderTimeout)
      ]).catch((error) => {
        console.warn('⚠️ [AIContextService] User context build timed out, using fallback:', error);
        return `CURRENT USER CONTEXT:\n- User ID: ${userId}\n- Workspace: ${workspaceId}`;
      }),
      Promise.race([
        this.buildDataContext(appType, workspaceId, userId),
        createTimeoutPromise(contextBuilderTimeout)
      ]).catch((error) => {
        console.warn('⚠️ [AIContextService] Data context build timed out, using fallback:', error);
        return `DATA CONTEXT: Unable to load workspace data (timeout).`;
      }),
      Promise.race([
        this.buildRecordContext(currentRecord, recordType, workspaceId),
        createTimeoutPromise(contextBuilderTimeout)
      ]).catch((error) => {
        console.warn('⚠️ [AIContextService] Record context build timed out, using fallback:', error);
        return currentRecord ? `RECORD CONTEXT: ${currentRecord.name || currentRecord.fullName || 'Current record'}` : '';
      }),
      Promise.race([
        this.buildSystemContext(conversationHistory, userId),
        createTimeoutPromise(contextBuilderTimeout)
      ]).catch((error) => {
        console.warn('⚠️ [AIContextService] System context build timed out, using fallback:', error);
        return 'SYSTEM CONTEXT: Conversation history unavailable (timeout).';
      })
    ]);

    const contextBuildTime = Date.now() - contextStartTime;
    if (contextBuildTime > 2000) {
      console.warn(`⚠️ [AIContextService] Context build took ${contextBuildTime}ms (target: <2000ms)`);
    }

    // Build the final context object
    const builtContext: EnhancedAIContext = {
      userContext,
      applicationContext,
      dataContext,
      recordContext,
      listViewContext: listViewContextString,
      documentContext: documentContextString,
      systemContext
    };
    
    // 🚀 CACHE: Store built context for session reuse
    sessionContextCache.set(cacheKey, {
      context: builtContext,
      timestamp: Date.now(),
      recordId,
      appType
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [AIContextService] Context built and cached:', {
        cacheKey,
        buildTime: `${contextBuildTime}ms`,
        recordId
      });
    }
    
    return builtContext;
  }
  
  /**
   * Clear session context cache for a specific user/workspace or all
   * Call this when user logs out, workspace changes, or context needs refresh
   */
  static clearSessionCache(userId?: string, workspaceId?: string): void {
    if (userId && workspaceId) {
      // Clear specific user's cache entries
      for (const key of sessionContextCache.keys()) {
        if (key.startsWith(`${userId}-${workspaceId}`)) {
          sessionContextCache.delete(key);
        }
      }
      console.log(`🧹 [AIContextService] Cleared session cache for user ${userId} in workspace ${workspaceId}`);
    } else {
      // Clear all cache
      sessionContextCache.clear();
      console.log('🧹 [AIContextService] Cleared all session context cache');
    }
  }

  /**
   * Build user-specific context including personality preferences
   */
  private static async buildUserContext(userId: string, workspaceId: string): Promise<string> {
    // Fetch user's name from database
    let userName = 'the user';
    let userEmail = '';
    try {
      const prisma = getPrismaClient();
      
      // 🏆 FIX: Add timeout to user query (5 seconds max)
      const userQueryTimeout = 5000;
      const userQueryPromise = prisma.users.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      });
      
      const user = await Promise.race([
        userQueryPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('User query timeout')), userQueryTimeout))
      ]).catch(() => null);
      
      if (user) {
        // Use firstName for signature (e.g., "Best regards, Victoria")
        userName = user.firstName || 
                   (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.lastName || 'the user');
        userEmail = user.email || '';
      }
    } catch (error) {
      console.warn('⚠️ [AIContextService] Failed to fetch user name:', error);
    }
    
    let userContext = `CURRENT USER CONTEXT:
- User ID: ${userId}
- User Name: ${userName}${userEmail ? ` (${userEmail})` : ''}
- Workspace: ${workspaceId}
- This is a PRODUCTION environment with REAL data
- User expects context-aware responses about their current view

CRITICAL RESPONSE FORMATTING:
- This is a CHAT conversation, NOT an email
- DO NOT add email-style signatures like "Best regards, ${userName}" or "Sincerely, ${userName}"
- DO NOT add closing signatures at the end of responses
- Chat messages should end naturally without formal closings
- Only use signatures when explicitly asked to draft an EMAIL (not for chat responses)
- Keep responses conversational and natural, like a chat assistant`;

      // Get user personality preferences
    try {
      const prisma = getPrismaClient();
      
      // Check if user_ai_preferences table exists before querying
      let userPreferences = null;
      if (prisma.user_ai_preferences && typeof prisma.user_ai_preferences.findFirst === 'function') {
        // 🏆 FIX: Add timeout to preferences query (5 seconds max)
        const preferencesQueryTimeout = 5000;
        userPreferences = await Promise.race([
          prisma.user_ai_preferences.findFirst({
            where: {
              userId,
              workspaceId
            }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Preferences query timeout')), preferencesQueryTimeout))
        ]).catch(() => null);

      } else {
        console.log('ℹ️ [AIContextService] user_ai_preferences table not available');
      }
      
      if (userPreferences && userPreferences.isActive) {
        userContext += `\n\nUSER PERSONALITY PREFERENCES:
- Personality: ${userPreferences.personalityName}
- Tone: ${userPreferences.tone}
- Style: ${userPreferences.style}
- Use Emojis: ${userPreferences.useEmojis ? 'Yes' : 'No'}

PERSONALITY INSTRUCTIONS:
You MUST respond with the following personality characteristics:
- TONE: ${userPreferences.tone}
- STYLE: ${userPreferences.style}
- EMOJI USAGE: ${userPreferences.useEmojis ? 'Use emojis appropriately in responses' : 'Do NOT use emojis in responses'}

${userPreferences.customPrompt ? `CUSTOM PERSONALITY GUIDANCE:
${userPreferences.customPrompt}

CRITICAL: You MUST follow these custom personality instructions exactly. This defines how you should interact with this specific user.` : ''}

RESPONSE REQUIREMENTS:
- Every response must reflect the ${userPreferences.personalityName} personality
- Use the specified tone: ${userPreferences.tone}
- Maintain the specified style: ${userPreferences.style}
- ${userPreferences.useEmojis ? 'Include emojis when appropriate' : 'Never use emojis'}
- Be consistent with this personality in all interactions`;
      }
      
      } catch (error) {
      console.warn('⚠️ [AI CONTEXT] Failed to load user preferences:', error);
    }

    return userContext;
  }

  /**
   * Build application-specific context
   */
  private static buildApplicationContext(appType: string): string {
    const appContexts = {
      'Speedrun': {
        description: 'THE DAILY LIST - ranked prospects to contact today',
        purpose: 'Daily prioritized prospect list that always exists. Shows prospects ranked by strategic priority (Rank 1, Rank 2, etc.). Main workflow for daily revenue activities.',
        features: 'Ranked prospect list, prospect details (name, company, stage, actions, last contact), priority ranking, daily workflow tracking',
        behavior: 'CRITICAL: Speedrun IS the daily list - it always exists (may be empty but Speedrun itself exists). When users say "Speedrun", "my list", "daily list", or "today\'s list" - they mean THIS existing list. NEVER say "Speedrun doesn\'t exist" or "you need to create Speedrun". If empty, say "Your Speedrun list appears empty" and help them add prospects. Provide insights about prospects in their Speedrun list, help prioritize, suggest actions, and explain rankings.',
        keyUnderstanding: 'Speedrun = daily prioritized prospect list that already exists. Not a campaign to create. Users work through this ranked list daily.'
      },
      'Pipeline': {
        description: 'Lead and opportunity management system',
        purpose: 'Manage leads through qualification, track opportunities through sales stages, and optimize pipeline health',
        features: 'Lead details, opportunity stages, pipeline analytics, conversion tracking, CRUD operations',
        behavior: 'Help with lead qualification, opportunity progression, pipeline analysis, and data operations. Focus on moving leads through stages and closing deals.',
        keyUnderstanding: 'Pipeline tracks the full sales journey from lead to closed deal. Includes leads, prospects, opportunities, and clients.'
      },
      'Monaco': {
        description: 'Buyer group intelligence and strategic sales platform',
        purpose: 'Strategic sales intelligence, buyer group analysis, and relationship mapping for complex B2B sales',
        features: 'Buyer group intelligence, relationship mapping, strategic insights, enrichment data, analytics',
        behavior: 'Provide strategic insights about buyer groups, decision-making processes, and relationship dynamics. Help identify key stakeholders and engagement strategies.',
        keyUnderstanding: 'Monaco focuses on understanding buyer groups and decision-making processes in complex B2B sales scenarios.'
      }
    };

    const context = appContexts[appType as keyof typeof appContexts] || appContexts['Pipeline'];

    return `CURRENT APPLICATION STATE:
- Application: ${appType}
- Description: ${context.description}
- Purpose: ${context.purpose}
- User can see: ${context.features}
- Key understanding: ${context.keyUnderstanding}
- Expected AI behavior: ${context.behavior}

ADRATA PLATFORM OVERVIEW:
- Built with Next.js 15, React 19, TypeScript
- Core applications: Speedrun (daily list), Pipeline (lead/opportunity management), Monaco (buyer group intelligence)
- Platform supports web, desktop (Tauri), and mobile (Capacitor)
- Includes AI-powered insights, enrichment data, and intelligent automation

DATABASE SCHEMA:
- People/Leads: Contact info (name, email, company, title, status, priority)
- Companies: Company data, relationships, industry info
- Opportunities: Deal stages, values, close dates, probability
- Users/Workspaces: Accounts, permissions, data isolation (workspaceId)
- Key relationships: People → Companies, Leads → Opportunities, Users → Workspaces

CAPABILITIES:
- CREATE: Leads, opportunities, notes, tasks, contacts
- READ: Query data, generate insights, analyze patterns
- UPDATE: Status, priority, stages, notes, relationships
- DELETE: Archive outdated records (with validation)
- BUSINESS RULES: Understands validation, required fields, workflow constraints`;
  }

  /**
   * Build data context by fetching real application data
   */
  private static async buildDataContext(appType: string, workspaceId: string, userId: string): Promise<string> {
    try {
      let dataContext = '';
      
      // Import the workspace context service
      const { WorkspaceContextService } = await import('./EnhancedWorkspaceContextService');
      
      // Build comprehensive workspace context (CRITICAL: Seller/Company profile)
      const workspaceContext = await WorkspaceContextService.buildWorkspaceContext(workspaceId);
      
      if (workspaceContext) {
        dataContext = WorkspaceContextService.buildAIContextString(workspaceContext);
        
        // Log seller context for verification
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [AIContextService] Seller/Company context included:', {
            companyName: workspaceContext.workspace.name,
            hasProducts: !!(workspaceContext.workspace.productPortfolio?.length || workspaceContext.workspace.serviceOfferings?.length),
            hasValueProps: !!workspaceContext.workspace.valuePropositions?.length,
            hasIdealCustomer: !!workspaceContext.workspace.idealCustomerProfile,
            contextLength: dataContext.length
          });
        }
      } else {
        // Fallback: Build minimal seller context from workspace name
        try {
          const prisma = getPrismaClient();
          const workspace = await prisma.workspaces.findUnique({
            where: { id: workspaceId },
            select: { name: true, industry: true, description: true }
          });
          
          if (workspace) {
            dataContext = `=== SELLER/COMPANY PROFILE (WHO YOU ARE HELPING) ===
Company Name: ${workspace.name}
Industry: ${workspace.industry || 'Professional Services'}
Description: ${workspace.description || `${workspace.name} is a professional services company`}

CRITICAL: You are helping ${workspace.name}. Frame all advice from their perspective as the seller.`;
          }
        } catch (error) {
          console.warn('⚠️ [AIContextService] Failed to build fallback seller context:', error);
        }
      }
      
      if (appType === 'Speedrun') {
        // 🏆 OPTIMIZATION: Skip slow Speedrun data fetch to improve response time
        // Add succinct Speedrun context (detailed definition already in buildApplicationContext)
        dataContext += `\n\nSPEEDRUN DATA CONTEXT:
- Speedrun = daily prioritized prospect list (always exists, may be empty)
- Prospects ranked by strategic priority (Rank 1 = highest priority)
- Each prospect shows: name, company, stage (LEAD/PROSPECT/OPPORTUNITY), actions count, last contact date
- Users work through list daily in priority order
- If list appears empty: say "Your Speedrun list appears empty" (not "Speedrun doesn't exist")
- Help users add prospects to Speedrun if empty, or prioritize/contact existing prospects`;
      } else if (appType === 'Pipeline') {
        const pipelineData = await this.fetchPipelineData(workspaceId, userId);
        if (pipelineData) {
          const leadsCount = pipelineData.leads?.length || 0;
          const opportunitiesCount = pipelineData.opportunities?.length || 0;
          const qualifiedLeads = pipelineData.leads?.filter((l: any) => l['status'] === 'qualified')?.length || 0;
          const activeOpportunities = pipelineData.opportunities?.filter((o: any) => o.stage !== 'closed-lost' && o.stage !== 'closed-won')?.length || 0;
          
          // Append to existing seller context (don't replace it)
          dataContext += `\n\nREAL PIPELINE DATA CONTEXT:
- Total Leads: ${leadsCount}
- Qualified Leads: ${qualifiedLeads}
- Total Opportunities: ${opportunitiesCount}
- Active Opportunities: ${activeOpportunities}
- User's actual pipeline data is loaded and visible
- Provide insights based on this REAL data, not hypothetical examples
- Reference specific lead/opportunity counts and pipeline health in responses`;

          // Add sample lead names for context
          if (pipelineData.leads?.length > 0) {
            const sampleLeads = pipelineData.leads.slice(0, 5).map((l: any) => `${l.fullName || l.firstName + ' ' + l.lastName} at ${l.company || 'Unknown Company'}`).join(', ');
            dataContext += `\n- Sample leads in pipeline: ${sampleLeads}`;
          }

          // Add opportunity context
          if (pipelineData.opportunities?.length > 0) {
            const totalValue = pipelineData.opportunities.reduce((sum: number, o: any) => sum + (o.value || 0), 0);
            dataContext += `\n- Total pipeline value: $${totalValue.toLocaleString()}`;
          }
        }
      }

      // Ensure seller context is always present (even if minimal)
      if (!dataContext || dataContext.trim().length < 50) {
        // Last resort fallback
        try {
          const prisma = getPrismaClient();
          const workspace = await prisma.workspaces.findUnique({
            where: { id: workspaceId },
            select: { name: true }
          });
          
          if (workspace) {
            dataContext = `=== SELLER/COMPANY PROFILE (WHO YOU ARE HELPING) ===
Company Name: ${workspace.name}

CRITICAL: You are helping ${workspace.name}. Frame all advice from their perspective as the seller.`;
          }
        } catch (fallbackError) {
          console.warn('⚠️ [AIContextService] Failed to build last-resort seller context:', fallbackError);
        }
      }
      
      return dataContext || 'DATA CONTEXT: General sales guidance available';
    } catch (error) {
      console.warn(`⚠️ Failed to fetch ${appType} data for context:`, error);
      
      // Even on error, try to provide seller context
      try {
        const prisma = getPrismaClient();
        const workspace = await prisma.workspaces.findUnique({
          where: { id: workspaceId },
          select: { name: true }
        });
        
        if (workspace) {
          return `=== SELLER/COMPANY PROFILE (WHO YOU ARE HELPING) ===
Company Name: ${workspace.name}

CRITICAL: You are helping ${workspace.name}. Frame all advice from their perspective as the seller.`;
        }
      } catch (fallbackError) {
        // Ignore fallback errors
      }
      
      return `DATA CONTEXT: Unable to fetch real-time data, using general guidance`;
    }
  }

  /**
   * Build record-specific context with structured extraction and strategic fit analysis
   * Now async to fetch company intelligence for person records
   */
  private static async buildRecordContext(
    currentRecord: any, 
    recordType: string | null,
    workspaceId: string
  ): Promise<string> {
    // 🔍 ENHANCED LOGGING: Track what record context is being built
    console.log('🎯 [AIContextService] Building record context:', {
      hasCurrentRecord: !!currentRecord,
      recordType,
      recordId: currentRecord?.id,
      recordName: currentRecord?.fullName || currentRecord?.name,
      recordCompany: currentRecord?.company || currentRecord?.companyName,
      recordTitle: currentRecord?.title || currentRecord?.jobTitle,
      recordFieldCount: currentRecord ? Object.keys(currentRecord).length : 0,
      recordKeys: currentRecord ? Object.keys(currentRecord).slice(0, 20) : [],
      // 🔍 REAL DATA VERIFICATION: Log key fields to confirm we have real record data
      hasRealData: currentRecord ? {
        hasId: !!currentRecord.id,
        hasName: !!(currentRecord.name || currentRecord.fullName),
        hasCompany: !!(currentRecord.company || currentRecord.companyName),
        hasTitle: !!(currentRecord.title || currentRecord.jobTitle),
        hasEmail: !!currentRecord.email,
        hasPhone: !!currentRecord.phone,
        hasDescription: !!currentRecord.description,
        hasIndustry: !!currentRecord.industry,
        hasWebsite: !!currentRecord.website,
        hasIntelligence: !!(currentRecord.monacoEnrichment || currentRecord.personIntelligence || currentRecord.leadIntelligence)
      } : null
    });

    if (!currentRecord || !recordType) {
      console.warn('⚠️ [AIContextService] No record context available - returning general guidance', {
        hasCurrentRecord: !!currentRecord,
        recordType,
        currentRecordKeys: currentRecord ? Object.keys(currentRecord) : []
      });
      return `GENERAL APPLICATION CONTEXT:
- No specific record selected
- Provide general guidance about methodology and best practices
- Help with overall strategy and workflow optimization`;
    }
    
    // 🔧 FIX: Ensure record has required fields
    if (!currentRecord.id) {
      console.warn('⚠️ [AIContextService] Record missing ID field:', {
        recordKeys: Object.keys(currentRecord),
        recordName: currentRecord.name || currentRecord.fullName
      });
    }

    const recordName = currentRecord.fullName || currentRecord.name || 'Unknown';
    const recordCompany = currentRecord.company || currentRecord.companyName || (recordType === 'companies' ? recordName : 'Unknown Company');
    const recordTitle = currentRecord.title || currentRecord.jobTitle || 'Unknown Title';
    
    // 🔍 LOG RECORD DATA COMPLETENESS
    console.log('🔍 [AIContextService] Record data completeness:', {
      hasName: !!recordName,
      hasCompany: !!recordCompany,
      hasIndustry: !!currentRecord.industry,
      hasDescription: !!currentRecord.description,
      hasWebsite: !!currentRecord.website,
      hasEmployeeCount: !!(currentRecord.employeeCount || currentRecord.size),
      descriptionLength: currentRecord.description?.length || 0
    });
    
    // Build structured context based on record type
    let context;
    if (recordType === 'companies') {
      context = `=== CURRENT RECORD (WHO THEY ARE) ===
Company: ${recordName}
Industry: ${currentRecord.industry || 'Unknown'}
Size: ${currentRecord.size || currentRecord.employeeCount || 'Unknown'} employees
Location: ${currentRecord.city || ''} ${currentRecord.state || ''} ${currentRecord.country || ''}
Website: ${currentRecord.website || 'Not available'}
Founded: ${currentRecord.foundedYear || 'Unknown'}
Revenue: ${currentRecord.revenue ? `$${currentRecord.revenue.toLocaleString()}` : 'Unknown'}
Public/Private: ${currentRecord.isPublic ? 'Public' : 'Private'}
Stock Symbol: ${currentRecord.stockSymbol || 'N/A'}

What They Do: ${currentRecord.description || 'Company description not available'}
Tech Stack: ${currentRecord.techStack?.join(', ') || 'Not specified'}
Technologies Used: ${currentRecord.technologiesUsed?.join(', ') || 'Not specified'}

Business Intelligence:
- Business Challenges: ${currentRecord.businessChallenges?.join(', ') || 'Not specified'}
- Business Priorities: ${currentRecord.businessPriorities?.join(', ') || 'Not specified'}
- Competitive Advantages: ${currentRecord.competitiveAdvantages?.join(', ') || 'Not specified'}
- Growth Opportunities: ${currentRecord.growthOpportunities?.join(', ') || 'Not specified'}
- Strategic Initiatives: ${currentRecord.strategicInitiatives?.join(', ') || 'Not specified'}
- Market Position: ${currentRecord.marketPosition || 'Not specified'}

Strategic Fit Analysis:
- This company operates in ${currentRecord.industry || 'an unknown industry'}
- Company size of ${currentRecord.employeeCount || 'unknown'} employees
- ${currentRecord.isPublic ? 'Publicly traded' : 'Privately held'} company
- ${currentRecord.techStack?.length ? `Uses technologies: ${currentRecord.techStack.join(', ')}` : 'Technology stack not specified'}
- ${currentRecord.businessChallenges?.length ? `Faces challenges: ${currentRecord.businessChallenges.join(', ')}` : 'Business challenges not specified'}

CRITICAL: The user is looking at company ${recordName} RIGHT NOW. Your responses should be specific to this company and its business context.

COMPLETE COMPANY RECORD DATA (All Available Fields):
The following is the complete company record data available. Use ALL of this information when providing responses:
${JSON.stringify(currentRecord, null, 2).substring(0, 5000)}${JSON.stringify(currentRecord, null, 2).length > 5000 ? '\n... (truncated for length, but all key fields are included above)' : ''}`;
    } else {
      // Enhanced person/lead record context
      // 🔍 GET PERSON/LEAD INTELLIGENCE FROM DATABASE: Read stored intelligence from database
      let personIntelligence = null;
      let leadIntelligence = null;
      
      // Determine record type and fetch appropriate intelligence
      // 🔧 FIX: Include 'speedrun' as a person type - Speedrun records are people/prospects
      const isPersonType = recordType === 'people' || recordType === 'person' || recordType === 'speedrun' || recordType === 'speedrun-prospect' || recordType?.includes('person') || recordType?.includes('speedrun');
      const isLeadType = recordType === 'leads' || recordType === 'lead' || recordType?.includes('lead');
      const isProspectType = recordType === 'prospects' || recordType === 'prospect' || recordType?.includes('prospect') || recordType === 'speedrun';
      const isOpportunityType = recordType === 'opportunities' || recordType === 'opportunity' || recordType?.includes('opportunity');
      
      console.log('🔍 [AIContextService] Record type analysis:', {
        recordType,
        isPersonType,
        isLeadType,
        isProspectType,
        isOpportunityType,
        hasRecordId: !!currentRecord.id,
        recordId: currentRecord.id
      });
      
      if (currentRecord.id && isPersonType) {
        console.log('🔍 [AIContextService] Reading person intelligence from database for:', currentRecord.id, 'recordType:', recordType);
        try {
          personIntelligence = await this.getPersonIntelligenceFromDatabase(currentRecord.id, workspaceId);
          if (personIntelligence) {
            console.log('✅ [AIContextService] Successfully retrieved person intelligence from database:', {
              hasInfluenceLevel: !!personIntelligence.influenceLevel,
              hasDecisionPower: !!personIntelligence.decisionPower,
              hasPainPoints: !!personIntelligence.painPoints?.length,
              hasMotivations: !!personIntelligence.motivations?.length
            });
          } else {
            console.log('⚠️ [AIContextService] No person intelligence found in database for:', currentRecord.id);
          }
        } catch (error) {
          console.warn('⚠️ [AIContextService] Failed to read person intelligence from database:', error);
        }
      } else if (currentRecord.id && (isLeadType || isProspectType)) {
        // Prospects are often stored as leads, so use lead intelligence
        console.log('🔍 [AIContextService] Reading lead/prospect intelligence from database for:', currentRecord.id, 'recordType:', recordType);
        try {
          leadIntelligence = await this.getLeadIntelligenceFromDatabase(currentRecord.id, workspaceId);
          if (leadIntelligence) {
            console.log('✅ [AIContextService] Successfully retrieved lead/prospect intelligence from database');
          } else {
            console.log('⚠️ [AIContextService] No lead/prospect intelligence found in database for:', currentRecord.id);
          }
        } catch (error) {
          console.warn('⚠️ [AIContextService] Failed to read lead/prospect intelligence from database:', error);
        }
      } else if (currentRecord.id && isOpportunityType) {
        console.log('🔍 [AIContextService] Reading opportunity intelligence from database for:', currentRecord.id);
        try {
          leadIntelligence = await this.getOpportunityIntelligenceFromDatabase(currentRecord.id, workspaceId);
          if (leadIntelligence) {
            console.log('✅ [AIContextService] Successfully retrieved opportunity intelligence from database');
          } else {
            console.log('⚠️ [AIContextService] No opportunity intelligence found in database for:', currentRecord.id);
          }
        } catch (error) {
          console.warn('⚠️ [AIContextService] Failed to read opportunity intelligence from database:', error);
        }
      } else {
        console.log('⚠️ [AIContextService] No intelligence lookup - recordType:', recordType, 'hasRecordId:', !!currentRecord.id);
      }
      
      // Use stored intelligence if available, otherwise infer from record data
      const seniority = personIntelligence?.seniority || currentRecord.seniority || this.inferSeniority(recordTitle);
      const department = personIntelligence?.department || currentRecord.department || this.inferDepartment(recordTitle);
      const decisionPower = personIntelligence?.decisionPower || currentRecord.decisionPower || this.inferDecisionPower(recordTitle, seniority);
      const buyerGroupRole = personIntelligence?.buyerGroupRole || leadIntelligence?.buyerGroupRole || currentRecord.buyerGroupRole || this.inferBuyerGroupRole(recordTitle, department);
      
      // Extract Monaco enrichment data for comprehensive context
      const monacoData = currentRecord.monacoEnrichment || {};
      const buyerGroupAnalysis = monacoData.buyerGroupAnalysis || {};
      
      // Use stored intelligence pain points/motivations if available, otherwise use Monaco data
      const painPoints = personIntelligence?.painPoints || leadIntelligence?.painPoints || monacoData.painPoints || buyerGroupAnalysis.painPoints || [];
      const motivations = personIntelligence?.motivations || leadIntelligence?.motivations || monacoData.motivations || buyerGroupAnalysis.motivations || [];
      const decisionFactors = personIntelligence?.decisionFactors || leadIntelligence?.decisionFactors || monacoData.decisionFactors || buyerGroupAnalysis.decisionFactors || [];
      let companyIntelligence = monacoData.companyIntelligence || {};
      
      // 🔍 GET COMPANY INTELLIGENCE FROM DATABASE: Read stored intelligence from database
      if ((!companyIntelligence.industry && !companyIntelligence.description) && recordCompany && recordCompany !== 'Unknown Company') {
        console.log('🔍 [AIContextService] Reading company intelligence from database for:', recordCompany);
        try {
          const storedIntelligence = await this.getCompanyIntelligenceFromDatabase(recordCompany, workspaceId);
          if (storedIntelligence) {
            companyIntelligence = storedIntelligence;
            console.log('✅ [AIContextService] Successfully retrieved company intelligence from database:', {
              hasIndustry: !!companyIntelligence.industry,
              hasDescription: !!companyIntelligence.description,
              hasEmployeeCount: !!companyIntelligence.employeeCount,
              hasStrategicIntelligence: !!companyIntelligence.strategicIntelligence
            });
          } else {
            console.log('⚠️ [AIContextService] No stored intelligence found for company:', recordCompany);
            // Note: Intelligence should be generated and stored via the intelligence API endpoint
            // We don't generate it on-the-fly here to keep the database fresh
          }
        } catch (error) {
          console.warn('⚠️ [AIContextService] Failed to read company intelligence from database:', error);
          // Continue with existing context - don't fail the request
        }
      }
      
      // Build comprehensive context string
      context = `=== CURRENT RECORD (WHO THEY ARE) ===
Name: ${recordName} at ${recordCompany}
Title: ${recordTitle}
Department: ${department}
Seniority: ${seniority}
Decision Authority: ${decisionPower}
Buying Committee Role: ${buyerGroupRole}
Email: ${currentRecord.email || currentRecord.workEmail || 'Not available'}
Phone: ${currentRecord.phone || currentRecord.workPhone || 'Not available'}
LinkedIn: ${currentRecord.linkedinUrl || currentRecord.linkedin || 'Not available'}

${currentRecord.bio ? `Bio/Background: ${currentRecord.bio}` : ''}
${currentRecord.interests && Array.isArray(currentRecord.interests) && currentRecord.interests.length > 0 ? `Interests: ${currentRecord.interests.join(', ')}` : ''}
${currentRecord.recentActivity ? `Recent Activity: ${currentRecord.recentActivity}` : ''}
${currentRecord.relationship ? `Relationship Status: ${currentRecord.relationship}` : ''}
${currentRecord.lastContact ? `Last Contact: ${currentRecord.lastContact}` : ''}
${currentRecord.nextAction ? `Next Action: ${currentRecord.nextAction}` : ''}
${currentRecord.priority ? `Priority: ${currentRecord.priority}` : ''}
${currentRecord.status ? `Status: ${currentRecord.status}` : ''}

Company Context:
- Company: ${recordCompany}
- Industry: ${currentRecord.company?.industry || companyIntelligence.industry || 'Unknown'}
- Size: ${currentRecord.company?.employeeCount || currentRecord.company?.size || companyIntelligence.employeeCount || companyIntelligence.size || 'Unknown'} employees
- Location: ${currentRecord.city || ''} ${currentRecord.state || ''} ${currentRecord.country || ''}
${currentRecord.company?.website || companyIntelligence.website ? `- Website: ${currentRecord.company?.website || companyIntelligence.website}` : ''}
${currentRecord.company?.description || companyIntelligence.description ? `- Description: ${currentRecord.company?.description || companyIntelligence.description}` : ''}
${companyIntelligence.strategicIntelligence ? `- Strategic Intelligence: ${companyIntelligence.strategicIntelligence}` : ''}
${companyIntelligence.strategicWants && companyIntelligence.strategicWants.length > 0 ? `- Strategic Wants: ${companyIntelligence.strategicWants.join(', ')}` : ''}
${companyIntelligence.criticalNeeds && companyIntelligence.criticalNeeds.length > 0 ? `- Critical Needs: ${companyIntelligence.criticalNeeds.join(', ')}` : ''}
${companyIntelligence.adrataStrategy ? `- Adrata Strategy: ${companyIntelligence.adrataStrategy}` : ''}

Role Analysis:
- This person is a ${seniority} ${recordTitle} in ${department}
- Decision power level: ${decisionPower}
- Likely role in buying process: ${buyerGroupRole}
- ${this.getEngagementAdvice(decisionPower, buyerGroupRole)}

Strategic Fit Analysis:
- Person works at ${recordCompany} (${currentRecord.company?.industry || companyIntelligence.industry || 'unknown industry'})
- Role suggests ${this.getRoleInsights(recordTitle, department)}
- Decision authority indicates ${this.getDecisionInsights(decisionPower)}
- Buying role suggests ${this.getBuyingInsights(buyerGroupRole)}

${painPoints.length > 0 ? `Identified Pain Points:\n${painPoints.map((p: string) => `- ${p}`).join('\n')}` : ''}
${motivations.length > 0 ? `Key Motivations:\n${motivations.map((m: string) => `- ${m}`).join('\n')}` : ''}
${decisionFactors.length > 0 ? `Decision Factors:\n${decisionFactors.map((d: string) => `- ${d}`).join('\n')}` : ''}
${buyerGroupAnalysis.role ? `Buyer Group Role: ${buyerGroupAnalysis.role}` : ''}
${buyerGroupAnalysis.influenceLevel ? `Influence Level: ${buyerGroupAnalysis.influenceLevel}` : ''}

${personIntelligence ? `PERSON INTELLIGENCE (from database):
- Influence Level: ${personIntelligence.influenceLevel || 'Not specified'}
- Engagement Level: ${personIntelligence.engagementLevel || 'Not specified'}
- Intelligence Confidence: ${personIntelligence.confidence ? `${personIntelligence.confidence}%` : 'Not specified'}
${personIntelligence.reasoning ? `- Intelligence Reasoning: ${personIntelligence.reasoning}` : ''}
${personIntelligence.intelligenceGeneratedAt ? `- Generated: ${new Date(personIntelligence.intelligenceGeneratedAt).toLocaleDateString()}` : ''}` : ''}

${leadIntelligence ? `${isProspectType ? 'PROSPECT' : isOpportunityType ? 'OPPORTUNITY' : 'LEAD'} INTELLIGENCE (from database):
- Influence Level: ${leadIntelligence.influenceLevel || 'Not specified'}
- Engagement Strategy: ${leadIntelligence.engagementStrategy || 'Not specified'}
- Seniority: ${leadIntelligence.seniority || 'Not specified'}
- Buyer Group Member: ${leadIntelligence.isBuyerGroupMember ? 'Yes' : 'No'}
${isOpportunityType && currentRecord.stage ? `- Opportunity Stage: ${currentRecord.stage}` : ''}
${isOpportunityType && currentRecord.value ? `- Opportunity Value: $${currentRecord.value.toLocaleString()}` : ''}
${isOpportunityType && currentRecord.closeDate ? `- Close Date: ${new Date(currentRecord.closeDate).toLocaleDateString()}` : ''}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: YOU HAVE COMPLETE CONTEXT - USE IT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The user is viewing ${recordName} at ${recordCompany} RIGHT NOW. You have ALL the information you need above:
- Complete person details (name, title, company, contact info)
- Company intelligence (industry, size, location, description)
- Person intelligence (influence level, engagement strategy, pain points, motivations)
- Engagement history and next actions
- Complete record data (all fields shown above)

FORBIDDEN RESPONSES - DO NOT USE THESE PHRASES:
- "I don't have enough context"
- "I need more information"
- "I don't have visibility into"
- "I don't have access to"
- "I can't see"
- "I'm not able to see"
- Any variation suggesting you lack context

YOU HAVE COMPLETE CONTEXT. The record data above contains ALL available information. Use it to provide specific, personalized, actionable advice. Reference specific details from the context above (their name, company, role, pain points, motivations, etc.) in your response.

EXACTLY WHAT THE USER IS SEEING:
- Record Type: ${recordType || 'Unknown'}
- Record Name: ${recordName}
- Company: ${recordCompany}
- Title: ${recordTitle || 'Not specified'}
- Status: ${currentRecord.status || 'Not specified'}
- Priority: ${currentRecord.priority || 'Not specified'}
${currentRecord.email ? `- Email: ${currentRecord.email}` : ''}
${currentRecord.phone ? `- Phone: ${currentRecord.phone}` : ''}
${isOpportunityType ? `- Stage: ${currentRecord.stage || 'Not specified'}` : ''}
${isOpportunityType ? `- Value: ${currentRecord.value ? `$${currentRecord.value.toLocaleString()}` : 'Not specified'}` : ''}
${isOpportunityType ? `- Close Date: ${currentRecord.closeDate ? new Date(currentRecord.closeDate).toLocaleDateString() : 'Not specified'}` : ''}
- This is the exact record the user has open and is viewing right now.

COMPLETE RECORD DATA (All Available Fields):
The following is the complete record data available. Use ALL of this information when providing responses:
${JSON.stringify(currentRecord, null, 2).substring(0, 5000)}${JSON.stringify(currentRecord, null, 2).length > 5000 ? '\n... (truncated for length, but all key fields are included above)' : ''}`;
    }

    // Add enrichment context if available (now with detailed extraction)
    if (currentRecord.monacoEnrichment) {
      const monacoData = currentRecord.monacoEnrichment;
      const buyerGroupAnalysis = monacoData.buyerGroupAnalysis || {};
      
      context += `\n\nMONACO ENRICHMENT DATA AVAILABLE:
- This record has been enriched with Monaco intelligence
- Buyer Group Analysis: ${buyerGroupAnalysis.role || 'Available'}
- Influence Level: ${buyerGroupAnalysis.influenceLevel || 'Available'}
- Pain Points: ${monacoData.painPoints?.length || buyerGroupAnalysis.painPoints?.length || 0} identified
- Motivations: ${monacoData.motivations?.length || buyerGroupAnalysis.motivations?.length || 0} identified
- Decision Factors: ${monacoData.decisionFactors?.length || buyerGroupAnalysis.decisionFactors?.length || 0} identified
- Use this data to provide highly personalized recommendations
- Reference specific pain points, motivations, and decision factors
- Leverage buyer group analysis and opportunity intelligence`;
    }

    // 🔧 NEW: Extract intelligence from customFields (where strategy/intelligence data is stored)
    if (currentRecord.customFields) {
      const cf = currentRecord.customFields;
      const hasStrategicIntel = cf.strategySummary || cf.strategySituation || cf.strategyComplication || cf.strategyFutureState;
      const cfPainPoints = cf.painPoints || [];
      const cfGoals = cf.goals || [];
      const cfChallenges = cf.challenges || [];
      const cfOpportunities = cf.opportunities || [];
      
      if (hasStrategicIntel || cfPainPoints.length > 0 || cfGoals.length > 0) {
        context += `\n\n=== STRATEGIC INTELLIGENCE (from customFields) ===`;
        
        if (cf.strategySummary) {
          context += `\nStrategy Summary: ${cf.strategySummary}`;
        }
        if (cf.strategySituation) {
          context += `\nSituation: ${cf.strategySituation}`;
        }
        if (cf.strategyComplication || cf.complications) {
          context += `\nComplication/Pain: ${cf.strategyComplication || cf.complications}`;
        }
        if (cf.strategyFutureState) {
          context += `\nDesired Future State: ${cf.strategyFutureState}`;
        }
        if (cf.buyerGroupArchetype) {
          context += `\nBuyer Archetype: ${cf.buyerGroupArchetype}`;
        }
        if (cf.industryContext) {
          context += `\nIndustry Context: ${cf.industryContext}`;
        }
        if (cf.influenceLevel) {
          context += `\nInfluence Level: ${cf.influenceLevel}`;
        }
        if (cf.engagementPriority) {
          context += `\nEngagement Priority: ${cf.engagementPriority}`;
        }
        if (cf.buyerGroupRole) {
          context += `\nBuyer Group Role: ${cf.buyerGroupRole}`;
        }
        if (cfPainPoints.length > 0) {
          context += `\n\nIdentified Pain Points:`;
          cfPainPoints.forEach((p: string) => context += `\n- ${p}`);
        }
        if (cfGoals.length > 0) {
          context += `\n\nGoals/Objectives:`;
          cfGoals.forEach((g: string) => context += `\n- ${g}`);
        }
        if (cfChallenges.length > 0) {
          context += `\n\nKey Challenges:`;
          cfChallenges.forEach((c: string) => context += `\n- ${c}`);
        }
        if (cfOpportunities.length > 0) {
          context += `\n\nOpportunities:`;
          cfOpportunities.forEach((o: string) => context += `\n- ${o}`);
        }
        if (cf.strategicIntelligence) {
          context += `\n\nStrategic Intelligence: ${cf.strategicIntelligence}`;
        }
        if (cf.situationAnalysis) {
          context += `\n\nSituation Analysis: ${cf.situationAnalysis}`;
        }
        
        context += `\n\nCRITICAL: Use this strategic intelligence to provide highly targeted, personalized advice. Reference specific pain points, goals, and the buyer's situation in your recommendations.`;
      }
    }

    // Add application-specific context
    if (currentRecord.speedrunContext) {
      context += `\n\nSPEEDRUN CONTEXT:
- This is an active Speedrun prospect
- Prospect Index: ${currentRecord.speedrunContext.prospectIndex || 'N/A'}
- Winning Score: ${currentRecord.speedrunContext.winningScore ? JSON.stringify(currentRecord.speedrunContext.winningScore) : 'Not calculated'}
- User expects rapid, actionable guidance for high-velocity outreach`;
    }

    if (currentRecord.pipelineContext) {
      context += `\n\nPIPELINE CONTEXT:
- This is a Pipeline lead/opportunity
- Lead ID: ${currentRecord.pipelineContext.leadId || 'N/A'}
- Has Opportunities: ${currentRecord.pipelineContext.hasOpportunities ? 'Yes' : 'No'}
- Has Notes: ${currentRecord.pipelineContext.hasNotes ? 'Yes' : 'No'}
- User expects strategic pipeline management guidance`;
    }

    // 🔧 FIX: Ensure context is never empty - add fallback if context building failed
    if (!context || context.trim().length < 50) {
      console.warn('⚠️ [AIContextService] Record context is too short, adding fallback context', {
        contextLength: context?.length || 0,
        recordName: recordName,
        recordCompany: recordCompany,
        recordType
      });
      
      // Build minimal but useful context
      context = `=== CURRENT RECORD (WHO THEY ARE) ===
Name: ${recordName}${recordCompany && recordCompany !== 'Unknown Company' ? ` at ${recordCompany}` : ''}
${recordTitle && recordTitle !== 'Unknown Title' ? `Title: ${recordTitle}` : ''}
${currentRecord.status ? `Status: ${currentRecord.status}` : ''}
${currentRecord.priority ? `Priority: ${currentRecord.priority}` : ''}

CRITICAL: The user is looking at ${recordName}${recordCompany && recordCompany !== 'Unknown Company' ? ` at ${recordCompany}` : ''} RIGHT NOW. Your responses should be specific to this person and company. Use all available information to craft personalized recommendations.

COMPLETE RECORD DATA (All Available Fields):
${JSON.stringify(currentRecord, null, 2).substring(0, 3000)}${JSON.stringify(currentRecord, null, 2).length > 3000 ? '\n... (truncated for length)' : ''}`;
    }
    
    // 🔍 LOG FINAL CONTEXT LENGTH
    console.log('✅ [AIContextService] Record context built successfully:', {
      contextLength: context.length,
      recordName,
      recordCompany,
      recordType,
      contextPreview: context.substring(0, 200) + '...'
    });

    return context;
  }

  /**
   * Helper methods for record analysis
   */
  private static inferSeniority(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('ceo') || titleLower.includes('president') || titleLower.includes('founder')) return 'Executive';
    if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('director')) return 'Senior Management';
    if (titleLower.includes('manager') || titleLower.includes('lead') || titleLower.includes('head')) return 'Management';
    if (titleLower.includes('senior') || titleLower.includes('sr')) return 'Senior';
    if (titleLower.includes('junior') || titleLower.includes('jr') || titleLower.includes('associate')) return 'Junior';
    return 'Mid-level';
  }

  private static inferDepartment(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('engineering') || titleLower.includes('developer') || titleLower.includes('architect')) return 'Engineering';
    if (titleLower.includes('sales') || titleLower.includes('business development')) return 'Sales';
    if (titleLower.includes('marketing')) return 'Marketing';
    if (titleLower.includes('finance') || titleLower.includes('accounting')) return 'Finance';
    if (titleLower.includes('hr') || titleLower.includes('human resources')) return 'Human Resources';
    if (titleLower.includes('operations') || titleLower.includes('ops')) return 'Operations';
    if (titleLower.includes('it') || titleLower.includes('technology')) return 'IT';
    return 'General';
  }

  private static inferDecisionPower(title: string, seniority: string): string {
    if (seniority === 'Executive') return 'High - Can make final decisions';
    if (seniority === 'Senior Management') return 'High - Influences major decisions';
    if (seniority === 'Management') return 'Medium - Influences departmental decisions';
    if (seniority === 'Senior') return 'Medium - Influences technical decisions';
    return 'Low - Provides input and recommendations';
  }

  private static inferBuyerGroupRole(title: string, department: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('ceo') || titleLower.includes('president')) return 'Economic Buyer - Final decision maker';
    if (titleLower.includes('cto') || titleLower.includes('vp engineering')) return 'Technical Buyer - Evaluates technical fit';
    if (titleLower.includes('cfo') || titleLower.includes('vp finance')) return 'Economic Buyer - Budget authority';
    if (titleLower.includes('procurement') || titleLower.includes('purchasing')) return 'Procurement - Handles vendor selection';
    if (department === 'Engineering' || department === 'IT') return 'Technical Evaluator - Assesses technical requirements';
    if (department === 'Sales' || department === 'Marketing') return 'User Buyer - Will use the solution';
    return 'Influencer - Provides input and recommendations';
  }

  private static getEngagementAdvice(decisionPower: string, buyerGroupRole: string): string {
    if (decisionPower.includes('High')) {
      return 'Focus on high-level value proposition and ROI. This person can make or influence final decisions.';
    } else if (decisionPower.includes('Medium')) {
      return 'Provide detailed information and build strong case. This person influences decisions and can champion your solution.';
    } else {
      return 'Build relationship and gather intelligence. This person can provide valuable insights and introductions.';
    }
  }

  private static getRoleInsights(title: string, department: string): string {
    if (department === 'Engineering') return 'technical expertise and implementation focus';
    if (department === 'Sales') return 'revenue impact and customer-facing benefits';
    if (department === 'Finance') return 'cost-benefit analysis and budget considerations';
    if (department === 'Operations') return 'operational efficiency and process improvement';
    return 'general business impact and strategic value';
  }

  private static getDecisionInsights(decisionPower: string): string {
    if (decisionPower.includes('High')) return 'this person can approve purchases and allocate budget';
    if (decisionPower.includes('Medium')) return 'this person influences decisions and can champion your solution';
    return 'this person provides input and can facilitate introductions to decision makers';
  }

  private static getBuyingInsights(buyerGroupRole: string): string {
    if (buyerGroupRole.includes('Economic Buyer')) return 'focus on ROI, budget, and business impact';
    if (buyerGroupRole.includes('Technical Buyer')) return 'emphasize technical capabilities, integration, and implementation';
    if (buyerGroupRole.includes('User Buyer')) return 'highlight user experience, productivity, and daily workflow benefits';
    if (buyerGroupRole.includes('Procurement')) return 'provide detailed specifications, compliance, and vendor requirements';
    return 'build relationship and understand their specific concerns and priorities';
  }

  /**
   * Build list view context for when user is viewing a list of records
   * Enhanced to handle pagination and current page information
   */
  private static buildListViewContext(listViewContext: ListViewContext | undefined): string {
    if (!listViewContext) {
      return `LIST VIEW CONTEXT: No list view context available`;
    }

    const { visibleRecords, activeSection, appliedFilters, totalCount, lastUpdated, currentPage: explicitCurrentPage, totalPages: explicitTotalPages } = listViewContext;
    
    // Calculate pagination info if available
    const currentPage = explicitCurrentPage || appliedFilters.page || 1;
    const pageSize = appliedFilters.pageSize || visibleRecords.length || 50;
    const totalPages = explicitTotalPages || Math.ceil(totalCount / pageSize);
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(startRecord + visibleRecords.length - 1, totalCount);
    
    // Limit to top 15 records for context (increased from 10 for better context)
    const topRecords = visibleRecords.slice(0, 15);
    
    let context = `LIST VIEW CONTEXT:
- Active Section: ${activeSection}
- Total Records: ${totalCount}
- Visible Records: ${visibleRecords.length} (showing records ${startRecord}-${endRecord} of ${totalCount})
${totalPages > 1 ? `- Current Page: ${currentPage} of ${totalPages}` : ''}
- Last Updated: ${lastUpdated.toLocaleString()}

APPLIED FILTERS:
- Search: ${appliedFilters.searchQuery || 'None'}
- Vertical: ${appliedFilters.verticalFilter || 'All'}
- Status: ${appliedFilters.statusFilter || 'All'}
- Priority: ${appliedFilters.priorityFilter || 'All'}
- Sort: ${appliedFilters.sortField || 'Default'} (${appliedFilters.sortDirection || 'asc'})
${(appliedFilters as any).page ? `- Page: ${(appliedFilters as any).page}` : ''}

CURRENT PAGE VISIBLE RECORDS:`;

    topRecords.forEach((record, index) => {
      const name = record.fullName || record.name || record.firstName || 'Unknown';
      const company = record.company || record.companyName || 'Unknown Company';
      const title = record.title || record.jobTitle || 'Unknown Title';
      const status = record.status || 'Unknown';
      const priority = record.priority || 'Unknown';
      const recordId = record.id || 'Unknown ID';
      
      context += `\n${index + 1}. ${name} at ${company}
   - Title: ${title}
   - Status: ${status}
   - Priority: ${priority}
   - ID: ${recordId}
   - Complete Record Data: ${JSON.stringify(record).substring(0, 500)}${JSON.stringify(record).length > 500 ? '...' : ''}`;
    });

    if (visibleRecords.length > 15) {
      context += `\n... and ${visibleRecords.length - 15} more records on this page`;
    }
    
    if (totalPages > 1) {
      context += `\n\nPAGINATION INFO:
- This is page ${currentPage} of ${totalPages} total pages
- There are ${totalCount - visibleRecords.length} more records on other pages
- User can navigate to other pages to see more records`;
    }

    context += `\n\nIMPORTANT: The user is currently viewing a list of ${activeSection}${totalPages > 1 ? ` (page ${currentPage} of ${totalPages})` : ''}. You can reference these specific records by name when providing advice. The list shows ${visibleRecords.length} records out of ${totalCount} total.`;

    return context;
  }

  /**
   * Build document context from uploaded files
   */
  private static buildDocumentContext(documentContext: any): string {
    if (!documentContext) {
      return `DOCUMENT CONTEXT: No documents uploaded`;
    }

    const { fileName, parsedDoc } = documentContext;
    
    if (!parsedDoc) {
      return `DOCUMENT CONTEXT: Document ${fileName} uploaded but not parsed`;
    }

    let context = `UPLOADED DOCUMENT CONTEXT:
- File Name: ${fileName}
- File Type: ${parsedDoc.fileType?.toUpperCase() || 'Unknown'}
- File Size: ${this.formatFileSize(parsedDoc.fileSize || 0)}
- Parse Confidence: ${Math.round((parsedDoc.confidence || 0) * 100)}%

DOCUMENT CONTENT ANALYSIS:`;

    // Add text content if available
    if (parsedDoc.content?.text) {
      const textPreview = parsedDoc.content.text.substring(0, 1000);
      context += `\n- Text Content Preview: "${textPreview}${parsedDoc.content.text.length > 1000 ? '...' : ''}"`;
    }

    // Add table data if available
    if (parsedDoc.content?.tables && parsedDoc.content.tables.length > 0) {
      const tableCount = parsedDoc.content.tables.length;
      const firstTable = parsedDoc.content['tables'][0];
      const rowCount = firstTable?.length || 0;
      
      context += `\n- Tables Found: ${tableCount}`;
      context += `\n- First Table Rows: ${rowCount}`;
      
      if (firstTable && firstTable.length > 0) {
        // Show headers
        const headers = firstTable[0];
        context += `\n- Table Headers: ${Array.isArray(headers) ? headers.join(', ') : 'Unknown structure'}`;
        
        // Show sample data
        if (firstTable.length > 1) {
          const sampleRows = firstTable.slice(1, Math.min(4, firstTable.length));
          context += `\n- Sample Data Rows: ${sampleRows.length} rows shown`;
          sampleRows.forEach((row: any, index: number) => {
            const rowData = Array.isArray(row) ? row.join(' | ') : String(row);
            context += `\n  Row ${index + 1}: ${rowData}`;
          });
        }
      }
    }

    // Add extracted data if available
    if (parsedDoc.extractedData) {
      const { companies, contacts, emails, phones, urls } = parsedDoc.extractedData;
      
      if (companies && companies.length > 0) {
        context += `\n- Companies Extracted: ${companies.length} (${companies.slice(0, 5).join(', ')}${companies.length > 5 ? '...' : ''})`;
      }
      
      if (contacts && contacts.length > 0) {
        context += `\n- Contacts Extracted: ${contacts.length}`;
      }
      
      if (emails && emails.length > 0) {
        context += `\n- Email Addresses Found: ${emails.length}`;
      }
      
      if (phones && phones.length > 0) {
        context += `\n- Phone Numbers Found: ${phones.length}`;
      }
      
      if (urls && urls.length > 0) {
        context += `\n- URLs Found: ${urls.length}`;
      }
    }

    // Add structure information
    if (parsedDoc.structure) {
      const { pages, sheets, slides, sections } = parsedDoc.structure;
      
      if (pages) context += `\n- Document Pages: ${pages}`;
      if (sheets && sheets.length > 0) context += `\n- Spreadsheet Sheets: ${sheets.join(', ')}`;
      if (slides) context += `\n- Presentation Slides: ${slides}`;
      if (sections && sections.length > 0) context += `\n- Document Sections: ${sections.join(', ')}`;
    }

    context += `\n\nIMPORTANT: This document is available as context for answering questions. Reference its content when relevant to user queries. For enrichment requests, use the structured data from tables.`;

    return context;
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * Build system and conversation context
   */
  private static async buildSystemContext(conversationHistory: any[], userId?: string): Promise<string> {
    const recentHistory = Array.isArray(conversationHistory) ? conversationHistory.slice(-5) : [];
    const conversationContext = recentHistory.length > 0 
      ? `\n\nRECENT CONVERSATION CONTEXT (last 5 messages):\n${recentHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}\n`
      : '';

    // Get user timezone preference, default to browser/system timezone
    let userTimezone: string | null = null;
    if (userId) {
      try {
        const prisma = getPrismaClient();
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { timezone: true }
        });
        userTimezone = user?.timezone || null;
      } catch (error) {
        console.warn('⚠️ [AI CONTEXT] Failed to load user timezone:', error);
      }
    }
    
    // Use user timezone if available, otherwise fallback to system timezone
    const timezone = userTimezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'America/New_York');
    
    const now = new Date();
    const { formatDateTimeInTimezone } = await import('@/platform/utils/timezone-helper');
    const dateTimeInfo = formatDateTimeInTimezone(now, timezone);

    return `SYSTEM CONTEXT:
CURRENT DATE AND TIME:
Today is ${dateTimeInfo.dayOfWeek}, ${dateTimeInfo.month} ${dateTimeInfo.day}, ${dateTimeInfo.year}
Current time: ${dateTimeInfo.time}
Timezone: ${dateTimeInfo.timezoneName}
ISO DateTime: ${dateTimeInfo.isoDateTime}

This is the exact current date, time, and year in the user's timezone. Always use this information when answering questions about dates, times, schedules, deadlines, or temporal context.

CONVERSATION CONTEXT MANAGEMENT:
- Maintain conversation thread context within the same application
- Do not confuse responses across different conversation topics
- When user provides single-word responses like "please" or "yes", interpret within the specific conversation context

IMPORTANT RULES:
- NEVER use emojis in your responses
- Be natural and conversational - avoid excessive branding or formalities
- Do not say "Monaco Intelligence" or "Monaco AI assistant" - just be Adrata
- For ambiguous responses like "please" or "yes", ask clarifying questions to understand intent
- For simple questions (like weather, general knowledge), politely redirect to your core sales expertise while being helpful
- When providing links, ensure they are clickable and properly formatted${conversationContext}`;
  }

  /**
   * Fetch Speedrun data
   */
  /**
   * Fetch Speedrun data - DEPRECATED: This method makes slow HTTP requests
   * Kept for backwards compatibility but no longer used in buildDataContext
   * to improve response times
   */
  private static async fetchSpeedrunData(workspaceId: string, userId: string): Promise<any> {
    // 🏆 OPTIMIZATION: Skip this slow operation - it makes HTTP requests to another API endpoint
    // This was causing 20+ second response times
    // If Speedrun data is needed, it should be fetched directly from the database with proper timeouts
    return null;
  }

  /**
   * Fetch Pipeline data
   */
  private static async fetchPipelineData(workspaceId: string, userId: string): Promise<any> {
    try {
      // Simplified data context for now
      return {
        workspaceId,
        userId,
        message: 'Pipeline data context available'
      };
    } catch (error) {
      console.warn('Failed to fetch Pipeline data:', error);
    }
    return null;
  }

  /**
   * Get company intelligence from database (stored in customFields)
   * Reads stored intelligence instead of fetching on-the-fly
   */
  private static async getCompanyIntelligenceFromDatabase(
    companyNameOrId: string,
    workspaceId: string
  ): Promise<any> {
    if (!companyNameOrId || companyNameOrId === 'Unknown Company') {
      return null;
    }

    try {
      const prisma = getPrismaClient();

      // Try to find company by ID first (if it's a UUID)
      let company = null;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyNameOrId);
      
      if (isUUID) {
        company = await prisma.companies.findFirst({
          where: {
            id: companyNameOrId,
            workspaceId,
            deletedAt: null
          },
          select: {
            id: true,
            name: true,
            industry: true,
            employeeCount: true,
            size: true,
            description: true,
            descriptionEnriched: true,
            website: true,
            domain: true,
            customFields: true
          }
        });
      }

      // If not found by ID, try by name
      if (!company) {
        company = await prisma.companies.findFirst({
          where: {
            name: {
              equals: companyNameOrId,
              mode: 'insensitive'
            },
            workspaceId,
            deletedAt: null
          },
          select: {
            id: true,
            name: true,
            industry: true,
            employeeCount: true,
            size: true,
            description: true,
            descriptionEnriched: true,
            website: true,
            domain: true,
            customFields: true
          }
        });
      }

      if (!company) {
        console.log('⚠️ [AIContextService] Company not found:', companyNameOrId);
        return null;
      }

      console.log('✅ [AIContextService] Found company:', company.name, 'ID:', company.id);

      // Extract stored intelligence from customFields
      const customFields = company.customFields as any || {};
      const storedIntelligence = customFields.intelligence;
      const INTELLIGENCE_VERSION = 'v2.0';

      // Check if we have valid stored intelligence
      if (storedIntelligence && customFields.intelligenceVersion === INTELLIGENCE_VERSION) {
        console.log('✅ [AIContextService] Using stored intelligence from database');
        
        // Return structured company intelligence from database
        return {
          industry: storedIntelligence.industry || company.industry || null,
          description: storedIntelligence.description || company.descriptionEnriched || company.description || null,
          employeeCount: storedIntelligence.employeeCount || company.employeeCount || company.size || null,
          size: company.size || null,
          website: storedIntelligence.website || company.website || company.domain || null,
          strategicWants: storedIntelligence.strategicWants || [],
          criticalNeeds: storedIntelligence.criticalNeeds || [],
          strategicIntelligence: storedIntelligence.strategicIntelligence || null,
          adrataStrategy: storedIntelligence.adrataStrategy || null,
          businessUnits: storedIntelligence.businessUnits || []
        };
      } else {
        console.log('⚠️ [AIContextService] No valid stored intelligence found. Intelligence should be generated via /api/v1/companies/[id]/intelligence endpoint');
        
        // Return basic company data as fallback (but don't generate intelligence on-the-fly)
        return {
          industry: company.industry || null,
          description: company.descriptionEnriched || company.description || null,
          employeeCount: company.employeeCount || company.size || null,
          size: company.size || null,
          website: company.website || company.domain || null,
          strategicWants: [],
          criticalNeeds: [],
          strategicIntelligence: null,
          adrataStrategy: null,
          businessUnits: []
        };
      }

    } catch (error) {
      console.error('❌ [AIContextService] Error reading company intelligence from database:', error);
      return null;
    }
  }

  /**
   * Get person intelligence from database (stored in customFields)
   * Reads stored intelligence instead of generating on-the-fly
   */
  private static async getPersonIntelligenceFromDatabase(
    personId: string,
    workspaceId: string
  ): Promise<any> {
    if (!personId) {
      return null;
    }

    try {
      const prisma = getPrismaClient();

      const person = await prisma.people.findFirst({
        where: {
          id: personId,
          workspaceId,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          company: true,
          buyerGroupRole: true,
          seniority: true,
          department: true,
          customFields: true
        }
      });

      if (!person) {
        console.log('⚠️ [AIContextService] Person not found:', personId);
        return null;
      }

      console.log('✅ [AIContextService] Found person:', person.fullName || `${person.firstName} ${person.lastName}`, 'ID:', person.id);

      // Extract stored intelligence from customFields
      const customFields = person.customFields as any || {};
      
      // Check for stored person intelligence
      if (customFields.intelligenceGeneratedAt || customFields.influenceLevel || customFields.decisionPower) {
        console.log('✅ [AIContextService] Using stored person intelligence from database');
        
        return {
          influenceLevel: customFields.influenceLevel || null,
          decisionPower: customFields.decisionPower || null,
          engagementLevel: customFields.engagementLevel || null,
          buyerGroupRole: person.buyerGroupRole || customFields.buyerGroupRole || null,
          seniority: person.seniority || customFields.seniority || null,
          department: person.department || customFields.department || null,
          confidence: customFields.intelligenceConfidence || null,
          reasoning: customFields.intelligenceReasoning || null,
          intelligenceGeneratedAt: customFields.intelligenceGeneratedAt || null,
          painPoints: customFields.painPoints || customFields.painIntelligence || [],
          motivations: customFields.motivations || [],
          decisionFactors: customFields.decisionFactors || []
        };
      } else {
        console.log('⚠️ [AIContextService] No stored person intelligence found. Intelligence should be generated via person intelligence API');
        return null;
      }

    } catch (error) {
      console.error('❌ [AIContextService] Error reading person intelligence from database:', error);
      return null;
    }
  }

  /**
   * Get opportunity intelligence from database (stored in customFields)
   * Reads stored intelligence instead of generating on-the-fly
   */
  private static async getOpportunityIntelligenceFromDatabase(
    opportunityId: string,
    workspaceId: string
  ): Promise<any> {
    if (!opportunityId) {
      return null;
    }

    try {
      const prisma = getPrismaClient();

      const opportunity = await prisma.opportunities.findFirst({
        where: {
          id: opportunityId,
          workspaceId,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          stage: true,
          value: true,
          closeDate: true,
          probability: true,
          customFields: true
        }
      });

      if (!opportunity) {
        console.log('⚠️ [AIContextService] Opportunity not found:', opportunityId);
        return null;
      }

      console.log('✅ [AIContextService] Found opportunity:', opportunity.name, 'ID:', opportunity.id);

      // Extract stored intelligence from customFields
      const customFields = opportunity.customFields as any || {};
      
      // Check for stored opportunity intelligence
      if (customFields.influenceLevel || customFields.engagementStrategy || customFields.intelligence) {
        console.log('✅ [AIContextService] Using stored opportunity intelligence from database');
        
        return {
          influenceLevel: customFields.influenceLevel || null,
          engagementStrategy: customFields.engagementStrategy || null,
          seniority: customFields.seniority || null,
          buyerGroupRole: customFields.buyerGroupRole || null,
          isBuyerGroupMember: customFields.isBuyerGroupMember || false,
          department: customFields.department || null,
          painPoints: customFields.painPoints || customFields.painIntelligence || [],
          motivations: customFields.motivations || [],
          decisionFactors: customFields.decisionFactors || [],
          aiIntelligence: customFields.aiIntelligence || null,
          intelligence: customFields.intelligence || null,
          stage: opportunity.stage || null,
          value: opportunity.value || null,
          closeDate: opportunity.closeDate || null,
          probability: opportunity.probability || null
        };
      } else {
        console.log('⚠️ [AIContextService] No stored opportunity intelligence found. Intelligence should be generated via opportunity intelligence API');
        
        // Return basic opportunity data as fallback
        return {
          stage: opportunity.stage || null,
          value: opportunity.value || null,
          closeDate: opportunity.closeDate || null,
          probability: opportunity.probability || null,
          influenceLevel: null,
          engagementStrategy: null,
          seniority: null,
          buyerGroupRole: null,
          isBuyerGroupMember: false,
          department: null,
          painPoints: [],
          motivations: [],
          decisionFactors: [],
          aiIntelligence: null,
          intelligence: null
        };
      }

    } catch (error) {
      console.error('❌ [AIContextService] Error reading opportunity intelligence from database:', error);
      return null;
    }
  }

  /**
   * Get lead intelligence from database (stored in customFields)
   * Reads stored intelligence instead of generating on-the-fly
   */
  private static async getLeadIntelligenceFromDatabase(
    leadId: string,
    workspaceId: string
  ): Promise<any> {
    if (!leadId) {
      return null;
    }

    try {
      const prisma = getPrismaClient();

      const lead = await prisma.leads.findFirst({
        where: {
          id: leadId,
          workspaceId,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          company: true,
          buyerGroupRole: true,
          customFields: true
        }
      });

      if (!lead) {
        console.log('⚠️ [AIContextService] Lead not found:', leadId);
        return null;
      }

      console.log('✅ [AIContextService] Found lead:', lead.fullName || `${lead.firstName} ${lead.lastName}`, 'ID:', lead.id);

      // Extract stored intelligence from customFields
      const customFields = lead.customFields as any || {};
      
      // Check for stored lead intelligence
      if (customFields.influenceLevel || customFields.engagementStrategy || customFields.seniority) {
        console.log('✅ [AIContextService] Using stored lead intelligence from database');
        
        return {
          influenceLevel: customFields.influenceLevel || null,
          engagementStrategy: customFields.engagementStrategy || null,
          seniority: customFields.seniority || null,
          buyerGroupRole: lead.buyerGroupRole || customFields.buyerGroupRole || null,
          isBuyerGroupMember: customFields.isBuyerGroupMember || false,
          department: customFields.department || null,
          painPoints: customFields.painPoints || customFields.painIntelligence || [],
          motivations: customFields.motivations || [],
          decisionFactors: customFields.decisionFactors || [],
          aiIntelligence: customFields.aiIntelligence || null,
          intelligence: customFields.intelligence || null
        };
      } else {
        console.log('⚠️ [AIContextService] No stored lead intelligence found. Intelligence should be generated via lead intelligence API');
        return null;
      }

    } catch (error) {
      console.error('❌ [AIContextService] Error reading lead intelligence from database:', error);
      return null;
    }
  }

  /**
   * Combine all context into final prompt with enhanced seller/buyer framing
   */
  static combineContext(context: EnhancedAIContext): string {
    // Extract personality preferences from user context
    const hasPersonality = context.userContext.includes('PERSONALITY PREFERENCES');
    let personalityInstructions = '';
    
    if (hasPersonality) {
      // Extract the personality section from user context
      const personalityStart = context.userContext.indexOf('USER PERSONALITY PREFERENCES:');
      if (personalityStart !== -1) {
        const personalitySection = context.userContext.substring(personalityStart);
        personalityInstructions = `\n=== PERSONALITY INSTRUCTIONS ===\n${personalitySection}\n`;
      }
    }

    return `You are an intelligent sales assistant and expert advisor, speaking as the user's business representative.

Your expertise includes:
- Sales strategy and pipeline optimization
- Lead qualification and buyer group analysis
- Email outreach and communication strategies
- CRM data analysis and insights
- Industry trends and competitive intelligence
- Revenue forecasting and performance tracking
- Document analysis and data extraction from uploaded files
- Strategic fit analysis between sellers and buyers
- Business development and relationship building

You provide:
- Intelligent, contextual responses based on real user data and uploaded documents
- Actionable recommendations and next steps specific to the user's business
- Professional guidance that is natural, smart, and helpful
- Accurate information about dates, times, and current context
- Analysis and insights from uploaded documents (CSV, Excel, PDF, Word, etc.)
- Strategic advice tailored to the user's products/services and target market

${personalityInstructions}

=== COMPREHENSIVE CONTEXT SYSTEM ===

${context.userContext}

${context.applicationContext}

${context.dataContext}

${context.recordContext}

${context.listViewContext}

${context.documentContext}

${context.systemContext}

=== CRITICAL INSTRUCTIONS ===
${hasPersonality ? 
  'IMPORTANT: You MUST adapt your response style to match the user\'s personality preferences listed above. Follow the tone, style, and communication approach specified in the personality instructions. This is non-negotiable.' : 
  'Provide professional, helpful responses that align with the user\'s business brand and approach.'}

=== RESPONSE GUIDELINES ===
- Always speak from the perspective of the user's business (as identified in the workspace context)
- Reference the user's specific products/services when giving advice
- Consider strategic fit between the user's business and the current record
- Provide actionable next steps relevant to the user's sales methodology
- Use the user's value propositions and competitive advantages in recommendations
- Focus on the user's target industries and ideal customer profile
- Be specific about how the current record relates to the user's business goals
- Suggest engagement strategies that align with the user's business model`;
  }
}
