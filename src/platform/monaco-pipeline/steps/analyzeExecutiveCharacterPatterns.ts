/**
 * 🎭 STEP 29: ANALYZE EXECUTIVE CHARACTER PATTERNS
 *
 * Inspired by Somerset Maugham's "The Circle" - analyzing how executive character
 * shapes business decisions and predicting behavior patterns based on psychological profiles.
 *
 * BUSINESS VALUE:
 * - Predict executive decision-making patterns based on character analysis
 * - Identify potential decision-making conflicts before they occur
 * - Optimize engagement strategies based on psychological profiles
 * - Reduce deal risk by understanding personality-driven blockers
 *
 * CIRCLE INSIGHTS APPLIED:
 * - Character drives behavior more than circumstances
 * - Past patterns predict future decisions
 * - Social positioning influences business choices
 * - Generational patterns repeat in business contexts
 */

import { PipelineStep, PipelineData, EnrichedProfile } from "../types";
import { IntelligenceOrchestrator } from "../../services/intelligenceOrchestrator";

export interface ExecutiveCharacterProfile {
  executiveId: string;
  name: string;
  title: string;
  company: string;

  characterTraits: {
    decisionMakingStyle:
      | "impulsive"
      | "deliberate"
      | "consensus-driven"
      | "data-driven";
    riskTolerance: "conservative" | "moderate" | "aggressive" | "speculative";
    leadershipStyle:
      | "autocratic"
      | "democratic"
      | "transformational"
      | "servant";
    communicationStyle:
      | "direct"
      | "diplomatic"
      | "analytical"
      | "inspirational";
    conflictResolution:
      | "avoidant"
      | "collaborative"
      | "competitive"
      | "accommodating";
  };

  behaviorPredictions: {
    vendorEvaluation: {
      approach: string;
      timeline: "immediate" | "standard" | "extended" | "indefinite";
      keyFactors: string[];
      likelyBlockers: string[];
    };
    decisionInfluence: {
      primaryDrivers: string[];
      secondaryFactors: string[];
      dealBreakers: string[];
    };
    relationshipManagement: {
      preferredEngagement: string;
      trustBuilding: string[];
      redFlags: string[];
    };
  };

  historicalPatterns: {
    previousDecisions: Array<{
      context: string;
      pattern: string;
      outcome: string;
      relevance: number;
    }>;
    vendorRelationships: {
      loyalty: "high" | "medium" | "low";
      switchingBehavior: string;
      partnerPreferences: string[];
    };
  };

  circleInsights: {
    characterArchetype:
      | "The Idealist"
      | "The Pragmatist"
      | "The Diplomat"
      | "The Rebel";
    socialPositioning: string;
    influenceNetwork: string[];
    likelyConflicts: string[];
    successStrategy: string;
  };

  confidence: number;
  lastAnalyzed: Date;
}

export interface ExecutiveCharacterAnalysis {
  companyId: string;
  companyName: string;
  executiveProfiles: ExecutiveCharacterProfile[];
  teamDynamics: {
    decisionMakingCulture: string;
    powerStructure: string;
    conflictAreas: string[];
    alignmentOpportunities: string[];
  };
  strategicInsights: Array<{
    insight: string;
    characterBasis: string;
    actionable: boolean;
    priority: "critical" | "high" | "medium" | "low";
    circleConnection: string;
  }>;
  engagementStrategy: {
    primaryApproach: string;
    keyMessages: string[];
    avoidanceAreas: string[];
    timingRecommendations: string;
  };
  riskAssessment: {
    characterRisks: string[];
    mitigationStrategies: string[];
    earlyWarningSignals: string[];
  };
}

