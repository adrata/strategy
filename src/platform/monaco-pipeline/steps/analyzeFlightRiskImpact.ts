/**
 * Analyze Flight Risk Impact Step
 *
 * When key stakeholders are at flight risk, this analyzes:
 * 1. How their departure impacts the sales deal
 * 2. Risk mitigation strategies
 * 3. Alternative contacts to maintain deal momentum
 */

import {
  PipelineData,
  Person,
  EnrichedProfile,
  FlightRiskAnalysis,
  BuyerGroup,
} from "../types";

export interface DealImpactAnalysis {
  personId: string;
  personName: string;
  companyId: string;
  companyName: string;
  currentRole:
    | "champion"
    | "decision_maker"
    | "blocker"
    | "stakeholder"
    | "opener";
  flightRiskScore: number;
  riskCategory: "CRITICAL" | "ELEVATED" | "STABLE" | "LOW RISK";

  dealImpact: {
    overallRiskLevel: "CATASTROPHIC" | "HIGH" | "MODERATE" | "LOW";
    impactScore: number; // 0-100
    impactFactors: {
      roleImportance: {
        score: number;
        rationale: string;
        replaceabilityDifficulty:
          | "IMPOSSIBLE"
          | "VERY_HARD"
          | "MODERATE"
          | "EASY";
      };
      relationshipStrength: {
        score: number;
        rationale: string;
        trustLevel: "HIGH" | "MEDIUM" | "LOW";
      };
      timingCriticality: {
        score: number;
        rationale: string;
        dealPhase: string;
        timeToReplace: number; // days
      };
    };
  };

  mitigationStrategies: Array<{
    strategy: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM";
    timeline: string;
    effort: "LOW" | "MEDIUM" | "HIGH";
    successProbability: number;
    actionItems: string[];
  }>;

  alternativeContacts: Array<{
    personId: string;
    personName: string;
    title: string;
    department: string;
    relationshipToRiskPerson: string;
    readinessScore: number; // 0-100
    readinessFactors: {
      roleAlignment: { score: number; rationale: string };
      organizationalPosition: { score: number; rationale: string };
      relationshipPotential: { score: number; rationale: string };
    };
    transitionPlan: {
      phase1: string;
      phase2: string;
      phase3: string;
      totalDuration: number; // days
    };
    probability: number; // 0-1
  }>;

  successPlanB: {
    overallViability: number;
    bestAlternative: string; // personId
    transitionTimeline: number;
    successProbability: number;
    remainingRisks: string[];
    contingencyActions: string[];
  };

  lastAnalyzed: string;
}

export class DealImpactAnalyzer {
  private determinePersonRole(
    person: Person,
    buyerGroups: BuyerGroup[],
  ): string {
    for (const group of buyerGroups) {
      if (group.champions?.includes(person.id)) return "champion";
      if (group.decisionMakers?.includes(person.id)) return "decision_maker";
      if (group.blockers?.includes(person.id)) return "blocker";
      if (group.openers?.includes(person.id)) return "opener";
      if (group.stakeholders?.includes(person.id)) return "stakeholder";
    }
    return "stakeholder"; // Default
  }

