/* eslint-disable import/no-unresolved */
/**
 * 🚀 MODULAR BUYER GROUP INTELLIGENCE PIPELINE
 * 
 * Main orchestrator that coordinates all modules for buyer group generation
 */
import * as path from 'path';
import * as fs from 'fs';

import { 
  PipelineConfig, 
  IntelligenceReport, 
  CoreSignalProfile, 
  PersonProfile, 
  BuyerGroup,
  SellerProfile 
} from './types';

import { SELLER_PROFILES, getSellerProfile } from './seller-profiles';
import { CoreSignalClient } from './coresignal-client';
import { PainIntelligenceEngine } from './pain-intelligence';
import { ProfileAnalyzer } from './profile-analyzer';
import { IndustryAdapter } from './industry-adapter';
import { CompanyIntelligenceEngine } from './company-intelligence';
import { CandidateRanker, CandidateScore } from './candidate-ranker';
// eslint-disable-next-line import/no-unresolved
// eslint-disable-next-line import/no-unresolved
import { BuyerGroupIdentifier } from './buyer-group-identifier';
import { QueryBuilder } from './query-builder';
import { ReportGenerator } from './report-generator';

export class BuyerGroupPipeline {
  private config: PipelineConfig;
  public coreSignalClient: CoreSignalClient; // Make public for direct access
  private painEngine: PainIntelligenceEngine;
  private profileAnalyzer: ProfileAnalyzer;
  private buyerGroupIdentifier: BuyerGroupIdentifier;
  private queryBuilder: QueryBuilder;
  private reportGenerator: ReportGenerator;
  private companyIntelligenceEngine: CompanyIntelligenceEngine;
  private candidateRanker: CandidateRanker;

  constructor(config: PipelineConfig) {
    this['config'] = config;
    
    // Initialize modules
    this['coreSignalClient'] = new CoreSignalClient(this.config.coreSignal);
    this['painEngine'] = new PainIntelligenceEngine();
    this['profileAnalyzer'] = new ProfileAnalyzer();
    this['buyerGroupIdentifier'] = new BuyerGroupIdentifier();
    this['queryBuilder'] = new QueryBuilder();
    this['reportGenerator'] = new ReportGenerator();
    this['candidateRanker'] = new CandidateRanker();
    this['companyIntelligenceEngine'] = new CompanyIntelligenceEngine(this.coreSignalClient);
  }

