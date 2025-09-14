// Enhanced AI Orchestrator - June 2025 Latest Models with World-Class Capabilities
// Integrates Claude 4, GPT-4.1, Gemini 2.5 Pro for maximum performance

export interface AIModelCapabilities {
  model: string;
  company: "anthropic" | "openai" | "google" | "meta" | "xai";
  contextWindow: number;
  costPerMillionTokens: { input: number; output: number };
  strengths: string[];
  weaknesses: string[];
  benchmarkScores: {
    sweBench?: number; // Software engineering
    humanEval?: number; // Code generation
    mmlu?: number; // Knowledge
    reasoning?: number; // Complex reasoning
    multimodal?: number; // Vision/audio
    aime?: number; // Math
    gpqa?: number; // Science
  };
  specialties: string[];
  releaseDate: string;
  supportsReasoning: boolean;
  supportsMultimodal: boolean;
  supportsCodeExecution: boolean;
  maxOutputTokens: number;
  latencyMs: number;
  reliabilityScore: number; // 0-1
}

export interface TaskRequest {
  type:
    | "coding"
    | "reasoning"
    | "multimodal"
    | "writing"
    | "analysis"
    | "conversation";
  complexity:
    | "trivial"
    | "simple"
    | "moderate"
    | "complex"
    | "expert"
    | "genius";
  priority: "low" | "medium" | "high" | "critical" | "emergency";
  contentLength: number;
  requiresReasoning?: boolean;
  requiresMultimodal?: boolean;
  requiresCodeGeneration?: boolean;
  requiresCodeExecution?: boolean;
  budgetConstraint?: "strict" | "moderate" | "flexible" | "unlimited";
  timeConstraint?: "realtime" | "fast" | "moderate" | "flexible";
  qualityRequirement?: "draft" | "good" | "excellent" | "perfect";
  domain?:
    | "general"
    | "software"
    | "science"
    | "business"
    | "creative"
    | "technical";
}

export interface ModelRecommendation {
  primaryModel: string;
  fallbackModels: string[];
  estimatedCost: number;
  estimatedLatency: number;
  qualityScore: number;
  reasoning: string;
  costOptimization: string;
  expectedCapabilities: string[];
}

