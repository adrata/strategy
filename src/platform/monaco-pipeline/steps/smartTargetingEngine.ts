/**
 * Smart Targeting Engine - Business Context Intelligence
 *
 * Fixes the core Monaco pipeline flaw: targeting the wrong level of people
 * Based on product type, deal size, and business context to find the RIGHT decision makers
 */

import { PipelineData, Person, SellerProfile, BuyerCompany } from "../types";

interface BusinessContext {
  productType:
    | "revenue_technology"
    | "enterprise_software"
    | "infrastructure"
    | "security"
    | "analytics";
  dealSize: "small" | "medium" | "large" | "enterprise";
  buyingCenter: "operations" | "executive" | "technical" | "financial";
  decisionLevel: "manager" | "director" | "vp" | "c_suite";
}

interface SmartTargetingResult {
  optimalTargets: Person[];
  businessRationale: string;
  targetingStrategy: string;
  dealSizeAlignment: string;
}

// Business Context Intelligence - Maps product types to the RIGHT decision makers
const BUSINESS_CONTEXT_RULES = {
  revenue_technology: {
    // Revenue tech ($50K-$500K) goes to operations, not C-suite
    optimalTitles: [
      "Revenue Operations Director",
      "Sales Operations Director",
      "VP Revenue Operations",
      "Director Sales Operations",
      "Sales Operations Manager",
      "VP Sales Operations",
      "Head of Revenue Operations",
      "Senior Director Sales Operations",
      "Regional Sales Director",
    ],
    avoidTitles: [
      "CEO",
      "Chairman",
      "President",
      "Chief Executive",
      "Global President",
      "Chief Operating Officer",
      "Chief Revenue Officer",
    ],
    optimalDepartments: [
      "Sales",
      "Revenue Operations",
      "Sales Operations",
      "Business Operations",
    ],
    decisionLevel: "director" as const,
    dealSize: "medium" as const,
    buyingCenter: "operations" as const,
    rationale:
      "Revenue technology platforms are evaluated by operations teams who understand sales processes, not C-suite executives.",
  },

  enterprise_software: {
    // Large enterprise deals ($1M+) can go higher
    optimalTitles: [
      "Chief Technology Officer",
      "VP Engineering",
      "VP Product",
      "Chief Digital Officer",
      "VP Business Operations",
    ],
    avoidTitles: ["Individual Contributor", "Analyst", "Associate"],
    optimalDepartments: ["Engineering", "Product", "IT", "Operations"],
    decisionLevel: "vp" as const,
    dealSize: "large" as const,
    buyingCenter: "technical" as const,
    rationale:
      "Enterprise software requires technical and executive buy-in for large implementations.",
  },

  infrastructure: {
    // Infrastructure deals go to technical leaders
    optimalTitles: [
      "Chief Technology Officer",
      "VP Engineering",
      "Director of Infrastructure",
      "Head of DevOps",
      "VP Information Technology",
    ],
    avoidTitles: ["CEO", "Sales", "Marketing", "HR"],
    optimalDepartments: ["Engineering", "IT", "Infrastructure", "DevOps"],
    decisionLevel: "director" as const,
    dealSize: "medium" as const,
    buyingCenter: "technical" as const,
    rationale:
      "Infrastructure decisions are made by technical leaders who understand systems architecture.",
  },

  security: {
    // Security deals go to security leaders
    optimalTitles: [
      "Chief Information Security Officer",
      "VP Security",
      "Director of Security",
      "Head of Information Security",
      "Security Operations Manager",
    ],
    avoidTitles: ["CEO", "Sales", "Marketing", "HR"],
    optimalDepartments: ["Security", "IT", "Risk Management", "Compliance"],
    decisionLevel: "director" as const,
    dealSize: "medium" as const,
    buyingCenter: "technical" as const,
    rationale:
      "Security decisions are made by security professionals who understand threat landscapes.",
  },

  analytics: {
    // Analytics deals go to data leaders
    optimalTitles: [
      "Chief Data Officer",
      "VP Analytics",
      "Director of Data Science",
      "Head of Business Intelligence",
      "Data Engineering Manager",
    ],
    avoidTitles: ["CEO", "Sales", "Marketing", "HR"],
    optimalDepartments: [
      "Data",
      "Analytics",
      "Business Intelligence",
      "Engineering",
    ],
    decisionLevel: "director" as const,
    dealSize: "medium" as const,
    buyingCenter: "technical" as const,
    rationale:
      "Analytics decisions are made by data professionals who understand data architecture.",
  },
};

export class SmartTargetingEngine {
  /**
   * Intelligently target the RIGHT level of people based on business context
   */
  async smartTarget(data: PipelineData): Promise<SmartTargetingResult> {
    const sellerProfile = data.sellerProfile;
    const peopleData = data.peopleData || [];

    // Determine business context from seller profile
    const businessContext = this.determineBusinessContext(sellerProfile);

    // Get targeting rules for this business context
    const rules = BUSINESS_CONTEXT_RULES[businessContext.productType];

    if (!rules) {
      throw new Error(
        `No targeting rules defined for product type: ${businessContext.productType}`,
      );
    }

    // Filter people based on business context
    const smartTargets = this.filterByBusinessContext(peopleData, rules);

    // Rank targets by business relevance (NOT just seniority)
    const rankedTargets = this.rankByBusinessRelevance(smartTargets, rules);

    // Return optimal targets with business rationale
    return {
      optimalTargets: rankedTargets.slice(0, 10), // Top 10 targets
      businessRationale: rules.rationale,
      targetingStrategy: `Target ${rules.decisionLevel} level in ${rules.optimalDepartments.join(", ")} departments`,
      dealSizeAlignment: `${businessContext.dealSize} deal size aligns with ${rules.decisionLevel} decision makers`,
    };
  }