  private calculateDealImpact(
    person: Person,
    currentRole: string,
    profile?: EnrichedProfile,
  ): DealImpactAnalysis["dealImpact"] {
    // Role importance based on sales impact
    const roleWeights = {
      champion: 90, // Champions drive internal adoption
      decision_maker: 95, // Decision makers control outcomes
      blocker: 70, // Blockers can delay but often workable
      stakeholder: 60, // Important but usually replaceable
      opener: 50, // Helpful but not critical
    };

    const roleScore =
      roleWeights[currentRole as keyof typeof roleWeights] || 50;

    // Relationship strength from engagement history
    const engagementLevel = profile?.recentActivity?.length || 0;
    const relationshipScore = Math.min(
      100,
      engagementLevel * 25 + (person.influence || 0) * 30,
    );
    const trustLevel: "HIGH" | "MEDIUM" | "LOW" =
      relationshipScore > 70
        ? "HIGH"
        : relationshipScore > 40
          ? "MEDIUM"
          : "LOW";

    // Timing criticality (simplified - in production would integrate with CRM)
    const dealPhase = "qualification"; // Default
    const phaseMultipliers = {
      discovery: 60,
      qualification: 70,
      proposal: 90,
      negotiation: 95,
      closing: 100,
    };
    const timingScore =
      phaseMultipliers[dealPhase as keyof typeof phaseMultipliers] || 70;
    const timeToReplace = (person.level ?? 5) <= 3 ? 45 : 30; // Senior roles take longer

    // Overall impact calculation
    const impactScore = Math.round(
      roleScore * 0.4 + relationshipScore * 0.35 + timingScore * 0.25,
    );

    // Determine overall risk level
    let overallRiskLevel: "CATASTROPHIC" | "HIGH" | "MODERATE" | "LOW";
    if (impactScore >= 85 && currentRole === "decision_maker") {
      overallRiskLevel = "CATASTROPHIC";
    } else if (
      impactScore >= 75 &&
      ["champion", "decision_maker"].includes(currentRole)
    ) {
      overallRiskLevel = "HIGH";
    } else if (impactScore >= 60) {
      overallRiskLevel = "MODERATE";
    } else {
      overallRiskLevel = "LOW";
    }

    // Replaceability assessment
    let replaceabilityDifficulty:
      | "IMPOSSIBLE"
      | "VERY_HARD"
      | "MODERATE"
      | "EASY";
    const personLevel = person.level ?? 5; // Default to mid-level if undefined
    if (currentRole === "decision_maker" && personLevel <= 2) {
      replaceabilityDifficulty = "IMPOSSIBLE"; // C-suite decision makers
    } else if (currentRole === "champion" && trustLevel === "HIGH") {
      replaceabilityDifficulty = "VERY_HARD"; // Trusted champions
    } else if (["champion", "decision_maker"].includes(currentRole)) {
      replaceabilityDifficulty = "MODERATE";
    } else {
      replaceabilityDifficulty = "EASY";
    }

    return {
      overallRiskLevel,
      impactScore,
      impactFactors: {
        roleImportance: {
          score: roleScore,
          rationale: `${currentRole} role with ${personLevel <= 3 ? "senior" : "junior"} authority`,
          replaceabilityDifficulty,
        },
        relationshipStrength: {
          score: relationshipScore,
          rationale: `${trustLevel.toLowerCase()} trust level with ${engagementLevel} touchpoints`,
          trustLevel,
        },
        timingCriticality: {
          score: timingScore,
          rationale: `${dealPhase} phase, ${timeToReplace} days to replace`,
          dealPhase,
          timeToReplace,
        },
      },
    };
  }

  private generateMitigationStrategies(
    person: Person,
    dealImpact: DealImpactAnalysis["dealImpact"],
    currentRole: string,
  ): DealImpactAnalysis["mitigationStrategies"] {
    const strategies = [];

    // Critical immediate actions for high-impact departures
    if (
      dealImpact['overallRiskLevel'] === "CATASTROPHIC" ||
      dealImpact['overallRiskLevel'] === "HIGH"
    ) {
      strategies.push({
        strategy: "Emergency knowledge capture and documentation",
        priority: "CRITICAL" as const,
        timeline: "1-3 days",
        effort: "HIGH" as const,
        successProbability: 0.85,
        actionItems: [
          "Schedule urgent call to document all key insights",
          "Record stakeholder preferences and project requirements",
          "Capture decision criteria and evaluation process",
          "Document key relationships and internal dynamics",
        ],
      });

      if (currentRole === "champion" || currentRole === "decision_maker") {
        strategies.push({
          strategy: "Accelerate decision timeline",
          priority: "CRITICAL" as const,
          timeline: "3-7 days",
          effort: "HIGH" as const,
          successProbability: 0.7,
          actionItems: [
            "Push for expedited approval process",
            "Secure written commitment before departure",
            "Fast-track key milestones and decisions",
            "Get explicit handover instructions to replacement",
          ],
        });
      }
    }

    // Build redundant relationships
    strategies.push({
      strategy: "Build redundant champion network",
      priority: "HIGH" as const,
      timeline: "1-2 weeks",
      effort: "MEDIUM" as const,
      successProbability: 0.8,
      actionItems: [
        "Identify and engage alternative internal champions",
        "Strengthen relationships with existing stakeholders",
        "Map out complete stakeholder network",
        "Create multiple pathways to decision makers",
      ],
    });

    // Relationship transfer
    if (dealImpact.impactFactors['relationshipStrength']['trustLevel'] === "HIGH") {
      strategies.push({
        strategy: "Systematic relationship transfer",
        priority: "HIGH" as const,
        timeline: "2-4 weeks",
        effort: "MEDIUM" as const,
        successProbability: 0.75,
        actionItems: [
          "Facilitate introduction to replacement personnel",
          "Joint meetings during transition period",
          "Personal endorsement from departing stakeholder",
          "Establish continuity of project ownership",
        ],
      });
    }

    return strategies;
  }

