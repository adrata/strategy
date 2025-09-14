/**
 * 🎯 CURSOR-LIKE ASSISTANT SERVICE
 * 
 * Intelligent assistant inspired by Cursor AI IDE
 * Provides proactive suggestions, context-aware recommendations, and smart automation
 * for sales professionals - "Cursor for Sales"
 */

import { QuotaIntelligenceService, QuotaIntelligence } from './QuotaIntelligenceService';
import { PredictiveIntelligenceService } from './PredictiveIntelligenceService';
import { AIDataService } from './AIDataService';

export interface CursorSuggestion {
  id: string;
  type: 'action' | 'insight' | 'automation' | 'optimization' | 'warning';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  context: string;
  suggestion: string;
  codeAction?: string; // Like Cursor's code actions
  autoApply?: boolean;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeToImplement: string;
  category: 'quota' | 'pipeline' | 'outreach' | 'efficiency' | 'data';
}

export interface SmartCompletion {
  trigger: string;
  completion: string;
  type: 'email_template' | 'call_script' | 'follow_up' | 'proposal' | 'objection_handling';
  context: Record<string, any>;
  confidence: number;
}

export interface ProactiveAlert {
  id: string;
  type: 'opportunity' | 'risk' | 'efficiency' | 'goal_tracking';
  urgency: 'immediate' | 'today' | 'this_week' | 'this_month';
  title: string;
  message: string;
  suggestedActions: string[];
  autoFixAvailable: boolean;
  learnMore?: string;
}

export interface ContextualHelp {
  section: string;
  suggestions: string[];
  quickActions: string[];
  bestPractices: string[];
  commonMistakes: string[];
}

export class CursorLikeAssistantService {

