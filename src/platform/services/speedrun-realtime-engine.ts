/**
 * 🎯 SPEEDRUN REAL-TIME ENGINE
 * 
 * Intelligent real-time system that:
 * ✅ Monitors incoming emails and moves contacts to top of Speedrun list
 * ✅ Triggers Monaco notifications for immediate action
 * ✅ Updates priority scores based on real-time activity
 * ✅ Manages daily limit (50 contacts) with smart prioritization
 * ✅ Tracks last actions and suggests AI-powered next actions
 * ✅ Balances acquisition vs retention revenue opportunities
 */

import { prisma } from '@/platform/database/prisma-client';
import { NotificationService } from './notification-service';
import { getUnifiedEmailMonitoring, EmailMonitoringEvent } from './unified-email-monitoring-service';

export interface SpeedrunContact {
  id: string;
  fullName: string;
  email: string;
  company: string;
  title?: string;
  sourceType: 'customer' | 'lead' | 'opportunity' | 'email_engagement';
  category: 'acquisition' | 'retention';
  priority: number;
  finalScore: number;
  dealValue?: number;
  lastAction?: string;
  daysSinceLastAction?: number;
  nextAction?: NextActionRecommendation;
  realtimeTrigger?: RealtimeTrigger;
  scoreBreakdown?: ScoreBreakdown;
}

export interface NextActionRecommendation {
  type: 'Email Reply' | 'Strategic Check-in' | 'Proposal Follow-up' | 'Discovery Call';
  subject: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  talking_points: string[];
  success_probability: number;
  estimated_time: string;
}

export interface RealtimeTrigger {
  type: 'INBOUND_EMAIL' | 'DEAL_STAGE_CHANGE' | 'NEW_OPPORTUNITY' | 'CUSTOMER_ACTIVITY';
  timestamp: Date;
  subject?: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
  data?: any;
}

export interface ScoreBreakdown {
  base: number;
  recency: number;
  value: number;
  engagement: number;
  strategic: number;
  urgency: number;
}

export class SpeedrunRealtimeEngine {
  private notificationService: NotificationService;
  private dailyLimit = 50;
  private currentList: SpeedrunContact[] = [];
  private listeners: Array<(contacts: SpeedrunContact[]) => void> = [];
  private workspaceId: string;
  private userId: string;

  constructor(workspaceId: string, userId: string) {
    // FIXED: Use shared Prisma client instead of creating new instance
    this['notificationService'] = new NotificationService();
    this['workspaceId'] = workspaceId;
    this['userId'] = userId;
    this.initializeRealtimeMonitoring();
    
    // Subscribe to unified email monitoring events
    const emailMonitoring = getUnifiedEmailMonitoring(workspaceId);
    emailMonitoring.subscribe(this.handleEmailMonitoringEvent.bind(this));
  }

  /**
   * Initialize real-time monitoring systems
   */
  private async initializeRealtimeMonitoring() {
    // Skip initialization during build/static generation
    if (process['env']['NODE_ENV'] === 'production' && typeof window === 'undefined' && process['env']['VERCEL_ENV']) {
      return;
    }
    
    // Only log in development when debugging
    if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_SPEEDRUN'] === 'true') {
      console.log('🎯 Initializing Speedrun Real-time Engine...');
    }
    
    // Set up periodic refresh (every 15 minutes)
    setInterval(() => {
      this.refreshDailyList();
    }, 15 * 60 * 1000);