  /**
   * Determine business context from seller profile
   */
  private determineBusinessContext(
    sellerProfile: SellerProfile,
  ): BusinessContext {
    // Analyze seller profile to determine product type and deal size
    const product = sellerProfile.product?.toLowerCase() || "";
    const companyName = sellerProfile.companyName?.toLowerCase() || "";
    const industry = sellerProfile.industry?.toLowerCase() || "";

    // Detect revenue technology platform
    if (
      product.includes("revenue") ||
      product.includes("sales operations") ||
      product.includes("revenue operations") ||
      product.includes("buyer intelligence") ||
      product.includes("sales intelligence") ||
      companyName.includes("adrata") ||
      industry.includes("sales intelligence")
    ) {
      return {
        productType: "revenue_technology",
        dealSize: "medium", // $50K-$500K range
        buyingCenter: "operations",
        decisionLevel: "director",
      };
    }

    // Default to enterprise software
    return {
      productType: "enterprise_software",
      dealSize: "large",
      buyingCenter: "technical",
      decisionLevel: "vp",
    };
  }

  /**
   * Filter people based on business context rules
   */
  private filterByBusinessContext(people: Person[], rules: any): Person[] {
    return people.filter((person) => {
      const title = person.title?.toLowerCase() || "";
      const department = person.department?.toLowerCase() || "";

      // Check if title matches optimal patterns
      const hasOptimalTitle = rules.optimalTitles.some(
        (optimalTitle: string) =>
          title.includes(optimalTitle.toLowerCase()) ||
          this.titleSimilarity(title, optimalTitle.toLowerCase()) > 0.7,
      );

      // Check if department is optimal
      const hasOptimalDepartment = rules.optimalDepartments.some(
        (optimalDept: string) => department.includes(optimalDept.toLowerCase()),
      );

      // Exclude titles that are too high or too low
      const hasAvoidTitle = rules.avoidTitles.some((avoidTitle: string) =>
        title.includes(avoidTitle.toLowerCase()),
      );

      return (hasOptimalTitle || hasOptimalDepartment) && !hasAvoidTitle;
    });
  }

  /**
   * Rank targets by business relevance, not just seniority
   */
  private rankByBusinessRelevance(people: Person[], rules: any): Person[] {
    return people
      .map((person) => ({
        ...person,
        businessRelevanceScore: this.calculateBusinessRelevance(person, rules),
      }))
      .sort((a, b) => b.businessRelevanceScore - a.businessRelevanceScore);
  }

  /**
   * Calculate business relevance score (replaces broken seniority-only scoring)
   */
  private calculateBusinessRelevance(person: Person, rules: any): number {
    let score = 0;
    const title = person.title?.toLowerCase() || "";
    const department = person.department?.toLowerCase() || "";

    // Title relevance (50% weight)
    const titleRelevance = rules.optimalTitles.reduce(
      (max: number, optimalTitle: string) => {
        const similarity = this.titleSimilarity(
          title,
          optimalTitle.toLowerCase(),
        );
        return Math.max(max, similarity);
      },
      0,
    );
    score += titleRelevance * 0.5;

    // Department relevance (30% weight)
    const deptRelevance = rules.optimalDepartments.some((optimalDept: string) =>
      department.includes(optimalDept.toLowerCase()),
    )
      ? 1.0
      : 0.3;
    score += deptRelevance * 0.3;

    // Decision power relevance (20% weight)
    const decisionPower = person.decisionPower || 0.5;
    score += decisionPower * 0.2;

    return Math.min(1.0, score);
  }

  /**
   * Calculate similarity between titles
   */
  private titleSimilarity(title1: string, title2: string): number {
    const words1 = title1.split(" ").filter((w) => w.length > 2);
    const words2 = title2.split(" ").filter((w) => w.length > 2);

    let matches = 0;
    words1.forEach((word1) => {
      if (
        words2.some((word2) => word1.includes(word2) || word2.includes(word1))
      ) {
        matches++;
      }
    });

    return matches / Math.max(words1.length, words2.length);
  }
}

/**
 * Integration with Monaco Pipeline
 */
export async function smartTargetingStep(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  console.log(
    "🎯 Running Smart Targeting Engine - Business Context Intelligence...",
  );

  const engine = new SmartTargetingEngine();
  const result = await engine.smartTarget(data);

  console.log(`✅ Smart Targeting Results:`);
  console.log(`   📊 Found ${result.optimalTargets.length} optimal targets`);
  console.log(`   🎯 Strategy: ${result.targetingStrategy}`);
  console.log(`   💼 Rationale: ${result.businessRationale}`);
  console.log(`   💰 Deal Size: ${result.dealSizeAlignment}`);

  // Log top targets
  result.optimalTargets.slice(0, 5).forEach((target, index) => {
    console.log(
      `   ${index + 1}. ${target.name} - ${target.title} (${target.department})`,
    );
  });

  return {
    // Replace the old people data with smart-targeted people
    peopleData: result.optimalTargets,
  };
}
