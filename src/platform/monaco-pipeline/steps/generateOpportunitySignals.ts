import { PipelineData, OpportunitySignal } from "../types";
import { v4 as uuidv4 } from "uuid";

interface SignalResult {
  insight: string;
  confidence: number; // 0-1
  rationale: string[];
  dataSources: string[];
  actionableItems: string[];
}

interface ClusterResult {
  id: string;
  centroid: number[];
  members: string[];
}

interface CorrelationResult {
  metric1: string;
  metric2: string;
  correlation: number;
}

export class OpportunitySignalEngine {
  private results: SignalResult[] = [];

  constructor(private outputDir: string = "output") {}

  private helpfulRationale(base: string, benefit: string): string {
    return `${base} This helps you ${benefit}.`;
  }

  // === EXISTING PATTERN DETECTION ===
  analyzeWhitespace(data: PipelineData): SignalResult[] {
    const results: SignalResult[] = [];
    if (!data.competitorActivity?.length) return results;

    const messagingThemes = new Map<string, number>();

    // Analyze competitor messaging themes
    data.competitorActivity.forEach(() => {
      // Extract themes from recent activities (simplified)
      const theme = this.extractTheme();
      messagingThemes.set(theme, (messagingThemes.get(theme) || 0) + 1);
    });

    const totalCompetitors = data.competitors.length || 1;

    messagingThemes.forEach((count, theme) => {
      if (count < totalCompetitors * 0.3) {
        results.push({
          insight: `Underserved theme: ${theme}`,
          confidence: 0.8,
          rationale: [
            this.helpfulRationale(
              `Only ${count} competitors focus on ${theme}.`,
              "spot a market gap and position your solution where others aren't looking",
            ),
          ],
          dataSources: ["competitor_activity", "market_analysis"],
          actionableItems: [
            `Develop messaging around ${theme}`,
            "Create enablement assets for this angle",
            "Target companies showing interest in this area",
          ],
        });
      }
    });

    return results;
  }

  analyzeTrendConvergence(data: PipelineData): SignalResult[] {
    const results: SignalResult[] = [];
    if (!data.enrichedProfiles?.length || !data.marketAnalysis?.trends?.length)
      return results;

    const skillsTrends = new Map<string, number>();
    const marketTrends = new Map<string, number>();

    // Analyze skills from enriched profiles
    data.enrichedProfiles.forEach(() => {
      const skill = "example skill"; // This would be replaced with actual skill extraction
      skillsTrends.set(skill, (skillsTrends.get(skill) || 0) + 1);
    });

    // Analyze market trends
    data.marketAnalysis.trends?.forEach((trend: any) => {
      marketTrends.set(trend.name, trend.momentum);
    });

    const totalProfiles = data.enrichedProfiles.length;

    skillsTrends.forEach((count, skill) => {
      const marketMomentum = marketTrends.get(skill);
      if (marketMomentum && count > totalProfiles * 0.2) {
        results.push({
          insight: `Converging trend: ${skill}`,
          confidence: 0.85,
          rationale: [
            this.helpfulRationale(
              `${count} profiles show ${skill} expertise and market momentum is ${marketMomentum}`,
              "align your strategy with where the market is moving and be seen as a forward-thinker",
            ),
          ],
          dataSources: ["profiles", "market_analysis"],
          actionableItems: [
            `Develop ${skill}-focused solutions`,
            "Create thought leadership around this trend",
            "Target companies investing in this area",
          ],
        });
      }
    });

    return results;
  }

  analyzeDecisionPatterns(data: PipelineData): SignalResult[] {
    const results: SignalResult[] = [];
    if (!data.decisionJourneys?.length) return results;

    const approvalPaths = new Map<string, number>();

    data.decisionJourneys.forEach((journey: any) => {
      const path = journey.approvalPath.join(" -> ");
      approvalPaths.set(path, (approvalPaths.get(path) || 0) + 1);
    });

    const totalJourneys = data.decisionJourneys.length;

    approvalPaths.forEach((count, path) => {
      if (count > totalJourneys * 0.2) {
        results.push({
          insight: `Common approval path: ${path}`,
          confidence: 0.9,
          rationale: [
            this.helpfulRationale(
              `Found in ${count} decision journeys.`,
              "navigate deals faster and avoid common bottlenecks",
            ),
          ],
          dataSources: ["decision_journeys"],
          actionableItems: [
            "Optimize sales process for this path",
            "Create enablement for each approval stage",
            "Develop champions at key decision points",
          ],
        });
      }
    });

    return results;
  }

