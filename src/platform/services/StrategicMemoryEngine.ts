import { PrismaClient } from "@prisma/client";

// Validate required environment variables
if (!process['env']['DATABASE_URL']) {
  throw new Error("DATABASE_URL environment variable is required");
}

interface ActionContext {
  leadId?: string;
  companyId?: string;
  workspaceId: string;
  actionType: string;
  actionData: any;
  businessStage: "acquisition" | "retention" | "expansion";
  kpiCategory:
    | "revenue"
    | "conversion"
    | "engagement"
    | "churn_prevention"
    | "efficiency";
}

interface BusinessOutcome {
  outcome: "positive" | "negative" | "neutral";
  outcomeValue?: number;
  confidenceScore: number;
  actualResults?: any;
}

interface KPIMetrics {
  monthlyRecurringRevenue: number;
  customerAcquisitionCost: number;
  churnRate: number;
  conversionRate: number;
  avgDealSize: number;
  salesCycleLength: number;
  customerLifetimeValue: number;
  netPromoterScore: number;
}

interface StrategicPrediction {
  predictedOutcome: "positive" | "negative" | "neutral";
  predictedValue: number;
  confidence: number;
  reasoning: any;
  kpiImpact: Partial<KPIMetrics>;
}

export class StrategicMemoryEngine {
  private static instance: StrategicMemoryEngine;
  private prisma: PrismaClient;
  private learningRate = 0.1;
  private explorationRate = 0.2;
  private memoryDecay = 0.95;

  private constructor() {
    this['prisma'] = new PrismaClient({
      datasourceUrl: process['env']['DATABASE_URL'] || process['env']['DIRECT_URL'],
    });
  }

  static getInstance(): StrategicMemoryEngine {
    if (!StrategicMemoryEngine.instance) {
      StrategicMemoryEngine['instance'] = new StrategicMemoryEngine();
    }
    return StrategicMemoryEngine.instance;
  }

  /**
   * Predict the business impact of a proposed action using reinforcement learning
   */
  async predictBusinessImpact(
    context: ActionContext,
  ): Promise<StrategicPrediction> {
    try {
      // Get relevant historical weights for this context
      const weights = await this.getStrategicWeights(context);

      // Calculate base prediction using weighted historical outcomes
      const basePrediction = await this.calculateBasePrediction(
        context,
        weights,
      );

      // Apply contextual adjustments based on current market conditions
      const contextualPrediction = await this.applyContextualAdjustments(
        basePrediction,
        context,
      );

      // Calculate KPI impact predictions
      const kpiImpact = await this.predictKPIImpact(
        context,
        contextualPrediction,
      );

      // Generate AI reasoning for the prediction
      const reasoning = await this.generatePredictionReasoning(
        context,
        contextualPrediction,
        weights,
      );

      // Store the prediction for future learning
      await this.storePrediction(
        context,
        contextualPrediction,
        reasoning,
        kpiImpact,
      );

      return {
        predictedOutcome: contextualPrediction.outcome,
        predictedValue: contextualPrediction.value,
        confidence: contextualPrediction.confidence,
        reasoning,
        kpiImpact,
      };
    } catch (error) {
      console.error("Error predicting business impact:", error);
      return {
        predictedOutcome: "neutral",
        predictedValue: 0,
        confidence: 0.5,
        reasoning: { error: "Prediction failed", fallback: true },
        kpiImpact: {},
      };
    }
  }

