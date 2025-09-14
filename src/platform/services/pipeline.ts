import { prisma } from "@/platform/prisma";
import { v4 as uuidv4 } from "uuid";
import { WorkerPool } from "@/platform/services/workerPool";
import { PerformanceMonitor } from "@/platform/services/performance";

// Types
export type PipelineStatus = "pending" | "running" | "completed" | "failed";

export interface PipelineStep {
  id: number;
  name: string;
  description: string;
  run: (data: PipelineData) => Promise<Partial<PipelineData>>;
  validate: (data: PipelineData) => boolean;
}

export interface PipelineData {
  sellerProfile: any;
  competitors: any[];
  buyerCompanies: any[];
  peopleData: any[];
  orgStructures: any[];
  buyerGroups: any[];
  intelligenceReports: any[];
  enablementAssets: any[];
  [key: string]: any;
}

export interface PipelineState {
  id: string;
  status: PipelineStatus;
  currentStep: number;
  totalSteps: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  outputFiles: Record<string, string>;
}

export interface PipelineConfig {
  maxParallelSteps?: number;
  retryAttempts?: number;
  timeout?: number;
  outputDir?: string;
}

export interface PipelineResult {
  success: boolean;
  executionId: string;
  completedSteps: number;
  totalSteps: number;
  results?: Record<string, unknown>;
  error?: string;
  executionTime?: number;
}

export interface ExecutionContext {
  data: PipelineData;
  stepResults: Map<number, Partial<PipelineData>>;
  executionTimes: Map<number, number>;
  errors: Map<number, Error>;
  startTime: number;
}

interface PipelineGraph {
  steps: Map<number, PipelineStep>;
  dependencies: Map<number, number[]>;
  dependents: Map<number, number[]>;
  criticalPath: number[];
}

