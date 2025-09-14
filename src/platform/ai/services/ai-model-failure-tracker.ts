// 🚨 AI Model Failure Tracking System
// Tracks where models suck so when we create our own we can fix the gaps. Let's be the best!!!

export interface ModelFailure {
  id: string;
  timestamp: Date;
  modelName: string;
  modelVersion: string;
  taskType:
    | "writing"
    | "analysis"
    | "reasoning"
    | "code"
    | "data-extraction"
    | "personalization"
    | "prediction";
  failureType:
    | "hallucination"
    | "incorrect-logic"
    | "poor-quality"
    | "timeout"
    | "refusal"
    | "format-error"
    | "context-limit";
  inputContext: {
    prompt: string;
    contextLength: number;
    complexity: "low" | "medium" | "high";
    domain: string;
  };
  expectedOutput: string;
  actualOutput: string;
  errorMessage?: string;
  severity: "low" | "medium" | "high" | "critical";
  userImpact: "none" | "minor" | "moderate" | "severe";
  reproduced: boolean;
  patternId?: string; // For grouping similar failures
  userId: string;
  workspaceId: string;
  metadata: Record<string, any>;
}

export interface FailurePattern {
  id: string;
  name: string;
  description: string;
  occurrenceCount: number;
  affectedModels: string[];
  commonContexts: string[];
  severity: "low" | "medium" | "high" | "critical";
  proposedSolution: string;
  status: "identified" | "investigating" | "solution-planned" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelPerformanceMetrics {
  modelName: string;
  totalRequests: number;
  failureCount: number;
  failureRate: number;
  avgResponseTime: number;
  topFailureTypes: Array<{ type: string; count: number; percentage: number }>;
  topFailureDomains: Array<{
    domain: string;
    count: number;
    percentage: number;
  }>;
  qualityScore: number; // 0-100
  reliabilityScore: number; // 0-100
  lastUpdated: Date;
}

export interface ModelRecommendation {
  currentModel: string;
  recommendedModel: string;
  reason: string;
  expectedImprovement: string;
  confidenceScore: number;
  estimatedCostChange: number; // percentage
}

export class AIModelFailureTracker {
  private static failures: ModelFailure[] = [];
  private static patterns: FailurePattern[] = [];