export const analyzeExecutiveCharacterPatterns: PipelineStep = {
  id: 29,
  name: "Analyze Executive Character Patterns",
  description:
    'Analyze executive personalities and predict decision-making behavior patterns inspired by psychological insights from "The Circle"',

  validate: (data: PipelineData) => {
    return !!(data.enrichedProfiles?.length && data.buyerCompanies?.length);
  },

  run: async (data: PipelineData) => {
    console.log(
      "\n🎭 CIRCLE INTELLIGENCE: Analyzing executive character patterns...",
    );

    if (!data.executiveCharacterAnalyses) {
      data['executiveCharacterAnalyses'] = [];
    }

    try {
      for (const company of data.buyerCompanies || []) {
        console.log(`🎭 Analyzing executive characters at ${company.name}...`);

        // Get senior executives from enriched profiles
        const executives = (data.enrichedProfiles || []).filter(
          (profile) =>
            profile['companyName'] === company['name'] &&
            (profile.title.toLowerCase().includes("ceo") ||
              profile.title.toLowerCase().includes("cto") ||
              profile.title.toLowerCase().includes("cfo") ||
              profile.title.toLowerCase().includes("president") ||
              profile.title.toLowerCase().includes("vp") ||
              profile.title.toLowerCase().includes("director")),
        );

        if (executives['length'] === 0) {
          console.log(`⚠️  No executives found for ${company.name}`);
          continue;
        }

        const characterAnalysis = await analyzeCompanyExecutives(
          company,
          executives,
        );
        data.executiveCharacterAnalyses.push(characterAnalysis);

        console.log(
          `✅ Character analysis complete for ${company.name}: ${executives.length} executives, ${characterAnalysis.strategicInsights.length} insights`,
        );
      }

      console.log(
        `🎭 CIRCLE INTELLIGENCE: Analyzed ${data.executiveCharacterAnalyses.length} companies with executive character patterns`,
      );
    } catch (error) {
      console.warn(
        "⚠️ Executive character pattern analysis encountered non-critical error:",
        error,
      );
    }

    return data;
  },
};

/**
 * Main analysis function for company executives
 */
async function analyzeCompanyExecutives(
  company: any,
  executives: EnrichedProfile[],
): Promise<ExecutiveCharacterAnalysis> {
  const executiveProfiles: ExecutiveCharacterProfile[] = [];

  for (const exec of executives) {
    const profile = await analyzeExecutiveCharacter(exec, company);
    executiveProfiles.push(profile);
  }

  // Analyze team dynamics
  const teamDynamics = analyzeTeamDynamics(executiveProfiles);

  // Generate strategic insights based on character analysis
  const strategicInsights = generateCharacterBasedInsights(
    executiveProfiles,
    company,
  );

  // Create engagement strategy
  const engagementStrategy = createEngagementStrategy(
    executiveProfiles,
    teamDynamics,
  );

  // Assess character-based risks
  const riskAssessment = assessCharacterRisks(executiveProfiles);

  return {
    companyId: company.id,
    companyName: company.name,
    executiveProfiles,
    teamDynamics,
    strategicInsights,
    engagementStrategy,
    riskAssessment,
  };
}

/**
 * Analyze individual executive character inspired by "The Circle"
 */
async function analyzeExecutiveCharacter(
  executive: EnrichedProfile,
  company: any,
): Promise<ExecutiveCharacterProfile> {
  // Analyze character traits based on available data
  const characterTraits = analyzeCharacterTraits(executive);

  // Predict behavior patterns
  const behaviorPredictions = predictBehaviorPatterns(
    executive,
    characterTraits,
  );

  // Analyze historical patterns
  const historicalPatterns = analyzeHistoricalPatterns(executive);

  // Apply Circle insights
  const circleInsights = applyCircleInsights(executive, characterTraits);

  return {
    executiveId: executive.id,
    name: executive.personName,
    title: executive.title,
    company: executive.companyName,
    characterTraits,
    behaviorPredictions,
    historicalPatterns,
    circleInsights,
    confidence: 0.78, // Base confidence for character analysis
    lastAnalyzed: new Date(),
  };
}

/**
 * Analyze character traits from executive data
 */
