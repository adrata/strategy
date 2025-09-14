/**
 * 🎯 RESEARCH ORCHESTRATOR
 * 
 * Main intelligence engine that coordinates all research activities.
 * Implements adaptive research depth based on context and user needs.
 */

import { 
  ResearchRequest, 
  ResearchResult, 
  ResearchPlan, 
  ResearchSession,
  ExecutiveContact,
  APIConfig,
  DEFAULT_API_CONFIG,
  CostBreakdown
} from '../types/intelligence';
import { AdaptiveProcessor } from './AdaptiveProcessor';
import { CostOptimizer } from './CostOptimizer';
import { cache } from '@/platform/services';
import { DataQualityValidator } from '../modules/DataQualityValidator';
import { PipelineAuditor } from '../services/PipelineAuditor';
import { ContactLeadManager } from '../services/ContactLeadManager';

export class ResearchOrchestrator {
  private adaptiveProcessor: AdaptiveProcessor;
  private costOptimizer: CostOptimizer;
  private dataQualityValidator: DataQualityValidator;
  private auditor: PipelineAuditor;
  private contactLeadManager: ContactLeadManager;
  private config: APIConfig;
  private activeSessions: Map<string, ResearchSession> = new Map();

  constructor(config: Partial<APIConfig> = {}) {
    this['config'] = { ...DEFAULT_API_CONFIG, ...config };
    this['adaptiveProcessor'] = new AdaptiveProcessor(this.config);
    this['costOptimizer'] = new CostOptimizer(this.config);
    this['dataQualityValidator'] = new DataQualityValidator();
    this['auditor'] = new PipelineAuditor();
    this['contactLeadManager'] = new ContactLeadManager();
  }

