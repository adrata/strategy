/**
 * 🎯 SPEEDRUN INTEGRATION SERVICE
 * 
 * Integrates the intelligent Speedrun real-time engine with:
 * ✅ Existing Speedrun UI components
 * ✅ Email webhook notifications
 * ✅ Monaco notification system
 * ✅ Daily list generation and updates
 * ✅ AI-powered next action recommendations
 */

import { SpeedrunRealtimeEngine, type SpeedrunContact } from './speedrun-realtime-engine';
import { intelligentPainValueEngine } from './intelligent-pain-value-engine';

// Integration with existing Speedrun types
export interface SpeedrunProspect {
  id: string;
  rank: string;
  name: string;
  title: string;
  company: string;
  priority: string;
  buyingSignal: string;
  dealSize: string;
  closeProb: string;
  nextAction: string;
  pain: string;
  valueDriver: string;
  timeline: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  department: string;
  seniority: string;
  buyerRole: string;
  influence: string;
  score: string;
  status: string;
  budget: string;
  realtimeTrigger?: {
    type: string;
    timestamp: Date;
    subject?: string;
    priority: string;
  };
}

export class SpeedrunIntegrationService {
  private realtimeEngine: SpeedrunRealtimeEngine;
  private static instances: Map<string, SpeedrunIntegrationService> = new Map();
  private listeners: Array<(prospects: SpeedrunProspect[]) => void> = [];
  private workspaceId: string;
  private userId: string;

  private constructor(workspaceId: string, userId: string) {
    this['workspaceId'] = workspaceId;
    this['userId'] = userId;
    this['realtimeEngine'] = new SpeedrunRealtimeEngine(workspaceId, userId);
    this.setupRealtimeSubscription();
  }

  static getInstance(workspaceId: string, userId: string): SpeedrunIntegrationService {
    const instanceKey = `${workspaceId}:${userId}`;
    if (!SpeedrunIntegrationService.instances.has(instanceKey)) {
      SpeedrunIntegrationService.instances.set(instanceKey, new SpeedrunIntegrationService(workspaceId, userId));
    }
    return SpeedrunIntegrationService.instances.get(instanceKey)!;
  }

  /**
   * Get today's intelligent Speedrun list
   */
  async getTodaysSpeedrunList(): Promise<SpeedrunProspect[]> {
    const contacts = await this.realtimeEngine.getDailySpeedrunList();
    return this.transformContactsToProspects(contacts);
  }

  /**
   * Handle incoming email from webhook
   */
  async handleIncomingEmail(emailData: {
    from: string;
    subject: string;
    receivedAt: Date;
    messageId: string;
    to: string[];
    cc: string[];
    body: string;
  }): Promise<void> {
    console.log('📧 Speedrun Integration: Processing incoming email');
    
    // Skip if email is from retail-products.com (outbound)
    if (emailData.from.includes('@retail-products.com')) {
      return;
    }

    // Check if email is to retail-products.com (inbound)
    const isInbound = emailData.to.some(email => email.includes('@retail-products.com')) ||
                     emailData.cc.some(email => email.includes('@retail-products.com'));

    if (isInbound) {
      await this.realtimeEngine.handleIncomingEmail({
        from: emailData.from,
        subject: emailData.subject,
        receivedAt: emailData.receivedAt,
        messageId: emailData.messageId
      });
    }
  }

  /**
   * Handle deal/opportunity stage changes
   */
  async handleOpportunityUpdate(data: {
    opportunityId: string;
    previousStage: string;
    newStage: string;
    contactId?: string;
    dealValue?: number;
    probability?: number;
  }): Promise<void> {
    console.log('📊 Speedrun Integration: Processing opportunity update');
    
    await this.realtimeEngine.handleDealStageChange({
      opportunityId: data.opportunityId,
      newStage: data.newStage,
      contactId: data.contactId,
      dealValue: data.dealValue
    });
  }