  private identifyAlternativeContacts(
    riskPerson: Person,
    allPeople: Person[],
    enrichedProfiles: EnrichedProfile[],
  ): DealImpactAnalysis["alternativeContacts"] {
    // Find potential alternatives in same company
    const candidates = allPeople.filter(
      (p) => p['companyId'] === riskPerson['companyId'] && p.id !== riskPerson.id,
    );

    // Prioritize candidates by different succession criteria
    const alternatives = [
      // Direct reports (natural succession)
      ...candidates.filter((p) => riskPerson.directReports?.includes(p.id)),
      // Manager (escalation path)
      ...candidates.filter((p) => p['id'] === riskPerson.reportsTo),
      // Same department peers
      ...candidates.filter(
        (p) =>
          p['department'] === riskPerson['department'] &&
          Math.abs((p.level ?? 5) - (riskPerson.level ?? 5)) <= 1,
      ),
      // Cross-functional with similar influence
      ...candidates.filter(
        (p) => (p.influence || 0) >= (riskPerson.influence || 0) * 0.7,
      ),
    ]
      .slice(0, 5) // Top 5 candidates
      .map((candidate) => {
        const candidateProfile = enrichedProfiles.find(
          (p) => p['personId'] === candidate.id,
        );

        // Calculate readiness factors
        const roleAlignment = this.calculateRoleAlignment(
          riskPerson,
          candidate,
        );
        const orgPosition = this.calculateOrgPosition(riskPerson, candidate);
        const relationshipPotential = this.calculateRelationshipPotential(
          candidate,
          candidateProfile,
        );

        const readinessScore = Math.round(
          roleAlignment * 0.4 +
            orgPosition * 0.35 +
            relationshipPotential * 0.25,
        );

        return {
          personId: candidate.id,
          personName: candidate.name,
          title: candidate.title,
          department: candidate.department || "General",
          relationshipToRiskPerson: this.getRelationshipType(
            riskPerson,
            candidate,
          ),
          readinessScore,
          readinessFactors: {
            roleAlignment: {
              score: roleAlignment,
              rationale: `${Math.round(this.calculateTitleSimilarity(riskPerson.title || "", candidate.title || "") * 100)}% title similarity`,
            },
            organizationalPosition: {
              score: orgPosition,
              rationale: this.getOrgPositionRationale(riskPerson, candidate),
            },
            relationshipPotential: {
              score: relationshipPotential,
              rationale: `${(candidate.influence || 0) > 0.6 ? "High" : "Moderate"} influence and engagement potential`,
            },
          },
          transitionPlan: {
            phase1: `Introduce ${candidate.name} to key stakeholders and project context`,
            phase2: `Knowledge transfer and joint meetings with ${riskPerson.name}`,
            phase3: `Build independent relationship and establish trust`,
            totalDuration:
              readinessScore > 75 ? 21 : readinessScore > 50 ? 35 : 49,
          },
          probability: Math.min(0.95, readinessScore / 100),
        };
      });

    return alternatives.sort((a, b) => b.readinessScore - a.readinessScore);
  }

