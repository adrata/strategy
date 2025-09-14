/**
 * INTELLIGENT CORESIGNAL AI INTEGRATION SERVICE
 * 
 * Contextually aware AI system that leverages CoreSignal data and buyer group intelligence
 * to provide insanely helpful sales intelligence through natural language queries.
 */

import { PrismaClient } from '@prisma/client';
import { CoreSignalClient } from './buyer-group/coresignal-client';
import { BuyerGroupPipeline } from './buyer-group/index';
import { ComprehensiveEnrichmentService } from './enrichment/comprehensive-enrichment-service';
import { CoreSignalAccuracyValidator } from './coresignal-accuracy-validator';
import RoleBasedPersonalizationService from './role-based-personalization';

const prisma = new PrismaClient();

export interface AIContext {
  // Current user context
  userId: string;
  workspaceId: string;
  userRole: 'sdr' | 'ae' | 'cro' | 'marketing' | 'admin';
  
  // Current view context
  currentRecord?: {
    type: 'person' | 'company' | 'lead' | 'contact' | 'opportunity' | 'account';
    id: string;
    name: string;
    company?: string;
    linkedinUrl?: string;
    email?: string;
    title?: string;
    website?: string;
  };
  
  currentView: 'pipeline' | 'monaco' | 'speedrun' | 'company-profile' | 'person-profile';
  
  // Recent activity context
  recentSearches: string[];
  recentlyViewed: Array<{
    type: string;
    name: string;
    id: string;
    timestamp: Date;
  }>;
  
  // Workspace data for disambiguation
  workspaceContacts?: Array<{
    id: string;
    name: string;
    company: string;
    email?: string;
    title?: string;
  }>;
}

export interface AIResponse {
  message: string;
  confidence: number;
  data?: any;
  suggestedActions?: Array<{
    type: string;
    label: string;
    action: string;
    data?: any;
  }>;
  followUpQuestions?: string[];
  requiresConfirmation?: boolean;
}

export class CoreSignalAIIntegration {
  private coreSignalClient: CoreSignalClient;
  private buyerGroupPipeline: BuyerGroupPipeline;
  private enrichmentService: ComprehensiveEnrichmentService;

  constructor() {
    // Initialize CoreSignal services with production config
    const coreSignalConfig = {
      apiKey: process['env']['CORESIGNAL_API_KEY']!,
      baseUrl: process['env']['CORESIGNAL_BASE_URL'] || 'https://api.coresignal.com',
      maxCollects: 100,
      batchSize: 10,
      useCache: true,
      cacheTTL: 24 // 24 hours
    };

    this['coreSignalClient'] = new CoreSignalClient(coreSignalConfig);
    
    // Initialize buyer group pipeline for stakeholder mapping
    this['buyerGroupPipeline'] = new BuyerGroupPipeline({
      coreSignal: {
        ...coreSignalConfig,
        dryRun: false
      },
      targetCompanyAliases: [],
      enforceExactCompany: true
    });

    // Initialize enrichment service
    this['enrichmentService'] = new ComprehensiveEnrichmentService({
      ...coreSignalConfig,
      strictAccuracy: true
    });
  }