  /**
   * Record the actual outcome of an action and update learning weights
   */
  async recordOutcome(
    actionId: string,
    outcome: BusinessOutcome,
    actualKPIChanges?: Partial<KPIMetrics>,
  ): Promise<void> {
    try {
      // Find the prediction
      const prediction = await this.prisma.business_impact_predictions.findFirst({
        where: { id: actionId },
      });

      if (!prediction) {
        throw new Error(`Prediction not found for action ${actionId}`);
      }

      // Calculate prediction accuracy
      const accuracy = this.calculatePredictionAccuracy(prediction, outcome);

      // Update the prediction with actual results
      await this.prisma.business_impact_predictions.update({
        where: { id: actionId },
        data: {
          actualOutcome: outcome.outcome,
          actualValue: outcome.outcomeValue,
          predictionAccuracy: accuracy,
        },
      });

      // Record the strategic action outcome
      await this.prisma.strategic_action_outcomes.create({
        data: {
          workspaceId: prediction.workspaceId,
          leadId: prediction.leadId,
          companyId: prediction.companyId,
          actionType: prediction.actionType,
          actionData: prediction.actionData as any,
          outcome: outcome.outcome,
          outcomeValue: outcome.outcomeValue,
          confidenceScore: outcome.confidenceScore,
          businessStage: prediction.businessStage,
          kpiCategory: prediction.kpiCategory,
        },
      });

      // Update KPIs if provided
      if (actualKPIChanges) {
        await this.updateKPIs(prediction.workspaceId, actualKPIChanges);
      }

      // Update strategic weights based on this outcome (Reinforcement Learning)
      await this.updateStrategicWeights(prediction, outcome, accuracy);

      // Generate new insights based on this outcome
      await this.generateStrategicInsights(
        prediction.workspaceId,
        prediction,
        outcome,
      );
    } catch (error) {
      console.error("Error recording outcome:", error);
      throw error;
    }
  }

  /**
   * Get current business KPIs for a workspace
   */
  async getBusinessKPIs(workspaceId: string): Promise<KPIMetrics> {
    try {
      const kpis = await this.prisma.business_kpis.findMany({
        where: { workspaceId },
        orderBy: { lastCalculated: "desc" },
      });

      const kpiMap = kpis.reduce((acc, kpi) => {
        acc[kpi.kpiName] = kpi.currentValue;
        return acc;
      }, {} as any);

      return {
        monthlyRecurringRevenue: kpiMap.monthly_recurring_revenue || 0,
        customerAcquisitionCost: kpiMap.customer_acquisition_cost || 0,
        churnRate: kpiMap.churn_rate || 0,
        conversionRate: kpiMap.conversion_rate || 0,
        avgDealSize: kpiMap.avg_deal_size || 0,
        salesCycleLength: kpiMap.sales_cycle_length || 0,
        customerLifetimeValue: kpiMap.customer_lifetime_value || 0,
        netPromoterScore: kpiMap.net_promoter_score || 0,
      };
    } catch (error) {
      console.error("Error getting KPIs:", error);
      return {
        monthlyRecurringRevenue: 0,
        customerAcquisitionCost: 0,
        churnRate: 0,
        conversionRate: 0,
        avgDealSize: 0,
        salesCycleLength: 0,
        customerLifetimeValue: 0,
        netPromoterScore: 0,
      };
    }
  }

