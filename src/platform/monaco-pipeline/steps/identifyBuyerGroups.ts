import {
  PipelineData,
  BuyerGroup,
  Person,
  InfluenceAnalysis,
  OrgStructure,
} from "../types";

// Basic buyer group identification without influence analysis
function identifyBasicBuyerGroups(
  peopleData: Person[],
  orgStructures: OrgStructure[],
): Partial<PipelineData> {
  // Group people by department
  const departmentGroups = new Map<string, Person[]>();

  peopleData.forEach((person) => {
    if (person.department) {
      const deptGroup = departmentGroups.get(person.department) || [];
      deptGroup.push(person);
      departmentGroups.set(person.department, deptGroup);
    }
  });

  // Create basic buyer groups
  const buyerGroups: BuyerGroup[] = [];

  for (const [dept, members] of departmentGroups) {
    // Basic categorization based on titles and department
    const champions = members
      .filter(
        (p) =>
          (p.title || "").toLowerCase().includes("director") ||
          (p.title || "").toLowerCase().includes("vp"),
      )
      .map((p) => p.id);
    const decisionMakers = members
      .filter(
        (p) =>
          (p.title || "").toLowerCase().includes("manager") ||
          (p.title || "").toLowerCase().includes("lead"),
      )
      .map((p) => p.id);
    const stakeholders = members.map((p) => p.id);

    buyerGroups.push({
      id: `dept-${dept.toLowerCase().replace(/\s+/g, "-")}`,
      name: `${dept} Department`,
      companyId: (members[0] || { companyId: "unknown" }).companyId,
      companyName: (members[0] || { companyId: "unknown" }).companyId,
      champions,
      decisionMakers,
      blockers: [],
      stakeholders,
      openers: champions,
      members: members.map((m) => m.id),
      influencers: champions,
      characteristics: [
        `${dept} department with ${members.length} members`,
        "Basic categorization analysis",
      ],
      dynamics: {
        powerDistribution: 0.5,
        consensusLevel: 0.5,
        riskLevel: 0.3,
      },
      rationale: {
        champions: champions.map((id) => {
          const person = members.find((m) => m['id'] === id)!;
          return {
            personId: id,
            name: person.name,
            title: person.title || "Unknown Title",
            department: person.department || "Unknown Department",
            score: 0.7,
            rationale: "Basic categorization based on title",
          };
        }),
        decisionMakers: decisionMakers.map((id) => {
          const person = members.find((m) => m['id'] === id)!;
          return {
            personId: id,
            name: person.name,
            title: person.title || "Unknown Title",
            department: person.department || "Unknown Department",
            score: 0.6,
            rationale: "Basic categorization based on title",
          };
        }),
        blockers: [],
        stakeholders: stakeholders.map((id) => {
          const person = members.find((m) => m['id'] === id)!;
          return {
            personId: id,
            name: person.name,
            title: person.title || "Unknown Title",
            department: person.department || "Unknown Department",
            score: 0.5,
            rationale: "Basic categorization - all department members",
          };
        }),
        openers: champions.map((id) => {
          const person = members.find((m) => m['id'] === id)!;
          return {
            personId: id,
            name: person.name,
            title: person.title || "Unknown Title",
            department: person.department || "Unknown Department",
            score: 0.7,
            rationale: "Basic categorization based on title",
          };
        }),
        note: [
          {
            info: `Basic analysis for ${members.length} members in ${dept} department (no influence analysis available)`,
          },
        ],
      },
    });
  }

  return { buyerGroups };
}

