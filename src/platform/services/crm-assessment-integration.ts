/**
 * Pipeline Assessment Integration Service
 *
 * Implements Patent Claim 1, 2, 9, 11, 14, 16:
 * "supplementing the current Pipeline data within the second computing platform by transmitting,
 * for each of said in-process sales opportunities, from the first computing platform to the
 * second computing platform, said macro sales opportunity data and said predicted pipeline
 * change data, for storage by the second computing platform"
 *
 * Seamlessly integrates with existing Adrata Pipeline via Prisma schema
 */

import { PrismaClient } from "@prisma/client";
import { SalesIntelligenceEngine } from "./salesIntelligenceEngine";
import { RevenueAttributionEngine } from "./revenue-attribution-engine";

const prisma = new PrismaClient();

export interface CRMAssessmentData {
  opportunityId: string;
  assessmentData: {
    // Macro model outputs
    predictedTimeToClose: number;
    expectedRevenue: number;
    closeProbability: number;
    confidenceScore: number;

    // Micro model outputs
    nextStageTransition: string;
    transitionProbability: number;
    stagnationRisk: string;

    // Ensemble outputs
    overallScore: number;
    naturalLanguageAssessment: string;
    keyInsights: string[];
    recommendedActions: string[];
    riskAssessment: string;

    // Metadata
    lastAssessmentDate: Date;
    assessmentVersion: string;
  };
}

export class CRMAssessmentIntegration {
  private static salesEngine = new SalesIntelligenceEngine();