  analyzeMarketMaturity(data: PipelineData): SignalResult[] {
    const results: SignalResult[] = [];
    if (!data.marketAnalysis?.companies?.length) return results;

    const adoptionStages = new Map<string, number>();

    data.marketAnalysis.companies.forEach((company: any) => {
      const stage = company.adoptionStage || "unknown";
      adoptionStages.set(stage, (adoptionStages.get(stage) || 0) + 1);
    });

    const totalCompanies = data.marketAnalysis.companies.length;

    adoptionStages.forEach((count, stage) => {
      const percentage = count / totalCompanies;
      if (percentage > 0.3) {
        results.push({
          insight: `Market maturity: ${stage} stage`,
          confidence: 0.85,
          rationale: [
            this.helpfulRationale(
              `${Math.round(percentage * 100)}% of market in ${stage} stage.`,
              "tailor your pitch to match where most buyers are in their journey",
            ),
          ],
          dataSources: ["market_analysis"],
          actionableItems: [
            `Tailor messaging for ${stage} companies`,
            "Develop stage-specific solutions",
            "Create maturity-based enablement",
          ],
        });
      }
    });

    return results;
  }

  analyzeCompetitiveDifferentiation(data: PipelineData): SignalResult[] {
    const results: SignalResult[] = [];
    if (!data.competitors?.length) return results;

    const competitorStrengths = new Map<string, Set<string>>();

    data.competitors.forEach((comp) => {
      comp.strengths?.forEach((strength: any) => {
        if (!competitorStrengths.has(strength)) {
          competitorStrengths.set(strength, new Set());
        }
        competitorStrengths.get(strength)!.add(comp.name);
      });
    });

    const totalCompetitors = data.competitors.length;

    competitorStrengths.forEach((companies, strength) => {
      if (companies.size < totalCompetitors * 0.3) {
        results.push({
          insight: `Differentiation opportunity: ${strength}`,
          confidence: 0.8,
          rationale: [
            this.helpfulRationale(
              `Only ${companies.size} competitors excel at ${strength}.`,
              "stand out and win deals by highlighting what makes you unique",
            ),
          ],
          dataSources: ["competitor_activity", "profiles"],
          actionableItems: [
            `Develop ${strength} as a core capability`,
            "Create differentiation messaging",
            "Build enablement around this strength",
          ],
        });
      }
    });

    return results;
  }

  // === ADVANCED STATISTICAL METHODS ===
  detect3SigmaAnomalies(): SignalResult[] {
    const results: SignalResult[] = [];
    // TODO: Implement 3-sigma anomaly detection
    return results;
  }

  detectEmergentClusters(): SignalResult[] {
    const results: SignalResult[] = [];
    // TODO: Implement emergent cluster detection
    return results;
  }

  amplifyWeakSignals(): SignalResult[] {
    const results: SignalResult[] = [];
    // TODO: Implement weak signal amplification
    return results;
  }

  discoverCorrelations(): SignalResult[] {
    const results: SignalResult[] = [];
    // TODO: Implement correlation discovery
    return results;
  }

  // === HELPER METHODS ===
  private extractTheme(): string {
    // Simplified theme extraction - in production would use NLP
    const themes = ["AI/ML", "Cloud", "Security", "Data Analytics", "DevOps"];
    return themes[Math.floor(Math.random() * themes.length)] || "Technology";
  }

  private extractGrowthRate(): number | null {
    // TODO: Implement growth rate extraction
    return null;
  }

  private performKMeansClustering(): ClusterResult[] {
    // TODO: Implement k-means clustering
    return [];
  }

  private calculateCorrelations(): CorrelationResult[] {
    // TODO: Implement correlation calculation
    return [];
  }

  // === MAIN EXECUTION ===
  runAllSignals(data: PipelineData): Record<string, SignalResult[]> {
    return {
      whitespace: this.analyzeWhitespace(data),
      trendConvergence: this.analyzeTrendConvergence(data),
      decisionPatterns: this.analyzeDecisionPatterns(data),
      marketMaturity: this.analyzeMarketMaturity(data),
      competitiveDifferentiation: this.analyzeCompetitiveDifferentiation(data),
      anomalies: this.detect3SigmaAnomalies(),
      clusters: this.detectEmergentClusters(),
      weakSignals: this.amplifyWeakSignals(),
      correlations: this.discoverCorrelations(),
    };
  }

  exportResults(results: Record<string, SignalResult[]>): OpportunitySignal[] {
    const opportunitySignals: OpportunitySignal[] = [];

    Object.entries(results).forEach(([, categoryResults]) => {
      categoryResults.forEach((result) => {
        opportunitySignals.push({
          id: uuidv4(),
          type: "market_analysis",
          signal: result.insight,
          strength: result.confidence,
          personId: "",
          companyId: "",
          actionable: true,
          insight: result.insight,
          confidence: result.confidence,
          rationale: result.rationale,
          dataSources: result.dataSources,
          actionableItems: result.actionableItems,
        });
      });
    });

    return opportunitySignals;
  }
}

export async function generateOpportunitySignals(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  const engine = new OpportunitySignalEngine();
  const results = engine.runAllSignals(data);
  const opportunitySignals = engine.exportResults(results);

  return {
    opportunitySignals,
  };
}