  /**
   * 🚀 MAIN RESEARCH ENTRY POINT
   * 
   * Intelligently researches executives based on request parameters
   */
  async research(request: ResearchRequest): Promise<ResearchResult> {
    console.log(`🧠 [RESEARCH] Starting research for ${request.accounts.length} accounts`);
    
    // Create research session
    const session = await this.createResearchSession(request);
    
    try {
      // Step 1: Generate adaptive research plan
      const plan = await this.adaptiveProcessor.createResearchPlan(request);
      console.log(`📋 [RESEARCH] Plan created: ${plan.stages.length} stages, $${plan.estimatedCost.toFixed(2)} estimated cost`);

      // Step 2: Check cache first
      const cachedResults = await this.checkCacheForAccounts(request.accounts, request.targetRoles);
      console.log(`💾 [RESEARCH] Found ${cachedResults.length} cached results`);

      // Step 3: Determine which accounts need fresh research
      const uncachedAccounts = request.accounts.filter(account => 
        !cachedResults.some(cached => cached['accountId'] === account.id)
      );

      // Step 4: Execute research plan for uncached accounts
      let freshResults: ExecutiveContact[] = [];
      let totalCost = 0;
      let processingTimeMs = 0;

      if (uncachedAccounts.length > 0) {
        const researchResult = await this.executeResearchPlan(
          { ...request, accounts: uncachedAccounts }, 
          plan,
          session
        );
        freshResults = researchResult.executives;
        totalCost = researchResult.totalCost;
        processingTimeMs = researchResult.processingTimeMs;

        // Cache the fresh results
        await this.cacheResults(freshResults);
      }

      // Step 5: Combine cached and fresh results
      let allExecutives = [...cachedResults, ...freshResults];

      // Step 6: CRITICAL DATA QUALITY VALIDATION
      console.log('🛡️ [DATA QUALITY] Validating executive data quality...');
      
      // Check for duplicate assignments (same person CFO/CRO)
      const duplicateCheck = this.dataQualityValidator.checkDuplicateAssignments(allExecutives);
      if (duplicateCheck.hasDuplicates) {
        console.log(`🚨 [DATA QUALITY] Found ${duplicateCheck.duplicatePairs.length} duplicate assignments`);
        duplicateCheck.recommendations.forEach(rec => console.log(`   ${rec}`));
        
        // Resolve duplicates automatically
        allExecutives = this.dataQualityValidator.resolveDuplicateAssignments(allExecutives);
      }
      
      // Validate each executive individually
      const validatedExecutives: ExecutiveContact[] = [];
      for (const executive of allExecutives) {
        const validation = this.dataQualityValidator.validateExecutive(executive);
        
        if (!validation.isValid) {
          console.log(`⚠️ [DATA QUALITY] Issues with ${executive.name} (${executive.role}):`);
          validation.issues.forEach(issue => console.log(`   - ${issue}`));
          validation.recommendations.forEach(rec => console.log(`   💡 ${rec}`));
          
          // Adjust confidence based on validation
          executive['confidenceScore'] = Math.min(executive.confidenceScore, validation.confidence);
          
          // Add quality notes to reasoning
          if (executive.selectionReasoning) {
            executive.selectionReasoning += ` | Quality issues: ${validation.issues.join(', ')}`;
          }
        }
        
        // Only include executives that pass minimum quality threshold
        if (validation.confidence >= 25) { // Minimum 25% confidence
          validatedExecutives.push(executive);
        } else {
          console.log(`❌ [DATA QUALITY] Excluding ${executive.name} due to low quality (${validation.confidence}%)`);
        }
      }
      
      console.log(`✅ [DATA QUALITY] Validation complete: ${validatedExecutives.length}/${allExecutives.length} executives passed quality checks`);
      allExecutives = validatedExecutives;

      // Step 7: Calculate overall confidence
      const confidence = this.calculateOverallConfidence(allExecutives);

      // Step 8: Update session
      await this.updateResearchSession(session.id, {
        status: 'completed',
        executivesFound: allExecutives.length,
        totalCost,
        processingTimeMs,
        confidenceAvg: confidence,
        completedAt: new Date()
      });

      console.log(`✅ [RESEARCH] Completed: ${allExecutives.length} executives found, ${confidence}% confidence`);

      // Step 9: Generate buyer group analysis
      const buyerGroupAnalysis = request['researchDepth'] === 'comprehensive' 
        ? await this.generateBuyerGroupAnalysis(allExecutives, request['accounts'][0])
        : undefined;

      // Step 10: Add discovered executives as contacts and leads
      let totalContactsAdded = 0;
      let totalLeadsAdded = 0;
      
      if (allExecutives.length > 0 && buyerGroupAnalysis) {
        try {
          const insertResult = await this.contactLeadManager.addBuyerGroupToDatabase(
            allExecutives,
            buyerGroupAnalysis,
            {
              workspaceId: request.workspaceId,
              userId: request.userId,
              accountId: request['accounts'][0]?.id,
              source: 'Intelligence Research',
              priority: 'medium'
            }
          );
          
          totalContactsAdded = insertResult.contactsAdded;
          totalLeadsAdded = insertResult.leadsAdded;
          
          console.log(`📝 [DATABASE] Added ${totalContactsAdded} contacts, ${totalLeadsAdded} leads`);
          
        } catch (error) {
          console.error(`❌ [DATABASE] Failed to add contacts/leads:`, error);
        }
      }

      return {
        sessionId: session.id,
        executives: allExecutives,
        totalCost,
        processingTimeMs,
        confidence,
        contactsAdded: totalContactsAdded,
        leadsAdded: totalLeadsAdded,
        researchMethods: this.extractResearchMethods(allExecutives),
        buyerGroupAnalysis
      };

    } catch (error) {
      console.error(`❌ [RESEARCH] Failed:`, error);
      await this.updateResearchSession(session.id, {
        status: 'failed',
        errors: [{
          code: 'RESEARCH_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          module: 'ResearchOrchestrator',
          retryable: true,
          timestamp: new Date()
        }]
      });
      throw error;
    }
  }

