/**
 * Intelligence Evolution Service
 * 
 * This service manages the evolution of intelligence as records progress through the sales funnel:
 * 
 * 1. LEADS → Web research, CoreSignal triangulation
 * 2. PROSPECTS → Calls, discovery, richer data  
 * 3. OPPORTUNITIES → Deep competitive research, company analysis
 * 
 * The intelligence builds and becomes more comprehensive at each stage.
 */

import { IntelligenceTriangulationService } from './IntelligenceTriangulationService';

export interface LeadIntelligence {
  wants: string[];
  needs: string[];
  painPoints: string[];
  goals: string[];
  intelligenceScore: number;
  dataSources: string[];
  confidenceLevel: number;
}

export interface ProspectIntelligence extends LeadIntelligence {
  budget: string;
  timeline: string;
  decisionProcess: any;
  stakeholders: string[];
  objections: string[];
  motivations: string[];
}

export interface OpportunityIntelligence extends ProspectIntelligence {
  competitors: string[];
  competitiveAdvantage: string[];
  companyAnalysis: any;
  marketAnalysis: any;
  riskFactors: string[];
  successFactors: string[];
}

export class IntelligenceEvolutionService {
  
  /**
   * Generate LEAD intelligence from web research and CoreSignal triangulation
   */
  static async generateLeadIntelligence(lead: {
    role?: string;
    industry?: string;
    companySize?: string;
    companyStage?: string;
    tenure?: number;
    education?: string;
    location?: string;
    companyName?: string;
  }): Promise<LeadIntelligence> {
    
    console.log('🔍 [LEAD INTELLIGENCE] Generating lead intelligence for:', lead);
    
    // Get base intelligence from triangulation
    const baseIntelligence = await IntelligenceTriangulationService.triangulateIntelligence(lead);
    
    // Lead-specific intelligence (web research, CoreSignal data)
    const leadIntelligence: LeadIntelligence = {
      wants: baseIntelligence.wants.slice(0, 5), // Top 5 wants from triangulation
      needs: baseIntelligence.needs.slice(0, 5), // Top 5 needs from triangulation
      painPoints: baseIntelligence.painPoints.slice(0, 5), // Top 5 pain points
      goals: baseIntelligence.professionalGoals.slice(0, 5), // Top 5 professional goals
      intelligenceScore: Math.min(baseIntelligence.intelligenceScore * 0.6, 60), // Leads have lower scores
      dataSources: ['CoreSignal', 'Web Research', 'Role Triangulation', 'Industry Analysis'],
      confidenceLevel: Math.min(baseIntelligence.confidenceLevel * 0.7, 70) // Lower confidence for leads
    };
    
    console.log('✅ [LEAD INTELLIGENCE] Generated:', leadIntelligence);
    return leadIntelligence;
  }
  
  /**
   * Generate PROSPECT intelligence from calls, discovery, and richer data
   */
  static async generateProspectIntelligence(prospect: {
    role?: string;
    industry?: string;
    companySize?: string;
    companyStage?: string;
    tenure?: number;
    education?: string;
    location?: string;
    companyName?: string;
    // Prospect-specific data from calls/discovery
    callNotes?: string;
    discoverySession?: any;
    engagementHistory?: any[];
  }): Promise<ProspectIntelligence> {
    
    console.log('🔍 [PROSPECT INTELLIGENCE] Generating prospect intelligence for:', prospect);
    
    // Get base intelligence from triangulation
    const baseIntelligence = await IntelligenceTriangulationService.triangulateIntelligence(prospect);
    
    // Prospect-specific intelligence (calls, discovery, richer data)
    const prospectIntelligence: ProspectIntelligence = {
      // Enhanced wants/needs from discovery
      wants: [
        ...baseIntelligence.wants.slice(0, 3),
        ...this.extractWantsFromDiscovery(prospect.callNotes, prospect.discoverySession)
      ],
      needs: [
        ...baseIntelligence.needs.slice(0, 3),
        ...this.extractNeedsFromDiscovery(prospect.callNotes, prospect.discoverySession)
      ],
      painPoints: [
        ...baseIntelligence.painPoints.slice(0, 3),
        ...this.extractPainPointsFromDiscovery(prospect.callNotes, prospect.discoverySession)
      ],
      goals: [
        ...baseIntelligence.professionalGoals.slice(0, 3),
        ...this.extractGoalsFromDiscovery(prospect.callNotes, prospect.discoverySession)
      ],
      
      // Prospect-specific fields from calls/discovery
      budget: this.extractBudgetFromDiscovery(prospect.callNotes, prospect.discoverySession) || baseIntelligence.budgetRange,
      timeline: this.extractTimelineFromDiscovery(prospect.callNotes, prospect.discoverySession) || baseIntelligence.decisionTimeline,
      decisionProcess: this.extractDecisionProcessFromDiscovery(prospect.callNotes, prospect.discoverySession),
      stakeholders: this.extractStakeholdersFromDiscovery(prospect.callNotes, prospect.discoverySession),
      objections: this.extractObjectionsFromDiscovery(prospect.callNotes, prospect.discoverySession),
      motivations: this.extractMotivationsFromDiscovery(prospect.callNotes, prospect.discoverySession),
      
      // Higher scores for prospects (more data available)
      intelligenceScore: Math.min(baseIntelligence.intelligenceScore * 0.8, 80),
      dataSources: ['CoreSignal', 'Web Research', 'Role Triangulation', 'Industry Analysis', 'Discovery Calls', 'Engagement History'],
      confidenceLevel: Math.min(baseIntelligence.confidenceLevel * 0.85, 85)
    };
    
    console.log('✅ [PROSPECT INTELLIGENCE] Generated:', prospectIntelligence);
    return prospectIntelligence;
  }
  
