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
    
    // Build record context (now async to fetch company intelligence)
    const recordContext = await this.buildRecordContext(currentRecord, recordType, workspaceId);
    
    // Build list view context
    const listViewContextString = this.buildListViewContext(listViewContext);
    
    // Build document context
    const documentContextString = this.buildDocumentContext(documentContext);
    
    // Build system context (fetch user timezone for accurate date/time)
    const systemContext = await this.buildSystemContext(conversationHistory, userId);

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
      
      // Check if user_ai_preferences table exists before querying
      let userPreferences = null;
      if (prisma.user_ai_preferences && typeof prisma.user_ai_preferences.findFirst === 'function') {
        userPreferences = await prisma.user_ai_preferences.findFirst({
          where: {
            userId,
            workspaceId
          }
      });

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
      
      // Build comprehensive workspace context (CRITICAL: Seller/Company profile)
      const workspaceContext = await EnhancedWorkspaceContextService.buildWorkspaceContext(workspaceId);
      
      if (workspaceContext) {
        dataContext = EnhancedWorkspaceContextService.buildAIContextString(workspaceContext);
        
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
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();
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
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();
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
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
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
      recordFieldCount: currentRecord ? Object.keys(currentRecord).length : 0
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
      const isPersonType = recordType === 'people' || recordType === 'person' || recordType === 'speedrun-prospect' || recordType?.includes('person');
      const isLeadType = recordType === 'leads' || recordType === 'lead' || recordType?.includes('lead');
      const isProspectType = recordType === 'prospects' || recordType === 'prospect' || recordType?.includes('prospect');
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

CRITICAL: The user is looking at ${recordName} at ${recordCompany} RIGHT NOW. Your responses should be specific to this person and company. Use all available context including bio, interests, pain points, company details, and stored intelligence to craft personalized recommendations.

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
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
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
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

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
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

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
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

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
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

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
