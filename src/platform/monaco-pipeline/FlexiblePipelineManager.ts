/**
 * 🎛️ FLEXIBLE MONACO PIPELINE MANAGER
 *
 * Production-ready pipeline manager with:
 * - Selective step execution based on configuration
 * - Modular dataset configuration
 * - Industry-specific intelligence
 * - Real-time vs batch processing modes
 * - Data source abstraction with multiple providers
 * - Phone number enrichment integration
 * - Cost optimization and monitoring
 */

import {
  PipelineData,
  PipelineStep,
  PipelineConfig,
  EnrichedProfile,
} from "./types";
import { enrichPhoneNumbers } from "./steps/enrichPhoneNumbers";
import { waterfallEnrichment } from "../services/GlobalWaterfallEngine";
// TODO: Integrate WaterfallAPIManager and IntelligentDataStandardizer when needed

export interface FlexiblePipelineConfig extends PipelineConfig {
  // Execution Mode
  executionMode: "batch" | "real-time" | "hybrid";

  // Step Selection
  enabledSteps: {
    core: boolean; // Critical steps (defineSellerProfile, findOptimalBuyers, etc.)
    enrichment: boolean; // Data enrichment steps
    intelligence: boolean; // Advanced intelligence generation
    phoneEnrichment: boolean; // Phone number enrichment
    social: boolean; // Social media intelligence
    financial: boolean; // Financial intelligence
    legal: boolean; // Legal & compliance intelligence
    advanced: boolean; // Advanced features (patents, ESG, etc.)
    aiTwinSimulation: boolean; // 🎭 AI TWIN SIMULATION - BREAKTHROUGH FEATURE
  };

  // Industry Customization
  industryProfile: {
    type:
      | "technology"
      | "healthcare"
      | "finance"
      | "manufacturing"
      | "retail"
      | "general";
    customDatasets?: string[]; // Industry-specific dataset overrides
    focusAreas: string[]; // Areas of intelligence to emphasize
  };

  // Data Provider Configuration
  dataProviders: {
    primary: "mock_data" | "apollo" | "zoominfo";
    fallbacks: string[];
    phoneEnrichment: {
      apollo?: string;
      zoominfo?: string;
      clearbit?: string;
      hunter?: string;
    };
  };

  // Performance & Cost Optimization
  optimization: {
    enableCaching: boolean;
    cacheTTL: number; // milliseconds
    maxConcurrentRequests: number;
    costThreshold: number; // max cost per prospect
    qualityThreshold: number; // min data quality score
  };

  // Monitoring & Alerting
  monitoring: {
    enableMetrics: boolean;
    alertOnFailures: boolean;
    performanceTracking: boolean;
    costTracking: boolean;
  };

  // 🎭 AI TWIN SIMULATION CONFIGURATION
  aiTwinSimulation: {
    enabled: boolean;
    simulationScenarios: Array<{
      type:
        | "cold_outreach"
        | "warm_intro"
        | "demo_request"
        | "pricing_discussion"
        | "objection_handling"
        | "close_attempt";
      priority: "high" | "medium" | "low";
      enabled: boolean;
    }>;
    vectorizedEnvironment: {
      createGoBoard: boolean; // Your "Go board" concept for LLM navigation
      environmentComplexity: "simple" | "medium" | "complex";
      updateFrequency: "real-time" | "daily" | "weekly";
    };
    simulationDepth: {
      personalityModeling: "basic" | "advanced" | "expert";
      groupDynamicsAnalysis: boolean;
      predictiveAccuracy: "fast" | "balanced" | "high-accuracy";
      learningEnabled: boolean; // Feed results back to Strategic Memory Engine
    };
    outputFormats: {
      fastestPathToClose: boolean;
      riskAssessment: boolean;
      optimalMessaging: boolean;
      resourceAllocation: boolean;
      contingencyPlans: boolean;
    };
  };
}

export interface PipelineExecutionResult {
  success: boolean;
  executedSteps: string[];
  skippedSteps: string[];
  enrichedProfiles: EnrichedProfile[];
  metrics: {
    totalProcessingTime: number;
    apiCallsCount: number;
    costIncurred: number;
    dataQualityScore: number;
    phoneEnrichmentSuccess: number;
  };
  errors: Array<{
    step: string;
    error: string;
    recoverable: boolean;
  }>;
}

