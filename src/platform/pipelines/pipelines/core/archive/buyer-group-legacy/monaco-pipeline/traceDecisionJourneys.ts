import { PipelineData, InfluenceAnalysis } from "../types";

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

interface DecisionFlow {
  companyId: string;
  paths: DecisionPath[];
  bottlenecks: string[];
  avgPathDuration: number;
  criticalPaths: string[];
}

const CONFIG = {
  decisionThresholds: {
    budgetApproval: 100000, // Amount requiring budget approval
    executiveApproval: 500000, // Amount requiring executive approval
    legalReview: 1000000, // Amount requiring legal review
  },
  departmentRoles: {
    Engineering: ["technical_evaluation", "implementation_planning"],
    Product: ["requirements_definition", "feature_prioritization"],
    Sales: ["vendor_selection", "negotiation"],
    Marketing: ["brand_alignment", "market_fit"],
    HR: ["training_requirements", "change_management"],
    Finance: ["budget_approval", "roi_analysis"],
    Operations: ["operational_impact", "process_integration"],
    CustomerSuccess: ["customer_impact", "support_requirements"],
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

export class DecisionFlowParser {
  private decisionGraph: Map<string, Set<string>> = new Map();
  private decisionPaths: Map<string, DecisionPath> = new Map();
  private bottlenecks: string[] = [];

  private determineApprovalThreshold(
    person: InfluenceAnalysis["powerScores"][0],
  ): number {
    if (
      person.title.toLowerCase().includes("chief") ||
      person.title.toLowerCase().includes("vp")
    ) {
      return CONFIG.decisionThresholds.executiveApproval;
    } else if (person['department'] === "Finance") {
      return CONFIG.decisionThresholds.budgetApproval;
    } else if (person['department'] === "Legal") {
      return CONFIG.decisionThresholds.legalReview;
    } else {
      return CONFIG.decisionThresholds.budgetApproval / 2;
    }
  }

  private determineDecisionRole(
    person: InfluenceAnalysis["powerScores"][0],
  ): string {
    const deptRoles =
      CONFIG['departmentRoles'][
        person.department as keyof typeof CONFIG.departmentRoles
      ] || [];
    if (!deptRoles.length) {
      return "general_approval";
    }

    // Assign primary role based on seniority
    if (
      person.title.toLowerCase().includes("chief") ||
      person.title.toLowerCase().includes("vp")
    ) {
      return deptRoles[0] || "general_approval"; // Primary role
    } else {
      return deptRoles[deptRoles.length - 1] || "general_approval"; // Secondary role
    }
  }

  private buildDecisionGraph(powerDynamics: InfluenceAnalysis): void {
    // Add nodes for each person
    for (const person of powerDynamics.powerScores) {
      this.decisionGraph.set(person.personId, new Set());
    }

    // Add edges based on reporting relationships and decision patterns
    for (const [personId, pattern] of Object.entries(
      powerDynamics.decisionPatterns,
    )) {
      if (pattern['style'] === "Central Decision Maker") {
        // Connect to all potential approvers
        for (const approver of powerDynamics.powerScores) {
          if (approver.personId !== personId) {
            const edges = this.decisionGraph.get(personId) || new Set();
            edges.add(approver.personId);
            this.decisionGraph.set(personId, edges);
          }
        }
      }
    }
  }

  private identifyDecisionPaths(powerDynamics: InfluenceAnalysis): void {
    // Find all paths between initiators and final approvers
    const initiators = powerDynamics.powerScores.filter(
      (person) =>
        this.determineDecisionRole(person) === "technical_evaluation" ||
        this.determineDecisionRole(person) === "requirements_definition",
    );

    const approvers = powerDynamics.powerScores.filter(
      (person) =>
        this.determineDecisionRole(person) === "budget_approval" ||
        this.determineDecisionRole(person) === "contract_review",
    );

    for (const initiator of initiators) {
      for (const approver of approvers) {
        if (initiator.personId !== approver.personId) {
          const paths = this.findAllPaths(
            initiator.personId,
            approver.personId,
          );

          if (paths && paths.length > 0) {
            for (let i = 0; i < paths.length; i++) {
              const pathId = `${initiator.personId}_${approver.personId}_${i}`;
              const currentPath = paths[i];
              if (currentPath && currentPath.length > 0) {
                this.decisionPaths.set(
                  pathId,
                  this.createDecisionPath(pathId, currentPath, powerDynamics),
                );
              }
            }
          }
        }
      }
    }
  }

  private findAllPaths(
    start: string,
    end: string,
    maxDepth: number = 5,
  ): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();

    const dfs = (current: string, path: string[]) => {
      if (path.length > maxDepth) return;
      if (current === end) {
        paths.push([...path]);
        return;
      }

      visited.add(current);
      const edges = this.decisionGraph.get(current) || new Set();

      for (const next of Array.from(edges)) {
        if (!visited.has(next)) {
          path.push(next);
          dfs(next, path);
          path.pop();
        }
      }

      visited.delete(current);
    };

    dfs(start, [start]);
    return paths;
  }

  private createDecisionPath(
    pathId: string,
    path: string[],
    powerDynamics: InfluenceAnalysis,
  ): DecisionPath {
    const nodes: DecisionNode[] = path.map((personId) => {
      const person = powerDynamics.powerScores.find(
        (p) => p['personId'] === personId,
      );
      if (!person)
        throw new Error(`Person ${personId} not found in power dynamics`);

      return {
        personId: person.personId,
        name: person.name,
        title: person.title,
        department: person.department,
        role: this.determineDecisionRole(person),
        stage: this.determineStage(this.determineDecisionRole(person)),
        approvalThreshold: this.determineApprovalThreshold(person),
        requiredApprovals: this.getRequiredApprovals(),
        optionalApprovals: this.getOptionalApprovals(),
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
    } else {
      return "monitoring";
    }
  }

  private getRequiredApprovals(): string[] {
    // TODO: Implement based on role and department
    return [];
  }

  private getOptionalApprovals(): string[] {
    // TODO: Implement based on role and department
    return [];
  }

  private calculatePathDuration(nodes: DecisionNode[]): number {
    // TODO: Implement based on historical data or estimates
    return nodes.length * 2.0; // Placeholder: 2 days per node
  }

  private identifyCriticalPath(nodes: DecisionNode[]): string[] {
    // Identify nodes with highest influence and decision power
    return nodes
      .filter(
        (node) =>
          node.approvalThreshold >= CONFIG.decisionThresholds.budgetApproval,
      )
      .map((node) => node.personId);
  }

  private identifyBottlenecks(nodes: DecisionNode[]): string[] {
    // Identify potential bottlenecks based on role and approval thresholds
    return nodes
      .filter(
        (node) =>
          node['role'] === "budget_approval" ||
          node['role'] === "contract_review" ||
          node.approvalThreshold >= CONFIG.decisionThresholds.executiveApproval,
      )
      .map((node) => node.personId);
  }

  parseDecisionFlows(influenceAnalysis: InfluenceAnalysis): DecisionFlow {
    this.buildDecisionGraph(influenceAnalysis);
    this.identifyDecisionPaths(influenceAnalysis);

    const paths = Array.from(this.decisionPaths.values());
    const avgPathDuration =
      paths.reduce((sum, path) => sum + path.totalDuration, 0) / paths.length;
    const criticalPaths = paths
      .filter((path) => path.criticalPath.length > 0)
      .map((path) => path.pathId);

    return {
      companyId: influenceAnalysis.companyId,
      paths,
      bottlenecks: this.bottlenecks,
      avgPathDuration,
      criticalPaths,
    };
  }
}

export async function traceDecisionJourneys(): Promise<Partial<PipelineData>> {
  // TODO: Implement decision journey tracing
  return {
    decisionFlows: [],
  };
}
