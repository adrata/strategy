import {
  PipelineData,
  DecisionFlow,
  InfluenceAnalysis,
  Person,
} from "../types";

interface DecisionNode {
  personId: string;
  name: string;
  title: string;
  department: string;
  role: string;
  stage: string;
  approvalThreshold: number;
  requiredApprovals: string[];
  optionalApprovals: string[];
}

interface DecisionPath {
  pathId: string;
  stages: string[];
  nodes: DecisionNode[];
  totalDuration: number;
  criticalPath: string[];
  bottlenecks: string[];
}

const CONFIG = {
  decisionThresholds: {
    budgetApproval: 100000,
    executiveApproval: 500000,
    legalReview: 1000000,
  },
  departmentRoles: {
    Engineering: ["technical_evaluation", "implementation_planning"],
    Product: ["requirements_definition", "feature_prioritization"],
    Sales: ["vendor_selection", "negotiation"],
    Marketing: ["brand_alignment", "market_fit"],
    HR: ["training_requirements", "change_management"],
    Finance: ["budget_approval", "roi_analysis"],
    Operations: ["operational_impact", "process_integration"],
    "Customer Success": ["customer_impact", "support_requirements"],
    Legal: ["contract_review", "compliance_check"],
    IT: ["technical_compatibility", "security_review"],
  },
  decisionStages: [
    "initiation",
    "evaluation",
    "approval",
    "implementation",
    "monitoring",
  ],
} as const;

export class DecisionFlowGenerator {
  private determineApprovalThreshold(person: Person): number {
    const personLevel = person.level ?? 3; // Default to mid-level if undefined
    if (personLevel >= 5) {
      // C-Suite level
      return CONFIG.decisionThresholds.executiveApproval;
    } else if (person['department'] === "Finance") {
      return CONFIG.decisionThresholds.budgetApproval;
    } else if (person['department'] === "Legal") {
      return CONFIG.decisionThresholds.legalReview;
    }
    return CONFIG.decisionThresholds.budgetApproval / 2;
  }

  private determineDecisionRole(person: Person): string {
    const deptRoles =
      CONFIG['departmentRoles'][
        person.department as keyof typeof CONFIG.departmentRoles
      ] || [];
    if (!deptRoles.length) return "general_approval";

    // Assign primary role based on seniority
    const personLevel = person.level ?? 3; // Default to mid-level if undefined
    if (personLevel >= 5) {
      // C-Suite or VP level
      return deptRoles[0] || "general_approval"; // Primary role with fallback
    }
    return deptRoles[deptRoles.length - 1] || "general_approval"; // Secondary role with fallback
  }

  private determineStage(role: string): string {
    if (["requirements_definition", "technical_evaluation"].includes(role)) {
      return "initiation";
    } else if (["vendor_selection", "roi_analysis"].includes(role)) {
      return "evaluation";
    } else if (["budget_approval", "contract_review"].includes(role)) {
      return "approval";
    } else if (
      ["implementation_planning", "process_integration"].includes(role)
    ) {
      return "implementation";
    }
    return "monitoring";
  }

  private getRequiredApprovals(person: Person): string[] {
    const approvals: string[] = [];
    if (person['department'] === "Finance") {
      approvals.push("budget_approval");
    }
    if (person['department'] === "Legal") {
      approvals.push("contract_review");
    }
    const personLevel = person.level ?? 3; // Default to mid-level if undefined
    if (personLevel >= 5) {
      // C-Suite level
      approvals.push("executive_approval");
    }
    return approvals;
  }

  private getOptionalApprovals(person: Person): string[] {
    const approvals: string[] = [];
    if (person['department'] === "IT") {
      approvals.push("security_review");
    }
    if (person['department'] === "Operations") {
      approvals.push("operational_impact");
    }
    return approvals;
  }

  private calculatePathDuration(nodes: DecisionNode[]): number {
    // Placeholder: 2 days per node
    return nodes.length * 2.0;
  }

  private identifyCriticalPath(nodes: DecisionNode[]): string[] {
    // Identify nodes with highest approval thresholds
    return nodes
      .sort((a, b) => b.approvalThreshold - a.approvalThreshold)
      .slice(0, Math.ceil(nodes.length / 2))
      .map((node) => node.personId);
  }

  private identifyBottlenecks(nodes: DecisionNode[]): string[] {
    return nodes
      .filter(
        (node) =>
          node.requiredApprovals.length > 0 ||
          node['department'] === "Legal" ||
          node['department'] === "Finance",
      )
      .map((node) => node.personId);
  }

  private createDecisionPath(
    pathId: string,
    people: Person[],
    influenceAnalysis: InfluenceAnalysis,
  ): DecisionPath {
    const nodes: DecisionNode[] = people.map((person) => {
      // Find the person's power score from influence analysis
      const powerScore = influenceAnalysis.powerScores.find(
        (ps) => ps['personId'] === person.id,
      );
      const departmentName: string = person.department || "General";

      return {
        personId: person.id,
        name: person.name || "",
        title: person.title || "Unknown Title",
        department: departmentName,
        role: this.determineDecisionRole(person),
        stage: this.determineStage(this.determineDecisionRole(person)),
        approvalThreshold: powerScore
          ? this.determineApprovalThreshold(person) *
            (1 + powerScore.totalScore)
          : this.determineApprovalThreshold(person),
        requiredApprovals: this.getRequiredApprovals(person),
        optionalApprovals: this.getOptionalApprovals(person),
      };
    });

    const totalDuration = this.calculatePathDuration(nodes);
    const criticalPath = this.identifyCriticalPath(nodes);
    const bottlenecks = this.identifyBottlenecks(nodes);

    return {
      pathId,
      stages: nodes.map((node) => node.stage),
      nodes,
      totalDuration,
      criticalPath,
      bottlenecks,
    };
  }

  generateDecisionFlows(data: PipelineData): DecisionFlow[] {
    const flows: DecisionFlow[] = [];

    for (const company of data.buyerCompanies) {
      const companyPeople = data.peopleData.filter(
        (p) => p['companyId'] === company.id,
      );
      const influenceAnalysis = data.influenceAnalyses?.find(
        (analysis: any) => analysis['companyId'] === company.id,
      );

      if (!influenceAnalysis) continue;

      // Create decision paths based on influence analysis
      const initiators = companyPeople.filter(
        (p) => p['department'] === "Engineering" || p['department'] === "Product",
      );
      const approvers = companyPeople.filter(
        (p) => p['department'] === "Finance" || p['department'] === "Legal",
      );

      for (const initiator of initiators) {
        for (const approver of approvers) {
          if (initiator['id'] === approver.id) continue;

          const pathId = `${initiator.id}_${approver.id}`;
          const path = this.createDecisionPath(
            pathId,
            [initiator, approver],
            influenceAnalysis,
          );

          flows.push({
            id: `flow-${company.id}-${pathId}`,
            name: `Decision Flow for ${company.name}`,
            companyId: company.id,
            paths: [path],
            bottlenecks: path.bottlenecks,
            avgPathDuration: path.totalDuration,
            criticalPaths: path.criticalPath,
            steps: path.stages,
            decisionMakers: path.nodes
              .filter((n) => n.role.includes("approval"))
              .map((n) => n.personId),
            influencers: path.nodes
              .filter((n) => !n.role.includes("approval"))
              .map((n) => n.personId),
            timeline: `${path.totalDuration} days`,
          });
        }
      }
    }

    return flows;
  }
}

export async function generateDecisionFlows(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const generator = new DecisionFlowGenerator();
  const flows = generator.generateDecisionFlows(data);

  return {
    decisionFlows: flows,
  };
}