  /**
   * Main pipeline execution with optional company IDs for precision
   */
  async generateBuyerGroup(companyName: string, companyIds: number[] = []): Promise<IntelligenceReport> {
    // Dry-run mode: estimate costs without API calls
    if (this.config.coreSignal.dryRun) {
      return this.performDryRun(companyName);
    }
    
    let sellerProfile = this.getSellerProfile();
    
    // Step 0.5: Industry and Regional Adaptation (using real CoreSignal data)
    // Note: We'll enhance this with actual company data once we have it
    const industryProfile = IndustryAdapter.getIndustryProfile('computer software'); // Default for now
    const regionalProfile = IndustryAdapter.getRegionalProfile('US'); // Default for now
    
    // Adapt seller profile based on industry context
    sellerProfile = IndustryAdapter.adaptSellerProfile(sellerProfile, industryProfile, regionalProfile);
    // Step 1: Build search query with company IDs if available
    const companyAliases = this.config.targetCompanyAliases ?? [];
    const searchQuery = this.queryBuilder.buildSearchQuery(
      companyName,
      sellerProfile,
      companyAliases,
      this.config.enforceExactCompany ?? true,
      companyIds // Pass company IDs for precision
    );
    // Step 2: 🚀 HYPEROPTIMAL SEARCH STRATEGY
    // Use micro-targeted queries for precision (now with company ID support)
    const microTargetedQueries = this.queryBuilder.buildMicroTargetedQueries(companyName, sellerProfile, companyIds);
    // Execute searches and collect candidate metadata
    const searchCandidates: any[] = [];
    for (const query of microTargetedQueries) {
      try {
        const searchResults = await this.coreSignalClient.searchCandidates(query, 50); // Limit per query
        // In a real implementation, we'd get richer metadata from search results
        // For now, we'll use the IDs and simulate the ranking process
        for (const id of searchResults) {
          searchCandidates.push({
            id: id,
            searchQuery: JSON.stringify(query).substring(0, 100) // Truncated for logging
          });
        }
      } catch (error) {
        console.warn("Search query failed, continuing:", error);""
      }
    }
    
    // Deduplicate candidates
    const uniqueCandidates = Array.from(
      new Map(searchCandidates.map(c => [c.id, c])).values()
    );
    // For backward compatibility, extract just the IDs
    const candidateIds = uniqueCandidates.map(c => c.id);

    // Step 3: INTELLIGENT COMPANY SIZE ADAPTATION WITH SEARCH OPTIMIZATION
    const companyProfile = this.analyzeCompanySize(companyName, candidateIds.length);
    const adaptedConfig = this.adaptConfigToCompanySize(companyProfile, this.config);
    
    // SEARCH OPTIMIZATION: Use abundant search credits to reduce collect dependency
    const searchOptimizedConfig = this.optimizeForSearchCredits(adaptedConfig, companyProfile);
    
    // 🚀 HYPEROPTIMAL COLLECTION STRATEGY: Tiered Collection (35 max vs 150)
    const maxCollectsOptimized = Math.min(35, searchOptimizedConfig.maxCollects);
    const targetRange = adaptedConfig.targetRange;
    const earlyStopMode = adaptedConfig.earlyStopMode;
    const minRoleTargets = adaptedConfig.minRoleTargets;
    
    console.log(`Optimized collection: ${maxCollectsOptimized} profiles (${Math.round((maxCollectsOptimized / searchOptimizedConfig.maxCollects) * 100)}% of original)`);
    // Tiered collection approach
    const coreSignalProfiles: CoreSignalProfile[] = [];
    const profilesWithPain: CoreSignalProfile[] = [];
    
    // Collect profiles in priority order (decision makers first, then champions, etc.)
    const candidateIdsLimited = candidateIds.slice(0, maxCollectsOptimized);
    for (const candidateId of candidateIdsLimited) {
      try {
        const profile = await this.coreSignalClient.collectSingleProfile(candidateId);
        if (profile) {
          coreSignalProfiles.push(profile);
          // Generate pain intelligence for this profile
          const painIntel = await this.painEngine.analyzePainSignals(profile, sellerProfile, companyName);
          profilesWithPain.push({ ...profile, painIntelligence: painIntel });
        }
      } catch (error) {
        console.warn("Failed to collect profile ${candidateId}:", error);""
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    `

    // Step 4: If not generated incrementally, ensure all profiles have pain intelligence
    if (profilesWithPain.length !== coreSignalProfiles.length) {
      const allWithPain = await this.generatePainIntelligence(coreSignalProfiles, companyName, sellerProfile);
      profilesWithPain.splice(0, profilesWithPain.length, ...allWithPain);
      } else {
      }

    // Step 5: Transform to PersonProfile and analyze
    // Step 4: Transform and analyze profiles using ProfileAnalyzer
    const usingCompanyIds = companyIds.length > 0;
    const personProfiles = this.profileAnalyzer.analyzeProfiles(
      profilesWithPain, 
      companyName, 
      sellerProfile, 
      this.config.analysis,
      companyAliases,
      this.config.enforceExactCompany ?? true,
      usingCompanyIds  // NEW: Pass flag to enable permissive matching when using company IDs
    );
    console.log('Analyzed ' + personProfiles.length + ' qualified profiles (using company IDs: ' + usingCompanyIds + ')');
    // Step 6: Identify buyer group roles (adaptive size)
    let buyerGroup = await this.buyerGroupIdentifier.identifyBuyerGroup(
      personProfiles, 
      companyName, 
      sellerProfile,
      {
        maxBuyerGroupSize: this.config.analysis.maxBuyerGroupSize,
        targetBuyerGroupRange: this.config.analysis.targetBuyerGroupRange
      }
    );

    // Step 6.5: INTRODUCER GAP-FILL MECHANISM (WITH COST TRACKING)
    // If we have insufficient introducers, do a targeted search
    const minIntroducers = 2; // User specifically wants introducers
    if (buyerGroup.roles.introducer.length < minIntroducers) {
      buyerGroup = await this.performIntroducerGapFill(companyName, buyerGroup, sellerProfile, minIntroducers);
    }
    
    // Step 6.1: Enrich roles with pain intelligence
    this.enrichRolesWithPainIntelligence(buyerGroup, profilesWithPain);

    // Step 7: Generate comprehensive intelligence report
    let report = await this.reportGenerator.generateIntelligenceReport(
      buyerGroup, 
      personProfiles, 
      profilesWithPain,
      sellerProfile
    );
    
    // Step 8: Optional LLM defensibility augmentation
    if (this.config.llm?.enabled) {
      try {
        report = await this.reportGenerator.augmentWithLLMDefensibility(
          report,
          this.config.llm
        );
      } catch (e) {
        console.warn('LLM augmentation failed:', (e as Error).message);
      }
    }
    return report;
  }

  /**
   * Generate pain intelligence for all profiles
   */
  private async generatePainIntelligence(
    profiles: CoreSignalProfile[], 
    companyName: string, 
    sellerProfile: SellerProfile
  ): Promise<CoreSignalProfile[]> {
    return Promise.all(profiles.map(async (profile) => {
      const painIntelligence = await this.painEngine.analyzePainSignals(profile, sellerProfile, companyName);
      return {
        ...profile,
        painIntelligence
      };
    }));
  }

  /**
   * Enrich buyer group roles with pain intelligence
   */
  private enrichRolesWithPainIntelligence(buyerGroup: BuyerGroup, profilesWithPain: CoreSignalProfile[]): void {
    for (const roleType of Object.keys(buyerGroup.roles) as Array<keyof BuyerGroup['roles']>) {
      for (const role of buyerGroup['roles'][roleType]) {
        const profile = profilesWithPain.find(p => p['id'] === role.personId);
        if (profile?.painIntelligence) {
          role['painIntelligence'] = profile.painIntelligence;
        }
      }
    }
  }

  /**
   * Perform dry-run cost estimation without API calls
   */
  private async performDryRun(companyName: string): Promise<IntelligenceReport> {
    console.log('DRY RUN MODE: Estimating costs for ' + companyName + ' buyer group');
    const sellerProfile = this.getSellerProfile();
    const companyAliases = this.config.targetCompanyAliases ?? [];
    
    // Estimate search costs (minimal - 2 credits per search)
    const estimatedSearches = 3; // Main query + 2 segmented queries
    const searchCredits = estimatedSearches * 2;
    
    // Estimate collection costs (main cost driver - 2 credits per profile)
    const estimatedCollects = Math.min(this.config.coreSignal.maxCollects, 120);
    const collectCredits = estimatedCollects * 2;
    
    const totalCredits = searchCredits + collectCredits;
    const estimatedCost = totalCredits * 0.196; // $0.196 per credit on Pro plan
    
    console.log('Company: ' + companyName);
    console.log('Product: ' + sellerProfile.productName);
    console.log('Target aliases: [' + companyAliases.join(', ') + ']');
    console.log('Max collects: ' + estimatedCollects);
    console.log('Search credits: ' + searchCredits + ' (' + estimatedSearches + ' searches × 2)');
    console.log('Collect credits: ' + collectCredits + ' (' + estimatedCollects + ' profiles × 2)');
    console.log('Total credits: ' + totalCredits);
    console.log('Estimated cost: $' + estimatedCost.toFixed(2));
    console.log('Example: npm run run:buyer-group -- --company="' + companyName + '" --confirm');
    // Return minimal mock report for dry-run
    return {
      companyName,
      sellerProfile,
      query: this.queryBuilder.buildSearchQuery(companyName, sellerProfile, companyAliases, true),
      buyerGroup: {
        id: companyName.toLowerCase().replace(/\s+/g, '_') + '_dry_run_' + Date.now(),
        companyName,
        totalMembers: 0,
        roles: {
          decision: [],
          champion: [],
          stakeholder: [],
          blocker: [],
          introducer: []
        },
        dynamics: {
          powerDistribution: 0,
          consensusLevel: 0,
          riskLevel: 'low',
          decisionComplexity: 0
        },
        decisionFlow: {
          criticalPath: [],
          bottlenecks: [],
          estimatedDuration: 0
        },
        flightRisk: [],
        opportunitySignals: [],
        metadata: {
          generatedAt: new Date().toISOString(),
          collectionMethod: 'dry_run',
          totalCandidates: 0,
          finalCount: 0,
          costInCredits: 0
        }
      },
      opportunitySignals: [],
      painIntelligence: {
        aggregatedChallenges: [],
        companyWideTrends: [],
        strategicInitiatives: []
      },
      engagementStrategy: {
        primaryApproach: 'multi-threaded',
        sequencing: [],
        messaging: {},
        riskMitigation: []
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        creditsUsed: { search: 0, collect: 0 },
        processingTime: 0,
        dryRun: true,
        estimatedCredits: totalCredits,
        estimatedCost: estimatedCost
      }
    };
  }

  /**
   * COMPREHENSIVE COST ANALYSIS & OPTIMIZATION REPORT
   */
  async analyzeCostOptimization(companyName: string): Promise<{
    currentConfig: any;
    costBreakdown: any;
    optimizationSuggestions: any;
    recommendedConfig: any;
  }> {
    const sellerProfile = this.getSellerProfile();
    const companyProfile = this.analyzeCompanySize(companyName, 1000); // Mock candidate count
    const adaptedConfig = this.adaptConfigToCompanySize(companyProfile, this.config);

    // REAL-WORLD cost breakdown based on actual CoreSignal API calls
    const mainSearchCost = 8 * 2; // 4 segmented + 3 role gap-fill + 1 introducer = 8 searches × 2 credits
    const mainCollectionCost = adaptedConfig.maxCollects * 2; // 150 profiles × 2 credits (enterprise)
    const roleGapFillCost = 0; // Already included in mainSearchCost
    const introducerGapFillCost = 0; // Already included in mainSearchCost
    
    const totalCurrentCost = mainSearchCost + mainCollectionCost + roleGapFillCost + introducerGapFillCost;

    // Old problematic cost (what caused 500 credits)
    const oldRoleGapFillCost = 3 * adaptedConfig.maxCollects * 2; // Was using full maxCollects!
    const oldTotalCost = mainSearchCost + mainCollectionCost + oldRoleGapFillCost + introducerGapFillCost;

    return {
      currentConfig: {
        companySize: companyProfile.size,
        maxCollects: adaptedConfig.maxCollects,
        batchSize: adaptedConfig.batchSize,
        targetRange: adaptedConfig.targetRange
      },
      costBreakdown: {
        mainSearch: { cost: mainSearchCost, description: "8 search queries (4 segmented + 4 role gap-fill)" },
        mainCollection: { cost: mainCollectionCost, description: adaptedConfig.maxCollects + ' profile collections (enterprise adaptive)' },
        roleGapFill: { cost: roleGapFillCost, description: "Included in search cost (OPTIMIZED)" },
        introducerGapFill: { cost: introducerGapFillCost, description: "Included in search cost (OPTIMIZED)" },
        total: totalCurrentCost,
        realWorldCost: {
          currentPlan: { cost: totalCurrentCost * 0.08, description: "Pro plan @ $0.08/credit" },
          premiumAnnual: { cost: totalCurrentCost * 0.002, description: "Premium Annual @ $0.002/credit" }
        }
      },
      optimizationSuggestions: {
        creditsSaved: oldTotalCost - totalCurrentCost,
        oldProblematicCost: oldRoleGapFillCost,
        newOptimizedCost: roleGapFillCost,
        explanation: "Fixed role gap-fill to use 30 profiles max instead of full maxCollects (150)"
      },
      recommendedConfig: {
        maxCollects: Math.min(100, adaptedConfig.maxCollects), // Reduce for cost efficiency
        roleSearchLimit: 25, // Even more conservative
        introducerLimit: 12, // Even tighter
        estimatedTotalCost: mainSearchCost + (100 * 2) + (3 * 25 * 2) + (12 * 2)
      }
    };
  }

  /**
   * 🔍 SEARCH CREDIT OPTIMIZATION
   * Reduce collect dependency by leveraging abundant search credits
   */
  private optimizeForSearchCredits(adaptedConfig: any, companyProfile: any): any {
    // Calculate search-to-collect ratio optimization
    const baseMaxCollects = adaptedConfig.maxCollects;
    
    // For enterprise companies, reduce collects by 50% and increase search precision
    let optimizedMaxCollects = baseMaxCollects;
    let searchMultiplier = 1;
    
    if (companyProfile['size'] === 'enterprise') {
      optimizedMaxCollects = Math.floor(baseMaxCollects * 0.5); // 150 → 75
      searchMultiplier = 4; // 4x more targeted searches
      console.log('Enterprise company optimization: ' + optimizedMaxCollects + ' max collects, ' + searchMultiplier + 'x search multiplier');
    } else if (companyProfile['size'] === 'large') {
      optimizedMaxCollects = Math.floor(baseMaxCollects * 0.6); // 100 → 60
      searchMultiplier = 3; // 3x more targeted searches
      console.log('Large company optimization: ' + optimizedMaxCollects + ' max collects, ' + searchMultiplier + 'x search multiplier');
    } else if (companyProfile['size'] === 'medium') {
      optimizedMaxCollects = Math.floor(baseMaxCollects * 0.75); // 75 → 56
      searchMultiplier = 2; // 2x more targeted searches
      console.log('Medium company optimization: ' + optimizedMaxCollects + ' max collects, ' + searchMultiplier + 'x search multiplier');
    }
    
    console.log('Estimated ' + ((baseMaxCollects - optimizedMaxCollects) * 2) + ' collect credits saved per run');
    
    return {
      ...adaptedConfig,
      maxCollects: optimizedMaxCollects,
      searchMultiplier,
      originalMaxCollects: baseMaxCollects,
      creditsSaved: (baseMaxCollects - optimizedMaxCollects) * 2
    };
  }

  /**
   * Get seller profile (string or object)
   */
  private getSellerProfile(): SellerProfile {
    if (typeof this['config']['sellerProfile'] === 'string') {
      return getSellerProfile(this.config.sellerProfile);
    }
    return this.config.sellerProfile;
  }

  /**
   * Export report to file
   */
  async exportReport(report: IntelligenceReport, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    }

  /**
   * Get pipeline statistics
   */
  getStats(): {
    cacheStats: { size: number; keys: string[] };
    configSummary: {
      sellerProfile: string;
      maxCollects: number;
      analysisConfig: object;
    };
  } {
    return {
      cacheStats: this.coreSignalClient.getCacheStats(),
      configSummary: {
        sellerProfile: typeof this['config']['sellerProfile'] === 'string' 
          ? this.config.sellerProfile 
          : this.config.sellerProfile.productName,
        maxCollects: this.config.coreSignal.maxCollects,
        analysisConfig: this.config.analysis
      }
    };
  }

  /**
   * INTRODUCER GAP-FILL MECHANISM
   * Performs a targeted, cost-effective search specifically for introducers
   */
  private async performIntroducerGapFill(
    companyName: string,
    currentBuyerGroup: any,
    sellerProfile: any,
    minIntroducers: number
  ): Promise<any> {
    const introducersNeeded = minIntroducers - currentBuyerGroup.roles.introducer.length;
    // Build a highly targeted query for introducer roles only
    const introducerQuery = this.queryBuilder.buildIntroducerSpecificQuery(
      companyName, 
      sellerProfile.rolePriorities.introducer
    );

    // LIMITED, COST-CONTROLLED SEARCH (max 15 profiles to keep costs low)
    const maxIntroducerCollects = Math.min(15, introducersNeeded * 3); // 3x buffer for selectivity (reduced from 5x)
    const introducerCandidateIds = await this.coreSignalClient.searchCandidates(
      introducerQuery, 
      maxIntroducerCollects
    );

    if (introducerCandidateIds['length'] === 0) {
      return currentBuyerGroup;
    }

    // Collect profiles for these candidates (limited by maxIntroducerCollects)
    const limitedIntroducerIds = introducerCandidateIds.slice(0, maxIntroducerCollects);
    const introducerProfiles = await this.coreSignalClient.collectProfiles(
      limitedIntroducerIds
    );

    if (introducerProfiles['length'] === 0) {
      console.log('No introducer gap-fill needed');
      return currentBuyerGroup;
    }

    // Process these profiles
    const analysisConfig = {
      minInfluenceScore: this.config.analysis?.minInfluenceScore ?? 0,
      requireDirector: this.config.analysis?.requireDirector ?? false,
      allowIC: this.config.analysis?.allowIC ?? true
    };
    
    const transformedProfiles = await this.profileAnalyzer.analyzeProfiles(
      introducerProfiles,
      companyName,
      sellerProfile,
      analysisConfig,
      this.config.targetCompanyAliases || []
    );

    // Generate pain intelligence for these profiles  
    const profilesWithPain = await Promise.all(
      transformedProfiles.map(async (profile) => {
        const painIntelligence = await this.painEngine.analyzePainSignals(profile, sellerProfile, companyName);
        return { ...profile, painIntelligence };
      })
    );

    console.log('Processed ' + transformedProfiles.length + ' introducer profiles');
    // Merge these new profiles with existing ones and re-identify buyer group
    const allProfiles = [...(currentBuyerGroup.profiles || []), ...profilesWithPain];
    
    // Re-run buyer group identification with the expanded profile set
    const enhancedBuyerGroup = await this.buyerGroupIdentifier.identifyBuyerGroup(
      allProfiles,
      companyName,
      sellerProfile,
      {
        maxBuyerGroupSize: this.config.analysis.maxBuyerGroupSize,
        targetBuyerGroupRange: this.config.analysis.targetBuyerGroupRange
      }
    );

    const newIntroducerCount = enhancedBuyerGroup.roles.introducer.length;
    const improvement = newIntroducerCount - currentBuyerGroup.roles.introducer.length;
    
    `
    
    return enhancedBuyerGroup;
  }

  /**
   * COMPANY SIZE INTELLIGENCE ANALYSIS
   * Analyzes company size to adapt buyer group strategy and resource allocation
   */
  private analyzeCompanySize(companyName: string, candidatePoolSize: number): {
    size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    estimatedEmployees: number;
    complexity: number;
    rationale: string[];
  } {
    const rationale: string[] = [];
    let size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' = 'medium';
    let estimatedEmployees = 0;
    let complexity = 1;

    // Company name indicators - adaptive to any company
    const enterpriseIndicators = this.getEnterpriseIndicators();
    const largeIndicators = ['technologies', 'corporation', 'corp', 'inc', 'international', 'global', 'group', 'systems', 'solutions', 'enterprises', 'worldwide'];
    
    const companyLower = companyName.toLowerCase();
    
    // Analyze candidate pool size (strong indicator of company size)
    if (candidatePoolSize > 500) {
      size = 'enterprise';
      estimatedEmployees = 10000;
      complexity = 4;
      rationale.push(`Large candidate pool (${candidatePoolSize}) indicates enterprise scale`);
    } else if (candidatePoolSize > 200) {
      size = 'large';
      estimatedEmployees = 5000;
      complexity = 3;
      rationale.push(`Substantial candidate pool (${candidatePoolSize}) indicates large company`);
    } else if (candidatePoolSize > 50) {
      size = 'medium';
      estimatedEmployees = 1000;
      complexity = 2;
      rationale.push(`Moderate candidate pool (${candidatePoolSize}) indicates medium company`);
    } else if (candidatePoolSize > 15) {
      size = 'small';
      estimatedEmployees = 250;
      complexity = 1.5;
      rationale.push(`Small candidate pool (${candidatePoolSize}) indicates small company`);
    } else {
      size = 'startup';
      estimatedEmployees = 50;
      complexity = 1;
      rationale.push(`Very small candidate pool (${candidatePoolSize}) indicates startup/small company`);
    }

    // Override based on company name recognition
    if (enterpriseIndicators.some(indicator => companyLower.includes(indicator))) {
      size = 'enterprise';
      estimatedEmployees = Math.max(estimatedEmployees, 20000);
      complexity = 4;
      rationale.push("Recognized enterprise company name");
    } else if (largeIndicators.some(indicator => companyLower.includes(indicator))) {
      if (size === 'small' || size === 'startup') {
        size = 'medium';
        estimatedEmployees = Math.max(estimatedEmployees, 500);
        complexity = Math.max(complexity, 2);
        rationale.push("Company name suggests larger scale than candidate pool indicates");
      }
    }

    return { size, estimatedEmployees, complexity, rationale };
  }

  /**
   * Get enterprise company indicators - can be customized based on industry data
   */
  private getEnterpriseIndicators(): string[] {
    return [
      // Technology giants
      'microsoft', 'google', 'amazon', 'apple', 'meta', 'facebook', 'tesla', 'nvidia',
      // Traditional enterprise
      'ibm', 'oracle', 'salesforce', 'cisco', 'intel', 'adobe', 'vmware', 'servicenow',
      // Financial services
      'jpmorgan', 'goldman sachs', 'morgan stanley', 'wells fargo', 'bank of america',
      // Healthcare/Pharma
      'johnson & johnson', 'pfizer', 'merck', 'bristol myers', 'eli lilly',
      // Industrial
      'general electric', 'boeing', 'caterpillar', '3m', 'honeywell',
      // Retail/Consumer
      'walmart', 'procter & gamble', 'coca-cola', 'pepsi', 'nike',
      // Consulting/Professional Services
      'mckinsey', 'deloitte', 'accenture', 'pwc', 'ernst & young',
      // Automotive
      'ford', 'general motors', 'bmw', 'mercedes', 'toyota'
    ];
  }

  /**
   * ADAPTIVE CONFIGURATION BASED ON COMPANY SIZE
   * Optimizes scanning strategy, buyer group size, and resource allocation
   */
  private adaptConfigToCompanySize(companyProfile: any, baseConfig: PipelineConfig): {
    maxCollects: number;
    batchSize: number;
    targetRange: { min: number; max: number };
    earlyStopMode: string;
    minRoleTargets: any;
  } {
    const { size } = companyProfile;

    switch (size) {
      case 'enterprise':
        return {
          maxCollects: Math.min(150, baseConfig.coreSignal.maxCollects),
          batchSize: 25,
          targetRange: { min: 12, max: 18 },
          earlyStopMode: 'accuracy_first',
          minRoleTargets: { decision: 1, champion: 2, stakeholder: 4, blocker: 1, introducer: 2 }
        };
      case 'large':
        return {
          maxCollects: Math.min(100, baseConfig.coreSignal.maxCollects),
          batchSize: 20,
          targetRange: { min: 10, max: 15 },
          earlyStopMode: 'accuracy_first',
          minRoleTargets: { decision: 1, champion: 2, stakeholder: 3, blocker: 1, introducer: 2 }
        };
      case 'medium':
        return {
          maxCollects: Math.min(75, baseConfig.coreSignal.maxCollects),
          batchSize: 15,
          targetRange: { min: 8, max: 12 },
          earlyStopMode: 'conservative',
          minRoleTargets: { decision: 1, champion: 1, stakeholder: 2, blocker: 1, introducer: 1 }
        };
      case 'small':
        return {
          maxCollects: Math.min(50, baseConfig.coreSignal.maxCollects),
          batchSize: 10,
          targetRange: { min: 5, max: 8 },
          earlyStopMode: 'conservative',
          minRoleTargets: { decision: 1, champion: 1, stakeholder: 1, blocker: 0, introducer: 1 }
        };
      case 'startup':
        return {
          maxCollects: Math.min(25, baseConfig.coreSignal.maxCollects),
          batchSize: 5,
          targetRange: { min: 3, max: 6 },
          earlyStopMode: 'aggressive',
          minRoleTargets: { decision: 1, champion: 1, stakeholder: 1, blocker: 0, introducer: 1 }
        };
      default:
        return {
          maxCollects: baseConfig.coreSignal.maxCollects,
          batchSize: baseConfig.coreSignal.batchSize,
          targetRange: { min: 8, max: 12 },
          earlyStopMode: 'conservative',
          minRoleTargets: { decision: 1, champion: 2, stakeholder: 2, blocker: 1, introducer: 2 }
        };
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.coreSignalClient.clearCache();
  }
}

// ==================== USAGE FUNCTION ====================

export async function runBuyerGroupPipeline(
  companyName: string, 
  sellerProfileName: string = 'buyer-group-intelligence',
  maxCollects: number = 100
): Promise<IntelligenceReport> {
  
  const sellerProfile = getSellerProfile(sellerProfileName);
  
  const config: PipelineConfig = {
    sellerProfile,
    coreSignal: {
      apiKey: process['env']['CORESIGNAL_API_KEY'] || '',
      baseUrl: 'https://api.coresignal.com',
      maxCollects,
      batchSize: 10,
      useCache: true,
      cacheTTL: 24
    },
    analysis: {
      minInfluenceScore: 5,
      maxBuyerGroupSize: 12,
      requireDirector: false,
      allowIC: true,
      targetBuyerGroupRange: { min: 8, max: 12 }
    },
    output: {
      format: 'json',
      includeFlightRisk: true,
      includeDecisionFlow: true,
      generatePlaybooks: true
    },
    llm: {
      enabled: false,
      provider: 'openai',
      model: 'gpt-4o-mini'
    }
  };

  const pipeline = new BuyerGroupPipeline(config);
  return pipeline.generateBuyerGroup(companyName);
}

// Export all types and modules
export * from './types';
export { SELLER_PROFILES, getSellerProfile, createSellerProfile } from './seller-profiles';
export { CoreSignalClient } from './coresignal-client';
export { PainIntelligenceEngine } from './pain-intelligence';
export { ProfileAnalyzer } from './profile-analyzer';