export async function identifyBuyerGroups(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const { peopleData, orgStructures, influenceAnalyses } = data;

  if (!peopleData || !orgStructures) {
    throw new Error("Required data missing for buyer group identification");
  }

  // If influence analyses are missing, proceed with basic categorization
  if (!influenceAnalyses || influenceAnalyses['length'] === 0) {
    console.warn(
      "No influence analyses available, using basic buyer group identification",
    );
    return identifyBasicBuyerGroups(peopleData, orgStructures);
  }

  // Group people by department
  const departmentGroups = new Map<string, Person[]>();

  peopleData.forEach((person) => {
    if (person.department) {
      const deptGroup = departmentGroups.get(person.department) || [];
      deptGroup.push(person);
      departmentGroups.set(person.department, deptGroup);
    }
  });

  // Analyze each group
  const buyerGroups: BuyerGroup[] = [];

  // Process department groups
  for (const [dept, members] of departmentGroups) {
    const groupAnalysis = analyzeGroup(dept, members, influenceAnalyses);
    if (groupAnalysis.dynamics.powerDistribution > 0.3) {
      // Only include influential groups
      buyerGroups.push({
        id: `dept-${dept.toLowerCase().replace(/\s+/g, "-")}`,
        name: `${dept} Department`,
        companyId: (members[0] || { companyId: "unknown" }).companyId,
        companyName: (members[0] || { companyId: "unknown" }).companyId, // This should be looked up from buyerCompanies
        champions: groupAnalysis.champions,
        decisionMakers: groupAnalysis.decisionMakers,
        blockers: groupAnalysis.blockers,
        stakeholders: groupAnalysis.stakeholders,
        openers: groupAnalysis.openers,
        members: members.map((m) => m.id),
        influencers: groupAnalysis.influencers,
        characteristics: [
          `${dept} department with ${members.length} members`,
          `Power distribution: ${groupAnalysis.dynamics.powerDistribution.toFixed(2)}`,
        ],
        dynamics: groupAnalysis.dynamics,
        rationale: groupAnalysis.rationale,
      });
    }
  }

  return { buyerGroups };
}

