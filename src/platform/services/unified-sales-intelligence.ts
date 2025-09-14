/**
 * UNIFIED SALES INTELLIGENCE SERVICE
 * Integrates all AI capabilities for comprehensive sales intelligence
 */

import { StrategicGameIntelligenceService } from "./strategic-game-intelligence";
import { IndustryIntelligenceService } from "@/platform/services/industry-intelligence";

export interface UnifiedSalesIntelligence {
  companyAnalysis: {
    industry: string;
    competitivePosition: string;
    marketDynamics: string;
    keyInsights: string[];
  };
  strategicRecommendations: {
    bestApproach: string;
    alternativeStrategies: string[];
    riskMitigation: string[];
  };
  marketIntelligence: {
    trends: string[];
    opportunities: string[];
    threats: string[];
  };
  confidenceScore: number;
}

export class UnifiedSalesIntelligenceService {
  private strategicService: StrategicGameIntelligenceService;
  private industryService: IndustryIntelligenceService;

  constructor() {
    this['strategicService'] = new StrategicGameIntelligenceService();
    this['industryService'] = new IndustryIntelligenceService();
  }

  async analyzeTarget(company: {
    name: string;
    industry?: string;
    description?: string;
    website?: string;
  }): Promise<UnifiedSalesIntelligence> {
    // Get industry classification
    const industryClassifications =
      this.industryService.classifyCompany(company);
    const primaryIndustry = industryClassifications[0];

    // Validate primary industry exists
    if (!primaryIndustry) {
      throw new Error(
        `Unable to classify industry for company: ${company.name}`,
      );
    }

    // Get strategic analysis
    const strategicAnalysis = await this.strategicService.analyzeCompany(
      company.name,
    );

    // Get market intelligence
    const marketIntel = this.industryService.getMarketIntelligence(
      primaryIndustry.industryId,
    );

    return {
      companyAnalysis: {
        industry: primaryIndustry.industryId,
        competitivePosition:
          strategicAnalysis.strategicInsights.competitivePosition,
        marketDynamics: strategicAnalysis.strategicInsights.marketDynamics,
        keyInsights: [
          `Decision process: ${strategicAnalysis.strategicInsights.decisionMakingProcess}`,
          `Key influencers: ${strategicAnalysis.strategicInsights.buyingInfluencers.join(", ")}`,
          `Industry confidence: ${Math.round(primaryIndustry.confidence * 100)}%`,
        ],
      },
      strategicRecommendations: {
        bestApproach: strategicAnalysis.gameTheory.bestApproach,
        alternativeStrategies:
          strategicAnalysis.gameTheory.alternativeStrategies,
        riskMitigation: strategicAnalysis.gameTheory.riskMitigation,
      },
      marketIntelligence: {
        trends: marketIntel
          ? Array.isArray(marketIntel.trends)
            ? marketIntel.trends
            : marketIntel.trends?.current || [
                "Digital transformation",
                "AI adoption",
              ]
          : ["Digital transformation", "AI adoption"],
        opportunities: marketIntel
          ? Array.isArray(marketIntel.opportunities)
            ? marketIntel.opportunities
            : marketIntel.opportunities?.immediate || [
                "Market expansion",
                "Technology upgrade",
              ]
          : ["Market expansion", "Technology upgrade"],
        threats: ["Competition", "Market saturation"],
      },
      confidenceScore:
        (strategicAnalysis.confidenceScore + primaryIndustry.confidence) / 2,
    };
  }

  async getIndustryOverview(industryId: string) {
    const industry = this.industryService.getIndustry(industryId);
    if (!industry) return null;

    return {
      name: industry.name,
      sector: industry.sector,
      marketSize: industry.marketSize,
      growthRate: industry.growthRate,
      maturity: industry.maturity,
      keyPlayers: industry.keyPlayers,
      painPoints: industry.painPoints,
      opportunities: industry.opportunities,
      buyingPatterns: industry.buyingPatterns,
    };
  }

  async searchSimilarCompanies(criteria: {
    industry?: string;
    sector?: string;
    size?: string;
  }) {
    // TODO: Implement search functionality when IndustryIntelligenceService has search capabilities
    return [];
  }
}