// JUNE 2025 AI MODEL CATALOG - The Latest and Greatest
const JUNE_2025_AI_MODELS: Record<string, AIModelCapabilities> = {
  // 🔥 ANTHROPIC CLAUDE 4 SERIES (May 2025) - CODING CHAMPIONS
  "claude-4-opus": {
    model: "claude-4-opus",
    company: "anthropic",
    contextWindow: 200000,
    costPerMillionTokens: { input: 15, output: 75 },
    strengths: [
      "World-class coding (72.7% SWE-bench)",
      "Extended thinking mode",
      "Complex reasoning",
      "System architecture",
      "Multi-step debugging",
      "Sustained performance",
    ],
    weaknesses: [
      "Higher cost",
      "Slower for simple tasks",
      "Less multimodal than Gemini",
    ],
    benchmarkScores: {
      sweBench: 72.7, // BEST IN CLASS
      humanEval: 95,
      reasoning: 94,
      multimodal: 88,
      aime: 84,
      gpqa: 86,
    },
    specialties: [
      "Full-stack development",
      "System design",
      "Code architecture",
      "Complex debugging",
      "API design",
      "Database optimization",
    ],
    releaseDate: "2025-05-22",
    supportsReasoning: true,
    supportsMultimodal: true,
    supportsCodeExecution: true,
    maxOutputTokens: 64000,
    latencyMs: 4500,
    reliabilityScore: 0.97,
  },

  "claude-4-sonnet": {
    model: "claude-4-sonnet",
    company: "anthropic",
    contextWindow: 200000,
    costPerMillionTokens: { input: 3, output: 15 },
    strengths: [
      "Excellent coding (72.7% SWE-bench)",
      "Hybrid reasoning",
      "Cost-effective",
      "Great instruction following",
      "Web app development",
    ],
    weaknesses: ["Less powerful than Opus", "Not as fast as mini models"],
    benchmarkScores: {
      sweBench: 72.7, // TIED FOR BEST
      humanEval: 92,
      reasoning: 89,
      multimodal: 85,
      aime: 78,
      gpqa: 82,
    },
    specialties: [
      "Frontend development",
      "React/Vue/Angular",
      "API integration",
      "Code review",
      "Documentation",
      "Rapid prototyping",
    ],
    releaseDate: "2025-05-22",
    supportsReasoning: true,
    supportsMultimodal: true,
    supportsCodeExecution: true,
    maxOutputTokens: 64000,
    latencyMs: 2800,
    reliabilityScore: 0.95,
  },

  // 🚀 OPENAI GPT-4.1 SERIES (April 2025) - MASSIVE CONTEXT LEADERS
  "gpt-4.1": {
    model: "gpt-4.1",
    company: "openai",
    contextWindow: 1000000, // 🎯 MASSIVE 1M CONTEXT!
    costPerMillionTokens: { input: 2, output: 8 },
    strengths: [
      "Massive 1M context window",
      "Superior instruction following",
      "Balanced performance",
      "Great for AI agents",
      "Document analysis",
      "Knowledge synthesis",
    ],
    weaknesses: [
      "Not specialized for coding",
      "Less reasoning than Claude",
      "Higher latency",
    ],
    benchmarkScores: {
      sweBench: 55,
      humanEval: 90,
      mmlu: 89,
      reasoning: 82,
      multimodal: 87,
    },
    specialties: [
      "Long document analysis",
      "AI agent orchestration",
      "Knowledge synthesis",
      "Complex workflows",
      "Research assistance",
      "Content generation",
    ],
    releaseDate: "2025-04-14",
    supportsReasoning: false,
    supportsMultimodal: true,
    supportsCodeExecution: false,
    maxOutputTokens: 16000,
    latencyMs: 3200,
    reliabilityScore: 0.93,
  },

  "gpt-4.1-mini": {
    model: "gpt-4.1-mini",
    company: "openai",
    contextWindow: 1000000, // Same massive context!
    costPerMillionTokens: { input: 0.4, output: 1.6 },
    strengths: [
      "Ultra-fast responses",
      "Massive context + low cost",
      "High volume processing",
      "Real-time applications",
      "Reduced latency by 50%",
    ],
    weaknesses: ["Less capable than full models", "Simpler reasoning"],
    benchmarkScores: {
      sweBench: 45,
      humanEval: 85,
      mmlu: 82,
      reasoning: 75,
      multimodal: 83,
    },
    specialties: [
      "High-volume processing",
      "Real-time chat",
      "Content moderation",
      "Simple automation",
      "Quick responses",
      "Cost-sensitive applications",
    ],
    releaseDate: "2025-04-14",
    supportsReasoning: false,
    supportsMultimodal: true,
    supportsCodeExecution: false,
    maxOutputTokens: 8000,
    latencyMs: 1200,
    reliabilityScore: 0.91,
  },

  // 🧠 GOOGLE GEMINI 2.5 PRO (March 2025) - MULTIMODAL REASONING KING
  "gemini-2.5-pro": {
    model: "gemini-2.5-pro",
    company: "google",
    contextWindow: 2000000, // 🏆 LARGEST CONTEXT WINDOW!
    costPerMillionTokens: { input: 1.25, output: 5 },
    strengths: [
      "Massive 2M context window",
      "Best multimodal reasoning",
      "Native thinking model",
      "Scientific excellence",
      "Visual understanding",
      "Cheapest per token",
    ],
    weaknesses: ["Less coding expertise than Claude", "Newer/less tested"],
    benchmarkScores: {
      sweBench: 63.8,
      reasoning: 92, // EXCELLENT
      multimodal: 95, // BEST IN CLASS
      mmlu: 89.8,
      aime: 86.7, // MATH CHAMPION
      gpqa: 84, // SCIENCE LEADER
    },
    specialties: [
      "Multimodal analysis",
      "Scientific reasoning",
      "Mathematical problems",
      "Visual understanding",
      "Long document processing",
      "Research assistance",
    ],
    releaseDate: "2025-03-25",
    supportsReasoning: true,
    supportsMultimodal: true,
    supportsCodeExecution: false,
    maxOutputTokens: 32000,
    latencyMs: 3500,
    reliabilityScore: 0.92,
  },

  // Legacy but still useful
  "gpt-4o": {
    model: "gpt-4o",
    company: "openai",
    contextWindow: 128000,
    costPerMillionTokens: { input: 5, output: 15 },
    strengths: [
      "Reliable",
      "Well-tested",
      "Good general performance",
      "Proven",
    ],
    weaknesses: [
      "Older technology",
      "Limited context",
      "Higher cost than newer models",
    ],
    benchmarkScores: {
      sweBench: 33,
      humanEval: 87,
      mmlu: 86,
      reasoning: 78,
    },
    specialties: ["General purpose", "Chat applications", "Content generation"],
    releaseDate: "2024-05-13",
    supportsReasoning: false,
    supportsMultimodal: true,
    supportsCodeExecution: false,
    maxOutputTokens: 4096,
    latencyMs: 2200,
    reliabilityScore: 0.94,
  },
};