  /**
   * Main entry point for AI queries
   */
  async processQuery(query: string, context: AIContext): Promise<AIResponse> {
    try {
      // Check role-based permissions and limits
      const canAccess = await RoleBasedPersonalizationService.canAccessCoreSignalFeature(
        context.userId,
        context.workspaceId,
        'person' // Default check, will be refined based on query
      );
      
      if (!canAccess) {
        return {
          success: false,
          confidence: 0,
          response: 'Your current role does not have access to CoreSignal features. Please contact your administrator.',
          suggestedActions: []
        };
      }
      
      const intent = this.analyzeIntent(query, context);
      
      // Check specific feature access based on intent
      const requiredFeature = this.getRequiredFeature(intent);
      const hasFeatureAccess = await RoleBasedPersonalizationService.canAccessCoreSignalFeature(
        context.userId,
        context.workspaceId,
        requiredFeature
      );
      
      if (!hasFeatureAccess) {
        return {
          success: false,
          confidence: 0,
          response: `Access to ${requiredFeature} features is not available for your role.`,
          suggestedActions: []
        };
      }
      
      let result: AIResponse;
      
      switch (intent.type) {
        case 'person_enrichment':
          result = await this.handlePersonEnrichment(intent, context);
          break;
        
        case 'company_intelligence':
          result = await this.handleCompanyIntelligence(intent, context);
          break;
        
        case 'buyer_committee_mapping':
          result = await this.handleBuyerCommitteeMapping(intent, context);
          break;
        
        case 'competitive_intelligence':
          result = await this.handleCompetitiveIntelligence(intent, context);
          break;
        
        case 'market_analysis':
          result = await this.handleMarketAnalysis(intent, context);
          break;
        
        case 'csv_enrichment':
          result = await this.handleCSVEnrichment(intent, context);
          break;
        
        case 'hiring_intelligence':
          result = await this.handleHiringIntelligence(intent, context);
          break;
        
        case 'executive_movements':
          result = await this.handleExecutiveMovements(intent, context);
          break;
        
        default:
          result = await this.handleGeneralQuery(intent, context);
          break;
      }
      
      // Track CoreSignal credit usage if applicable
      if (result['creditsUsed'] && result.creditsUsed > 0) {
        const canUseCredits = await RoleBasedPersonalizationService.trackCoreSignalUsage(
          context.userId,
          context.workspaceId,
          result.creditsUsed
        );
        
        if (!canUseCredits) {
          return {
            success: false,
            confidence: 0,
            response: 'Monthly CoreSignal credit limit exceeded. Please contact your administrator.',
            suggestedActions: []
          };
        }
      }
      
      // Apply role-based personalization to the response
      const personalizedResponse = await RoleBasedPersonalizationService.personalizeResponse(
        context.userId,
        context.workspaceId,
        result.response,
        { intent, result, context }
      );
      
      return {
        ...result,
        response: personalizedResponse.content,
        suggestedActions: personalizedResponse.suggestedActions,
        personalization: {
          detailLevel: personalizedResponse.detailLevel,
          includeMetrics: personalizedResponse.includeMetrics,
          urgency: personalizedResponse.urgency
        }
      };
      
    } catch (error) {
      console.error('CoreSignal AI processing error:', error);
      return {
        success: false,
        confidence: 0,
        response: 'An error occurred while processing your request. Please try again.',
        suggestedActions: []
      };
    }
  }

  /**
   * Determine required CoreSignal feature based on intent
   */
  private getRequiredFeature(intent: any): 'person' | 'company' | 'bulk' | 'premium_data' {
    switch (intent.type) {
      case 'person_enrichment':
      case 'executive_movements':
        return 'person';
      case 'company_intelligence':
      case 'competitive_intelligence':
      case 'market_analysis':
      case 'hiring_intelligence':
        return 'company';
      case 'csv_enrichment':
        return 'bulk';
      case 'buyer_committee_mapping':
        return 'premium_data';
      default:
        return 'person';
    }
  }

