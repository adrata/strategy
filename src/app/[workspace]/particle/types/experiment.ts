/**
 * Particle - Scientific Testing Platform Types
 * 
 * Type definitions for experiments, variants, test runs, and results
 */

export interface ParticleExperiment {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  hypothesis: string;
  experimentType: 'ab_test' | 'multivariate' | 'performance' | 'conversion' | 'retention';
  status: 'draft' | 'active' | 'completed' | 'archived' | 'cancelled';
  
  // Configuration
  baselineVariantId?: string;
  targetSampleSize?: number;
  confidenceLevel: number;
  significanceLevel: number;
  
  // Metadata
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Relations
  variants?: ParticleVariant[];
  testRuns?: ParticleTestRun[];
  results?: ParticleResult[];
  assertions?: ParticleAssertion[];
}

export interface ParticleVariant {
  id: string;
  experimentId: string;
  name: string;
  description?: string;
  configuration: Record<string, any>; // Variant-specific configuration
  isControl: boolean;
  weight: number; // Traffic weight (0.0-1.0)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  testRuns?: ParticleTestRun[];
  metrics?: ParticleMetric[];
}

export interface ParticleTestRun {
  id: string;
  experimentId: string;
  variantId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Execution details
  sampleSize: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // Duration in milliseconds
  
  // Results
  aggregatedMetrics?: Record<string, any>;
  errors?: Record<string, any>;
  logs?: Record<string, any>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  variant?: ParticleVariant;
  metrics?: ParticleMetric[];
}

export interface ParticleMetric {
  id: string;
  testRunId: string;
  variantId: string;
  metricType: 'conversion_rate' | 'cost_per_conversion' | 'execution_time' | 'success_rate' | 'error_rate' | 'throughput' | 'custom';
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ParticleResult {
  id: string;
  experimentId: string;
  summary: Record<string, any>; // Statistical summary
  winner?: string; // Winning variant ID
  confidence?: number; // Statistical confidence (0.0-1.0)
  pValue?: number; // Statistical significance p-value
  recommendation?: string; // AI-generated recommendation
  
  // Analysis details
  statisticalTest?: string;
  effectSize?: number;
  power?: number;
  
  // Metadata
  calculatedAt: Date;
}

export interface ParticleAssertion {
  id: string;
  experimentId: string;
  name: string;
  description?: string;
  assertion: string; // Assertion logic
  expectedValue?: number;
  tolerance?: number;
  
  // Status
  isPassing?: boolean; // null = not tested, true = passing, false = failing
  lastChecked?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// UI-specific types
export interface ExperimentFilters {
  type?: string;
  status?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  searchQuery?: string;
}

export interface ExperimentStats {
  totalExperiments: number;
  activeExperiments: number;
  completedExperiments: number;
  averageConfidence: number;
  totalTestRuns: number;
  successRate: number;
}

export interface VariantComparison {
  variant: ParticleVariant;
  metrics: {
    conversionRate: number;
    costPerConversion: number;
    executionTime: number;
    successRate: number;
    sampleSize: number;
  };
  confidence: number;
  isWinner: boolean;
  improvement: number; // Percentage improvement over control
}

export interface StatisticalAnalysis {
  testType: 't-test' | 'chi-square' | 'mann-whitney' | 'bayesian';
  pValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  effectSize: number;
  power: number;
  recommendation: 'continue' | 'stop' | 'extend';
  reasoning: string;
}

// Form types for creating/editing experiments
export interface CreateExperimentForm {
  name: string;
  description?: string;
  hypothesis: string;
  experimentType: ParticleExperiment['experimentType'];
  targetSampleSize?: number;
  confidenceLevel: number;
  significanceLevel: number;
  variants: CreateVariantForm[];
}

export interface CreateVariantForm {
  name: string;
  description?: string;
  configuration: Record<string, any>;
  isControl: boolean;
  weight: number;
}

export interface RunExperimentForm {
  experimentId: string;
  sampleSize?: number;
  duration?: number; // Duration in minutes
  parallel: boolean;
  assertions?: string[];
}

// API response types
export interface ExperimentListResponse {
  experiments: ParticleExperiment[];
  total: number;
  page: number;
  limit: number;
}

export interface ExperimentDetailResponse {
  experiment: ParticleExperiment;
  variants: ParticleVariant[];
  testRuns: ParticleTestRun[];
  results: ParticleResult[];
  assertions: ParticleAssertion[];
}

export interface TestRunResponse {
  testRun: ParticleTestRun;
  metrics: ParticleMetric[];
  logs: string[];
}

export interface ResultsResponse {
  results: ParticleResult[];
  analysis: StatisticalAnalysis;
  recommendations: string[];
}
