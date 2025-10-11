import { IntegrationNode, IntegrationConnection } from './integration';

export interface Workflow {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  nodes: IntegrationNode[];
  connections: IntegrationConnection[];
  status: 'active' | 'inactive' | 'draft';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  logs: ExecutionLog[];
  error?: string;
  result?: any;
}

export interface ExecutionLog {
  timestamp: Date;
  nodeId: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
}

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'webhook' | 'event';
  config?: {
    schedule?: string; // Cron expression
    webhookUrl?: string;
    eventType?: string;
  };
}

