/**
 * Speedrun Data Service - Shared data store for Speedrun prospects
 * Ensures perfect synchronization between Monaco standalone RTP section and dedicated Speedrun mode
 */

import React from "react";
import { demoScenarioService } from "@/platform/services/DemoScenarioService";
import { authFetch } from "@/platform/api-fetch";
import { getSpeedrunPrioritization, SpeedrunPrioritizationScore } from './speedrun-prioritization-service';
import { correctPeopleNamesFromEmails } from "@/platform/utils/nameCorrection";
import { WorkspaceDataRouter } from "./workspace-data-router";
// Removed speedrunIntegration import to prevent Prisma browser errors

// No fallback data - removed

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
  // Additional fields for Speedrun mode
  score?: string;
  status?: string;
  budget?: string;
  vertical?: string; // C Stores, Grocery Stores, Corporate Retailers, Other
  hasOpportunity?: boolean; // Whether this company has any opportunities
}

export class SpeedrunDataService {
  private static instances: Map<string, SpeedrunDataService> = new Map();
  private prospects: SpeedrunProspect[] = [];
  private listeners: Array<(prospects: SpeedrunProspect[]) => void> = [];
  private isInitialized = false;
  private isRefreshing = false; // Prevent multiple simultaneous refreshes
  private static isInitializing = false; // Global initialization flag
  private workspaceId: string;
  private userId: string;

  constructor(workspaceId: string, userId: string) {
    this['workspaceId'] = workspaceId;
    this['userId'] = userId;
    
    // Pre-load data synchronously for instant experience
    this.preloadData();
  }

  static getInstance(workspaceId: string, userId: string): SpeedrunDataService {
    // PREVENT DEFAULT WORKSPACE POLLUTION
    if (!workspaceId || !userId || workspaceId === 'default' || userId === 'default') {
      throw new Error(`Invalid workspace/user IDs: ${workspaceId}/${userId}. Default workspace not allowed.`);
    }
    
    const instanceKey = `${workspaceId}-${userId}`;
    
    if (!SpeedrunDataService.instances.has(instanceKey)) {
      SpeedrunDataService.instances.set(instanceKey, new SpeedrunDataService(workspaceId, userId));
    }
    
    return SpeedrunDataService.instances.get(instanceKey)!;
  }

  /**
   * Pre-load data synchronously for instant experience
   */
  private preloadData() {
    // Set a flag to indicate we're preloading
    this['isInitialized'] = true;
    
    // Start async loading in background
    this.initializeDefaultData().catch(error => {
      console.error('❌ SpeedrunDataService: Preload failed:', error);
      this['isInitialized'] = false;
    });
  }

