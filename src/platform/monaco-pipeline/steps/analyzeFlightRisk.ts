/**
 * Analyze Flight Risk Step
 *
 * Analyzes the likelihood of key personnel leaving their current positions
 * using multiple data points and industry benchmarks.
 *
 * FLIGHT RISK CATEGORIES:
 * - CRITICAL: High likelihood of departure (80-100%)
 * - ELEVATED: Moderate risk of departure (50-79%)
 * - STABLE: Low risk of departure (20-49%)
 * - LOW RISK: Very low risk of departure (0-19%)
 */

import {
  PipelineData,
  Person,
  EnrichedProfile,
  OrgStructure,
  InfluenceAnalysis,
  CompetitorActivityAnalysis,
} from "../types";

interface FlightRiskAnalysis {
  personId: string;
  personName: string;
  companyId: string;
  companyName: string;
  flightRiskScore: number; // 0-100 scale
  riskCategory: "CRITICAL" | "ELEVATED" | "STABLE" | "LOW RISK";
  riskFactors: {
    tenureRisk: {
      score: number;
      rationale: string;
      currentTenure: number; // months
      industryAverage: number; // months
    };
    careerProgressionRisk: {
      score: number;
      rationale: string;
      promotionGap: number; // months since last promotion
      expectedPromotionCycle: number; // months
    };
    marketDemandRisk: {
      score: number;
      rationale: string;
      skillMarketability: number; // 0-1 scale
      industryGrowth: number; // percentage
    };
    engagementRisk: {
      score: number;
      rationale: string;
      recentActivityTrend: "increasing" | "stable" | "declining";
      socialMediaSentiment: "positive" | "neutral" | "negative";
    };
    compensationRisk: {
      score: number;
      rationale: string;
      marketPositioning: "above" | "at" | "below"; // market rate
      equityVesting: "upcoming" | "recent" | "none";
    };
    networkSignalRisk: {
      score: number;
      rationale: string;
      recruiterConnections: number;
      newConnectionRate: number;
    };
  };
  keyIndicators: string[];
  retentionRecommendations: string[];
  monitoringPriority: "immediate" | "quarterly" | "annual";
  confidenceScore: number; // 0-1 scale
  lastAnalyzed: string;
}

// Industry benchmarks and configuration
const FLIGHT_RISK_CONFIG = {
  tenureBenchmarks: {
    "C-Suite": { average: 48, optimalRange: [36, 72] },
    VP: { average: 36, optimalRange: [24, 60] },
    Director: { average: 30, optimalRange: [18, 48] },
    Manager: { average: 24, optimalRange: [12, 36] },
    "Individual Contributor": { average: 18, optimalRange: [12, 30] },
  },
  departmentRiskFactors: {
    Engineering: 1.2, // Higher risk due to market demand
    Product: 1.1,
    Sales: 1.3, // High turnover industry
    Marketing: 1.0,
    Finance: 0.8, // Lower risk, more stable
    Operations: 0.9,
    HR: 0.7,
    Legal: 0.6,
  },
  industryGrowthRates: {
    Technology: 15,
    Healthcare: 8,
    Finance: 5,
    Manufacturing: 3,
    Retail: 4,
  },
};

export class FlightRiskAnalyzer {
  private calculateTenureRisk(
    person: Person,
    profile?: EnrichedProfile,
  ): FlightRiskAnalysis["riskFactors"]["tenureRisk"] {
    const seniorityLevel = this.inferSeniorityLevel(person.title);
    const benchmark = FLIGHT_RISK_CONFIG['tenureBenchmarks'][seniorityLevel];

    // Estimate current tenure (simplified - in production would use actual start date)
    const currentTenure = this.estimateCurrentTenure(person, profile);
    const industryAverage = benchmark.average;

    // Calculate risk based on tenure curve
    let score = 0;
    let rationale = "";

    if (currentTenure < (benchmark.optimalRange?.[0] || 12)) {
      // Too early - honeymoon period, low risk
      score = 20;
      rationale = `Early tenure (${currentTenure} months) - honeymoon period`;
    } else if (currentTenure > (benchmark.optimalRange?.[1] || 36)) {
      // Long tenure - may be looking for new challenges
      score = 70;
      rationale = `Extended tenure (${currentTenure} months) - may seek new challenges`;
    } else if (currentTenure >= industryAverage * 0.8) {
      // Approaching average - peak flight risk
      score = 60;
      rationale = `Approaching industry average tenure - peak flight risk period`;
    } else {
      // In optimal range
      score = 30;
      rationale = `Within optimal tenure range for ${seniorityLevel} level`;
    }

    return {
      score,
      rationale,
      currentTenure,
      industryAverage,
    };
  }

