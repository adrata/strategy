import { PipelineData, Person } from "../types";
import {
  inferDepartment,
  inferTeam,
  enhancedTeamInference,
  inferPersonality,
  inferSeniority,
  isAboveTheLine,
  calculateInfluenceScore,
  TeamMapping,
} from "../../utils/normalization";

interface RankedPerson extends Person {
  influenceScore: number;
  rank: number;
  rationale: string[];
  department: string;
  team: string;
  teamMapping: TeamMapping; // Enhanced team information
  personality: string[];
  seniorityLevel: string;
  isAboveTheLine: boolean;
}

export async function findOptimalPeople(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  if (!data.peopleData || data['peopleData']['length'] === 0) {
    throw new Error("People data is required to find optimal people");
  }

  try {
    const rankedPeople: RankedPerson[] = [];

    // Process each person through enrichment and scoring
    for (const person of data.peopleData) {
      const enrichedPerson = await enrichAndScorePerson(person);
      rankedPeople.push(enrichedPerson);
    }

    // Sort by influence score (highest first)
    rankedPeople.sort((a, b) => b.influenceScore - a.influenceScore);

    // Add rank numbers
    rankedPeople.forEach((person, index) => {
      person['rank'] = index + 1;
    });

    return {
      peopleData: rankedPeople,
    };
  } catch (error) {
    console.error("Error finding optimal people:", error);
    throw new Error(
      `Failed to find optimal people: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function enrichAndScorePerson(person: Person): Promise<RankedPerson> {
  // Enhanced team mapping
  const teamMapping = enhancedTeamInference(person);
  
  // Backward compatibility fields
  const department = teamMapping.department;
  const team = teamMapping.team;
  
  // Other enrichments
  const personality = inferPersonality({
    title: person.title,
    department: person.department,
  });
  const seniorityLevel = inferSeniority(person.title);
  const aboveTheLine = isAboveTheLine(person.title);

  // Calculate influence score
  const influenceScore = calculateInfluenceScore({
    ...person,
    followers: person.followers,
    connections: person.connections,
    postFrequency: person.postFrequency,
    title: person.title,
    department: department,
  });

  const rationale = [
    `Influence score: ${influenceScore}`,
    `Business Unit: ${teamMapping.businessUnit}`,
    `Department: ${department}`,
    `Team: ${team}`,
    `Team Type: ${teamMapping.teamType}`,
    `Seniority: ${seniorityLevel}`,
  ];

  // Add sub-team and specialization to rationale if available
  if (teamMapping.subTeam) {
    rationale.push(`Sub-team: ${teamMapping.subTeam}`);
  }
  if (teamMapping.specialization) {
    rationale.push(`Specialization: ${teamMapping.specialization}`);
  }

  return {
    ...person,
    department,
    team,
    teamMapping, // Full enhanced team information
    personality,
    seniorityLevel,
    isAboveTheLine: aboveTheLine,
    influenceScore: influenceScore,
    rationale,
    rank: 0, // Will be set after sorting
  };
}

/**
 * Filter people based on criteria
 */
export function filterPeopleByRole(
  people: RankedPerson[],
  targetRoles: string[],
  minInfluenceScore: number = 0.3,
): RankedPerson[] {
  return people.filter((person) => {
    // Must meet minimum influence score
    if (person.influenceScore < minInfluenceScore) {
      return false;
    }

    // Check if person fits any of the target roles
    const titleLower = person.title.toLowerCase();
    return targetRoles.some((role) => {
      const roleLower = role.toLowerCase();
      return (
        titleLower.includes(roleLower) ||
        person.department.toLowerCase().includes(roleLower)
      );
    });
  });
}

/**
 * Find champions - high influence people who can advocate for the solution
 */
export function findChampions(people: RankedPerson[]): RankedPerson[] {
  return people
    .filter(
      (person) =>
        person.influenceScore > 0.6 &&
        ["Product", "Engineering", "Operations"].includes(person.department) &&
        person.personality.includes("Direct"),
    )
    .slice(0, 5); // Top 5 potential champions
}

/**
 * Find decision makers - executives and senior leaders with decision authority
 */
export function findDecisionMakers(people: RankedPerson[]): RankedPerson[] {
  return people
    .filter(
      (person) =>
        person['isAboveTheLine'] &&
        person.influenceScore > 0.5 &&
        ["C-Suite", "VP", "Director"].includes(person.seniorityLevel),
    )
    .slice(0, 3); // Top 3 decision makers
}

/**
 * Find potential blockers - risk-averse roles that might resist change
 */
export function findPotentialBlockers(people: RankedPerson[]): RankedPerson[] {
  return people
    .filter(
      (person) =>
        ["Legal", "Finance", "IT"].includes(person.department) &&
        person.personality.includes("Rule-Follower") &&
        person.influenceScore > 0.4,
    )
    .slice(0, 3); // Top 3 potential blockers to monitor
}

/**
 * Find stakeholders - people who will be impacted by the decision
 */
export function findStakeholders(people: RankedPerson[]): RankedPerson[] {
  return people
    .filter(
      (person) =>
        person.influenceScore > 0.3 &&
        !person['isAboveTheLine'] && // Not already a decision maker
        ["HR", "Operations", "Customer Success", "Marketing"].includes(
          person.department,
        ),
    )
    .slice(0, 8); // Top 8 stakeholders
}

/**
 * Find openers - people who can facilitate introductions
 */
export function findOpeners(people: RankedPerson[]): RankedPerson[] {
  return people
    .filter(
      (person) =>
        person.personality.includes("Chatty") &&
        ["Sales", "Marketing", "Customer Success"].includes(
          person.department,
        ) &&
        (person.connections || 0) > 300,
    )
    .slice(0, 5); // Top 5 potential openers
}
