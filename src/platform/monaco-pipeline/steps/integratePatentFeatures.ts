/**
 * Patent Features Integration - Monaco Pipeline Step
 *
 * Integrates all patent functionality seamlessly with existing pipeline
 */

import { PipelineData } from "../types";
import { CRMAssessmentIntegration } from "../../services/crm-assessment-integration";
import { SalespersonPerformanceEvaluation } from "../../services/salesperson-performance-evaluation";
import { AutomatedModelTraining } from "@/platform/ai/services/automated-model-training";

export async function integratePatentFeatures(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  console.log("\n🎯 Integrating Patent Intelligence Features...");

  try {
    const { buyerCompanies } = data;

    if (!buyerCompanies || buyerCompanies['length'] === 0) {
      console.log("⚠️  No buyer companies for patent integration");
      return data;
    }

    // 1. Pipeline Assessment Integration (Patent Claims 1, 2, 9, 11, 14, 16)
    console.log("📋 Executing Pipeline Assessment Integration...");
    const opportunities = buyerCompanies.map((company) => ({
      id: company.id,
      name: company.name,
      stage: "Build",
      amount: 50000,
      workspaceId: "default",
    }));

    const crmResults = await CRMAssessmentIntegration.supplementCRMData(
      "default", // Use default workspace for pipeline integration
      opportunities.slice(0, 3), // Limit to prevent overwhelming
    );

    // 2. Performance Evaluation (Patent Claim 17)
    console.log("🎯 Executing Performance Evaluation...");
    const evaluationPeriod = {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    let performanceResults: any[] = [];
    try {
      const teamInsights =
        await SalespersonPerformanceEvaluation.evaluateTeamPerformance(
          "default",
          evaluationPeriod,
        );
      performanceResults = teamInsights.teamMetrics.topPerformers;
    } catch (error) {
      console.log("⚠️  Performance evaluation skipped:", error);
    }

    // 3. Model Training (Patent Claim 7)
    console.log("🧠 Executing Model Training...");
    let trainingResults: any[] = [];
    try {
      trainingResults =
        await AutomatedModelTraining.executeScheduledTraining("default");
    } catch (error) {
      console.log("⚠️  Model training skipped:", error);
    }

    // Compile patent intelligence
    const patentBasedIntelligence = {
      crmAssessments: {
        supplementedOpportunities: crmResults.supplementedCount,
        totalAssessments: crmResults.assessments.length,
        errorCount: crmResults.errors.length,
      },
      performanceInsights: {
        evaluationsGenerated: performanceResults.length,
        topPerformers: performanceResults.slice(0, 3),
      },
      modelTraining: {
        modelsTrainedSuccessfully: trainingResults.filter(
          (r) => r['status'] === "completed",
        ).length,
        totalModels: trainingResults.length,
      },
    };

    console.log("✅ Patent Integration Summary:");
    console.log(
      `  📋 Pipeline Assessments: ${patentBasedIntelligence.crmAssessments.supplementedOpportunities} opportunities`,
    );
    console.log(
      `  🎯 Performance: ${patentBasedIntelligence.performanceInsights.evaluationsGenerated} evaluations`,
    );
    console.log(
      `  🧠 Training: ${patentBasedIntelligence.modelTraining.modelsTrainedSuccessfully} models trained`,
    );

    return {
      ...data,
      patentBasedIntelligence,
    };
  } catch (error) {
    console.error("❌ Patent integration failed:", error);
    return data;
  }
}