export class EnhancedAIOrchestrator {
  // 🎯 INTELLIGENT MODEL SELECTION ALGORITHM
  static selectOptimalModel(task: TaskRequest): ModelRecommendation {
    console.log("🤖 Selecting optimal AI model for task:", task);

    // OFFLINE PROCESSING DISABLED - Use AI for comprehensive responses
    // if (this.canHandleOffline(task)) {
    //   return {
    //     primaryModel: "offline-processing",
    //     fallbackModels: ["gpt-4.1-mini"],
    //     estimatedCost: 0,
    //     estimatedLatency: 50,
    //     qualityScore: 0.85,
    //     reasoning: "Simple task handled by offline processing patterns",
    //     costOptimization: "100% cost savings through offline handling",
    //     expectedCapabilities: ["Pattern matching", "Pre-computed responses"],
    //   };
    // }

    // 🔥 CODING TASKS - Claude 4 dominates here
    if (task['type'] === "coding" || task.requiresCodeGeneration) {
      if (task['complexity'] === "genius" || task['priority'] === "critical") {
        return this.buildRecommendation(
          "claude-4-opus",
          task,
          "World-class coding model. 72.7% SWE-bench score - highest in industry",
        );
      } else if (
        task['complexity'] === "expert" ||
        task['budgetConstraint'] === "flexible"
      ) {
        return this.buildRecommendation(
          "claude-4-sonnet",
          task,
          "Excellent coding with 5x cost efficiency vs Opus. Same SWE-bench score",
        );
      } else {
        return this.buildRecommendation(
          "gpt-4.1-mini",
          task,
          "Fast coding assistance with massive context for large codebases",
        );
      }
    }

    // 🧠 REASONING TASKS - Battle between Claude 4 and Gemini 2.5
    if (task['type'] === "reasoning" || task.requiresReasoning) {
      if (task.requiresMultimodal) {
        return this.buildRecommendation(
          "gemini-2.5-pro",
          task,
          "Best multimodal reasoning (95% score) with 2M context window",
        );
      } else if (task['complexity'] === "genius") {
        return this.buildRecommendation(
          "claude-4-opus",
          task,
          "Extended thinking mode for complex multi-step reasoning",
        );
      } else {
        return this.buildRecommendation(
          "claude-4-sonnet",
          task,
          "Excellent reasoning with hybrid thinking capabilities",
        );
      }
    }

    // 📊 MULTIMODAL TASKS - Gemini 2.5 Pro is the clear winner
    if (task['type'] === "multimodal" || task.requiresMultimodal) {
      return this.buildRecommendation(
        "gemini-2.5-pro",
        task,
        "State-of-the-art multimodal understanding. 95% benchmark score",
      );
    }

    // 📄 MASSIVE CONTEXT NEEDS - GPT-4.1 or Gemini 2.5
    if (task.contentLength > 500000) {
      if (task.requiresMultimodal) {
        return this.buildRecommendation(
          "gemini-2.5-pro",
          task,
          "2M context window with superior multimodal capabilities",
        );
      } else {
        return this.buildRecommendation(
          "gpt-4.1",
          task,
          "1M context window with excellent instruction following",
        );
      }
    }

    // 💰 BUDGET-CONSTRAINED TASKS
    if (task['budgetConstraint'] === "strict") {
      return this.buildRecommendation(
        "gpt-4.1-mini",
        task,
        "Ultra cost-effective while maintaining large context capabilities",
      );
    }

    // ⚡ REAL-TIME REQUIREMENTS
    if (task['timeConstraint'] === "realtime") {
      return this.buildRecommendation(
        "gpt-4.1-mini",
        task,
        "Lowest latency (1.2s) with excellent general performance",
      );
    }

    // 🎯 INTELLIGENT FALLBACK BASED ON COMPLEXITY
    switch (task.complexity) {
      case "genius":
        return this.buildRecommendation(
          "claude-4-opus",
          task,
          "Maximum capability for genius-level complexity",
        );
      case "expert":
        return this.buildRecommendation(
          "claude-4-sonnet",
          task,
          "Expert-level performance with great cost efficiency",
        );
      case "complex":
        return this.buildRecommendation(
          "gpt-4.1",
          task,
          "Balanced performance for complex tasks",
        );
      case "moderate":
        return this.buildRecommendation(
          "gpt-4.1-mini",
          task,
          "Fast and efficient for moderate complexity",
        );
      default:
        return this.buildRecommendation(
          "gpt-4.1-mini",
          task,
          "Cost-effective solution for simple tasks",
        );
    }
  }