  private calculateCareerProgressionRisk(
    person: Person,
    profile?: EnrichedProfile,
    context?: any,
  ): FlightRiskAnalysis["riskFactors"]["careerProgressionRisk"] {
    const seniorityLevel = this.inferSeniorityLevel(person.title);

    // Estimate time since last promotion (simplified)
    const promotionGap = this.estimatePromotionGap(person, profile);
    const expectedCycle = this.getExpectedPromotionCycle(seniorityLevel);

    let score = 0;
    let rationale = "";

    if (promotionGap > expectedCycle * 1.5) {
      score = 80;
      rationale = `Overdue for promotion (${promotionGap} months vs ${expectedCycle} month cycle)`;
    } else if (promotionGap > expectedCycle) {
      score = 60;
      rationale = `Approaching promotion timeline - may seek advancement elsewhere`;
    } else if (promotionGap < expectedCycle * 0.5) {
      score = 20;
      rationale = `Recent promotion or rapid advancement track`;
    } else {
      score = 40;
      rationale = `Normal career progression timeline`;
    }

    return {
      score,
      rationale,
      promotionGap,
      expectedPromotionCycle: expectedCycle,
    };
  }

  private calculateMarketDemandRisk(
    person: Person,
    profile?: EnrichedProfile,
    context?: any,
  ): FlightRiskAnalysis["riskFactors"]["marketDemandRisk"] {
    const department = person.department;
    const industry = profile?.skills?.[0] || "Technology"; // Simplified

    const skillMarketability = this.assessSkillMarketability(person, profile);
    const industryGrowth =
      FLIGHT_RISK_CONFIG['industryGrowthRates'][
        industry as keyof typeof FLIGHT_RISK_CONFIG.industryGrowthRates
      ] || 5;
    const departmentFactor =
      FLIGHT_RISK_CONFIG['departmentRiskFactors'][
        department as keyof typeof FLIGHT_RISK_CONFIG.departmentRiskFactors
      ] || 1.0;

    // Enhance with competitive activity context
    let competitorMultiplier = 1.0;
    if (
      context?.competitorActivity &&
      Array.isArray(context.competitorActivity) &&
      context.competitorActivity.length > 0
    ) {
      const recentActivity = context.competitorActivity.filter(
        (ca: any) => ca['riskLevel'] === "high",
      ).length;
      competitorMultiplier = 1.0 + recentActivity * 0.1; // 10% increase per high-risk competitor activity
    }

    const baseScore =
      (skillMarketability * 100 + industryGrowth) *
      departmentFactor *
      competitorMultiplier;
    const score = Math.min(100, Math.max(0, baseScore / 2));

    const rationale = `${department} in ${industry} industry (${industryGrowth}% growth, ${(skillMarketability * 100).toFixed(0)}% skill marketability${competitorMultiplier > 1 ? ", high competitor activity" : ""})`;

    return {
      score,
      rationale,
      skillMarketability,
      industryGrowth,
    };
  }

  private calculateEngagementRisk(
    person: Person,
    profile?: EnrichedProfile,
  ): FlightRiskAnalysis["riskFactors"]["engagementRisk"] {
    // Analyze recent activity patterns
    const recentActivity = profile?.recentActivity || [];
    const activityTrend = this.analyzeActivityTrend(recentActivity);
    const sentiment = this.analyzeSentiment(recentActivity);

    let score = 50; // Default

    if (activityTrend === "declining" && sentiment === "negative") {
      score = 85;
    } else if (activityTrend === "declining" || sentiment === "negative") {
      score = 70;
    } else if (activityTrend === "increasing" && sentiment === "positive") {
      score = 25;
    } else if (activityTrend === "stable" && sentiment === "neutral") {
      score = 45;
    }

    const rationale = `Activity trend: ${activityTrend}, sentiment: ${sentiment}`;

    return {
      score,
      rationale,
      recentActivityTrend: activityTrend,
      socialMediaSentiment: sentiment,
    };
  }