interface PipelineStepRecord {
  id: string;
  stepNumber: number;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export class PipelineService {
  private readonly TOTAL_STEPS = 28;
  private readonly DEFAULT_CONFIG: PipelineConfig = {
    maxParallelSteps: 4,
    retryAttempts: 3,
    timeout: 300000, // 5 minutes
    outputDir: "./pipeline-output",
  };

  private workerPool: WorkerPool;
  private performanceMonitor: PerformanceMonitor;
  private graph: PipelineGraph;

  constructor() {
    this['workerPool'] = new WorkerPool(4); // 4 worker threads
    this['performanceMonitor'] = new PerformanceMonitor();
    this['graph'] = this.buildPipelineGraph();
  }

  /**
   * Execute the complete pipeline
   */
  async executePipeline(
    sellerProfile: any,
    config: PipelineConfig = {},
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      // Create pipeline execution record
      const execution = await prisma.pipelineExecution.create({
        data: {
          status: "running",
          startedAt: new Date(),
          workspace: {
            connect: { id: sellerProfile.workspaceId },
          },
          sellerProfile: {
            connect: { id: sellerProfile.id },
          },
          steps: {
            create: Array.from({ length: this.TOTAL_STEPS }, (_, i) => ({
              name: `Step ${i}`,
              status: "pending",
            })),
          },
        },
        include: {
          steps: true,
        },
      });

      // Initialize execution context
      const context: ExecutionContext = {
        data: {
          sellerProfile,
          competitors: [],
          buyerCompanies: [],
          peopleData: [],
          orgStructures: [],
          buyerGroups: [],
          intelligenceReports: [],
          enablementAssets: [],
        },
        stepResults: new Map(),
        executionTimes: new Map(),
        errors: new Map(),
        startTime,
      };

      // Execute pipeline steps
      await this.executeSteps(execution.id, context, mergedConfig);

      // Update execution as completed
      await prisma.pipelineExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        executionId: execution.id,
        completedSteps: this.TOTAL_STEPS,
        totalSteps: this.TOTAL_STEPS,
        results: Object.fromEntries(context.stepResults),
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Pipeline execution error:", error);
      return {
        success: false,
        executionId: "",
        completedSteps: 0,
        totalSteps: this.TOTAL_STEPS,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute pipeline steps with parallelization
   */
  private async executeSteps(
    executionId: string,
    context: ExecutionContext,
    config: PipelineConfig,
  ): Promise<void> {
    const steps = this.getPipelineSteps();
    const maxParallel = config.maxParallelSteps || 1;

    // Group steps into phases that can be executed in parallel
    const phases = await this.groupStepsIntoPhases(steps);

    for (const phase of phases) {
      // Execute steps in current phase
      const stepPromises = phase.map((step) =>
        this.executeStep(executionId, step, context, config),
      );

      // Wait for all steps in phase to complete
      await Promise.all(stepPromises);

      // Check for errors
      if (context.errors.size > 0) {
        throw new Error("Pipeline execution failed due to step errors");
      }
    }
  }

  /**
   * Execute a single pipeline step
   */
  private async executeStep(
    executionId: string,
    step: PipelineStep,
    context: ExecutionContext,
    config: PipelineConfig,
  ): Promise<void> {
    const stepStartTime = Date.now();
    let attempts = 0;

    // Create or get step record
    const stepRecord = await prisma.pipelineStep.create({
      data: {
        id: uuidv4(),
        executionId: executionId,
        name: step.name,
        status: "pending",
      },
    });

    while (attempts < (config.retryAttempts || 1)) {
      try {
        // Update step status to running
        await this.updateStepStatus(executionId, stepRecord.id, "running");

        // Validate step dependencies
        if (!step.validate(context.data)) {
          throw new Error(`Step ${step.id} validation failed`);
        }

        // Execute step
        let result: Partial<PipelineData>;

        if (this.isCpuIntensiveStep(step.id)) {
          // Execute in worker thread
          result = (await this.workerPool.execute({
            stepId: step.id,
            data: context.data,
            stepFunction: step.run.toString(),
          })) as Partial<PipelineData>;
        } else {
          // Execute in main thread
          result = await step.run(context.data);
        }

        // Store result and update context
        context.stepResults.set(step.id, result);
        context['data'] = { ...context.data, ...result };

        // Record execution time
        const executionTime = Date.now() - stepStartTime;
        context.executionTimes.set(step.id, executionTime);
        this.performanceMonitor.recordStepExecution(step.id, executionTime);

        // Update step status to completed
        await this.updateStepStatus(
          executionId,
          stepRecord.id,
          "completed",
          result,
        );

        return;
      } catch (error) {
        attempts++;
        context.errors.set(step.id, error as Error);

        if (attempts === config.retryAttempts) {
          // Update step status to failed
          await this.updateStepStatus(
            executionId,
            stepRecord.id,
            "failed",
            undefined,
            (error as Error).message,
          );
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  /**
   * Update step status in database
   */
  private async updateStepStatus(
    executionId: string,
    stepId: string,
    status: "running" | "completed" | "failed",
    output?: Record<string, unknown>,
    error?: string,
  ) {
    const updateData = {
      status,
      ...(status === "running" ? { startedAt: new Date() } : {}),
      ...(status === "completed"
        ? {
            completedAt: new Date(),
            output: output ? JSON.parse(JSON.stringify(output)) : null,
          }
        : {}),
      ...(status === "failed"
        ? {
            completedAt: new Date(),
            error: error || "Unknown error",
          }
        : {}),
    };

    await prisma.pipelineStep.update({
      where: {
        id: stepId,
      },
      data: updateData,
    });

    await prisma.pipelineExecution.update({
      where: { id: executionId },
      data: {
        status,
        ...(status === "completed" || status === "failed"
          ? { completedAt: new Date() }
          : {}),
      },
    });
  }

  /**
   * Group steps into phases that can be executed in parallel
   */
  private async groupStepsIntoPhases(
    steps: PipelineStep[],
  ): Promise<PipelineStep[][]> {
    const phases: PipelineStep[][] = [];
    const visited = new Set<number>();
    const executing = new Set<number>();

    // Helper function to check if a step's dependencies are met
    const dependenciesMet = (stepId: number): boolean => {
      const deps = this.graph.dependencies.get(stepId) || [];
      return deps.every((dep) => visited.has(dep));
    };

    // Helper function to get steps that can be executed in parallel
    const getExecutableSteps = (): PipelineStep[] => {
      return steps.filter(
        (step) =>
          !visited.has(step.id) &&
          !executing.has(step.id) &&
          dependenciesMet(step.id),
      );
    };

    while (visited.size < steps.length) {
      const executableSteps = getExecutableSteps();

      if (executableSteps['length'] === 0) {
        // No steps can be executed, wait for current phase to complete
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Add executable steps to current phase
      phases.push(executableSteps);
      executableSteps.forEach((step) => executing.add(step.id));

      // Wait for phase to complete
      await Promise.all(
        executableSteps.map(async (step) => {
          const context: ExecutionContext = {
            data: {} as PipelineData,
            stepResults: new Map(),
            executionTimes: new Map(),
            errors: new Map(),
            startTime: Date.now(),
          };
          await this.executeStep(
            step.id.toString(),
            step,
            context,
            this.DEFAULT_CONFIG,
          );
          visited.add(step.id);
          executing.delete(step.id);
        }),
      );
    }

    return phases;
  }

  /**
   * Build dependency graph for intelligent scheduling
   */
  private buildPipelineGraph(): PipelineGraph {
    const steps = new Map<number, PipelineStep>();
    const dependencies = new Map<number, number[]>();
    const dependents = new Map<number, number[]>();

    // Define step dependencies
    const stepDependencies = {
      0: [], // Define Seller Profile - no dependencies
      1: [], // Identify Seller Competitors - no dependencies
      2: [0, 1], // Find Optimal Buyers - needs seller profile and competitors
      3: [2], // Analyze Competitor Activity - needs buyers
      4: [2], // Download People Data - needs buyers
      5: [4], // Find Optimal People - needs people data
      6: [4], // Analyze Org Structure - needs people data
      7: [6], // Model Org Structure - needs org analysis
      8: [5], // Analyze Influence - needs optimal people
      9: [5, 8], // Enrich People Data - needs people and influence
      10: [5, 6], // Identify Buyer Groups - needs people and org
      11: [10], // Analyze Buyer Group Dynamics - needs buyer groups
      12: [10], // Trace Decision Journeys - needs buyer groups
      13: [10], // Identify Decision Makers - needs buyer groups
      14: [11, 12, 13], // Generate Intelligence Reports - needs analysis
      15: [14], // Generate Enablement Assets - needs reports
      16: [14], // Generate Hypermodern Reports - needs intelligence
      17: [14], // Generate Authority Content - needs intelligence
      18: [14], // Generate Opportunity Signals - needs intelligence
      19: [18], // Generate Opportunity Playbooks - needs signals
      20: [19], // Generate Engagement Playbooks - needs opportunity playbooks
      21: [3], // Generate Competitor Battlecards - needs competitor analysis
      22: [19, 20], // Generate Sales Playbooks - needs engagement playbooks
      23: [20], // Generate Outreach Sequences - needs engagement playbooks
      24: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23], // Comprehensive Intelligence - needs all
    };

    // Build dependency maps
    Object.entries(stepDependencies).forEach(([stepId, deps]) => {
      const id = parseInt(stepId);
      dependencies.set(id, deps);

      deps.forEach((depId) => {
        const currentDependents = dependents.get(depId) || [];
        dependents.set(depId, [...currentDependents, id]);
      });
    });

    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(dependencies);

    return {
      steps,
      dependencies,
      dependents,
      criticalPath,
    };
  }

  /**
   * Calculate critical path through the pipeline
   */
  private calculateCriticalPath(dependencies: Map<number, number[]>): number[] {
    const criticalPath: number[] = [];
    const visited = new Set<number>();

    const visit = (stepId: number) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);

      const deps = dependencies.get(stepId) || [];
      deps.forEach((dep) => visit(dep));
      criticalPath.push(stepId);
    };

    // Visit all steps
    for (let i = 0; i < this.TOTAL_STEPS; i++) {
      visit(i);
    }

    return criticalPath;
  }

  /**
   * Determine if step is CPU-intensive and should use worker pool
   */
  private isCpuIntensiveStep(stepId: number): boolean {
    const cpuIntensiveSteps = [
      2, // Find Optimal Buyers (scoring algorithms)
      5, // Find Optimal People (ranking algorithms)
      8, // Analyze Influence (complex calculations)
      11, // Analyze Buyer Group Dynamics (relationship analysis)
      12, // Trace Decision Journeys (path finding)
      14, // Generate Intelligence Reports (AI processing)
      24, // Comprehensive Intelligence (heavy processing)
    ];

    return cpuIntensiveSteps.includes(stepId);
  }

  /**
   * Get all pipeline steps
   */
  private getPipelineSteps(): PipelineStep[] {
    return [
      {
        id: 0,
        name: "Define Seller Profile",
        description: "Define your company's profile and target criteria",
        run: async (data) => ({ sellerProfile: data.sellerProfile }),
        validate: (data) => !!data.sellerProfile,
      },
      {
        id: 1,
        name: "Identify Seller Competitors",
        description: "Identify and analyze your competitors",
        run: async (data) => ({ competitors: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 2,
        name: "Find Optimal Buyers",
        description: "Find and score potential buyer companies",
        run: async (data) => ({ buyerCompanies: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 3,
        name: "Analyze Competitor Activity",
        description: "Track and analyze competitor activities",
        run: async (data) => ({ competitorActivity: {} }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 4,
        name: "Download People Data",
        description: "Download and enrich people data",
        run: async (data) => ({ peopleData: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 5,
        name: "Find Optimal People",
        description: "Rank and score people based on influence and role fit",
        run: async (data) => ({ optimalPeople: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 6,
        name: "Analyze Org Structure",
        description: "Analyze company organizational structures",
        run: async (data) => ({ orgStructures: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 7,
        name: "Model Org Structure",
        description: "Model organizational hierarchies",
        run: async (data) => ({ orgModels: {} }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 8,
        name: "Analyze Influence",
        description: "Analyze power dynamics and influence",
        run: async (data) => ({ influenceAnalyses: {} }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 9,
        name: "Enrich People Data",
        description: "Enrich people profiles with additional data",
        run: async (data) => ({ enrichedProfiles: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 10,
        name: "Identify Buyer Groups",
        description: "Identify key buyer groups within companies",
        run: async (data) => ({ buyerGroups: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 11,
        name: "Analyze Buyer Group Dynamics",
        description:
          "Analyze internal dynamics and relationships within buyer groups",
        run: async (data) => ({ buyerGroupDynamics: {} }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 12,
        name: "Trace Decision Journeys",
        description: "Map out decision-making processes",
        run: async (data) => ({ decisionFlows: {} }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 13,
        name: "Identify Decision Makers",
        description: "Identify key decision makers within buyer groups",
        run: async (data) => ({ decisionMakers: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 14,
        name: "Generate Intelligence Reports",
        description: "Generate comprehensive intelligence reports",
        run: async (data) => ({ intelligenceReports: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 15,
        name: "Generate Enablement Assets",
        description: "Create sales enablement materials",
        run: async (data) => ({ enablementAssets: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 16,
        name: "Generate Hypermodern Reports",
        description: "Create modern, visually appealing reports",
        run: async (data) => ({ hypermodernReports: {} }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 17,
        name: "Generate Authority Content",
        description: "Create thought leadership content",
        run: async (data) => ({ authorityContent: {} }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 18,
        name: "Generate Opportunity Signals",
        description: "Generate opportunity signals and alerts",
        run: async (data) => ({ opportunitySignals: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 19,
        name: "Generate Opportunity Playbooks",
        description: "Create opportunity playbooks",
        run: async (data) => ({ opportunityPlaybooks: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 20,
        name: "Generate Engagement Playbooks",
        description: "Create engagement playbooks",
        run: async (data) => ({ engagementPlaybooks: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 21,
        name: "Generate Competitor Battlecards",
        description: "Create competitor battlecards",
        run: async (data) => ({ competitorBattlecards: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 22,
        name: "Generate Sales Playbooks",
        description: "Create sales playbooks",
        run: async (data) => ({ salesPlaybooks: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 23,
        name: "Generate Outreach Sequences",
        description: "Create outreach sequences",
        run: async (data) => ({ outreachSequences: [] }), // TODO: Implement
        validate: (data) => true,
      },
      {
        id: 24,
        name: "Generate Comprehensive Intelligence",
        description:
          "Orchestrate all intelligence services to provide actionable insights",
        run: async (data) => ({ comprehensiveIntelligence: {} }), // TODO: Implement
        validate: (data) => true,
      },
    ];
  }
}
