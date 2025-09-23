/**
 * 🏆 UNIFIED MASTER RANKING SYSTEM
 * 
 * Creates a single master ranking (1-N) of ALL contacts across the entire system.
 * This ranking determines priority across Companies, People, Leads, Prospects, and Speedrun.
 * 
 * Master Ranking Structure:
 * - Companies (1-476): Ranked by value, opportunities, engagement
 * - People (1-4760): Ranked by company + role + engagement within companies
 * - Leads (1-2000): Subset of people who are leads (keep original rank)
 * - Prospects (2001-4760): Subset of people who are prospects (keep original rank)
 * - Speedrun (1-30): Top 30 people from master ranking
 * 
 * Key Features:
 * - Real-time engagement tracking (companies contacted today get lower priority)
 * - Role-based ranking (Decision Maker > Champion > Blocker, etc.)
 * - Deal value and opportunity stage weighting
 * - Company size and strategic importance
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MasterRankedCompany {
  id: string;
  masterRank: number;
  name: string;
  industry: string;
  companySize: string;
  totalPipelineValue: number;
  activeOpportunities: number;
  avgDealSize: number;
  highInfluenceContacts: number;
  lastContactDate: Date | null;
  engagementScore: number;
  strategicValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MasterRankedPerson {
  id: string;
  masterRank: number;
  name: string;
  company: string;
  companyRank: number;
  title: string;
  role: string; // Decision Maker, Champion, Blocker, etc.
  email: string;
  phone: string;
  status: string;
  priority: string;
  type: 'lead' | 'prospect' | 'opportunity_contact' | 'customer';
  
  // Scoring factors
  roleScore: number;
  engagementScore: number;
  dealValue: number;
  opportunityStage: string | null;
  daysSinceLastContact: number | null;
  responseHistory: number;
  
  // Timing
  lastContactDate: Date | null;
  nextActionDate: Date | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface UnifiedMasterRanking {
  companies: MasterRankedCompany[];
  people: MasterRankedPerson[];
  leads: MasterRankedPerson[];
  prospects: MasterRankedPerson[];
  speedrun: MasterRankedPerson[];
  lastCalculated: Date;
}

export class UnifiedMasterRankingEngine {
  
  /**
   * 🎯 Generate unified master ranking of ALL contacts (1-N)
   */
  static async generateMasterRanking(workspaceId: string, userId: string): Promise<UnifiedMasterRanking> {
    console.log(`🏆 [UNIFIED MASTER RANKING] Generating master ranking for workspace: ${workspaceId}`);
    
    // Step 1: Get ALL data from database
    const [companies, people, leads, prospects, opportunities, contacts] = await Promise.all([
      // Companies
      prisma.companies.findMany({
        where: { 
          workspaceId: workspaceId,
          deletedAt: null 
        },
        include: {
          people: true,
          opportunities: true
        },
        orderBy: { updatedAt: 'desc' }
      }),
      
      // People
      prisma.people.findMany({
        where: {
          workspaceId: workspaceId,
          assignedUserId: userId,
          deletedAt: null
        },
        orderBy: { updatedAt: 'desc' }
      }),
      
      // Leads
      prisma.leads.findMany({
        where: { 
          workspaceId: workspaceId,
          assignedUserId: userId,
          status: { notIn: ['closed', 'converted'] },
          deletedAt: null 
        },
        orderBy: { updatedAt: 'desc' }
      }),
      
      // Prospects
      prisma.prospects.findMany({
        where: {
          workspaceId: workspaceId,
          assignedUserId: userId,
          deletedAt: null
        },
        orderBy: { updatedAt: 'desc' }
      }),
      
      // Opportunities
      prisma.opportunities.findMany({
        where: { 
          workspaceId: workspaceId,
          assignedUserId: userId,
          stage: { notIn: ['closed-won', 'closed-lost', 'closed-lost-to-competition'] },
          deletedAt: null 
        },
        include: {
          account: true,
          contact: true
        },
        orderBy: { amount: 'desc' }
      }),
      
      // Contacts
      prisma.contacts.findMany({
        where: {
          workspaceId: workspaceId,
          assignedUserId: userId,
          deletedAt: null
        },
        orderBy: { updatedAt: 'desc' }
      })
    ]);
    
    console.log(`📊 [UNIFIED MASTER RANKING] Loaded data: ${companies.length} companies, ${people.length} people, ${leads.length} leads, ${prospects.length} prospects, ${opportunities.length} opportunities, ${contacts.length} contacts`);
    
    // Step 2: Calculate company rankings
    const rankedCompanies = await this.calculateCompanyRankings(companies, opportunities, workspaceId);
    
    // Step 3: Calculate people rankings within companies
    const rankedPeople = await this.calculatePeopleRankings(people, leads, prospects, opportunities, contacts, rankedCompanies);
    
    // Step 4: Generate final unified ranking
    const unifiedRanking: UnifiedMasterRanking = {
      companies: rankedCompanies,
      people: rankedPeople,
      leads: rankedPeople.filter(p => p.type === 'lead'),
      prospects: rankedPeople.filter(p => p.type === 'prospect'),
      speedrun: rankedPeople.slice(0, 30), // Top 30 people
      lastCalculated: new Date()
    };
    
    console.log(`🏆 [UNIFIED MASTER RANKING] Generated unified ranking: ${unifiedRanking.companies.length} companies, ${unifiedRanking.people.length} people, ${unifiedRanking.leads.length} leads, ${unifiedRanking.prospects.length} prospects, ${unifiedRanking.speedrun.length} speedrun`);
    
    return unifiedRanking;
  }
  
  /**
   * 🏢 Calculate company rankings based on real data
   */
  private static async calculateCompanyRankings(
    companies: any[],
    opportunities: any[],
    workspaceId: string
  ): Promise<MasterRankedCompany[]> {
    
    // Get companies contacted today (from TodayActivityTracker logic)
    const companiesContactedToday = await this.getCompaniesContactedToday(workspaceId);
    
    const companyStats: Record<string, {
      totalPipelineValue: number;
      activeOpportunities: number;
      avgDealSize: number;
      highInfluenceContacts: number;
      lastContactDate: Date | null;
      engagementScore: number;
      strategicValue: number;
    }> = {};
    
    // Aggregate company-level metrics
    companies.forEach(company => {
      const companyName = company.name;
      
      // Get opportunities for this company
      const companyOpportunities = opportunities.filter(opp => 
        opp.account?.name === companyName || 
        opp.contact?.company === companyName
      );
      
      const totalPipelineValue = companyOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
      const activeOpportunities = companyOpportunities.length;
      const avgDealSize = activeOpportunities > 0 ? totalPipelineValue / activeOpportunities : 0;
      
      // Count high-influence contacts (Decision Makers, Champions)
      const highInfluenceContacts = company.people?.filter((person: any) => {
        const role = person.customFields?.buyerGroupRole || person.buyerGroupRole;
        return role === 'Decision Maker' || role === 'Champion';
      }).length || 0;
      
      // Calculate engagement score (companies contacted today get lower score)
      let engagementScore = 50; // Base score
      if (companiesContactedToday.has(companyName)) {
        engagementScore = 10; // Heavily penalize companies contacted today
      }
      
      // Calculate strategic value based on company size and industry
      let strategicValue = 1;
      if (company.industry === 'Technology' || company.industry === 'Software') strategicValue = 3;
      else if (company.industry === 'Healthcare' || company.industry === 'Finance') strategicValue = 2;
      
      if (company.employees > 1000) strategicValue *= 2;
      else if (company.employees > 100) strategicValue *= 1.5;
      
      companyStats[companyName] = {
        totalPipelineValue,
        activeOpportunities,
        avgDealSize,
        highInfluenceContacts,
        lastContactDate: company.updatedAt,
        engagementScore,
        strategicValue
      };
    });
    
    // Calculate company ranking scores
    const companyRankings: MasterRankedCompany[] = companies.map(company => {
      const stats = companyStats[company.name] || {
        totalPipelineValue: 0,
        activeOpportunities: 0,
        avgDealSize: 0,
        highInfluenceContacts: 0,
        lastContactDate: company.updatedAt,
        engagementScore: 50,
        strategicValue: 1
      };
      
      let companyScore = 0;
      
      // Total pipeline value (40% of score)
      companyScore += Math.min(stats.totalPipelineValue / 50000, 20); // Max 20 points for $1M+ pipeline
      
      // Average deal size (25% of score)
      companyScore += Math.min(stats.avgDealSize / 25000, 12.5); // Max 12.5 points for $500K+ avg
      
      // Active deals momentum (20% of score)
      companyScore += stats.activeOpportunities * 2.5; // 2.5 points per active deal
      
      // High-influence contacts (10% of score)
      companyScore += stats.highInfluenceContacts * 1.25; // 1.25 points per champion/decision maker
      
      // Strategic value (5% of score)
      companyScore += stats.strategicValue;
      
      // Engagement penalty (companies contacted today get lower priority)
      companyScore *= (stats.engagementScore / 100);
      
      return {
        id: company.id,
        masterRank: 0, // Will be set after sorting
        name: company.name,
        industry: company.industry || 'Unknown',
        companySize: this.determineCompanySize(company.employees),
        totalPipelineValue: stats.totalPipelineValue,
        activeOpportunities: stats.activeOpportunities,
        avgDealSize: stats.avgDealSize,
        highInfluenceContacts: stats.highInfluenceContacts,
        lastContactDate: stats.lastContactDate,
        engagementScore: stats.engagementScore,
        strategicValue: stats.strategicValue,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      };
    });
    
    // Sort by score and assign ranks
    const sortedCompanies = companyRankings.sort((a, b) => {
      const scoreA = this.calculateCompanyScore(a);
      const scoreB = this.calculateCompanyScore(b);
      return scoreB - scoreA; // Higher score = better rank
    });
    
    // Assign sequential ranks
    sortedCompanies.forEach((company, index) => {
      company.masterRank = index + 1;
    });
    
    return sortedCompanies;
  }
  
  /**
   * 👥 Calculate people rankings within companies
   */
  private static async calculatePeopleRankings(
    people: any[],
    leads: any[],
    prospects: any[],
    opportunities: any[],
    contacts: any[],
    rankedCompanies: MasterRankedCompany[]
  ): Promise<MasterRankedPerson[]> {
    
    // Create company rank lookup
    const companyRankMap = new Map<string, number>();
    rankedCompanies.forEach(company => {
      companyRankMap.set(company.name, company.masterRank);
    });
    
    // Combine all people data
    const allPeople: any[] = [
      ...people.map(p => ({ ...p, type: 'people' })),
      ...leads.map(p => ({ ...p, type: 'lead' })),
      ...prospects.map(p => ({ ...p, type: 'prospect' })),
      ...contacts.map(p => ({ ...p, type: 'contact' }))
    ];
    
    // Group by company
    const peopleByCompany: Record<string, any[]> = {};
    allPeople.forEach(person => {
      const company = person.company || person.companyName || 'Unknown Company';
      if (!peopleByCompany[company]) {
        peopleByCompany[company] = [];
      }
      peopleByCompany[company].push(person);
    });
    
    const rankedPeople: MasterRankedPerson[] = [];
    
    // Rank people within each company
    Object.entries(peopleByCompany).forEach(([company, companyPeople]) => {
      const companyRank = companyRankMap.get(company) || 999; // Unknown companies get low rank
      
      // Sort people within company by role and engagement
      const sortedPeople = companyPeople.sort((a, b) => {
        const roleScoreA = this.getRoleScore(a);
        const roleScoreB = this.getRoleScore(b);
        
        if (roleScoreA !== roleScoreB) {
          return roleScoreB - roleScoreA; // Higher role score first
        }
        
        // If same role, sort by engagement
        const engagementA = this.getEngagementScore(a);
        const engagementB = this.getEngagementScore(b);
        return engagementB - engagementA;
      });
      
      // Assign ranks within company
      sortedPeople.forEach((person, index) => {
        const personRank = (companyRank - 1) * 10 + index + 1; // 10 people per company
        
        rankedPeople.push({
          id: person.id,
          masterRank: personRank,
          name: person.fullName || person.displayName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
          company: company,
          companyRank: companyRank,
          title: person.jobTitle || person.title || 'Unknown Title',
          role: person.customFields?.buyerGroupRole || person.buyerGroupRole || 'Unknown',
          email: person.email || person.workEmail || '',
          phone: person.phone || person.workPhone || person.mobilePhone || '',
          status: person.status || 'new',
          priority: person.priority || 'medium',
          type: person.type === 'lead' ? 'lead' : person.type === 'prospect' ? 'prospect' : 'opportunity_contact',
          
          // Scoring factors
          roleScore: this.getRoleScore(person),
          engagementScore: this.getEngagementScore(person),
          dealValue: this.getDealValue(person, opportunities),
          opportunityStage: this.getOpportunityStage(person, opportunities),
          daysSinceLastContact: this.getDaysSinceLastContact(person),
          responseHistory: this.getResponseHistory(person),
          
          // Timing
          lastContactDate: person.lastContactDate || person.lastActionDate,
          nextActionDate: person.nextActionDate,
          
          // Metadata
          createdAt: person.createdAt,
          updatedAt: person.updatedAt
        });
      });
    });
    
    // Sort all people by master rank
    return rankedPeople.sort((a, b) => a.masterRank - b.masterRank);
  }
  
  /**
   * 🚨 Get companies contacted today (from TodayActivityTracker logic)
   */
  private static async getCompaniesContactedToday(workspaceId: string): Promise<Set<string>> {
    // This would integrate with TodayActivityTracker
    // For now, return empty set - this would be populated from actual activity tracking
    return new Set<string>();
  }
  
  /**
   * 🎯 Calculate company score for ranking
   */
  private static calculateCompanyScore(company: MasterRankedCompany): number {
    let score = 0;
    
    // Total pipeline value (40% of score)
    score += Math.min(company.totalPipelineValue / 50000, 20);
    
    // Average deal size (25% of score)
    score += Math.min(company.avgDealSize / 25000, 12.5);
    
    // Active deals momentum (20% of score)
    score += company.activeOpportunities * 2.5;
    
    // High-influence contacts (10% of score)
    score += company.highInfluenceContacts * 1.25;
    
    // Strategic value (5% of score)
    score += company.strategicValue;
    
    // Engagement penalty
    score *= (company.engagementScore / 100);
    
    return score;
  }
  
  /**
   * 🎭 Get role score for ranking
   */
  private static getRoleScore(person: any): number {
    const role = person.customFields?.buyerGroupRole || person.buyerGroupRole;
    switch (role) {
      case 'Decision Maker': return 100;
      case 'Champion': return 80;
      case 'Blocker': return 60;
      case 'Stakeholder': return 40;
      case 'Introducer': return 20;
      default: return 10;
    }
  }
  
  /**
   * 📊 Get engagement score for ranking
   */
  private static getEngagementScore(person: any): number {
    let score = 50; // Base score
    
    // Status-based scoring
    switch (person.status) {
      case 'Hot': score += 40; break;
      case 'Qualified': score += 30; break;
      case 'Contacted': score += 20; break;
      case 'New': score += 10; break;
      default: score += 15;
    }
    
    // Contact information completeness
    if (person.email) score += 5;
    if (person.phone) score += 5;
    if (person.linkedinUrl) score += 5;
    
    return Math.min(score, 100);
  }
  
  /**
   * 💰 Get deal value for ranking
   */
  private static getDealValue(person: any, opportunities: any[]): number {
    // Find opportunities associated with this person
    const personOpportunities = opportunities.filter(opp => 
      opp.contact?.id === person.id || 
      opp.contact?.email === person.email
    );
    
    return personOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  }
  
  /**
   * 🎯 Get opportunity stage for ranking
   */
  private static getOpportunityStage(person: any, opportunities: any[]): string | null {
    const personOpportunities = opportunities.filter(opp => 
      opp.contact?.id === person.id || 
      opp.contact?.email === person.email
    );
    
    if (personOpportunities.length === 0) return null;
    
    // Return the highest stage opportunity
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won'];
    let highestStage = 'prospecting';
    
    personOpportunities.forEach(opp => {
      const stageIndex = stages.indexOf(opp.stage);
      if (stageIndex > stages.indexOf(highestStage)) {
        highestStage = opp.stage;
      }
    });
    
    return highestStage;
  }
  
  /**
   * 📅 Get days since last contact
   */
  private static getDaysSinceLastContact(person: any): number | null {
    const lastContact = person.lastContactDate || person.lastActionDate;
    if (!lastContact) return null;
    
    const now = new Date();
    const lastContactDate = new Date(lastContact);
    const diffTime = Math.abs(now.getTime() - lastContactDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * 📈 Get response history score
   */
  private static getResponseHistory(person: any): number {
    // This would be calculated from actual interaction history
    // For now, return a base score
    return 50;
  }
  
  /**
   * 🏢 Determine company size category
   */
  private static determineCompanySize(employees: number): string {
    if (employees > 1000) return 'Enterprise';
    if (employees > 100) return 'Mid-Market';
    return 'SMB';
  }
}