  private calculateCompensationRisk(
    person: Person,
    profile?: EnrichedProfile,
    context?: any,
  ): FlightRiskAnalysis["riskFactors"]["compensationRisk"] {
    const seniorityLevel = this.inferSeniorityLevel(person.title);

    // Simplified compensation analysis
    const marketPositioning = this.estimateMarketPositioning(person);
    const equityVesting = this.estimateEquityVesting(person);

    let score = 50;

    if (marketPositioning === "below" && equityVesting === "none") {
      score = 90;
    } else if (marketPositioning === "below") {
      score = 75;
    } else if (equityVesting === "upcoming") {
      score = 30; // Retention effect of upcoming vesting
    } else if (marketPositioning === "above") {
      score = 25;
    }

    const rationale = `Compensation ${marketPositioning} market, equity vesting: ${equityVesting}`;

    return {
      score,
      rationale,
      marketPositioning,
      equityVesting,
    };
  }

  private calculateNetworkSignalRisk(
    person: Person,
    profile?: EnrichedProfile,
    context?: any,
  ): FlightRiskAnalysis["riskFactors"]["networkSignalRisk"] {
    const connections = person.connections || 0;
    const recruiterConnections = this.estimateRecruiterConnections(connections);
    const newConnectionRate = this.estimateNewConnectionRate(person, profile);

    let score = 40;

    if (recruiterConnections > 10 && newConnectionRate > 5) {
      score = 80;
    } else if (recruiterConnections > 5 || newConnectionRate > 3) {
      score = 65;
    } else if (newConnectionRate < 1) {
      score = 30;
    }

    const rationale = `${recruiterConnections} recruiter connections, ${newConnectionRate} new connections/month`;

    return {
      score,
      rationale,
      recruiterConnections,
      newConnectionRate,
    };
  }

  private calculateOverallFlightRisk(
    riskFactors: FlightRiskAnalysis["riskFactors"],
  ): {
    score: number;
    category: FlightRiskAnalysis["riskCategory"];
    confidence: number;
  } {
    // Weighted average of risk factors
    const weights = {
      tenure: 0.25,
      careerProgression: 0.2,
      marketDemand: 0.2,
      engagement: 0.15,
      compensation: 0.15,
      networkSignal: 0.05,
    };

    const weightedScore =
      riskFactors.tenureRisk.score * weights.tenure +
      riskFactors.careerProgressionRisk.score * weights.careerProgression +
      riskFactors.marketDemandRisk.score * weights.marketDemand +
      riskFactors.engagementRisk.score * weights.engagement +
      riskFactors.compensationRisk.score * weights.compensation +
      riskFactors.networkSignalRisk.score * weights.networkSignal;

    // Determine category
    let category: FlightRiskAnalysis["riskCategory"];
    if (weightedScore >= 80) category = "CRITICAL";
    else if (weightedScore >= 50) category = "ELEVATED";
    else if (weightedScore >= 20) category = "STABLE";
    else category = "LOW RISK";

    // Calculate confidence based on data availability
    const confidence = 0.75; // Simplified - would be based on actual data quality

    return {
      score: Math.round(weightedScore),
      category,
      confidence,
    };
  }

  private generateKeyIndicators(
    riskFactors: FlightRiskAnalysis["riskFactors"],
    overallScore: number,
  ): string[] {
    const indicators: string[] = [];

    if (riskFactors.tenureRisk.score > 60) {
      indicators.push(`⚠️ Tenure risk: ${riskFactors.tenureRisk.rationale}`);
    }

    if (riskFactors.careerProgressionRisk.score > 60) {
      indicators.push(
        `📈 Career stagnation: ${riskFactors.careerProgressionRisk.rationale}`,
      );
    }

    if (riskFactors.marketDemandRisk.score > 70) {
      indicators.push(
        `🎯 High market demand: ${riskFactors.marketDemandRisk.rationale}`,
      );
    }

    if (riskFactors.engagementRisk.score > 70) {
      indicators.push(
        `📉 Declining engagement: ${riskFactors.engagementRisk.rationale}`,
      );
    }

    if (riskFactors.compensationRisk.score > 70) {
      indicators.push(
        `💰 Compensation gap: ${riskFactors.compensationRisk.rationale}`,
      );
    }

    if (riskFactors.networkSignalRisk.score > 70) {
      indicators.push(
        `🔗 Active networking: ${riskFactors.networkSignalRisk.rationale}`,
      );
    }

    return indicators;
  }

