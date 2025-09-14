import {
  PipelineState,
  PipelineData,
  PipelineStep,
  PipelineConfig,
  SellerProfile,
} from "./types";
import fs from "fs/promises";
import { defineSellerProfile } from "./steps/defineSellerProfile";
import { identifySellerCompetitors } from "./steps/identifySellerCompetitors";
import { findOptimalBuyers } from "./steps/findOptimalBuyers";
import { downloadPeopleData } from "./steps/downloadPeopleData";
import { findOptimalPeople } from "./steps/findOptimalPeople";
import { analyzeOrgStructure } from "./steps/analyzeOrgStructure";
import { modelOrgStructure } from "./steps/modelOrgStructure";
import { analyzeInfluence } from "./steps/analyzeInfluence";
import { enrichPeopleData } from "./steps/enrichPeopleData";
import { identifyBuyerGroups } from "./steps/identifyBuyerGroups";
import { analyzeBuyerGroupDynamics } from "./steps/analyzeBuyerGroupDynamics";
import { traceDecisionJourneys } from "./steps/traceDecisionJourneys";
import { identifyDecisionMakers } from "./steps/identifyDecisionMakers";
import { generateIntelligenceReports } from "./steps/generateIntelligenceReports";
import { generateEnablementAssets } from "./steps/generateEnablementAssets";
import { generateHypermodernReports } from "./steps/generateHypermodernReports";
import { generateAuthorityContent } from "./steps/generateAuthorityContent";
import { generateOpportunitySignals } from "./steps/generateOpportunitySignals";
import { generateOpportunityPlaybooks } from "./steps/generateOpportunityPlaybooks";
import { generateEngagementPlaybooks } from "./steps/generateEngagementPlaybooks";
import { generateCompetitorBattlecards } from "./steps/generateCompetitorBattlecards";
import { generateSalesPlaybooks } from "./steps/generateSalesPlaybooks";
import { generateOutreachSequences } from "./steps/generateOutreachSequences";
import { generateComprehensiveIntelligence } from "./steps/generateComprehensiveIntelligence";
import { analyzeFlightRisk } from "./steps/analyzeFlightRisk";
import { analyzeFlightRiskImpact } from "./steps/analyzeFlightRiskImpact";
import { analyzeCatalystInfluence } from "./steps/analyzeCatalystInfluence";
import { enrichAlternativeData } from "./steps/enrichAlternativeData";
import { analyzeExecutiveCharacterPatterns } from "./steps/analyzeExecutiveCharacterPatterns";

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 0,
    name: "Define Seller Profile",
    description: "Define your company's profile and target criteria",
    run: defineSellerProfile,
    validate: (data) => !!data.sellerProfile,
  },
  {
    id: 1,
    name: "Identify Seller Competitors",
    description: "Identify and analyze your competitors",
    run: identifySellerCompetitors,
    validate: (data) => !!data.sellerProfile,
  },
  {
    id: 2,
    name: "Find Optimal Buyers",
    description: "Find and score potential buyer companies",
    run: findOptimalBuyers,
    validate: (data) => data.competitors.length > 0,
  },
  {
    id: 3,
    name: "Download People Data",
    description: "Download and enrich people data",
    run: downloadPeopleData,
    validate: (data) => data.buyerCompanies.length > 0,
  },
  {
    id: 4,
    name: "Find Optimal People",
    description: "Rank and score people based on influence and role fit",
    run: findOptimalPeople,
    validate: (data) => data.peopleData.length > 0, // Need people data from step 4
  },
  {
    id: 5,
    name: "Analyze Org Structure",
    description: "Analyze company organizational structures",
    run: analyzeOrgStructure,
    validate: (data) => data.peopleData.length > 0, // Need people data to analyze org structure
  },
  {
    id: 6,
    name: "Model Org Structure",
    description: "Model organizational hierarchies",
    run: modelOrgStructure,
    validate: (data) => data.orgStructures.length > 0, // Need org structures from step 6
  },
  {
    id: 7,
    name: "Analyze Influence",
    description: "Analyze power dynamics and influence",
    run: analyzeInfluence,
    validate: (data) => !!data.orgModels, // Need org models from step 7
  },
  {
    id: 8,
    name: "Enrich People Data",
    description: "Enrich people profiles with additional data",
    run: enrichPeopleData,
    validate: (data) => !!data.influenceAnalyses, // Need influence analysis from step 8
  },
  {
    id: 9,
    name: "Analyze Flight Risk",
    description:
      "Analyze the likelihood of key personnel leaving their positions",
    run: analyzeFlightRisk,
    validate: (data) => !!data.enrichedProfiles, // Need enriched profiles from step 9
  },
  {
    id: 10,
    name: "Analyze Flight Risk Impact",
    description:
      "Analyze how personnel flight risk impacts sales deals and identify alternatives",
    run: analyzeFlightRiskImpact,
    validate: (data) => !!data.flightRiskAnalyses, // Need flight risk data from step 10
  },
  {
    id: 11,
    name: "Analyze Catalyst Influence",
    description:
      "Analyze influence metrics for key relationships and business partners",
    run: analyzeCatalystInfluence,
    validate: (data) => !!data.dealImpactAnalyses, // Need deal impact analysis from step 11
  },
  {
    id: 12,
    name: "Enrich Alternative Data",
    description:
      "Add high-value alternative data sources for comprehensive business intelligence",
    run: enrichAlternativeData,
    validate: (data) => !!data.enrichedProfiles, // Need enriched profiles for alternative data
  },
  {
    id: 13,
    name: "Identify Buyer Groups",
    description: "Identify key buyer groups within companies",
    run: identifyBuyerGroups,
    validate: (data) =>
      !!data['alternativeDataReports'] && data.alternativeDataReports.length > 0, // Need alternative data from step 13
  },
  {
    id: 14,
    name: "Analyze Buyer Group Dynamics",
    description:
      "Analyze internal dynamics and relationships within buyer groups",
    run: analyzeBuyerGroupDynamics,
    validate: (data) => data.buyerGroups.length > 0, // Need buyer groups from step 14
  },
  {
    id: 15,
    name: "Trace Decision Journeys",
    description: "Map out decision-making processes",
    run: traceDecisionJourneys,
    validate: (data) => !!data.buyerGroupDynamics, // Need buyer group dynamics from step 15
  },
  {
    id: 16,
    name: "Identify Decision Makers",
    description: "Identify key decision makers within buyer groups",
    validate: (data: PipelineData) => !!data.decisionFlows, // Need decision flows from step 16
    run: (data: PipelineData) => identifyDecisionMakers.run(data),
  },
  {
    id: 17,
    name: "Generate Intelligence Reports",
    description: "Generate comprehensive intelligence reports",
    run: generateIntelligenceReports,
    validate: (data) => data.buyerGroups.length > 0 && !!data.decisionFlows, // Need buyer groups and decision flows
  },
  {
    id: 18,
    name: "Generate Enablement Assets",
    description: "Create sales enablement materials",
    run: generateEnablementAssets,
    validate: (data) => data.intelligenceReports.length > 0, // Need intelligence reports from step 18
  },
  {
    id: 19,
    name: "Generate Hypermodern Reports",
    description: "Create modern, visually appealing reports",
    run: generateHypermodernReports,
    validate: (data) => data.enablementAssets.length > 0, // Need enablement assets from step 19
  },
  {
    id: 20,
    name: "Generate Authority Content",
    description: "Create thought leadership content",
    run: generateAuthorityContent,
    validate: (data) => !!data.hypermodernReports, // Need hypermodern reports from step 20
  },
  {
    id: 21,
    name: "Generate Opportunity Signals",
    description: "Generate opportunity signals and alerts",
    run: generateOpportunitySignals,
    validate: (data) => !!data.authorityContent, // Need authority content from step 21
  },
  {
    id: 22,
    name: "Generate Opportunity Playbooks",
    description: "Create opportunity playbooks",
    run: generateOpportunityPlaybooks,
    validate: (data) => !!data.opportunitySignals, // Need opportunity signals from step 22
  },
  {
    id: 23,
    name: "Generate Engagement Playbooks",
    description: "Create engagement playbooks",
    run: generateEngagementPlaybooks,
    validate: (data) => !!data.opportunityPlaybooks, // Need opportunity playbooks from step 23
  },
  {
    id: 24,
    name: "Generate Competitor Battlecards",
    description: "Create competitor battlecards",
    run: generateCompetitorBattlecards,
    validate: (data) => !!data.engagementPlaybooks, // Need engagement playbooks from step 24
  },
  {
    id: 25,
    name: "Generate Sales Playbooks",
    description: "Create sales playbooks",
    run: generateSalesPlaybooks,
    validate: (data) => !!data.competitorBattlecards, // Need competitor battlecards from step 25
  },
  {
    id: 26,
    name: "Generate Outreach Sequences",
    description: "Create outreach sequences",
    run: generateOutreachSequences,
    validate: (data) => !!data.salesPlaybooks, // Need sales playbooks from step 26
  },
  {
    id: 27,
    name: "Generate Comprehensive Intelligence",
    description:
      "Orchestrate all intelligence services to provide actionable insights",
    run: generateComprehensiveIntelligence.run,
    validate: (data) => !!data.outreachSequences, // Need outreach sequences from step 27
  },
  {
    id: 28,
    name: "Analyze Executive Character Patterns",
    description:
      'Analyze executive character patterns and behaviors inspired by "The Circle"',
    run: analyzeExecutiveCharacterPatterns.run,
    validate: (data) => !!data.comprehensiveIntelligence, // Need comprehensive intelligence from step 28
  },
];

