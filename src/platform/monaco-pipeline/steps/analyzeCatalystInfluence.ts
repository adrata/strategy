import { PipelineData } from "../types";

/**
 * 🚀 ANALYZE CATALYST INFLUENCE
 *
 * Analyzes influence metrics for both individual influencers and business partners
 * to determine relationship value and engagement strategies.
 */

export async function analyzeCatalystInfluence(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  console.log("🔍 Analyzing catalyst influence across network...");

  if (!data.peopleData || !data.buyerCompanies) {
    console.warn("No people data or companies found for catalyst analysis");
    return {};
  }

  // Mock social data and content data since they may not exist in pipeline yet
  const socialData: any[] = [];
  const contentData: any[] = [];
  const partnerships: any[] = []; // This would come from the partnerships table

  // 1. Individual Influencer Analysis
  const influencers = await analyzeIndividualInfluencers(
    data.peopleData,
    socialData,
    contentData,
  );

  // 2. Business Partner Analysis
  const businessPartners = await analyzeBusinessPartners(
    data.buyerCompanies,
    partnerships,
  );

  // 3. Network Effect Analysis
  const networkAnalysis = await analyzeNetworkEffects(
    influencers,
    businessPartners,
  );

  // 4. Partnership Opportunity Identification
  const partnershipOpportunities = await identifyPartnershipOpportunities(
    influencers,
    businessPartners,
    data.sellerProfile?.targetMarkets || [],
  );

  // 5. Combine into unified catalyst dataset
  const catalysts = [...influencers, ...businessPartners].map((catalyst) => ({
    ...catalyst,
    networkScore: networkAnalysis['scores'][catalyst.id] || 0,
    partnershipPotential: calculatePartnershipPotential(
      catalyst,
      data.sellerProfile,
    ),
  }));

  const influenceScores = catalysts.map((catalyst) => ({
    catalystId: catalyst.id,
    overallScore: catalyst.influenceMetrics.overallScore,
    reachScore: catalyst.influenceMetrics.reachScore,
    engagementScore: catalyst.influenceMetrics.engagementScore,
    authorityScore: catalyst.influenceMetrics.authorityScore,
    networkScore: catalyst.networkScore,
    lastCalculated: new Date(),
  }));

  console.log(
    `✅ Analyzed ${catalysts.length} catalysts with influence intelligence`,
  );

  // Return as a new field in PipelineData - this will be handled by updating types later
  return {
    // Store as AI reports for now until we add Catalyst types to PipelineData
    aiReports: [
      ...(data.aiReports || []),
      {
        type: "catalyst_analysis",
        data: {
          catalysts,
          influenceScores,
          networkAnalysis,
          partnershipOpportunities,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function analyzeIndividualInfluencers(
  people: any[],
  socialData: any[],
  contentData: any[],
) {
  return people
    .filter((person) => hasInfluencePotential(person))
    .map((person) => {
      const social = socialData.find((s) => s['personId'] === person.id);
      const content = contentData.filter((c) => c['authorId'] === person.id);

      return {
        id: person.id,
        type: "influencer" as const,
        name: person.name,
        title: person.title,
        company: person.company,
        industry: person.industry || extractIndustryFromCompany(person.company),

        contactInfo: {
          email: person.email,
          phone: person.phone,
          linkedinUrl: person.linkedinUrl,
          location: {
            country: person.location?.country || "Unknown",
            city: person.location?.city || "Unknown",
            region: person.location?.region,
          },
        },

        influenceMetrics: calculateInfluenceMetrics(person, social, content),
        platforms: extractPlatformPresence(social),
        monacoIntelligence: {
          buyerGroupInfluence: extractBuyerGroupInfluence(person),
          industryInfluence: extractIndustryInfluence(person, content),
          competitorRelationships: extractCompetitorRelationships(person),
          networkConnections: extractNetworkConnections(person, social),
          contentThemes: extractContentThemes(content),
          engagementPatterns: analyzeEngagementPatterns(social, content),
        },
      };
    });
}

async function analyzeBusinessPartners(companies: any[], partnerships: any[]) {
  return partnerships.map((partnership) => {
    const company = companies.find((c) => c['id'] === partnership.companyId);

    return {
      id: partnership.id,
      type: "partner" as const,
      name: partnership.name,
      title: partnership.contactTitle,
      company: company?.name || partnership.companyName,
      industry: company?.industry || "Unknown",

      contactInfo: {
        email: partnership.contactEmail,
        phone: partnership.contactPhone,
        website: partnership.website,
        location: partnership.location || {
          country: "Unknown",
          city: "Unknown",
        },
      },

      influenceMetrics: calculatePartnerInfluenceMetrics(partnership, company),

      businessValue: {
        relationshipStrength: partnership.relationshipStrength,
        lastContactDate: partnership.lastContactDate,
        nextContactDate: partnership.nextContactDate,
        partnershipType: partnership.partnershipType,
        commissionStructure: partnership.commissionStructure,
        leadsGenerated: partnership.leadsGenerated || 0,
        revenueGenerated: partnership.revenueGenerated || 0,
        campaigns: partnership.campaigns || [],
      },

      monacoIntelligence: {
        buyerGroupInfluence: extractPartnerBuyerGroupInfluence(partnership),
        industryInfluence: [company?.industry || "Unknown"],
        competitorRelationships: [],
        networkConnections: [],
        contentThemes: [],
        engagementPatterns: {},
      },
    };
  });
}

async function analyzeNetworkEffects(
  influencers: any[],
  businessPartners: any[],
) {
  const allCatalysts = [...influencers, ...businessPartners];
  const scores: Record<string, number> = {};

  // Calculate network connectivity scores
  allCatalysts.forEach((catalyst) => {
    const connectionScore = calculateNetworkConnectivity(
      catalyst,
      allCatalysts,
    );
    const industryPresence = calculateIndustryPresence(catalyst, allCatalysts);
    const collaborationPotential = calculateCollaborationPotential(
      catalyst,
      allCatalysts,
    );

    scores[catalyst.id] =
      (connectionScore + industryPresence + collaborationPotential) / 3;
  });

  return {
    scores,
    totalNetworkSize: allCatalysts.length,
    averageConnectivity:
      Object.values(scores).reduce((a, b) => a + b, 0) / allCatalysts.length,
    networkClusters: identifyNetworkClusters(allCatalysts),
  };
}

async function identifyPartnershipOpportunities(
  influencers: any[],
  businessPartners: any[],
  targetIndustries: string[],
) {
  const opportunities: any[] = [];

  // Influencer collaboration opportunities
  influencers.forEach((influencer) => {
    if (influencer.influenceMetrics.overallScore >= 80) {
      opportunities.push({
        type: "influencer_collaboration",
        catalystId: influencer.id,
        opportunity: "Content collaboration",
        potential: "high",
        estimatedReach: influencer.platforms.linkedin?.followers || 0,
        industries: influencer.monacoIntelligence.industryInfluence,
      });
    }
  });

  // Business partnership opportunities
  businessPartners.forEach((partner) => {
    if (partner['businessValue']['relationshipStrength'] === "strong") {
      opportunities.push({
        type: "business_partnership",
        catalystId: partner.id,
        opportunity: "Referral program expansion",
        potential: "medium",
        estimatedValue: partner.businessValue.revenueGenerated * 1.5,
        industries: partner.monacoIntelligence.industryInfluence,
      });
    }
  });

  return opportunities;
}

// Helper functions
function hasInfluencePotential(person: any): boolean {
  const influenceIndicators = [
    person.title?.toLowerCase().includes("vp"),
    person.title?.toLowerCase().includes("director"),
    person.title?.toLowerCase().includes("head"),
    person.title?.toLowerCase().includes("chief"),
    person['linkedinUrl'] && person.linkedinUrl.length > 0,
  ];

  return influenceIndicators.filter(Boolean).length >= 2;
}

function calculateInfluenceMetrics(person: any, social: any, content: any[]) {
  const linkedinFollowers = social?.platforms?.linkedin?.followers || 0;
  const linkedinEngagement = social?.platforms?.linkedin?.engagementRate || 0;
  const contentCount = content.length;
  const avgContentEngagement =
    content.reduce((sum, c) => sum + (c.engagement || 0), 0) /
    Math.max(contentCount, 1);

  const reachScore = Math.min(100, (linkedinFollowers / 1000) * 5);
  const engagementScore = Math.min(100, linkedinEngagement * 8);
  const contentScore = Math.min(
    100,
    contentCount * 10 + avgContentEngagement / 100,
  );
  const authorityScore = calculateAuthorityScore(person);

  return {
    overallScore: Math.round(
      (reachScore + engagementScore + contentScore + authorityScore) / 4,
    ),
    reachScore: Math.round(reachScore),
    engagementScore: Math.round(engagementScore),
    authorityScore: Math.round(authorityScore),
    networkScore: 0, // Calculated later
    contentScore: Math.round(contentScore),
  };
}

function calculateAuthorityScore(person: any): number {
  let score = 0;

  const title = person.title?.toLowerCase() || "";
  if (title.includes("ceo") || title.includes("founder")) score += 40;
  else if (title.includes("cto") || title.includes("chief")) score += 35;
  else if (title.includes("vp") || title.includes("vice president"))
    score += 30;
  else if (title.includes("director") || title.includes("head")) score += 25;
  else if (title.includes("senior") || title.includes("lead")) score += 15;

  // Company size influence
  const company = person.company?.toLowerCase() || "";
  if (
    ["google", "microsoft", "apple", "amazon", "salesforce"].some((big) =>
      company.includes(big),
    )
  ) {
    score += 20;
  }

  return Math.min(100, score);
}

function extractPlatformPresence(social: any) {
  return {
    linkedin: {
      followers: social?.platforms?.linkedin?.followers || 0,
      engagementRate: social?.platforms?.linkedin?.engagementRate || 0,
    },
    twitter: social?.platforms?.twitter
      ? {
          followers: social.platforms.twitter.followers || 0,
          engagementRate: social.platforms.twitter.engagementRate || 0,
        }
      : undefined,
  };
}

function calculatePartnerInfluenceMetrics(partnership: any, company: any) {
  const revenueScore = Math.min(
    100,
    (partnership.revenueGenerated || 0) / 10000,
  );
  const leadsScore = Math.min(100, (partnership.leadsGenerated || 0) * 2);
  const relationshipScore =
    partnership['relationshipStrength'] === "strong"
      ? 90
      : partnership['relationshipStrength'] === "medium"
        ? 70
        : 50;

  return {
    overallScore: Math.round(
      (revenueScore + leadsScore + relationshipScore) / 3,
    ),
    reachScore: Math.min(100, (company?.employees || 100) / 50),
    engagementScore: relationshipScore,
    authorityScore: calculateCompanyAuthority(company),
    networkScore: 0,
    contentScore: 0,
  };
}

function calculateCompanyAuthority(company: any): number {
  if (!company) return 50;

  let score = 50;
  if (company.revenue > 100000000)
    score += 30; // $100M+
  else if (company.revenue > 10000000)
    score += 20; // $10M+
  else if (company.revenue > 1000000) score += 10; // $1M+

  if (company.employees > 1000) score += 20;
  else if (company.employees > 100) score += 10;

  return Math.min(100, score);
}

function extractIndustryFromCompany(company: string): string {
  const companyLower = company.toLowerCase();
  if (companyLower.includes("tech") || companyLower.includes("software"))
    return "Technology";
  if (companyLower.includes("consulting")) return "Consulting";
  if (companyLower.includes("bank") || companyLower.includes("financial"))
    return "Financial Services";
  return "Unknown";
}

function extractBuyerGroupInfluence(person: any): string[] {
  const title = person.title?.toLowerCase() || "";
  const influences = [];

  if (title.includes("sales")) influences.push("Sales Teams");
  if (title.includes("marketing")) influences.push("Marketing Teams");
  if (title.includes("engineering") || title.includes("technical"))
    influences.push("Engineering Teams");
  if (title.includes("product")) influences.push("Product Teams");
  if (title.includes("ceo") || title.includes("executive"))
    influences.push("Executive Teams");

  return influences;
}

function extractIndustryInfluence(person: any, content: any[]): string[] {
  const industries = new Set<string>();

  // From person's company
  if (person.industry) industries.add(person.industry);

  // From content themes
  content.forEach((c) => {
    if (c.tags) {
      c.tags.forEach((tag: string) => {
        if (tag.toLowerCase().includes("saas")) industries.add("SaaS");
        if (tag.toLowerCase().includes("fintech")) industries.add("FinTech");
        if (tag.toLowerCase().includes("healthcare"))
          industries.add("Healthcare");
      });
    }
  });

  return Array.from(industries);
}

function extractCompetitorRelationships(person: any): string[] {
  // This would typically analyze person's network and previous companies
  return [];
}

function extractNetworkConnections(person: any, social: any): string[] {
  // This would analyze social connections and mutual connections
  return [];
}

function extractContentThemes(content: any[]): string[] {
  const themes = new Set<string>();

  content.forEach((c) => {
    if (c.tags) {
      c.tags.forEach((tag: string) => themes.add(tag));
    }
  });

  return Array.from(themes).slice(0, 10); // Top 10 themes
}

function analyzeEngagementPatterns(social: any, content: any[]): any {
  // This would analyze when content performs best
  return {
    bestDays: ["Tuesday", "Wednesday", "Thursday"],
    bestTimes: ["10am", "2pm", "4pm"],
    optimalFrequency: "Weekly",
  };
}

function extractPartnerBuyerGroupInfluence(partnership: any): string[] {
  const type = partnership.partnershipType?.toLowerCase() || "";

  if (type.includes("referral")) return ["Sales Teams", "Business Development"];
  if (type.includes("content")) return ["Marketing Teams", "Content Teams"];
  if (type.includes("strategic")) return ["Executive Teams", "Strategy Teams"];

  return ["Partnership Teams"];
}

function calculateNetworkConnectivity(
  catalyst: any,
  allCatalysts: any[],
): number {
  // Simplified network connectivity calculation
  const industryMatches = allCatalysts.filter(
    (c) => c.id !== catalyst['id'] && c['industry'] === catalyst.industry,
  ).length;

  return Math.min(100, industryMatches * 10);
}

function calculateIndustryPresence(catalyst: any, allCatalysts: any[]): number {
  const industryCount = allCatalysts.filter(
    (c) => c['industry'] === catalyst.industry,
  ).length;
  const industryScore = Math.min(
    100,
    (industryCount / allCatalysts.length) * 200,
  );

  return industryScore;
}

function calculateCollaborationPotential(
  catalyst: any,
  allCatalysts: any[],
): number {
  // Calculate based on complementary skills/industries
  return 75; // Simplified
}

function identifyNetworkClusters(allCatalysts: any[]): any[] {
  const clusters = new Map<string, any[]>();

  allCatalysts.forEach((catalyst) => {
    const industry = catalyst.industry;
    if (!clusters.has(industry)) {
      clusters.set(industry, []);
    }
    clusters.get(industry)!.push(catalyst);
  });

  return Array.from(clusters.entries()).map(([industry, catalysts]) => ({
    industry,
    catalysts,
    size: catalysts.length,
    avgInfluence:
      catalysts.reduce((sum, c) => sum + c.influenceMetrics.overallScore, 0) /
      catalysts.length,
  }));
}

function calculatePartnershipPotential(
  catalyst: any,
  sellerProfile: any,
): number {
  let score = catalyst.influenceMetrics.overallScore;

  // Boost for target markets
  if (sellerProfile?.targetMarkets?.includes(catalyst.industry)) {
    score += 15;
  }

  // Boost for existing strong relationships
  if (catalyst.businessValue?.relationshipStrength === "strong") {
    score += 10;
  }

  return Math.min(100, score);
}
