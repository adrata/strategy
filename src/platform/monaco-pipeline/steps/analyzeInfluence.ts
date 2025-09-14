import { PipelineData, Person, OrgStructure } from "../types";
// Simple graph implementation to match the expected interface
class SimpleGraph {
  private nodes: Map<string, any> = new Map();
  private edges: Map<string, any> = new Map();
  private adjacency: Map<string, Set<string>> = new Map();
  private reverseAdjacency: Map<string, Set<string>> = new Map();

  addNode(id: string, attributes: any = {}) {
    this.nodes.set(id, attributes);
    if (!this.adjacency.has(id)) {
      this.adjacency.set(id, new Set());
    }
    if (!this.reverseAdjacency.has(id)) {
      this.reverseAdjacency.set(id, new Set());
    }
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  addEdge(source: string, target: string, attributes: any = {}) {
    const edgeId = `${source}->${target}`;
    this.edges.set(edgeId, attributes);
    this.adjacency.get(source)?.add(target);
    this.reverseAdjacency.get(target)?.add(source);
  }

  get order(): number {
    return this.nodes.size;
  }

  outDegree(nodeId: string): number {
    return this.adjacency.get(nodeId)?.size || 0;
  }

  inDegree(nodeId: string): number {
    return this.reverseAdjacency.get(nodeId)?.size || 0;
  }

  forEachNode(callback: (nodeId: string, attributes: any) => void) {
    this.nodes.forEach((attributes, nodeId) => {
      callback(nodeId, attributes);
    });
  }

  forEachOutNeighbor(nodeId: string, callback: (neighbor: string) => void) {
    const neighbors = this.adjacency.get(nodeId);
    if (neighbors) {
      neighbors.forEach(callback);
    }
  }

  forEachInNeighbor(nodeId: string, callback: (neighbor: string) => void) {
    const neighbors = this.reverseAdjacency.get(nodeId);
    if (neighbors) {
      neighbors.forEach(callback);
    }
  }

  getEdgeAttributes(source: string, target: string): any {
    const edgeId = `${source}->${target}`;
    return this.edges.get(edgeId) || {};
  }

  forEachEdge(
    callback: (
      edgeId: string,
      attributes: any,
      source: string,
      target: string,
    ) => void,
  ) {
    this.edges.forEach((attributes, edgeId) => {
      const [source, target] = edgeId.split("->");
      callback(edgeId, attributes, source || "unknown", target || "unknown");
    });
  }
}
import fs from "fs";
import path from "path";
// import {
//   cleanTitle,
//   inferDepartment,
//   normalizeSeniorityLevel,
//   calculateInfluenceScore,
//   isAboveTheLine
// } from '../enrichment/utils';

// Temporary inline utility functions
function cleanTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

function inferDepartment(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("engineer") || lowerTitle.includes("developer"))
    return "Engineering";
  if (lowerTitle.includes("product") && !lowerTitle.includes("production"))
    return "Product";
  if (lowerTitle.includes("sales") || lowerTitle.includes("account"))
    return "Sales";
  if (lowerTitle.includes("marketing") || lowerTitle.includes("growth"))
    return "Marketing";
  return "Other";
}

// Standardized seniority patterns for consistency across all Monaco pipeline steps
const SENIORITY_PATTERNS = {
  "C-Suite": [
    /\b(ceo|chief executive|president|founder)\b/i,
    /\b(cto|chief technology|chief technical)\b/i,
    /\b(cfo|chief financial)\b/i,
    /\b(coo|chief operating)\b/i,
    /\b(cmo|chief marketing)\b/i,
    /\b(cro|chief revenue)\b/i,
    /\b(chief|c-level|executive officer)\b/i,
  ],
  VP: [
    /\b(vp|vice president|v\.p\.)\b/i,
    /\b(svp|senior vice president)\b/i,
    /\b(evp|executive vice president)\b/i,
  ],
  Director: [
    /\b(director|dir\.)\b/i,
    /\b(senior director|sr director)\b/i,
    /\b(executive director)\b/i,
    /\b(head of|department head)\b/i,
  ],
  Manager: [
    /\b(manager|mgr\.)\b/i,
    /\b(senior manager|sr manager)\b/i,
    /\b(team lead|team leader)\b/i,
    /\b(lead|principal)\b/i,
    /\b(supervisor|coordinator)\b/i,
  ],
  Senior: [
    /\b(senior|sr\.)\b/i,
    /\b(staff|principal)\b/i,
    /\b(architect|specialist)\b/i,
  ],
};

