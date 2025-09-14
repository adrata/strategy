import { z } from "zod";

// People Data Types
export const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  companyId: z.string(),
  linkedinUrl: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  influence: z.number(),
  decisionPower: z.number(),
  department: z.string(),
  level: z.number(),
  reportsTo: z.string().optional(),
  directReports: z.array(z.string()),
  // Additional fields for influence analysis matching Python version
  connections: z.number().optional(),
  followers: z.number().optional(),
  postFrequency: z.number().optional(),
  startDate: z.string().optional(),
  activityScore: z.number().optional(),
  seniorityLevel: z.string().optional(),
});

export type Person = z.infer<typeof PersonSchema>;

// Organization Structure Types
export const OrgStructureSchema = z.object({
  companyId: z.string(),
  departments: z.array(
    z.object({
      name: z.string(),
      head: z.string(),
      members: z.array(z.string()),
      subDepartments: z.array(z.string()),
    }),
  ),
  hierarchy: z.array(
    z.object({
      personId: z.string(),
      level: z.number(),
      reportsTo: z.string().nullable(),
      directReports: z.array(z.string()),
    }),
  ),
});

export type OrgStructure = z.infer<typeof OrgStructureSchema>;

// Buyer Group Types
export interface GroupMember {
  personId: string;
  name: string;
  title: string;
  department: string;
  score: number;
  rationale: string;
}

export interface BuyerGroup {
  id: string;
  companyId: string;
  companyName: string;
  champions: string[];
  decisionMakers: string[];
  blockers: string[];
  stakeholders: string[];
  openers: string[];
  members: string[];
  influencers: string[];
  dynamics: {
    powerDistribution: number;
    consensusLevel: number;
    riskLevel: number;
  };
  rationale: {
    champions: GroupMember[];
    decisionMakers: GroupMember[];
    blockers: GroupMember[];
    stakeholders: GroupMember[];
    openers: GroupMember[];
    note?: { info: string }[];
  };
}

export const BuyerGroupSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  champions: z.array(z.string()),
  decisionMakers: z.array(z.string()),
  blockers: z.array(z.string()),
  stakeholders: z.array(z.string()),
  openers: z.array(z.string()),
  members: z.array(z.string()),
  influencers: z.array(z.string()),
  dynamics: z.object({
    powerDistribution: z.number(),
    consensusLevel: z.number(),
    riskLevel: z.number(),
  }),
  rationale: z.object({
    champions: z.array(
      z.object({
        personId: z.string(),
        name: z.string(),
        title: z.string(),
        department: z.string(),
        score: z.number(),
        rationale: z.string(),
      }),
    ),
    decisionMakers: z.array(
      z.object({
        personId: z.string(),
        name: z.string(),
        title: z.string(),
        department: z.string(),
        score: z.number(),
        rationale: z.string(),
      }),
    ),
    blockers: z.array(
      z.object({
        personId: z.string(),
        name: z.string(),
        title: z.string(),
        department: z.string(),
        score: z.number(),
        rationale: z.string(),
      }),
    ),
    stakeholders: z.array(
      z.object({
        personId: z.string(),
        name: z.string(),
        title: z.string(),
        department: z.string(),
        score: z.number(),
        rationale: z.string(),
      }),
    ),
    openers: z.array(
      z.object({
        personId: z.string(),
        name: z.string(),
        title: z.string(),
        department: z.string(),
        score: z.number(),
        rationale: z.string(),
      }),
    ),
    note: z
      .array(
        z.object({
          info: z.string(),
        }),
      )
      .optional(),
  }),
});

// Organization Model Types
export interface OrgModel {
  companyId: string;
  levels: {
    level: number;
    people: string[];
    relationships: {
      from: string;
      to: string;
      type: "reports_to" | "peer" | "manages";
    }[];
  }[];
  metrics: {
    totalPeople: number;
    avgSpanOfControl: number;
    maxDepth: number;
    departmentCount: number;
  };
}

// Influence Analysis Types
export interface InfluenceAnalysis {
  companyId: string;
  powerScores: {
    personId: string;
    name: string;
    title: string;
    department: string;
    totalScore: number;
    seniorityScore: number;
    networkScore: number;
    tenureScore: number;
    departmentScore: number;
    activityScore: number;
    influenceRadius: number;
    keyRelationships: string[];
    decisionMakingStyle: string;
  }[];
  decisionPatterns: Record<
    string,
    {
      style: string;
      centrality: number;
      influenceRadius: number;
    }
  >;
}

// Decision Flow Types
export interface DecisionFlow {
  companyId: string;
  paths: {
    pathId: string;
    stages: string[];
    nodes: {
      personId: string;
      name: string;
      title: string;
      department: string;
      role: string;
      stage: string;
      approvalThreshold: number;
      requiredApprovals: string[];
      optionalApprovals: string[];
    }[];
    totalDuration: number;
    criticalPath: string[];
    bottlenecks: string[];
  }[];
  bottlenecks: string[];
  avgPathDuration: number;
  criticalPaths: string[];
}
