/**
 * 🏆 MASTER RANKING ENGINE
 * 
 * Creates a single master ranking (1-N) of ALL contacts across the entire system.
 * This ranking determines priority across Speedrun, Leads, Prospects, and Opportunities.
 * 
 * Core Logic:
 * - Ranks 1-50: Speedrun (immediate action)
 * - Rank 55: Next business day
 * - Rank 700: Next month
 * - Contact #66 could be Lead #1 (filtered view of master ranking)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MasterRankedContact {
  id: string;
  masterRank: number;
  name: string;
  company: string;
  email: string;
  title: string;
  status: string;
  priority: string;
  type: 'lead' | 'prospect' | 'opportunity_contact' | 'customer';
  
  // Scoring factors
  opportunityValue: number;
  opportunityStage: string | null;
  daysSinceLastContact: number | null;
  responseHistory: number;
  engagementScore: number;
  
  // Timing
  nextActionTiming: string;
  nextActionDate: Date;
  
  // Metadata
  lastContactDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MasterRankingEngine {
  
  /**
   * 🎯 Generate master ranking of ALL contacts (1-N)
   */
  static async generateMasterRanking(workspaceId: string, userId: string): Promise<MasterRankedContact[]> {
    console.log(`🏆 [MASTER RANKING] Generating master ranking for workspace: ${workspaceId}`);
    
    // Step 1: Get ALL contacts from all sources
    const [leads, prospects, opportunities, contacts] = await Promise.all([
      // Active leads
      prisma.leads.findMany({
        where: { workspaceId: workspaceId,
          assignedUserId: userId,
          status: { notIn: ['closed', 'converted'] , deletedAt: null }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      
      // Active prospects  
      prisma.people.findMany({
        where: {
          workspaceId: workspaceId,
          assignedUserId: userId
        },
        orderBy: { updatedAt: 'desc' }
      }),
      
      // Opportunities with contacts
      prisma.opportunities.findMany({
        where: { workspaceId: workspaceId,
          assignedUserId: userId,
          stage: { 
            notIn: ['closed-won', 'closed-lost', 'closed-lost-to-competition'] 
          , deletedAt: null }
        },
        include: {
          account: true,
          contact: true
        },
        orderBy: { amount: 'desc' }
      }),
      
      // Direct contacts
      prisma.contacts.findMany({
        where: {
          workspaceId: workspaceId,
          assignedUserId: userId
        , deletedAt: null},
        orderBy: { updatedAt: 'desc' }
      })
    ]);
    
    // Step 2: Convert all to unified contact format
    const allContacts: MasterRankedContact[] = [];
    
    // Process opportunities first (highest priority)
    for (const opp of opportunities) {
      const contact = opp.contact || await this.findContactForOpportunity(opp);
      
      if (contact) {
        allContacts.push({
          id: `opp-${opp.id}`,
          masterRank: 0, // Will be calculated
          name: contact.fullName || contact.firstName + ' ' + contact.lastName || 'Unknown',
          company: opp.account?.name || 'Unknown Company',
          email: contact.email || '',
          title: contact.jobTitle || '',
          status: 'opportunity',
          priority: this.getOpportunityPriority(opp),
          type: 'opportunity_contact',
          
          opportunityValue: opp.amount || 0,
          opportunityStage: opp.stage,
          daysSinceLastContact: this.calculateDaysSince(contact.updatedAt),
          responseHistory: 0, // TODO: Calculate from interactions
          engagementScore: this.calculateEngagementScore(opp, contact),
          
          nextActionTiming: this.calculateNextActionTiming(opp, contact),
          nextActionDate: this.calculateNextActionDate(opp, contact),
          
          lastContactDate: contact.updatedAt,
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt
        });
      }
    }
    
    // Process prospects
    for (const prospect of prospects) {
      allContacts.push({
        id: `prospect-${prospect.id}`,
        masterRank: 0,
        name: prospect.fullName || 'Unknown',
        company: prospect.company || 'Unknown Company',
        email: prospect.email || '',
        title: prospect.title || '',
        status: prospect.status || 'prospect',
        priority: 'medium',
        type: 'prospect',
        
        opportunityValue: 0,
        opportunityStage: null,
        daysSinceLastContact: this.calculateDaysSince(prospect.updatedAt),
        responseHistory: 0,
        engagementScore: this.calculateProspectEngagementScore(prospect),
        
        nextActionTiming: this.calculateProspectTiming(prospect),
        nextActionDate: this.calculateProspectActionDate(prospect),
        
        lastContactDate: prospect.updatedAt,
        createdAt: prospect.createdAt,
        updatedAt: prospect.updatedAt
      });
    }
    
    // Process leads
    for (const lead of leads) {
      allContacts.push({
        id: `lead-${lead.id}`,
        masterRank: 0,
        name: lead.fullName || 'Unknown',
        company: lead.company || 'Unknown Company',
        email: lead.email || '',
        title: lead.title || '',
        status: lead.status || 'new',
        priority: lead.priority || 'medium',
        type: 'lead',
        
        opportunityValue: 0,
        opportunityStage: null,
        daysSinceLastContact: this.calculateDaysSince(lead.updatedAt),
        responseHistory: 0,
        engagementScore: this.calculateLeadEngagementScore(lead),
        
        nextActionTiming: this.calculateLeadTiming(lead),
        nextActionDate: this.calculateLeadActionDate(lead),
        
        lastContactDate: lead.updatedAt,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      });
    }
    
    // Step 3: Calculate master ranking scores
    const rankedContacts = allContacts.map(contact => ({
      ...contact,
      masterScore: this.calculateMasterScore(contact)
    }));
    
    // Step 4: Sort by master score and assign ranks
    rankedContacts.sort((a, b) => b.masterScore - a.masterScore);
    
    const finalRanking = rankedContacts.map((contact, index) => ({
      ...contact,
      masterRank: index + 1,
      nextActionTiming: this.getTimingByRank(index + 1)
    }));
    
    console.log(`🏆 [MASTER RANKING] Generated ${finalRanking.length} ranked contacts`);
    console.log(`🏆 [MASTER RANKING] Top 5: ${finalRanking.slice(0, 5).map(c => `#${c.masterRank} ${c.name} (${c.company})`).join(', ')}`);
    
    return finalRanking;
  }
  
  /**
   * 📊 Calculate master score for ranking
   */
  private static calculateMasterScore(contact: MasterRankedContact): number {
    let score = 0;
    
    // 1. OPPORTUNITY VALUE (highest weight)
    if (contact.opportunityValue > 0) {
      score += Math.log10(contact.opportunityValue + 1) * 25; // Logarithmic scaling
      
      // Stage bonus for opportunities
      const stage = contact.opportunityStage?.toLowerCase() || '';
      if (stage.includes('negotiation')) score += 200;
      else if (stage.includes('proposal')) score += 150;
      else if (stage.includes('discovery')) score += 100;
      else if (stage.includes('qualification')) score += 75;
    }
    
    // 2. CONTACT TYPE PRIORITY
    switch (contact.type) {
      case 'opportunity_contact': score += 100; break;
      case 'prospect': score += 50; break;
      case 'lead': score += 25; break;
      case 'customer': score += 75; break;
    }
    
    // 3. STATUS PRIORITY
    const status = contact.status.toLowerCase();
    if (status === 'responded' || status === 'engaged') score += 80;
    else if (status === 'contacted') score += 40;
    else if (status === 'new' || status === 'uncontacted') score += 30;
    else if (status === 'opportunity') score += 90;
    
    // 4. PRIORITY BOOST
    const priority = contact.priority.toLowerCase();
    if (priority === 'urgent') score += 60;
    else if (priority === 'high') score += 40;
    else if (priority === 'medium') score += 20;
    
    // 5. RECENCY BOOST
    if (contact.daysSinceLastContact !== null) {
      if (contact.daysSinceLastContact <= 3) score += 30;
      else if (contact.daysSinceLastContact <= 7) score += 20;
      else if (contact.daysSinceLastContact <= 14) score += 10;
      else if (contact.daysSinceLastContact >= 30) score += 15; // Re-engagement opportunity
    }
    
    // 6. ENGAGEMENT SCORE
    score += contact.engagementScore;
    
    return Math.round(score);
  }
  
  /**
   * ⏰ Get timing based on master rank
   */
  private static getTimingByRank(rank: number): string {
    if (rank <= 50) return 'speedrun'; // Top 50 = Speedrun
    else if (rank <= 100) return 'today'; // Next 50 = Today
    else if (rank <= 200) return 'next_business_day'; // Next 100 = Tomorrow
    else if (rank <= 350) return 'this_week'; // Next 150 = This week
    else if (rank <= 500) return 'next_week'; // Next 150 = Next week
    else if (rank <= 750) return 'two_weeks'; // Next 250 = Two weeks
    else return 'next_month'; // Rest = Next month
  }
  
  /**
   * 🎯 Get filtered view of master ranking
   */
  static getFilteredView(
    masterRanking: MasterRankedContact[], 
    viewType: 'speedrun' | 'leads' | 'prospects' | 'opportunities'
  ): MasterRankedContact[] {
    
    switch (viewType) {
      case 'speedrun':
        // Top 50 from master ranking
        return masterRanking.slice(0, 50);
        
      case 'leads':
        // Only leads from master ranking, maintaining their master rank
        return masterRanking.filter(c => c['type'] === 'lead');
        
      case 'prospects':
        // Only prospects from master ranking
        return masterRanking.filter(c => c['type'] === 'prospect' || c['status'] === 'engaged');
        
      case 'opportunities':
        // Only opportunity contacts from master ranking
        return masterRanking.filter(c => c['type'] === 'opportunity_contact');
        
      default:
        return masterRanking;
    }
  }
  
  // Helper methods
  private static async findContactForOpportunity(opp: any) {
    // Try to find contact associated with opportunity
    if (opp.contactId) {
      return await prisma.contacts.findFirst({ where: { id: opp.contactId , deletedAt: null} });
    }
    
    // Fallback: Find contact by account
    if (opp.accountId) {
      return await prisma.contacts.findFirst({ 
        where: { accountId: opp.accountId },
        orderBy: { updatedAt: 'desc' }
      });
    }
    
    return null;
  }
  
  private static getOpportunityPriority(opp: any): string {
    const amount = opp.amount || 0;
    const stage = opp.stage?.toLowerCase() || '';
    
    if (amount >= 1000000) return 'urgent';
    if (amount >= 500000) return 'urgent';
    if (amount >= 100000) return 'high';
    
    if (stage.includes('negotiation') || stage.includes('proposal')) return 'urgent';
    if (stage.includes('discovery') || stage.includes('qualification')) return 'high';
    
    return 'medium';
  }
  
  private static calculateDaysSince(date: Date | null): number | null {
    if (!date) return null;
    return Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  }
  
  private static calculateEngagementScore(opp: any, contact: any): number {
    let score = 0;
    
    // Opportunity stage engagement
    const stage = opp.stage?.toLowerCase() || '';
    if (stage.includes('negotiation')) score += 50;
    else if (stage.includes('proposal')) score += 40;
    else if (stage.includes('discovery')) score += 30;
    else if (stage.includes('qualification')) score += 20;
    
    // Contact status engagement
    const status = contact.status?.toLowerCase() || '';
    if (status === 'responded' || status === 'engaged') score += 30;
    else if (status === 'contacted') score += 15;
    
    return score;
  }
  
  private static calculateProspectEngagementScore(prospect: any): number {
    let score = 0;
    
    const status = prospect.status?.toLowerCase() || '';
    if (status === 'responded' || status === 'engaged') score += 40;
    else if (status === 'contacted') score += 20;
    else if (status === 'new') score += 10;
    
    return score;
  }
  
  private static calculateLeadEngagementScore(lead: any): number {
    let score = 0;
    
    const status = lead.status?.toLowerCase() || '';
    if (status === 'qualified') score += 35;
    else if (status === 'contacted') score += 20;
    else if (status === 'new') score += 15;
    
    return score;
  }
  
  private static calculateNextActionTiming(opp: any, contact: any): string {
    const stage = opp.stage?.toLowerCase() || '';
    const amount = opp.amount || 0;
    
    // High-value or advanced stage = immediate action
    if (amount >= 500000 || stage.includes('negotiation')) return 'now';
    if (amount >= 100000 || stage.includes('proposal')) return 'today';
    if (stage.includes('discovery')) return 'this_week';
    
    return 'next_week';
  }
  
  private static calculateNextActionDate(opp: any, contact: any): Date {
    const timing = this.calculateNextActionTiming(opp, contact);
    const now = new Date();
    
    switch (timing) {
      case 'now': return now;
      case 'today': return now;
      case 'this_week': return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case 'next_week': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
  
  private static calculateProspectTiming(prospect: any): string {
    const status = prospect.status?.toLowerCase() || '';
    
    if (status === 'responded' || status === 'engaged') return 'today';
    if (status === 'contacted') return 'this_week';
    
    return 'next_week';
  }
  
  private static calculateProspectActionDate(prospect: any): Date {
    const timing = this.calculateProspectTiming(prospect);
    const now = new Date();
    
    switch (timing) {
      case 'today': return now;
      case 'this_week': return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case 'next_week': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
  
  private static calculateLeadTiming(lead: any): string {
    const status = lead.status?.toLowerCase() || '';
    const priority = lead.priority?.toLowerCase() || '';
    
    if (priority === 'urgent' || status === 'qualified') return 'today';
    if (status === 'contacted' || status === 'responded') return 'this_week';
    
    return 'next_week';
  }
  
  private static calculateLeadActionDate(lead: any): Date {
    const timing = this.calculateLeadTiming(lead);
    const now = new Date();
    
    switch (timing) {
      case 'today': return now;
      case 'this_week': return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case 'next_week': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
  }
}