function normalizeSeniorityLevel(title: string): string {
  if (!title || typeof title !== "string") {
    return "Individual Contributor";
  }

  const cleanTitle = title.trim();

  // Check each seniority level in order of precedence
  for (const [seniority, patterns] of Object.entries(SENIORITY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(cleanTitle)) {
        return seniority;
      }
    }
  }

  return "Individual Contributor";
}

function calculateInfluenceScore(
  seniorityLevel: string,
  department: string,
  directReports: number,
): number {
  const baseScores = { "C-Suite": 0.4, VP: 0.3, Director: 0.2, Manager: 0.15 };
  return (
    (baseScores[seniorityLevel as keyof typeof baseScores] || 0.05) +
    directReports * 0.01
  );
}

function isAboveTheLine(
  title: string,
  department: string,
  seniorityLevel: string,
): boolean {
  return (
    seniorityLevel === "C-Suite" ||
    seniorityLevel === "VP" ||
    seniorityLevel === "Director"
  );
}

interface PowerScore {
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
}

interface DecisionPattern {
  style: string;
  centrality: number;
  influenceRadius: number;
}

interface HierarchyNode {
  name: string;
  title: string;
  department: string;
  seniority_level: string;
  reports_to: string | null;
  direct_reports: string[];
  connections: number;
  followers: number;
  start_date: string;
  activity_score: number;
  post_frequency: number;
  above_the_line: boolean;
}

interface HierarchyData {
  hierarchy: Record<string, HierarchyNode>;
  departments: Record<
    string,
    {
      manager: string;
      members: string[];
    }
  >;
}

const CONFIG = {
  powerFactors: {
    seniorityWeight: 0.3,
    networkWeight: 0.2,
    tenureWeight: 0.15,
    departmentWeight: 0.15,
    activityWeight: 0.2,
  },
  seniorityScores: {
    "C-Suite": 1.0,
    VP: 0.8,
    Director: 0.6,
    Manager: 0.4,
    "Individual Contributor": 0.2,
  },
  departmentPower: {
    Engineering: 0.9,
    Product: 0.8,
    Sales: 0.7,
    Marketing: 0.6,
    HR: 0.5,
    Finance: 0.8,
    Operations: 0.7,
    "Customer Success": 0.6,
    Legal: 0.7,
    IT: 0.6,
  },
};

export class InfluenceAnalyzer {
  private powerScores: Record<string, PowerScore> = {};
  private influenceGraph = new SimpleGraph();
  private decisionPatterns: Record<string, DecisionPattern> = {};