export class Pipeline {
  private state: PipelineState;
  private config: PipelineConfig;
  private data: PipelineData;
  private steps: PipelineStep[];

  constructor(config: PipelineConfig) {
    this['config'] = config;
    this['state'] = {
      currentStep: 0,
      totalSteps: 29,
      status: "pending",
      outputFiles: {},
    };

    // Initialize seller profile from config
    const sellerProfile: SellerProfile = {
      id: `seller_${Date.now()}`,
      companyName: config.sellerProfile.companyName,
      industry: config.sellerProfile.industry,
      companySize: config.sellerProfile.companySize,
      product: config.sellerProfile.product,
      salesTeam: config.sellerProfile.salesTeam,
      targetMarkets: config.sellerProfile.targetMarkets,
      successCriteria: config.sellerProfile.successCriteria,
      lastUpdated: new Date(),
      annualRevenue: "$10M+",
      strategy: {
        marketPosition: "Challenger",
        targetSegments: ["Enterprise", "Mid-Market"],
        valueProposition: "AI-Powered Sales Intelligence",
        competitiveAdvantages: [
          "Real-time Data",
          "Advanced Analytics",
          "Comprehensive Intelligence",
        ],
      },
    };

    this['data'] = {
      sellerProfile,
      competitors: [],
      buyerCompanies: [],
      peopleData: [],
      orgStructures: [],
      buyerGroups: [],
      intelligenceReports: [],
      enablementAssets: [],
    };
    this['steps'] = PIPELINE_STEPS;
  }

