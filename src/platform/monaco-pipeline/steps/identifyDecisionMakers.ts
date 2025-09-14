import { PipelineData, Person, InfluenceAnalysis } from "../types";
import {
  isAboveTheLine,
  inferSeniority,
  scorePersonForRole,
} from "../../utils/normalization";

/**
 * Enhanced Buyer Group Optimization with Advanced Algorithms
 * Implements sophisticated candidate scoring, group composition optimization,
 * and role-based recommendation engine for maximum decision influence
 */

interface DecisionMakerCandidate {
  personId: string;
  name: string;
  title: string;
  department: string;
  role: string;
  influenceScore: number;
  decisionPower: number;
  seniorityLevel: string;
  isAboveTheLine: boolean;
  networkConnections: string[];
  overallScore: number;
  rationale: string[];
}

interface OptimizedBuyerGroup {
  groupId: string;
  companyId: string;
  companyName: string;
  members: DecisionMakerCandidate[];
  totalInfluence: number;
  decisionCoverage: number;
  departmentCoverage: number;
  networkDensity: number;
  rolesCovered: string[];
  recommendations: {
    primaryContact: DecisionMakerCandidate;
    champions: DecisionMakerCandidate[];
    decisionMakers: DecisionMakerCandidate[];
    blockers: DecisionMakerCandidate[];
    stakeholders: DecisionMakerCandidate[];
    openers: DecisionMakerCandidate[];
  };
}

interface PowerScore {
  personId: string;
  totalScore: number;
  keyRelationships: string[];
}

// Configuration for buyer group optimization
const GROUP_CONFIG = {
  groupSizes: {
    minSize: 3,
    maxSize: 7,
    optimalSize: 5,
  },
  roleWeights: {
    decision_maker: 1.0,
    influencer: 0.8,
    technical_evaluator: 0.7,
    budget_holder: 0.9,
    end_user: 0.6,
  },
  departmentWeights: {
    Engineering: 0.9,
    Product: 0.8,
    Sales: 0.7,
    Marketing: 0.6,
    HR: 0.5,
    Finance: 0.8,
    Operations: 0.7,
    "Customer Success": 0.6,
    Legal: 0.7,
    IT: 0.8,
  },
  influenceThresholds: {
    high: 0.8,
    medium: 0.5,
    low: 0.3,
  },
};