function analyzeGroup(
  groupName: string,
  members: Person[],
  influenceAnalyses: InfluenceAnalysis[],
): {
  champions: string[];
  decisionMakers: string[];
  blockers: string[];
  stakeholders: string[];
  openers: string[];
  influencers: string[];
  dynamics: {
    powerDistribution: number;
    consensusLevel: number;
    riskLevel: number;
  };
  rationale: {
    champions: Array<{
      personId: string;
      name: string;
      title: string;
      department: string;
      score: number;
      rationale: string;
    }>;
    decisionMakers: Array<{
      personId: string;
      name: string;
      title: string;
      department: string;
      score: number;
      rationale: string;
    }>;
    blockers: Array<{
      personId: string;
      name: string;
      title: string;
      department: string;
      score: number;
      rationale: string;
    }>;
    stakeholders: Array<{
      personId: string;
      name: string;
      title: string;
      department: string;
      score: number;
      rationale: string;
    }>;
    openers: Array<{
      personId: string;
      name: string;
      title: string;
      department: string;
      score: number;
      rationale: string;
    }>;
    note?: Array<{ info: string }>;
  };
} {
  // Find the relevant influence analysis
  const companyId = (members[0] || { companyId: "unknown" }).companyId;
  const influenceAnalysis = influenceAnalyses.find(
    (ia) => ia['companyId'] === companyId,
  );

  if (!influenceAnalysis) {
    throw new Error(`No influence analysis found for company ${companyId}`);
  }

  // Calculate group metrics
  const powerDistribution =
    members.reduce((sum, person) => {
      const analysis = influenceAnalysis.powerScores.find(
        (ps) => ps['personId'] === person.id,
      );
      return sum + (analysis?.totalScore || 0);
    }, 0) / members.length;

  const consensusLevel =
    members.reduce((sum, person) => {
      const analysis = influenceAnalysis.powerScores.find(
        (ps) => ps['personId'] === person.id,
      );
      return sum + (analysis?.influenceRadius || 0);
    }, 0) / members.length;

  const riskLevel =
    members.reduce((sum, person) => {
      const analysis = influenceAnalysis.powerScores.find(
        (ps) => ps['personId'] === person.id,
      );
      return sum + (analysis?.decisionMakingStyle === "risk_averse" ? 1 : 0);
    }, 0) / members.length;

  // Categorize members
  const champions: string[] = [];
  const decisionMakers: string[] = [];
  const blockers: string[] = [];
  const stakeholders: string[] = [];
  const openers: string[] = [];
  const influencers: string[] = [];

  const championRationale: Array<{
    personId: string;
    name: string;
    title: string;
    department: string;
    score: number;
    rationale: string;
  }> = [];

  const decisionMakerRationale: Array<{
    personId: string;
    name: string;
    title: string;
    department: string;
    score: number;
    rationale: string;
  }> = [];

  const blockerRationale: Array<{
    personId: string;
    name: string;
    title: string;
    department: string;
    score: number;
    rationale: string;
  }> = [];

  const stakeholderRationale: Array<{
    personId: string;
    name: string;
    title: string;
    department: string;
    score: number;
    rationale: string;
  }> = [];

  const openerRationale: Array<{
    personId: string;
    name: string;
    title: string;
    department: string;
    score: number;
    rationale: string;
  }> = [];

  members.forEach((person) => {
    const analysis = influenceAnalysis.powerScores.find(
      (ps) => ps['personId'] === person.id,
    );
    if (!analysis) return;

    // Categorize based on influence scores and decision making style
    if (analysis.totalScore > 0.8) {
      champions.push(person.id);
      championRationale.push({
        personId: person.id,
        name: person.name,
        title: person.title || "Unknown Title",
        department: person.department || "Unknown Department",
        score: analysis.totalScore,
        rationale: `High influence score (${analysis.totalScore}) and strong network connections`,
      });
    }

    if (
      analysis['decisionMakingStyle'] === "decisive" &&
      analysis.totalScore > 0.6
    ) {
      decisionMakers.push(person.id);
      decisionMakerRationale.push({
        personId: person.id,
        name: person.name,
        title: person.title || "Unknown Title",
        department: person.department || "Unknown Department",
        score: analysis.totalScore,
        rationale: `Decisive decision maker with high influence (${analysis.totalScore})`,
      });
    }

    if (
      analysis['decisionMakingStyle'] === "risk_averse" &&
      analysis.totalScore > 0.5
    ) {
      blockers.push(person.id);
      blockerRationale.push({
        personId: person.id,
        name: person.name,
        title: person.title || "Unknown Title",
        department: person.department || "Unknown Department",
        score: analysis.totalScore,
        rationale: `Risk-averse decision maker with moderate influence (${analysis.totalScore})`,
      });
    }

    if (analysis.influenceRadius > 0.7) {
      stakeholders.push(person.id);
      stakeholderRationale.push({
        personId: person.id,
        name: person.name,
        title: person.title || "Unknown Title",
        department: person.department || "Unknown Department",
        score: analysis.influenceRadius,
        rationale: `High influence radius (${analysis.influenceRadius}) affecting multiple stakeholders`,
      });
    }

    if (analysis.networkScore > 0.7) {
      openers.push(person.id);
      openerRationale.push({
        personId: person.id,
        name: person.name,
        title: person.title || "Unknown Title",
        department: person.department || "Unknown Department",
        score: analysis.networkScore,
        rationale: `Strong network connections (${analysis.networkScore}) making them good conversation openers`,
      });
    }

    if (analysis.totalScore > 0.5) {
      influencers.push(person.id);
    }
  });

  return {
    champions,
    decisionMakers,
    blockers,
    stakeholders,
    openers,
    influencers,
    dynamics: {
      powerDistribution,
      consensusLevel,
      riskLevel,
    },
    rationale: {
      champions: championRationale,
      decisionMakers: decisionMakerRationale,
      blockers: blockerRationale,
      stakeholders: stakeholderRationale,
      openers: openerRationale,
      note: [
        {
          info: `Analyzed ${members.length} members in ${groupName} department`,
        },
      ],
    },
  };
}
