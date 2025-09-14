import { PipelineData, EnrichedProfile, BuyerCompany, G2Data } from "../types";
import { v4 as uuidv4 } from "uuid";

export class G2DataEnricher {
  private async fetchG2Data(companyName: string): Promise<G2Data | null> {
    try {
      // TODO: Implement actual G2 API integration
      // For now, return simulated data
      return {
        products: [
          {
            id: uuidv4(),
            name: "Enterprise Analytics Platform",
            description:
              "AI-powered analytics platform for enterprise data analysis",
            rating: 4.5,
            reviewCount: 150,
            features: [
              "Real-time analytics",
              "AI-powered insights",
              "Custom dashboards",
              "Data integration",
            ],
            pricing: {
              model: "Subscription",
              startingPrice: 1000,
              currency: "USD",
            },
            competitors: ["Competitor 1", "Competitor 2", "Competitor 3"],
            categories: ["Business Intelligence", "Data Analytics", "AI/ML"],
            lastUpdated: new Date().toISOString(),
          },
        ],
        marketPosition: {
          category: "Business Intelligence",
          rank: 5,
          totalCompetitors: 20,
        },
        competitiveAnalysis: {
          strengths: [
            "Strong AI capabilities",
            "Enterprise-grade security",
            "Comprehensive feature set",
          ],
          weaknesses: ["Higher pricing", "Complex setup"],
          opportunities: ["Cloud market growth", "AI adoption trends"],
          threats: ["New market entrants", "Price competition"],
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching G2 data for ${companyName}:`, error);
      return null;
    }
  }

  private enrichCompanyProfile(
    company: BuyerCompany,
    g2Data: G2Data,
  ): BuyerCompany {
    return {
      ...company,
      g2Data,
    };
  }

  private enrichProfile(
    profile: EnrichedProfile,
    g2Data: G2Data,
  ): EnrichedProfile {
    return {
      ...profile,
      g2Data,
    };
  }

  public async enrichData(data: PipelineData): Promise<Partial<PipelineData>> {
    if (!data.buyerCompanies?.length && !data.enrichedProfiles?.length) {
      throw new Error("Buyer companies or enriched profiles are required");
    }

    const enrichedCompanies: BuyerCompany[] = [];
    const enrichedProfiles: EnrichedProfile[] = [];

    // Enrich buyer companies
    if (data.buyerCompanies) {
      for (const company of data.buyerCompanies) {
        const g2Data = await this.fetchG2Data(company.name);
        if (g2Data) {
          enrichedCompanies.push(this.enrichCompanyProfile(company, g2Data));
        } else {
          enrichedCompanies.push(company);
        }
      }
    }

    // Enrich profiles
    if (data.enrichedProfiles) {
      for (const profile of data.enrichedProfiles) {
        const companyName = profile.companyName || "Unknown Company";
        const g2Data = await this.fetchG2Data(companyName);
        if (g2Data) {
          enrichedProfiles.push(this.enrichProfile(profile, g2Data));
        } else {
          enrichedProfiles.push(profile);
        }
      }
    }

    return {
      buyerCompanies: enrichedCompanies,
      enrichedProfiles: enrichedProfiles,
    };
  }
}

export async function enrichG2Data(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const enricher = new G2DataEnricher();
  return enricher.enrichData(data);
}
