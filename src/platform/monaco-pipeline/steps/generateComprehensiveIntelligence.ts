/**
 * Step 25: Generate Comprehensive Intelligence
 * Orchestrates all intelligence services to provide comprehensive, actionable insights
 */

import { PipelineStep, PipelineData, EnrichedProfile } from "../types";
import { intelligenceOrchestrator } from "../../services/intelligenceOrchestrator";

interface ComprehensiveIntelligenceResult {
  intelligenceReports: Record<string, ComprehensiveIntelligence>; // Properly typed instead of any
  summary: {
    totalCompaniesAnalyzed: number;
    averageIntelligenceScore: number;
    highPriorityOpportunities: number;
    immediateActionsRequired: number;
  };
  actionItems: Array<{
    companyId: string;
    companyName: string;
    priority: "critical" | "high" | "medium" | "low";
    action: string;
    timing: string;
    confidence: number;
  }>;
}

interface ComprehensiveIntelligence {
  companyId: string;
  companyName: string;
  overallScore: number;
  intelligenceTypes: Record<string, unknown>;
  prioritizedInsights: Array<{
    type: string;
    priority: string;
    confidence: number;
  }>;
  engagementStrategy: {
    timing?: {
      immediate?: Array<{ type: string; message: string }>;
    };
  };
  confidenceMetrics: {
    overall: number;
  };
}

function getPriorityScore(priority: string): number {
  switch (priority) {
    case "critical":
      return 100;
    case "high":
      return 75;
    case "medium":
      return 50;
    case "low":
      return 25;
    default:
      return 0;
  }
}

export const generateComprehensiveIntelligence: PipelineStep = {
  id: 25,
  name: "Generate Comprehensive Intelligence",
  description:
    "Orchestrate all intelligence services to provide actionable insights for each buyer company",

  validate: (data: PipelineData) => {
    return !!(data.buyerCompanies?.length && data.enrichedProfiles?.length);
  },

  run: async (data: PipelineData) => {
    console.log("\n🧠 Generating comprehensive intelligence...");

    try {
      const intelligenceReports: Record<string, ComprehensiveIntelligence> = {};
      const actionItems: Array<{
        companyId: string;
        companyName: string;
        priority: "critical" | "high" | "medium" | "low";
        action: string;
        timing: string;
        confidence: number;
      }> = [];
      let totalScore = 0;
      let highPriorityCount = 0;
      let immediateActionsCount = 0;

      // Process each buyer company
      for (const company of data.buyerCompanies) {
        console.log(`\n📊 Analyzing intelligence for ${company.name}...`);

        // Get key people for this company
        const keyPeople = (data.enrichedProfiles || [])
          .filter(
            (profile: EnrichedProfile) => profile['companyId'] === company.id,
          )
          .map((profile: EnrichedProfile) => ({
            id: profile['personId'],
            name: profile['personName'],
            title: profile['title'],
            companyId: profile['companyId'],
            linkedinUrl: profile['linkedinUrl'],
            email: profile['email'] || "",
            phone: profile['phone'] || "",
            influence: profile['influence'],
            decisionPower: 0.5, // Default value
            department: profile['experience']?.[0]?.company || "Unknown",
            level: 1, // Default value
            directReports: [],
            connections: 0,
            followers: 0,
            postFrequency: 0,
            activityScore: 0.5,
            seniorityLevel: "mid",
          }))
          .slice(0, 5); // Top 5 people per company

        if (keyPeople['length'] === 0) {
          console.log(
            `⚠️  No key people found for ${company.name}, skipping intelligence generation`,
          );
          continue;
        }

        try {
          // Generate comprehensive intelligence
          const intelligence =
            await intelligenceOrchestrator.generateComprehensiveIntelligence(
              company,
              keyPeople,
            );

          intelligenceReports[company.id] = intelligence;
          totalScore += intelligence.overallScore;

          // Count high-priority opportunities
          const highPriorityInsights = intelligence.prioritizedInsights.filter(
            (insight) => ["critical", "high"].includes(insight.priority),
          );
          highPriorityCount += highPriorityInsights.length;

          // Count immediate actions
          const immediateActions =
            intelligence.engagementStrategy?.timing?.immediate || [];
          immediateActionsCount += immediateActions.length;

          // Create action items
          for (const insight of intelligence.prioritizedInsights.slice(0, 3)) {
            // Top 3 per company
            actionItems.push({
              companyId: company.id,
              companyName: company.name,
              priority: insight.priority,
              action: insight.title,
              timing: insight.urgency,
              confidence: insight.confidence,
            });
          }

          // Log key findings
          console.log(
            `   📈 Intelligence Score: ${intelligence.overallScore}/100`,
          );
          console.log(
            `   🎯 Priority Insights: ${highPriorityInsights.length}`,
          );
          console.log(`   ⚡ Immediate Actions: ${immediateActions.length}`);
          console.log(
            `   🔍 Data Quality: Social ${intelligence.intelligenceTypes?.social?.dataQuality || "unknown"}, Tech ${intelligence.intelligenceTypes?.technology?.dataQuality || "unknown"}, Business ${intelligence.intelligenceTypes?.business?.dataQuality || "unknown"}, Intent ${intelligence.intelligenceTypes?.intent?.dataQuality || "unknown"}`,
          );
        } catch (error) {
          console.error(
            `❌ Error generating intelligence for ${company.name}:`,
            error,
          );
          // Continue with other companies
        }
      }

      const processedCompanies = Object.keys(intelligenceReports).length;
      const averageScore =
        processedCompanies > 0
          ? Math.round(totalScore / processedCompanies)
          : 0;

      // Sort action items by priority and confidence
      actionItems.sort((a, b) => {
        const priorityScore =
          getPriorityScore(b.priority) - getPriorityScore(a.priority);
        const confidenceScore = (b.confidence - a.confidence) * 100;
        return priorityScore + confidenceScore;
      });

      const result: ComprehensiveIntelligenceResult = {
        intelligenceReports,
        summary: {
          totalCompaniesAnalyzed: processedCompanies,
          averageIntelligenceScore: averageScore,
          highPriorityOpportunities: highPriorityCount,
          immediateActionsRequired: immediateActionsCount,
        },
        actionItems: actionItems.slice(0, 20), // Top 20 action items
      };

      console.log("\n📊 Comprehensive Intelligence Summary:");
      console.log(
        `   🏢 Companies Analyzed: ${result.summary.totalCompaniesAnalyzed}`,
      );
      console.log(
        `   📈 Average Intelligence Score: ${result.summary.averageIntelligenceScore}/100`,
      );
      console.log(
        `   🎯 High-Priority Opportunities: ${result.summary.highPriorityOpportunities}`,
      );
      console.log(
        `   ⚡ Immediate Actions Required: ${result.summary.immediateActionsRequired}`,
      );
      console.log(
        `   📋 Top Action Items Generated: ${result.actionItems.length}`,
      );

      // Log top 5 action items
      console.log("\n🎯 Top Priority Actions:");
      for (const [index, action] of result.actionItems.slice(0, 5).entries()) {
        console.log(
          `   ${index + 1}. [${action.priority.toUpperCase()}] ${action.companyName}: ${action.action} (${Math.round(action.confidence * 100)}% confidence)`,
        );
      }

      return {
        comprehensiveIntelligence: result,
      };
    } catch (error) {
      console.error(
        "❌ Error in comprehensive intelligence generation:",
        error,
      );
      throw new Error(`Comprehensive intelligence generation failed: ${error}`);
    }
  },
};