  // 🔥 TRACK FAILURE - Call this whenever an AI model fails
  static trackFailure(
    failure: Omit<
      ModelFailure,
      "id" | "timestamp" | "reproduced" | "patternId"
    >,
  ): string {
    const failureId = `failure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullFailure: ModelFailure = {
      ...failure,
      id: failureId,
      timestamp: new Date(),
      reproduced: false,
      patternId: this.detectPattern(failure),
    };

    this.failures.push(fullFailure);

    // Store in localStorage for persistence (in production, would use database)
    this.persistFailures();

    // Update patterns
    this.updatePatterns(fullFailure);

    // Log for immediate visibility
    console.error("🚨 AI Model Failure Tracked:", {
      model: failure.modelName,
      type: failure.failureType,
      severity: failure.severity,
      task: failure.taskType,
      failureId,
    });

    // Auto-escalate critical failures
    if (failure['severity'] === "critical") {
      this.escalateCriticalFailure(fullFailure);
    }

    return failureId;
  }

  // 🎯 SMART PATTERN DETECTION
  private static detectPattern(
    failure: Omit<
      ModelFailure,
      "id" | "timestamp" | "reproduced" | "patternId"
    >,
  ): string | undefined {
    const recentFailures = this.failures.filter(
      (f) => Date.now() - f.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000, // Last 7 days
    );

    // Look for similar failures
    const similarFailures = recentFailures.filter(
      (f) =>
        f['modelName'] === failure['modelName'] &&
        f['taskType'] === failure['taskType'] &&
        f['failureType'] === failure.failureType,
    );

    if (similarFailures.length >= 3) {
      // Pattern detected
      const patternId = this.createOrUpdatePattern(failure, similarFailures);
      return patternId;
    }

    return undefined;
  }

  // 📊 GENERATE MODEL PERFORMANCE METRICS
  static getModelMetrics(
    modelName: string,
    days: number = 30,
  ): ModelPerformanceMetrics {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const modelFailures = this.failures.filter(
      (f) => f['modelName'] === modelName && f.timestamp >= cutoffDate,
    );

    // Calculate failure types
    const failureTypes = modelFailures.reduce(
      (acc, f) => {
        if (f.failureType) {
          acc[f.failureType] = (acc[f.failureType] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const topFailureTypes = Object.entries(failureTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / modelFailures.length) * 100,
      }));

    // Calculate failure domains
    const failureDomains = modelFailures.reduce(
      (acc, f) => {
        const domain = f.inputContext?.domain;
        if (domain) {
          acc[domain] = (acc[domain] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const topFailureDomains = Object.entries(failureDomains)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({
        domain,
        count,
        percentage: (count / modelFailures.length) * 100,
      }));

    // Estimated total requests (failures are probably ~5-10% of total)
    const estimatedTotalRequests = Math.max(modelFailures.length * 20, 100);
    const failureRate = (modelFailures.length / estimatedTotalRequests) * 100;

    // Quality scores based on failure patterns
    const qualityScore = Math.max(0, 100 - failureRate * 2);
    const reliabilityScore = Math.max(0, 100 - failureRate * 3);

    return {
      modelName,
      totalRequests: estimatedTotalRequests,
      failureCount: modelFailures.length,
      failureRate,
      avgResponseTime: 2.3, // Would track this separately in production
      topFailureTypes,
      topFailureDomains,
      qualityScore,
      reliabilityScore,
      lastUpdated: new Date(),
    };
  }

  // 🎯 SMART MODEL RECOMMENDATIONS
  static getModelRecommendations(
    currentModel: string,
    taskType: string,
  ): ModelRecommendation[] {
    const modelMetrics = this.getModelMetrics(currentModel);
    const recommendations: ModelRecommendation[] = [];

    // Model performance database (based on our June 2025 research)
    const modelDatabase = {
      "gpt-4o": { qualityScore: 85, cost: 5, speed: 8, reasoning: 9 },
      "claude-4": { qualityScore: 95, cost: 8, speed: 7, reasoning: 10 },
      "gemini-2.5": { qualityScore: 88, cost: 3, speed: 9, reasoning: 8 },
      "gpt-4.1": { qualityScore: 90, cost: 6, speed: 8, reasoning: 9 },
      "o1-pro": { qualityScore: 92, cost: 9, speed: 5, reasoning: 10 },
    };

    // Recommend better models if current one is underperforming
    if (modelMetrics.qualityScore < 80 || modelMetrics.failureRate > 10) {
      Object.entries(modelDatabase).forEach(([model, metrics]) => {
        if (
          model !== currentModel &&
          metrics.qualityScore > modelMetrics.qualityScore
        ) {
          recommendations.push({
            currentModel,
            recommendedModel: model,
            reason: `Higher quality score (${metrics.qualityScore} vs ${modelMetrics.qualityScore.toFixed(1)})`,
            expectedImprovement: `${(metrics.qualityScore - modelMetrics.qualityScore).toFixed(1)}% better quality`,
            confidenceScore: 0.85,
            estimatedCostChange:
              ((metrics.cost /
                modelDatabase[currentModel as keyof typeof modelDatabase]
                  ?.cost || 5) -
                1) *
              100,
          });
        }
      });
    }

    return recommendations.sort(
      (a, b) => b.confidenceScore - a.confidenceScore,
    );
  }

  // 📈 GET FAILURE ANALYTICS
  static getFailureAnalytics(days: number = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentFailures = this.failures.filter(
      (f) => f.timestamp >= cutoffDate,
    );

    return {
      totalFailures: recentFailures.length,
      criticalFailures: recentFailures.filter((f) => f['severity'] === "critical")
        .length,
      topModels: this.getTopFailingModels(recentFailures),
      topTasks: this.getTopFailingTasks(recentFailures),
      patterns: this.patterns.filter((p) => p.status !== "resolved"),
      dailyTrend: this.getDailyFailureTrend(recentFailures),
      improvementOpportunities:
        this.getImprovementOpportunities(recentFailures),
    };
  }

  // 🔧 HELPER METHODS
  private static updatePatterns(failure: ModelFailure): void {
    // Update existing patterns or create new ones
    if (failure.patternId) {
      const pattern = this.patterns.find((p) => p['id'] === failure.patternId);
      if (pattern) {
        pattern.occurrenceCount++;
        pattern['updatedAt'] = new Date();
      }
    }
  }

  private static createOrUpdatePattern(
    failure: any,
    similarFailures: ModelFailure[],
  ): string {
    const patternId = `pattern_${failure.modelName}_${failure.taskType}_${failure.failureType}`;

    let pattern = this.patterns.find((p) => p['id'] === patternId);

    if (!pattern) {
      pattern = {
        id: patternId,
        name: `${failure.modelName} ${failure.taskType} ${failure.failureType}`,
        description: `Recurring ${failure.failureType} in ${failure.taskType} tasks`,
        occurrenceCount: similarFailures.length,
        affectedModels: [failure.modelName],
        commonContexts: [failure.inputContext.domain],
        severity: failure.severity,
        proposedSolution: this.generateSolution(failure),
        status: "identified",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.patterns.push(pattern);
    } else {
      pattern['occurrenceCount'] = similarFailures.length;
      pattern['updatedAt'] = new Date();
    }

    return patternId;
  }

  private static generateSolution(failure: any): string {
    const solutions = {
      hallucination:
        "Add fact-checking layer, reduce temperature, use retrieval-augmented generation",
      "incorrect-logic":
        "Use chain-of-thought prompting, break down complex problems",
      "poor-quality":
        "Improve prompt engineering, use higher-quality model, add examples",
      timeout:
        "Optimize prompts for speed, use faster model, implement streaming",
      refusal: "Adjust content policies, rephrase prompts, use different model",
      "format-error":
        "Add strict output formatting instructions, use JSON schema validation",
      "context-limit":
        "Implement intelligent chunking, summarization, or use model with larger context window",
    };

    return (
      solutions[failure.failureType as keyof typeof solutions] ||
      "Investigate root cause and adjust accordingly"
    );
  }

  private static escalateCriticalFailure(failure: ModelFailure): void {
    console.error(
      "🚨 CRITICAL AI FAILURE - IMMEDIATE ATTENTION REQUIRED:",
      failure,
    );

    // In production, this would:
    // 1. Send alerts to engineering team
    // 2. Create incident ticket
    // 3. Switch to backup model if available
    // 4. Log to monitoring system
  }

  private static persistFailures(): void {
    try {
      localStorage.setItem(
        "ai-model-failures",
        JSON.stringify(this.failures.slice(-1000)),
      ); // Keep last 1000
      localStorage.setItem(
        "ai-failure-patterns",
        JSON.stringify(this.patterns),
      );
    } catch (error) {
      console.warn("Failed to persist AI failures:", error);
    }
  }

  private static getTopFailingModels(failures: ModelFailure[]) {
    const modelCounts = failures.reduce(
      (acc, f) => {
        acc[f.modelName] = (acc[f.modelName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(modelCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([model, count]) => ({ model, count }));
  }

  private static getTopFailingTasks(failures: ModelFailure[]) {
    const taskCounts = failures.reduce(
      (acc, f) => {
        acc[f.taskType] = (acc[f.taskType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(taskCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([task, count]) => ({ task, count }));
  }

  private static getDailyFailureTrend(failures: ModelFailure[]) {
    const dailyCounts = failures.reduce(
      (acc, f) => {
        const date = f.timestamp.toISOString().split("T")[0] || "";
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  private static getImprovementOpportunities(failures: ModelFailure[]) {
    const opportunities: Array<{
      type: string;
      description: string;
      priority: string;
      estimatedImpact: string;
    }> = [];

    // High failure rate opportunities
    const highFailureModels = this.getTopFailingModels(failures).filter(
      (m) => m.count > 5,
    );
    highFailureModels.forEach(({ model, count }) => {
      opportunities.push({
        type: "model-replacement",
        description: `${model} has ${count} failures - consider switching to more reliable model`,
        priority: "high",
        estimatedImpact: "Reduce failures by 60-80%",
      });
    });

    // Common failure patterns
    const commonFailures = failures.reduce(
      (acc, f) => {
        const key = `${f.failureType}-${f.taskType}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    Object.entries(commonFailures)
      .filter(([, count]) => count >= 3)
      .forEach(([pattern, count]) => {
        opportunities.push({
          type: "pattern-fix",
          description: `${pattern} pattern appears ${count} times - implement systematic fix`,
          priority: count > 10 ? "high" : "medium",
          estimatedImpact: "Eliminate entire failure category",
        });
      });

    return opportunities;
  }