  private static canHandleOffline(task: TaskRequest): boolean {
    const offlinePatterns = [
      /^(hi|hello|hey|good\s+morning|good\s+afternoon)/i,
      /^(thank|thanks|appreciate)/i,
      /^(show|list|get|find)\s+(leads|contacts|companies)$/i,
      /^(status|health|ping)$/i,
      /^(count|sum|total|average)\s+/i,
    ];

    return (
      task.contentLength < 100 &&
      task['complexity'] === "trivial" &&
      offlinePatterns.some((pattern) => pattern.test(task.type))
    );
  }

  private static buildRecommendation(
    modelKey: string,
    task: TaskRequest,
    reasoning: string,
  ): ModelRecommendation {
    const model = JUNE_2025_AI_MODELS[modelKey];

    if (!model) {
      // Fallback to a default model if the requested model is not found
      const fallbackModel =
        JUNE_2025_AI_MODELS["gpt-4.1-mini"] ||
        Object.values(JUNE_2025_AI_MODELS)[0];

      if (!fallbackModel) {
        throw new Error(`No AI models available in system`);
      }

      const estimatedTokens = Math.ceil(task.contentLength / 4);
      const inputCost =
        (estimatedTokens / 1000000) * fallbackModel.costPerMillionTokens.input;
      const outputCost =
        ((estimatedTokens * 0.3) / 1000000) *
        fallbackModel.costPerMillionTokens.output;
      const totalCost = inputCost + outputCost;

      return {
        primaryModel: fallbackModel.model,
        fallbackModels: ["gpt-4o"],
        estimatedCost: totalCost,
        estimatedLatency: this.adjustLatencyForTask(
          fallbackModel.latencyMs,
          task,
        ),
        qualityScore: this.calculateQualityScore(fallbackModel, task),
        reasoning: `${reasoning}. Fallback model used due to missing model: ${modelKey}`,
        costOptimization: this.generateCostOptimization(fallbackModel, task),
        expectedCapabilities: fallbackModel.specialties.slice(0, 3),
      };
    }

    const estimatedTokens = Math.ceil(task.contentLength / 4);
    const inputCost =
      (estimatedTokens / 1000000) * model.costPerMillionTokens.input;
    const outputCost =
      ((estimatedTokens * 0.3) / 1000000) * model.costPerMillionTokens.output; // Assume 30% output ratio
    const totalCost = inputCost + outputCost;

    return {
      primaryModel: modelKey,
      fallbackModels: this.getFallbackModels(modelKey),
      estimatedCost: totalCost,
      estimatedLatency: this.adjustLatencyForTask(model.latencyMs, task),
      qualityScore: this.calculateQualityScore(model, task),
      reasoning: `${reasoning}. Key strengths: ${model.strengths.slice(0, 2).join(", ")}`,
      costOptimization: this.generateCostOptimization(model, task),
      expectedCapabilities: model.specialties.slice(0, 3),
    };
  }

