import { v4 as uuidv4 } from "uuid";
import {
  PipelineData,
  Competitor,
  BuyerCompany,
  SellerProfile,
} from "../types";

interface CompetitorBattlecard {
  id: string;
  competitorId: string;
  competitorName: string;
  companyId: string;
  companyName: string;
  overview: {
    description: string;
    strengths: string[];
    weaknesses: string[];
    marketPosition: string;
  };
  productComparison: {
    features: Array<{
      feature: string;
      competitor: string;
      monaco: string;
      differentiator: string;
    }>;
    pricing: {
      model: string;
      startingPrice: number;
      currency: string;
      comparison: string;
    };
  };
  messaging: {
    keyMessages: string[];
    objections: Array<{
      objection: string;
      response: string;
    }>;
    differentiators: string[];
  };
  recentNews: Array<{
    title: string;
    date: string;
    summary: string;
    impact: "high" | "medium" | "low";
  }>;
  customerFeedback: Array<{
    source: string;
    rating: number;
    comment: string;
    sentiment: "positive" | "neutral" | "negative";
  }>;
  lastUpdated: string;
}

class CompetitorBattlecardGenerator {
  private generateOverview(
    competitor: Competitor,
    sellerProfile: SellerProfile,
  ): CompetitorBattlecard["overview"] {
    return {
      description: `${competitor.name} is a ${competitor.industry} company offering ${competitor.product}.`,
      strengths: competitor.strengths || [],
      weaknesses: competitor.weaknesses || [],
      marketPosition: `Competes with ${sellerProfile.companyName} in the ${sellerProfile.industry} market.`,
    };
  }

  private generateProductComparison(
    competitor: Competitor,
    sellerProfile: SellerProfile,
  ): CompetitorBattlecard["productComparison"] {
    return {
      features: [
        {
          feature: "Core Functionality",
          competitor: competitor.product,
          monaco: sellerProfile.product,
          differentiator:
            "Monaco offers more advanced features and better integration capabilities.",
        },
        {
          feature: "Scalability",
          competitor: "Limited scaling options",
          monaco: "Enterprise-grade scalability",
          differentiator:
            "Monaco provides superior scaling capabilities for growing businesses.",
        },
        {
          feature: "Support",
          competitor: "Basic support package",
          monaco: "24/7 dedicated support",
          differentiator:
            "Monaco offers comprehensive support with dedicated account managers.",
        },
      ],
      pricing: {
        model: "Subscription-based",
        startingPrice: 0, // Placeholder
        currency: "USD",
        comparison:
          "Monaco offers better value with more features included in base pricing.",
      },
    };
  }

  private generateMessaging(
    competitor: Competitor,
    sellerProfile: SellerProfile,
  ): CompetitorBattlecard["messaging"] {
    return {
      keyMessages: [
        `Monaco provides superior ${sellerProfile.product} compared to ${competitor.name}`,
        `Our solution offers better integration and scalability`,
        `Monaco's customer support is unmatched in the industry`,
      ],
      objections: [
        {
          objection: `${competitor.name} is cheaper`,
          response:
            "Our pricing includes more features and better support, providing better overall value.",
        },
        {
          objection: `${competitor.name} has been in the market longer`,
          response:
            "Our modern architecture and innovative features give us a competitive edge.",
        },
        {
          objection: "Switching costs are high",
          response:
            "Our migration team ensures a smooth transition with minimal disruption.",
        },
      ],
      differentiators: [
        "Advanced AI capabilities",
        "Better integration options",
        "Superior customer support",
        "More flexible pricing",
      ],
    };
  }

  private generateRecentNews(
    competitor: Competitor,
  ): CompetitorBattlecard["recentNews"] {
    return [
      {
        title: `${competitor.name} Product Update`,
        date: new Date().toISOString(),
        summary: `${competitor.name} has released new features and enhancements to their ${competitor.product}`,
        impact: "medium" as const,
      },
      {
        title: `${competitor.name} Market Expansion`,
        date: new Date().toISOString(),
        summary: `${competitor.name} is expanding into new markets and regions`,
        impact: "high" as const,
      },
    ];
  }

  private generateCustomerFeedback(
    competitor: Competitor,
  ): CompetitorBattlecard["customerFeedback"] {
    return [
      {
        source: "G2",
        rating: 4.2,
        comment: `${competitor.name} has a good product but lacks some advanced features`,
        sentiment: "positive" as const,
      },
      {
        source: "TrustRadius",
        rating: 3.8,
        comment: `${competitor.name} provides a decent solution but their support could be better`,
        sentiment: "neutral" as const,
      },
    ];
  }

  public generateBattlecard(
    competitor: Competitor,
    company: BuyerCompany,
    sellerProfile: SellerProfile,
  ): CompetitorBattlecard {
    return {
      id: uuidv4(),
      competitorId: competitor.name,
      competitorName: competitor.name,
      companyId: company.id,
      companyName: company.name,
      overview: this.generateOverview(competitor, sellerProfile),
      productComparison: this.generateProductComparison(
        competitor,
        sellerProfile,
      ),
      messaging: this.generateMessaging(competitor, sellerProfile),
      recentNews: this.generateRecentNews(competitor),
      customerFeedback: this.generateCustomerFeedback(competitor),
      lastUpdated: new Date().toISOString(),
    };
  }
}

export async function generateCompetitorBattlecards(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  if (!data.buyerCompanies || !data.competitors || !data.sellerProfile) {
    throw new Error(
      "Missing required data for competitor battlecard generation",
    );
  }

  const generator = new CompetitorBattlecardGenerator();
  const battlecards = data.buyerCompanies.flatMap((company) =>
    data.competitors.map((competitor) =>
      generator.generateBattlecard(competitor, company, data.sellerProfile),
    ),
  );

  return {
    competitorBattlecards: battlecards,
  };
}