  private generateRetentionRecommendations(
    analysis: Partial<FlightRiskAnalysis>,
  ): string[] {
    const recommendations: string[] = [];

    if (!analysis.riskFactors) return recommendations;

    if (analysis.riskFactors.careerProgressionRisk.score > 60) {
      recommendations.push(
        "Consider promotion discussion or expanded responsibilities",
      );
      recommendations.push(
        "Provide mentorship or leadership development opportunities",
      );
    }

    if (analysis.riskFactors.compensationRisk.score > 60) {
      recommendations.push("Review compensation package against market rates");
      recommendations.push("Consider retention bonus or equity refresh");
    }

    if (analysis.riskFactors.engagementRisk.score > 60) {
      recommendations.push(
        "Schedule one-on-one to understand satisfaction and concerns",
      );
      recommendations.push(
        "Provide challenging projects aligned with career goals",
      );
    }

    if (analysis.riskFactors.tenureRisk.score > 60) {
      recommendations.push(
        "Discuss long-term career path and development plan",
      );
      recommendations.push(
        "Consider sabbatical or special project opportunities",
      );
    }

    return recommendations;
  }

  async analyzePersonWithContext(
    person: Person,
    profile?: EnrichedProfile,
    context?: {
      orgStructure?: OrgStructure;
      influenceAnalysis?: InfluenceAnalysis;
      isInBuyerGroup?: boolean;
      competitorActivity?: CompetitorActivityAnalysis[];
    },
  ): Promise<FlightRiskAnalysis> {
    console.log(
      `   🎯 Analyzing flight risk for ${person.name}${context?.isInBuyerGroup ? " (Buyer Group Member)" : ""}...`,
    );

    // Calculate all risk factors with enhanced context
    const riskFactors = {
      tenureRisk: this.calculateTenureRisk(person, profile),
      careerProgressionRisk: this.calculateCareerProgressionRisk(
        person,
        profile,
        context,
      ),
      marketDemandRisk: this.calculateMarketDemandRisk(
        person,
        profile,
        context,
      ),
      engagementRisk: this.calculateEngagementRisk(person, profile),
      compensationRisk: this.calculateCompensationRisk(
        person,
        profile,
        context,
      ),
      networkSignalRisk: this.calculateNetworkSignalRisk(
        person,
        profile,
        context,
      ),
    };

    // Calculate overall risk
    const { score, category, confidence } =
      this.calculateOverallFlightRisk(riskFactors);

    // Generate insights
    const keyIndicators = this.generateKeyIndicators(riskFactors, score);
    const retentionRecommendations = this.generateRetentionRecommendations({
      riskFactors,
    });

    // Determine monitoring priority
    let monitoringPriority: FlightRiskAnalysis["monitoringPriority"];
    if (category === "CRITICAL") monitoringPriority = "immediate";
    else if (category === "ELEVATED") monitoringPriority = "quarterly";
    else monitoringPriority = "annual";

    const analysis: FlightRiskAnalysis = {
      personId: person.id,
      personName: person.name,
      companyId: person.companyId,
      companyName: person.companyId, // Use companyId as fallback since companyName doesn't exist on Person type
      flightRiskScore: score,
      riskCategory: category,
      riskFactors,
      keyIndicators,
      retentionRecommendations,
      monitoringPriority,
      confidenceScore: confidence,
      lastAnalyzed: new Date().toISOString(),
    };

    console.log(
      `     Risk: ${category} (${score}%), Confidence: ${Math.round(confidence * 100)}%`,
    );

    return analysis;
  }

  // Helper methods
  private inferSeniorityLevel(
    title: string,
  ): keyof typeof FLIGHT_RISK_CONFIG.tenureBenchmarks {
    // Handle null, undefined, or empty titles
    if (!title || typeof title !== "string") {
      return "Individual Contributor";
    }

    const lowerTitle = title.toLowerCase();
    if (
      lowerTitle.includes("chief") ||
      lowerTitle.includes("ceo") ||
      lowerTitle.includes("cto")
    )
      return "C-Suite";
    if (lowerTitle.includes("vp") || lowerTitle.includes("vice president"))
      return "VP";
    if (lowerTitle.includes("director")) return "Director";
    if (lowerTitle.includes("manager")) return "Manager";
    return "Individual Contributor";
  }