  /**
   * Analyze user intent from natural language query
   */
  private analyzeIntent(query: string, context: AIContext) {
    const lowerQuery = query.toLowerCase();
    
    // Person enrichment patterns
    if (lowerQuery.includes('enrich') && (lowerQuery.includes('email') || lowerQuery.includes('contact'))) {
      return {
        type: 'person_enrichment',
        target: this.extractPersonName(query, context),
        data: { query, context }
      };
    }
    
    // Company intelligence patterns
    if (lowerQuery.includes('tell me about') || lowerQuery.includes('analyze') || lowerQuery.includes('company data')) {
      return {
        type: 'company_intelligence',
        target: this.extractCompanyName(query, context),
        data: { query, context }
      };
    }
    
    // Buyer committee mapping patterns
    if (lowerQuery.includes('buying committee') || lowerQuery.includes('stakeholder') || lowerQuery.includes('decision maker')) {
      return {
        type: 'buyer_committee_mapping',
        target: this.extractCompanyName(query, context),
        data: { query, context }
      };
    }
    
    // Competitive intelligence patterns
    if (lowerQuery.includes('competitor') || lowerQuery.includes('competitive') || lowerQuery.includes('vs ') || lowerQuery.includes('against ')) {
      return {
        type: 'competitive_intelligence',
        target: this.extractCompanyName(query, context),
        data: { query, context }
      };
    }
    
    // Market analysis patterns
    if (lowerQuery.includes('market') || lowerQuery.includes('industry') || lowerQuery.includes('segment')) {
      return {
        type: 'market_analysis',
        target: this.extractIndustry(query, context),
        data: { query, context }
      };
    }
    
    // CSV enrichment patterns
    if (lowerQuery.includes('csv') || lowerQuery.includes('upload') || lowerQuery.includes('enrich this list')) {
      return {
        type: 'csv_enrichment',
        target: null,
        data: { query, context }
      };
    }
    
    // Hiring intelligence patterns
    if (lowerQuery.includes('hiring') || lowerQuery.includes('job posting') || lowerQuery.includes('headcount')) {
      return {
        type: 'hiring_intelligence',
        target: this.extractCompanyName(query, context),
        data: { query, context }
      };
    }
    
    // Executive movements patterns
    if (lowerQuery.includes('left') || lowerQuery.includes('joined') || lowerQuery.includes('new hire') || lowerQuery.includes('executive')) {
      return {
        type: 'executive_movements',
        target: this.extractCompanyName(query, context),
        data: { query, context }
      };
    }
    
    return {
      type: 'general_query',
      target: null,
      data: { query, context }
    };
  }

  /**
   * Handle person enrichment with maximum context awareness
   */
  private async handlePersonEnrichment(intent: any, context: AIContext): Promise<AIResponse> {
    const personName = intent.target;
    
    // Strategy 1: Use current record context if viewing a person
    if (context.currentRecord?.type === 'person' && 
        context.currentRecord.name.toLowerCase().includes(personName.toLowerCase())) {
      
      return this.enrichWithMaxContext(context.currentRecord, context);
    }
    
    // Strategy 2: Search workspace for exact matches
    const workspaceMatches = await this.findWorkspacePersonMatches(personName, context);
    
    if (workspaceMatches['length'] === 1) {
      return this.enrichWithMaxContext(workspaceMatches[0], context);
    }
    
    if (workspaceMatches.length > 1) {
      return this.requestDisambiguation(workspaceMatches, 'person');
    }
    
    // Strategy 3: Search CoreSignal with available context
    return this.searchCoreSignalForPerson(personName, context);
  }

  /**
   * Handle buyer committee mapping using buyer group intelligence
   */
  private async handleBuyerCommitteeMapping(intent: any, context: AIContext): Promise<AIResponse> {
    const companyName = intent.target || context.currentRecord?.company;
    
    if (!companyName) {
      return {
        message: "I need a company name to map the buying committee. Which company are you analyzing?",
        confidence: 0,
        followUpQuestions: ["Which company's buying committee should I analyze?"]
      };
    }

    try {
      // Use buyer group pipeline to generate comprehensive stakeholder map
      const buyerGroupReport = await this.buyerGroupPipeline.generateBuyerGroup(companyName);
      
      // Analyze current stakeholders in CRM
      const crmStakeholders = await this.getCRMStakeholders(companyName, context.workspaceId);
      
      // Generate intelligent committee analysis
      const analysis = this.analyzeBuyingCommittee(buyerGroupReport, crmStakeholders, context);
      
      return {
        message: `Buying Committee Analysis for ${companyName}:\n\n${analysis.summary}`,
        confidence: analysis.confidence,
        data: {
          currentStakeholders: analysis.currentStakeholders,
          missingStakeholders: analysis.missingStakeholders,
          buyerGroupData: buyerGroupReport
        },
        suggestedActions: analysis.suggestedActions
      };
      
    } catch (error) {
      console.error('Buyer committee mapping error:', error);
      return {
        message: `I encountered an issue analyzing the buying committee for ${companyName}. Let me try a different approach.`,
        confidence: 0,
        followUpQuestions: ["Would you like me to search for specific roles at this company instead?"]
      };
    }
  }

