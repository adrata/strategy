/**
 * CFO/CRO Discovery Pipeline Types
 * 
 * Comprehensive type definitions for the visual workflow builder
 */

export interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'parallel' | 'merge';
  title: string;
  description: string;
  position: { x: number; y: number };
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  executionTime?: number;
  cost?: number;
  error?: string;
}

export interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'success' | 'failure' | 'parallel' | 'default';
  condition?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  totalCost: number;
  successRate: number;
  progress: number;
  currentStep?: string;
  results: Record<string, any>;
  errors: string[];
}

export interface CompanyData {
  name: string;
  domain?: string;
  size?: number;
  industry?: string;
  location?: string;
  employees?: number;
  revenue?: number;
}

export interface ExecutiveData {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  company: string;
  confidence: number;
  source: string;
  lastUpdated: Date;
}

export interface VerificationResult {
  type: 'email' | 'phone' | 'person';
  status: 'valid' | 'invalid' | 'unknown';
  confidence: number;
  source: string;
  cost: number;
  timestamp: Date;
}

export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  type: 'input' | 'process' | 'verification' | 'output';
  parallel: boolean;
  apis: string[];
  estimatedCost: number;
  estimatedTime: number;
  successRate: number;
}

// CFO/CRO Discovery Pipeline Steps
export const CFO_CRO_PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'company-resolution',
    name: 'Company Resolution',
    description: 'Input company name, resolve domain/ID, detect size',
    type: 'input',
    parallel: false,
    apis: ['CoreSignal'],
    estimatedCost: 0.05,
    estimatedTime: 15,
    successRate: 95
  },
  {
    id: 'executive-discovery',
    name: 'Multi-Strategy Executive Discovery',
    description: '3-tier waterfall: CoreSignal → Executive Research → AI Research',
    type: 'process',
    parallel: false,
    apis: ['CoreSignal', 'Claude AI'],
    estimatedCost: 0.15,
    estimatedTime: 45,
    successRate: 85
  },
  {
    id: 'contact-enrichment',
    name: 'Contact Enrichment',
    description: 'Enhance and validate contact data',
    type: 'process',
    parallel: false,
    apis: ['People Data Labs'],
    estimatedCost: 0.10,
    estimatedTime: 20,
    successRate: 80
  },
  {
    id: 'parallel-verification',
    name: 'Parallel Multi-Source Verification',
    description: 'Run 3 verification types simultaneously',
    type: 'verification',
    parallel: true,
    apis: ['Lusha', 'ZeroBounce', 'Prospeo Mobile'],
    estimatedCost: 0.20,
    estimatedTime: 30,
    successRate: 90
  },
  {
    id: 'result-aggregation',
    name: 'Result Aggregation',
    description: 'Merge results with confidence scores',
    type: 'process',
    parallel: false,
    apis: [],
    estimatedCost: 0.00,
    estimatedTime: 10,
    successRate: 100
  },
  {
    id: 'efficacy-tracking',
    name: 'Efficacy Tracking',
    description: 'Monitor performance, costs, success rates',
    type: 'process',
    parallel: false,
    apis: [],
    estimatedCost: 0.00,
    estimatedTime: 5,
    successRate: 100
  },
  {
    id: 'results-storage',
    name: 'Results Storage',
    description: 'Save with full audit trail',
    type: 'output',
    parallel: false,
    apis: [],
    estimatedCost: 0.00,
    estimatedTime: 5,
    successRate: 100
  }
];

export interface WorkflowBuilderState {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  selectedNode?: string;
  selectedConnection?: string;
  isExecuting: boolean;
  execution?: WorkflowExecution;
  zoom: number;
  pan: { x: number; y: number };
}