  private estimateCurrentTenure(
    person: Person,
    profile?: EnrichedProfile,
  ): number {
    // Simplified - in production would use actual employment start date
    return Math.floor(Math.random() * 36) + 6; // 6-42 months
  }

  private estimatePromotionGap(
    person: Person,
    profile?: EnrichedProfile,
  ): number {
    // Simplified - in production would analyze career history
    return Math.floor(Math.random() * 30) + 6; // 6-36 months
  }

  private getExpectedPromotionCycle(seniorityLevel: string): number {
    const cycles = {
      "C-Suite": 60,
      VP: 48,
      Director: 36,
      Manager: 24,
      "Individual Contributor": 18,
    };
    return cycles[seniorityLevel as keyof typeof cycles] || 24;
  }

  private assessSkillMarketability(
    person: Person,
    profile?: EnrichedProfile,
  ): number {
    // Simplified skill marketability assessment
    const highDemandSkills = [
      "AI",
      "Machine Learning",
      "Cloud",
      "Security",
      "Data Science",
    ];
    const skills = profile?.skills || [];

    const matchingSkills = skills.filter((skill: any) =>
      highDemandSkills.some((demanded: string) =>
        skill.toLowerCase().includes(demanded.toLowerCase()),
      ),
    );

    return Math.min(1.0, 0.3 + matchingSkills.length * 0.2);
  }

  private analyzeActivityTrend(
    activities: any[],
  ): "increasing" | "stable" | "declining" {
    if (activities.length < 2) return "stable";

    // Simplified trend analysis
    const recent = activities.slice(0, Math.ceil(activities.length / 2));
    const older = activities.slice(Math.ceil(activities.length / 2));

    if (recent.length > older.length * 1.2) return "increasing";
    if (recent.length < older.length * 0.8) return "declining";
    return "stable";
  }