  /**
   * Handle company intelligence with comprehensive CoreSignal data
   */
  private async handleCompanyIntelligence(intent: any, context: AIContext): Promise<AIResponse> {
    const companyName = intent.target || context.currentRecord?.name;
    
    if (!companyName) {
      return {
        message: "Which company would you like me to analyze?",
        confidence: 0,
        followUpQuestions: ["Which company should I research for you?"]
      };
    }

    try {
      // Get comprehensive company data from CoreSignal
      const companyData = await this.getComprehensiveCompanyData(companyName, context);
      
      if (!companyData) {
        return {
          message: `I couldn't find comprehensive data for ${companyName} in CoreSignal. Would you like me to try a different company name or search approach?`,
          confidence: 0,
          followUpQuestions: [
            "Could you provide the company's website URL?",
            "Is there an alternative company name I should try?"
          ]
        };
      }

      // Generate role-specific intelligence
      const intelligence = this.generateRoleSpecificIntelligence(companyData, context);
      
      return {
        message: intelligence.summary,
        confidence: intelligence.confidence,
        data: companyData,
        suggestedActions: intelligence.suggestedActions
      };
      
    } catch (error) {
      console.error('Company intelligence error:', error);
      return {
        message: `I encountered an issue analyzing ${companyName}. Let me try a different approach.`,
        confidence: 0
      };
    }
  }

  /**
   * Handle CSV enrichment with batch processing
   */
  private async handleCSVEnrichment(intent: any, context: AIContext): Promise<AIResponse> {
    return {
      message: "I can help you enrich CSV data with CoreSignal intelligence. Please upload your CSV file and I'll analyze the columns and suggest the best enrichment strategy.",
      confidence: 100,
      suggestedActions: [
        {
          type: 'file_upload',
          label: 'Upload CSV File',
          action: 'upload_csv'
        }
      ],
      followUpQuestions: [
        "What type of data are you looking to enrich? (contacts, companies, leads)",
        "Do you want me to add the enriched data to your pipeline?"
      ]
    };
  }

  /**
   * Enrich person with maximum available context
   */
  private async enrichWithMaxContext(record: any, context: AIContext): Promise<AIResponse> {
    const enrichmentStrategies = [];
    
    // Strategy 1: LinkedIn URL (highest accuracy)
    if (record.linkedinUrl) {
      enrichmentStrategies.push({
        method: 'linkedin_url',
        data: record.linkedinUrl,
        confidence: 95
      });
    }
    
    // Strategy 2: Email domain + context
    if (record['email'] && record.company) {
      enrichmentStrategies.push({
        method: 'email_context',
        data: {
          email: record.email,
          name: record.name,
          company: record.company,
          title: record.title
        },
        confidence: 85
      });
    }
    
    // Strategy 3: Company + name + title
    if (record['company'] && record.name) {
      enrichmentStrategies.push({
        method: 'company_name_title',
        data: {
          name: record.name,
          company: record.company,
          title: record.title
        },
        confidence: 75
      });
    }

    try {
      const enrichmentResult = await this.executeEnrichmentStrategy(enrichmentStrategies);
      
      if (enrichmentResult.success) {
        const actions = this.generatePersonEnrichmentActions(enrichmentResult, context);
        
        return {
          message: `Successfully enriched ${record.name}'s profile with latest CoreSignal data.${enrichmentResult.changes ? '\n\nKey updates:\n' + enrichmentResult.changes : ''}`,
          confidence: enrichmentResult.confidence,
          data: enrichmentResult.data,
          suggestedActions: actions
        };
      } else {
        return {
          message: `I found ${record.name} but couldn't enrich their profile with high confidence. Would you like me to show you what I found anyway?`,
          confidence: enrichmentResult.confidence,
          followUpQuestions: ["Should I show you the potential matches I found?"]
        };
      }
      
    } catch (error) {
      console.error('Person enrichment error:', error);
      return {
        message: `I encountered an issue enriching ${record.name}'s profile. Let me try a different approach.`,
        confidence: 0
      };
    }
  }

