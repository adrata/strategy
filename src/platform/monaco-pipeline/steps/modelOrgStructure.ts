import { PipelineData, OrgStructure, Person } from "../types";

interface OrgModel {
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

export class OrgStructureModeler {
  async model(data: PipelineData): Promise<Partial<PipelineData>> {
    // Validate input data
    if (!data.orgStructures.length || !data.peopleData.length) {
      throw new Error("Organization structures and people data are required");
    }

    // Create models for each company
    const orgModels = data.orgStructures.map((structure) => {
      const companyPeople = data.peopleData.filter(
        (p) => p['companyId'] === structure.companyId,
      );
      return this.createOrgModel(structure, companyPeople);
    });

    return {
      orgModels,
    };
  }

  private createOrgModel(structure: OrgStructure, people: Person[]): OrgModel {
    // Group people by level
    const levels = this.groupPeopleByLevel(structure.hierarchy);

    // Calculate metrics
    const metrics = this.calculateMetrics(structure, people);

    return {
      companyId: structure.companyId,
      levels,
      metrics,
    };
  }

  private groupPeopleByLevel(hierarchy: OrgStructure["hierarchy"]) {
    // Group people by level
    const levelGroups = hierarchy.reduce(
      (acc, node) => {
        if (!acc[node.level]) {
          acc[node.level] = {
            level: node.level,
            people: [],
            relationships: [],
          };
        }
        (
          acc[node.level] || {
            people: [],
            relationships: [],
            level: node.level,
          }
        ).people.push(node.personId);
        return acc;
      },
      {} as Record<number, OrgModel["levels"][0]>,
    );

    // Convert to array and sort by level
    return Object.values(levelGroups).sort((a, b) => a.level - b.level);
  }

  private calculateRelationships(hierarchy: OrgStructure["hierarchy"]) {
    const relationships: OrgModel["levels"][0]["relationships"] = [];

    hierarchy.forEach((node) => {
      // Add reporting relationships
      if (node.reportsTo) {
        relationships.push({
          from: node.personId,
          to: node.reportsTo,
          type: "reports_to",
        });
      }

      // Add management relationships
      node.directReports.forEach((reportId) => {
        relationships.push({
          from: node.personId,
          to: reportId,
          type: "manages",
        });
      });

      // Add peer relationships
      const peers = hierarchy.filter(
        (p) => p['level'] === node['level'] && p.personId !== node.personId,
      );
      peers.forEach((peer) => {
        relationships.push({
          from: node.personId,
          to: peer.personId,
          type: "peer",
        });
      });
    });

    return relationships;
  }

  private calculateMetrics(
    structure: OrgStructure,
    people: Person[],
  ): OrgModel["metrics"] {
    const totalPeople = people.length;
    const departmentCount = structure.departments.length;
    const maxDepth = Math.max(...structure.hierarchy.map((h) => h.level));

    // Calculate average span of control
    const managers = structure.hierarchy.filter(
      (h) => h.directReports.length > 0,
    );
    const avgSpanOfControl =
      managers.length > 0
        ? managers.reduce((sum, m) => sum + m.directReports.length, 0) /
          managers.length
        : 0;

    return {
      totalPeople,
      avgSpanOfControl,
      maxDepth,
      departmentCount,
    };
  }
}

export async function modelOrgStructure(): Promise<Partial<PipelineData>> {
  // TODO: Implement org structure modeling
  return {
    orgModels: [],
  };
}