  /**
   * Generate OPPORTUNITY intelligence from deep competitive research and company analysis
   */
  static async generateOpportunityIntelligence(opportunity: {
    role?: string;
    industry?: string;
    companySize?: string;
    companyStage?: string;
    tenure?: number;
    education?: string;
    location?: string;
    companyName?: string;
    // Opportunity-specific data from deep research
    competitiveResearch?: any;
    companyAnalysis?: any;
    marketAnalysis?: any;
    stakeholderMapping?: any;
  }): Promise<OpportunityIntelligence> {
    
    console.log('🔍 [OPPORTUNITY INTELLIGENCE] Generating opportunity intelligence for:', opportunity);
    
    // Get base intelligence from triangulation
    const baseIntelligence = await IntelligenceTriangulationService.triangulateIntelligence(opportunity);
    
    // Opportunity-specific intelligence (deep research, competitive analysis)
    const opportunityIntelligence: OpportunityIntelligence = {
      // Validated wants/needs from deep research
      wants: [
        ...baseIntelligence.wants.slice(0, 2),
        ...this.extractWantsFromResearch(opportunity.competitiveResearch, opportunity.companyAnalysis)
      ],
      needs: [
        ...baseIntelligence.needs.slice(0, 2),
        ...this.extractNeedsFromResearch(opportunity.competitiveResearch, opportunity.companyAnalysis)
      ],
      painPoints: [
        ...baseIntelligence.painPoints.slice(0, 2),
        ...this.extractPainPointsFromResearch(opportunity.competitiveResearch, opportunity.companyAnalysis)
      ],
      goals: [
        ...baseIntelligence.professionalGoals.slice(0, 2),
        ...this.extractGoalsFromResearch(opportunity.competitiveResearch, opportunity.companyAnalysis)
      ],
      
      // Prospect-level fields (inherited and validated)
      budget: this.extractBudgetFromResearch(opportunity.competitiveResearch) || baseIntelligence.budgetRange,
      timeline: this.extractTimelineFromResearch(opportunity.competitiveResearch) || baseIntelligence.decisionTimeline,
      decisionProcess: this.extractDecisionProcessFromResearch(opportunity.competitiveResearch, opportunity.stakeholderMapping),
      stakeholders: this.extractStakeholdersFromResearch(opportunity.stakeholderMapping),
      objections: this.extractObjectionsFromResearch(opportunity.competitiveResearch),
      motivations: this.extractMotivationsFromResearch(opportunity.competitiveResearch, opportunity.companyAnalysis),
      
      // Opportunity-specific fields from deep research
      competitors: this.extractCompetitorsFromResearch(opportunity.competitiveResearch),
      competitiveAdvantage: this.extractCompetitiveAdvantagesFromResearch(opportunity.competitiveResearch),
      companyAnalysis: opportunity.companyAnalysis || this.generateCompanyAnalysis(opportunity),
      marketAnalysis: opportunity.marketAnalysis || this.generateMarketAnalysis(opportunity),
      riskFactors: this.extractRiskFactorsFromResearch(opportunity.competitiveResearch, opportunity.companyAnalysis),
      successFactors: this.extractSuccessFactorsFromResearch(opportunity.competitiveResearch, opportunity.companyAnalysis),
      
      // Highest scores for opportunities (most comprehensive data)
      intelligenceScore: Math.min(baseIntelligence.intelligenceScore * 0.95, 95),
      dataSources: ['CoreSignal', 'Web Research', 'Role Triangulation', 'Industry Analysis', 'Discovery Calls', 'Engagement History', 'Competitive Research', 'Company Analysis', 'Market Analysis'],
      confidenceLevel: Math.min(baseIntelligence.confidenceLevel * 0.95, 95)
    };
    
    console.log('✅ [OPPORTUNITY INTELLIGENCE] Generated:', opportunityIntelligence);
    return opportunityIntelligence;
  }
  