  private async initializeDefaultData() {
    if (this.isInitialized) return;
    
    // Prevent multiple simultaneous initializations
    if (SpeedrunDataService.isInitializing) {
      console.log('🔄 SpeedrunDataService: Initialization already in progress, waiting...');
      // Wait for initialization to complete
      while (SpeedrunDataService.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    SpeedrunDataService['isInitializing'] = true;
    console.log('🔄 SpeedrunDataService: Starting initialization...');
    
    try {
      await this.loadProspectsFromAPI();
      this['isInitialized'] = true;
      console.log('✅ SpeedrunDataService: Initialization complete');
    } finally {
      SpeedrunDataService['isInitializing'] = false;
    }
  }

  /**
   * Load prospects from demo scenario API OR real production data
   */
  private async loadProspectsFromAPI(verticalFilter?: string) {
    try {
      console.log(`🚀 SpeedrunDataService [${this.workspaceId}-${this.userId}]: Loading prospects${verticalFilter ? ` for ${verticalFilter}` : ' for all verticals'}...`);
      
      // Use instance workspace/user context for proper data isolation
      const context = {
        workspaceId: this.workspaceId,
        userId: this.userId,
        userEmail: `user-${this.userId}`, // Placeholder email
        isDemo: this['workspaceId'] === '01K1VBYX2YERMXBFJ60RC6J194'
      };
      
      console.log(`🎯 SpeedrunDataService [${this.workspaceId}-${this.userId}]: User context:`, {
        workspaceId: context.workspaceId,
        userId: context.userId,
        isDemo: context.isDemo
      });
      
      if (context.isDemo) {
        // Demo users: Load demo scenario data
        await this.loadDemoScenarioData(context);
      } else {
        // Production users: Load real opportunities data
        await this.loadProductionData(context, verticalFilter);
      }
      
    } catch (error) {
      console.error(`❌ SpeedrunDataService [${this.workspaceId}-${this.userId}]: Error loading prospects:`, error);
      
      // No fallback data - return empty array
      console.log(`🎭 SpeedrunDataService [${this.workspaceId}-${this.userId}]: Error loading prospects, returning empty array`);
      this['prospects'] = [];
      this.notifyListeners();
    }
  }

  /**
   * Load dual ranking lists (Optimal + Vertical Ranks)
   */
  async loadDualRankingLists(): Promise<{
    optimalRank: SpeedrunProspect[];
    verticalRanks: {
      'C Stores': SpeedrunProspect[];
      'Grocery Stores': SpeedrunProspect[];
      'Corporate Retailers': SpeedrunProspect[];
      'Other': SpeedrunProspect[];
    };
    summary: {
      totalCompanies: number;
      totalProspects: number;
      verticalDistribution: Record<string, { companies: number; prospects: number }>;
    };
  }> {
    try {
      console.log('📊 SpeedrunDataService: Loading dual ranking lists...');

      // Get workspace context to avoid circular imports
      const context = await WorkspaceDataRouter.getWorkspaceContext();
      
      if (context.isDemo) {
        // Demo users: Return demo data structure
        const demoProspects = this.prospects;
        const demoCompanies = new Set(demoProspects.map(p => p.company));
        
        return {
          optimalRank: demoProspects,
          verticalRanks: {
            'C Stores': demoProspects.filter(p => p.company.includes('Store')),
            'Grocery Stores': demoProspects.filter(p => p.company.includes('Grocery')),
            'Corporate Retailers': demoProspects.filter(p => p.company.includes('Retail')),
            'Other': demoProspects.filter(p => !p.company.includes('Store') && !p.company.includes('Grocery') && !p.company.includes('Retail'))
          },
          summary: {
            totalCompanies: demoCompanies.size,
            totalProspects: demoProspects.length,
            verticalDistribution: {
              'C Stores': { companies: 5, prospects: 15 },
              'Grocery Stores': { companies: 5, prospects: 15 },
              'Corporate Retailers': { companies: 5, prospects: 15 },
              'Other': { companies: 5, prospects: 15 }
            }
          }
        };
      } else {
        // Production users: Load real dual ranking data
        const response = await fetch(`/api/speedrun/dual-ranking?workspaceId=${context.workspaceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data['success'] && data.data) {
          const dualRanking = data.data;
          
          return {
            optimalRank: this.transformPrioritizationScoresToProspects(dualRanking.optimalRank),
            verticalRanks: {
              'C Stores': this.transformPrioritizationScoresToProspects(dualRanking['verticalRanks']['C Stores']),
              'Grocery Stores': this.transformPrioritizationScoresToProspects(dualRanking['verticalRanks']['Grocery Stores']),
              'Corporate Retailers': this.transformPrioritizationScoresToProspects(dualRanking['verticalRanks']['Corporate Retailers']),
              'Other': this.transformPrioritizationScoresToProspects(dualRanking['verticalRanks']['Other'])
            },
            summary: dualRanking.summary
          };
        } else {
          console.warn('⚠️ SpeedrunDataService: No dual ranking data in API response');
          return {
            optimalRank: [],
            verticalRanks: {
              'C Stores': [],
              'Grocery Stores': [],
              'Corporate Retailers': [],
              'Other': []
            },
            summary: {
              totalCompanies: 0,
              totalProspects: 0,
              verticalDistribution: {}
            }
          };
        }
      }
    } catch (error) {
      console.error('❌ SpeedrunDataService: Error loading dual ranking lists:', error);
      return {
        optimalRank: [],
        verticalRanks: {
          'C Stores': [],
          'Grocery Stores': [],
          'Corporate Retailers': [],
          'Other': []
        },
        summary: {
          totalCompanies: 0,
          totalProspects: 0,
          verticalDistribution: {}
        }
      };
    }
  }

  /**
   * Get all Speedrun prospects
   */
  getProspects(): SpeedrunProspect[] {
    return [...this.prospects];
  }

  /**
   * Refresh prospects data for current scenario
   */
  async refreshProspects(): Promise<void> {
    // Prevent multiple simultaneous refreshes
    if (this.isRefreshing) {
      console.log('🔄 SpeedrunDataService: Refresh already in progress, skipping...');
      return;
    }
    
    this['isRefreshing'] = true;
    console.log('🔄 SpeedrunDataService: Refreshing prospects for current scenario...');
    
    try {
      await this.loadProspectsFromAPI();
    } finally {
      this['isRefreshing'] = false;
    }
  }

  /**
   * Update all Speedrun prospects (used by Monaco Signal)
   */
  updateProspects(newProspects: SpeedrunProspect[]): void {
    this['prospects'] = [...newProspects];
    this.notifyListeners();
    console.log("📊 SpeedrunDataService: Updated with", newProspects.length, "prospects");
  }

  /**
   * Add DataCorp prospects to the top (Monaco Signal functionality)
   */
  addDataCorpProspects(dataCorpProspects: SpeedrunProspect[]): void {
    console.log("🔥 SpeedrunDataService: addDataCorpProspects called with", dataCorpProspects.length, "prospects");
    console.log("🔥 SpeedrunDataService: Current prospects count before update:", this.prospects.length);
    console.log("🔥 SpeedrunDataService: Current listeners count:", this.listeners.length);
    
    // Re-rank existing prospects
    const rerankedExisting = this.prospects.map((prospect, index) => {
      // Push ADP down to 2A, 2B, 2C, etc.
      if (prospect['company'] === "ADP") {
        const newRank = `2${String.fromCharCode(65 + (index % 7))}`;
        return {
          ...prospect,
          id: prospect.id.replace(/^1/, '2'),
          rank: newRank
        };
      }
      // Push Nike down to 3A, 3B, 3C
      if (prospect['company'] === "Nike") {
        const nikeIndex = this.prospects.filter(p => p['company'] === "Nike").indexOf(prospect);
        const newRank = `3${String.fromCharCode(65 + nikeIndex)}`;
        return {
          ...prospect,
          id: prospect.id.replace(/^2/, '3'),
          rank: newRank
        };
      }
      // Push others down
      return prospect;
    });

    // Add DataCorp at the top
    this['prospects'] = [...dataCorpProspects, ...rerankedExisting];
    console.log("🔥 SpeedrunDataService: About to notify listeners. New prospects count:", this.prospects.length);
    console.log("🔥 SpeedrunDataService: First 3 prospects after update:", this.prospects.slice(0, 3).map(p => `${p.id} ${p.name} (${p.company})`));
    
    this.notifyListeners();
    console.log("🎯 SpeedrunDataService: Added DataCorp prospects at top positions");
  }

  /**
   * Apply speedrun engine settings and re-rank prospects
   */
  applySpeedrunEngineSettings(settings: any): void {
    console.log('🎯 SpeedrunDataService: Applying new engine settings', settings);
    
    // Create a copy of prospects to re-rank
    let rerankedProspects = [...this.prospects];
    
    // Calculate comprehensive score for each prospect using all settings
    rerankedProspects = rerankedProspects.map(prospect => {
      const score = this.calculateComprehensiveScore(prospect, settings);
      return {
        ...prospect,
        calculatedScore: score
      };
    });
    
    // Sort by calculated score (highest first)
    rerankedProspects.sort((a, b) => b.calculatedScore - a.calculatedScore);
    
    // Re-assign ranks based on new order with more dramatic changes
    rerankedProspects = rerankedProspects.map((prospect, index) => {
      // Create more varied ranking patterns based on methodology
      let newRank: string;
      
      if (settings['methodology'] === 'challenger') {
        // Challenger: More aggressive ranking (1A, 1B, 2A, 3A, 2B, 4A...)
        const companyGroup = Math.floor(index / 2) + 1;
        const isAlpha = index % 2 === 0 ? 'A' : 'B';
        newRank = `${companyGroup}${isAlpha}`;
      } else if (settings['methodology'] === 'relationship') {
        // Relationship: Focus on fewer companies deeply (1A, 1B, 1C, 2A, 2B, 2C...)
        const companyIndex = Math.floor(index / 3);
        const contactIndex = index % 3;
        newRank = `${companyIndex + 1}${String.fromCharCode(65 + contactIndex)}`;
      } else if (settings['methodology'] === 'hunter') {
        // Hunter: Spread across many companies (1A, 2A, 3A, 4A, 1B, 2B...)
        const contactRound = Math.floor(index / Math.ceil(rerankedProspects.length / 3));
        const companyInRound = (index % Math.ceil(rerankedProspects.length / 3)) + 1;
        newRank = `${companyInRound}${String.fromCharCode(65 + contactRound)}`;
      } else {
        // Default ranking
        const companyIndex = Math.floor(index / 3);
        const contactIndex = index % 3;
        newRank = `${companyIndex + 1}${String.fromCharCode(65 + contactIndex)}`;
      }
      
      return {
        ...prospect,
        rank: newRank,
        score: Math.round(prospect.calculatedScore) // Update visible score
      };
    });
    
    this['prospects'] = rerankedProspects;
    this.notifyListeners();
    
    console.log('✅ SpeedrunDataService: Re-ranked prospects with comprehensive scoring');
    console.log('🔥 New top 5:', this.prospects.slice(0, 5).map(p => 
      `${p.rank} ${p.name} (${p.company}) - Score: ${p.score}`
    ));
  }

  /**
   * Calculate comprehensive score based on all optimization settings
   */
  private calculateComprehensiveScore(prospect: SpeedrunProspect, settings: any): number {
    let score = 0;
    
    // Deal Value Score (0-100 based on deal size)
    const dealValue = this.extractDealValue(prospect.dealSize);
    const dealScore = Math.min((dealValue / 100000) * 100, 100); // $100K = 100 points
    score += dealScore * (settings.dealValueFocus || 50) / 100;
    
    // Engagement Score (based on buying signals)
    const engagementScore = this.calculateEngagementScore(prospect);
    score += engagementScore * (settings.engagementLevel || 50) / 100;
    
    // Urgency Score (based on status and timing)
    const urgencyScore = this.calculateUrgencyScore(prospect);
    score += urgencyScore * (settings.urgencyWeight || 50) / 100;
    
    // Company Size Score
    const companySizeScore = this.calculateCompanySizeScore(prospect);
    score += companySizeScore * (settings.companySize || 50) / 100;
    
    // Relationship Score
    const relationshipScore = this.calculateRelationshipScore(prospect);
    score += relationshipScore * (settings.relationshipDepth || 50) / 100;
    
    // Territory Focus (geographic preference)
    const territoryScore = this.calculateTerritoryScore(prospect, settings);
    score += territoryScore * (settings.territoryFocus || 50) / 100;
    
    // Competition Mode (prioritize competitive deals)
    if (settings.competitionMode > 50 && prospect.buyingSignal?.includes('competition')) {
      score *= 1.2; // 20% boost for competitive deals
    }
    
    // Champion Influence (prioritize decision makers)
    if (settings.championInfluence > 50 && prospect.title?.toLowerCase().includes('director|vp|ceo|cto|cmo')) {
      score *= 1.15; // 15% boost for executives
    }
    
    return Math.min(score, 100);
  }

  /**
   * Calculate engagement score based on buying signals and interaction history
   */
  private calculateEngagementScore(prospect: SpeedrunProspect): number {
    const signalScores: Record<string, number> = {
      'Inbound interest': 90,
      'Recent engagement': 75,
      'Website activity': 60,
      'Email opened': 45,
      'Cold prospect': 20
    };
    
    return signalScores[prospect.buyingSignal] || 30;
  }

  /**
   * Calculate urgency score based on status and timing
   */
  private calculateUrgencyScore(prospect: SpeedrunProspect): number {
    const statusScores: Record<string, number> = {
      'qualified': 85,
      'contacted': 60,
      'prospect': 40
    };
    
    let urgencyScore = statusScores[prospect.status] || 30;
    
    // Add time-based urgency (simulate days since last contact)
    const timeBoost = Math.random() * 20; // Simulate varying urgency
    urgencyScore += timeBoost;
    
    return Math.min(urgencyScore, 100);
  }

  /**
   * Calculate company size score
   */
  private calculateCompanySizeScore(prospect: SpeedrunProspect): number {
    const company = prospect.company?.toLowerCase() || '';
    
    // Larger companies generally get higher scores
    if (company.includes('corp') || company.includes('inc') || company.includes('ltd')) {
      return 70 + Math.random() * 30;
    }
    
    return 40 + Math.random() * 40;
  }

  /**
   * Calculate relationship score
   */
  private calculateRelationshipScore(prospect: SpeedrunProspect): number {
    const title = prospect.title?.toLowerCase() || '';
    
    // Decision makers get higher relationship scores
    if (title.includes('director') || title.includes('vp') || title.includes('manager')) {
      return 60 + Math.random() * 40;
    }
    
    return 30 + Math.random() * 50;
  }

  /**
   * Calculate territory score (simulate geographic preferences)
   */
  private calculateTerritoryScore(prospect: SpeedrunProspect, settings: any): number {
    // Simulate territory preferences - in real app this would use actual location data
    return 50 + Math.random() * 50;
  }
  
  /**
   * Extract numeric value from deal size string
   */
  private extractDealValue(dealSize: string): number {
    const match = dealSize.match(/\$(\d+)K/);
    return match ? parseInt(match[1]) * 1000 : 50000; // Default to 50K
  }

  /**
   * Subscribe to data changes
   */
  subscribe(listener: (prospects: SpeedrunProspect[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of data changes
   */
  private notifyListeners(): void {
    console.log("🔥 SpeedrunDataService: notifyListeners called with", this.listeners.length, "listeners");
    this.listeners.forEach((listener, index) => {
      try {
        console.log(`🔥 SpeedrunDataService: Notifying listener ${index + 1} with ${this.prospects.length} prospects`);
        listener([...this.prospects]);
      } catch (error) {
        console.error("Error notifying SpeedrunDataService listener:", error);
      }
    });
    console.log("🔥 SpeedrunDataService: All listeners notified");
  }

  /**
   * Get prospect by ID
   */
  getProspectById(id: string): SpeedrunProspect | undefined {
    return this.prospects.find(prospect => prospect['id'] === id);
  }

  /**
   * Update a specific prospect
   */
  updateProspect(id: string, updates: Partial<SpeedrunProspect>): void {
    const index = this.prospects.findIndex(prospect => prospect['id'] === id);
    if (index !== -1) {
      this['prospects'][index] = { ...this['prospects'][index], ...updates } as SpeedrunProspect;
      this.notifyListeners();
    }
  }
  /**
   * Load demo scenario data for demo users
   */
  private async loadDemoScenarioData(context: any) {
    const currentScenario = demoScenarioService.getCurrentScenario();
    console.log(`🎯 SpeedrunDataService: Loading demo scenario: ${currentScenario}`);
    
    // If no scenario is set, try to set a default one
    if (!currentScenario) {
      console.log('🎯 SpeedrunDataService: No scenario set, using default "adrata"');
      demoScenarioService.setCurrentScenario('adrata');
    }
    
    const apiUrl = `/api/demo-scenarios/prospects?scenario=${currentScenario || 'adrata'}&limit=20&t=${Date.now()}`;
    console.log(`🌐 SpeedrunDataService: Calling demo API: ${apiUrl}`);
    
    const response = await authFetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Demo API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📊 SpeedrunDataService: Demo API response:`, data);
    
    if (data['success'] && data.prospects) {
      // Apply name correction to demo prospects
      this['prospects'] = correctPeopleNamesFromEmails(data.prospects);
      console.log(`✅ SpeedrunDataService: Loaded ${data.prospects.length} demo prospects for scenario: ${currentScenario || 'adrata'} (with name correction)`);
      this.notifyListeners();
    } else {
      console.warn('⚠️ SpeedrunDataService: Demo API returned unsuccessful response, using fallback');
      throw new Error('Demo API returned unsuccessful response');
    }
  }

  /**
   * Load real production opportunities data for production users
   */
  private async loadProductionData(context: any, verticalFilter?: string) {
    console.log(`🎯 SpeedrunDataService: Loading intelligent daily Speedrun list for workspace: ${context.workspaceId}${verticalFilter ? `, vertical: ${verticalFilter}` : ''}`);
    
    try {
      // Get today's intelligent Speedrun list from API (workspace context handled server-side)
      const url = verticalFilter && verticalFilter !== 'All Verticals' 
        ? `/api/speedrun/dual-ranking?workspaceId=${context.workspaceId}&vertical=${encodeURIComponent(verticalFilter)}`
        : `/api/speedrun/prospects?limit=50`;
      
      const data = await authFetch(url);
      
      if (data['success'] && data.data) {
        const prospects = Array.isArray(data.data) ? data.data : data.data.optimalRank || data.data;
        // Apply name correction to production prospects
        this['prospects'] = correctPeopleNamesFromEmails(prospects);
        console.log(`✅ SpeedrunDataService: Loaded ${this.prospects.length} intelligent prospects (${data.rankType || 'Optimal Rank'}) with name correction`);
        this.notifyListeners();
      } else if (data['success'] && data['prospects'] && data.prospects.length > 0) {
        // Apply name correction to production prospects
        this['prospects'] = correctPeopleNamesFromEmails(data.prospects);
        console.log(`✅ SpeedrunDataService: Loaded ${this.prospects.length} intelligent prospects (${data.realtimeTriggers} with real-time triggers) with name correction`);
        this.notifyListeners();
      } else {
        console.log('📭 SpeedrunDataService: No intelligent prospects found - showing empty state');
        this['prospects'] = [];
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ SpeedrunDataService: Error loading intelligent prospects:', error);
      
      // Fallback to legacy API if intelligent system fails
      console.log('🔄 SpeedrunDataService: Falling back to legacy opportunity API...');
      await this.loadLegacyProductionData(context);
    }
  }

  /**
   * Legacy fallback method for loading production data
   */
  private async loadLegacyProductionData(context: any) {
    const apiUrl = `/api/data/opportunities?workspaceId=${context.workspaceId}&userId=${context.userId}&includeClosed=true&t=${Date.now()}`;
    console.log(`🌐 SpeedrunDataService: Calling legacy API: ${apiUrl}`);
    
    const data = await authFetch(apiUrl);
    console.log(`📊 SpeedrunDataService: Legacy API response:`, data);
    
    if (data['success'] && data['opportunities'] && data.opportunities.length > 0) {
      this['prospects'] = this.transformOpportunitiesToProspects(data.opportunities);
      console.log(`✅ SpeedrunDataService: Loaded ${this.prospects.length} legacy opportunities`);
      this.notifyListeners();
    } else {
      this['prospects'] = [];
      this.notifyListeners();
    }
  }

  /**
   * Transform prioritization scores to SpeedrunProspect format
   */
  private transformPrioritizationScoresToProspects(prioritizedProspects: SpeedrunPrioritizationScore[]): SpeedrunProspect[] {
    return prioritizedProspects.map(prospect => ({
      id: prospect.id,
      rank: prospect.rank,
      name: prospect.name,
      title: prospect.title,
      company: prospect.company,
      priority: prospect.priority,
      buyingSignal: prospect.buyingSignal,
      dealSize: prospect.dealSize,
      closeProb: prospect.closeProb,
      nextAction: prospect.nextAction,
      pain: prospect.pain,
      valueDriver: prospect.valueDriver,
      timeline: prospect.timeline,
      email: prospect.email,
      phone: prospect.phone,
      linkedin: prospect.linkedin,
      location: prospect.location,
      department: prospect.department,
      seniority: prospect.seniority,
      buyerRole: prospect.buyerRole,
      influence: prospect.influence,
      score: prospect.score,
      status: prospect.status,
      budget: prospect.budget
    }));
  }

  /**
   * Transform opportunity records into speedrun prospect format
   */
  private transformOpportunitiesToProspects(opportunities: any[]): SpeedrunProspect[] {
    // Group opportunities by company for proper ranking
    const companyGroups = new Map<string, any[]>();
    
    opportunities.forEach(opp => {
      const company = opp.accountName || opp.company || 'Unknown Company';
      if (!companyGroups.has(company)) {
        companyGroups.set(company, []);
      }
      companyGroups.get(company)!.push(opp);
    });
    
    // Sort companies by priority (deal value, stage, etc.)
    const sortedCompanies = Array.from(companyGroups.entries()).sort((a, b) => {
      const aValue = Math.max(...a[1].map(opp => parseFloat(opp.value || '0')));
      const bValue = Math.max(...b[1].map(opp => parseFloat(opp.value || '0')));
      return bValue - aValue; // Higher value companies first
    });
    
    // Generate company-based ranks: 1A, 1B, 1C, 2A, 2B, etc.
    const prospects: SpeedrunProspect[] = [];
    
    sortedCompanies.forEach(([company, companyOpps], companyIndex) => {
      // Determine if this company has any opportunities (not just leads)
      const hasOpportunity = companyOpps.some(opp => {
        const stage = opp.stage?.toLowerCase() || '';
        // Consider it an opportunity if it's past the initial qualification stage
        return stage.includes('qualified') || 
               stage.includes('proposal') || 
               stage.includes('negotiation') || 
               stage.includes('closed') ||
               parseFloat(opp.value || '0') > 0; // Or if it has a deal value
      });
      
      // Sort contacts within company by seniority/priority
      const sortedContacts = companyOpps.sort((a, b) => {
        const aSeniority = this.getSeniorityScore(a.contactTitle || a.title);
        const bSeniority = this.getSeniorityScore(b.contactTitle || b.title);
        return bSeniority - aSeniority; // Higher seniority first
      });
      
      sortedContacts.forEach((opp, contactIndex) => {
        const companyRank = companyIndex + 1;
        const contactRank = String.fromCharCode(65 + contactIndex); // A, B, C, etc. within each company
        
        const companyName = opp.accountName || opp.company || 'Unknown Company';
        prospects.push({
          id: opp.id || `opp-${companyIndex}-${contactIndex}`,
          rank: `${companyRank}${contactRank}`, // 1A, 1B, 2A, 2B, 3A, 3B, etc.
          name: opp.contactName || opp.primaryContact || 'Unknown Contact',
          title: opp.contactTitle || opp.title || '',
          company: companyName,
          priority: this.determinePriority(opp.value, opp.stage),
          buyingSignal: this.determineBuyingSignal(opp.stage),
          dealSize: opp.value ? `$${(parseFloat(opp.value) / 1000).toFixed(0)}K` : 'TBD',
          closeProb: opp.probability ? `${opp.probability}%` : 'TBD',
          nextAction: this.determineNextAction(opp.stage),
          pain: opp.description || opp.notes || 'Business challenge identified - needs assessment',
          valueDriver: `Solution addresses key business needs for ${companyName}`,
          timeline: this.determineTimeline(opp.closeDate),
          email: opp.contactEmail || opp.email || '',
          phone: opp.contactPhone || opp.phone || '',
          linkedin: '',
          location: opp.contactLocation || opp.location || '',
          department: opp.contactDepartment || 'Business',
          seniority: this.determineSeniority(opp.contactTitle || opp.title),
          buyerRole: this.determineBuyerRole(opp.contactTitle || opp.title),
          influence: this.determineInfluence(opp.contactTitle || opp.title),
          score: opp.score || '75',
          status: this.determineStatus(opp.stage),
          budget: opp.value ? `$${(parseFloat(opp.value) / 1000).toFixed(0)}K` : 'TBD',
          vertical: this.determineVertical(companyName),
          hasOpportunity: hasOpportunity
        });
      });
    });
    
    return prospects;
  }

  private determinePriority(value: string | number | null, stage: string | null): string {
    const numValue = parseFloat(String(value || 0));
    if (numValue > 100000) return 'High';
    if (numValue > 50000) return 'Medium';
    if (stage?.toLowerCase().includes('qualified')) return 'Medium';
    return 'Low';
  }

  private determineBuyingSignal(stage: string | null): string {
    if (!stage) return 'Initial Interest';
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('qualified')) return 'Qualified Opportunity';
    if (lowerStage.includes('proposal')) return 'Proposal Submitted';
    if (lowerStage.includes('negotiation')) return 'In Negotiation';
    if (lowerStage.includes('closed')) return 'Decision Made';
    return 'Initial Interest';
  }

  private determineNextAction(stage: string | null): string {
    if (!stage) return 'Discovery Call';
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('qualified')) return 'Technical Demo';
    if (lowerStage.includes('proposal')) return 'Follow up on Proposal';
    if (lowerStage.includes('negotiation')) return 'Contract Review';
    return 'Discovery Call';
  }

  private determineTimeline(closeDate: string | null): string {
    if (!closeDate) return 'Q2 2025';
    const close = new Date(closeDate);
    const now = new Date();
    const diffMonths = (close.getFullYear() - now.getFullYear()) * 12 + (close.getMonth() - now.getMonth());
    
    if (diffMonths <= 1) return 'URGENT';
    if (diffMonths <= 3) return 'Q1 2025';
    if (diffMonths <= 6) return 'Q2 2025';
    return 'H2 2025';
  }

  private determineSeniority(title: string | null): string {
    if (!title) return 'Manager';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ceo') || lowerTitle.includes('president')) return 'C-Level';
    if (lowerTitle.includes('cto') || lowerTitle.includes('cfo') || lowerTitle.includes('cmo')) return 'C-Level';
    if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) return 'VP';
    if (lowerTitle.includes('director')) return 'Director';
    if (lowerTitle.includes('manager')) return 'Manager';
    return 'Individual Contributor';
  }

  private determineBuyerRole(title: string | null): string {
    if (!title) return 'Influencer';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ceo') || lowerTitle.includes('president') || lowerTitle.includes('cto')) return 'Decision Maker';
    if (lowerTitle.includes('vp') || lowerTitle.includes('director')) return 'Influencer';
    return 'End User';
  }

  private determineInfluence(title: string | null): string {
    if (!title) return 'Medium';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ceo') || lowerTitle.includes('president') || lowerTitle.includes('cto')) return 'High';
    if (lowerTitle.includes('vp') || lowerTitle.includes('director')) return 'High';
    if (lowerTitle.includes('manager')) return 'Medium';
    return 'Low';
  }

  private determineStatus(stage: string | null): string {
    if (!stage) return 'New Lead';
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('qualified')) return 'Qualified';
    if (lowerStage.includes('proposal')) return 'Proposal';
    if (lowerStage.includes('negotiation')) return 'Negotiation';
    if (lowerStage.includes('closed') && lowerStage.includes('won')) return 'Won';
    return 'Active';
  }

  private getSeniorityScore(title: string | null): number {
    if (!title) return 1;
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('ceo') || lowerTitle.includes('president')) return 10;
    if (lowerTitle.includes('cto') || lowerTitle.includes('cfo') || lowerTitle.includes('cmo')) return 9;
    if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) return 8;
    if (lowerTitle.includes('director')) return 7;
    if (lowerTitle.includes('head')) return 6;
    if (lowerTitle.includes('manager')) return 5;
    if (lowerTitle.includes('lead')) return 4;
    if (lowerTitle.includes('senior')) return 3;
    if (lowerTitle.includes('associate')) return 2;
    return 1;
  }

  private determineVertical(companyName: string): string {
    if (!companyName) return 'Other';
    
    const lowerCompany = companyName.toLowerCase();
    
    // C Stores (Convenience Stores)
    if (lowerCompany.includes('oil') || lowerCompany.includes('gas') || lowerCompany.includes('fuel') || 
        lowerCompany.includes('shell') || lowerCompany.includes('exxon') || lowerCompany.includes('chevron') ||
        lowerCompany.includes('bp') || lowerCompany.includes('marathon') || lowerCompany.includes('speedway') ||
        lowerCompany.includes('7-eleven') || lowerCompany.includes('circle k') || lowerCompany.includes('quik trip') ||
        lowerCompany.includes('wawa') || lowerCompany.includes('sheet') || lowerCompany.includes('rutter') ||
        lowerCompany.includes('good 2 go') || lowerCompany.includes('toot') || lowerCompany.includes('johnson oil') ||
        lowerCompany.includes('giant oil') || lowerCompany.includes('beck supplier') || lowerCompany.includes('friendship') ||
        lowerCompany.includes('h&s energy') || lowerCompany.includes('united dairy') || lowerCompany.includes('save a lot') ||
        lowerCompany.includes('eg america') || lowerCompany.includes('northeast shared') || lowerCompany.includes('price chopper') ||
        lowerCompany.includes('englefield oil') || lowerCompany.includes('united pacific') || lowerCompany.includes('meijer') ||
        lowerCompany.includes('topco') || lowerCompany.includes('sam') || lowerCompany.includes('beck supplier')) {
      return 'C Stores';
    }
    
    // Grocery Stores
    if (lowerCompany.includes('grocery') || lowerCompany.includes('supermarket') || lowerCompany.includes('food') ||
        lowerCompany.includes('kroger') || lowerCompany.includes('safeway') || lowerCompany.includes('albertsons') ||
        lowerCompany.includes('publix') || lowerCompany.includes('wegmans') || lowerCompany.includes('trader joe') ||
        lowerCompany.includes('whole food') || lowerCompany.includes('aldi') || lowerCompany.includes('lidl') ||
        lowerCompany.includes('winco') || lowerCompany.includes('food city') || lowerCompany.includes('kvat') ||
        lowerCompany.includes('family express') || lowerCompany.includes('giant eagle') || lowerCompany.includes('shoprite')) {
      return 'Grocery Stores';
    }
    
    // Corporate Retailers
    if (lowerCompany.includes('walmart') || lowerCompany.includes('target') || lowerCompany.includes('costco') ||
        lowerCompany.includes('home depot') || lowerCompany.includes('lowes') || lowerCompany.includes('best buy') ||
        lowerCompany.includes('macy') || lowerCompany.includes('kohl') || lowerCompany.includes('jcpenney') ||
        lowerCompany.includes('dollar general') || lowerCompany.includes('dollar tree') || lowerCompany.includes('family dollar') ||
        lowerCompany.includes('cvs') || lowerCompany.includes('walgreens') || lowerCompany.includes('rite aid') ||
        lowerCompany.includes('petco') || lowerCompany.includes('petsmart') || lowerCompany.includes('autozone') ||
        lowerCompany.includes('oreilly') || lowerCompany.includes('advance auto') || lowerCompany.includes('napa')) {
      return 'Corporate Retailers';
    }
    
    return 'Other';
  }
}