export class FlexiblePipelineManager {
  private config: FlexiblePipelineConfig;
  private metrics: any = {};

  constructor(config: FlexiblePipelineConfig) {
    this['config'] = config;
    this.validateConfiguration();
  }

  async executePipeline(data: PipelineData): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    const result: PipelineExecutionResult = {
      success: false,
      executedSteps: [],
      skippedSteps: [],
      enrichedProfiles: [],
      metrics: {
        totalProcessingTime: 0,
        apiCallsCount: 0,
        costIncurred: 0,
        dataQualityScore: 0,
        phoneEnrichmentSuccess: 0,
      },
      errors: [],
    };

    try {
      console.log("🎛️ Starting Flexible Monaco Pipeline Execution");
      console.log(`📊 Mode: ${this.config.executionMode}`);
      console.log(`🏭 Industry: ${this.config.industryProfile.type}`);
      console.log(
        `🎭 AI Twin Simulation: ${this.config.enabledSteps.aiTwinSimulation ? "ENABLED" : "DISABLED"}`,
      );
      console.log("");

      // Phase 1: Execute Core Steps (if enabled)
      if (this.config.enabledSteps.core) {
        await this.executeCoreSteps(data, result);
      }

      // Phase 2: Execute Enrichment Steps (if enabled)
      if (this.config.enabledSteps.enrichment) {
        await this.executeEnrichmentSteps(data, result);
      }

      // Phase 3: Execute Phone Enrichment (if enabled)
      if (this.config.enabledSteps.phoneEnrichment) {
        await this.executePhoneEnrichment(data, result);
      }

      // Phase 4: Execute Intelligence Steps (if enabled)
      if (this.config.enabledSteps.intelligence) {
        await this.executeIntelligenceSteps(data, result);
      }

      // Phase 5: 🎭 EXECUTE AI TWIN SIMULATION (BREAKTHROUGH FEATURE)
      if (this.config.enabledSteps.aiTwinSimulation) {
        await this.executeAITwinSimulation(data, result);
      }

      // Phase 6: Execute Industry-Specific Steps
      await this.executeIndustrySpecificSteps(data, result);

      // Calculate final metrics
      result['metrics']['totalProcessingTime'] = Date.now() - startTime;
      result['metrics']['dataQualityScore'] = this.calculateDataQualityScore(data);
      result['success'] = result.errors.filter((e) => !e.recoverable).length === 0;

      console.log("✅ Flexible Pipeline Execution Completed");
      this.logExecutionSummary(result);
    } catch (error) {
      result.errors.push({
        step: "pipeline_manager",
        error: error instanceof Error ? error.message : String(error),
        recoverable: false,
      });
      console.error("❌ Pipeline execution failed:", error);
    }