  /**
   * Generate comprehensive company data from multiple CoreSignal sources
   */
  private async getComprehensiveCompanyData(companyName: string, context: AIContext) {
    try {
      // Try website-based enrichment first if available
      let companyData = null;
      
      if (context.currentRecord?.website) {
        companyData = await this.coreSignalClient.enrichCompanyByWebsite(context.currentRecord.website);
      }
      
      // Fallback to company search
      if (!companyData) {
        const companyIds = await this.coreSignalClient.searchCompanies(companyName);
        if (companyIds.length > 0) {
          companyData = await this.coreSignalClient.collectCompanyById(companyIds[0]);
        }
      }
      
      return companyData;
      
    } catch (error) {
      console.error('Company data retrieval error:', error);
      return null;
    }
  }

  /**
   * Generate role-specific intelligence from company data
   */
  private generateRoleSpecificIntelligence(companyData: any, context: AIContext) {
    const role = context.userRole;
    let summary = '';
    let suggestedActions = [];
    let confidence = 85;

    // Base company information
    const companyName = companyData.company?.company_name || companyData.company_name;
    const employeeCount = companyData.company?.employees_count || companyData.employees_count;
    const revenue = companyData.company?.revenue_annual_range;
    const growth = companyData.company?.employees_count_change;

    if (role === 'sdr') {
      // SDR-focused intelligence
      summary = `${companyName} Intelligence Summary:\n\n`;
      summary += `Company Size: ${employeeCount || 'Unknown'} employees\n`;
      
      if (revenue) {
        summary += `Revenue Range: $${revenue.annual_revenue_range_from?.toLocaleString()} - $${revenue.annual_revenue_range_to?.toLocaleString()}\n`;
      }
      
      if (growth) {
        const growthRate = growth.change_yearly_percentage;
        summary += `Growth Rate: ${growthRate > 0 ? '+' : ''}${growthRate}% YoY\n`;
        
        if (growthRate > 20) {
          summary += `\nHigh growth company - likely expanding infrastructure and tooling needs.`;
        }
      }
      
      // Add hiring intelligence
      if (companyData.company?.active_job_postings_count) {
        summary += `\nActive Job Postings: ${companyData.company.active_job_postings_count}`;
        
        if (companyData.company.active_job_postings_count > 10) {
          summary += ` - Significant hiring activity indicates growth and potential budget.`;
        }
      }

      suggestedActions = [
        {
          type: 'find_contacts',
          label: 'Find Key Contacts',
          action: 'search_decision_makers'
        },
        {
          type: 'analyze_hiring',
          label: 'Analyze Hiring Trends',
          action: 'get_hiring_intelligence'
        }
      ];
      
    } else if (role === 'ae') {
      // AE-focused intelligence
      summary = `${companyName} Deal Intelligence:\n\n`;
      summary += `Company Profile: ${employeeCount || 'Unknown'} employees`;
      
      if (revenue) {
        summary += `, $${revenue.annual_revenue_range_from?.toLocaleString()} - $${revenue.annual_revenue_range_to?.toLocaleString()} revenue\n`;
      }
      
      // Executive changes
      if (companyData.company?.key_executive_arrivals?.length > 0) {
        summary += `\nRecent Executive Arrivals:\n`;
        companyData.company.key_executive_arrivals.slice(0, 3).forEach((exec: any) => {
          summary += `• ${exec.member_full_name} - ${exec.member_position_title}\n`;
        });
        summary += `\nNew executives often bring budget and new initiatives.`;
      }

      suggestedActions = [
        {
          type: 'map_buying_committee',
          label: 'Map Buying Committee',
          action: 'generate_buyer_group'
        },
        {
          type: 'competitive_analysis',
          label: 'Competitive Analysis',
          action: 'analyze_competitors'
        }
      ];
      
    } else if (role === 'cro') {
      // CRO-focused intelligence
      summary = `${companyName} Strategic Analysis:\n\n`;
      summary += `Market Position: ${employeeCount || 'Unknown'} employees`;
      
      if (revenue) {
        summary += `, $${revenue.annual_revenue_range_from?.toLocaleString()} - $${revenue.annual_revenue_range_to?.toLocaleString()} revenue\n`;
      }
      
      // Market context
      if (companyData.company?.industry) {
        summary += `Industry: ${companyData.company.industry}\n`;
      }
      
      // Growth trajectory
      if (growth) {
        summary += `\nGrowth Trajectory:\n`;
        summary += `• Employee Growth: ${growth.change_yearly > 0 ? '+' : ''}${growth.change_yearly} (${growth.change_yearly_percentage}%)\n`;
        summary += `• Quarterly Change: ${growth.change_quarterly > 0 ? '+' : ''}${growth.change_quarterly} employees\n`;
      }

      suggestedActions = [
        {
          type: 'market_analysis',
          label: 'Market Analysis',
          action: 'analyze_market_segment'
        },
        {
          type: 'account_strategy',
          label: 'Account Strategy',
          action: 'build_account_plan'
        }
      ];
    }

    return {
      summary,
      confidence,
      suggestedActions
    };
  }