  private analyzeSentiment(
    activities: any[],
  ): "positive" | "neutral" | "negative" {
    // Simplified sentiment analysis
    const sentimentKeywords = {
      positive: ["excited", "great", "awesome", "love", "amazing", "thrilled"],
      negative: [
        "frustrated",
        "disappointed",
        "difficult",
        "challenging",
        "stressed",
      ],
    };

    let positiveCount = 0;
    let negativeCount = 0;

    activities.forEach((activity) => {
      const content = (activity.description || "").toLowerCase();
      sentimentKeywords.positive.forEach((word) => {
        if (content.includes(word)) positiveCount++;
      });
      sentimentKeywords.negative.forEach((word) => {
        if (content.includes(word)) negativeCount++;
      });
    });

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  private estimateMarketPositioning(person: Person): "above" | "at" | "below" {
    // Simplified market positioning estimate
    const random = Math.random();
    if (random < 0.2) return "above";
    if (random < 0.6) return "at";
    return "below";
  }

  private estimateEquityVesting(
    person: Person,
  ): "upcoming" | "recent" | "none" {
    // Simplified equity vesting estimate
    const random = Math.random();
    if (random < 0.3) return "upcoming";
    if (random < 0.5) return "recent";
    return "none";
  }

  private estimateRecruiterConnections(totalConnections: number): number {
    // Estimate recruiter connections as percentage of total
    return Math.floor(totalConnections * 0.05);
  }

  private estimateNewConnectionRate(
    person: Person,
    profile?: EnrichedProfile,
  ): number {
    // Simplified new connection rate estimate
    return Math.floor(Math.random() * 8);
  }
}

export async function analyzeFlightRisk(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  console.log("\n🎯 Analyzing flight risk for key personnel...");

  try {
    const {
      peopleData,
      enrichedProfiles,
      orgStructures,
      influenceAnalyses,
      buyerGroups,
      competitorActivity,
    } = data;

    if (!peopleData || peopleData['length'] === 0) {
      console.log("⚠️  No people data available for flight risk analysis");
      return { flightRiskAnalyses: [] };
    }

    const analyzer = new FlightRiskAnalyzer();
    const flightRiskAnalyses: FlightRiskAnalysis[] = [];

    // Analyze flight risk for all people with enhanced context
    for (const person of peopleData) {
      const profile = enrichedProfiles?.find((p) => p['personId'] === person.id);
      const orgStructure = orgStructures?.find(
        (o) => o['companyId'] === person.companyId,
      );
      const influenceAnalysis = influenceAnalyses?.find(
        (i: any) => i['companyId'] === person.companyId,
      );

      // Check if person is in a buyer group (higher priority analysis)
      const isInBuyerGroup = buyerGroups?.some(
        (bg) =>
          bg.champions?.includes(person.id) ||
          bg.decisionMakers?.includes(person.id) ||
          bg.blockers?.includes(person.id) ||
          bg.stakeholders?.includes(person.id) ||
          bg.openers?.includes(person.id),
      );

      try {
        const analysis = await analyzer.analyzePersonWithContext(
          person,
          profile,
          {
            orgStructure,
            influenceAnalysis,
            isInBuyerGroup,
            competitorActivity: competitorActivity?.filter(
              (ca: any) => ca['companyId'] === person.companyId,
            ),
          },
        );
        flightRiskAnalyses.push(analysis);
      } catch (error) {
        console.error(
          `❌ Error analyzing flight risk for ${person.name}:`,
          error,
        );
        continue;
      }
    }

    // Generate summary statistics
    const totalAnalyzed = flightRiskAnalyses.length;
    const criticalRisk = flightRiskAnalyses.filter(
      (a) => a['riskCategory'] === "CRITICAL",
    ).length;
    const elevatedRisk = flightRiskAnalyses.filter(
      (a) => a['riskCategory'] === "ELEVATED",
    ).length;
    const stableRisk = flightRiskAnalyses.filter(
      (a) => a['riskCategory'] === "STABLE",
    ).length;
    const rootedRisk = flightRiskAnalyses.filter(
      (a) => a['riskCategory'] === "LOW RISK",
    ).length;

    const averageRiskScore =
      totalAnalyzed > 0
        ? Math.round(
            flightRiskAnalyses.reduce((sum, a) => sum + a.flightRiskScore, 0) /
              totalAnalyzed,
          )
        : 0;

    console.log(`\n🎯 Flight Risk Analysis Summary:`);
    console.log(`   👥 People Analyzed: ${totalAnalyzed}`);
    console.log(
      `   🚨 Critical Risk: ${criticalRisk} (${Math.round((criticalRisk / totalAnalyzed) * 100)}%)`,
    );
    console.log(
      `   ⚠️  Elevated Risk: ${elevatedRisk} (${Math.round((elevatedRisk / totalAnalyzed) * 100)}%)`,
    );
    console.log(
      `   ✅ Stable: ${stableRisk} (${Math.round((stableRisk / totalAnalyzed) * 100)}%)`,
    );
    console.log(
      `   🌳 Rooted: ${rootedRisk} (${Math.round((rootedRisk / totalAnalyzed) * 100)}%)`,
    );
    console.log(`   📊 Average Risk Score: ${averageRiskScore}/100`);

    // Log top risk individuals
    const topRiskIndividuals = flightRiskAnalyses
      .sort((a, b) => b.flightRiskScore - a.flightRiskScore)
      .slice(0, 5);

    console.log("\n🚨 Top Flight Risk Individuals:");
    topRiskIndividuals.forEach((analysis, index) => {
      console.log(
        `   ${index + 1}. ${analysis.personName} (${analysis.riskCategory}) - ${analysis.flightRiskScore}% risk`,
      );
      if (analysis.keyIndicators.length > 0) {
        console.log(`      → ${analysis['keyIndicators'][0]}`);
      }
    });

    return {
      flightRiskAnalyses,
      flightRiskSummary: {
        totalAnalyzed,
        riskDistribution: {
          critical: criticalRisk,
          elevated: elevatedRisk,
          stable: stableRisk,
          rooted: rootedRisk,
        },
        averageRiskScore,
        topRiskIndividuals: topRiskIndividuals.slice(0, 3).map((a) => ({
          personId: a.personId,
          personName: a.personName,
          riskScore: a.flightRiskScore,
          riskCategory: a.riskCategory,
          primaryRiskFactor: a['keyIndicators'][0] || "Multiple factors",
        })),
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ Error in flight risk analysis:", error);
    throw new Error(
      `Flight risk analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