  /**
   * 📋 CREATE RESEARCH SESSION
   */
  private async createResearchSession(request: ResearchRequest): Promise<ResearchSession> {
    const session: ResearchSession = {
      id: `rs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountIds: request.accounts.map(a => a.id || a.name),
      targetRoles: request.targetRoles,
      researchDepth: request.researchDepth,
      status: 'pending',
      progress: 0,
      totalCost: 0,
      executivesFound: 0,
      confidenceAvg: 0,
      processingTimeMs: 0,
      userId: request.userId,
      workspaceId: request.workspaceId,
      createdAt: new Date()
    };

    this.activeSessions.set(session.id, session);
    console.log(`📊 [SESSION] Created: ${session.id}`);
    return session;
  }

  /**
   * 💾 CHECK CACHE FOR EXISTING RESULTS
   */
  private async checkCacheForAccounts(
    accounts: any[], 
    targetRoles: string[]
  ): Promise<ExecutiveContact[]> {
    const cachedResults: ExecutiveContact[] = [];
    
    for (const account of accounts) {
      const cacheKey = `executives:${account.id || account.name}:${targetRoles.join(',')}`;
      const cached = await cache.get(cacheKey, async () => null, {
        tags: ['research-orchestrator']
      });
      
      if (cached && Array.isArray(cached)) {
        cachedResults.push(...cached);
        console.log(`💾 [CACHE] Hit for ${account.name}: ${cached.length} executives`);
      }
    }

    return cachedResults;
  }

  /**
   * 🎯 EXECUTE RESEARCH PLAN
   */
  private async executeResearchPlan(
    request: ResearchRequest,
    plan: ResearchPlan,
    session: ResearchSession
  ): Promise<{
    executives: ExecutiveContact[];
    totalCost: number;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    const executives: ExecutiveContact[] = [];
    let totalCost = 0;

    console.log(`🎯 [EXECUTE] Starting ${plan.stages.length} research stages`);

    // Execute stages in order
    for (let i = 0; i < plan.stages.length; i++) {
      const stage = plan['stages'][i];
      console.log(`🔄 [STAGE ${i + 1}] ${stage.name} - ${stage.modules.join(', ')}`);

      try {
        // Update progress
        const progress = Math.round((i / plan.stages.length) * 100);
        await this.updateResearchSession(session.id, { progress });

        // Execute stage (this would call the actual research modules)
        const stageResult = await this.executeResearchStage(request, stage);
        
        executives.push(...stageResult.executives);
        totalCost += stageResult.cost;

        console.log(`✅ [STAGE ${i + 1}] Completed: ${stageResult.executives.length} executives, $${stageResult.cost.toFixed(2)}`);

        // Check if we have enough results to satisfy the request
        if (this.hasEnoughResults(executives, request)) {
          console.log(`🎯 [EXECUTE] Sufficient results found, stopping early`);
          break;
        }

      } catch (error) {
        console.error(`❌ [STAGE ${i + 1}] Failed:`, error);
        // Continue with next stage - don't fail entire research
      }
    }

    const processingTimeMs = Date.now() - startTime;
    
    return {
      executives,
      totalCost,
      processingTimeMs
    };
  }

  /**
   * 🔧 EXECUTE INDIVIDUAL RESEARCH STAGE
   */
  private async executeResearchStage(
    request: ResearchRequest,
    stage: any
  ): Promise<{
    executives: ExecutiveContact[];
    cost: number;
  }> {
    const executives: ExecutiveContact[] = [];
    let cost = 0;

    console.log(`🔧 [STAGE] Executing stage: ${stage.name}`);

    // Execute stage modules
    for (const moduleName of stage.modules) {
      try {
        console.log(`   🔄 Running module: ${moduleName}`);
        
        switch (moduleName) {
          case 'CompanyResolver':
            await this.executeCompanyResolution(request);
            break;
            
          case 'ExecutiveResearch':
            const executiveResults = await this.executeExecutiveResearch(request);
            executives.push(...executiveResults);
            break;
            
          case 'ContactIntelligence':
            const contactResults = await this.executeContactIntelligence(request, executives);
            executives.splice(0, executives.length, ...contactResults); // Replace with enhanced executives
            break;
            
                    case 'ValidationEngine':
            const validationResults = await this.executeValidationEngine(request, executives);
            // Update executives with validation scores
            executives.forEach((exec, index) => {
              const validation = validationResults.executiveValidations.find(v => v['executiveId'] === exec.id);
              if (validation) {
                exec['confidenceScore'] = Math.min(exec.confidenceScore, validation.validationScore);
                if (exec.selectionReasoning) {
                  exec.selectionReasoning += ` | Validation: ${validation.validationScore}% quality score`;
                }
              }
            });
            break;

          case 'BuyerGroupAnalysis':
            // This will be handled in the buyer group analysis step
            console.log(`   🎯 BuyerGroupAnalysis will be executed in comprehensive research`);
            break;
            
          default:
            console.log(`   ⚠️ Unknown module: ${moduleName}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Module ${moduleName} failed:`, error);
      }
    }

    // Real executive research is now handled by the modules above

    cost = stage.estimatedCost * request.accounts.length;

    console.log(`   ✅ Stage complete: ${executives.length} executives, $${cost.toFixed(2)}`);
    return { executives, cost };
  }

  /**
   * 🏢 EXECUTE COMPANY RESOLUTION
   */
  private async executeCompanyResolution(request: ResearchRequest): Promise<void> {
    const { CompanyResolver } = await import('../modules/CompanyResolver');
    const resolver = new CompanyResolver(this.config);

    for (const account of request.accounts) {
      try {
        const url = account.website || account.domain || account.name;
        const resolution = await resolver.resolveCompany(url);
        
        console.log(`   ✅ Resolved ${account.name}: ${resolution.companyName} (${resolution.confidence}% confidence)`);
        
        // Store resolution data in account metadata
        if (!account.metadata) account['metadata'] = {};
        account['metadata']['resolution'] = resolution;
        
      } catch (error) {
        console.error(`   ❌ Failed to resolve ${account.name}:`, error);
      }
    }
  }

  /**
   * 🎯 EXECUTE EXECUTIVE RESEARCH (ENHANCED WITH AUDITING)
   */
  private async executeExecutiveResearch(request: ResearchRequest): Promise<ExecutiveContact[]> {
    const { ExecutiveResearchEnhanced } = await import('../modules/ExecutiveResearchEnhanced');
    const researcher = new ExecutiveResearchEnhanced(this.config);
    const executives: ExecutiveContact[] = [];

    // Process accounts in parallel for optimization
    const accountPromises = request.accounts.map(async (account) => {
      try {
        const companyName = account.metadata?.resolution?.companyName || account.name;
        const website = account.metadata?.resolution?.finalUrl || account.website || account.domain || '';
        const accountId = account.id || account.name;
        
        console.log(`   🔍 [PARALLEL] Researching executives for ${companyName}...`);
        
        // Use enhanced research with auditing
        // Get selling context for dynamic research
        const { WorkspaceProfileService } = await import('../services/WorkspaceProfileService');
        const profileService = new WorkspaceProfileService();
        const sellingProfile = await profileService.getWorkspaceProfile(request.workspaceId, request.userId);
        
        console.log(`   🎯 Using dynamic roles: ${sellingProfile.primaryTargetRoles.join(', ')} for ${sellingProfile.productCategory}`);
        
        const result = await researcher.researchExecutives(
          companyName, 
          website, 
          sellingProfile.primaryTargetRoles, // Use dynamic roles from profile
          `session_${Date.now()}`,
          sellingProfile
        );
        
        const accountExecutives: ExecutiveContact[] = [];
        
        // Handle the new format: result.executives (array of ExecutiveCandidate)
        if (result['executives'] && result.executives.length > 0) {
          console.log(`   🎯 Found ${result.executives.length} executive candidates`);
          
          for (const candidate of result.executives) {
            const executiveContact = researcher.convertToExecutiveContact(
              candidate, 
              accountId, 
              request.workspaceId
            );
            accountExecutives.push(executiveContact);
            console.log(`   ✅ Executive found: ${candidate.name} (${candidate.role}) - ${candidate.confidence}% confidence`);
          }
        } else {
          console.log(`   ⚠️ No executives found for ${companyName}`);
        }
        
        // Log audit report for detailed analysis
        if (result.auditReport) {
          console.log(`\n📊 [AUDIT REPORT] ${companyName}:`);
          console.log(result.auditReport);
        }
        
        console.log(`   ✅ Executive research for ${companyName}: ${accountExecutives.length} executives found`);
        return accountExecutives;
        
      } catch (error) {
        console.error(`   ❌ Executive research failed for ${account.name}:`, error);
        return [];
      }
    });

    // Wait for all accounts to complete (parallel processing)
    const results = await Promise.allSettled(accountPromises);
    
    // Collect successful results
    results.forEach((result, index) => {
      if (result['status'] === 'fulfilled') {
        executives.push(...result.value);
      } else {
        console.error(`❌ Account ${request['accounts'][index].name} failed:`, result.reason);
      }
    });

    console.log(`🎯 [EXECUTIVE RESEARCH] Parallel processing complete: ${executives.length} total executives found`);
    return executives;
  }

  /**
   * 📧 EXECUTE CONTACT INTELLIGENCE
   */
  private async executeContactIntelligence(
    request: ResearchRequest,
    executives: ExecutiveContact[]
  ): Promise<ExecutiveContact[]> {
    if (executives['length'] === 0) return executives;

    const { ContactIntelligence } = await import('../modules/ContactIntelligence');
    const contactIntelligence = new ContactIntelligence(this.config);

    console.log(`   📧 [CONTACT INTELLIGENCE] Discovering contacts for ${executives.length} executives`);

    // Get company domain from first account
    const firstAccount = request['accounts'][0];
    const companyDomain = firstAccount.metadata?.resolution?.finalUrl || 
                         firstAccount.website || 
                         firstAccount.domain || 
                         `${firstAccount.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

    const enhancedExecutives = await contactIntelligence.discoverContacts(
      executives,
      companyDomain,
      request.userId
    );

    console.log(`   ✅ Contact intelligence complete: ${enhancedExecutives.length} executives enhanced`);
    return enhancedExecutives;
  }

  /**
   * ✅ EXECUTE VALIDATION ENGINE
   */
  private async executeValidationEngine(
    request: ResearchRequest,
    executives: ExecutiveContact[]
  ): Promise<any> {
    if (executives['length'] === 0) return { executiveValidations: [] };

    const { ValidationEngine } = await import('../modules/ValidationEngine');
    const validationEngine = new ValidationEngine(this.config);

    console.log(`   ✅ [VALIDATION ENGINE] Validating ${executives.length} executives`);

    const companyName = request['accounts'][0]?.metadata?.resolution?.companyName || 
                       request['accounts'][0]?.name || 
                       'Unknown Company';

    const validationReport = await validationEngine.validateExecutiveData(executives, companyName);

    console.log(`   📊 Validation complete: ${validationReport.overallScore}% overall quality, ${validationReport.riskLevel} risk`);
    
    if (validationReport.warnings.length > 0) {
      console.log(`   ⚠️ Warnings: ${validationReport.warnings.join(', ')}`);
    }

    return validationReport;
  }

  /**
   * 💾 CACHE RESEARCH RESULTS
   */
  private async cacheResults(executives: ExecutiveContact[]): Promise<void> {
    // Group executives by account
    const executivesByAccount = executives.reduce((acc, exec) => {
      if (!acc[exec.accountId]) {
        acc[exec.accountId] = [];
      }
      acc[exec.accountId].push(exec);
      return acc;
    }, {} as Record<string, ExecutiveContact[]>);

    // Cache each account's executives
    for (const [accountId, accountExecutives] of Object.entries(executivesByAccount)) {
      const roles = accountExecutives.map(e => e.role).join(',');
      const cacheKey = `executives:${accountId}:${roles}`;
      await cache.set(cacheKey, accountExecutives, {
        ttl: this.config.CACHE_TTL_SECONDS * 1000, // Convert to milliseconds
        tags: ['research-orchestrator'],
        priority: 'high'
      });
      console.log(`💾 [CACHE] Stored ${accountExecutives.length} executives for ${accountId}`);
    }
  }

  /**
   * 🎯 CHECK IF WE HAVE ENOUGH RESULTS
   */
  private hasEnoughResults(executives: ExecutiveContact[], request: ResearchRequest): boolean {
    // For each account, check if we found the target roles
    for (const account of request.accounts) {
      const accountExecutives = executives.filter(e => e['accountId'] === (account.id || account.name));
      const foundRoles = new Set(accountExecutives.map(e => e.role));
      
      // Check if we found at least one of each target role
      const hasAllTargetRoles = request.targetRoles.every(role => foundRoles.has(role as any));
      
      if (!hasAllTargetRoles) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 📊 CALCULATE OVERALL CONFIDENCE
   */
  private calculateOverallConfidence(executives: ExecutiveContact[]): number {
    if (executives['length'] === 0) return 0;
    
    const totalConfidence = executives.reduce((sum, exec) => sum + exec.confidenceScore, 0);
    return Math.round(totalConfidence / executives.length);
  }

  /**
   * 📋 EXTRACT RESEARCH METHODS
   */
  private extractResearchMethods(executives: ExecutiveContact[]): string[] {
    const methods = new Set<string>();
    executives.forEach(exec => {
      exec.researchMethods.forEach(method => methods.add(method));
    });
    return Array.from(methods);
  }

  /**
   * 🎯 GENERATE BUYER GROUP ANALYSIS
   */
  private async generateBuyerGroupAnalysis(executives: ExecutiveContact[], account: any): Promise<any> {
    try {
      const { BuyerGroupAnalysis } = await import('../modules/BuyerGroupAnalysis');
      const buyerGroupAnalysis = new BuyerGroupAnalysis(this.config);

      const companyContext = {
        companyName: account.metadata?.resolution?.companyName || account.name,
        industry: account.industry,
        size: account.size,
        website: account.metadata?.resolution?.finalUrl || account.website,
        dealSize: account.dealSize
      };

      // Get user context for buyer group analysis
      const userContext = {
        userId: account.userId || 'unknown',
        workspaceId: account.workspaceId || 'unknown',
        // TODO: Get actual user/workspace data from database
        userCompany: {
          name: 'Adrata', // Default - should come from workspace
          industry: 'Sales Intelligence',
          products: ['Executive Discovery', 'Buyer Group Intelligence'],
          targetMarket: 'Enterprise B2B'
        },
        sellingContext: {
          productCategory: 'Sales Intelligence Software',
          averageDealSize: account.dealSize || 250000,
          salesCycle: '3-6 months',
          targetRoles: ['CFO', 'CRO', 'CEO', 'CTO']
        }
      };

      return await buyerGroupAnalysis.analyzeBuyerGroup(executives, companyContext, userContext);
    } catch (error) {
      console.error(`❌ [BUYER GROUP] Analysis failed:`, error);
      
      // Fallback buyer group
      return {
        decisionMaker: executives.find(e => e['role'] === 'CFO'),
        champion: executives.find(e => e['role'] === 'CEO'),
        influencers: executives.filter(e => e.role.startsWith('VP_')),
        blockers: [],
        budgetAuthority: 'CFO approval likely required',
        decisionStyle: 'Executive-led decision making',
        salesCycleEstimate: '3-6 months',
        routingStrategy: ['Start with CFO', 'Engage technical stakeholders'],
        confidence: 75
      };
    }
  }

  /**
   * 🔄 UPDATE RESEARCH SESSION
   */
  private async updateResearchSession(sessionId: string, updates: Partial<ResearchSession>): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      this.activeSessions.set(sessionId, session);
    }
  }

  /**
   * 📊 GET SESSION STATUS
   */
  async getSessionStatus(sessionId: string): Promise<ResearchSession | null> {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * 🧹 CLEANUP COMPLETED SESSIONS
   */
  async cleanupSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.createdAt < cutoff && (session['status'] === 'completed' || session['status'] === 'failed')) {
        this.activeSessions.delete(sessionId);
        console.log(`🧹 [CLEANUP] Removed old session: ${sessionId}`);
      }
    }
  }
}