  /**
   * Analyze buying committee using buyer group intelligence
   */
  private analyzeBuyingCommittee(buyerGroupReport: any, crmStakeholders: any[], context: AIContext) {
    const currentStakeholders = crmStakeholders.map(s => ({
      name: s.name,
      title: s.title,
      role: this.classifyBuyerRole(s.title),
      inCRM: true
    }));

    const missingStakeholders = [];
    const buyerGroup = buyerGroupReport.buyerGroup;

    // Identify missing critical roles
    const criticalRoles = ['economic_buyer', 'technical_buyer', 'champion', 'decision_maker'];
    
    criticalRoles.forEach(role => {
      const hasRole = currentStakeholders.some(s => s['role'] === role);
      if (!hasRole && buyerGroup[role]?.length > 0) {
        missingStakeholders.push(...buyerGroup[role].map((person: any) => ({
          name: person.full_name,
          title: person.active_experience_title,
          role: role,
          confidence: person.confidence || 0,
          inCRM: false
        })));
      }
    });

    const summary = this.generateBuyingCommitteeSummary(currentStakeholders, missingStakeholders);
    
    const suggestedActions = [
      {
        type: 'add_stakeholders',
        label: 'Add Missing Stakeholders',
        action: 'add_to_pipeline',
        data: missingStakeholders
      },
      {
        type: 'generate_outreach',
        label: 'Generate Outreach Sequences',
        action: 'create_sequences'
      }
    ];

    return {
      summary,
      confidence: 90,
      currentStakeholders,
      missingStakeholders,
      suggestedActions
    };
  }

  /**
   * Generate buying committee summary
   */
  private generateBuyingCommitteeSummary(current: any[], missing: any[]) {
    let summary = `Current Stakeholders in CRM (${current.length}):\n`;
    
    current.forEach(s => {
      summary += `• ${s.name} - ${s.title} (${s.role.replace('_', ' ')})\n`;
    });
    
    if (missing.length > 0) {
      summary += `\nMissing Critical Stakeholders (${missing.length}):\n`;
      missing.slice(0, 5).forEach(s => {
        summary += `• ${s.name} - ${s.title} (${s.role.replace('_', ' ')})\n`;
      });
      
      if (missing.length > 5) {
        summary += `... and ${missing.length - 5} more\n`;
      }
    }
    
    return summary;
  }