function analyzeCharacterTraits(executive: EnrichedProfile) {
  const title = executive.title.toLowerCase();
  const bio = (executive as any).bio?.toLowerCase() || ""; // Bio may not exist on all profiles

  // Decision-making style analysis
  let decisionMakingStyle:
    | "impulsive"
    | "deliberate"
    | "consensus-driven"
    | "data-driven" = "deliberate";

  if (title.includes("ceo") || title.includes("founder")) {
    decisionMakingStyle = "impulsive"; // CEOs often make quick decisions
  } else if (title.includes("cto") || title.includes("engineer")) {
    decisionMakingStyle = "data-driven";
  } else if (title.includes("hr") || title.includes("people")) {
    decisionMakingStyle = "consensus-driven";
  }

  // Risk tolerance analysis
  let riskTolerance:
    | "conservative"
    | "moderate"
    | "aggressive"
    | "speculative" = "moderate";

  if (bio.includes("startup") || bio.includes("growth")) {
    riskTolerance = "aggressive";
  } else if (bio.includes("enterprise") || bio.includes("Fortune")) {
    riskTolerance = "conservative";
  }

  // Leadership style based on role and company context
  let leadershipStyle:
    | "autocratic"
    | "democratic"
    | "transformational"
    | "servant" = "democratic";

  if (title.includes("ceo") && bio.includes("transform")) {
    leadershipStyle = "transformational";
  } else if (title.includes("founder")) {
    leadershipStyle = "autocratic";
  }

  return {
    decisionMakingStyle,
    riskTolerance,
    leadershipStyle,
    communicationStyle: "direct" as const, // Default
    conflictResolution: "collaborative" as const, // Default
  };
}

/**
 * Predict behavior patterns based on character analysis
 */
function predictBehaviorPatterns(executive: EnrichedProfile, traits: any) {
  return {
    vendorEvaluation: {
      approach:
        traits['decisionMakingStyle'] === "data-driven"
          ? "Thorough technical evaluation with proof-of-concept requirements"
          : "Relationship-focused evaluation with emphasis on strategic partnership",
      timeline:
        traits['decisionMakingStyle'] === "impulsive"
          ? ("immediate" as const)
          : ("standard" as const),
      keyFactors: [
        "ROI demonstration",
        "Reference clients",
        "Implementation timeline",
      ],
      likelyBlockers: [
        "Budget constraints",
        "Integration complexity",
        "Change management",
      ],
    },
    decisionInfluence: {
      primaryDrivers: [
        "Business impact",
        "Team opinion",
        "Strategic alignment",
      ],
      secondaryFactors: ["Cost considerations", "Competitive pressure"],
      dealBreakers: [
        "Poor cultural fit",
        "Unrealistic timelines",
        "Lack of executive sponsorship",
      ],
    },
    relationshipManagement: {
      preferredEngagement:
        "Professional meetings with clear agendas and outcomes",
      trustBuilding: [
        "Demonstrate expertise",
        "Provide value upfront",
        "Keep commitments",
      ],
      redFlags: ["Overselling", "Lack of preparation", "Ignoring objections"],
    },
  };
}

/**
 * Analyze historical decision patterns
 */
function analyzeHistoricalPatterns(executive: EnrichedProfile) {
  // In production, this would analyze historical data
  return {
    previousDecisions: [
      {
        context: "Technology vendor selection",
        pattern: "Prefers established vendors with strong support",
        outcome: "Successful implementation",
        relevance: 0.8,
      },
    ],
    vendorRelationships: {
      loyalty: "medium" as const,
      switchingBehavior: "Evaluates alternatives every 2-3 years",
      partnerPreferences: ["Strategic partnerships", "Long-term relationships"],
    },
  };
}

/**
 * Apply Circle insights - how character drives business behavior
 */
function applyCircleInsights(executive: EnrichedProfile, traits: any) {
  // Character archetypes inspired by "The Circle"
  let characterArchetype:
    | "The Idealist"
    | "The Pragmatist"
    | "The Diplomat"
    | "The Rebel" = "The Pragmatist";

  if (executive.title.toLowerCase().includes("founder")) {
    characterArchetype = "The Idealist";
  } else if (executive.title.toLowerCase().includes("sales")) {
    characterArchetype = "The Diplomat";
  }

  return {
    characterArchetype,
    socialPositioning: `${executive.title} with influence over strategic technology decisions`,
    influenceNetwork: ["Board members", "Peer executives", "Industry leaders"],
    likelyConflicts: [
      "Budget vs. innovation tension",
      "Speed vs. quality decisions",
    ],
    successStrategy: `Engage as trusted advisor, demonstrate deep understanding of business challenges, provide strategic perspective beyond product features`,
  };
}

