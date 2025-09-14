interface EngagementData {
  lastContactDate?: string;
  contactFrequency?: number;
  responseRate?: number;
  emailOpens?: number;
  emailClicks?: number;
  meetingsScheduled?: number;
  websiteVisits?: number;
  contentDownloads?: number;
  socialEngagement?: number;
  currentStage?: string;
  timeSinceLastAction?: number; // days
}

interface StatusResult {
  status: "Hot" | "Warm" | "Cold" | "New";
  confidence: number;
  reasoning: string[];
}

export class AIStatusService {
  /**
   * Determines lead/opportunity status using AI-powered analysis
   */
  static determineStatus(data: EngagementData): StatusResult {
    const indicators: Array<{ weight: number; score: number; reason: string }> =
      [];

    // Analyze last contact date
    if (data.lastContactDate) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(data.lastContactDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysSinceContact <= 3) {
        indicators.push({
          weight: 0.25,
          score: 1,
          reason: "Recent contact (within 3 days)",
        });
      } else if (daysSinceContact <= 7) {
        indicators.push({
          weight: 0.25,
          score: 0.8,
          reason: "Contact within a week",
        });
      } else if (daysSinceContact <= 14) {
        indicators.push({
          weight: 0.25,
          score: 0.5,
          reason: "Contact within 2 weeks",
        });
      } else if (daysSinceContact <= 30) {
        indicators.push({
          weight: 0.25,
          score: 0.2,
          reason: "Contact within a month",
        });
      } else {
        indicators.push({
          weight: 0.25,
          score: 0,
          reason: `No recent contact (${daysSinceContact} days)`,
        });
      }
    }

    // Analyze response rate
    if (data.responseRate !== undefined) {
      if (data.responseRate >= 0.8) {
        indicators.push({
          weight: 0.2,
          score: 1,
          reason: "High response rate (>80%)",
        });
      } else if (data.responseRate >= 0.5) {
        indicators.push({
          weight: 0.2,
          score: 0.7,
          reason: "Good response rate (>50%)",
        });
      } else if (data.responseRate >= 0.2) {
        indicators.push({
          weight: 0.2,
          score: 0.4,
          reason: "Moderate response rate (>20%)",
        });
      } else {
        indicators.push({
          weight: 0.2,
          score: 0.1,
          reason: "Low response rate (<20%)",
        });
      }
    }

    // Analyze email engagement
    const emailScore = Math.min(
      (data.emailOpens || 0) * 0.1 + (data.emailClicks || 0) * 0.3,
      1,
    );
    if (emailScore > 0) {
      indicators.push({
        weight: 0.15,
        score: emailScore,
        reason: `Email engagement: ${data.emailOpens || 0} opens, ${data.emailClicks || 0} clicks`,
      });
    }

    // Analyze meetings and advanced engagement
    const meetingScore = Math.min((data.meetingsScheduled || 0) * 0.5, 1);
    if (meetingScore > 0) {
      indicators.push({
        weight: 0.15,
        score: meetingScore,
        reason: `${data.meetingsScheduled || 0} meetings scheduled`,
      });
    }

    // Analyze stage progression
    if (data.currentStage) {
      const stageScores = {
        Generate: 0.2,
        Initiate: 0.5,
        Educate: 0.8,
        "Build Rapport": 0.3,
        "Build Interest": 0.6,
        "Build Consensus": 0.8,
        "Build Decision": 0.9,
      };

      const stageScore =
        stageScores[data.currentStage as keyof typeof stageScores] || 0.1;
      indicators.push({
        weight: 0.1,
        score: stageScore,
        reason: `Current stage: ${data.currentStage}`,
      });
    }

    // Calculate weighted score
    const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
    const weightedScore =
      indicators.reduce((sum, ind) => sum + ind.score * ind.weight, 0) /
      totalWeight;

    // Determine status based on score
    let status: "Hot" | "Warm" | "Cold" | "New";
    let confidence: number;

    if (weightedScore >= 0.7) {
      status = "Hot";
      confidence = Math.min(weightedScore * 100, 95);
    } else if (weightedScore >= 0.45) {
      status = "Warm";
      confidence = Math.min(weightedScore * 100, 85);
    } else if (weightedScore >= 0.2) {
      status = "Cold";
      confidence = Math.min(weightedScore * 100, 75);
    } else {
      status = "New";
      confidence = Math.max(20, weightedScore * 100);
    }

    return {
      status,
      confidence: Math.round(confidence),
      reasoning: indicators.map((ind) => ind.reason),
    };
  }

  /**
   * Get status for a lead based on available data
   */
  static getLeadStatus(lead: any): StatusResult {
    const engagementData: EngagementData = {
      lastContactDate: lead.lastActionDate,
      currentStage: lead.currentStage,
      timeSinceLastAction: lead.lastActionDate
        ? Math.floor(
            (Date.now() - new Date(lead.lastActionDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : undefined,
    };

    return this.determineStatus(engagementData);
  }

  /**
   * Get status for an opportunity based on available data
   */
  static getOpportunityStatus(opportunity: any): StatusResult {
    const engagementData: EngagementData = {
      lastContactDate: opportunity.lastActionDate,
      currentStage: opportunity.currentStage,
      timeSinceLastAction: opportunity.lastActionDate
        ? Math.floor(
            (Date.now() - new Date(opportunity.lastActionDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : undefined,
    };

    return this.determineStatus(engagementData);
  }
}
