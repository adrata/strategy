/**
 * 🧠 AI CONTEXT SERVICE
 * 
 * Modular service for building comprehensive AI context
 * Handles user, application, and data context assembly
 */

// import { WorkspaceDataRouter } from '../../services/workspace-data-router';

export interface AIContextConfig {
  userId: string;
  workspaceId: string;
  appType: string;
  currentRecord?: any;
  recordType?: string;
  conversationHistory?: any[];
  documentContext?: any; // Add document context
}

export interface EnhancedAIContext {
  userContext: string;
  applicationContext: string;
  dataContext: string;
  recordContext: string;
  systemContext: string;
  documentContext: string; // Add document context
}

export class AIContextService {
  
  /**
   * Build comprehensive AI context from configuration
   */
  static async buildContext(config: AIContextConfig): Promise<EnhancedAIContext> {
    const {
      userId,
      workspaceId,
      appType,
      currentRecord,
      recordType,
      conversationHistory = [],
      documentContext
    } = config;

    // Build user context (including personality preferences)
    const userContext = await this.buildUserContext(userId, workspaceId);
    
    // Build application context
    const applicationContext = this.buildApplicationContext(appType);
    
    // Build data context (fetch real data)
    const dataContext = await this.buildDataContext(appType, workspaceId, userId);
    
    // Build record context
    const recordContext = this.buildRecordContext(currentRecord, recordType);
    
    // Build document context
    const documentContextString = this.buildDocumentContext(documentContext);
    
    // Build system context
    const systemContext = this.buildSystemContext(conversationHistory);

    return {
      userContext,
      applicationContext,
      dataContext,
      recordContext,
      documentContext: documentContextString,
      systemContext
    };
  }