  private static getFallbackModels(primaryModel: string): string[] {
    const fallbackMap: Record<string, string[]> = {
      "claude-4-opus": ["claude-4-sonnet", "gpt-4.1"],
      "claude-4-sonnet": ["gpt-4.1", "claude-4-opus"],
      "gpt-4.1": ["claude-4-sonnet", "gpt-4.1-mini"],
      "gpt-4.1-mini": ["gpt-4o", "claude-4-sonnet"],
      "gemini-2.5-pro": ["claude-4-sonnet", "gpt-4.1"],
    };
    return fallbackMap[primaryModel] || ["gpt-4.1-mini"];
  }

  private static calculateQualityScore(
    model: AIModelCapabilities,
    task: TaskRequest,
  ): number {
    let score = 0.7; // Base score

    // Boost for relevant specialties
    if (
      task['type'] === "coding" &&
      model.specialties.some(
        (s) =>
          s.includes("development") ||
          s.includes("coding") ||
          s.includes("engineering"),
      )
    ) {
      score += 0.2;
    }

    if (task['requiresReasoning'] && model.supportsReasoning) {
      score += 0.15;
    }

    if (task['requiresMultimodal'] && model.supportsMultimodal) {
      score += 0.1;
    }

    // Context window bonus
    if (task.contentLength > 100000 && model.contextWindow > 500000) {
      score += 0.1;
    }

    // Benchmark performance boost
    if (
      model['benchmarkScores']['sweBench'] &&
      model.benchmarkScores.sweBench > 60 &&
      task['type'] === "coding"
    ) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  private static adjustLatencyForTask(
    baseLatency: number,
    task: TaskRequest,
  ): number {
    let adjustedLatency = baseLatency;

    if (task['complexity'] === "genius") adjustedLatency *= 1.8;
    if (task.requiresReasoning) adjustedLatency *= 1.5;
    if (task.contentLength > 100000) adjustedLatency *= 1.3;
    if (task['timeConstraint'] === "realtime") adjustedLatency *= 0.7;

    return Math.ceil(adjustedLatency);
  }

  private static generateCostOptimization(
    model: AIModelCapabilities,
    task: TaskRequest,
  ): string {
    const optimizations: string[] = [];

    if (model.costPerMillionTokens.input < 5) {
      optimizations.push("Low-cost model selected");
    }

    if (task.contentLength > 50000 && model.contextWindow > 500000) {
      optimizations.push("Large context avoids multiple API calls");
    }

    if (model.model.includes("mini")) {
      optimizations.push("Mini model provides 60-80% cost savings");
    }

    return optimizations.join(". ") || "Standard pricing applies";
  }

  // 📊 COMPREHENSIVE ANALYTICS
  static getModelAnalytics() {
    const models = Object.values(JUNE_2025_AI_MODELS);

    return {
      totalModels: models.length,
      companies: {
        anthropic: models.filter((m) => m['company'] === "anthropic").length,
        openai: models.filter((m) => m['company'] === "openai").length,
        google: models.filter((m) => m['company'] === "google").length,
      },
      capabilities: {
        reasoning: models.filter((m) => m.supportsReasoning).length,
        multimodal: models.filter((m) => m.supportsMultimodal).length,
        codeExecution: models.filter((m) => m.supportsCodeExecution).length,
      },
      contextRanges: {
        small: models.filter((m) => m.contextWindow < 200000).length,
        large: models.filter(
          (m) => m.contextWindow >= 200000 && m.contextWindow < 1000000,
        ).length,
        massive: models.filter((m) => m.contextWindow >= 1000000).length,
      },
      benchmarkLeaders: {
        coding: this.getBenchmarkLeader("sweBench"),
        reasoning: this.getBenchmarkLeader("reasoning"),
        multimodal: this.getBenchmarkLeader("multimodal"),
        knowledge: this.getBenchmarkLeader("mmlu"),
      },
      costRange: {
        cheapest: Math.min(...models.map((m) => m.costPerMillionTokens.input)),
        mostExpensive: Math.max(
          ...models.map((m) => m.costPerMillionTokens.input),
        ),
        averageCost:
          models.reduce((sum, m) => sum + m.costPerMillionTokens.input, 0) /
          models.length,
      },
    };
  }

  private static getBenchmarkLeader(benchmark: string): {
    model: string;
    score: number;
  } {
    const models = Object.values(JUNE_2025_AI_MODELS);
    let leader = { model: "none", score: 0 };

    models.forEach((model) => {
      const score =
        model['benchmarkScores'][benchmark as keyof typeof model.benchmarkScores];
      if (score && score > leader.score) {
        leader = { model: model.model, score };
      }
    });

    return leader;
  }

  // 🏆 BENCHMARK COMPARISONS
  static compareModelsOnBenchmark(
    benchmark: keyof AIModelCapabilities["benchmarkScores"],
  ) {
    return Object.values(JUNE_2025_AI_MODELS)
      .filter((m) => m['benchmarkScores'][benchmark])
      .map((m) => ({
        model: m.model,
        company: m.company,
        score: m['benchmarkScores'][benchmark],
        cost: m.costPerMillionTokens.input,
        contextWindow: m.contextWindow,
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  // 🎯 GET PERFECT MODEL FOR SPECIFIC USE CASE
  static getRecommendedModelForUseCase(useCase: string): ModelRecommendation {
    const useCaseMap: Record<string, TaskRequest> = {
      "full-stack-development": {
        type: "coding",
        complexity: "expert",
        priority: "high",
        contentLength: 150000,
        requiresCodeGeneration: true,
        requiresCodeExecution: true,
        budgetConstraint: "flexible",
        domain: "software",
      },
      "scientific-research": {
        type: "reasoning",
        complexity: "genius",
        priority: "high",
        contentLength: 200000,
        requiresReasoning: true,
        requiresMultimodal: true,
        domain: "science",
      },
      "document-analysis": {
        type: "analysis",
        complexity: "complex",
        priority: "medium",
        contentLength: 800000,
        budgetConstraint: "moderate",
        domain: "business",
      },
      "real-time-chat": {
        type: "conversation",
        complexity: "moderate",
        priority: "high",
        contentLength: 5000,
        timeConstraint: "realtime",
        budgetConstraint: "strict",
      },
    };

    const task = useCaseMap[useCase];
    if (!task) {
      throw new Error(`Unknown use case: ${useCase}`);
    }

    return this.selectOptimalModel(task);
  }

  // 📱 GET ALL AVAILABLE MODELS
  static getAllModels(): AIModelCapabilities[] {
    return Object.values(JUNE_2025_AI_MODELS);
  }

  // 🔍 SEARCH MODELS BY CAPABILITY
  static findModelsByCapability(capability: string): AIModelCapabilities[] {
    return Object.values(JUNE_2025_AI_MODELS).filter(
      (model) =>
        model.strengths.some((strength) =>
          strength.toLowerCase().includes(capability.toLowerCase()),
        ) ||
        model.specialties.some((specialty) =>
          specialty.toLowerCase().includes(capability.toLowerCase()),
        ),
    );
  }

  // 💰 COST CALCULATOR
  static calculateCost(
    modelKey: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const model = JUNE_2025_AI_MODELS[modelKey];
    if (!model) return 0;

    const inputCost =
      (inputTokens / 1000000) * model.costPerMillionTokens.input;
    const outputCost =
      (outputTokens / 1000000) * model.costPerMillionTokens.output;

    return inputCost + outputCost;
  }
}