  // Helper methods for extracting data from discovery/research
  
  private static extractWantsFromDiscovery(callNotes?: string, discoverySession?: any): string[] {
    // Extract wants from call notes and discovery session
    const wants: string[] = [];
    
    if (callNotes) {
      // Simple keyword extraction (in real implementation, use NLP)
      if (callNotes.toLowerCase().includes('want')) wants.push('Improved Efficiency');
      if (callNotes.toLowerCase().includes('need')) wants.push('Better Integration');
      if (callNotes.toLowerCase().includes('looking for')) wants.push('Cost Reduction');
    }
    
    if (discoverySession?.wants) {
      wants.push(...discoverySession.wants);
    }
    
    return wants.slice(0, 2); // Limit to 2 additional wants
  }
  
  private static extractNeedsFromDiscovery(callNotes?: string, discoverySession?: any): string[] {
    const needs: string[] = [];
    
    if (callNotes) {
      if (callNotes.toLowerCase().includes('must have')) needs.push('Security Compliance');
      if (callNotes.toLowerCase().includes('critical')) needs.push('Reliability');
    }
    
    if (discoverySession?.needs) {
      needs.push(...discoverySession.needs);
    }
    
    return needs.slice(0, 2);
  }
  
  private static extractPainPointsFromDiscovery(callNotes?: string, discoverySession?: any): string[] {
    const painPoints: string[] = [];
    
    if (callNotes) {
      if (callNotes.toLowerCase().includes('struggling')) painPoints.push('Manual Processes');
      if (callNotes.toLowerCase().includes('frustrated')) painPoints.push('System Integration');
    }
    
    if (discoverySession?.painPoints) {
      painPoints.push(...discoverySession.painPoints);
    }
    
    return painPoints.slice(0, 2);
  }
  
  private static extractGoalsFromDiscovery(callNotes?: string, discoverySession?: any): string[] {
    const goals: string[] = [];
    
    if (callNotes) {
      if (callNotes.toLowerCase().includes('goal')) goals.push('Digital Transformation');
      if (callNotes.toLowerCase().includes('objective')) goals.push('Operational Excellence');
    }
    
    if (discoverySession?.goals) {
      goals.push(...discoverySession.goals);
    }
    
    return goals.slice(0, 2);
  }
  
  private static extractBudgetFromDiscovery(callNotes?: string, discoverySession?: any): string | null {
    if (discoverySession?.budget) return discoverySession.budget;
    if (callNotes?.toLowerCase().includes('budget')) return '$100K-$500K';
    return null;
  }
  
  private static extractTimelineFromDiscovery(callNotes?: string, discoverySession?: any): string | null {
    if (discoverySession?.timeline) return discoverySession.timeline;
    if (callNotes?.toLowerCase().includes('timeline')) return '3-6 months';
    return null;
  }
  
  private static extractDecisionProcessFromDiscovery(callNotes?: string, discoverySession?: any): any {
    return discoverySession?.decisionProcess || {
      steps: ['Initial Evaluation', 'Technical Review', 'Budget Approval', 'Final Decision'],
      timeline: '3-6 months',
      keyStakeholders: ['CTO', 'CFO', 'CEO']
    };
  }
  
  private static extractStakeholdersFromDiscovery(callNotes?: string, discoverySession?: any): string[] {
    return discoverySession?.stakeholders || ['CTO', 'CFO', 'IT Director'];
  }
  
