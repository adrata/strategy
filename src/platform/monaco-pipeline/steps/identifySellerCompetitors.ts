import { PipelineData, Competitor, SellerProfile } from "../types";
import { brightDataService } from "../../services/brightdata";

interface BrightDataCompany {
  id: string;
  name: string;
  industry: string;
  product: string;
  website: string;
  linkedinUrl: string;
  strengths?: string[];
  weaknesses?: string[];
  messaging?: { theme: string; content: string }[];
}

interface BrightDataResponse {
  companies: BrightDataCompany[];
}

export async function identifySellerCompetitors(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  if (!data.sellerProfile) {
    throw new Error("Seller profile is required to identify competitors");
  }

  try {
    // For testing purposes, create mock competitors based on seller profile
    const competitors: Competitor[] = [
      {
        id: "salesforce",
        name: "Salesforce",
        industry: data.sellerProfile.industry,
        size: "Enterprise",
        product: "Pipeline Platform",
        website: "https://salesforce.com",
        linkedinUrl: "https://linkedin.com/company/salesforce",
        strengths: ["Market Leader", "Extensive Ecosystem", "Strong Brand"],
        weaknesses: ["Complex Pricing", "Steep Learning Curve"],
        messaging: [
          { theme: "Innovation", content: "Leading Pipeline innovation" },
          { theme: "Scale", content: "Enterprise-grade solutions" },
        ],
      },
      {
        id: "hubspot",
        name: "HubSpot",
        industry: data.sellerProfile.industry,
        size: "Mid-Market",
        product: "Inbound Marketing Platform",
        website: "https://hubspot.com",
        linkedinUrl: "https://linkedin.com/company/hubspot",
        strengths: ["Easy to Use", "Inbound Focus", "Free Tier"],
        weaknesses: ["Limited Customization", "Expensive Add-ons"],
        messaging: [
          { theme: "Growth", content: "Grow better with inbound" },
          { theme: "Simplicity", content: "Easy to use, powerful results" },
        ],
      },
      {
        id: "pipedrive",
        name: "Pipedrive",
        industry: data.sellerProfile.industry,
        size: "SMB",
        product: "Sales CRM",
        website: "https://pipedrive.com",
        linkedinUrl: "https://linkedin.com/company/pipedrive",
        strengths: ["Simple Interface", "Visual Pipeline", "Affordable"],
        weaknesses: ["Limited Features", "Basic Reporting"],
        messaging: [
          { theme: "Simplicity", content: "Pipeline made simple" },
          { theme: "Efficiency", content: "Focus on selling, not admin" },
        ],
      },
    ];

    return {
      competitors,
    };
  } catch (error: unknown) {
    console.error("Error identifying seller competitors:", error);
    throw new Error(
      `Failed to identify seller competitors: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function calculateRelevanceScore(
  competitor: Competitor,
  sellerProfile: SellerProfile,
): number {
  let score = 0;

  // Industry match (60% weight)
  if (competitor['industry'] === sellerProfile.industry) {
    score += 60;
  }

  // Product similarity (40% weight)
  if (competitor['product'] && sellerProfile.product) {
    const productSimilarity = calculateProductSimilarity(
      competitor.product,
      sellerProfile.product,
    );
    score += productSimilarity * 40;
  }

  return score;
}

function calculateProductSimilarity(
  product1: string,
  product2: string,
): number {
  // Simple word overlap similarity
  const words1 = new Set(product1.toLowerCase().split(/\s+/));
  const words2 = new Set(product2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