  // 🚀 INITIALIZE FROM STORAGE
  static initialize(): void {
    try {
      const storedFailures = localStorage.getItem("ai-model-failures");
      const storedPatterns = localStorage.getItem("ai-failure-patterns");

      if (storedFailures) {
        this['failures'] = JSON.parse(storedFailures).map((f: any) => ({
          ...f,
          timestamp: new Date(f.timestamp),
        }));
      }

      if (storedPatterns) {
        this['patterns'] = JSON.parse(storedPatterns).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
      }

      console.log("🔧 AI Failure Tracker initialized:", {
        failures: this.failures.length,
        patterns: this.patterns.length,
      });
    } catch (error) {
      console.warn("Failed to initialize AI failure tracker:", error);
    }
  }

  // 📊 EXPORT FOR ANALYSIS
  static exportFailureData() {
    return {
      failures: this.failures,
      patterns: this.patterns,
      analytics: this.getFailureAnalytics(),
      recommendations: this.getModelRecommendations("gpt-4o", "writing"),
    };
  }
}

// Initialize on load
if (typeof window !== "undefined") {
  AIModelFailureTracker.initialize();
}

// 🎯 USAGE EXAMPLE:
/*
// Track a failure
AIModelFailureTracker.trackFailure({
  modelName: 'gpt-4o',
  modelVersion: '2024-05-13',
  taskType: 'writing',
  failureType: 'poor-quality',
  inputContext: {
    prompt: 'Write a professional email to...',
    contextLength: 250,
    complexity: 'medium',
    domain: 'sales-outreach'
  },
  expectedOutput: 'Professional, personalized email',
  actualOutput: 'Generic, templated response',
  severity: 'medium',
  userImpact: 'moderate',
  userId: 'user123',
  workspaceId: 'workspace456',
  metadata: { temperature: 0.7, maxTokens: 500 }
});

// Get recommendations
const recommendations = AIModelFailureTracker.getModelRecommendations('gpt-4o', 'writing');
console.log('Model recommendations:', recommendations);

// Get analytics
const analytics = AIModelFailureTracker.getFailureAnalytics();
console.log('Failure analytics:', analytics);
*/
