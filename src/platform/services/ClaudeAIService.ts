/**
 * 🤖 CLAUDE AI SERVICE
 * 
 * Direct integration with Anthropic's Claude API for intelligent chat responses
 * Replaces the complex chain of API calls with direct Claude integration
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/platform/database/prisma-client';
import { EnhancedWorkspaceContextService } from '@/platform/ai/services/EnhancedWorkspaceContextService';

export interface ClaudeChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  currentRecord?: any;
  recordType?: string;
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
}

export class ClaudeAIService {
  private anthropic: Anthropic;
  private model: string = 'claude-sonnet-4-5';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
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
    
    try {
      // Check if this is a person search query and search database first
      const personSearchResult = await this.handlePersonSearchQuery(request);
      
      // Get comprehensive data context for the AI
      const dataContext = await this.getDataContext(request);
      
      // Add person search results to context if found
      if (personSearchResult) {
        dataContext.personSearchResults = personSearchResult;
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
        hasPersonSearchResults: !!personSearchResult
      });
      
      // Call Claude API with enhanced context
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 3000,
        system: systemPrompt,
        messages: messages,
        temperature: 0.7, // Balanced creativity and consistency
      });

      const processingTime = Date.now() - startTime;
      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

      console.log(`✅ [CLAUDE AI] Enhanced response generated in ${processingTime}ms`);

      return {
        response: responseText,
        confidence: 0.95, // Claude responses are generally high confidence
        model: this.model,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        processingTime: processingTime
      };

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
      /get me (.+)/i
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
      // Search for people in the database
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
   * Build enhanced system prompt with sales context and data access
   */
  private buildEnhancedSystemPrompt(request: ClaudeChatRequest, dataContext: any): string {
    const currentRecord = request.currentRecord;
    const recordType = request.recordType;
    const appType = request.appType;

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
    `  • ${action.type}: ${action.description} (${new Date(action.createdAt).toLocaleDateString()})`
  ).join('\n') || '  • No recent actions';
  
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

    return `You are Adrata, a friendly and knowledgeable sales acceleration AI assistant. You have full access to the user's CRM data and help sales professionals succeed.

🎯 YOUR ROLE:
You're like a trusted sales consultant who's always available to help. You understand the user's business, their prospects, and their challenges. You provide practical, actionable advice in a conversational, supportive tone.

📊 YOUR EXPERTISE:
- B2B sales strategies and methodologies
- CRM and pipeline optimization
- Prospect research and buyer intelligence
- Account-based selling and relationship building
- Revenue growth and deal closing
- Sales process improvement

${contextInfo}
${workspaceContext}
${workspaceBusinessContext}
${activitiesContext}
${personSearchContext}

💬 CONVERSATION STYLE:
- Be warm, professional, and encouraging
- Use natural, conversational language (avoid corporate jargon)
- Ask follow-up questions to understand their needs better
- Provide specific, actionable advice
- Reference their actual data and context when relevant
- Be concise but thorough
- Show genuine interest in their success
- Use proper markdown formatting for better readability

🚀 HOW TO HELP:
- Listen to what they're trying to accomplish
- Offer practical solutions based on their specific situation
- Suggest concrete next steps they can take
- Help them think through challenges and opportunities
- Share insights from their CRM data when helpful
- Be their sounding board for sales strategies

📝 RESPONSE FORMATTING:
- Use clear, readable text formatting
- Use bullet points (•) for lists
- Use numbered lists for steps
- Use clear section breaks with line spacing
- Keep responses well-structured and easy to scan
- Write in a conversational, professional tone
- Avoid markdown syntax - use plain text formatting

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

📊 SALES EXPERTISE:
- B2B sales methodologies (Challenger Sale, SPIN Selling, MEDDIC)
- CRM and pipeline management
- Lead qualification and nurturing
- Account-based selling strategies
- Revenue forecasting and analytics

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
   * Test Claude API connection
   */
  async testConnection(): Promise<boolean> {
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