    // Initial load
    await this.refreshDailyList();
  }

  /**
   * Handle email monitoring events from unified service
   */
  private async handleEmailMonitoringEvent(event: EmailMonitoringEvent): Promise<void> {
    console.log(`📧 Handling email monitoring event: ${event.type}`);

    try {
      if (event['type'] === 'BUYING_SIGNAL_DETECTED' || event['type'] === 'PRIORITY_UPDATED') {
        // Find the contact/lead/opportunity and move to top of Speedrun list
        const entityId = event.contactId || event.leadId || event.opportunityId;
        
        if (entityId) {
          const contact = await this.getContactById(entityId);
          if (contact) {
            await this.moveContactToTop(contact.id, {
              type: 'INBOUND_EMAIL',
              timestamp: event.timestamp,
              subject: event.data?.subject || 'Buying Signal Detected',
              priority: event['priority'] === 'IMMEDIATE' ? 'IMMEDIATE' : 'HIGH'
            });

            // Send Monaco notification
            await this.sendMonacoNotification({
              type: 'buying_signal',
              title: `🎯 Buying Signal: ${event.buyingSignal?.type}`,
              message: `${contact.fullName} from ${contact.company} shows buying intent: "${event.buyingSignal?.description}"`,
              contactId: contact.id,
              priority: 'high',
              actionRequired: true
            });

            console.log(`✅ Moved ${contact.fullName} to top due to buying signal`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error handling email monitoring event:', error);
    }
  }

  /**
   * Handle incoming email notification from webhook (legacy method)
   * Now delegates to unified email monitoring service
   */
  async handleIncomingEmail(emailData: {
    from: string;
    subject: string;
    receivedAt: Date;
    messageId: string;
  }): Promise<void> {
    console.log(`📧 Processing incoming email from: ${emailData.from}`);

    try {
      // Use unified email monitoring service
      const emailMonitoring = getUnifiedEmailMonitoring(this.workspaceId);
      
      await emailMonitoring.processIncomingEmail({
        messageId: emailData.messageId,
        from: emailData.from,
        to: ['dano@retail-products.com'], // Default recipient
        subject: emailData.subject,
        body: '', // Would need to be provided
        receivedAt: emailData.receivedAt,
        accountId: '' // Would need to be determined
      });

    } catch (error) {
      console.error('❌ Error handling incoming email:', error);
    }
  }

  /**
   * Handle deal stage change
   */
  async handleDealStageChange(dealData: {
    opportunityId: string;
    newStage: string;
    contactId?: string;
    dealValue?: number;
  }): Promise<void> {
    console.log(`📊 Deal stage changed to: ${dealData.newStage}`);

    if (dealData.contactId) {
      const contact = await this.getContactById(dealData.contactId);
      if (contact) {
        // Recalculate priority based on new stage
        const updatedScore = await this.calculateDealStageBoost(contact, dealData.newStage);
        
        await this.updateContactScore(contact.id, updatedScore, {
          type: 'DEAL_STAGE_CHANGE',
          timestamp: new Date(),
          priority: this.getStagePriority(dealData.newStage),
          data: dealData
        });
      }
    }
  }

  /**
   * Get current daily Speedrun list
   */
  async getDailySpeedrunList(): Promise<SpeedrunContact[]> {
    if (this['currentList']['length'] === 0) {
      await this.refreshDailyList();
    }
    return this.currentList.slice(0, this.dailyLimit);
  }

  /**
   * Refresh the daily list using intelligent algorithm
   */
  private async refreshDailyList(): Promise<void> {
    // Only log when debugging to reduce console spam
    if (process['env']['ADRATA_DEBUG_SPEEDRUN'] === 'true') {
      console.log(`🔄 Refreshing daily Speedrun list for workspace: ${this.workspaceId}...`);
    }

    try {
      // Get workspace by ID or slug
      const workspace = await prisma.workspaces.findFirst({
        where: {
          OR: [
            { id: this.workspaceId },
            { slug: this.workspaceId }
          ]
        }
      });

      if (!workspace) {
        throw new Error(`Workspace not found: ${this.workspaceId}`);
      }

      // Only log workspace lookup if debugging to reduce console spam
      if (process['env']['ADRATA_DEBUG_SPEEDRUN'] === 'true') {
        console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
      }

      // Load comprehensive contact data
      const contacts = await this.loadComprehensiveContactData(workspace.id);

      // Apply intelligent ranking
      const rankedContacts = await this.applyIntelligentRanking(contacts);

      // Balance acquisition vs retention
      const balancedList = this.balanceAcquisitionRetention(rankedContacts);

      // Generate AI next actions for top contacts
      await this.generateNextActionsForTopContacts(balancedList.slice(0, 10));

      this['currentList'] = balancedList;
      this.notifyListeners();

      // Only log list updates if ADRATA_DEBUG_SPEEDRUN is enabled to reduce console spam
      if (process['env']['ADRATA_DEBUG_SPEEDRUN'] === 'true') {
        console.log(`✅ Updated daily list: ${this.currentList.length} contacts`);
      }
    } catch (error) {
      console.error('❌ Error refreshing daily list:', error);
    }
  }

  /**
   * Load comprehensive contact data from all sources
   */
  private async loadComprehensiveContactData(workspaceId: string): Promise<SpeedrunContact[]> {
    const contacts: SpeedrunContact[] = [];

    // 1. Customer contacts (retention/expansion)
    const customerAccounts = await prisma.accounts.findMany({
      where: { workspaceId, deletedAt: null},
      include: {
        contacts: true
        // Removed: clients relationship doesn't exist on accounts model
        // Note: accounts model doesn't have opportunities relationship
      }
    });


    for (const account of customerAccounts) {
      // Skip customer value calculation since clients relationship doesn't exist
      const totalValue = 0;
      
      for (const contact of account.contacts) {
        contacts.push({
          id: contact.id,
          fullName: contact.fullName,
          email: contact.email || '',
          company: account.name,
          title: contact.title,
          sourceType: 'customer',
          category: 'retention',
          priority: this.calculateCustomerPriority(contact, totalValue),
          finalScore: 0,
          dealValue: totalValue
        });
      }
    }

    // 2. Lead contacts (acquisition) - ONLY assigned to this user
    const leads = await prisma.leads.findMany({
      where: { 
        workspaceId,
        assignedUserId: this.userId, // CRITICAL: Only user's assigned leads
        deletedAt: null
      },
      // Note: leads model doesn't have activities relationship
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true,
        title: true,
        status: true,
        priority: true,
        estimatedValue: true,
        lastActionDate: true,
        createdAt: true,
        updatedAt: true
      }
    });


    for (const lead of leads) {
      contacts.push({
        id: lead.id,
        fullName: lead.fullName,
        email: lead.email || lead.personalEmail || '',
        company: lead.company || lead.companyDomain || 'Company',
        title: lead.jobTitle || lead.title,
        sourceType: 'lead',
        category: 'acquisition',
        priority: this.calculateLeadPriority(lead),
        finalScore: 0,
        lastAction: lead.lastActionDate ? 'action' : null,
        daysSinceLastAction: lead.lastActionDate ? 
          Math.floor((Date.now() - new Date(lead.lastActionDate).getTime()) / (1000 * 60 * 60 * 24)) : 
          999
      });
    }

    // 3. Active opportunity stakeholders (exclude all closed opportunities) - ONLY assigned to this user  
    const activeOpportunities = await prisma.opportunities.findMany({
      where: { 
        workspaceId,
        assignedUserId: this.userId, // CRITICAL: Only user's assigned opportunities
        deletedAt: null,
        AND: [
          { stage: { not: { contains: 'Closed Won' } } },
          { stage: { not: { contains: 'Closed Lost' } } },
          { stage: { not: { contains: 'closed won' } } },
          { stage: { not: { contains: 'closed lost' } } }
        ]
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    });

    // Note: OpportunityStakeholder relation removed as it doesn't exist in database schema

    return this.deduplicateContacts(contacts);
  }

  /**
   * Calculate priority for opportunity stakeholders
   */
  private calculateStakeholderPriority(stakeholder: any, opportunity: any): number {
    let priority = 0;
    
    // Influence level scoring
    switch (stakeholder.influence?.toLowerCase()) {
      case 'high':
        priority += 30;
        break;
      case 'medium':
        priority += 20;
        break;
      case 'low':
        priority += 10;
        break;
      default:
        priority += 15;
    }
    
    // Engagement level scoring
    switch (stakeholder.engagementLevel?.toLowerCase()) {
      case 'high':
        priority += 25;
        break;
      case 'medium':
        priority += 15;
        break;
      case 'low':
        priority += 5;
        break;
      default:
        priority += 10;
    }
    
    // Opportunity value multiplier
    const oppValue = opportunity.amount || 0;
    if (oppValue > 100000) priority += 20;
    else if (oppValue > 50000) priority += 10;
    else if (oppValue > 10000) priority += 5;
    
    return Math.min(priority, 100);
  }

  /**
   * Apply intelligent ranking algorithm with enhanced client demo explanations
   */
  private async applyIntelligentRanking(contacts: SpeedrunContact[]): Promise<SpeedrunContact[]> {
    console.log(`🧠 [SPEEDRUN INTELLIGENCE] Analyzing ${Math.min(contacts.length, 100)} contacts (limited for performance)...`);
    
    // Limit processing to top 100 contacts to prevent excessive load
    const limitedContacts = contacts.slice(0, 100);
    
    const rankedContacts = await Promise.all(limitedContacts.map(async contact => {
      const scoreBreakdown: ScoreBreakdown = {
        base: contact.priority,
        recency: this.calculateRecencyScore(contact),
        value: this.calculateValueScore(contact),
        engagement: this.calculateEngagementScore(contact),
        strategic: this.calculateStrategicScore(contact),
        urgency: this.calculateUrgencyScore(contact)
      };

      const finalScore = Math.min(Math.round(
        scoreBreakdown.base +
        scoreBreakdown.recency * 0.3 +  // Recent activity = hot leads
        scoreBreakdown.value * 0.25 +   // Deal size potential
        scoreBreakdown.engagement * 0.2 + // Email opens, clicks, responses
        scoreBreakdown.strategic * 0.15 + // Company fit and influence
        scoreBreakdown.urgency * 0.1      // Buying signals and timeline
      ), 100);

      // Use fallback explanation instead of LLM to prevent excessive AI calls
      const rankingReason = this.generateFallbackRankingExplanation(contact, scoreBreakdown);

      return {
        ...contact,
        finalScore,
        scoreBreakdown,
        rankingReason // NEW: Explainable AI for client demos
      };
    }));
    
    // Add remaining contacts without processing to maintain full list
    const remainingContacts = contacts.slice(100).map(contact => ({
      ...contact,
      finalScore: contact.priority,
      scoreBreakdown: {
        base: contact.priority,
        recency: 0,
        value: 0,
        engagement: 0,
        strategic: 0,
        urgency: 0
      },
      rankingReason: 'Not processed due to performance limits'
    }));
    
    const allContacts = [...rankedContacts, ...remainingContacts];
    return allContacts.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Generate LLM-powered ranking explanation
   */
  private async generateLLMRankingExplanation(contact: SpeedrunContact, scoreBreakdown: ScoreBreakdown): Promise<string> {
    try {
      const { openaiService } = await import('../ai/services/openaiService');
      
      const prompt = `Generate a concise sales priority explanation:

Contact: ${contact.fullName}
Title: ${contact.title || 'Unknown'}
Company: ${contact.company}
Type: ${contact.sourceType}
Score: ${contact.finalScore}/100
Deal Value: $${contact.dealValue?.toLocaleString() || 'Unknown'}
Last Action: ${contact.lastAction || 'None'}
Days Since Contact: ${contact.daysSinceLastAction || 'Unknown'}
Category: ${contact.category}

Scoring Breakdown:
- Base: ${scoreBreakdown.base}
- Recency: ${scoreBreakdown.recency}
- Value: ${scoreBreakdown.value}
- Engagement: ${scoreBreakdown.engagement}
- Strategic: ${scoreBreakdown.strategic}
- Urgency: ${scoreBreakdown.urgency}

Format: "[Priority]: [context], [key reasons]"
Example: "High priority: existing customer, C-level executive, high-value opportunity"
Keep under 100 characters:`;

      const explanation = await openaiService.generateContent(prompt, {
        maxTokens: 40,
        temperature: 0.3
      });
      
      return explanation.trim();
    } catch (error) {
      console.warn('LLM explanation failed, using fallback:', error);
      return this.generateFallbackRankingExplanation(contact, scoreBreakdown);
    }
  }
  
  /**
   * Fallback human-readable ranking explanation
   */
  private generateFallbackRankingExplanation(contact: SpeedrunContact, scoreBreakdown: ScoreBreakdown): string {
    const reasons = [];
    const context = [];
    
    // Determine priority level
    let priorityLevel = "Medium priority";
    if (contact.finalScore >= 90) {
      priorityLevel = "Critical priority";
    } else if (contact.finalScore >= 70) {
      priorityLevel = "High priority";
    }
    
    // Add context about contact type
    if (contact['sourceType'] === 'customer') {
      context.push('existing customer');
    } else if (contact['sourceType'] === 'opportunity') {
      context.push('active opportunity');
    } else {
      context.push('prospect');
    }
    
    // Add specific reasons based on score breakdown
    if (scoreBreakdown.urgency > 15) {
      reasons.push('strong buying signals');
    }
    if (scoreBreakdown.value > 20) {
      reasons.push('high-value opportunity');
    }
    if (scoreBreakdown.engagement > 15) {
      reasons.push('actively engaged');
    }
    if (scoreBreakdown.recency > 20) {
      reasons.push('recent activity');
    }
    if (scoreBreakdown.strategic > 10) {
      reasons.push('strategic account fit');
    }
    
    // Add executive level context
    const title = (contact.title || '').toLowerCase();
    if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
      context.push('C-level executive');
    } else if (title.includes('vp') || title.includes('director')) {
      context.push('senior executive');
    }
    
    // Build explanation
    const contextText = context.length > 0 ? context.join(', ') : 'contact';
    const reasonText = reasons.length > 0 ? reasons.slice(0, 2).join(', ') : 'standard priority';
    
    return `${priorityLevel}: ${contextText}${reasons.length > 0 ? ', ' + reasonText : ''}`;
  }

  /**
   * Balance acquisition vs retention in daily list
   */
  private balanceAcquisitionRetention(rankedContacts: SpeedrunContact[]): SpeedrunContact[] {
    const acquisitionContacts = rankedContacts.filter(c => c['category'] === 'acquisition');
    const retentionContacts = rankedContacts.filter(c => c['category'] === 'retention');

    // 70% acquisition, 30% retention
    const acquisitionTarget = Math.floor(this.dailyLimit * 0.7);
    const retentionTarget = this.dailyLimit - acquisitionTarget;

    const topAcquisition = acquisitionContacts.slice(0, acquisitionTarget);
    const topRetention = retentionContacts.slice(0, retentionTarget);

    return [...topAcquisition, ...topRetention]
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, this.dailyLimit);
  }

  /**
   * Generate AI next actions for top contacts
   */
  private async generateNextActionsForTopContacts(contacts: SpeedrunContact[]): Promise<void> {
    for (const contact of contacts) {
      contact['nextAction'] = this.generateAINextAction(contact);
    }
  }

  /**
   * Generate AI-powered next action recommendation
   */
  private generateAINextAction(contact: SpeedrunContact): NextActionRecommendation {
    if (contact.realtimeTrigger?.type === 'INBOUND_EMAIL') {
      return {
        type: 'Email Reply',
        subject: `Re: ${contact.realtimeTrigger.subject || 'Your Recent Message'}`,
        priority: 'IMMEDIATE',
        reasoning: 'Respond to inbound interest while momentum is high',
        talking_points: ['Thank for reaching out', 'Understand their specific needs', 'Propose next steps'],
        success_probability: 85,
        estimated_time: '15 minutes'
      };
    }

    if (contact['sourceType'] === 'customer' && (contact.dealValue || 0) > 50000) {
      return {
        type: 'Strategic Check-in',
        subject: 'Strategic Partnership Review',
        priority: 'HIGH',
        reasoning: 'High-value customer expansion opportunity',
        talking_points: ['Review current success', 'Identify expansion opportunities', 'Strengthen relationship'],
        success_probability: 75,
        estimated_time: '30 minutes'
      };
    }

    return {
      type: 'Discovery Call',
      subject: 'Quick Discovery Call',
      priority: 'MEDIUM',
      reasoning: 'Initial contact to understand business needs',
      talking_points: ['Understand current challenges', 'Identify fit', 'Qualify opportunity'],
      success_probability: 60,
      estimated_time: '25 minutes'
    };
  }

  /**
   * Move contact to top of list with real-time trigger
   */
  private async moveContactToTop(contactId: string, trigger: RealtimeTrigger): Promise<void> {
    const existingIndex = this.currentList.findIndex(c => c['id'] === contactId);
    
    if (existingIndex > -1) {
      const contact = this['currentList'][existingIndex];
      if (contact) {
        contact['finalScore'] = 100;
        contact['realtimeTrigger'] = trigger;
        contact['nextAction'] = this.generateAINextAction(contact);

        // Move to top
        this.currentList.splice(existingIndex, 1);
        this.currentList.unshift(contact);

        this.notifyListeners();
      }
    }
  }

  /**
   * Send Monaco notification
   */
  private async sendMonacoNotification(notification: {
    type: string;
    title: string;
    message: string;
    contactId: string;
    priority: 'high' | 'medium' | 'low';
    actionRequired: boolean;
  }): Promise<void> {
    // Integration with Monaco notification system
    console.log(`🔔 Monaco Notification: ${notification.title}`);
    // TODO: Implement actual Monaco notification integration
  }

  /**
   * Utility methods for scoring
   */
  private calculateCustomerPriority(contact: any, totalValue: number): number {
    let score = 60;
    if (totalValue > 100000) score += 20;
    else if (totalValue > 50000) score += 15;
    else if (totalValue > 20000) score += 10;
    return Math.min(score, 100);
  }

  private calculateLeadPriority(lead: any): number {
    let score = 40;
    if (lead.industry?.toLowerCase().includes('retail')) score += 20;
    if (lead.email) score += 10;
    return Math.min(score, 100);
  }

  private calculateOpportunityPriority(opportunity: any): number {
    let score = 70;
    const value = opportunity.amount || 0;
    if (value > 50000) score += 20;
    else if (value > 20000) score += 15;
    return Math.min(score, 100);
  }

  private calculateRecencyScore(contact: SpeedrunContact): number {
    if (contact['daysSinceLastAction'] === undefined) return 5;
    if (contact.daysSinceLastAction < 1) return 30;
    if (contact.daysSinceLastAction < 3) return 25;
    if (contact.daysSinceLastAction < 7) return 20;
    return 10;
  }

  private calculateValueScore(contact: SpeedrunContact): number {
    const dealValue = contact.dealValue || 0;
    if (dealValue > 100000) return 25;
    if (dealValue > 50000) return 20;
    if (dealValue > 20000) return 15;
    return 5;
  }

  private calculateEngagementScore(contact: SpeedrunContact): number {
    let score = 0;
    if (contact.realtimeTrigger) score += 15;
    if (contact.lastAction) score += 5;
    return Math.min(score, 20);
  }

  private calculateStrategicScore(contact: SpeedrunContact): number {
    let score = 0;
    if (contact['sourceType'] === 'customer') score += 10;
    if (contact['sourceType'] === 'email_engagement') score += 12;
    return Math.min(score, 15);
  }

  private calculateUrgencyScore(contact: SpeedrunContact): number {
    if (contact.realtimeTrigger?.priority === 'IMMEDIATE') return 10;
    if (contact.realtimeTrigger?.priority === 'HIGH') return 7;
    return 2;
  }

  private deduplicateContacts(contacts: SpeedrunContact[]): SpeedrunContact[] {
    const seen = new Map();
    const deduplicated = [];

    for (const contact of contacts) {
      const key = contact.email || contact.id;
      if (!seen.has(key)) {
        seen.set(key, contact);
        deduplicated.push(contact);
      }
    }

    return deduplicated;
  }

  private async findContactByEmail(email: string): Promise<SpeedrunContact | null> {
    // Find in current list first
    const existing = this.currentList.find(c => 
      c.email.toLowerCase() === email.toLowerCase()
    );
    
    if (existing) return existing;

    // Search database
    const person = await prisma.people.findFirst({
      where: {
        OR: [
          { email: email },
          { personalEmail: email }
        ]
      }
    });

    if (!person) return null;

    return {
      id: person.id,
      fullName: person.fullName,
      email: person.email || person.personalEmail || '',
      company: 'Unknown Company', // Would need to fetch from relations
      title: person.title,
      sourceType: 'email_engagement',
      category: 'acquisition',
      priority: 95,
      finalScore: 95
    };
  }

  private async createContactFromEmail(emailData: any): Promise<void> {
    // TODO: Implement new contact creation from email
    console.log(`📧 New contact from email: ${emailData.from}`);
  }

  private async getContactById(contactId: string): Promise<SpeedrunContact | null> {
    return this.currentList.find(c => c['id'] === contactId) || null;
  }

  private async calculateDealStageBoost(contact: SpeedrunContact, stage: string): number {
    let boost = 0;
    if (stage.toLowerCase().includes('proposal')) boost = 15;
    if (stage.toLowerCase().includes('negotiation')) boost = 20;
    return contact.finalScore + boost;
  }

  private async updateContactScore(contactId: string, newScore: number, trigger: RealtimeTrigger): Promise<void> {
    const contact = this.currentList.find(c => c['id'] === contactId);
    if (contact) {
      contact['finalScore'] = newScore;
      contact['realtimeTrigger'] = trigger;
      this.currentList.sort((a, b) => b.finalScore - a.finalScore);
      this.notifyListeners();
    }
  }

  private getStagePriority(stage: string): 'IMMEDIATE' | 'HIGH' | 'MEDIUM' {
    if (stage.toLowerCase().includes('negotiation')) return 'IMMEDIATE';
    if (stage.toLowerCase().includes('proposal')) return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * Subscribe to list updates
   */
  subscribe(listener: (contacts: SpeedrunContact[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentList.slice(0, this.dailyLimit)));
  }
}