  /**
   * Build user-specific context including personality preferences
   */
  private static async buildUserContext(userId: string, workspaceId: string): Promise<string> {
    let userContext = `CURRENT USER CONTEXT:
- User ID: ${userId}
- Workspace: ${workspaceId}
- This is a PRODUCTION environment with REAL data
- User expects context-aware responses about their current view`;

    // Get user personality preferences
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const userPreferences = await prisma.user_ai_preferences.findFirst({
        where: {
          userId,
          workspaceId
        }
      });

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
      
      await prisma.$disconnect();
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
        description: 'High-velocity sales methodology',
        purpose: 'Rapid prospect contact and qualification',
        features: 'Prospect list, selected prospect details, pipeline metrics',
        behavior: 'Provide specific advice about visible prospects and speedrun methodology'
      },
      'Pipeline': {
        description: 'Lead and opportunity management',
        purpose: 'Lead nurturing, opportunity tracking, and pipeline management',
        features: 'Lead details, opportunity stages, pipeline analytics, CRUD operations',
        behavior: 'Help with lead management, opportunity progression, data operations, and pipeline optimization'
      },
      'Monaco': {
        description: 'Buyer group intelligence platform',
        purpose: 'Strategic sales intelligence and buyer group analysis',
        features: 'Intelligence dashboards, insights, and analytics',
        behavior: 'Provide strategic insights and intelligence analysis'
      }
    };

    const context = appContexts[appType as keyof typeof appContexts] || appContexts['Pipeline'];

    return `CURRENT APPLICATION STATE:
- Application: ${appType} (${context.description})
- Purpose: ${context.purpose}
- User can see: ${context.features}
- Expected AI behavior: ${context.behavior}

CODEBASE KNOWLEDGE:
- This is the Adrata platform built with Next.js 15, React 19, TypeScript
- Speedrun is a core product for high-velocity sales
- Pipeline manages leads, opportunities, and sales processes
- Users work with prospect lists of 50+ contacts per day
- System includes Monaco enrichment, buyer group intelligence, and AI-powered insights
- Platform supports web, desktop (Tauri), and mobile (Capacitor)

DATABASE SCHEMA UNDERSTANDING:
- Lead model: Contains prospect information (name, email, company, title, status, priority)
- Opportunity model: Tracks sales opportunities with stages, values, close dates
- User model: Manages user accounts, workspaces, and permissions
- Workspace model: Organizes data by company/team boundaries
- Relationships: Leads can have multiple opportunities, users are assigned to leads
- Key fields: workspaceId (for data isolation), status (for pipeline stages), priority (for ranking)

CRUD OPERATIONS CAPABILITY:
- CREATE: Can help create new leads, opportunities, notes, and tasks
- READ: Can query and analyze existing data, generate reports and insights
- UPDATE: Can help update lead status, priority, notes, and opportunity stages
- DELETE: Can help archive or remove outdated records (with proper validation)
- BUSINESS RULES: Understands validation requirements, required fields, and workflow constraints`;
  }

  /**
   * Build data context by fetching real application data
   */
  private static async buildDataContext(appType: string, workspaceId: string, userId: string): Promise<string> {
    try {
      let dataContext = '';
      
      // Import the enhanced workspace context service
      const { EnhancedWorkspaceContextService } = await import('./EnhancedWorkspaceContextService');
      
      // Build comprehensive workspace context
      const workspaceContext = await EnhancedWorkspaceContextService.buildWorkspaceContext(workspaceId);
      
      if (workspaceContext) {
        dataContext = EnhancedWorkspaceContextService.buildAIContextString(workspaceContext);
      }
      
      if (appType === 'Speedrun') {
        const speedrunData = await this.fetchSpeedrunData(workspaceId, userId);
        if (speedrunData) {
          const prospectsCount = speedrunData.prospects?.length || 0;
          const readyCount = speedrunData.prospects?.filter((p: any) => p['status'] === 'ready')?.length || 0;
          const completedCount = speedrunData.prospects?.filter((p: any) => p['status'] === 'completed')?.length || 0;
          
          dataContext += `\n\nREAL SPEEDRUN DATA CONTEXT:
- Total Prospects: ${prospectsCount}
- Ready to Contact: ${readyCount}
- Completed Today: ${completedCount}
- User's actual prospect pipeline is loaded and visible
- Provide insights based on this REAL data, not hypothetical examples
- Reference specific prospect counts and pipeline status in responses`;

          // Add sample prospect names for context
          if (speedrunData.prospects?.length > 0) {
            const sampleProspects = speedrunData.prospects.slice(0, 5).map((p: any) => `${p.name} at ${p.company}`).join(', ');
            dataContext += `\n- Sample prospects in pipeline: ${sampleProspects}`;
          }
        }
      } else if (appType === 'Pipeline') {
        const pipelineData = await this.fetchPipelineData(workspaceId, userId);
        if (pipelineData) {
          const leadsCount = pipelineData.leads?.length || 0;
          const opportunitiesCount = pipelineData.opportunities?.length || 0;
          const qualifiedLeads = pipelineData.leads?.filter((l: any) => l['status'] === 'qualified')?.length || 0;
          const activeOpportunities = pipelineData.opportunities?.filter((o: any) => o.stage !== 'closed-lost' && o.stage !== 'closed-won')?.length || 0;
          
          dataContext = `REAL PIPELINE DATA CONTEXT:
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

      return dataContext;
    } catch (error) {
      console.warn(`⚠️ Failed to fetch ${appType} data for context:`, error);
      return `DATA CONTEXT: Unable to fetch real-time data, using general guidance`;
    }
  }

  /**
   * Build record-specific context
   */
  private static buildRecordContext(currentRecord: any, recordType: string | null): string {
    if (!currentRecord || !recordType) {
      return `GENERAL APPLICATION CONTEXT:
- No specific record selected
- Provide general guidance about methodology and best practices
- Help with overall strategy and workflow optimization`;
    }

    const recordName = currentRecord.fullName || currentRecord.name || 'Unknown';
    const recordCompany = currentRecord.company || 'Unknown Company';
    const recordTitle = currentRecord.title || currentRecord.jobTitle || 'Unknown Title';
    
    let context = `CURRENT RECORD CONTEXT:
- CURRENTLY VIEWING: ${recordName} at ${recordCompany}
- Title: ${recordTitle}
- Record Type: ${recordType}
- This is a LIVE record in the user's system
- The user can see this record's complete profile on their screen
- Provide SPECIFIC, actionable advice about engaging with THIS exact record
- Reference their company, role, and any visible details when giving advice
- Focus on practical next steps for this specific contact

VISIBLE RECORD DATA:
${JSON.stringify(currentRecord, null, 2)}

CRITICAL: The user is looking at ${recordName} at ${recordCompany} RIGHT NOW. Your responses should be specific to this person and company.`;

    // Add enrichment context if available
    if (currentRecord.monacoEnrichment) {
      context += `\n\nMONACO ENRICHMENT DATA AVAILABLE:
- This record has been enriched with Monaco intelligence
- Use this data to provide highly personalized recommendations
- Reference specific pain points, motivations, and decision factors
- Leverage buyer group analysis and opportunity intelligence`;
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
  private static buildSystemContext(conversationHistory: any[]): string {
    const recentHistory = Array.isArray(conversationHistory) ? conversationHistory.slice(-5) : [];
    const conversationContext = recentHistory.length > 0 
      ? `\n\nRECENT CONVERSATION CONTEXT (last 5 messages):\n${recentHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n')}\n`
      : '';

    const currentDateTime = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return `SYSTEM CONTEXT:
CURRENT DATE AND TIME: ${currentDateTime}

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
  private static async fetchSpeedrunData(workspaceId: string, userId: string): Promise<any> {
    try {
      const response = await fetch(`${process['env']['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000'}/api/data/unified?type=speedrun&action=get&workspaceId=${workspaceId}&userId=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch Speedrun data:', error);
    }
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
   * Combine all context into final prompt
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

    return `You are Adrata, an intelligent sales assistant and expert advisor.

Your expertise includes:
- Sales strategy and pipeline optimization
- Lead qualification and buyer group analysis
- Email outreach and communication strategies
- CRM data analysis and insights
- Industry trends and competitive intelligence
- Revenue forecasting and performance tracking
- Document analysis and data extraction from uploaded files

You provide:
- Intelligent, contextual responses based on real user data and uploaded documents
- Actionable recommendations and next steps
- Professional guidance that is natural, smart, and helpful
- Accurate information about dates, times, and current context
- Analysis and insights from uploaded documents (CSV, Excel, PDF, Word, etc.)

${personalityInstructions}

=== COMPREHENSIVE CONTEXT SYSTEM ===

${context.userContext}

${context.applicationContext}

${context.dataContext}

${context.recordContext}

${context.documentContext}

${context.systemContext}

=== CRITICAL INSTRUCTIONS ===
${hasPersonality ? 
  'IMPORTANT: You MUST adapt your response style to match the user\'s personality preferences listed above. Follow the tone, style, and communication approach specified in the personality instructions. This is non-negotiable.' : 
  'Provide professional, helpful responses that align with Adrata\'s brand standards.'}`;
  }
}
