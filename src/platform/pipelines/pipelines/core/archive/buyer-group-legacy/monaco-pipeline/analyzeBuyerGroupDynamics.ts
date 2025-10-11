import { PipelineData, BuyerGroup, Person } from "../types";

interface GroupDynamicsInsight {
  personId?: string;
  name?: string;
  insight: string;
  confidence: number;
  rationale: string;
  department?: string;
  count?: number;
}

interface BuyerGroupDynamics {
  companyId: string;
  companyName: string;
  championInfluence: GroupDynamicsInsight[];
  blockerRisk: GroupDynamicsInsight[];
  decisionAlignment: GroupDynamicsInsight[];
  stakeholderCoverage: GroupDynamicsInsight[];
  openerLeverage: GroupDynamicsInsight[];
  overallRiskLevel: "low" | "medium" | "high";
  powerDistribution: number;
  consensusLevel: number;
  engagementStrategy: string;
  note?: string;
}

export async function analyzeBuyerGroupDynamics(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  if (!data.buyerGroups || data['buyerGroups']['length'] === 0) {
    console.warn(
      "No buyer groups available for dynamics analysis, skipping step",
    );
    return {
      buyerGroupDynamics: [],
    };
  }

  try {
    const groupDynamicsAnalyses: BuyerGroupDynamics[] = [];

    for (const buyerGroup of data.buyerGroups) {
      const dynamics = analyzeGroupDynamics(buyerGroup, data.peopleData);
      groupDynamicsAnalyses.push(dynamics);
    }

    return {
      buyerGroupDynamics: groupDynamicsAnalyses,
    };
  } catch (error) {
    console.error("Error analyzing buyer group dynamics:", error);
    throw new Error(
      `Failed to analyze buyer group dynamics: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function analyzeGroupDynamics(
  group: BuyerGroup,
  peopleData: Person[],
): BuyerGroupDynamics {
  // Create a lookup map for people data
  const peopleMap = new Map(peopleData.map((person) => [person.id, person]));

  // Get unique people across all roles (except blockers)
  const uniquePeople = new Set([
    ...group.champions,
    ...group.decisionMakers,
    ...group.stakeholders,
    ...group.openers,
  ]);

  // If only one person handles all key roles, skip complex dynamics
  if (uniquePeople['size'] === 1 && group['blockers']['length'] === 0) {
    return {
      companyId: group.companyId,
      companyName: group.companyName,
      championInfluence: [],
      blockerRisk: [],
      decisionAlignment: [],
      stakeholderCoverage: [],
      openerLeverage: [],
      overallRiskLevel: "low",
      powerDistribution: 1.0,
      consensusLevel: 1.0,
      engagementStrategy: "Single decision maker approach",
      note: "Single decision maker—group dynamics not applicable. All key roles assigned to one person.",
    };
  }

  const dynamics: BuyerGroupDynamics = {
    companyId: group.companyId,
    companyName: group.companyName,
    championInfluence: [],
    blockerRisk: [],
    decisionAlignment: [],
    stakeholderCoverage: [],
    openerLeverage: [],
    overallRiskLevel: "medium",
    powerDistribution: group.dynamics.powerDistribution,
    consensusLevel: group.dynamics.consensusLevel,
    engagementStrategy: "Multi-stakeholder engagement",
  };

  // Analyze champion influence
  for (const championId of group.champions) {
    const champion = peopleMap.get(championId);
    if (champion) {
      dynamics.championInfluence.push({
        personId: champion.id,
        name: champion.name,
        insight: `Champion ${champion.name || "Unknown Champion"} has high influence and can drive consensus within the ${champion.department || "Unknown Department"} department.`,
        confidence: 0.9,
        rationale:
          "High influence score and proactive engagement capability. Champions are critical for internal advocacy.",
        department: champion.department,
      });
    }
  }

  // Analyze blocker risk
  for (const blockerId of group.blockers) {
    const blocker = peopleMap.get(blockerId);
    if (blocker) {
      dynamics.blockerRisk.push({
        personId: blocker.id,
        name: blocker.name,
        insight: `${blocker.name || "Unknown Blocker"} in ${blocker.department || "Unknown Department"} may resist change or require additional convincing.`,
        confidence: 0.8,
        rationale:
          "Risk-averse department role indicates potential resistance to new solutions. Early engagement recommended.",
        department: blocker.department,
      });
    }
  }

  // Analyze decision alignment
  const decisionMakerCount = group.decisionMakers.length;
  if (decisionMakerCount > 1) {
    dynamics.decisionAlignment.push({
      insight: `${decisionMakerCount} decision makers detected. Consensus building is critical for success.`,
      confidence: 0.7,
      rationale:
        "Multiple decision makers require coordinated engagement and alignment on value proposition.",
    });
  } else if (decisionMakerCount === 1) {
    dynamics.decisionAlignment.push({
      insight: "Single decision maker simplifies approval process.",
      confidence: 0.9,
      rationale:
        "Centralized decision making reduces complexity and speeds up the sales cycle.",
    });
  }

  // Analyze stakeholder coverage
  const stakeholderDepartments = new Map<string, number>();
  for (const stakeholderId of group.stakeholders) {
    const stakeholder = peopleMap.get(stakeholderId);
    if (stakeholder && stakeholder.department) {
      const count = stakeholderDepartments.get(stakeholder.department) || 0;
      stakeholderDepartments.set(stakeholder.department, count + 1);
    }
  }

  for (const [department, count] of stakeholderDepartments) {
    dynamics.stakeholderCoverage.push({
      department,
      count,
      insight: `${count} stakeholder${count > 1 ? "s" : ""} from ${department} department${count > 1 ? "" : ""}.`,
      confidence: 0.8,
      rationale:
        "Broad department coverage increases buy-in and reduces implementation resistance.",
    });
  }

  // Analyze opener leverage
  for (const openerId of group.openers) {
    const opener = peopleMap.get(openerId);
    if (opener) {
      const connections = opener.connections || 0;
      dynamics.openerLeverage.push({
        personId: opener.id,
        name: opener.name,
        insight: `${opener.name} can facilitate introductions and early engagement with ${connections}+ connections.`,
        confidence: 0.85,
        rationale:
          "External-facing role and large network enable warm introductions and relationship building.",
        department: opener.department,
      });
    }
  }

  // Calculate overall risk level
  const riskFactors = [
    group.blockers.length > 0 ? 1 : 0,
    decisionMakerCount > 2 ? 1 : 0,
    stakeholderDepartments.size < 2 ? 1 : 0,
    group['champions']['length'] === 0 ? 1 : 0,
  ];

  const totalRisk = riskFactors.reduce((sum, factor) => sum + factor, 0);

  if (totalRisk >= 3) {
    dynamics['overallRiskLevel'] = "high";
    dynamics['engagementStrategy'] =
      "High-touch, multi-phase engagement with risk mitigation";
  } else if (totalRisk >= 2) {
    dynamics['overallRiskLevel'] = "medium";
    dynamics['engagementStrategy'] =
      "Structured engagement with stakeholder alignment focus";
  } else {
    dynamics['overallRiskLevel'] = "low";
    dynamics['engagementStrategy'] =
      "Streamlined engagement with champion activation";
  }

  return dynamics;
}

/**
 * Simple deal routing logic
 */
export function routeDeal(
  buyerGroup: BuyerGroup,
  peopleData: Person[],
  dealState: Record<string, { contacted: boolean; response?: string }> = {},
): Person | null {
  const peopleMap = new Map(peopleData.map((person) => [person.id, person]));

  // Try to find an uncontacted decision maker first
  for (const decisionMakerId of buyerGroup.decisionMakers) {
    if (!dealState[decisionMakerId]?.contacted) {
      return peopleMap.get(decisionMakerId) || null;
    }
  }

  // Then try champions
  for (const championId of buyerGroup.champions) {
    if (!dealState[championId]?.contacted) {
      return peopleMap.get(championId) || null;
    }
  }

  // Finally try openers
  for (const openerId of buyerGroup.openers) {
    if (!dealState[openerId]?.contacted) {
      return peopleMap.get(openerId) || null;
    }
  }

  // If everyone has been contacted, return the highest priority person
  return peopleMap.get(buyerGroup['champions'][0] || "") || null;
}

/**
 * Generate engagement recommendations based on group dynamics
 */
export function generateEngagementRecommendations(
  dynamics: BuyerGroupDynamics,
): Array<{
  priority: "high" | "medium" | "low";
  action: string;
  rationale: string;
  timeline: string;
}> {
  const recommendations = [];

  // Champion activation
  if (dynamics.championInfluence.length > 0) {
    recommendations.push({
      priority: "high" as const,
      action: `Engage champions early with technical deep-dives and pilot opportunities`,
      rationale:
        "Champions can accelerate internal consensus and provide product validation",
      timeline: "Week 1-2",
    });
  }

  // Blocker mitigation
  if (dynamics.blockerRisk.length > 0) {
    recommendations.push({
      priority: "high" as const,
      action: "Schedule risk assessment sessions with potential blockers",
      rationale:
        "Early engagement can convert blockers into supporters through education",
      timeline: "Week 2-3",
    });
  }

  // Decision maker alignment
  if (dynamics.decisionAlignment.some((d) => d.insight.includes("Multiple"))) {
    recommendations.push({
      priority: "medium" as const,
      action: "Organize group presentation for all decision makers",
      rationale:
        "Ensures consistent messaging and identifies any misalignment early",
      timeline: "Week 3-4",
    });
  }

  // Stakeholder buy-in
  if (dynamics.stakeholderCoverage.length > 2) {
    recommendations.push({
      priority: "medium" as const,
      action:
        "Create department-specific value propositions for each stakeholder group",
      rationale:
        "Tailored messaging improves relevance and buy-in across departments",
      timeline: "Week 2-4",
    });
  }

  return recommendations;
}
