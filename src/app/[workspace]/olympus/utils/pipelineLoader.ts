import { WorkflowStep } from '../types';

/**
 * Pipeline Loader for CRO-CFO Discovery Pipeline
 * 
 * Maps the actual CRO-CFO orchestrator steps to Olympus workflow steps
 * Based on the CFOCROOrchestrator class structure
 */

export interface PipelineStepConfig {
  id: string;
  title: string;
  description: string;
  category: 'Data' | 'Research' | 'Enrichment' | 'Verification' | 'Aggregation' | 'Storage';
  estimatedTime: string;
  estimatedCost: string;
  confidence: string;
  functionName: string;
  dependencies?: string[];
  parallel?: boolean;
}

export const CRO_CFO_PIPELINE_STEPS: PipelineStepConfig[] = [
  {
    id: 'company-resolution',
    title: 'Company Resolution',
    description: 'Input company name, resolve domain/ID, detect company size and industry classification',
    category: 'Data',
    estimatedTime: '30s',
    estimatedCost: '$0.05',
    confidence: '95%',
    functionName: 'resolveCompanyFunction',
    dependencies: []
  },
  {
    id: 'executive-discovery',
    title: 'Multi-Strategy Executive Discovery',
    description: '3-tier waterfall: CoreSignal → Executive Research → AI Research (Claude) for CFO/CRO identification',
    category: 'Research',
    estimatedTime: '2m',
    estimatedCost: '$0.25',
    confidence: '85%',
    functionName: 'discoverExecutivesFunction',
    dependencies: ['company-resolution']
  },
  {
    id: 'person-verification',
    title: 'Person Identity Verification',
    description: 'Verify executive identity using multiple data sources and confidence scoring',
    category: 'Enrichment',
    estimatedTime: '45s',
    estimatedCost: '$0.15',
    confidence: '90%',
    functionName: 'verifyPersonFunction',
    dependencies: ['executive-discovery']
  },
  {
    id: 'email-verification',
    title: 'Email Verification',
    description: 'Multi-layer email validation: Syntax → Domain → SMTP → Prospeo verification',
    category: 'Verification',
    estimatedTime: '1m',
    estimatedCost: '$0.20',
    confidence: '88%',
    functionName: 'verifyEmailFunction',
    dependencies: ['person-verification'],
    parallel: true
  },
  {
    id: 'phone-verification',
    title: 'Phone Verification',
    description: 'Phone number validation and carrier lookup using Twilio services',
    category: 'Verification',
    estimatedTime: '1m',
    estimatedCost: '$0.20',
    confidence: '88%',
    functionName: 'verifyPhoneFunction',
    dependencies: ['person-verification'],
    parallel: true
  },
  {
    id: 'employment-verification',
    title: 'Employment Verification',
    description: 'Current employment status verification using Perplexity real-time data',
    category: 'Verification',
    estimatedTime: '1m',
    estimatedCost: '$0.20',
    confidence: '88%',
    functionName: 'verifyEmploymentFunction',
    dependencies: ['person-verification'],
    parallel: true
  },
  {
    id: 'result-aggregation',
    title: 'Result Aggregation',
    description: 'Merge verification results with confidence scores and quality metrics',
    category: 'Aggregation',
    estimatedTime: '15s',
    estimatedCost: '$0.02',
    confidence: '98%',
    functionName: 'aggregateResults',
    dependencies: ['email-verification', 'phone-verification', 'employment-verification']
  },
  {
    id: 'database-storage',
    title: 'Database Storage',
    description: 'Save executive data with full audit trail and verification details',
    category: 'Storage',
    estimatedTime: '5s',
    estimatedCost: '$0.01',
    confidence: '100%',
    functionName: 'saveExecutiveFunction',
    dependencies: ['result-aggregation']
  },
  {
    id: 'output-generation',
    title: 'Output Generation',
    description: 'Generate CSV and JSON outputs with complete executive profiles',
    category: 'Storage',
    estimatedTime: '5s',
    estimatedCost: '$0.01',
    confidence: '100%',
    functionName: 'generateOutputs',
    dependencies: ['database-storage'],
    parallel: true
  }
];

/**
 * Convert pipeline configuration to Olympus workflow steps
 */
export function loadCROCFOPipeline(): WorkflowStep[] {
  return CRO_CFO_PIPELINE_STEPS.map((config, index) => ({
    id: config.id,
    title: config.title,
    description: config.description,
    position: { 
      x: 100, 
      y: 100 + (index * 120) // Stack vertically with 120px spacing
    },
    isActive: false,
    category: config.category,
    estimatedTime: config.estimatedTime,
    estimatedCost: config.estimatedCost,
    confidence: config.confidence,
    functionName: config.functionName,
    dependencies: config.dependencies || [],
    parallel: config.parallel || false
  }));
}

/**
 * Get pipeline metadata
 */
export function getPipelineMetadata() {
  return {
    name: 'CRO-CFO Discovery Pipeline',
    description: 'Automated discovery and verification of Chief Revenue Officers and Chief Financial Officers',
    version: '2.0.0',
    totalSteps: CRO_CFO_PIPELINE_STEPS.length,
    estimatedTotalTime: '6m 15s',
    estimatedTotalCost: '$0.89',
    averageConfidence: '92%',
    parallelSteps: CRO_CFO_PIPELINE_STEPS.filter(step => step.parallel).length,
    categories: ['Data', 'Research', 'Enrichment', 'Verification', 'Aggregation', 'Storage']
  };
}

/**
 * Get step by function name
 */
export function getStepByFunctionName(functionName: string): PipelineStepConfig | undefined {
  return CRO_CFO_PIPELINE_STEPS.find(step => step.functionName === functionName);
}

/**
 * Get steps by category
 */
export function getStepsByCategory(category: string): PipelineStepConfig[] {
  return CRO_CFO_PIPELINE_STEPS.filter(step => step.category === category);
}

/**
 * Get parallel execution groups
 */
export function getParallelGroups(): PipelineStepConfig[][] {
  const groups: PipelineStepConfig[][] = [];
  let currentGroup: PipelineStepConfig[] = [];
  
  for (const step of CRO_CFO_PIPELINE_STEPS) {
    if (step.parallel) {
      currentGroup.push(step);
    } else {
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
      groups.push([step]);
    }
  }
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
}
