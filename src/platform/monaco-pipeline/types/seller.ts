import { z } from "zod";

// Enhanced Seller Profile Types with Comprehensive Intelligence
export const EnhancedSellerProfileSchema = z.object({
  // Basic Company Information
  id: z.string(),
  companyName: z.string(),
  industry: z.string(),
  companySize: z.string(),
  annualRevenue: z.string().optional(),
  foundedYear: z.number().optional(),
  headquarters: z
    .object({
      city: z.string(),
      state: z.string().optional(),
      country: z.string(),
    })
    .optional(),

  // Product & Technology
  product: z.object({
    name: z.string(),
    category: z.string(),
    description: z.string(),
    techStack: z.array(z.string()),
    integrations: z.array(z.string()),
    platforms: z.array(z.string()),
    targetIndustries: z.array(z.string()),
    targetCompanySizes: z.array(z.string()),
    pricing: z.object({
      model: z.enum([
        "freemium",
        "subscription",
        "one-time",
        "usage-based",
        "enterprise",
      ]),
      startingPrice: z.number().optional(),
      averageDealSize: z.number().optional(),
      currency: z.string().default("USD"),
    }),
  }),

  // Go-to-Market Strategy
  gtmStrategy: z.object({
    primaryChannel: z.enum([
      "direct",
      "partners",
      "self-serve",
      "inside-sales",
      "field-sales",
    ]),
    channels: z.array(z.string()),
    salesCycle: z.object({
      averageLength: z.number(), // in days
      stages: z.array(z.string()),
      keyMilestones: z.array(z.string()),
    }),
    idealCustomerProfile: z.object({
      companySize: z.array(z.string()),
      industries: z.array(z.string()),
      budgetRange: z.string(),
      geographies: z.array(z.string()),
      technographics: z.array(z.string()),
    }),
  }),

  // Sales Organization
  salesTeam: z.object({
    totalReps: z.number(),
    structure: z.enum(["geographic", "vertical", "account-based", "hybrid"]),
    seniorityLevels: z.object({
      sdr: z.number(),
      ae: z.number(),
      senior: z.number(),
      management: z.number(),
    }),
    enablementMaturity: z.enum([
      "basic",
      "intermediate",
      "advanced",
      "world-class",
    ]),
    toolsUsed: z.array(z.string()),
    methodology: z.string().optional(),
  }),

  // Competitive Intelligence
  competitivePosition: z.object({
    marketPosition: z.enum(["leader", "challenger", "follower", "niche"]),
    keyDifferentiators: z.array(z.string()),
    competitiveAdvantages: z.array(z.string()),
    weaknesses: z.array(z.string()),
    directCompetitors: z.array(z.string()),
    indirectCompetitors: z.array(z.string()),
    winRate: z.number().optional(),
    lossReasons: z.array(z.string()).optional(),
  }),

  // Partnership Ecosystem
  partnershipStrategy: z.object({
    currentPartners: z.array(
      z.object({
        name: z.string(),
        type: z.enum([
          "technology",
          "channel",
          "strategic",
          "integration",
          "reseller",
        ]),
        relationship: z.enum(["tier-1", "tier-2", "tier-3", "strategic"]),
        revenueImpact: z.enum(["low", "medium", "high", "critical"]),
      }),
    ),
    desiredPartnerTypes: z.array(z.string()),
    partnershipGoals: z.array(z.string()),
    ecosystemMaturity: z.enum([
      "emerging",
      "developing",
      "established",
      "mature",
    ]),
  }),

  // Growth & Funding
  growthStage: z.enum([
    "pre-seed",
    "seed",
    "series-a",
    "series-b",
    "series-c+",
    "public",
    "mature",
  ]),
  fundingHistory: z
    .array(
      z.object({
        round: z.string(),
        amount: z.number().optional(),
        date: z.string(),
        investors: z.array(z.string()).optional(),
      }),
    )
    .optional(),

  // Intelligence Preferences
  intelligenceNeeds: z.object({
    primaryUseCase: z.enum([
      "prospecting",
      "account-research",
      "competitive-intel",
      "partnership-discovery",
      "market-expansion",
    ]),
    focusAreas: z.array(z.string()),
    reportingFrequency: z.enum(["real-time", "daily", "weekly", "monthly"]),
    integrationRequirements: z.array(z.string()),
  }),

  // Legacy fields for backward compatibility
  targetMarkets: z.array(z.string()),
  successCriteria: z.array(z.string()),
  lastUpdated: z.date(),
  personality: z.string().optional(),
  detailedProductInfo: z.string().optional(),
  detailedSalesTeamInfo: z.string().optional(),
  strategy: z.object({
    marketPosition: z.string(),
    targetSegments: z.array(z.string()),
    valueProposition: z.string(),
    competitiveAdvantages: z.array(z.string()),
  }),
});

export type EnhancedSellerProfile = z.infer<typeof EnhancedSellerProfileSchema>;

// Maintain backward compatibility
export const SellerProfileSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  industry: z.string(),
  companySize: z.string(),
  product: z.string(),
  salesTeam: z.string(),
  targetMarkets: z.array(z.string()),
  successCriteria: z.array(z.string()),
  lastUpdated: z.date(),
  annualRevenue: z.string().optional(),
  personality: z.string().optional(),
  detailedProductInfo: z.string().optional(),
  detailedSalesTeamInfo: z.string().optional(),
  strategy: z.object({
    marketPosition: z.string(),
    targetSegments: z.array(z.string()),
    valueProposition: z.string(),
    competitiveAdvantages: z.array(z.string()),
  }),
});

export type SellerProfile = z.infer<typeof SellerProfileSchema>;