  async analyze(data: PipelineData): Promise<Partial<PipelineData>> {
    // Validate input data
    if (!data.peopleData.length || !data.orgStructures.length) {
      throw new Error("People data and organization structures are required");
    }

    // Group people by company
    const companyPeople = this.groupPeopleByCompany(data.peopleData);
    const companyOrgStructures = this.groupOrgStructuresByCompany(
      data.orgStructures,
    );

    // Analyze influence for each company
    const influenceAnalyses = Object.entries(companyPeople)
      .map(([companyId, people]) => {
        const orgStructure = companyOrgStructures[companyId];
        if (!orgStructure) {
          console.warn(`No org structure found for company ${companyId}`);
          return null;
        }

        // Reset for each company
        this['powerScores'] = {};
        this['influenceGraph'] = new SimpleGraph();
        this['decisionPatterns'] = {};

        // Build hierarchy data in Python format
        const hierarchyData = this.buildHierarchyData(people, orgStructure);

        // Analyze power dynamics
        this.analyzePowerDynamics(hierarchyData);

        return {
          companyId,
          powerScores: Object.values(this.powerScores).map((score) => ({
            personId: score.personId,
            name: score.name,
            title: score.title,
            department: score.department,
            totalScore: score.totalScore,
            seniorityScore: score.seniorityScore,
            networkScore: score.networkScore,
            tenureScore: score.tenureScore,
            departmentScore: score.departmentScore,
            activityScore: score.activityScore,
            influenceRadius: score.influenceRadius,
            keyRelationships: score.keyRelationships,
            decisionMakingStyle: score.decisionMakingStyle,
          })),
          decisionPatterns: this.decisionPatterns,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      influenceAnalyses,
    };
  }

  private groupPeopleByCompany(people: Person[]): Record<string, Person[]> {
    return people.reduce(
      (acc, person) => {
        if (!acc[person.companyId]) {
          acc[person.companyId] = [];
        }
        (acc[person.companyId] || []).push(person);
        return acc;
      },
      {} as Record<string, Person[]>,
    );
  }

  private groupOrgStructuresByCompany(
    orgStructures: OrgStructure[],
  ): Record<string, OrgStructure> {
    return orgStructures.reduce(
      (acc, orgStructure) => {
        const companyId = orgStructure.companyId || "unknown";
        acc[companyId] = orgStructure;
        return acc;
      },
      {} as Record<string, OrgStructure>,
    );
  }

  private buildHierarchyData(
    people: Person[],
    orgStructure: OrgStructure,
  ): HierarchyData {
    // Convert TypeScript data to Python-like hierarchy format
    const hierarchy: Record<string, HierarchyNode> = {};
    const departments: Record<string, { manager: string; members: string[] }> =
      {};

    // Build hierarchy nodes with enrichment
    people.forEach((person) => {
      const cleanedTitle = cleanTitle(person.title || "");
      const inferredDepartment =
        person.department || inferDepartment(cleanedTitle);
      const seniorityLevel =
        person.seniorityLevel || normalizeSeniorityLevel(cleanedTitle);

      hierarchy[person.id] = {
        name: person.name,
        title: cleanedTitle,
        department: inferredDepartment,
        seniority_level: seniorityLevel,
        reports_to: person.reportsTo || null,
        direct_reports: person.directReports || [],
        connections: person.connections || 0,
        followers: person.followers || 0,
        start_date: person.startDate || "",
        activity_score:
          person.activityScore ||
          calculateInfluenceScore(
            seniorityLevel,
            inferredDepartment,
            (person.directReports || []).length,
          ),
        post_frequency: person.postFrequency || 0,
        above_the_line: isAboveTheLine(
          cleanedTitle,
          inferredDepartment,
          seniorityLevel,
        ),
      };
    });

    // Build departments
    orgStructure.departments.forEach((dept) => {
      departments[dept.name] = {
        manager: dept.head,
        members: dept.members,
      };
    });

    return { hierarchy, departments };
  }

  private inferSeniorityLevel(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (
      lowerTitle.includes("ceo") ||
      lowerTitle.includes("cto") ||
      lowerTitle.includes("cfo") ||
      lowerTitle.includes("chief")
    ) {
      return "C-Suite";
    } else if (
      lowerTitle.includes("vp") ||
      lowerTitle.includes("vice president")
    ) {
      return "VP";
    } else if (lowerTitle.includes("director")) {
      return "Director";
    } else if (lowerTitle.includes("manager") || lowerTitle.includes("lead")) {
      return "Manager";
    } else {
      return "Individual Contributor";
    }
  }

  private calculateSeniorityScore(seniorityLevel: string): number {
    return (
      CONFIG['seniorityScores'][
        seniorityLevel as keyof typeof CONFIG.seniorityScores
      ] || 0.1
    );
  }

  private calculateNetworkScore(node: HierarchyNode): number {
    const connections = node.connections || 0;
    const followers = node.followers || 0;
    const directReports = node.direct_reports?.length || 0;

    // Normalize each factor - matching Python implementation exactly
    const maxConnections = 50000; // LinkedIn's connection limit
    const maxFollowers = 1000000; // Reasonable upper bound
    const maxReports = 50; // Reasonable upper bound for direct reports

    const normalizedConnections = Math.min(connections / maxConnections, 1.0);
    const normalizedFollowers = Math.min(followers / maxFollowers, 1.0);
    const normalizedReports = Math.min(directReports / maxReports, 1.0);

    // Weighted average - matching Python weights exactly
    return (
      0.4 * normalizedConnections +
      0.3 * normalizedFollowers +
      0.3 * normalizedReports
    );
  }

  private calculateTenureScore(startDate: string): number {
    if (!startDate) return 0.5; // Default placeholder

    try {
      const start = new Date(startDate);
      const now = new Date();
      const yearsOfService =
        (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);

      // Normalize tenure score (0-1 scale, max at 10 years)
      return Math.min(yearsOfService / 10, 1.0);
    } catch {
      return 0.5; // Fallback if date parsing fails
    }
  }

  private calculateDepartmentScore(department: string): number {
    return (
      CONFIG['departmentPower'][
        department as keyof typeof CONFIG.departmentPower
      ] || 0.5
    );
  }

  private calculateActivityScore(
    activityScore: number,
    postFrequency: number,
  ): number {
    return 0.6 * activityScore + 0.4 * postFrequency;
  }

  private buildInfluenceGraph(hierarchyData: HierarchyData): void {
    // Add nodes
    Object.entries(hierarchyData.hierarchy).forEach(([personId, node]) => {
      this.influenceGraph.addNode(personId, {
        name: node.name,
        title: node.title,
        department: node.department,
        seniorityLevel: node.seniority_level,
      });
    });

    // Add edges for reporting relationships
    Object.entries(hierarchyData.hierarchy).forEach(([personId, node]) => {
      if (node['reports_to'] && this.influenceGraph.hasNode(node.reports_to)) {
        this.influenceGraph.addEdge(node.reports_to, personId, {
          relationship: "reports_to",
        });
      }

      // Add edges for department relationships
      const dept = hierarchyData['departments'][node.department];
      if (
        dept &&
        dept['manager'] &&
        dept.manager !== personId &&
        this.influenceGraph.hasNode(dept.manager)
      ) {
        this.influenceGraph.addEdge(dept.manager, personId, {
          relationship: "department",
        });
      }
    });
  }

  private calculateCentrality(): Record<string, number> {
    // Simple centrality calculation based on outgoing connections
    const centrality: Record<string, number> = {};

    this.influenceGraph.forEachNode((nodeId) => {
      const outDegree = this.influenceGraph.outDegree(nodeId);
      const inDegree = this.influenceGraph.inDegree(nodeId);
      const totalNodes = this.influenceGraph.order;

      // Normalize by total nodes and weight by both in and out degree
      centrality[nodeId] =
        totalNodes > 1
          ? (outDegree * 0.7 + inDegree * 0.3) / (totalNodes - 1)
          : 0;
    });

    return centrality;
  }

  private calculateInfluenceRadius(personId: string): number {
    // Calculate influence radius by traversing outgoing edges
    const visited = new Set<string>();
    const queue: string[] = [personId];
    let radius = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      if (current !== personId) radius++;

      // Add all nodes this person influences
      this.influenceGraph.forEachOutNeighbor(current, (neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }

    return radius;
  }

  private analyzeDecisionPatterns(): void {
    // Calculate centrality scores
    const centrality = this.calculateCentrality();

    // Group people by decision-making style based on centrality
    Object.entries(centrality).forEach(([personId, score]) => {
      let style: string;

      if (score > 0.7) {
        style = "Central Decision Maker";
      } else if (score > 0.4) {
        style = "Influential Participant";
      } else if (score > 0.2) {
        style = "Supporting Role";
      } else {
        style = "Peripheral Role";
      }

      const influenceRadius = this.calculateInfluenceRadius(personId);

      this['decisionPatterns'][personId] = {
        style,
        centrality: score,
        influenceRadius,
      };
    });
  }

  private analyzeKeyRelationships(personId: string): string[] {
    const relationships: string[] = [];

    // Direct reports (people they manage)
    this.influenceGraph.forEachOutNeighbor(personId, (neighbor) => {
      const edge = this.influenceGraph.getEdgeAttributes(personId, neighbor);
      if (edge['relationship'] === "reports_to") {
        relationships.push(neighbor);
      }
    });

    // Their manager
    this.influenceGraph.forEachInNeighbor(personId, (neighbor) => {
      const edge = this.influenceGraph.getEdgeAttributes(neighbor, personId);
      if (edge['relationship'] === "reports_to") {
        relationships.push(neighbor);
      }
    });

    // Department relationships
    this.influenceGraph.forEachOutNeighbor(personId, (neighbor) => {
      const edge = this.influenceGraph.getEdgeAttributes(personId, neighbor);
      if (edge['relationship'] === "department") {
        relationships.push(neighbor);
      }
    });

    // Return top 5 most important relationships
    return relationships.slice(0, 5);
  }

  private analyzePowerDynamics(hierarchyData: HierarchyData): void {
    console.log("Building influence graph");
    this.buildInfluenceGraph(hierarchyData);

    console.log("Calculating power scores");
    Object.entries(hierarchyData.hierarchy).forEach(([personId, node]) => {
      // Calculate individual component scores
      const seniorityScore = this.calculateSeniorityScore(node.seniority_level);
      const networkScore = this.calculateNetworkScore(node);
      const tenureScore = this.calculateTenureScore(node.start_date);
      const departmentScore = this.calculateDepartmentScore(node.department);
      const activityScore = this.calculateActivityScore(
        node.activity_score,
        node.post_frequency,
      );

      // Calculate total power score
      const totalScore =
        CONFIG.powerFactors.seniorityWeight * seniorityScore +
        CONFIG.powerFactors.networkWeight * networkScore +
        CONFIG.powerFactors.tenureWeight * tenureScore +
        CONFIG.powerFactors.departmentWeight * departmentScore +
        CONFIG.powerFactors.activityWeight * activityScore;

      // Analyze key relationships
      const keyRelationships = this.analyzeKeyRelationships(personId);

      // Create power score object
      this['powerScores'][personId] = {
        personId,
        name: node.name,
        title: node.title,
        department: node.department,
        totalScore,
        seniorityScore,
        networkScore,
        tenureScore,
        departmentScore,
        activityScore,
        influenceRadius: 0, // Will be updated in analyzeDecisionPatterns
        keyRelationships,
        decisionMakingStyle: "", // Will be updated in analyzeDecisionPatterns
      };
    });

    console.log("Analyzing decision patterns");
    this.analyzeDecisionPatterns();

    // Update power scores with decision pattern information
    Object.entries(this.decisionPatterns).forEach(([personId, pattern]) => {
      if (this['powerScores'][personId]) {
        this['powerScores'][personId].influenceRadius = pattern.influenceRadius;
        this['powerScores'][personId].decisionMakingStyle = pattern.style;
      }
    });
  }

  exportResults(
    powerDynamics: Record<string, unknown>,
    outputDir: string,
  ): void {
    // Export as JSON
    const jsonFile = path.join(outputDir, "power_dynamics.json");
    fs.writeFileSync(jsonFile, JSON.stringify(powerDynamics, null, 2));

    // Export influence graph as DOT file
    const dotFile = path.join(outputDir, "influence_graph.dot");
    const dotContent = this.generateDotFile();
    fs.writeFileSync(dotFile, dotContent);
  }

  private generateDotFile(): string {
    let dot = "digraph InfluenceGraph {\n";
    dot += "  rankdir=TB;\n";
    dot += "  node [shape=box];\n\n";

    // Add nodes
    this.influenceGraph.forEachNode(
      (node: string, attributes: Record<string, unknown>) => {
        const name = attributes.name as string;
        const title = attributes.title as string;
        dot += `  "${node}" [label="${name}\\n${title}"];\n`;
      },
    );

    dot += "\n";

    // Add edges
    this.influenceGraph.forEachEdge(
      (
        edge: string,
        attributes: Record<string, unknown>,
        source: string,
        target: string,
      ) => {
        const relationship = attributes.relationship as string;
        dot += `  "${source}" -> "${target}" [label="${relationship}"];\n`;
      },
    );

    dot += "}\n";
    return dot;
  }
}

export async function analyzeInfluence(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const analyzer = new InfluenceAnalyzer();
  return analyzer.analyze(data);
}