  /**
   * Get strategic insights for business optimization
   */
  async getStrategicInsights(workspaceId: string, limit = 10): Promise<any[]> {
    try {
      return await this.prisma.strategic_insights.findMany({
        where: { workspaceId },
        orderBy: [
          { impactPotential: "desc" },
          { confidence: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
      });
    } catch (error) {
      console.error("Error getting strategic insights:", error);
      return [];
    }
  }

  /**
   * Calculate the optimal next action for a lead/company
   */
  async getOptimalNextAction(
    workspaceId: string,
    leadId?: string,
    companyId?: string,
  ): Promise<any> {
    try {
      // Get possible actions based on current context
      const possibleActions = await this.generatePossibleActions(
        workspaceId,
        leadId,
        companyId,
      );

      if (possibleActions['length'] === 0) {
        return null;
      }

      // Predict outcomes for each action
      const actionPredictions = await Promise.all(
        possibleActions.map((action) => this.predictBusinessImpact(action)),
      );

      if (actionPredictions['length'] === 0) {
        return null;
      }

      // Find the action with highest expected value
      const firstPrediction = actionPredictions[0];
      if (!firstPrediction) {
        return null;
      }

      const optimalAction = actionPredictions.reduce(
        (best, current, index) => {
          const expectedValue = current.predictedValue * current.confidence;
          const bestExpectedValue = best.prediction
            ? best.prediction.predictedValue * best.prediction.confidence
            : 0;

          return expectedValue > bestExpectedValue
            ? { action: possibleActions[index], prediction: current }
            : best;
        },
        { action: possibleActions[0], prediction: firstPrediction },
      );

      if (!optimalAction.prediction) {
        return null;
      }

      return {
        recommendedAction: optimalAction.action,
        prediction: optimalAction.prediction,
        alternatives: actionPredictions
          .map((pred, i) => ({ action: possibleActions[i], prediction: pred }))
          .filter(
            (_, i) =>
              i !==
              actionPredictions.findIndex(
                (p) => p === optimalAction.prediction,
              ),
          )
          .sort(
            (a, b) =>
              b.prediction.predictedValue * b.prediction.confidence -
              a.prediction.predictedValue * a.prediction.confidence,
          )
          .slice(0, 3),
      };
    } catch (error) {
      console.error("Error getting optimal next action:", error);
      return null;
    }
  }

  // Private helper methods

  private async getStrategicWeights(context: ActionContext): Promise<any[]> {
    return await this.prisma.strategic_weights.findMany({
      where: {
        workspaceId: context.workspaceId,
        actionType: context.actionType,
        businessStage: context.businessStage,
        kpiCategory: context.kpiCategory,
      },
      orderBy: { confidence: "desc" },
    });
  }

  private async calculateBasePrediction(
    context: ActionContext,
    weights: any[],
  ): Promise<any> {
    if (weights['length'] === 0) {
      return { outcome: "neutral", value: 0, confidence: 0.5 };
    }

    const weightedSum = weights.reduce(
      (sum, weight) => sum + weight.weight * weight.confidence,
      0,
    );
    const totalConfidence = weights.reduce(
      (sum, weight) => sum + weight.confidence,
      0,
    );

    const avgWeight = totalConfidence > 0 ? weightedSum / totalConfidence : 0.5;

    return {
      outcome:
        avgWeight > 0.6 ? "positive" : avgWeight < 0.4 ? "negative" : "neutral",
      value: avgWeight * 100,
      confidence: Math.min(totalConfidence / weights.length, 1.0),
    };
  }

  private async applyContextualAdjustments(
    basePrediction: any,
    context: ActionContext,
  ): Promise<any> {
    // Apply business stage multipliers
    const stageMultipliers = {
      acquisition: 1.2,
      retention: 1.0,
      expansion: 1.1,
    };

    // Apply KPI category multipliers
    const kpiMultipliers = {
      revenue: 1.3,
      conversion: 1.1,
      engagement: 1.0,
      churn_prevention: 1.2,
      efficiency: 0.9,
    };

    const stageMultiplier = stageMultipliers[context.businessStage] || 1.0;
    const kpiMultiplier = kpiMultipliers[context.kpiCategory] || 1.0;

    return {
      ...basePrediction,
      value: basePrediction.value * stageMultiplier * kpiMultiplier,
      confidence: Math.min(basePrediction.confidence * 1.1, 1.0),
    };
  }

  private async predictKPIImpact(
    context: ActionContext,
    prediction: any,
  ): Promise<Partial<KPIMetrics>> {
    // This would use ML models to predict specific KPI impacts
    // For now, using heuristics based on action type and business stage
    const impact: Partial<KPIMetrics> = {};

    if (
      context['businessStage'] === "acquisition" &&
      prediction['outcome'] === "positive"
    ) {
      impact['conversionRate'] = prediction.value * 0.01;
      impact['customerAcquisitionCost'] = -prediction.value * 0.5;
    }

    if (
      context['businessStage'] === "expansion" &&
      prediction['outcome'] === "positive"
    ) {
      impact['avgDealSize'] = prediction.value * 2;
      impact['customerLifetimeValue'] = prediction.value * 5;
    }

    return impact;
  }

  private async generatePredictionReasoning(
    context: ActionContext,
    prediction: any,
    weights: any[],
  ): Promise<any> {
    return {
      factors: {
        historicalPerformance: weights.length > 0 ? "Strong" : "Limited",
        businessStage: context.businessStage,
        kpiCategory: context.kpiCategory,
        confidence: prediction.confidence,
      },
      keyInsights: [
        `Action type "${context.actionType}" has ${weights.length} historical data points`,
        `Business stage "${context.businessStage}" typically shows ${prediction.outcome} outcomes`,
        `Confidence level: ${(prediction.confidence * 100).toFixed(1)}%`,
      ],
      recommendations: this.generateActionRecommendations(context, prediction),
    };
  }

  private generateActionRecommendations(
    context: ActionContext,
    prediction: any,
  ): string[] {
    const recommendations = [];

    if (prediction.confidence < 0.7) {
      recommendations.push("Consider gathering more data before taking action");
    }

    if (prediction['outcome'] === "positive") {
      recommendations.push("Proceed with action - high probability of success");
    } else if (prediction['outcome'] === "negative") {
      recommendations.push("Consider alternative approaches or timing");
    }

    return recommendations;
  }

  private async storePrediction(
    context: ActionContext,
    prediction: any,
    reasoning: any,
    kpiImpact: any,
  ): Promise<string> {
    const result = await this.prisma.business_impact_predictions.create({
      data: {
        workspaceId: context.workspaceId,
        leadId: context.leadId,
        companyId: context.companyId,
        actionType: context.actionType,
        actionData: context.actionData,
        predictedOutcome: prediction.outcome,
        predictedValue: prediction.value,
        confidence: prediction.confidence,
        businessStage: context.businessStage,
        kpiCategory: context.kpiCategory,
        reasoning,
      },
    });

    return result.id;
  }

  private calculatePredictionAccuracy(
    prediction: any,
    outcome: BusinessOutcome,
  ): number {
    const outcomeCorrect =
      prediction['predictedOutcome'] === outcome.outcome ? 1 : 0;
    const valueAccuracy = outcome.outcomeValue
      ? 1 -
        Math.abs(prediction.predictedValue - outcome.outcomeValue) /
          Math.max(prediction.predictedValue, outcome.outcomeValue, 1)
      : 0.5;

    return outcomeCorrect * 0.7 + valueAccuracy * 0.3;
  }

  private async updateStrategicWeights(
    prediction: any,
    outcome: BusinessOutcome,
    accuracy: number,
  ): Promise<void> {
    const contextKey = `${prediction.actionType}_${prediction.businessStage}_${prediction.kpiCategory}`;

    // Find or create weight record
    const existingWeight = await this.prisma.strategic_weights.findFirst({
      where: {
        workspaceId: prediction.workspaceId,
        actionType: prediction.actionType,
        businessStage: prediction.businessStage,
        kpiCategory: prediction.kpiCategory,
      },
    });

    if (existingWeight) {
      // Update existing weight using reinforcement learning
      const reward =
        outcome['outcome'] === "positive"
          ? 1
          : outcome['outcome'] === "negative"
            ? -1
            : 0;
      const newWeight =
        existingWeight.weight +
        this.learningRate * (reward - existingWeight.weight);
      const newConfidence = Math.min(
        existingWeight.confidence + accuracy * 0.1,
        1.0,
      );

      await this.prisma.strategic_weights.update({
        where: { id: existingWeight.id },
        data: {
          weight: newWeight,
          confidence: newConfidence,
          sampleSize: existingWeight.sampleSize + 1,
          lastUpdated: new Date(),
        },
      });
    } else {
      // Create new weight
      const initialWeight =
        outcome['outcome'] === "positive"
          ? 0.7
          : outcome['outcome'] === "negative"
            ? 0.3
            : 0.5;

      await this.prisma.strategic_weights.create({
        data: {
          workspaceId: prediction.workspaceId,
          actionType: prediction.actionType,
          contextFactors: {},
          businessStage: prediction.businessStage,
          kpiCategory: prediction.kpiCategory,
          weight: initialWeight,
          confidence: accuracy,
          sampleSize: 1,
        },
      });
    }
  }

  private async updateKPIs(
    workspaceId: string,
    changes: Partial<KPIMetrics>,
  ): Promise<void> {
    for (const [kpiName, change] of Object.entries(changes)) {
      if (change === undefined) continue;

      const dbKpiName = this.convertKPIName(kpiName);

      const existingKPI = await this.prisma.business_kpis.findFirst({
        where: {
          workspaceId,
          kpiName: dbKpiName,
          measurementPeriod: "monthly",
        },
      });

      if (existingKPI) {
        const newValue = existingKPI.currentValue + change;
        const changePercent =
          existingKPI.currentValue !== 0
            ? ((newValue - existingKPI.currentValue) /
                existingKPI.currentValue) *
              100
            : 0;

        await this.prisma.business_kpis.update({
          where: { id: existingKPI.id },
          data: {
            previousValue: existingKPI.currentValue,
            currentValue: newValue,
            changePercent,
            lastCalculated: new Date(),
          },
        });
      } else {
        await this.prisma.business_kpis.create({
          data: {
            workspaceId,
            kpiName: dbKpiName,
            kpiCategory: this.getKPICategory(kpiName),
            currentValue: change,
            measurementPeriod: "monthly",
          },
        });
      }
    }
  }

  private convertKPIName(camelCase: string): string {
    return camelCase.replace(/([A-Z])/g, "_$1").toLowerCase();
  }

  private getKPICategory(kpiName: string): string {
    const categoryMap: Record<string, string> = {
      monthlyRecurringRevenue: "revenue",
      customerAcquisitionCost: "acquisition",
      churnRate: "retention",
      conversionRate: "acquisition",
      avgDealSize: "revenue",
      salesCycleLength: "efficiency",
      customerLifetimeValue: "retention",
      netPromoterScore: "retention",
    };

    return categoryMap[kpiName] || "efficiency";
  }

  private async generateStrategicInsights(
    workspaceId: string,
    prediction: any,
    outcome: BusinessOutcome,
  ): Promise<void> {
    // Generate insights based on the outcome pattern
    if (
      outcome['outcome'] === "positive" &&
      prediction['predictedOutcome'] === "negative"
    ) {
      await this.prisma.strategic_insights.create({
        data: {
          workspaceId,
          insightType: "pattern_discovery",
          title: "Unexpected Positive Outcome",
          description: `Action type "${prediction.actionType}" performed better than predicted in ${prediction.businessStage} stage`,
          businessStage: prediction.businessStage,
          kpiCategory: prediction.kpiCategory,
          impactPotential: 0.8,
          confidence: 0.7,
          actionable: true,
          supportingData: {
            prediction: JSON.parse(JSON.stringify(prediction)),
            outcome: JSON.parse(JSON.stringify(outcome)),
          },
          recommendedActions: [
            "Investigate success factors",
            "Replicate approach",
          ],
          status: "new",
        },
      });
    }
  }

  private async generatePossibleActions(
    workspaceId: string,
    leadId?: string,
    companyId?: string,
  ): Promise<ActionContext[]> {
    // Generate possible actions based on current context
    const baseActions = [
      "outreach_email",
      "outreach_linkedin",
      "content_sharing",
      "meeting_request",
      "proposal_generation",
      "follow_up",
      "intelligence_research",
    ];

    return baseActions.map((actionType) => ({
      workspaceId,
      leadId,
      companyId,
      actionType,
      actionData: { generated: true },
      businessStage: leadId ? "acquisition" : ("expansion" as const),
      kpiCategory: "conversion" as const,
    }));
  }

  async destroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