// Export factory function for workspace-aware instances
export const getSpeedrunDataService = (workspaceId: string, userId: string) => 
  SpeedrunDataService.getInstance(workspaceId, userId);

// REMOVED: Default instance export to prevent default workspace pollution
// Use SpeedrunDataService.getInstance(workspaceId, userId) directly instead

/**
 * React hook for using Speedrun data - WORKSPACE-AWARE
 */
// Global flag to prevent multiple initializations
let isHookInitialized = false;
let activeHookCount = 0;

export function useSpeedrunData() {
  // Start with empty array - no fallback data
  const [prospects, setProspects] = React.useState<SpeedrunProspect[]>([]);
  
  // Import auth hook properly
  const { useUnifiedAuth } = React.useMemo(() => {
    try {
      return require("@/platform/auth");
    } catch {
      return { useUnifiedAuth: () => ({ user: null }) };
    }
  }, []);
  
  const { user } = useUnifiedAuth();

  React.useEffect(() => {
    activeHookCount++;
    
    // Prevent multiple initializations from different components
    if (isHookInitialized) {
      console.log("🔥 useSpeedrunData: Hook already initialized globally, skipping");
      return () => {
        activeHookCount--;
        if (activeHookCount === 0) {
          isHookInitialized = false;
          console.log("🔥 useSpeedrunData: All hooks unmounted, resetting initialization flag");
        }
      };
    }
    
    isHookInitialized = true;
    console.log("🔥 useSpeedrunData: Hook initializing");
    console.log("🔥 useSpeedrunData: User email:", user?.email);
    console.log("🔥 useSpeedrunData: User workspace:", user?.workspaces?.[0]?.id);
    
    // 🚀 FIXED: Allow Dan to access Speedrun data
    // Previously blocked Dan's workspace - now Dan gets full Speedrun access
    console.log("🔥 useSpeedrunData: Loading prospects for user:", user?.email, "workspace:", user?.workspaces?.[0]?.id);
    
    // Get workspace-aware service instance
    const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id || 'default';
    const userId = user?.id || 'default';
    const speedrunService = getSpeedrunDataService(workspaceId, userId);
    
    // Get existing data immediately first
    const existingProspects = speedrunService.getProspects();
    console.log(`🔥 useSpeedrunData [${workspaceId}-${userId}]: Existing prospects count:`, existingProspects.length);
    if (existingProspects.length > 0) {
      setProspects(existingProspects);
    }
    
    // Only refresh if no data exists or if this is the first initialization
    if (existingProspects['length'] === 0) {
      console.log(`🔥 useSpeedrunData [${workspaceId}-${userId}]: No existing data, refreshing prospects...`);
      speedrunService.refreshProspects().then(() => {
        const initialProspects = speedrunService.getProspects();
        console.log(`🔥 useSpeedrunData [${workspaceId}-${userId}]: Initial prospects count after refresh:`, initialProspects.length);
        setProspects(initialProspects);
      }).catch((error) => {
        console.error("❌ useSpeedrunData: Error refreshing prospects:", error);
        // Still try to get any existing prospects
        const fallbackProspects = speedrunService.getProspects();
        if (fallbackProspects.length > 0) {
          setProspects(fallbackProspects);
        }
      });
    } else {
      console.log("🔥 useSpeedrunData: Using existing data, skipping refresh");
    }

    // Subscribe to changes - now available for all workspaces including Dan's
    const unsubscribe = speedrunService.subscribe((newProspects) => {
      console.log(`🔥 useSpeedrunData [${workspaceId}-${userId}]: Received update with`, newProspects.length, "prospects");
      console.log(`🔥 useSpeedrunData [${workspaceId}-${userId}]: First 3 prospects:`, newProspects.slice(0, 3).map(p => `${p.id} ${p.name} (${p.company})`));
      setProspects(newProspects);
    });

    // Listen for speedrun data refresh events from signal acceptance
    const handleSpeedrunDataRefresh = (event: CustomEvent) => {
      const { type, contact } = event.detail;
      if (type === 'signal-accepted') {
        console.log(`🎯 useSpeedrunData [${workspaceId}-${userId}]: Signal accepted for ${contact?.name || 'unknown contact'} - refreshing prospects...`);
        setTimeout(() => {
          speedrunService.refreshProspects().then(() => {
            const refreshedProspects = speedrunService.getProspects();
            console.log(`🔄 useSpeedrunData [${workspaceId}-${userId}]: Refreshed prospects count:`, refreshedProspects.length);
            setProspects(refreshedProspects);
          }).catch((error) => {
            console.error(`❌ useSpeedrunData [${workspaceId}-${userId}]: Error refreshing prospects after signal:`, error);
          });
        }, 750); // Slightly longer delay to ensure database update is complete
      }
    };

    window.addEventListener('speedrun-data-refresh', handleSpeedrunDataRefresh as EventListener);

    return () => {
      activeHookCount--;
      unsubscribe();
      window.removeEventListener('speedrun-data-refresh', handleSpeedrunDataRefresh as EventListener);
      if (activeHookCount === 0) {
        isHookInitialized = false;
        console.log(`🔥 useSpeedrunData [${workspaceId}-${userId}]: All hooks unmounted, resetting initialization flag`);
      }
    };
  }, [user?.email, user?.workspaces?.[0]?.id]); // Use stable workspace ID instead of entire workspaces array

  return {
    prospects,
    addDataCorpProspects: (dataCorpProspects: SpeedrunProspect[]) => {
      const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id || 'default';
      const userId = user?.id || 'default';
      const service = getSpeedrunDataService(workspaceId, userId);
      return service.addDataCorpProspects(dataCorpProspects);
    },
    updateProspects: (newProspects: SpeedrunProspect[]) => {
      const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id || 'default';
      const userId = user?.id || 'default';
      const service = getSpeedrunDataService(workspaceId, userId);
      return service.updateProspects(newProspects);
    },
    getProspectById: (id: string) => {
      const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id || 'default';
      const userId = user?.id || 'default';
      const service = getSpeedrunDataService(workspaceId, userId);
      return service.getProspectById(id);
    },
    updateProspect: (id: string, updates: Partial<SpeedrunProspect>) => {
      const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id || 'default';
      const userId = user?.id || 'default';
      const service = getSpeedrunDataService(workspaceId, userId);
      return service.updateProspect(id, updates);
    }
  };
} 