  /**
   * Patent Implementation: Feed assessment data back to CRM
   * Integrates with existing Opportunity model in Prisma schema
   */
  static async supplementCRMData(
    workspaceId: string,
    opportunities: any[],
  ): Promise<{
    supplementedCount: number;
    assessments: CRMAssessmentData[];
    errors: Array<{ opportunityId: string; error: string }>;
  }> {
    if (process['env']['NODE_ENV'] === "development") {
      console.log(
        `🔄 Supplementing Pipeline data with patent assessments for ${opportunities.length} opportunities`,
      );
    }

    const assessments: CRMAssessmentData[] = [];
    const errors: Array<{ opportunityId: string; error: string }> = [];
    let supplementedCount = 0;

    for (const opportunity of opportunities) {
      try {
        // Generate assessment using existing sales intelligence engine
        const assessment = await this.salesEngine.generateAutomatedAssessment(
          opportunity.id,
        );

        // Create assessment data in patent format
        const crmAssessmentData: CRMAssessmentData = {
          opportunityId: opportunity.id,
          assessmentData: {
            predictedTimeToClose: assessment.macroPredictions.timeToClose.days,
            expectedRevenue: assessment.macroPredictions.expectedRevenue.amount,
            closeProbability:
              assessment.macroPredictions.closeProbability.percentage,
            confidenceScore: assessment.confidence,
            nextStageTransition:
              assessment.microPredictions.nextStageTransition.stage,
            transitionProbability:
              assessment.microPredictions.nextStageTransition.probability,
            stagnationRisk: assessment.microPredictions.stagnationRisk.level,
            overallScore: assessment.ensembleAssessment.overallScore,
            naturalLanguageAssessment:
              assessment.ensembleAssessment.naturalLanguageAssessment,
            keyInsights: assessment.ensembleAssessment.keyInsights,
            recommendedActions:
              assessment.ensembleAssessment.recommendedActions.map(
                (a) => a.action,
              ),
            riskAssessment: assessment.ensembleAssessment.riskAssessment,
            lastAssessmentDate: new Date(),
            assessmentVersion: "2.0",
          },
        };

        // Update Pipeline opportunity record with assessment data (using existing schema)
        await prisma.opportunities.update({
          where: { id: opportunity.id },
          data: {
            // Use existing Prisma fields
            probability:
              assessment.macroPredictions.closeProbability.percentage,
            expectedCloseDate: new Date(
              Date.now() +
                assessment.macroPredictions.timeToClose.days *
                  24 *
                  60 *
                  60 *
                  1000,
            ),
            amount: assessment.macroPredictions.expectedRevenue.amount,
            stage: assessment.microPredictions.nextStageTransition.stage,
            riskScore: this.calculateRiskScore(assessment),

            // Store full assessment in notes/description for now (can be moved to separate table later)
            description: this.formatAssessmentForCRM(assessment),
            updatedAt: new Date(),
          },
        });

        // Create assessment record in existing database
        await this.createAssessmentRecord(workspaceId, crmAssessmentData);

        assessments.push(crmAssessmentData);
        supplementedCount++;

        if (process['env']['NODE_ENV'] === "development") {
          console.log(
            `✅ Supplemented opportunity ${opportunity.id} with patent assessment`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Failed to supplement opportunity ${opportunity.id}:`,
          error,
        );
        errors.push({
          opportunityId: opportunity.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (process['env']['NODE_ENV'] === "development") {
      console.log(
        `🎯 Pipeline supplementation complete: ${supplementedCount}/${opportunities.length} opportunities updated`,
      );
    }

    return {
      supplementedCount,
      assessments,
      errors,
    };
  }

  /**
   * Batch update opportunities with patent assessments
   * Integrates with existing Monaco pipeline
   */
  static async batchSupplementOpportunities(
    workspaceId: string,
  ): Promise<void> {
    if (process['env']['NODE_ENV'] === "development") {
      console.log("🔄 Running batch Pipeline supplementation...");
    }

    // Get all active opportunities from existing schema
    const opportunities = await prisma.opportunities.findMany({
      where: {
        workspaceId,
        stage: { notIn: ["Closed Won", "Closed Lost"] },
        deletedAt: null,
      },
      include: {
        account: true,
        stakeholders: {
          include: {
            contact: true,
            person: true,
          },
        },
        activities: {
          take: 20,
          orderBy: { scheduledDate: "desc" },
        },
      },
    });

    if (opportunities['length'] === 0) {
      if (process['env']['NODE_ENV'] === "development") {
        console.log("ℹ️  No active opportunities found for supplementation");
      }
      return;
    }

    // Supplement in batches of 10 to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < opportunities.length; i += batchSize) {
      const batch = opportunities.slice(i, i + batchSize);
      await this.supplementCRMData(workspaceId, batch);

      // Brief pause between batches
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Create assessment record using existing schema patterns
   */
  private static async createAssessmentRecord(
    workspaceId: string,
    assessmentData: CRMAssessmentData,
  ): Promise<void> {
    // Use existing EnrichmentExecution pattern for storing assessments
    const executionId = `patent_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await prisma.enrichmentExecution.create({
      data: {
        executionId,
        workspaceId,
        triggerUserId: "system", // System-generated assessment
        status: "completed",
        type: "patent_assessment",
        totalSteps: 1,
        completedCompanies: 1,
        totalCompanies: 1,
        triggerData: {
          opportunityId: assessmentData.opportunityId,
          assessmentData: assessmentData.assessmentData,
          patentCompliant: true,
        },
        intelligence: assessmentData.assessmentData,
        companiesEnriched: [assessmentData.opportunityId],
        errors: [],
      },
    });
  }

  /**
   * Format assessment for Pipeline display
   */
  private static formatAssessmentForCRM(assessment: any): string {
    return `
PATENT INTELLIGENCE ASSESSMENT

Overall Score: ${assessment.ensembleAssessment.overallScore}/100
Close Probability: ${assessment.macroPredictions.closeProbability.percentage}%
Expected Revenue: $${assessment.macroPredictions.expectedRevenue.amount.toLocaleString()}
Time to Close: ${assessment.macroPredictions.timeToClose.days} days
Next Stage: ${assessment.microPredictions.nextStageTransition.stage}

Assessment: ${assessment.ensembleAssessment.naturalLanguageAssessment}

Key Insights:
${assessment.ensembleAssessment.keyInsights.map((insight: string) => `• ${insight}`).join("\n")}

Recommended Actions:
${assessment.ensembleAssessment.recommendedActions.map((action: any) => `• ${action.action}`).join("\n")}

Risk Assessment: ${assessment.ensembleAssessment.riskAssessment}

Generated: ${new Date().toISOString()}
Confidence: ${Math.round(assessment.confidence * 100)}%
    `.trim();
  }

  /**
   * Calculate risk score using existing schema field
   */
  private static calculateRiskScore(assessment: any): number {
    const probability = assessment.macroPredictions.closeProbability.percentage;
    const stagnationRisk = assessment.microPredictions.stagnationRisk.level;

    let riskScore = 1 - probability / 100; // Higher probability = lower risk

    if (stagnationRisk === "High") riskScore += 0.3;
    else if (stagnationRisk === "Medium") riskScore += 0.1;

    return Math.min(1, Math.max(0, riskScore));
  }

  /**
   * Calculate action priority using existing schema field
   */
  private static calculateActionPriority(assessment: any): string {
    const overallScore = assessment.ensembleAssessment.overallScore;
    const stagnationRisk = assessment.microPredictions.stagnationRisk.level;

    if (overallScore > 80 || stagnationRisk === "High") return "High";
    if (overallScore > 60) return "Medium";
    return "Low";
  }

  /**
   * Get assessment history for an opportunity
   */
  static async getAssessmentHistory(opportunityId: string): Promise<any[]> {
    const executions = await prisma.enrichmentExecution.findMany({
      where: {
        type: "patent_assessment",
        triggerData: {
          path: ["opportunityId"],
          equals: opportunityId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return executions.map((exec) => ({
      date: exec.createdAt,
      assessmentData: (exec.triggerData as any)?.assessmentData,
      status: exec.status,
    }));
  }
}
