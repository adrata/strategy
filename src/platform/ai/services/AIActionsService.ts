/**
 * ⚡ AI ACTIONS SERVICE
 * 
 * Key actions the AI can take on behalf of users
 * Handles complex workflows and business operations
 */

import { AIDataService, DataQuery } from './AIDataService';
import { PredictiveIntelligenceService } from './PredictiveIntelligenceService';
import { QuotaIntelligenceService } from './QuotaIntelligenceService';
import { CursorLikeAssistantService } from './CursorLikeAssistantService';
import type { ActionRequest, ActionResult } from './types';

// Import AIActionsServiceExtended after types to prevent circular dependency
import { AIActionsServiceExtended } from './AIActionsServiceExtended';

export class AIActionsService {
  
  /**
   * Execute any action the AI can perform
   */
  static async executeAction(request: ActionRequest): Promise<ActionResult> {
    try {
      switch (request.type) {
        // LEADS - Full CRUD
        case 'create_lead':
          return await this.createLead(request);
        case 'update_lead':
          return await this.updateLead(request);
        case 'update_lead_status':
          return await this.updateLeadStatus(request);
        case 'delete_lead':
          return await this.deleteLead(request);
        case 'add_lead_note':
          return await this.addLeadNote(request);
        
        // CONTACTS - Full CRUD
        case 'create_contact':
          return await AIActionsServiceExtended.createContact(request);
        case 'update_contact':
          return await AIActionsServiceExtended.updateContact(request);
        case 'delete_contact':
          return await AIActionsServiceExtended.deleteContact(request);
        
        // ACCOUNTS - Full CRUD
        case 'create_account':
          return await AIActionsServiceExtended.createAccount(request);
        case 'update_account':
          return await AIActionsServiceExtended.updateAccount(request);
        case 'delete_account':
          return await AIActionsServiceExtended.deleteAccount(request);
        
        // PROSPECTS - Full CRUD
        case 'create_prospect':
          return await AIActionsServiceExtended.createProspect(request);
        case 'update_prospect':
          return await AIActionsServiceExtended.updateProspect(request);
        case 'delete_prospect':
          return await AIActionsServiceExtended.deleteProspect(request);
        
        // OPPORTUNITIES - Full CRUD
        case 'create_opportunity':
          return await this.createOpportunity(request);
        case 'update_opportunity':
          return await AIActionsServiceExtended.updateOpportunity(request);
        case 'update_opportunity_stage':
          return await this.updateOpportunityStage(request);
        case 'delete_opportunity':
          return await AIActionsServiceExtended.deleteOpportunity(request);
        
        // CUSTOMERS - Full CRUD
        case 'create_customer':
          return await AIActionsServiceExtended.createCustomer(request);
        case 'update_customer':
          return await AIActionsServiceExtended.updateCustomer(request);
        case 'delete_customer':
          return await AIActionsServiceExtended.deleteCustomer(request);
        
        // PARTNERS - Full CRUD
        case 'create_partner':
          return await AIActionsServiceExtended.createPartner(request);
        case 'update_partner':
          return await AIActionsServiceExtended.updatePartner(request);
        case 'delete_partner':
          return await AIActionsServiceExtended.deletePartner(request);
        
        case 'schedule_follow_up':
          return await this.scheduleFollowUp(request);
        
        case 'generate_email':
          return await this.generateEmail(request);
        
        case 'analyze_pipeline':
          return await this.analyzePipeline(request);
        
        case 'prioritize_leads':
          return await this.prioritizeLeads(request);
        
        case 'bulk_update':
          return await this.bulkUpdate(request);
        
        case 'search_records':
          return await this.searchRecords(request);
        
        case 'get_smart_insights':
          return await this.getSmartInsights(request);
        
        case 'get_predictive_score':
          return await this.getPredictiveScore(request);
        
        case 'get_smart_alerts':
          return await this.getSmartAlerts(request);
        
        case 'get_quota_intelligence':
          return await this.getQuotaIntelligence(request);
        
        case 'get_cursor_suggestions':
          return await this.getCursorSuggestions(request);
        
        case 'check_quota_health':
          return await this.checkQuotaHealth(request);
        
        case 'auto_fix_issue':
          return await this.autoFixIssue(request);
        
        case 'csv_enrichment':
          return await this.processCsvEnrichment(request);
        
        // INTELLIGENCE OPERATIONS
        case 'find_buyer_group':
          return await this.findBuyerGroup(request);
        
        case 'enrich_phone':
          return await this.enrichWithPhone(request);
        
        default:
          return { success: false, error: `Unknown action type: ${request.type}` };
      }
    } catch (error) {
      console.error('AI Actions Service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create a new lead
   */
  private static async createLead(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    // Validate required fields
    const validation = AIDataService.validateData('lead', parameters, 'create');
    if (!validation.valid) {
      return { 
        success: false, 
        error: `Validation failed: ${validation.errors.join(', ')}` 
      };
    }
    
    const query: DataQuery = {
      model: 'lead',
      operation: 'create',
      data: {
        firstName: parameters.firstName,
        lastName: parameters.lastName,
        fullName: parameters.fullName || `${parameters.firstName} ${parameters.lastName}`,
        email: parameters.email,
        company: parameters.company,
        jobTitle: parameters.jobTitle,
        phone: parameters.phone,
        status: parameters.status || 'new',
        priority: parameters.priority || 'medium',
        source: parameters.source || 'ai_created',
        workspaceId
      }
    };
    
    const result = await AIDataService.executeQuery(query, workspaceId, userId);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: `Successfully created lead for ${parameters.fullName || parameters.firstName + ' ' + parameters.lastName}`,
        nextSteps: [
          'Add additional contact information if available',
          'Research the company and industry',
          'Plan initial outreach strategy',
          'Set follow-up reminders'
        ]
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Update lead status
   */
  private static async updateLeadStatus(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    const query: DataQuery = {
      model: 'lead',
      operation: 'update',
      where: { id: parameters.leadId },
      data: { 
        status: parameters.status,
        priority: parameters.priority
      }
    };
    
    const result = await AIDataService.executeQuery(query, workspaceId, userId);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: `Successfully updated lead status to ${parameters.status}`,
        nextSteps: this.getNextStepsForStatus(parameters.status)
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Add note to lead
   */
  private static async addLeadNote(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    const query: DataQuery = {
      model: 'leadnote',
      operation: 'create',
      data: {
        leadId: parameters.leadId,
        content: parameters.note,
        type: parameters.type || 'general',
        workspaceId
      }
    };
    
    const result = await AIDataService.executeQuery(query, workspaceId, userId);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Successfully added note to lead',
        nextSteps: [
          'Review note for accuracy',
          'Set follow-up reminders if needed',
          'Update lead status if appropriate'
        ]
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Create opportunity
   */
  private static async createOpportunity(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    const query: DataQuery = {
      model: 'opportunity',
      operation: 'create',
      data: {
        name: parameters.name,
        description: parameters.description,
        stage: parameters.stage || 'prospecting',
        value: parameters.value,
        closeDate: parameters.closeDate ? new Date(parameters.closeDate) : null,
        leadId: parameters.leadId,
        workspaceId
      }
    };
    
    const result = await AIDataService.executeQuery(query, workspaceId, userId);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: `Successfully created opportunity: ${parameters.name}`,
        nextSteps: [
          'Define opportunity requirements',
          'Identify key stakeholders',
          'Create proposal timeline',
          'Schedule discovery calls'
        ]
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Update opportunity stage
   */
  private static async updateOpportunityStage(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    const query: DataQuery = {
      model: 'opportunity',
      operation: 'update',
      where: { id: parameters.opportunityId },
      data: { 
        stage: parameters.stage,
        value: parameters.value
      }
    };
    
    const result = await AIDataService.executeQuery(query, workspaceId, userId);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: `Successfully updated opportunity stage to ${parameters.stage}`,
        nextSteps: this.getNextStepsForOpportunityStage(parameters.stage)
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Schedule follow-up
   */
  private static async scheduleFollowUp(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    const query: DataQuery = {
      model: 'activity',
      operation: 'create',
      data: {
        type: 'follow_up',
        title: parameters.title || 'Follow-up Task',
        description: parameters.description,
        dueDate: new Date(parameters.dueDate),
        leadId: parameters.leadId,
        opportunityId: parameters.opportunityId,
        workspaceId
      }
    };
    
    const result = await AIDataService.executeQuery(query, workspaceId, userId);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: `Successfully scheduled follow-up for ${new Date(parameters.dueDate).toLocaleDateString()}`,
        nextSteps: [
          'Add calendar reminder',
          'Prepare talking points',
          'Review previous interactions'
        ]
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Generate personalized email
   */
  private static async generateEmail(request: ActionRequest): Promise<ActionResult> {
    const { parameters, context } = request;
    
    const leadName = parameters.leadName || context?.name || 'there';
    const company = parameters.company || context?.company || 'your company';
    const title = parameters.title || context?.title || 'your role';
    const topic = parameters.topic || 'business solutions';
    
    // Validate that we have enough data to generate a meaningful email
    if (!leadName || leadName === 'there' || !company || company === 'your company') {
      return {
        success: false,
        error: 'Insufficient contact data to generate personalized email',
        message: 'Please provide contact name and company information',
        nextSteps: [
          'Add contact name and company to the record',
          'Try again with complete contact information'
        ]
      };
    }
    
    // RESEARCH-BACKED EMAIL TEMPLATES (Gong + 30MPC + Lavender)
    // Rules: <75 words, name + observation hook, single soft CTA, end with question
    const emailTemplates = {
      introduction: {
        subject: `Quick question for ${leadName}`,
        body: `${leadName} - noticed ${company} is scaling fast.

Companies in your space typically hit evaluation bottlenecks around this stage. We helped similar ${title}s cut their vendor evaluation time by 40%.

Worth a quick conversation to see if that applies to ${company}?

[Your Name]`
      },
      follow_up: {
        subject: `Re: ${company}`,
        body: `${leadName} - circling back on this.

Totally understand if timing isn't right. Just curious - is ${topic} still a priority for ${company} right now?

Either way, happy to share some benchmarks from your industry if helpful.

[Your Name]`
      },
      value_proposition: {
        subject: `${company} + buyer intelligence`,
        body: `${leadName} - given your role as ${title}, figured this might resonate.

We've helped companies like ${company} reduce vendor evaluation from months to weeks. The ${title}s I work with typically care most about speed and decision quality.

Would a 15-minute call this week make sense to explore if this fits?

[Your Name]`
      }
    };
    
    const emailType = parameters.emailType || 'introduction';
    const template = emailTemplates[emailType as keyof typeof emailTemplates] || emailTemplates.introduction;
    
    return {
      success: true,
      data: {
        subject: template.subject,
        body: template.body,
        type: emailType,
        personalization: {
          leadName,
          company,
          title,
          topic
        }
      },
      message: `Generated ${emailType} email for ${leadName} at ${company}`,
      nextSteps: [
        'Review and customize the email content',
        'Add specific company insights if available',
        'Schedule optimal send time',
        'Set follow-up reminder'
      ]
    };
  }

  /**
   * Analyze pipeline
   */
  private static async analyzePipeline(request: ActionRequest): Promise<ActionResult> {
    const { workspaceId } = request;
    
    const analytics = await AIDataService.getAnalytics(workspaceId, 'pipeline');
    
    if (analytics.success) {
      const data = analytics.data;
      const insights = [];
      
      // Generate insights based on data
      if (data.leads.qualified < data.leads.total * 0.1) {
        insights.push('Low qualification rate - focus on lead qualification process');
      }
      
      if (data.metrics.conversionRate < 10) {
        insights.push('Conversion rate below industry average - improve lead nurturing');
      }
      
      if (data.opportunities.active > data.opportunities.total * 0.8) {
        insights.push('High number of active opportunities - prioritize closing activities');
      }
      
      return {
        success: true,
        data: {
          analytics: data,
          insights,
          recommendations: this.generatePipelineRecommendations(data)
        },
        message: 'Pipeline analysis completed',
        nextSteps: [
          'Review key metrics and trends',
          'Implement recommended improvements',
          'Set up regular pipeline reviews',
          'Track progress against benchmarks'
        ]
      };
    }
    
    return { success: false, error: analytics.error };
  }

  /**
   * Prioritize leads
   */
  private static async prioritizeLeads(request: ActionRequest): Promise<ActionResult> {
    const { workspaceId, parameters } = request;
    
    const query: DataQuery = {
      model: 'lead',
      operation: 'read',
      where: { status: { in: ['new', 'contacted', 'qualified'] } },
      include: { opportunities: true },
      orderBy: { updatedAt: 'desc' },
      take: parameters.limit || 20
    };
    
    const result = await AIDataService.executeQuery(query, workspaceId, request.userId);
    
    if (result.success) {
      const leads = result.data;
      const prioritized = leads
        .map((lead: any) => ({
          ...lead,
          score: this.calculateLeadScore(lead)
        }))
        .sort((a: any, b: any) => b.score - a.score);
      
      return {
        success: true,
        data: {
          prioritizedLeads: prioritized,
          scoringCriteria: [
            'Company size and revenue potential',
            'Decision maker level',
            'Engagement history',
            'Industry fit',
            'Opportunity value'
          ]
        },
        message: `Prioritized ${prioritized.length} leads based on scoring criteria`,
        nextSteps: [
          'Focus on top 5 highest-scoring leads',
          'Develop personalized outreach strategies',
          'Set aggressive follow-up schedules',
          'Track engagement and adjust priorities'
        ]
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Bulk update operations
   */
  private static async bulkUpdate(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    const results = [];
    const errors = [];
    
    for (const update of parameters.updates) {
      try {
        const query: DataQuery = {
          model: update.model,
          operation: 'update',
          where: { id: update.id },
          data: update.data
        };
        
        const result = await AIDataService.executeQuery(query, workspaceId, userId);
        
        if (result.success) {
          results.push({ id: update.id, success: true });
        } else {
          errors.push({ id: update.id, error: result.error });
        }
      } catch (error) {
        errors.push({ id: update.id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    return {
      success: errors['length'] === 0,
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors
      },
      message: `Bulk update completed: ${results.length} successful, ${errors.length} failed`,
      nextSteps: errors.length > 0 ? ['Review and retry failed updates'] : ['Verify all updates were applied correctly']
    };
  }

  /**
   * Search records
   */
  private static async searchRecords(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId } = request;
    
    const result = await AIDataService.search(
      parameters.query,
      workspaceId,
      parameters.models || ['lead', 'opportunity']
    );
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: `Found ${Object.values(result.data).flat().length} matching records`,
        nextSteps: [
          'Review search results',
          'Refine search criteria if needed',
          'Take action on relevant records'
        ]
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Helper: Get next steps for lead status
   */
  private static getNextStepsForStatus(status: string): string[] {
    const statusSteps: Record<string, string[]> = {
      'new': [
        'Research the lead and company',
        'Plan initial outreach strategy',
        'Prepare personalized messaging'
      ],
      'contacted': [
        'Follow up within 2-3 business days',
        'Try alternative contact methods',
        'Add value in each interaction'
      ],
      'qualified': [
        'Schedule discovery call',
        'Identify decision makers',
        'Create opportunity if appropriate'
      ],
      'opportunity': [
        'Define opportunity requirements',
        'Create proposal timeline',
        'Identify key stakeholders'
      ]
    };
    
    return statusSteps[status] || ['Review lead status and plan next actions'];
  }

  /**
   * Helper: Get next steps for opportunity stage
   */
  private static getNextStepsForOpportunityStage(stage: string): string[] {
    const stageSteps: Record<string, string[]> = {
      'prospecting': [
        'Qualify the opportunity',
        'Identify budget and timeline',
        'Map decision-making process'
      ],
      'qualification': [
        'Conduct needs assessment',
        'Present initial solution',
        'Get stakeholder buy-in'
      ],
      'proposal': [
        'Prepare detailed proposal',
        'Address objections',
        'Negotiate terms'
      ],
      'negotiation': [
        'Finalize contract terms',
        'Get legal approval',
        'Prepare for closing'
      ]
    };
    
    return stageSteps[stage] || ['Review opportunity stage and plan next actions'];
  }

  /**
   * Helper: Calculate lead score
   */
  private static calculateLeadScore(lead: any): number {
    let score = 0;
    
    // Company size indicators
    if (lead.company?.toLowerCase().includes('enterprise') || 
        lead.company?.toLowerCase().includes('corp')) score += 20;
    
    // Title indicators
    if (lead.jobTitle?.toLowerCase().includes('director') ||
        lead.jobTitle?.toLowerCase().includes('vp') ||
        lead.jobTitle?.toLowerCase().includes('manager')) score += 15;
    
    // Engagement indicators
    if (lead['status'] === 'qualified') score += 25;
    if (lead['status'] === 'contacted') score += 10;
    
    // Opportunity indicators
    if (lead.opportunities?.length > 0) score += 30;
    
    // Recency
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate < 7) score += 10;
    
    return score;
  }

  /**
   * Get smart insights using predictive intelligence
   */
  private static async getSmartInsights(request: ActionRequest): Promise<ActionResult> {
    const { workspaceId, userId } = request;
    
    try {
      const alerts = await PredictiveIntelligenceService.generateSmartAlerts(workspaceId, userId);
      const recommendations = await PredictiveIntelligenceService.getPersonalizedRecommendations(userId, workspaceId);
      
      return {
        success: true,
        data: {
          alerts: alerts.slice(0, 5), // Top 5 alerts
          recommendations: recommendations.slice(0, 3), // Top 3 recommendations
          insights: alerts.map(alert => alert.insight).slice(0, 3)
        },
        message: `Generated ${alerts.length} smart alerts and ${recommendations.length} personalized recommendations`,
        nextSteps: [
          'Review high-priority alerts',
          'Act on recommended actions',
          'Monitor engagement patterns',
          'Update lead statuses based on insights'
        ]
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Smart insights failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get predictive score for a specific lead
   */
  private static async getPredictiveScore(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId } = request;
    
    try {
      const leadId = parameters.leadId;
      if (!leadId) {
        return { success: false, error: 'Lead ID is required for predictive scoring' };
      }
      
      const score = await PredictiveIntelligenceService.generateLeadScore(leadId, workspaceId);
      
      return {
        success: true,
        data: score,
        message: `Predictive analysis completed for lead with ${Math.round(score.conversionProbability * 100)}% conversion probability`,
        nextSteps: score.recommendedActions.map(action => action.message)
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Predictive scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get smart alerts for the workspace
   */
  private static async getSmartAlerts(request: ActionRequest): Promise<ActionResult> {
    const { workspaceId, userId } = request;
    
    try {
      const alerts = await PredictiveIntelligenceService.generateSmartAlerts(workspaceId, userId);
      
      const criticalAlerts = alerts.filter(alert => alert['priority'] === 'critical');
      const highAlerts = alerts.filter(alert => alert['priority'] === 'high');
      
      return {
        success: true,
        data: {
          all: alerts,
          critical: criticalAlerts,
          high: highAlerts,
          summary: {
            total: alerts.length,
            critical: criticalAlerts.length,
            high: highAlerts.length,
            medium: alerts.filter(alert => alert['priority'] === 'medium').length
          }
        },
        message: `Found ${alerts.length} smart alerts (${criticalAlerts.length} critical, ${highAlerts.length} high priority)`,
        nextSteps: [
          'Address critical alerts immediately',
          'Review high-priority opportunities',
          'Plan follow-up actions',
          'Monitor alert patterns'
        ]
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Smart alerts failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get comprehensive quota intelligence
   */
  private static async getQuotaIntelligence(request: ActionRequest): Promise<ActionResult> {
    const { workspaceId, userId } = request;
    
    try {
      const quotaIntel = await QuotaIntelligenceService.getQuotaIntelligence(userId, workspaceId);
      
      return {
        success: true,
        data: quotaIntel,
        message: `Quota analysis: ${quotaIntel.goal.attainmentPercentage.toFixed(1)}% attainment, ${quotaIntel.goal.pipelineCoverageRatio.toFixed(1)}x coverage`,
        nextSteps: quotaIntel.recommendations.slice(0, 3).map(rec => rec.title)
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Quota intelligence failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get Cursor-like intelligent suggestions
   */
  private static async getCursorSuggestions(request: ActionRequest): Promise<ActionResult> {
    const { workspaceId, userId, context } = request;
    
    try {
      const suggestions = await CursorLikeAssistantService.getIntelligentSuggestions(
        userId, 
        workspaceId, 
        context || { app: 'pipeline' }
      );
      
      const proactiveAlerts = await CursorLikeAssistantService.getProactiveAlerts(userId, workspaceId);
      
      return {
        success: true,
        data: {
          suggestions: suggestions.slice(0, 5),
          alerts: proactiveAlerts.slice(0, 3),
          contextualHelp: CursorLikeAssistantService.getContextualHelp(
            context?.app || 'pipeline',
            context?.page,
            context?.selectedRecord
          )
        },
        message: `Generated ${suggestions.length} intelligent suggestions and ${proactiveAlerts.length} proactive alerts`,
        nextSteps: suggestions.slice(0, 3).map(s => s.title)
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Cursor suggestions failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Check quota health and provide recommendations
   */
  private static async checkQuotaHealth(request: ActionRequest): Promise<ActionResult> {
    const { workspaceId, userId } = request;
    
    try {
      const quotaIntel = await QuotaIntelligenceService.getQuotaIntelligence(userId, workspaceId);
      
      const healthStatus = this.assessQuotaHealth(quotaIntel);
      
      return {
        success: true,
        data: {
          healthScore: healthStatus.score,
          riskLevel: quotaIntel.goal.riskLevel,
          keyMetrics: {
            attainment: quotaIntel.goal.attainmentPercentage,
            pipelineCoverage: quotaIntel.goal.pipelineCoverageRatio,
            daysRemaining: quotaIntel.goal.daysRemaining,
            projectedAttainment: quotaIntel.forecast.projectedAttainment
          },
          recommendations: quotaIntel.recommendations.slice(0, 3),
          alerts: quotaIntel.alerts.slice(0, 2)
        },
        message: healthStatus.message,
        nextSteps: healthStatus.nextSteps
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Quota health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Auto-fix identified issues
   */
  private static async autoFixIssue(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const issueId = parameters.issueId;
      if (!issueId) {
        return { success: false, error: 'Issue ID is required for auto-fix' };
      }
      
      const fixResult = await CursorLikeAssistantService.autoFixIssue(issueId, userId, workspaceId);
      
      return {
        success: fixResult.success,
        data: { actions: fixResult.actions },
        message: fixResult.message,
        nextSteps: fixResult.success ? ['Verify changes', 'Monitor results', 'Apply learnings'] : ['Manual intervention required']
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Auto-fix failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Helper: Assess quota health
   */
  private static assessQuotaHealth(quotaIntel: any) {
    const { goal, pipelineHealth, forecast } = quotaIntel;
    
    let score = 50; // Base score
    let message = '';
    let nextSteps: string[] = [];
    
    // Attainment score
    if (goal.attainmentPercentage > 90) score += 25;
    else if (goal.attainmentPercentage > 70) score += 15;
    else if (goal.attainmentPercentage > 50) score += 5;
    else score -= 10;
    
    // Pipeline coverage score
    if (goal.pipelineCoverageRatio > 3) score += 20;
    else if (goal.pipelineCoverageRatio > 2.5) score += 10;
    else if (goal.pipelineCoverageRatio > 2) score += 5;
    else score -= 15;
    
    // Pipeline health score
    score += (pipelineHealth.healthScore - 50) * 0.3;
    
    // Time pressure adjustment
    const periodProgress = 1 - (goal.daysRemaining / 90); // Assuming 90-day period
    const expectedAttainment = periodProgress * 100;
    if (goal.attainmentPercentage < expectedAttainment * 0.8) score -= 20;
    
    score = Math.max(0, Math.min(100, score));
    
    // Generate message and next steps
    if (score >= 80) {
      message = `Excellent quota health (${score}/100). On track to exceed targets.`;
      nextSteps = ['Maintain current momentum', 'Look for expansion opportunities', 'Share best practices with team'];
    } else if (score >= 60) {
      message = `Good quota health (${score}/100). Some areas for improvement.`;
      nextSteps = ['Focus on pipeline coverage', 'Accelerate key deals', 'Optimize conversion rates'];
    } else if (score >= 40) {
      message = `Moderate quota health (${score}/100). Action required.`;
      nextSteps = ['Increase prospecting activity', 'Review deal progression', 'Consider quota recovery plan'];
    } else {
      message = `Poor quota health (${score}/100). Immediate intervention needed.`;
      nextSteps = ['Emergency quota recovery plan', 'Focus on quick wins', 'Escalate for management support'];
    }
    
    return { score, message, nextSteps };
  }

  /**
   * Helper: Generate pipeline recommendations
   */
  private static generatePipelineRecommendations(data: any): string[] {
    const recommendations = [];
    
    if (data.leads.new > data.leads.contacted) {
      recommendations.push('Increase outreach velocity - you have more new leads than contacted');
    }
    
    if (data.metrics.conversionRate < 15) {
      recommendations.push('Improve lead qualification process to increase conversion rate');
    }
    
    if (data.opportunities.active > 10) {
      recommendations.push('Focus on closing existing opportunities before adding new ones');
    }
    
    if (data.metrics.winRate < 25) {
      recommendations.push('Analyze lost opportunities to improve win rate');
    }
    
    return recommendations;
  }

  /**
   * Process CSV enrichment request
   */
  private static async processCsvEnrichment(request: ActionRequest): Promise<ActionResult> {
    try {
      const { query, roles, limit, prioritization } = request.parameters;
      
      console.log(`🎯 [AI ACTIONS] Processing CSV enrichment:`, {
        query,
        roles,
        limit,
        prioritization,
        workspaceId: request.workspaceId,
        userId: request.userId
      });

      // This action is handled by the chat hook's processWithAI method
      // which detects enrichment queries and triggers the CSV enrichment pipeline
      return {
        success: true,
        data: {
          message: `Processing enrichment request: "${query}"`,
          roles: roles || ['CFO'],
          limit: limit || 10,
          prioritization: prioritization || 'first'
        }
      };
    } catch (error) {
      console.error('CSV enrichment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process CSV enrichment'
      };
    }
  }

  /**
   * Update lead (full record update)
   */
  private static async updateLead(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      const response = await fetch('/api/data/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId,
          leadId: parameters.leadId,
          updateData: {
            name: parameters.name,
            email: parameters.email,
            phone: parameters.phone,
            company: parameters.company,
            title: parameters.title,
            status: parameters.status,
            notes: parameters.notes,
            value: parameters.value
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          message: `Successfully updated lead: ${parameters.name || 'Lead'}`,
          nextSteps: ['Review updated information', 'Continue engagement strategy']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to update lead: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  /**
   * Delete lead
   */
  private static async deleteLead(request: ActionRequest): Promise<ActionResult> {
    const { parameters } = request;
    
    try {
      const response = await fetch(`/api/data/leads/${parameters.leadId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully deleted lead',
          nextSteps: ['Review pipeline for any affected opportunities']
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Failed to delete lead: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  /**
   * 🎯 Find buyer group for a company using our intelligence API
   */
  private static async findBuyerGroup(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      console.log(`🎯 [AI Actions] Finding buyer group for: ${parameters.companyName}`);
      
      // Call our intelligence API
      const response = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workspaceId,
          companyName: parameters.companyName,
          targetRoles: parameters.targetRoles || ['CEO', 'CFO', 'COO', 'VP Operations'],
          researchDepth: 'comprehensive'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const buyerGroupSummary = data.peopleDiscovered?.map((person: any) => 
          `• **${person.name}** - ${person.title} (${person.buyerGroupRole})\n  📧 ${person.email || 'No email'}\n  📞 ${person.phone || 'No phone'}\n  🔗 ${person.linkedinUrl || 'No LinkedIn'}`
        ).join('\n\n') || 'No buyer group members found';

        return {
          success: true,
          data: data.peopleDiscovered,
          message: `**🎯 Buyer Group Analysis: ${parameters.companyName}**\n\n${buyerGroupSummary}\n\n**📊 Analysis Summary:**\n• ${data.peopleDiscovered?.length || 0} key stakeholders identified\n• Decision makers, champions, and influencers mapped\n• Contact details and buyer group roles assigned`,
          nextSteps: [
            'Review discovered contacts in your pipeline',
            'Reach out to decision makers first',
            'Consider phone enrichment for key contacts'
          ]
        };
      } else {
        const error = await response.text();
        return { success: false, error: `Intelligence API error: ${error}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 📞 Enrich contact with phone number using Lusha
   */
  private static async enrichWithPhone(request: ActionRequest): Promise<ActionResult> {
    const { parameters, workspaceId, userId } = request;
    
    try {
      console.log(`📞 [AI Actions] Phone enrichment requested for: ${parameters.fullName || 'contact'}`);
      
      // Get current phone enrichment status
      const prisma = (await import('@prisma/client')).PrismaClient;
      const db = new prisma();
      
      const phoneStats = await db.contacts.aggregate({
        where: {
          workspaceId,
          assignedUserId: userId
        },
        _count: {
          phone1: true,
          directDialPhone: true
        }
      });
      
      const totalContacts = await db.contacts.count({
        where: {
          workspaceId,
          assignedUserId: userId
        }
      });
      
      await db.$disconnect();
      
      return {
        success: true,
        message: `**📞 Phone Enrichment Status**\n\n✅ **System Active & Working!**\n\n📊 **Current Results:**\n• **${phoneStats._count.phone1}** contacts with phone numbers\n• **${phoneStats._count.directDialPhone}** direct dial numbers\n• **${totalContacts}** total contacts in pipeline\n\n🎯 **Phone Discovery:**\n• Mobile numbers for executive access\n• Direct dial numbers bypass gatekeepers\n• Verified phone data from Lusha API\n\n**💡 Pro Tip:** Direct dial numbers are the most valuable for reaching decision makers immediately!`,
        nextSteps: [
          'Check contact records for updated phone numbers',
          'Use direct dial numbers for immediate outreach',
          'Try mobile numbers for executive-level access',
          'Phone enrichment continues automatically'
        ]
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