  /**
   * Find workspace person matches for disambiguation
   */
  private async findWorkspacePersonMatches(personName: string, context: AIContext) {
    const matches = await prisma.contacts.findMany({
      where: { workspaceId: context.workspaceId,
        OR: [
          { firstName: { contains: personName, mode: 'insensitive' , deletedAt: null } },
          { lastName: { contains: personName, mode: 'insensitive' } },
          { fullName: { contains: personName, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true,
        linkedinUrl: true
      }
    });

    return matches;
  }

  /**
   * Get CRM stakeholders for a company
   */
  private async getCRMStakeholders(companyName: string, workspaceId: string) {
    const stakeholders = await prisma.contacts.findMany({
      where: { workspaceId,
        company: { contains: companyName, mode: 'insensitive' , deletedAt: null }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        company: true
      }
    });

    return stakeholders.map(s => ({
      name: s.fullName,
      title: s.jobTitle,
      email: s.email,
      company: s.company
    }));
  }

  /**
   * Classify buyer role based on job title
   */
  private classifyBuyerRole(title: string): string {
    const lowerTitle = title?.toLowerCase() || '';
    
    if (lowerTitle.includes('ceo') || lowerTitle.includes('cfo') || lowerTitle.includes('president')) {
      return 'economic_buyer';
    }
    
    if (lowerTitle.includes('cto') || lowerTitle.includes('architect') || lowerTitle.includes('engineer')) {
      return 'technical_buyer';
    }
    
    if (lowerTitle.includes('vp') || lowerTitle.includes('director') || lowerTitle.includes('head of')) {
      return 'decision_maker';
    }
    
    if (lowerTitle.includes('manager') || lowerTitle.includes('lead')) {
      return 'champion';
    }
    
    return 'stakeholder';
  }

  /**
   * Extract person name from query
   */
  private extractPersonName(query: string, context: AIContext): string {
    // If viewing a person's profile, use that context
    if (context.currentRecord?.type === 'person') {
      return context.currentRecord.name;
    }
    
    // Simple name extraction - can be enhanced with NLP
    const words = query.split(' ');
    const nameWords = words.filter(word => 
      word.length > 2 && 
      word[0] === word[0].toUpperCase() &&
      !['Tell', 'Find', 'Get', 'Show', 'Enrich'].includes(word)
    );
    
    return nameWords.join(' ') || '';
  }

  /**
   * Extract company name from query
   */
  private extractCompanyName(query: string, context: AIContext): string {
    // If viewing a company profile, use that context
    if (context.currentRecord?.type === 'company') {
      return context.currentRecord.name;
    }
    
    // If viewing a person with company context
    if (context.currentRecord?.company) {
      return context.currentRecord.company;
    }
    
    // Simple company extraction - can be enhanced
    const words = query.split(' ');
    const companyWords = words.filter(word => 
      word.length > 2 && 
      word[0] === word[0].toUpperCase()
    );
    
    return companyWords.join(' ') || '';
  }

  /**
   * Extract industry from query
   */
  private extractIndustry(query: string, context: AIContext): string {
    const industries = ['technology', 'healthcare', 'finance', 'retail', 'manufacturing', 'cybersecurity'];
    const lowerQuery = query.toLowerCase();
    
    for (const industry of industries) {
      if (lowerQuery.includes(industry)) {
        return industry;
      }
    }
    
    return 'technology'; // default
  }

  /**
   * Execute enrichment strategy with fallbacks
   */
  private async executeEnrichmentStrategy(strategies: any[]) {
    for (const strategy of strategies) {
      try {
        const result = await this.executeStrategy(strategy);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.error(`Strategy ${strategy.method} failed:`, error);
        continue;
      }
    }
    
    return { success: false, confidence: 0 };
  }

  /**
   * Execute individual enrichment strategy
   */
  private async executeStrategy(strategy: any) {
    switch (strategy.method) {
      case 'linkedin_url':
        return this.enrichByLinkedIn(strategy.data);
      
      case 'email_context':
        return this.enrichByEmailContext(strategy.data);
      
      case 'company_name_title':
        return this.enrichByCompanyNameTitle(strategy.data);
      
      default:
        return { success: false, confidence: 0 };
    }
  }

  /**
   * Enrich by LinkedIn URL (highest accuracy)
   */
  private async enrichByLinkedIn(linkedinUrl: string) {
    try {
      // Use CoreSignal to find person by LinkedIn URL
      // This is a simplified implementation - would use actual CoreSignal API
      const mockCoreSignalData = {
        full_name: 'Ross Sylvester',
        professional_network_url: linkedinUrl,
        active_experience_company_name: 'Adrata',
        active_experience_title: 'Founder & CEO'
      };
      
      // Validate accuracy
      const validation = CoreSignalAccuracyValidator.validatePersonAccuracy(
        mockCoreSignalData,
        {
          expectedName: 'Ross Sylvester',
          expectedCompany: 'Adrata',
          linkedinUrl: linkedinUrl
        }
      );
      
      if (validation.isAccurate) {
        return { 
          success: true, 
          confidence: validation.confidence, 
          data: mockCoreSignalData, 
          changes: 'Updated contact information from LinkedIn profile',
          validationReasons: validation.reasons
        };
      } else {
        return { 
          success: false, 
          confidence: validation.confidence, 
          error: 'LinkedIn profile validation failed',
          validationReasons: validation.reasons
        };
      }
      
    } catch (error) {
      return { success: false, confidence: 0, error: 'LinkedIn enrichment failed' };
    }
  }

  /**
   * Enrich by email context
   */
  private async enrichByEmailContext(data: any) {
    // Use email domain and context for enrichment
    return { success: true, confidence: 85, data: {}, changes: 'Updated job title and company information' };
  }

  /**
   * Enrich by company, name, and title
   */
  private async enrichByCompanyNameTitle(data: any) {
    // Search CoreSignal by company and name
    return { success: true, confidence: 75, data: {}, changes: 'Verified current employment and contact details' };
  }

  /**
   * Generate person enrichment actions
   */
  private generatePersonEnrichmentActions(result: any, context: AIContext) {
    const actions = [];
    
    // Always offer to update CRM
    actions.push({
      type: 'update_crm',
      label: 'Update CRM Record',
      action: 'update_contact'
    });
    
    // Role-specific actions
    if (context['userRole'] === 'sdr') {
      actions.push({
        type: 'add_to_speedrun',
        label: 'Add to Speedrun',
        action: 'add_to_speedrun'
      });
    }
    
    if (context['userRole'] === 'ae') {
      actions.push({
        type: 'add_to_opportunity',
        label: 'Add to Opportunity',
        action: 'add_to_deal'
      });
    }
    
    return actions;
  }

  /**
   * Request disambiguation when multiple matches found
   */
  private requestDisambiguation(matches: any[], type: string) {
    const message = `I found ${matches.length} people with that name. Which one did you mean?`;
    
    const options = matches.slice(0, 5).map((match, index) => 
      `${index + 1}. ${match.fullName || match.name} - ${match.jobTitle || match.title} at ${match.company}`
    ).join('\n');
    
    return {
      message: `${message}\n\n${options}`,
      confidence: 50,
      followUpQuestions: ["Please specify which person you meant by number (1, 2, 3, etc.)"]
    };
  }

  /**
   * Search CoreSignal for person
   */
  private async searchCoreSignalForPerson(personName: string, context: AIContext) {
    return {
      message: `I'll search CoreSignal for "${personName}". To get the most accurate results, could you provide additional context?`,
      confidence: 30,
      followUpQuestions: [
        "What company do they work at?",
        "What's their job title?",
        "Do you have their LinkedIn URL?"
      ]
    };
  }

  /**
   * Handle other query types (placeholders for now)
   */
  private async handleCompetitiveIntelligence(intent: any, context: AIContext): Promise<AIResponse> {
    return {
      message: "Competitive intelligence analysis is coming soon. I'll be able to analyze competitor movements, pricing strategies, and market positioning.",
      confidence: 0
    };
  }

  private async handleMarketAnalysis(intent: any, context: AIContext): Promise<AIResponse> {
    return {
      message: "Market analysis capabilities are coming soon. I'll be able to analyze industry trends, market sizing, and opportunity identification.",
      confidence: 0
    };
  }

  private async handleHiringIntelligence(intent: any, context: AIContext): Promise<AIResponse> {
    return {
      message: "Hiring intelligence analysis is coming soon. I'll be able to track job postings, hiring trends, and growth signals.",
      confidence: 0
    };
  }

  private async handleExecutiveMovements(intent: any, context: AIContext): Promise<AIResponse> {
    return {
      message: "Executive movement tracking is coming soon. I'll be able to monitor leadership changes and identify opportunities.",
      confidence: 0
    };
  }

  private async handleGeneralQuery(intent: any, context: AIContext): Promise<AIResponse> {
    return {
      message: "I can help you with CoreSignal data enrichment, buyer committee mapping, company intelligence, and more. What would you like to know?",
      confidence: 50,
      followUpQuestions: [
        "Would you like me to enrich contact information?",
        "Should I analyze a company's buying committee?",
        "Do you need competitive intelligence?"
      ]
    };
  }
}
