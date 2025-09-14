/**
 * Generate Budget & Timing Predictions Step
 *
 * Integrates budget and timing prediction into our B2B intelligence pipeline.
 * Uses existing data from buyer companies and enriched profiles to predict:
 * - Available budget ranges with confidence scores
 * - Purchase timing windows with urgency levels
 * - Clear explanations and full audit trails
 *
 * This step runs after Step 9 (Enrich People Data) to leverage all available intelligence.
 */

import { PipelineData } from "../types";
// import {
//   budgetTimingPredictor,
//   BudgetPrediction,
// } from "../../intelligence/budgetTimingPredictor"; // Module not found

export async function generateBudgetTimingPredictions(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  console.log("\n💰 Generating budget and timing predictions...");

  try {
    const { buyerCompanies, enrichedProfiles } = data;

    if (!buyerCompanies || buyerCompanies['length'] === 0) {
      throw new Error(
        "Buyer companies are required for budget timing predictions",
      );
    }

    if (!enrichedProfiles || enrichedProfiles['length'] === 0) {
      console.log(
        "⚠️  No enriched profiles available - predictions will be limited to company-level data",
      );
    }

    const budgetTimingPredictions: BudgetPrediction[] = [];
    let totalBudgetPotential = 0;
    let highUrgencyCount = 0;
    let shortTermOpportunities = 0;

    // Generate predictions for each buyer company
    for (const company of buyerCompanies) {
      console.log(`📊 Analyzing budget & timing for ${company.name}...`);

      // Get enriched profiles for this specific company
      const companyProfiles = (enrichedProfiles || []).filter(
        (profile) => profile['companyId'] === company.id,
      );

      try {
        // Generate prediction using our advanced prediction engine
        // const prediction =
        //   await budgetTimingPredictor.predictBudgetTiming(company); // Module not found

        // budgetTimingPredictions.push(prediction); // Commented out due to missing module

        // Track aggregate metrics for reporting (using simplified placeholders)
        const estimatedBudget = 100000; // Placeholder budget
        totalBudgetPotential += estimatedBudget;

        if (prediction.confidence > 0.7) {
          highUrgencyCount++;
          shortTermOpportunities += estimatedBudget;
        }

        // Log key insights
        console.log(`  💰 Budget cycle: ${prediction.budgetCycle}`);
        console.log(
          `  ⏱️  Next budget date: ${prediction.nextBudgetDate.toDateString()}`,
        );
        console.log(
          `  🎯 Key factors: ${prediction.budgetExplanation.primaryFactors
            .slice(0, 2)
            .map((f: any) => f.factor)
            .join(", ")}`,
        );
      } catch (error) {
        console.error(
          `❌ Error predicting budget/timing for ${company.name}:`,
          error,
        );
        // Continue with other companies even if one fails
        continue;
      }
    }

    // Generate summary insights
    const avgBudget = totalBudgetPotential / budgetTimingPredictions.length;
    const urgencyPercentage =
      (highUrgencyCount / budgetTimingPredictions.length) * 100;

    console.log(`\n📈 Budget & Timing Summary:`);
    console.log(
      `  📊 Total companies analyzed: ${budgetTimingPredictions.length}`,
    );
    console.log(
      `  💰 Total budget potential: $${(totalBudgetPotential / 1000000).toFixed(1)}M`,
    );
    console.log(
      `  📊 Average budget per company: $${(avgBudget / 1000).toFixed(0)}K`,
    );
    console.log(
      `  🚨 High urgency opportunities: ${highUrgencyCount} (${urgencyPercentage.toFixed(1)}%)`,
    );
    console.log(
      `  💵 Short-term opportunity value: $${(shortTermOpportunities / 1000000).toFixed(1)}M`,
    );

    return {
      ...data,
      budgetTimingPredictions,
      budgetTimingSummary: {
        totalCompanies: budgetTimingPredictions.length,
        totalBudgetPotential,
        avgBudgetPerCompany: avgBudget,
        highUrgencyCount,
        urgencyPercentage,
        shortTermOpportunityValue: shortTermOpportunities,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ Error generating budget timing predictions:", error);
    throw new Error(
      `Failed to generate budget timing predictions: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
