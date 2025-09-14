// Industry Intelligence Service - Extracted from 1,309-line monolithic file

import type {
  IndustryDefinition,
  MarketIntelligence,
  CompanyData,
  CompanyClassification,
  IndustryIntelligenceConfig,
} from "./types";
import {
  INDUSTRY_DATABASE,
  getAllIndustries,
  getIndustryById,
  getIndustriesBySector,
} from "./database";

export class IndustryIntelligenceService {
  private config: IndustryIntelligenceConfig;

  constructor(config: Partial<IndustryIntelligenceConfig> = {}) {
    this['config'] = {
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour
      aiClassificationEnabled: true,
      fallbackToBasic: true,
      ...config,
    };
  }

  /**
   * Static method for classifying company (delegates to default instance)
   */
  static classifyCompany(company: CompanyData): CompanyClassification[] {
    return industryIntelligence.classifyCompany(company);
  }

  /**
   * Static method for generating market intelligence (delegates to default instance)
   */
  static generateMarketIntelligence(
    industryIdentifier: string,
  ): MarketIntelligence | null {
    return industryIntelligence.getMarketIntelligence(industryIdentifier);
  }

  /**
   * Get industry by ID or name
   */
  getIndustry(industryIdentifier: string): IndustryDefinition | null {
    // Try by ID first
    const industryById = getIndustryById(industryIdentifier);
    if (industryById) {
      return industryById;
    }

    // Try by name
    const allIndustries = getAllIndustries();
    return (
      allIndustries.find(
        (industry) =>
          industry.name.toLowerCase() === industryIdentifier.toLowerCase(),
      ) || null
    );
  }

  /**
   * Get all industries
   */
  getAllIndustries(): IndustryDefinition[] {
    return getAllIndustries();
  }

  /**
   * Classify a company into an industry
   */
  classifyCompany(company: CompanyData): CompanyClassification[] {
    const classifications: CompanyClassification[] = [];

    if (!company.name) {
      return classifications;
    }

    // Basic keyword matching
    const allIndustries = getAllIndustries();

    for (const industry of allIndustries) {
      let score = 0;
      let reasoning = "";

      // Check description match
      if (company.description) {
        const descriptionLower = company.description.toLowerCase();
        const industryKeywords = [
          ...industry.technologies,
          ...industry.painPoints,
          ...industry.opportunities,
          industry.name.toLowerCase(),
        ];

        const matchedKeywords = industryKeywords.filter((keyword) =>
          descriptionLower.includes(keyword.toLowerCase()),
        );

        if (matchedKeywords.length > 0) {
          score += matchedKeywords.length * 0.3;
          reasoning += `Matched keywords: ${matchedKeywords.join(", ")}. `;
        }
      }

      // Check industry field match
      if (company.industry) {
        const companyIndustryLower = company.industry.toLowerCase();
        const industryNameLower = industry.name.toLowerCase();

        if (
          companyIndustryLower.includes(industryNameLower) ||
          industryNameLower.includes(companyIndustryLower)
        ) {
          score += 0.8;
          reasoning += `Industry field match. `;
        }
      }

      // Check keyword match
      if (company['keywords'] && company.keywords.length > 0) {
        const keywordMatches = company.keywords.filter((keyword) =>
          industry.technologies.some((tech) =>
            tech.toLowerCase().includes(keyword.toLowerCase()),
          ),
        );

        if (keywordMatches.length > 0) {
          score += keywordMatches.length * 0.2;
          reasoning += `Keyword matches: ${keywordMatches.join(", ")}. `;
        }
      }

      if (score > 0.3) {
        classifications.push({
          industryId: industry.id,
          confidence: Math.min(score, 1.0),
          reasoning: reasoning.trim(),
        });
      }
    }

    // Sort by confidence and return top matches
    return classifications
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Classify industry by name/description
   */
  classifyIndustry(industryName: string): CompanyClassification[] {
    return this.classifyCompany({
      name: industryName,
      industry: industryName,
    });
  }

  /**
   * Get market intelligence for an industry
   */
  getMarketIntelligence(industryIdentifier: string): MarketIntelligence | null {
    const industry = this.getIndustry(industryIdentifier);
    if (!industry) {
      return null;
    }

    return {
      industryId: industry.id,
      overview: {
        marketSize: industry.marketSize,
        growthRate: industry.growthRate,
        maturity: industry.maturity,
        cyclicality: industry.cyclicality,
      },
      competitiveLandscape: {
        competitionLevel:
          industry.keyPlayers.length > 10
            ? "high"
            : industry.keyPlayers.length > 5
              ? "medium"
              : "low",
        keyPlayers: industry.keyPlayers,
        marketLeaders: industry.keyPlayers.slice(0, 3),
        barriers: industry.regulatoryEnvironment.complianceRequirements,
        differentiators: industry.competitiveFactors,
      },
      trends: {
        current: industry.intelligence.keyTrends,
        emerging: industry.intelligence.disruptors,
        disruptors: industry.intelligence.disruptors,
      },
      opportunities: {
        immediate: industry.opportunities,
        longTerm: industry.intelligence.investmentFocus,
        riskFactors: industry.painPoints,
      },
      buyingBehavior: {
        decisionMakers: industry.buyingPatterns.decisionMakers,
        salesCycle: industry.buyingPatterns.avgSalesCycle,
        budgetSeason: industry.buyingPatterns.budgetSeason,
        painPoints: industry.painPoints,
      },
      regulatory: {
        complexity: industry.regulatoryEnvironment.complexity,
        keyRegulations: industry.regulatoryEnvironment.keyRegulations,
        complianceRequirements:
          industry.regulatoryEnvironment.complianceRequirements,
      },
      intelligence: {
        keyInsights: industry.intelligence.keyTrends,
        futureOutlook: industry.intelligence.futureOutlook,
        investmentFocus: industry.intelligence.investmentFocus,
        recommendations: industry.opportunities,
      },
    };
  }
}

// Create default instance
export const industryIntelligence = new IndustryIntelligenceService();

// Export service class
export const IndustryIntelligenceServiceClass = IndustryIntelligenceService;