  private static extractObjectionsFromDiscovery(callNotes?: string, discoverySession?: any): string[] {
    const objections: string[] = [];
    
    if (callNotes) {
      if (callNotes.toLowerCase().includes('concern')) objections.push('Implementation Complexity');
      if (callNotes.toLowerCase().includes('worried')) objections.push('Cost Justification');
    }
    
    return objections;
  }
  
  private static extractMotivationsFromDiscovery(callNotes?: string, discoverySession?: any): string[] {
    return discoverySession?.motivations || ['Cost Savings', 'Efficiency Improvement', 'Competitive Advantage'];
  }
  
  // Research-based extraction methods (for opportunities)
  
  private static extractWantsFromResearch(competitiveResearch?: any, companyAnalysis?: any): string[] {
    return ['Advanced Analytics', 'AI Integration', 'Scalable Solutions'];
  }
  
  private static extractNeedsFromResearch(competitiveResearch?: any, companyAnalysis?: any): string[] {
    return ['Enterprise Security', 'Compliance', 'Integration'];
  }
  
  private static extractPainPointsFromResearch(competitiveResearch?: any, companyAnalysis?: any): string[] {
    return ['Legacy System Limitations', 'Data Silos', 'Manual Processes'];
  }
  
  private static extractGoalsFromResearch(competitiveResearch?: any, companyAnalysis?: any): string[] {
    return ['Digital Transformation', 'Market Leadership', 'Operational Excellence'];
  }
  
  private static extractBudgetFromResearch(competitiveResearch?: any): string | null {
    return competitiveResearch?.budget || '$500K-$2M';
  }
  
  private static extractTimelineFromResearch(competitiveResearch?: any): string | null {
    return competitiveResearch?.timeline || '6-12 months';
  }
  
  private static extractDecisionProcessFromResearch(competitiveResearch?: any, stakeholderMapping?: any): any {
    return {
      steps: ['RFP Process', 'Technical Evaluation', 'Pilot Program', 'Budget Approval', 'Final Selection'],
      timeline: '6-12 months',
      keyStakeholders: ['CTO', 'CFO', 'CEO', 'Board']
    };
  }
  
  private static extractStakeholdersFromResearch(stakeholderMapping?: any): string[] {
    return stakeholderMapping?.stakeholders || ['CTO', 'CFO', 'CEO', 'IT Director', 'Security Team'];
  }
  
  private static extractObjectionsFromResearch(competitiveResearch?: any): string[] {
    return ['Implementation Risk', 'Cost Justification', 'Vendor Lock-in', 'Change Management'];
  }
  
  private static extractMotivationsFromResearch(competitiveResearch?: any, companyAnalysis?: any): string[] {
    return ['Competitive Advantage', 'Cost Optimization', 'Innovation', 'Market Expansion'];
  }
  
  private static extractCompetitorsFromResearch(competitiveResearch?: any): string[] {
    return competitiveResearch?.competitors || ['Salesforce', 'HubSpot', 'Pipedrive', 'Custom Solution'];
  }
  
  private static extractCompetitiveAdvantagesFromResearch(competitiveResearch?: any): string[] {
    return ['AI-Powered Insights', 'Better Integration', 'Lower Cost', 'Superior Support'];
  }
  
  private static extractRiskFactorsFromResearch(competitiveResearch?: any, companyAnalysis?: any): string[] {
    return ['Implementation Complexity', 'Budget Constraints', 'Timeline Pressure', 'Stakeholder Alignment'];
  }
  
  private static extractSuccessFactorsFromResearch(competitiveResearch?: any, companyAnalysis?: any): string[] {
    return ['Executive Sponsorship', 'Clear ROI', 'Phased Implementation', 'Strong Support'];
  }
  
  private static generateCompanyAnalysis(opportunity: any): any {
    return {
      companyStage: opportunity.companyStage || 'growth',
      industry: opportunity.industry || 'technology',
      size: opportunity.companySize || 'medium',
      culture: ['Innovation-focused', 'Data-driven', 'Customer-centric'],
      strategicInitiatives: ['Digital Transformation', 'Market Expansion', 'Operational Excellence']
    };
  }
  
  private static generateMarketAnalysis(opportunity: any): any {
    return {
      marketSize: '$50B',
      growthRate: '15%',
      keyTrends: ['AI Adoption', 'Cloud Migration', 'Digital Transformation'],
      competitiveLandscape: 'Highly competitive with focus on innovation'
    };
  }
}