  async run(): Promise<void> {
    this['state']['startTime'] = new Date();
    this['state']['status'] = "running";

    try {
      for (const step of this.steps) {
        this['state']['currentStep'] = step.id;

        // Validate input data
        if (!step.validate(this.data)) {
          throw new Error(
            `Validation failed for step ${step.id}: ${step.name}`,
          );
        }

        // Run step
        const stepOutput = await step.run(this.data);

        // Update pipeline data
        this['data'] = {
          ...this.data,
          ...stepOutput,
        };

        // Save step output
        await this.saveStepOutput(step.id, stepOutput);
      }

      this['state']['status'] = "completed";
    } catch (error) {
      this['state']['status'] = "error";
      this['state']['error'] = (error as Error).message;
      throw error;
    } finally {
      this['state']['endTime'] = new Date();
      await this.saveState();
    }
  }

  private async saveStepOutput(
    stepId: number,
    output: Partial<PipelineData>,
  ): Promise<void> {
    const outputPath = `${this.config.pipeline.outputDir}/step${stepId.toString().padStart(2, "0")}.json`;
    this.state['outputFiles'][`step${stepId}`] = outputPath;

    // Save to file system
    await this.saveToFile(outputPath, output);
  }

  private async saveState(): Promise<void> {
    const statePath = `${this.config.pipeline.outputDir}/pipeline_state.json`;
    await this.saveToFile(statePath, this.state);
  }

  private async saveToFile(
    path: string,
    data: PipelineState | Partial<PipelineData>,
  ): Promise<void> {
    await fs.writeFile(path, JSON.stringify(data, null, 2));
  }

  getState(): PipelineState {
    return { ...this.state };
  }

  getData(): PipelineData {
    return { ...this.data };
  }
}