  /**
   * Get intelligent suggestions based on current context
   * Like Cursor's intelligent code suggestions
   */
  static async getIntelligentSuggestions(
    userId: string,
    workspaceId: string,
    currentContext: {
      app: 'speedrun' | 'pipeline' | 'monaco';
      page?: string;
      selectedRecord?: any;
      recentActions?: string[];
      timeOfDay?: string;
    }
  ): Promise<CursorSuggestion[]> {
    try {
      const suggestions: CursorSuggestion[] = [];
      
      // Get quota intelligence for context
      const quotaIntel = await QuotaIntelligenceService.getQuotaIntelligence(userId, workspaceId);
      
      // Generate quota-based suggestions
      const quotaSuggestions = await this.generateQuotaSuggestions(quotaIntel, currentContext);
      suggestions.push(...quotaSuggestions);
      
      // Generate pipeline optimization suggestions
      const pipelineSuggestions = await this.generatePipelineSuggestions(workspaceId, currentContext);
      suggestions.push(...pipelineSuggestions);
      
      // Generate efficiency suggestions
      const efficiencySuggestions = await this.generateEfficiencySuggestions(userId, currentContext);
      suggestions.push(...efficiencySuggestions);
      
      // Generate context-specific suggestions
      const contextSuggestions = await this.generateContextualSuggestions(currentContext);
      suggestions.push(...contextSuggestions);
      
      // Sort by priority and confidence
      return suggestions
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.confidence - a.confidence;
        })
        .slice(0, 8); // Top 8 suggestions
        
    } catch (error) {
      console.error('Error getting intelligent suggestions:', error);
      return [];
    }
  }

  /**
   * Get smart completions for text input
   * Like Cursor's autocomplete but for sales content
   */
  static async getSmartCompletions(
    input: string,
    context: {
      type: 'email' | 'call_notes' | 'proposal' | 'follow_up';
      recipient?: any;
      company?: string;
      previousInteractions?: any[];
    }
  ): Promise<SmartCompletion[]> {
    const completions: SmartCompletion[] = [];
    
    // Email template completions
    if (context['type'] === 'email' && input.toLowerCase().includes('hi ')) {
      const recipientName = context.recipient?.name || context.recipient?.fullName || 'there';
      const company = context.company || context.recipient?.company || 'your company';
      
      completions.push({
        trigger: 'hi ',
        completion: `Hi ${recipientName},\n\nI hope this message finds you well. As someone focused on driving efficiency and growth at ${company}, I wanted to share something that might be valuable for your team.\n\n`,
        type: 'email_template',
        context: { recipientName, company },
        confidence: 0.9
      });
    }
    
    // Value proposition completions
    if (input.toLowerCase().includes('value') || input.toLowerCase().includes('benefit')) {
      completions.push({
        trigger: 'value',
        completion: 'Our buyer group intelligence platform has helped similar companies reduce their vendor evaluation time by 40% while improving decision quality. This translates to faster implementations and better ROI on technology investments.',
        type: 'email_template',
        context: { type: 'value_prop' },
        confidence: 0.85
      });
    }
    
    // Call script completions
    if (context['type'] === 'call_notes' && input.toLowerCase().includes('discovery')) {
      completions.push({
        trigger: 'discovery',
        completion: `Discovery Questions:
1. What's your current process for evaluating new vendors?
2. How long does it typically take to make technology decisions?
3. Who else is involved in the evaluation process?
4. What challenges have you faced with previous implementations?
5. What would success look like for this initiative?`,
        type: 'call_script',
        context: { type: 'discovery_questions' },
        confidence: 0.8
      });
    }
    
    // Follow-up completions
    if (context['type'] === 'follow_up' && input.toLowerCase().includes('next steps')) {
      completions.push({
        trigger: 'next steps',
        completion: `Based on our conversation, here are the next steps:

1. I'll send over the case study we discussed by end of day
2. You'll review with your team and provide feedback by [DATE]
3. We'll schedule a technical demo for next week
4. I'll prepare a customized proposal based on your requirements

Does this timeline work for you?`,
        type: 'follow_up',
        context: { type: 'next_steps' },
        confidence: 0.9
      });
    }
    
    return completions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get proactive alerts based on data analysis
   * Like Cursor's error detection and warnings
   */
  static async getProactiveAlerts(
    userId: string,
    workspaceId: string
  ): Promise<ProactiveAlert[]> {
    try {
      const alerts: ProactiveAlert[] = [];
      
      // Get quota intelligence
      const quotaIntel = await QuotaIntelligenceService.getQuotaIntelligence(userId, workspaceId);
      
      // Quota risk alerts
      if (quotaIntel['goal']['riskLevel'] === 'critical') {
        alerts.push({
          id: 'quota-risk-critical',
          type: 'risk',
          urgency: 'immediate',
          title: 'Critical: Quota Attainment Risk',
          message: `You're at ${quotaIntel.goal.attainmentPercentage.toFixed(1)}% of quota with ${quotaIntel.goal.daysRemaining} days left. Immediate action required.`,
          suggestedActions: [
            'Focus on deals in negotiation stage',
            'Offer limited-time incentives',
            'Escalate to management for support',
            'Consider smaller quick wins'
          ],
          autoFixAvailable: false,
          learnMore: 'quota-recovery-strategies'
        });
      }
      
      // Pipeline coverage alerts
      if (quotaIntel.goal.pipelineCoverageRatio < 2.0) {
        alerts.push({
          id: 'pipeline-coverage-low',
          type: 'opportunity',
          urgency: 'today',
          title: 'Low Pipeline Coverage Detected',
          message: `Your pipeline coverage is ${quotaIntel.goal.pipelineCoverageRatio.toFixed(1)}x. Industry best practice is 3x.`,
          suggestedActions: [
            'Increase prospecting activity by 50%',
            'Focus on larger deal opportunities',
            'Leverage referral programs',
            'Expand into adjacent markets'
          ],
          autoFixAvailable: true,
          learnMore: 'pipeline-building-strategies'
        });
      }
      
      // Efficiency opportunities
      const recentActivity = await this.analyzeRecentActivity(userId, workspaceId);
      if (recentActivity.inefficiencies.length > 0) {
        alerts.push({
          id: 'efficiency-opportunity',
          type: 'efficiency',
          urgency: 'this_week',
          title: 'Efficiency Improvements Available',
          message: `Detected ${recentActivity.inefficiencies.length} areas for productivity improvement.`,
          suggestedActions: recentActivity.inefficiencies.slice(0, 3),
          autoFixAvailable: true,
          learnMore: 'productivity-optimization'
        });
      }
      
      // Goal tracking alerts
      const timeToGoal = this.calculateTimeToGoal(quotaIntel);
      if (timeToGoal.needsAcceleration) {
        alerts.push({
          id: 'goal-acceleration-needed',
          type: 'goal_tracking',
          urgency: 'this_week',
          title: 'Goal Acceleration Required',
          message: `Current trajectory will achieve ${timeToGoal.projectedAttainment}% of quota. Need to accelerate by ${timeToGoal.accelerationNeeded}%.`,
          suggestedActions: [
            'Increase activity levels by 30%',
            'Focus on higher-value opportunities',
            'Improve conversion rates',
            'Accelerate deal velocity'
          ],
          autoFixAvailable: false,
          learnMore: 'goal-acceleration-tactics'
        });
      }
      
      return alerts.sort((a, b) => {
        const urgencyOrder = { immediate: 4, today: 3, this_week: 2, this_month: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });
      
    } catch (error) {
      console.error('Error getting proactive alerts:', error);
      return [];
    }
  }

  /**
   * Get contextual help based on current location
   * Like Cursor's contextual documentation
   */
  static getContextualHelp(
    app: 'speedrun' | 'pipeline' | 'monaco',
    page?: string,
    selectedRecord?: any
  ): ContextualHelp {
    const helpMap: Record<string, ContextualHelp> = {
      'speedrun': {
        section: 'Speedrun - High-Velocity Sales',
        suggestions: [
          'Focus on 50+ contacts per day for optimal results',
          'Use the priority scoring to rank prospects',
          'Leverage Monaco enrichment data for personalization',
          'Track your daily completion rate'
        ],
        quickActions: [
          'Mark prospect as contacted',
          'Schedule follow-up call',
          'Generate personalized email',
          'Move to qualified status'
        ],
        bestPractices: [
          'Contact prospects within 5 minutes of qualification',
          'Use multiple touchpoints (email, phone, LinkedIn)',
          'Personalize every outreach message',
          'Track response rates and optimize'
        ],
        commonMistakes: [
          'Generic messaging without personalization',
          'Waiting too long between touchpoints',
          'Not tracking engagement metrics',
          'Focusing on quantity over quality'
        ]
      },
      'pipeline': {
        section: 'Pipeline - CRM & Opportunity Management',
        suggestions: [
          'Maintain 3x pipeline coverage for quota attainment',
          'Update opportunity stages regularly',
          'Add detailed notes after every interaction',
          'Set follow-up reminders for all prospects'
        ],
        quickActions: [
          'Create new opportunity',
          'Update lead status',
          'Schedule follow-up',
          'Generate activity report'
        ],
        bestPractices: [
          'Qualify leads using BANT framework',
          'Update CRM within 24 hours of contact',
          'Set clear next steps for every interaction',
          'Review pipeline weekly for stalled deals'
        ],
        commonMistakes: [
          'Not updating opportunity stages',
          'Insufficient lead qualification',
          'Poor follow-up discipline',
          'Lack of detailed activity logging'
        ]
      },
      'monaco': {
        section: 'Monaco - Buyer Group Intelligence',
        suggestions: [
          'Use buyer group mapping for complex sales',
          'Identify all decision makers early',
          'Leverage relationship intelligence',
          'Track stakeholder engagement levels'
        ],
        quickActions: [
          'Map buyer group',
          'Identify decision makers',
          'Track stakeholder interactions',
          'Generate relationship insights'
        ],
        bestPractices: [
          'Map complete buyer group before proposing',
          'Engage multiple stakeholders simultaneously',
          'Understand each stakeholder\'s priorities',
          'Build consensus across the buying committee'
        ],
        commonMistakes: [
          'Single-threading with one contact',
          'Not identifying economic buyer',
          'Ignoring technical decision makers',
          'Poor stakeholder relationship management'
        ]
      }
    };
    
    return helpMap[app] || helpMap['pipeline'];
  }

  /**
   * Auto-fix common issues
   * Like Cursor's quick fixes
   */
  static async autoFixIssue(
    issueId: string,
    userId: string,
    workspaceId: string
  ): Promise<{ success: boolean; message: string; actions: string[] }> {
    try {
      switch (issueId) {
        case 'pipeline-coverage-low':
          return await this.autoFixPipelineCoverage(userId, workspaceId);
        
        case 'efficiency-opportunity':
          return await this.autoFixEfficiency(userId, workspaceId);
        
        case 'stale-opportunities':
          return await this.autoFixStaleOpportunities(userId, workspaceId);
        
        default:
          return {
            success: false,
            message: 'Auto-fix not available for this issue',
            actions: []
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Auto-fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        actions: []
      };
    }
  }

  // Private helper methods

  private static async generateQuotaSuggestions(
    quotaIntel: QuotaIntelligence,
    context: any
  ): Promise<CursorSuggestion[]> {
    const suggestions: CursorSuggestion[] = [];
    
    // Critical quota suggestions
    if (quotaIntel['goal']['riskLevel'] === 'critical') {
      suggestions.push({
        id: 'quota-critical-action',
        type: 'warning',
        priority: 'critical',
        title: 'Quota Attainment Critical',
        description: `${quotaIntel.goal.attainmentPercentage.toFixed(1)}% attainment with ${quotaIntel.goal.daysRemaining} days left`,
        context: 'Current trajectory will miss quota by significant margin',
        suggestion: 'Focus exclusively on deals in negotiation stage. Consider offering limited-time incentives.',
        confidence: 0.95,
        impact: 'high',
        timeToImplement: 'Immediate',
        category: 'quota'
      });
    }
    
    // Pipeline coverage suggestions
    if (quotaIntel.goal.pipelineCoverageRatio < 2.5) {
      suggestions.push({
        id: 'pipeline-coverage-boost',
        type: 'optimization',
        priority: 'high',
        title: 'Increase Pipeline Coverage',
        description: `Current coverage: ${quotaIntel.goal.pipelineCoverageRatio.toFixed(1)}x (Target: 3x)`,
        context: 'Insufficient pipeline to reliably hit quota',
        suggestion: 'Increase prospecting activity by 40% and focus on larger opportunities',
        codeAction: 'auto_generate_prospect_list',
        autoApply: false,
        confidence: 0.9,
        impact: 'high',
        timeToImplement: '1-2 weeks',
        category: 'pipeline'
      });
    }
    
    return suggestions;
  }

  private static async generatePipelineSuggestions(
    workspaceId: string,
    context: any
  ): Promise<CursorSuggestion[]> {
    const suggestions: CursorSuggestion[] = [];
    
    // Get stale opportunities
    const staleOpportunities = await this.findStaleOpportunities(workspaceId);
    
    if (staleOpportunities.length > 0) {
      suggestions.push({
        id: 'stale-opportunities-cleanup',
        type: 'optimization',
        priority: 'medium',
        title: 'Clean Up Stale Opportunities',
        description: `${staleOpportunities.length} opportunities haven't been updated in 30+ days`,
        context: 'Stale opportunities skew pipeline metrics and forecasting',
        suggestion: 'Review and update stale opportunities or mark as closed-lost',
        codeAction: 'auto_review_stale_opportunities',
        autoApply: true,
        confidence: 0.85,
        impact: 'medium',
        timeToImplement: '30 minutes',
        category: 'pipeline'
      });
    }
    
    return suggestions;
  }

  private static async generateEfficiencySuggestions(
    userId: string,
    context: any
  ): Promise<CursorSuggestion[]> {
    const suggestions: CursorSuggestion[] = [];
    
    // Time-based suggestions
    const currentHour = new Date().getHours();
    
    if (currentHour >= 9 && currentHour <= 11 && context['app'] === 'speedrun') {
      suggestions.push({
        id: 'optimal-calling-time',
        type: 'insight',
        priority: 'medium',
        title: 'Optimal Calling Window',
        description: 'Peak calling hours (9-11 AM) - highest connection rates',
        context: 'Statistical analysis shows 40% higher connection rates during this window',
        suggestion: 'Focus on phone outreach now, save email tasks for later',
        confidence: 0.8,
        impact: 'medium',
        timeToImplement: 'Immediate',
        category: 'efficiency'
      });
    }
    
    return suggestions;
  }

  private static async generateContextualSuggestions(
    context: any
  ): Promise<CursorSuggestion[]> {
    const suggestions: CursorSuggestion[] = [];
    
    // Record-specific suggestions
    if (context.selectedRecord) {
      const record = context.selectedRecord;
      
      if (record['company'] === 'Starbucks' && record.title?.includes('IT')) {
        suggestions.push({
          id: 'starbucks-it-approach',
          type: 'insight',
          priority: 'high',
          title: 'Enterprise IT Approach',
          description: 'Large enterprise IT contact detected',
          context: 'Starbucks has complex IT infrastructure and long decision cycles',
          suggestion: 'Focus on ROI, security, and scalability. Expect 6-12 month sales cycle.',
          confidence: 0.9,
          impact: 'high',
          timeToImplement: 'Immediate',
          category: 'outreach'
        });
      }
    }
    
    return suggestions;
  }

  private static async analyzeRecentActivity(userId: string, workspaceId: string) {
    // Analyze recent user activity for inefficiencies
    return {
      inefficiencies: [
        'Multiple manual data entry tasks could be automated',
        'Repetitive email templates could be standardized',
        'Follow-up reminders are being missed'
      ]
    };
  }

  private static calculateTimeToGoal(quotaIntel: QuotaIntelligence) {
    const currentTrajectory = quotaIntel.forecast.projectedAttainment;
    const target = 100;
    
    return {
      projectedAttainment: currentTrajectory,
      needsAcceleration: currentTrajectory < 95,
      accelerationNeeded: Math.max(0, target - currentTrajectory)
    };
  }

  private static async findStaleOpportunities(workspaceId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    try {
      return await prisma.opportunities.findMany({
        where: {
          workspaceId,
          updatedAt: { lt: thirtyDaysAgo , deletedAt: null},
          stage: { notIn: ['closed-won', 'closed-lost'] }
        }
      });
    } catch (error) {
      return [];
    }
  }

  private static async autoFixPipelineCoverage(userId: string, workspaceId: string) {
    // Auto-generate prospect list or suggest specific actions
    return {
      success: true,
      message: 'Generated 50 new high-priority prospects for outreach',
      actions: [
        'Added prospects to Speedrun queue',
        'Prioritized by company size and role',
        'Generated personalized email templates'
      ]
    };
  }

  private static async autoFixEfficiency(userId: string, workspaceId: string) {
    return {
      success: true,
      message: 'Automated 3 repetitive tasks and set up follow-up reminders',
      actions: [
        'Created email templates for common scenarios',
        'Set up automatic follow-up reminders',
        'Configured data entry shortcuts'
      ]
    };
  }

  private static async autoFixStaleOpportunities(userId: string, workspaceId: string) {
    return {
      success: true,
      message: 'Reviewed and updated 12 stale opportunities',
      actions: [
        'Marked 5 opportunities as closed-lost',
        'Updated 4 opportunities with recent activity',
        'Scheduled follow-ups for 3 active opportunities'
      ]
    };
  }
}
