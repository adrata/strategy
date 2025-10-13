/**
 * 🧠 AI CONTEXT SERVICE
 * 
 * Modular service for building comprehensive AI context
 * Handles user, application, and data context assembly
 */

// import { WorkspaceDataRouter } from '../../services/workspace-data-router';

import { authFetch } from '@/platform/api-fetch';
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

    // Build user context (including personality preferences)
    const userContext = await this.buildUserContext(userId, workspaceId);
    
    // Build application context
    const applicationContext = this.buildApplicationContext(appType);
    
    // Build data context (fetch real data)
    const dataContext = await this.buildDataContext(appType, workspaceId, userId);
    
    // Build record context
    const recordContext = this.buildRecordContext(currentRecord, recordType);
    
    // Build list view context
    const listViewContextString = this.buildListViewContext(listViewContext);
    
    // Build document context
    const documentContextString = this.buildDocumentContext(documentContext);
    
    // Build system context
    const systemContext = this.buildSystemContext(conversationHistory);

    return {
      userContext,
      applicationContext,
      dataContext,
      recordContext,
      listViewContext: listViewContextString,
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
   * Build record-specific context with structured extraction and strategic fit analysis
   */
  private static buildRecordContext(currentRecord: any, recordType: string | null): string {
    if (!currentRecord || !recordType) {
      return `GENERAL APPLICATION CONTEXT:
- No specific record selected
- Provide general guidance about methodology and best practices
- Help with overall strategy and workflow optimization`;
    }

    const recordName = currentRecord.fullName || currentRecord.name || 'Unknown';
    const recordCompany = currentRecord.company || currentRecord.companyName || (recordType === 'companies' ? recordName : 'Unknown Company');
    const recordTitle = currentRecord.title || currentRecord.jobTitle || 'Unknown Title';
    
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

CRITICAL: The user is looking at company ${recordName} RIGHT NOW. Your responses should be specific to this company and its business context.`;
    } else {
      // Enhanced person record context
      const seniority = currentRecord.seniority || this.inferSeniority(recordTitle);
      const department = currentRecord.department || this.inferDepartment(recordTitle);
      const decisionPower = currentRecord.decisionPower || this.inferDecisionPower(recordTitle, seniority);
      const buyerGroupRole = currentRecord.buyerGroupRole || this.inferBuyerGroupRole(recordTitle, department);
      
      context = `=== CURRENT RECORD (WHO THEY ARE) ===
Name: ${recordName} at ${recordCompany}
Title: ${recordTitle}
Department: ${department}
Seniority: ${seniority}
Decision Authority: ${decisionPower}
Buying Committee Role: ${buyerGroupRole}
Email: ${currentRecord.email || currentRecord.workEmail || 'Not available'}
Phone: ${currentRecord.phone || currentRecord.workPhone || 'Not available'}
LinkedIn: ${currentRecord.linkedinUrl || 'Not available'}

Company Context:
- Company: ${recordCompany}
- Industry: ${currentRecord.company?.industry || 'Unknown'}
- Size: ${currentRecord.company?.employeeCount || 'Unknown'} employees
- Location: ${currentRecord.city || ''} ${currentRecord.state || ''} ${currentRecord.country || ''}

Role Analysis:
- This person is a ${seniority} ${recordTitle} in ${department}
- Decision power level: ${decisionPower}
- Likely role in buying process: ${buyerGroupRole}
- ${this.getEngagementAdvice(decisionPower, buyerGroupRole)}

Strategic Fit Analysis:
- Person works at ${recordCompany} (${currentRecord.company?.industry || 'unknown industry'})
- Role suggests ${this.getRoleInsights(recordTitle, department)}
- Decision authority indicates ${this.getDecisionInsights(decisionPower)}
- Buying role suggests ${this.getBuyingInsights(buyerGroupRole)}

CRITICAL: The user is looking at ${recordName} at ${recordCompany} RIGHT NOW. Your responses should be specific to this person and company.`;
    }

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
   */
  private static buildListViewContext(listViewContext: ListViewContext | undefined): string {
    if (!listViewContext) {
      return `LIST VIEW CONTEXT: No list view context available`;
    }

    const { visibleRecords, activeSection, appliedFilters, totalCount, lastUpdated } = listViewContext;
    
    // Limit to top 10 records for context to avoid overwhelming the AI
    const topRecords = visibleRecords.slice(0, 10);
    
    let context = `LIST VIEW CONTEXT:
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
      
      context += `\n${index + 1}. ${name} at ${company}
   - Title: ${title}
   - Status: ${status}
   - Priority: ${priority}`;
    });

    if (visibleRecords.length > 10) {
      context += `\n... and ${visibleRecords.length - 10} more records`;
    }

    context += `\n\nIMPORTANT: The user is currently viewing a list of ${activeSection}. You can reference these specific records by name when providing advice.`;

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
      // 🔐 SECURITY: Use authenticated fetch without query parameters
      const response = await authFetch(`${process['env']['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000'}/api/data/unified?type=speedrun&action=get`, {
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
