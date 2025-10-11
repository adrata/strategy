/**
 * 📏 BUYER GROUP BENCHMARKING
 *
 * Defines competitive vectors and a lightweight scoring framework
 */

export type BenchmarkVector = {
  key: string;
  label: string;
  importance: number; // 1-5
  description: string;
};

export type BenchmarkResult = {
  vectorKey: string;
  score: number; // 0-10
  rationale: string;
};

export const BENCHMARK_VECTORS: BenchmarkVector[] = [
  { key: 'accuracy', label: 'Buyer Group Accuracy', importance: 5, description: 'Correct role assignment and member coverage' },
  { key: 'defensibility', label: 'Defensibility & Explainability', importance: 5, description: 'Transparent scoring, rationales, and evidence' },
  { key: 'pain_intelligence', label: 'Pain Intelligence Depth', importance: 5, description: 'Ability to surface pains, urgency, signals' },
  { key: 'cost_efficiency', label: 'Cost Efficiency', importance: 5, description: 'Minimize credits, progressive collection, early stop' },
  { key: 'recall_precision', label: 'Recall & Precision Balance', importance: 4, description: 'Segmented search with dedupe and quality filters' },
  { key: 'scalability', label: 'Scalability', importance: 4, description: 'Handle 100k+ orgs and many accounts concurrently' },
  { key: 'timeliness', label: 'Timeliness', importance: 3, description: 'Leverage recent changes and signal recency' },
  { key: 'adaptability', label: 'Adaptability', importance: 4, description: 'Seller-profile driven filtering and scoring' },
  { key: 'llm_defense', label: 'LLM Defensibility', importance: 3, description: 'Optional LLM summary for exec scrutiny' },
  { key: 'role_balance', label: 'Role Balance', importance: 4, description: 'Balanced mix of decision, champion, stakeholder, blocker, introducer' },
  { key: 'early_stop', label: 'Early Stop Capability', importance: 4, description: 'Stop when sufficient high-confidence group found' },
  { key: 'caching', label: 'Caching & Reuse', importance: 3, description: 'Avoid duplicate collects across runs' }
];

export function defaultBenchmark(): { vectors: BenchmarkVector[] } {
  return { vectors: BENCHMARK_VECTORS };
}

export function computeWeightedScore(results: BenchmarkResult[]): number {
  const importanceByKey = Object.fromEntries(BENCHMARK_VECTORS.map(v => [v.key, v.importance]));
  let totalWeighted = 0;
  let totalImportance = 0;
  for (const r of results) {
    const imp = importanceByKey[r.vectorKey] ?? 1;
    totalWeighted += r.score * imp;
    totalImportance += imp;
  }
  return totalImportance > 0 ? Math.round((totalWeighted / totalImportance) * 10) / 10 : 0;
}