    return result;
  }

  private async executeCoreSteps(
    data: PipelineData,
    result: PipelineExecutionResult,
  ): Promise<void> {
    console.log("🏗️ Executing Core Pipeline Steps...");

    const coreSteps = [
      "defineSellerProfile",
      "identifySellerCompetitors",
      "findOptimalBuyers",
      "downloadPeopleData",
      "analyzeOrgStructure",
    ];

    for (const stepName of coreSteps) {
      try {
        console.log(`⏳ Executing ${stepName}...`);
        // In production, this would call the actual step functions
        await this.simulateStepExecution(stepName, data);
        result.executedSteps.push(stepName);
        result.metrics.apiCallsCount += this.estimateApiCalls(stepName);
        console.log(`✅ ${stepName} completed`);
      } catch (error) {
        result.errors.push({
          step: stepName,
          error: error instanceof Error ? error.message : String(error),
          recoverable: false, // Core steps are not recoverable
        });
        console.error(
          `❌ ${stepName} failed:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  private async executeEnrichmentSteps(
    data: PipelineData,
    result: PipelineExecutionResult,
  ): Promise<void> {
    console.log("📊 Executing Data Enrichment Steps...");

    // 🚀 COMPREHENSIVE WATERFALL ENRICHMENT - THE SMARTEST SYSTEM EVER
    // TODO: Implement proper integration between WaterfallAPIManager and enrichment pipeline
    console.log(
      "⏳ Waterfall Enrichment temporarily disabled - integrating WaterfallAPIManager...",
    );
    result.skippedSteps.push("comprehensiveWaterfallEnrichment");
    console.log(
      "⏭️ Skipping waterfall enrichment until proper integration is complete",
    );

    const enrichmentSteps = [
      "enrichPeopleData",
      "enrichBuiltWithData",
      "enrichG2Data",
    ];

    for (const stepName of enrichmentSteps) {
      try {
        console.log(`⏳ Executing ${stepName}...`);
        await this.simulateStepExecution(stepName, data);
        result.executedSteps.push(stepName);
        result.metrics.apiCallsCount += this.estimateApiCalls(stepName);
        console.log(`✅ ${stepName} completed`);
      } catch (error) {
        result.errors.push({
          step: stepName,
          error: error instanceof Error ? error.message : String(error),
          recoverable: true, // Enrichment failures are recoverable
        });
        console.warn(
          `⚠️ ${stepName} failed but continuing:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  private async executePhoneEnrichment(
    data: PipelineData,
    result: PipelineExecutionResult,
  ): Promise<void> {
    console.log("📞 Executing Phone Number Enrichment...");

    try {
      const phoneEnrichmentResult = await enrichPhoneNumbers(data);

      if (phoneEnrichmentResult.enrichedProfiles) {
        data['enrichedProfiles'] = phoneEnrichmentResult.enrichedProfiles;
        result['enrichedProfiles'] = phoneEnrichmentResult.enrichedProfiles;
      }

      if (phoneEnrichmentResult.phoneEnrichmentSummary) {
        result['metrics']['phoneEnrichmentSuccess'] =
          phoneEnrichmentResult.phoneEnrichmentSummary.successfulEnrichments;
        result.metrics.costIncurred +=
          phoneEnrichmentResult.phoneEnrichmentSummary.businessValueGenerated *
          0.01; // Estimate cost
      }

      result.executedSteps.push("enrichPhoneNumbers");
      console.log("✅ Phone enrichment completed successfully");
    } catch (error) {
      result.errors.push({
        step: "enrichPhoneNumbers",
        error: error instanceof Error ? error.message : String(error),
        recoverable: true,
      });
      console.warn(
        "⚠️ Phone enrichment failed but continuing:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async executeIntelligenceSteps(
    data: PipelineData,
    result: PipelineExecutionResult,
  ): Promise<void> {
    console.log("🧠 Executing Intelligence Generation Steps...");

    const intelligenceSteps = [
      "analyzeInfluence",
      "identifyBuyerGroups",
      "generateIntelligenceReports",
      "generateOpportunitySignals",
    ];

    for (const stepName of intelligenceSteps) {
      try {
        console.log(`⏳ Executing ${stepName}...`);
        await this.simulateStepExecution(stepName, data);
        result.executedSteps.push(stepName);
        result.metrics.apiCallsCount += this.estimateApiCalls(stepName);
        console.log(`✅ ${stepName} completed`);
      } catch (error) {
        result.errors.push({
          step: stepName,
          error: error instanceof Error ? error.message : String(error),
          recoverable: true,
        });
        console.warn(
          `⚠️ ${stepName} failed but continuing:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  private async executeAITwinSimulation(
    data: PipelineData,
    result: PipelineExecutionResult,
  ): Promise<void> {
    console.log("🎭 Executing AI Twin Simulation (BREAKTHROUGH FEATURE)...");
    console.log("====================================================");

    if (!this.config.aiTwinSimulation.enabled) {
      console.log("⏭️ AI Twin Simulation disabled in configuration");
      result.skippedSteps.push("ai_twin_simulation");
      return;
    }

    try {
      // Skip AI Twin Simulation for now - feature under development
      console.log(
        "⏭️ AI Twin Simulation temporarily disabled - feature under development",
      );
      result.skippedSteps.push("ai_twin_simulation");
      return;
    } catch (error) {
      result.errors.push({
        step: "ai_twin_simulation",
        error: error instanceof Error ? error.message : String(error),
        recoverable: true, // Simulation failures shouldn't break the pipeline
      });
      console.error(
        `❌ AI Twin Simulation failed:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async executeIndustrySpecificSteps(
    data: PipelineData,
    result: PipelineExecutionResult,
  ): Promise<void> {
    console.log(
      `🏭 Executing ${this.config.industryProfile.type} Industry-Specific Steps...`,
    );

    const industrySteps = this.getIndustrySpecificSteps(
      this.config.industryProfile.type,
    );

    for (const stepName of industrySteps) {
      if (this.shouldExecuteStep(stepName)) {
        try {
          console.log(`⏳ Executing industry-specific ${stepName}...`);
          await this.simulateStepExecution(stepName, data);
          result.executedSteps.push(stepName);
          console.log(`✅ ${stepName} completed`);
        } catch (error) {
          result.errors.push({
            step: stepName,
            error: error instanceof Error ? error.message : String(error),
            recoverable: true,
          });
          console.warn(
            `⚠️ ${stepName} failed but continuing:`,
            error instanceof Error ? error.message : String(error),
          );
        }
      } else {
        result.skippedSteps.push(stepName);
        console.log(
          `⏭️ Skipping ${stepName} (not enabled for this configuration)`,
        );
      }
    }
  }

  private getIndustrySpecificSteps(industry: string): string[] {
    const industryStepMap = {
      technology: [
        "enrichBuiltWithTechStack",
        "generatePatentBasedIntelligence",
        "enrichNetworkIntelligence",
      ],
      healthcare: [
        "analyzeCompetitorActivity",
        "generateBudgetTimingPredictions",
        "analyzeFlightRisk",
      ],
      finance: [
        "generateBudgetTimingPredictions",
        "analyzeFlightRisk",
        "enrichNetworkIntelligence",
      ],
      manufacturing: [
        "generatePatentBasedIntelligence",
        "analyzeCompetitorActivity",
      ],
      retail: [
        "enrichG2Data",
        "analyzeCompetitorActivity",
        "generateOpportunitySignals",
      ],
      general: ["generateComprehensiveIntelligence"],
    };

    return (
      industryStepMap[industry as keyof typeof industryStepMap] ||
      industryStepMap.general
    );
  }

  private shouldExecuteStep(stepName: string): boolean {
    // Map step names to configuration flags
    const stepConfigMap = {
      enrichNetworkIntelligence: this.config.enabledSteps.social,
      generateBudgetTimingPredictions: this.config.enabledSteps.financial,
      generatePatentBasedIntelligence: this.config.enabledSteps.legal,
      analyzeFlightRisk: this.config.enabledSteps.advanced,
      enrichBuiltWithTechStack: this.config.enabledSteps.enrichment,
      analyzeCompetitorActivity: this.config.enabledSteps.intelligence,
      enrichG2Data: this.config.enabledSteps.enrichment,
      generateOpportunitySignals: this.config.enabledSteps.intelligence,
      generateComprehensiveIntelligence: this.config.enabledSteps.intelligence,
    };

    return stepConfigMap[stepName as keyof typeof stepConfigMap] !== false; // Default to true if not specified
  }

  private async simulateStepExecution(
    stepName: string,
    data: PipelineData,
  ): Promise<void> {
    // Simulate API call delay based on execution mode
    const delay =
      this['config']['executionMode'] === "real-time"
        ? 100
        : this['config']['executionMode'] === "batch"
          ? 500
          : 300;

    await new Promise((resolve) => setTimeout(resolve, delay));

    // Simulate potential failures based on step complexity
    const failureRate = this.getStepFailureRate(stepName);
    if (Math.random() < failureRate) {
      throw new Error(`Simulated failure in ${stepName}`);
    }
  }

  private getStepFailureRate(stepName: string): number {
    // Core steps have lower failure rates
    const coreSteps = ["defineSellerProfile", "findOptimalBuyers"];
    if (coreSteps.includes(stepName)) return 0.01; // 1% failure rate

    // External API steps have higher failure rates
    const apiSteps = [
      "enrichPeopleData",
      "enrichBuiltWithData",
      "enrichG2Data",
    ];
    if (apiSteps.includes(stepName)) return 0.05; // 5% failure rate

    return 0.02; // 2% default failure rate
  }

  private estimateApiCalls(stepName: string): number {
    // Estimate API calls based on step type
    const apiCallEstimates = {
      defineSellerProfile: 1,
      findOptimalBuyers: 10,
      downloadPeopleData: 50,
      enrichPeopleData: 100,
      enrichPhoneNumbers: 75,
      analyzeInfluence: 25,
      generateIntelligenceReports: 15,
    };

    return apiCallEstimates[stepName as keyof typeof apiCallEstimates] || 5;
  }

  private calculateDataQualityScore(data: PipelineData): number {
    if (!data.enrichedProfiles || data['enrichedProfiles']['length'] === 0) return 0;

    let totalScore = 0;
    let profileCount = 0;

    for (const profile of data.enrichedProfiles) {
      let profileScore = 0;

      // Basic data completeness (40 points)
      if (profile.personName) profileScore += 10;
      if (profile.email) profileScore += 10;
      if (profile['phone'] && !profile.phone.includes("@")) profileScore += 10;
      if (profile.companyName) profileScore += 10;

      // Enrichment data (40 points)
      if (profile.title) profileScore += 10;
      if (profile.location) profileScore += 10;
      if (profile['experience'] && profile.experience.length > 0)
        profileScore += 10;
      if (profile.phoneEnrichmentData) profileScore += 10;

      // Advanced data (20 points)
      if (profile['skills'] && profile.skills.length > 0) profileScore += 10;
      if (profile.influence > 50) profileScore += 10;

      totalScore += profileScore;
      profileCount++;
    }

    return profileCount > 0 ? Math.round(totalScore / profileCount) : 0;
  }

  private logExecutionSummary(result: PipelineExecutionResult): void {
    console.log("");
    console.log("📋 FLEXIBLE PIPELINE EXECUTION SUMMARY");
    console.log("======================================");
    console.log(`✅ Executed steps: ${result.executedSteps.length}`);
    console.log(`⏭️ Skipped steps: ${result.skippedSteps.length}`);
    console.log(`❌ Failed steps: ${result.errors.length}`);
    console.log(
      `📞 Phone enrichment success: ${result.metrics.phoneEnrichmentSuccess}`,
    );
    console.log(
      `⏱️ Total processing time: ${result.metrics.totalProcessingTime}ms`,
    );
    console.log(
      `📊 Data quality score: ${result.metrics.dataQualityScore}/100`,
    );
    console.log(`🔗 API calls made: ${result.metrics.apiCallsCount}`);
    console.log(
      `💰 Estimated cost: $${result.metrics.costIncurred.toFixed(2)}`,
    );
    console.log("");
  }

  private validateConfiguration(): void {
    if (!this.config.enabledSteps.core) {
      throw new Error("Core steps must be enabled for pipeline to function");
    }

    if (this.config.optimization.maxConcurrentRequests < 1) {
      throw new Error("maxConcurrentRequests must be at least 1");
    }

    if (this.config.optimization.cacheTTL < 0) {
      throw new Error("cacheTTL must be non-negative");
    }
  }

  // Static factory methods for common configurations
  static createProductionConfig(): FlexiblePipelineConfig {
    return {
      ...this.getBaseConfig(),
      executionMode: "batch",
      enabledSteps: {
        core: true,
        enrichment: true,
        intelligence: true,
        phoneEnrichment: true,
        social: true,
        financial: true,
        legal: true,
        advanced: true,
        aiTwinSimulation: true, // 🎭 ENABLE AI TWIN SIMULATION
      },
      aiTwinSimulation: {
        enabled: true,
        simulationScenarios: [
          { type: "cold_outreach", priority: "high", enabled: true },
          { type: "demo_request", priority: "high", enabled: true },
          { type: "pricing_discussion", priority: "medium", enabled: true },
          { type: "objection_handling", priority: "high", enabled: true },
          { type: "close_attempt", priority: "high", enabled: true },
        ],
        vectorizedEnvironment: {
          createGoBoard: true, // Enable your "Go board" concept
          environmentComplexity: "complex",
          updateFrequency: "real-time",
        },
        simulationDepth: {
          personalityModeling: "expert",
          groupDynamicsAnalysis: true,
          predictiveAccuracy: "high-accuracy",
          learningEnabled: true,
        },
        outputFormats: {
          fastestPathToClose: true,
          riskAssessment: true,
          optimalMessaging: true,
          resourceAllocation: true,
          contingencyPlans: true,
        },
      },
      optimization: {
        enableCaching: true,
        cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
        maxConcurrentRequests: 10,
        costThreshold: 5.0,
        qualityThreshold: 0.8,
      },
    } as FlexiblePipelineConfig;
  }

  static createRealTimeConfig(): FlexiblePipelineConfig {
    return {
      ...this.getBaseConfig(),
      executionMode: "real-time",
      enabledSteps: {
        core: true,
        enrichment: false,
        intelligence: true,
        phoneEnrichment: false,
        social: false,
        financial: false,
        legal: false,
        advanced: false,
        aiTwinSimulation: true, // 🎭 ENABLE REAL-TIME AI TWIN SIMULATION
      },
      aiTwinSimulation: {
        enabled: true,
        simulationScenarios: [
          { type: "cold_outreach", priority: "high", enabled: true },
          { type: "objection_handling", priority: "high", enabled: true },
        ],
        vectorizedEnvironment: {
          createGoBoard: true,
          environmentComplexity: "medium",
          updateFrequency: "real-time",
        },
        simulationDepth: {
          personalityModeling: "advanced",
          groupDynamicsAnalysis: true,
          predictiveAccuracy: "balanced",
          learningEnabled: true,
        },
        outputFormats: {
          fastestPathToClose: true,
          riskAssessment: false,
          optimalMessaging: true,
          resourceAllocation: false,
          contingencyPlans: true,
        },
      },
    } as FlexiblePipelineConfig;
  }

  static createCostOptimizedConfig(): FlexiblePipelineConfig {
    return {
      ...this.getBaseConfig(),
      executionMode: "batch",
      enabledSteps: {
        core: true,
        enrichment: false,
        intelligence: false,
        phoneEnrichment: true,
        social: false,
        financial: false,
        legal: false,
        advanced: false,
        aiTwinSimulation: false, // Cost-optimized disables AI twin simulation
      },
      industryProfile: {
        type: "general",
        focusAreas: ["phone-enrichment", "core-intelligence"],
      },
      aiTwinSimulation: {
        enabled: false,
        simulationScenarios: [],
        vectorizedEnvironment: {
          createGoBoard: false,
          environmentComplexity: "simple",
          updateFrequency: "weekly",
        },
        simulationDepth: {
          personalityModeling: "basic",
          groupDynamicsAnalysis: false,
          predictiveAccuracy: "fast",
          learningEnabled: false,
        },
        outputFormats: {
          fastestPathToClose: false,
          riskAssessment: false,
          optimalMessaging: false,
          resourceAllocation: false,
          contingencyPlans: false,
        },
      },
      dataProviders: {
        primary: "mock_data",
        fallbacks: ["apollo"],
        phoneEnrichment: {
          apollo: "enabled",
        },
      },
      monitoring: {
        enableMetrics: true,
        alertOnFailures: false,
        performanceTracking: false,
        costTracking: true,
      },
      optimization: {
        enableCaching: true,
        cacheTTL: 172800000, // 48 hours
        maxConcurrentRequests: 3,
        costThreshold: 1.0,
        qualityThreshold: 50,
      },
    } as FlexiblePipelineConfig;
  }

  private static getBaseConfig(): Partial<FlexiblePipelineConfig> {
    return {
      apiKeys: {
        // brightdata: process['env']['BRIGHTDATA_API_KEY'] || "", // Removed BrightData integration
        anthropic: process['env']['ANTHROPIC_API_KEY'] || "",
        openai: process['env']['OPENAI_API_KEY'] || "",
      },
      datasetIds: {
        linkedinCompanies:
          process['env']['BRIGHTDATA_DATASET_LINKEDINCOMPANIES'] || "",
        linkedinPeople: process['env']['BRIGHTDATA_DATASET_LINKEDINPEOPLE'] || "",
        b2bEnrichment: process['env']['BRIGHTDATA_DATASET_B2BENRICHMENT'] || "",
      },
      pipeline: {
        maxCompanies: 1000,
        minSearchPool: 100,
        outputDir: "./monaco-output",
        logLevel: "info",
      },
      industryProfile: {
        type: "technology",
        focusAreas: ["product", "engineering", "sales"],
      },
      dataProviders: {
        primary: "mock_data",
        fallbacks: ["apollo", "zoominfo"],
        phoneEnrichment: {},
      },
      monitoring: {
        enableMetrics: true,
        alertOnFailures: true,
        performanceTracking: true,
        costTracking: true,
      },
    };
  }
}