  private calculateRoleAlignment(
    riskPerson: Person,
    candidate: Person,
  ): number {
    const titleSimilarity = this.calculateTitleSimilarity(
      riskPerson.title,
      candidate.title,
    );
    const levelDifference = Math.abs(
      (riskPerson.level ?? 5) - (candidate.level ?? 5),
    );
    const departmentMatch =
      riskPerson['department'] === candidate.department ? 1 : 0.5;

    return Math.round(
      titleSimilarity * 40 +
        Math.max(0, 1 - levelDifference * 0.2) * 30 +
        departmentMatch * 30,
    );
  }

  private calculateOrgPosition(riskPerson: Person, candidate: Person): number {
    if (riskPerson.directReports?.includes(candidate.id)) return 85; // Direct report succession
    if (candidate['id'] === riskPerson.reportsTo) return 90; // Manager taking over
    if (candidate['department'] === riskPerson.department) return 70; // Peer
    return 50; // Cross-functional
  }

  private calculateRelationshipPotential(
    candidate: Person,
    profile?: EnrichedProfile,
  ): number {
    const influence = candidate.influence || 0;
    const activity = profile?.recentActivity?.length || 0;

    return Math.round(influence * 60 + activity * 10 + 20);
  }

  private calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = new Set(title1.toLowerCase().split(/\s+/));
    const words2 = new Set(title2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private getRelationshipType(riskPerson: Person, candidate: Person): string {
    if (riskPerson.directReports?.includes(candidate.id))
      return "Direct Report";
    if (candidate['id'] === riskPerson.reportsTo) return "Manager";
    if (candidate['department'] === riskPerson.department)
      return "Department Colleague";
    return "Cross-Functional Contact";
  }

  private getOrgPositionRationale(
    riskPerson: Person,
    candidate: Person,
  ): string {
    const relationship = this.getRelationshipType(riskPerson, candidate);
    const levelDiff = (candidate.level ?? 5) - (riskPerson.level ?? 5);
    return `${relationship}${levelDiff !== 0 ? ` (${levelDiff > 0 ? "+" : ""}${levelDiff} levels)` : ""}`;
  }

  async analyzeDealImpact(
    flightRiskAnalysis: FlightRiskAnalysis,
    person: Person,
    allPeople: Person[],
    enrichedProfiles: EnrichedProfile[],
    buyerGroups: BuyerGroup[],
  ): Promise<DealImpactAnalysis> {
    const currentRole = this.determinePersonRole(person, buyerGroups);
    const profile = enrichedProfiles.find((p) => p['personId'] === person.id);

    const dealImpact = this.calculateDealImpact(person, currentRole, profile);
    const mitigationStrategies = this.generateMitigationStrategies(
      person,
      dealImpact,
      currentRole,
    );
    const alternativeContacts = this.identifyAlternativeContacts(
      person,
      allPeople,
      enrichedProfiles,
    );

    // Calculate Plan B success potential
    const bestAlternative = alternativeContacts[0];
    const successPlanB = {
      overallViability: bestAlternative ? bestAlternative.readinessScore : 0,
      bestAlternative: bestAlternative?.personId || "",
      transitionTimeline: bestAlternative?.transitionPlan.totalDuration || 60,
      successProbability: bestAlternative?.probability || 0,
      remainingRisks: [
        "Relationship rebuild time required",
        "Knowledge transfer gaps may exist",
        "Stakeholder acceptance uncertainty",
      ],
      contingencyActions: [
        "Accelerate alternative relationship building",
        "Create comprehensive handover documentation",
        "Establish executive sponsor backup plan",
      ],
    };

    return {
      personId: person.id,
      personName: person.name,
      companyId: person.companyId,
      companyName: person.companyId, // Use companyId as fallback since companyName doesn't exist on Person type
      currentRole: currentRole as any,
      flightRiskScore: flightRiskAnalysis.flightRiskScore,
      riskCategory: flightRiskAnalysis.riskCategory,
      dealImpact,
      mitigationStrategies,
      alternativeContacts,
      successPlanB,
      lastAnalyzed: new Date().toISOString(),
    };
  }
}

export async function analyzeFlightRiskImpact(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  console.log("\n💼 Analyzing flight risk impact on sales deals...");

  try {
    const { flightRiskAnalyses, peopleData, enrichedProfiles, buyerGroups } =
      data;

    if (!flightRiskAnalyses?.length) {
      console.log("⚠️  No flight risk analyses available");
      return { dealImpactAnalyses: [] };
    }

    if (!buyerGroups?.length) {
      console.log("⚠️  No buyer groups available for deal impact analysis");
      return { dealImpactAnalyses: [] };
    }

    const analyzer = new DealImpactAnalyzer();
    const dealImpactAnalyses: DealImpactAnalysis[] = [];

    // Only analyze high-risk personnel (CRITICAL or ELEVATED)
    const highRiskPersonnel = flightRiskAnalyses.filter((analysis: any) =>
      ["CRITICAL", "ELEVATED"].includes(analysis.riskCategory),
    );

    if (!highRiskPersonnel.length) {
      console.log("✅ No high-risk personnel - no deal impact analysis needed");
      return { dealImpactAnalyses: [] };
    }

    console.log(
      `   📊 Analyzing ${highRiskPersonnel.length} high-risk personnel...`,
    );

    for (const riskAnalysis of highRiskPersonnel) {
      const person = peopleData?.find((p) => p['id'] === riskAnalysis.personId);
      if (!person) continue;

      try {
        const impactAnalysis = await analyzer.analyzeDealImpact(
          riskAnalysis,
          person,
          peopleData || [],
          enrichedProfiles || [],
          buyerGroups,
        );

        dealImpactAnalyses.push(impactAnalysis);

        console.log(
          `   💼 ${person.name}: ${impactAnalysis.dealImpact.overallRiskLevel} deal impact`,
        );
        console.log(
          `      → ${impactAnalysis.alternativeContacts.length} alternatives identified`,
        );
      } catch (error) {
        console.error(`❌ Error analyzing ${person.name}:`, error);
      }
    }

    // Summary statistics
    const impactDistribution = {
      catastrophic: dealImpactAnalyses.filter(
        (a) => a['dealImpact']['overallRiskLevel'] === "CATASTROPHIC",
      ).length,
      high: dealImpactAnalyses.filter(
        (a) => a['dealImpact']['overallRiskLevel'] === "HIGH",
      ).length,
      moderate: dealImpactAnalyses.filter(
        (a) => a['dealImpact']['overallRiskLevel'] === "MODERATE",
      ).length,
      low: dealImpactAnalyses.filter(
        (a) => a['dealImpact']['overallRiskLevel'] === "LOW",
      ).length,
    };

    const alternativesFound = dealImpactAnalyses.reduce(
      (sum, a) => sum + a.alternativeContacts.length,
      0,
    );
    const personnelWithAlternatives = dealImpactAnalyses.filter(
      (a) => a.alternativeContacts.length > 0,
    ).length;

    console.log(`\n💼 Deal Impact Summary:`);
    console.log(`   🎯 Personnel Analyzed: ${dealImpactAnalyses.length}`);
    console.log(
      `   💥 Catastrophic Impact: ${impactDistribution.catastrophic}`,
    );
    console.log(`   ⚠️  High Impact: ${impactDistribution.high}`);
    console.log(`   📋 Alternative Contacts: ${alternativesFound}`);
    console.log(
      `   ✅ Personnel with Backup Plans: ${personnelWithAlternatives}/${dealImpactAnalyses.length}`,
    );

    return { dealImpactAnalyses };
  } catch (error) {
    console.error("❌ Error in flight risk impact analysis:", error);
    throw new Error(
      `Flight risk impact analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
