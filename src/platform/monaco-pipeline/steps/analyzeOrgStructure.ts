import { PipelineData, Person } from "../types";

interface Department {
  name: string;
  head: string;
  members: string[];
  subDepartments: string[];
}

interface HierarchyNode {
  personId: string;
  level: number;
  reportsTo: string | null;
  directReports: string[];
}

export class OrgStructureAnalyzer {
  async analyze(data: PipelineData): Promise<Partial<PipelineData>> {
    // Validate input data
    if (!data.peopleData.length) {
      throw new Error("People data is required");
    }

    // Group people by company
    const companyPeople = this.groupPeopleByCompany(data.peopleData);

    // Analyze org structure for each company
    const orgStructures = Object.entries(companyPeople).map(
      ([companyId, people]) => {
        // Identify departments
        const departments = this.identifyDepartments(people);

        // Build hierarchy
        const hierarchy = this.buildHierarchy(people);

        return {
          companyId,
          departments,
          hierarchy,
        };
      },
    );

    return {
      orgStructures,
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

  private identifyDepartments(people: Person[]): Department[] {
    // Group people by department
    const departmentGroups = people.reduce(
      (acc, person) => {
        const department = person.department || "Unknown";
        if (!acc[department]) {
          acc[department] = [];
        }
        acc[department].push(person);
        return acc;
      },
      {} as Record<string, Person[]>,
    );

    // Create department objects
    return Object.entries(departmentGroups).map(([name, members]) => {
      // Find department head (person with highest level)
      const head = members.reduce((highest, current) =>
        (current.level ?? 99) > (highest.level ?? 99) ? current : highest,
      );

      // Identify sub-departments
      const subDepartments = this.identifySubDepartments(members);

      return {
        name,
        head: head.id,
        members: members.map((p) => p.id),
        subDepartments,
      };
    });
  }

  private identifySubDepartments(people: Person[]): string[] {
    // Group by sub-department indicators in titles
    const subDeptGroups = people.reduce(
      (acc, person) => {
        const subDept = this.extractSubDepartment(person.title);
        if (subDept) {
          if (!acc[subDept]) {
            acc[subDept] = [];
          }
          acc[subDept].push(person);
        }
        return acc;
      },
      {} as Record<string, Person[]>,
    );

    return Object.keys(subDeptGroups);
  }

  private extractSubDepartment(title: string): string | null {
    // Common sub-department indicators
    const indicators = [
      "Engineering",
      "Product",
      "Design",
      "Marketing",
      "Sales",
      "Operations",
      "Finance",
      "HR",
      "IT",
    ];

    for (const indicator of indicators) {
      if (title.toLowerCase().includes(indicator.toLowerCase())) {
        return indicator;
      }
    }

    return null;
  }

  private buildHierarchy(people: Person[]): HierarchyNode[] {
    // Create hierarchy nodes
    const nodes = people.map((person) => ({
      personId: person.id,
      level: person.level ?? 5, // Default to mid-level if undefined
      reportsTo: person.reportsTo || null,
      directReports: person.directReports || [],
    }));

    // Sort by level
    return nodes.sort((a, b) => a.level - b.level);
  }
}

export async function analyzeOrgStructure(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const analyzer = new OrgStructureAnalyzer();
  return analyzer.analyze(data);
}