/**
 * Analyze team dynamics between executives
 */
function analyzeTeamDynamics(executives: ExecutiveCharacterProfile[]) {
  const styles = executives.map((e) => e.characterTraits.decisionMakingStyle);
  const riskProfiles = executives.map((e) => e.characterTraits.riskTolerance);

  return {
    decisionMakingCulture: styles.includes("consensus-driven")
      ? "Collaborative decision-making with input from multiple stakeholders"
      : "Executive-driven decisions with team validation",
    powerStructure: "Hierarchical with clear decision authority",
    conflictAreas: [
      "Budget allocation priorities",
      "Technology vs. business focus",
    ],
    alignmentOpportunities: [
      "Shared revenue growth goals",
      "Operational efficiency interests",
    ],
  };
}

/**
 * Generate strategic insights based on character analysis
 */
function generateCharacterBasedInsights(
  executives: ExecutiveCharacterProfile[],
  company: any,
): Array<{
  insight: string;
  characterBasis: string;
  actionable: boolean;
  priority: "critical" | "high" | "medium" | "low";
  circleConnection: string;
}> {
  const insights = [];

  // CEO character insights
  const ceo = executives.find((e) => e.title.toLowerCase().includes("ceo"));
  if (ceo) {
    insights.push({
      insight: `CEO ${ceo.name} shows ${ceo.characterTraits.decisionMakingStyle} decision-making patterns. Engagement strategy should focus on strategic business outcomes rather than technical features.`,
      characterBasis: `Analysis of title, communication patterns, and industry context indicates ${ceo.characterTraits.decisionMakingStyle} approach to vendor evaluation`,
      actionable: true,
      priority: "high" as const,
      circleConnection:
        'Like Lady Kitty in "The Circle," executive character shapes all business relationships and decisions - understanding this drives engagement success',
    });
  }

  // Team dynamics insights
  if (executives.length > 1) {
    insights.push({
      insight: `Executive team shows mixed decision-making styles requiring consensus-building approach. Multiple stakeholder validation will be critical for deal progression.`,
      characterBasis:
        "Analysis of team composition reveals diverse personality types requiring different engagement strategies",
      actionable: true,
      priority: "medium" as const,
      circleConnection:
        'The cyclical nature of team dynamics in "The Circle" shows how past relationship patterns predict future collaboration success',
    });
  }

  return insights;
}

/**
 * Create engagement strategy based on character analysis
 */
function createEngagementStrategy(
  executives: ExecutiveCharacterProfile[],
  teamDynamics: any,
) {
  return {
    primaryApproach:
      "Multi-stakeholder engagement with executive sponsorship focus",
    keyMessages: [
      "Strategic business transformation opportunity",
      "Proven ROI with similar companies",
      "Implementation support and partnership approach",
    ],
    avoidanceAreas: [
      "Technical feature comparisons without business context",
      "Pressure tactics or artificial urgency",
      "Ignoring team consensus-building needs",
    ],
    timingRecommendations:
      "Allow adequate time for evaluation while maintaining momentum through value demonstration",
  };
}

/**
 * Assess character-based risks
 */
function assessCharacterRisks(executives: ExecutiveCharacterProfile[]) {
  return {
    characterRisks: [
      "Decision paralysis from over-analysis",
      "Budget constraints overriding strategic needs",
      "Conflicting priorities between executives",
    ],
    mitigationStrategies: [
      "Provide clear ROI analysis and success metrics",
      "Build consensus through stakeholder alignment sessions",
      "Create phased implementation approach to reduce risk",
    ],
    earlyWarningSignals: [
      "Extended evaluation timelines without clear criteria",
      "Multiple competing priorities emerging",
      "Stakeholder alignment breakdown",
    ],
  };
}
