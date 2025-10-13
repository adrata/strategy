/**
 * 🤖 CLAUDE AI SERVICE
 * 
 * Direct integration with Anthropic's Claude API for intelligent chat responses
 * Replaces the complex chain of API calls with direct Claude integration
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/platform/database/prisma-client';
import { EnhancedWorkspaceContextService } from '@/platform/ai/services/EnhancedWorkspaceContextService';
import { BrowserTools } from '@/platform/ai/tools/browser-tools';
import { browserAutomationService } from './BrowserAutomationService';

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
  };
  totalCount: number;
  lastUpdated: Date;
}

export interface ClaudeChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  currentRecord?: any;
  recordType?: string;
  listViewContext?: ListViewContext;
  appType?: string;
  workspaceId?: string;
  userId?: string;
}

export interface ClaudeChatResponse {
  response: string;
  confidence: number;
  model: string;
  tokensUsed: number;
  processingTime: number;
  browserResults?: any[];
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export class ClaudeAIService {
  private anthropic: Anthropic;
  private model: string = 'claude-sonnet-4-5';
  private responseCache: Map<string, ClaudeChatResponse> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes
  private browserSessions: Map<string, string> = new Map(); // userId -> sessionId

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Claude service not available - missing ANTHROPIC_API_KEY or running in client');
      // Don't throw error during build - just log warning
      return;
    }
    
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  /**
   * Generate intelligent chat response using Claude with full data access
   */
  async generateChatResponse(request: ClaudeChatRequest): Promise<ClaudeChatResponse> {
    const startTime = Date.now();
    
    // Check if service is properly initialized
    if (!this.anthropic) {
      console.warn('⚠️ Claude service not available - returning fallback response');
      return {
        response: this.generateFallbackResponse(request),
        confidence: 0.3,
        model: 'fallback',
        tokensUsed: 0,
        processingTime: Date.now() - startTime
      };
    }
    
    try {
      // Generate cache key for request
      const cacheKey = this.generateCacheKey(request);
      
      // Check cache first for performance
      const cachedResponse = this.responseCache.get(cacheKey);
      if (cachedResponse && (Date.now() - cachedResponse.processingTime) < this.cacheTimeout) {
        console.log('🚀 [CLAUDE AI] Using cached response for performance');
        return {
          ...cachedResponse,
          processingTime: Date.now() - startTime
        };
      }
      
      // Check if this is a person search query and search database first
      const personSearchResult = await this.handlePersonSearchQuery(request);
      
      // Check if user wants web research
      const shouldPerformWebResearch = BrowserTools.shouldPerformWebResearch(request.message);
      let browserResults: any[] = [];
      let sources: any[] = [];

      // Get or create browser session for user
      let sessionId = this.browserSessions.get(request.userId || 'default');
      if (shouldPerformWebResearch && !sessionId) {
        sessionId = await browserAutomationService.createSession();
        this.browserSessions.set(request.userId || 'default', sessionId);
      }

      // Get comprehensive data context for the AI
      const dataContext = await this.getDataContext(request);
      
      // Add person search results to context if found
      if (personSearchResult) {
        dataContext.personSearchResults = personSearchResult;
      }
      
      // Validate context and log warnings
      const validation = this.validateContext(request, dataContext);
      if (!validation.isValid) {
        console.warn('⚠️ [CLAUDE AI] Context validation warnings:', validation.warnings);
      }
      
      // Build the enhanced system prompt with data context
      const systemPrompt = this.buildEnhancedSystemPrompt(request, dataContext);
      
      // Build conversation messages
      const messages = this.buildConversationMessages(request);
      
      console.log('🤖 [CLAUDE AI] Generating response with enhanced context:', {
        hasCurrentRecord: !!request.currentRecord,
        recordType: request.recordType,
        appType: request.appType,
        conversationLength: request.conversationHistory?.length || 0,
        dataContextSize: JSON.stringify(dataContext).length,
        hasPersonSearchResults: !!personSearchResult,
        shouldPerformWebResearch,
        hasBrowserSession: !!sessionId
      });
      
      // Prepare tools for Claude if web research is needed
      const tools = shouldPerformWebResearch ? BrowserTools.getTools() : undefined;
      
      // Call Claude API with enhanced context and tools
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000, // Increased for web research responses
        system: systemPrompt,
        messages: messages,
        temperature: 0.7, // Balanced creativity and consistency
        tools: tools,
        tool_choice: shouldPerformWebResearch ? 'auto' : undefined
      });

      const processingTime = Date.now() - startTime;
      let responseText = '';
      let finalResponse = response;

      // Handle tool calls if present
      if (response.content.some(item => item.type === 'tool_use') && sessionId) {
        console.log('🌐 [CLAUDE AI] Processing tool calls for web research');
        
        // Process tool calls
        const toolResults = await this.processToolCalls(response.content, sessionId);
        
        // Add tool results to conversation
        const toolMessages = toolResults.map(result => ({
          role: 'user' as const,
          content: `Tool result: ${JSON.stringify(result)}`
        }));

        // Get final response with tool results
        const finalMessages = [...messages, ...toolMessages];
        finalResponse = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 2000,
          system: systemPrompt,
          messages: finalMessages,
          temperature: 0.7
        });

        // Extract browser results and sources
        browserResults = toolResults.filter(result => result.success);
        sources = this.extractSourcesFromResults(browserResults);
      }

      responseText = finalResponse.content[0].type === 'text' ? finalResponse.content[0].text : '';

      console.log(`✅ [CLAUDE AI] Enhanced response generated in ${processingTime}ms`, {
        hasWebResearch: browserResults.length > 0,
        sourcesCount: sources.length
      });

      const claudeResponse = {
        response: responseText,
        confidence: 0.95, // Claude responses are generally high confidence
        model: this.model,
        tokensUsed: finalResponse.usage.input_tokens + finalResponse.usage.output_tokens,
        processingTime: processingTime,
        browserResults,
        sources
      };

      // Cache the response for future use
      this.responseCache.set(cacheKey, claudeResponse);
      
      // Clean up old cache entries
      this.cleanupCache();

      return claudeResponse;

    } catch (error) {
      console.error('❌ Claude AI Service Error:', error);
      
      // Return a fallback response
      return {
        response: this.generateFallbackResponse(request),
        confidence: 0.3,
        model: 'fallback',
        tokensUsed: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Handle person search queries by searching the database first
   */
  private async handlePersonSearchQuery(request: ClaudeChatRequest): Promise<any> {
    if (!request.workspaceId) {
      return null;
    }

    const message = request.message.toLowerCase();
    
    // Check if this is a person search query
    const personSearchPatterns = [
      /show me (.+)/i,
      /find (.+)/i,
      /look up (.+)/i,
      /search for (.+)/i,
      /who is (.+)/i,
      /tell me about (.+)/i,
      /get me (.+)/i,
      /can you find (.+)/i,
      /do you know (.+)/i,
      /(.+) in the database/i
    ];

    let personName = null;
    for (const pattern of personSearchPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        personName = match[1].trim();
        break;
      }
    }

    if (!personName) {
      return null;
    }

    console.log(`🔍 [PERSON SEARCH] Searching for: "${personName}"`);

    try {
      // Search for people in the database with comprehensive matching
      const people = await prisma.people.findMany({
        where: {
          workspaceId: request.workspaceId,
          deletedAt: null,
          OR: [
            {
              firstName: {
                contains: personName,
                mode: 'insensitive'
              }
            },
            {
              lastName: {
                contains: personName,
                mode: 'insensitive'
              }
            },
            {
              fullName: {
                contains: personName,
                mode: 'insensitive'
              }
            },
            {
              email: {
                contains: personName,
                mode: 'insensitive'
              }
            },
            // Also search for partial matches
            {
              firstName: {
                contains: personName.split(' ')[0],
                mode: 'insensitive'
              }
            },
            {
              lastName: {
                contains: personName.split(' ')[1] || personName.split(' ')[0],
                mode: 'insensitive'
              }
            }
          ]
        },
        include: {
          company: {
            select: {
              name: true,
              industry: true,
              size: true,
              website: true
            }
          },
          actions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              type: true,
              description: true,
              createdAt: true
            }
          }
        },
        take: 10
      });

      console.log(`✅ [PERSON SEARCH] Found ${people.length} matches for "${personName}"`);

      return {
        query: personName,
        results: people,
        count: people.length
      };

    } catch (error) {
      console.error('❌ [PERSON SEARCH] Error:', error);
      return null;
    }
  }

  /**
   * Get comprehensive data context for the AI
   */
  private async getDataContext(request: ClaudeChatRequest): Promise<any> {
    try {
      if (!request.workspaceId) {
        return {};
      }

      const workspaceId = request.workspaceId;
      
      // Get workspace context first
      const workspaceContext = await EnhancedWorkspaceContextService.buildWorkspaceContext(workspaceId);
      
      // Get key metrics and data for context
      const [peopleCount, companiesCount, prospectsCount, leadsCount, opportunitiesCount] = await Promise.all([
        prisma.people.count({ where: { workspaceId, deletedAt: null } }),
        prisma.companies.count({ where: { workspaceId, deletedAt: null } }),
        prisma.prospects.count({ where: { workspaceId, deletedAt: null } }),
        prisma.leads.count({ where: { workspaceId, deletedAt: null } }),
        prisma.opportunities.count({ where: { workspaceId, deletedAt: null } })
      ]);

      // Get recent activities for context
      const recentActions = await prisma.actions.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          person: { select: { fullName: true, company: { select: { name: true } } } },
          company: { select: { name: true } }
        }
      });

      // Get current record details if available
      let currentRecordDetails = null;
      if (request.currentRecord?.id) {
        const recordId = request.currentRecord.id;
        
        // Try to get full record details based on record type
        if (request.recordType === 'people') {
          currentRecordDetails = await prisma.people.findUnique({
            where: { id: recordId },
            include: {
              company: { 
                select: { 
                  name: true, 
                  industry: true, 
                  size: true,
                  website: true,
                  linkedin: true,
                  description: true
                } 
              },
              actions: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
          });
        } else if (request.recordType === 'prospects') {
          currentRecordDetails = await prisma.prospects.findUnique({
            where: { id: recordId },
            include: {
              company: { 
                select: { 
                  name: true, 
                  industry: true, 
                  size: true,
                  website: true,
                  linkedin: true,
                  description: true
                } 
              },
              actions: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
          });
        } else if (request.recordType === 'companies') {
          currentRecordDetails = await prisma.companies.findUnique({
            where: { id: recordId },
            include: {
              people: { 
                select: { 
                  fullName: true, 
                  title: true, 
                  email: true,
                  linkedin: true
                },
                take: 5
              },
              actions: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
          });
        } else if (request.recordType === 'leads') {
          currentRecordDetails = await prisma.leads.findUnique({
            where: { id: recordId },
            include: {
              company: { 
                select: { 
                  name: true, 
                  industry: true, 
                  size: true,
                  website: true,
                  linkedin: true,
                  description: true
                } 
              },
              actions: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
          });
        } else if (request.recordType === 'opportunities') {
          currentRecordDetails = await prisma.opportunities.findUnique({
            where: { id: recordId },
            include: {
              company: { 
                select: { 
                  name: true, 
                  industry: true, 
                  size: true,
                  website: true,
                  linkedin: true,
                  description: true
                } 
              },
              actions: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
          });
        }
      }

      return {
        workspaceContext,
        workspaceMetrics: {
          people: peopleCount,
          companies: companiesCount,
          prospects: prospectsCount,
          leads: leadsCount,
          opportunities: opportunitiesCount
        },
        recentActivities: recentActions.map(action => ({
          type: action.type,
          description: action.description,
          person: action.person?.fullName,
          company: action.person?.company?.name || action.company?.name,
          createdAt: action.createdAt
        })),
        currentRecord: currentRecordDetails
      };
    } catch (error) {
      console.error('❌ Error getting data context:', error);
      return {};
    }
  }

  /**
   * Validate context availability and provide fallback messaging
   */
  private validateContext(request: ClaudeChatRequest, dataContext: any): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check workspace context
    if (!dataContext.workspaceContext) {
      warnings.push('Workspace business context not available - AI may not know what you sell or your target market');
    }
    
    // Check current record context
    if (!request.currentRecord && !request.listViewContext) {
      warnings.push('No current record or list view context - AI cannot provide specific advice about visible records');
    }
    
    // Check data freshness
    if (request.listViewContext) {
      const ageMinutes = (Date.now() - request.listViewContext.lastUpdated.getTime()) / (1000 * 60);
      if (ageMinutes > 5) {
        warnings.push('List view context is older than 5 minutes - data may be stale');
      }
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Build enhanced system prompt with sales context and data access
   */
  private buildEnhancedSystemPrompt(request: ClaudeChatRequest, dataContext: any): string {
    const currentRecord = request.currentRecord;
    const recordType = request.recordType;
    const listViewContext = request.listViewContext;
    const appType = request.appType;

    // Validate context and add warnings to prompt
    const validation = this.validateContext(request, dataContext);
    let contextWarnings = '';
    if (!validation.isValid) {
      contextWarnings = `
⚠️ CONTEXT WARNINGS:
${validation.warnings.map(warning => `- ${warning}`).join('\n')}

Please acknowledge these limitations in your response and suggest how the user can provide better context if needed.
`;
    }

    let contextInfo = '';
    
    if (currentRecord) {
      const recordName = currentRecord.fullName || currentRecord.name || 'Unknown';
      const company = currentRecord.company?.name || currentRecord.company || 'Unknown Company';
      const title = currentRecord.title || currentRecord.jobTitle || 'Unknown Title';
      const industry = currentRecord.company?.industry || 'Unknown Industry';
      const companySize = currentRecord.company?.size || 'Unknown Size';
      const website = currentRecord.company?.website || currentRecord.website || 'No website';
      const linkedin = currentRecord.company?.linkedin || currentRecord.linkedin || 'No LinkedIn';
      const description = currentRecord.company?.description || currentRecord.description || 'No description available';
      const email = currentRecord.email || 'No email available';
      const phone = currentRecord.phone || 'No phone available';
      
      contextInfo = `
CURRENT RECORD CONTEXT:
- Name: ${recordName}
- Company: ${company}
- Title: ${title}
- Industry: ${industry}
- Company Size: ${companySize}
- Email: ${email}
- Phone: ${phone}
- Website: ${website}
- LinkedIn: ${linkedin}
- Description: ${description}
- Record Type: ${recordType || 'Unknown'}
- App Context: ${appType || 'General'}
`;
    }

    // Add workspace data context
    let workspaceContext = '';
    if (dataContext.workspaceMetrics) {
      const metrics = dataContext.workspaceMetrics;
      workspaceContext = `
WORKSPACE DATA CONTEXT:
- Total People: ${metrics.people}
- Total Companies: ${metrics.companies}
- Active Prospects: ${metrics.prospects}
- Active Leads: ${metrics.leads}
- Active Opportunities: ${metrics.opportunities}
`;
    }

    // Add rich workspace context if available
    let workspaceBusinessContext = '';
    if (dataContext.workspaceContext) {
      workspaceBusinessContext = EnhancedWorkspaceContextService.buildAIContextString(dataContext.workspaceContext);
    }

    // Add recent activities context
    let activitiesContext = '';
    if (dataContext.recentActivities && dataContext.recentActivities.length > 0) {
      activitiesContext = `
RECENT ACTIVITIES:
${dataContext.recentActivities.slice(0, 5).map(activity => 
  `- ${activity.type}: ${activity.description} (${activity.person} at ${activity.company})`
).join('\n')}
`;
    }

    // Add person search results context
    let personSearchContext = '';
    if (dataContext.personSearchResults) {
      const { query, results, count } = dataContext.personSearchResults;
      personSearchContext = `
PERSON SEARCH RESULTS FOR "${query}":
Found ${count} matches in your database:

${results.map((person: any, index: number) => {
  const company = person.company?.name || 'Unknown Company';
  const industry = person.company?.industry || 'Unknown Industry';
  const recentActions = person.actions?.slice(0, 3).map((action: any) => 
    `  - ${action.type}: ${action.description} (${new Date(action.createdAt).toLocaleDateString()})`
  ).join('\n') || '  - No recent actions';
  
  return `${index + 1}. ${person.fullName || `${person.firstName} ${person.lastName}`}
     Title: ${person.jobTitle || 'Unknown'}
     Company: ${company} (${industry})
     Email: ${person.email || 'Not available'}
     Phone: ${person.phone || 'Not available'}
     Recent Actions:
${recentActions}`;
}).join('\n\n')}
`;
    }

    // Add list view context
    let listViewContextString = '';
    if (listViewContext) {
      const { visibleRecords, activeSection, appliedFilters, totalCount, lastUpdated } = listViewContext;
      
      // Limit to top 10 records for context to avoid overwhelming the AI
      const topRecords = visibleRecords.slice(0, 10);
      
      listViewContextString = `
LIST VIEW CONTEXT:
- Active Section: ${activeSection}
- Total Records: ${totalCount}
- Visible Records: ${visibleRecords.length}
- Last Updated: ${lastUpdated.toLocaleString()}

APPLIED FILTERS:
- Search: ${appliedFilters.searchQuery || 'None'}
- Vertical: ${appliedFilters.verticalFilter || 'All'}
- Status: ${appliedFilters.statusFilter || 'All'}
- Priority: ${appliedFilters.priorityFilter || 'All'}
- Sort: ${appliedFilters.sortField || 'Default'} (${appliedFilters.sortDirection || 'asc'})

TOP VISIBLE RECORDS:`;

      topRecords.forEach((record, index) => {
        const name = record.fullName || record.name || record.firstName || 'Unknown';
        const company = record.company || record.companyName || 'Unknown Company';
        const title = record.title || record.jobTitle || 'Unknown Title';
        const status = record.status || 'Unknown';
        const priority = record.priority || 'Unknown';
        
        listViewContextString += `\n${index + 1}. ${name} at ${company}
   - Title: ${title}
   - Status: ${status}
   - Priority: ${priority}`;
      });

      if (visibleRecords.length > 10) {
        listViewContextString += `\n... and ${visibleRecords.length - 10} more records`;
      }

      listViewContextString += `\n\nIMPORTANT: The user is currently viewing a list of ${activeSection}. You can reference these specific records by name when providing advice.`;
    }

    return `You are Adrata, a friendly and knowledgeable sales acceleration AI assistant. You have full access to the user's CRM data and help sales professionals succeed.

🎯 YOUR ROLE:
You're like a trusted sales consultant who's always available to help. You understand the user's business, their prospects, and their challenges. You provide practical, actionable advice in a conversational, supportive tone.

💬 RESPONSE STYLE:
- Be warm, encouraging, and helpful
- Keep responses concise and fast
- Use simple, clear language
- Show enthusiasm for helping with sales success
- NO emojis - keep responses professional and clean

📊 YOUR EXPERTISE:
- B2B sales strategies and methodologies
- CRM and pipeline optimization
- Prospect research and buyer intelligence
- Account-based selling and relationship building
- Revenue growth and deal closing
- Sales process improvement

${contextWarnings}
${contextInfo}
${workspaceContext}
${workspaceBusinessContext}
${activitiesContext}
${personSearchContext}
${listViewContextString}

💬 CONVERSATION STYLE:
- Be warm, professional, and encouraging
- Use natural, conversational language (avoid corporate jargon)
- Ask follow-up questions to understand their needs better
- Provide specific, actionable advice
- Reference their actual data and context when relevant
- Be concise but thorough
- Show genuine interest in their success
- Use simple, clean text formatting

🚀 HOW TO HELP:
- Listen to what they're trying to accomplish
- Offer practical solutions based on their specific situation
- Suggest concrete next steps they can take
- Help them think through challenges and opportunities
- Share insights from their CRM data when helpful
- Be their sounding board for sales strategies

📝 RESPONSE FORMATTING:
- Write in a conversational, warm tone
- Use simple text formatting without any special characters
- Keep responses concise and fast
- Use line breaks for readability
- Be helpful and encouraging
- NO emojis, NO markdown syntax, NO bullet points, NO special formatting

Remember: You're not just providing information - you're being a helpful partner in their sales success. Be encouraging, practical, and focused on helping them achieve their goals.`;
  }

  /**
   * Build comprehensive system prompt with sales context
   */
  private buildSystemPrompt(request: ClaudeChatRequest): string {
    const currentRecord = request.currentRecord;
    const recordType = request.recordType;
    const appType = request.appType;

    let contextInfo = '';
    
    if (currentRecord) {
      const recordName = currentRecord.fullName || currentRecord.name || 'Unknown';
      const company = currentRecord.company?.name || currentRecord.company || 'Unknown Company';
      const title = currentRecord.title || currentRecord.jobTitle || 'Unknown Title';
      
      contextInfo = `
CURRENT RECORD CONTEXT:
- Name: ${recordName}
- Company: ${company}
- Title: ${title}
- Record Type: ${recordType || 'Unknown'}
- App Context: ${appType || 'General'}
`;
    }

    return `You are Adrata, an intelligent sales acceleration AI assistant. You help sales professionals with:

🎯 CORE CAPABILITIES:
- Sales strategy and prospecting advice
- Buyer group intelligence and stakeholder mapping
- Pipeline analysis and optimization
- Next action recommendations
- Competitive intelligence
- Industry insights and trends
- Excel file import and lead processing
- Intelligent data mapping and deduplication

📊 SALES EXPERTISE:
- B2B sales methodologies (Challenger Sale, SPIN Selling, MEDDIC)
- CRM and pipeline management
- Lead qualification and nurturing
- Account-based selling strategies
- Revenue forecasting and analytics
- Data import and lead processing workflows
- Excel file analysis and column mapping

${contextInfo}

💡 RESPONSE GUIDELINES:
- Be specific and actionable in your advice
- Reference the current record context when relevant
- Provide concrete next steps and recommendations
- Use sales terminology appropriately
- Be concise but comprehensive
- Focus on revenue-generating activities
- Consider the user's role and company context

🚀 SALES ACCELERATION FOCUS:
Always aim to help the user:
1. Close more deals faster
2. Build stronger relationships
3. Identify and engage key stakeholders
4. Optimize their sales process
5. Make data-driven decisions

Respond as a knowledgeable sales consultant who understands modern B2B sales challenges and opportunities.`;
  }

  /**
   * Handle Excel import requests with intelligent analysis
   */
  async handleExcelImportRequest(request: ClaudeChatRequest, excelData: any): Promise<ClaudeChatResponse> {
    const startTime = Date.now();
    
    if (!this.anthropic) {
      return {
        response: "I can help you import Excel data, but I need to be properly configured first.",
        confidence: 0.3,
        model: 'fallback',
        tokensUsed: 0,
        processingTime: Date.now() - startTime
      };
    }

    try {
      const systemPrompt = this.buildExcelImportPrompt(request, excelData);
      const userMessage = `I've uploaded an Excel file with lead data. Please analyze it and help me import the contacts with appropriate status and connection points. Here's the data structure:\n\n${JSON.stringify(excelData, null, 2)}`;

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      return {
        response: responseText,
        confidence: 0.9,
        model: this.model,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ [CLAUDE AI] Excel import error:', error);
      return {
        response: "I encountered an error analyzing your Excel file. Please try again or contact support.",
        confidence: 0.1,
        model: this.model,
        tokensUsed: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Build Excel import specific system prompt
   */
  private buildExcelImportPrompt(request: ClaudeChatRequest, excelData: any): string {
    return `You are Adrata's Excel import specialist. Your role is to analyze Excel files containing lead/contact data and provide intelligent import recommendations.

📊 EXCEL IMPORT EXPERTISE:
- Analyze Excel structure and column mapping
- Determine appropriate person status (LEAD, PROSPECT, CUSTOMER)
- Identify connection point opportunities
- Suggest data cleaning and deduplication strategies
- Recommend import settings and next actions

🎯 STATUS INTELLIGENCE:
- LEAD: New contacts without engagement history
- PROSPECT: Contacts with some engagement or warm indicators
- CUSTOMER: Existing customers or revenue-generating contacts

🔗 CONNECTION POINT GENERATION:
- Import activity: Always created with timestamp
- Historical activities: From date/interaction columns
- Next actions: Based on lead quality and data completeness

📋 ANALYSIS FRAMEWORK:
1. Examine column headers and data structure
2. Identify key fields (name, email, company, title, etc.)
3. Assess data quality and completeness
4. Determine import type (people, companies, or mixed)
5. Suggest status assignments based on context
6. Recommend connection point creation
7. Provide import confidence score

💡 RESPONSE FORMAT:
Provide a structured analysis including:
- Import type detection
- Column mapping suggestions
- Status recommendations
- Connection point opportunities
- Data quality assessment
- Import confidence score
- Next action recommendations

Be specific and actionable in your recommendations. Focus on maximizing the value of the imported data for sales activities.`;
  }

  /**
   * Build conversation messages from history and current message
   */
  private buildConversationMessages(request: ClaudeChatRequest): Anthropic.Messages.MessageParam[] {
    const messages: Anthropic.Messages.MessageParam[] = [];
    
    // Add conversation history (last 10 messages to stay within token limits)
    if (request.conversationHistory) {
      const recentHistory = request.conversationHistory.slice(-10);
      
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: request.message
    });
    
    return messages;
  }

  /**
   * Generate fallback response when Claude API fails
   */
  private generateFallbackResponse(request: ClaudeChatRequest): string {
    const currentRecord = request.currentRecord;
    
    if (currentRecord) {
      const recordName = currentRecord.fullName || currentRecord.name || 'this contact';
      const company = currentRecord.company?.name || currentRecord.company || 'their company';
      
      return `Hi! I'm having a small technical hiccup right now, but I'm still here to help you with ${recordName} at ${company}. 

I can assist you with sales strategy, buyer research, pipeline optimization, and competitive intelligence. What would you like to focus on with this contact?`;
    }
    
    return `Hey there! I'm experiencing a brief technical issue, but I'm still ready to help you with your sales process.

I can help with prospecting, pipeline analysis, buyer research, and closing strategies. What's on your mind today?`;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: ClaudeChatRequest): string {
    const keyData = {
      message: request.message,
      workspaceId: request.workspaceId,
      userId: request.userId,
      recordType: request.recordType,
      appType: request.appType
    };
    return `claude-${JSON.stringify(keyData)}`;
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, response] of this.responseCache.entries()) {
      if (now - response.processingTime > this.cacheTimeout) {
        this.responseCache.delete(key);
      }
    }
  }

  /**
   * Process tool calls from Claude AI
   */
  private async processToolCalls(content: any[], sessionId: string): Promise<any[]> {
    const toolCalls = content.filter(item => item.type === 'tool_use');
    const results: any[] = [];

    for (const toolCall of toolCalls) {
      try {
        const { name, input } = toolCall.function;
        console.log(`🔧 [TOOL CALL] Executing: ${name}`, input);

        let result;
        switch (name) {
          case 'navigate_to_url':
            result = await browserAutomationService.navigateToUrl(
              sessionId,
              input.url,
              {
                extractText: input.extract_text !== false,
                extractLinks: input.extract_links || false,
                waitForSelector: input.wait_for_selector
              }
            );
            break;

          case 'search_web':
            result = await browserAutomationService.searchWeb(
              sessionId,
              input.query,
              {
                maxResults: input.max_results || 10,
                searchEngine: input.search_engine || 'google'
              }
            );
            break;

          case 'extract_page_content':
            result = await browserAutomationService.extractContent(
              sessionId,
              input.url,
              input.selectors,
              input.extract_type || 'text'
            );
            break;

          case 'take_screenshot':
            result = await browserAutomationService.takeScreenshot(
              sessionId,
              input.url,
              {
                fullPage: input.full_page || false,
                selector: input.selector
              }
            );
            break;

          default:
            result = {
              success: false,
              error: `Unknown tool: ${name}`
            };
        }

        results.push({
          tool_call_id: toolCall.id,
          tool_name: name,
          ...result
        });

      } catch (error) {
        console.error(`❌ [TOOL CALL] Error executing ${toolCall.function.name}:`, error);
        results.push({
          tool_call_id: toolCall.id,
          tool_name: toolCall.function.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Extract sources from browser results
   */
  private extractSourcesFromResults(browserResults: any[]): Array<{
    title: string;
    url: string;
    snippet: string;
  }> {
    const sources: Array<{ title: string; url: string; snippet: string }> = [];

    for (const result of browserResults) {
      if (result.success && result.url) {
        sources.push({
          title: result.title || 'Web Page',
          url: result.url,
          snippet: result.content ? result.content.substring(0, 200) + '...' : 'Content extracted from web page'
        });
      }

      // Also extract sources from search results
      if (result.results && Array.isArray(result.results)) {
        for (const searchResult of result.results) {
          sources.push({
            title: searchResult.title || 'Search Result',
            url: searchResult.url,
            snippet: searchResult.snippet || 'Search result'
          });
        }
      }
    }

    return sources;
  }

  /**
   * Clean up browser sessions
   */
  async cleanupBrowserSessions(): Promise<void> {
    for (const [userId, sessionId] of this.browserSessions.entries()) {
      try {
        await browserAutomationService.closeSession(sessionId);
      } catch (error) {
        console.error(`❌ Error closing session for user ${userId}:`, error);
      }
    }
    this.browserSessions.clear();
  }

  /**
   * Test Claude API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.anthropic) {
      return false;
    }
    
    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      });
      
      return response.content[0].type === 'text';
    } catch (error) {
      console.error('Claude API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const claudeAIService = new ClaudeAIService();