  /**
   * Subscribe to Speedrun list updates
   */
  subscribe(listener: (prospects: SpeedrunProspect[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Force refresh of daily list
   */
  async refreshDailyList(): Promise<void> {
    // The real-time engine handles its own refresh cycle
    console.log('🔄 Speedrun Integration: Triggering refresh');
    const contacts = await this.realtimeEngine.getDailySpeedrunList();
    const prospects = this.transformContactsToProspects(contacts);
    this.notifyListeners(prospects);
  }

  /**
   * Get contact details for AI chat integration
   */
  async getContactDetails(contactId: string): Promise<any> {
    const contacts = await this.realtimeEngine.getDailySpeedrunList();
    const contact = contacts.find(c => c['id'] === contactId);
    
    if (!contact) return null;

    return {
      id: contact.id,
      name: contact.fullName,
      company: contact.company,
      title: contact.title,
      email: contact.email,
      category: contact.category,
      dealValue: contact.dealValue,
      nextAction: contact.nextAction,
      realtimeTrigger: contact.realtimeTrigger,
      finalScore: contact.finalScore,
      scoreBreakdown: contact.scoreBreakdown
    };
  }

  /**
   * Mark action as completed for a contact
   */
  async markActionCompleted(contactId: string, actionType: string, outcome: 'positive' | 'neutral' | 'negative'): Promise<void> {
    console.log(`✅ Action completed: ${actionType} for ${contactId} with outcome: ${outcome}`);
    
    // TODO: Update the contact's last action in the database
    // This would trigger a recalculation of their priority score
    
    // For now, just trigger a refresh
    await this.refreshDailyList();
  }

  /**
   * Setup real-time subscription to engine updates
   */
  private setupRealtimeSubscription(): void {
    this.realtimeEngine.subscribe((contacts: SpeedrunContact[]) => {
      const prospects = this.transformContactsToProspects(contacts);
      this.notifyListeners(prospects);
    });
  }

  /**
   * Transform SpeedrunContact to SpeedrunProspect format
   */
  private transformContactsToProspects(contacts: SpeedrunContact[]): SpeedrunProspect[] {
    // Group contacts by company for proper ranking
    const contactsByCompany = contacts.reduce((acc, contact) => {
      const company = contact.company || 'Unknown Company';
      if (!acc[company]) acc[company] = [];
      acc[company].push(contact);
      return acc;
    }, {} as Record<string, SpeedrunContact[]>);

    // Sort companies by total deal value
    const sortedCompanies = Object.entries(contactsByCompany).sort((a, b) => {
      const aValue = a[1].reduce((sum, contact) => sum + (contact.dealValue || 0), 0);
      const bValue = b[1].reduce((sum, contact) => sum + (contact.dealValue || 0), 0);
      return bValue - aValue; // Higher value companies first
    });

    const prospects: SpeedrunProspect[] = [];
    
    sortedCompanies.forEach(([company, companyContacts], companyIndex) => {
      // Sort contacts within company by score
      const sortedContacts = companyContacts.sort((a, b) => b.finalScore - a.finalScore);
      
      sortedContacts.forEach((contact, contactIndex) => {
        const companyRank = companyIndex + 1;
        const contactRank = String.fromCharCode(65 + contactIndex); // A, B, C, etc. within each company
        
        prospects.push({
          id: contact.id,
          rank: `${companyRank}${contactRank}`, // 1A, 1B, 2A, 2B, etc.
          name: contact.fullName,
          title: contact.title || '',
          company: contact.company,
          priority: this.scoreToPriority(contact.finalScore),
          buyingSignal: this.determineBuyingSignal(contact),
          dealSize: contact.dealValue ? `$${Math.round(contact.dealValue / 1000)}K` : 'TBD',
          closeProb: this.calculateCloseProb(contact),
          nextAction: contact.nextAction?.type || 'Contact',
          pain: this.generatePainPoint(contact),
          valueDriver: this.generateValueDriver(contact),
          timeline: this.determineTimeline(contact),
          email: contact.email,
          phone: '', // Would need to fetch from database
          linkedin: '', // Would need to fetch from database
          location: '', // Would need to fetch from database
          department: this.determineDepartment(contact.title),
          seniority: this.determineSeniority(contact.title),
          buyerRole: this.determineBuyerRole(contact.title),
          influence: this.determineInfluence(contact.title),
          score: contact.finalScore.toString(),
          status: this.determineStatus(contact),
          budget: contact.dealValue ? `$${Math.round(contact.dealValue / 1000)}K` : 'TBD',
          realtimeTrigger: contact.realtimeTrigger
        });
      });
    });

    return prospects;
  }

  /**
   * Utility methods for prospect transformation
   */
  private scoreToPriority(score: number): string {
    if (score >= 90) return 'Critical';
    if (score >= 80) return 'High';
    if (score >= 70) return 'Medium';
    return 'Low';
  }

  private determineBuyingSignal(contact: SpeedrunContact): string {
    if (contact.realtimeTrigger?.type === 'INBOUND_EMAIL') return 'Inbound Interest';
    if (contact['sourceType'] === 'opportunity') return 'Active Deal';
    if (contact['sourceType'] === 'customer') return 'Expansion Opportunity';
    return 'New Business';
  }

  private calculateCloseProb(contact: SpeedrunContact): string {
    if (contact['sourceType'] === 'customer') return '75%';
    if (contact.realtimeTrigger?.type === 'INBOUND_EMAIL') return '60%';
    if (contact['sourceType'] === 'opportunity') return '45%';
    return '25%';
  }

  private generatePainPoint(contact: SpeedrunContact): string {
    // Use intelligent pain value engine for personalized insights
    return intelligentPainValueEngine.generateIntelligentPainPoint({
      name: contact.fullName,
      title: contact.title,
      company: contact.company,
      category: contact.category,
      dealValue: contact.dealValue
    });
  }

  private generateValueDriver(contact: SpeedrunContact): string {
    // Use intelligent pain value engine for personalized insights  
    return intelligentPainValueEngine.generateIntelligentValueDriver({
      name: contact.fullName,
      title: contact.title,
      company: contact.company,
      category: contact.category,
      dealValue: contact.dealValue
    });
  }

  private determineTimeline(contact: SpeedrunContact): string {
    if (contact.realtimeTrigger?.type === 'INBOUND_EMAIL') return 'Immediate';
    if (contact['sourceType'] === 'opportunity') return '30-60 days';
    if (contact['sourceType'] === 'customer') return '60-90 days';
    return '90+ days';
  }

  private determineDepartment(title?: string): string {
    if (!title) return 'Business';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ops') || lowerTitle.includes('operation')) return 'Operations';
    if (lowerTitle.includes('tech') || lowerTitle.includes('it')) return 'Technology';
    if (lowerTitle.includes('finance') || lowerTitle.includes('cfo')) return 'Finance';
    if (lowerTitle.includes('market') || lowerTitle.includes('sales')) return 'Sales & Marketing';
    return 'Executive';
  }

  private determineSeniority(title?: string): string {
    if (!title) return 'Manager';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ceo') || lowerTitle.includes('president') || lowerTitle.includes('founder')) return 'C-Level';
    if (lowerTitle.includes('vp') || lowerTitle.includes('vice president') || lowerTitle.includes('svp')) return 'VP-Level';
    if (lowerTitle.includes('director') || lowerTitle.includes('head of')) return 'Director';
    if (lowerTitle.includes('manager') || lowerTitle.includes('lead')) return 'Manager';
    return 'Individual Contributor';
  }

  private determineBuyerRole(title?: string): string {
    if (!title) return 'Stakeholder';
    const seniority = this.determineSeniority(title);
    if (seniority === 'C-Level') return 'Decision Maker';
    if (seniority === 'VP-Level') return 'Economic Buyer';
    if (seniority === 'Director') return 'Champion';
    return 'Stakeholder';
  }

  private determineInfluence(title?: string): string {
    const buyerRole = this.determineBuyerRole(title);
    switch (buyerRole) {
      case 'Decision Maker': return 'Very High';
      case 'Economic Buyer': return 'High';
      case 'Champion': return 'Medium';
      default: return 'Low';
    }
  }

  private determineStatus(contact: SpeedrunContact): string {
    if (contact.realtimeTrigger?.type === 'INBOUND_EMAIL') return 'Hot Lead';
    if (contact['sourceType'] === 'customer') return 'Existing Customer';
    if (contact['sourceType'] === 'opportunity') return 'Active Opportunity';
    if (contact['daysSinceLastAction'] && contact.daysSinceLastAction < 7) return 'Recently Contacted';
    return 'New Lead';
  }

  private notifyListeners(prospects: SpeedrunProspect[]): void {
    this.listeners.forEach(listener => listener(prospects));
  }
}

// Export factory function for user-specific instances
export const getSpeedrunIntegration = (workspaceId: string, userId: string = 'default-user') => SpeedrunIntegrationService.getInstance(workspaceId, userId);