export const identifyDecisionMakers = {
  id: 17,
  name: "Identify Decision Makers",
  description:
    "Identify and optimize decision maker selection using advanced algorithms",

  validate: (data: PipelineData) => {
    return !!data.peopleData?.length;
  },

  run: async (data: PipelineData) => {
    if (!data.peopleData || data['peopleData']['length'] === 0) {
      throw new Error("People data is required to identify decision makers");
    }

    try {
      const optimizedBuyerGroups: OptimizedBuyerGroup[] = [];

      // Group people by company
      const peopleByCompany = groupPeopleByCompany(data.peopleData);

      for (const [companyId, people] of peopleByCompany) {
        const companyName = people[0]?.companyId || companyId; // Assuming companyId contains name

        // Create decision maker candidates
        const candidates = createDecisionMakerCandidates(
          people,
          data.influenceAnalyses,
        );

        // Optimize buyer group composition
        const optimizedGroup = optimizeBuyerGroupComposition(
          companyId,
          companyName,
          candidates,
        );

        optimizedBuyerGroups.push(optimizedGroup);
      }

      return {
        optimizedBuyerGroups,
      };
    } catch (error) {
      console.error("Error identifying decision makers:", error);
      throw new Error(
        `Failed to identify decision makers: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};

function groupPeopleByCompany(people: Person[]): Map<string, Person[]> {
  const grouped = new Map<string, Person[]>();

  for (const person of people) {
    const companyId = person.companyId;
    if (!grouped.has(companyId)) {
      grouped.set(companyId, []);
    }
    grouped.get(companyId)!.push(person);
  }

  return grouped;
}

function createDecisionMakerCandidates(
  people: Person[],
  influenceAnalyses?: InfluenceAnalysis[],
): DecisionMakerCandidate[] {
  const candidates: DecisionMakerCandidate[] = [];

  // Create a map of influence analysis data
  const influenceMap = new Map<string, PowerScore>();
  if (influenceAnalyses) {
    for (const analysis of influenceAnalyses) {
      for (const powerScore of analysis.powerScores) {
        influenceMap.set(powerScore.personId, powerScore);
      }
    }
  }

  for (const person of people) {
    const powerData = influenceMap.get(person.id);
    const seniorityLevel = inferSeniority(person.title);
    const aboveTheLine = isAboveTheLine(person.title);

    // Calculate influence score
    const influenceScore =
      powerData?.totalScore ||
      person.influence ||
      calculateBasicInfluenceScore(person);

    // Determine role in decision process
    const determinedRole = determineRole(person, influenceScore, aboveTheLine);

    // Calculate overall candidate score
    const { score: roleScore, rationale } = scorePersonForRole(
      person,
      determinedRole,
    );
    const departmentWeight =
      GROUP_CONFIG['departmentWeights'][
        person.department as keyof typeof GROUP_CONFIG.departmentWeights
      ] || 0.5;
    const overallScore =
      influenceScore * 0.4 + roleScore * 0.4 + departmentWeight * 0.2;

    const candidate: DecisionMakerCandidate = {
      personId: person.id,
      name: person.name,
      title: person.title || "Unknown Title",
      department: person.department || "Unknown Department",
      role: determinedRole,
      influenceScore,
      decisionPower: person.decisionPower,
      seniorityLevel,
      isAboveTheLine: aboveTheLine,
      networkConnections: powerData?.keyRelationships || [],
      overallScore,
      rationale: [
        rationale,
        `Seniority: ${seniorityLevel}`,
        `Department: ${person.department || "Unknown"}`,
      ],
    };

    candidates.push(candidate);
  }

  return candidates.sort((a, b) => b.overallScore - a.overallScore);
}

function calculateBasicInfluenceScore(person: Person): number {
  let score = 0;

  // Base score from existing influence field
  score += person.influence || 0;

  // Seniority bonus
  if (isAboveTheLine(person.title)) {
    score += 0.3;
  }

  // Decision power bonus
  score += (person.decisionPower || 0) * 0.2;

  return Math.min(score, 1.0);
}

function determineRole(
  person: Person,
  influenceScore: number,
  isAboveTheLine: boolean,
): "champion" | "decision_maker" | "blocker" | "stakeholder" | "opener" {
  const department = person.department || "";

  if (isAboveTheLine && influenceScore > 0.7) {
    return "decision_maker";
  } else if (
    influenceScore > 0.6 &&
    ["Product", "Engineering"].includes(department)
  ) {
    return "champion";
  } else if (["Legal", "Finance", "IT"].includes(department)) {
    return "blocker";
  } else if (["Sales", "Marketing", "Customer Success"].includes(department)) {
    return "opener";
  } else {
    return "stakeholder";
  }
}

function optimizeBuyerGroupComposition(
  companyId: string,
  companyName: string,
  candidates: DecisionMakerCandidate[],
): OptimizedBuyerGroup {
  // Start with the highest-scoring candidate
  const selectedMembers = [candidates[0]];
  const remainingCandidates = candidates.slice(1);

  // Add members while optimizing group metrics
  while (
    selectedMembers.length < GROUP_CONFIG['groupSizes']['optimalSize'] &&
    remainingCandidates.length > 0
  ) {
    let bestCandidate: DecisionMakerCandidate | null = null;
    let bestScore = -1;

    for (let i = 0; i < remainingCandidates.length; i++) {
      const candidate = remainingCandidates[i];
      if (!candidate) continue; // Skip undefined candidates
      const testGroup = [...selectedMembers, candidate].filter(
        (m): m is DecisionMakerCandidate => !!m,
      );
      const metrics = calculateGroupMetrics(testGroup);

      // Score based on metrics
      const score =
        metrics.totalInfluence * 0.4 +
        metrics.decisionCoverage * 0.3 +
        metrics.departmentCoverage * 0.2 +
        metrics.networkDensity * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      selectedMembers.push(bestCandidate);
      const index = remainingCandidates.indexOf(bestCandidate);
      remainingCandidates.splice(index, 1);
    } else {
      break;
    }
  }

  const validMembers = selectedMembers.filter(
    (m): m is DecisionMakerCandidate => !!m,
  );
  const metrics = calculateGroupMetrics(validMembers);

  // Create role-based recommendations
  const recommendations = createRoleRecommendations(validMembers);

  return {
    groupId: `optimized_group_${companyId}`,
    companyId,
    companyName,
    members: selectedMembers.filter((m): m is DecisionMakerCandidate => !!m), // Filter out undefined
    totalInfluence: metrics.totalInfluence,
    decisionCoverage: metrics.decisionCoverage,
    departmentCoverage: metrics.departmentCoverage,
    networkDensity: metrics.networkDensity,
    rolesCovered: Array.from(
      new Set(selectedMembers.filter((m) => m?.role).map((m) => m!.role)),
    ),
    recommendations,
  };
}

function calculateGroupMetrics(members: DecisionMakerCandidate[]): {
  totalInfluence: number;
  decisionCoverage: number;
  departmentCoverage: number;
  networkDensity: number;
} {
  // Total influence
  const totalInfluence = members.reduce(
    (sum, member) => sum + member.influenceScore,
    0,
  );

  // Decision coverage
  const decisionPower = members.reduce(
    (sum, member) => sum + member.decisionPower,
    0,
  );
  const maxDecisionPower = Math.max(...members.map((m) => m.decisionPower));
  const decisionCoverage =
    maxDecisionPower > 0 ? decisionPower / maxDecisionPower : 0;

  // Department coverage
  const departments = new Set(members.map((m) => m.department));
  const departmentCoverage =
    departments.size / Object.keys(GROUP_CONFIG.departmentWeights).length;

  // Network density (simplified)
  const connections = members.reduce(
    (sum, member) => sum + member.networkConnections.length,
    0,
  );
  const maxConnections = members.length * (members.length - 1);
  const networkDensity = maxConnections > 0 ? connections / maxConnections : 0;

  return {
    totalInfluence,
    decisionCoverage,
    departmentCoverage,
    networkDensity,
  };
}

function createRoleRecommendations(
  members: DecisionMakerCandidate[],
): OptimizedBuyerGroup["recommendations"] {
  const membersByRole = new Map<string, DecisionMakerCandidate[]>();

  for (const member of members) {
    if (!membersByRole.has(member.role)) {
      membersByRole.set(member.role, []);
    }
    membersByRole.get(member.role)!.push(member);
  }

  // Sort members within each role by overall score
  for (const [, roleMembers] of membersByRole) {
    roleMembers.sort((a, b) => b.overallScore - a.overallScore);
  }

  return {
    primaryContact: members[0] || {
      personId: "unknown",
      name: "Unknown",
      title: "Unknown",
      department: "Unknown",
      role: "stakeholder",
      influenceScore: 0,
      decisionPower: 0,
      seniorityLevel: "Individual Contributor",
      isAboveTheLine: false,
      networkConnections: [],
      overallScore: 0,
      rationale: ["Fallback contact"],
    }, // Highest overall score
    champions: membersByRole.get("champion") || [],
    decisionMakers: membersByRole.get("decision_maker") || [],
    blockers: membersByRole.get("blocker") || [],
    stakeholders: membersByRole.get("stakeholder") || [],
    openers: membersByRole.get("opener") || [],
  };
}

/**
 * Get recommended next contact based on current deal state
 */
export function getRecommendedContact(
  optimizedGroup: OptimizedBuyerGroup,
  contactHistory: Record<
    string,
    { contacted: boolean; response?: "positive" | "negative" | "neutral" }
  >,
): DecisionMakerCandidate | null {
  // Priority order: decision makers -> champions -> openers -> stakeholders
  const priorityOrder = [
    ...optimizedGroup.recommendations.decisionMakers,
    ...optimizedGroup.recommendations.champions,
    ...optimizedGroup.recommendations.openers,
    ...optimizedGroup.recommendations.stakeholders,
  ];

  // Find first uncontacted person
  for (const candidate of priorityOrder) {
    if (!contactHistory[candidate.personId]?.contacted) {
      return candidate;
    }
  }

  // If everyone has been contacted, return the primary contact
  return optimizedGroup.recommendations.primaryContact;
}
