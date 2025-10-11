import { Workflow, WorkflowExecution, ExecutionLog } from '../types/workflow';
import { IntegrationNode } from '../types/integration';
import { nangoService } from './NangoService';

/**
 * Workflow Execution Engine
 * Executes integration workflows by traversing nodes and connections
 */
export class WorkflowEngine {
  private executionLogs: ExecutionLog[] = [];
  private nodeOutputs: Map<string, any> = new Map();

  /**
   * Execute a workflow
   */
  async execute(
    workflow: Workflow,
    onProgress?: (log: ExecutionLog) => void
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId: workflow.id,
      status: 'running',
      startedAt: new Date(),
      logs: [],
    };

    try {
      this.log('info', 'workflow-start', `Starting workflow: ${workflow.name}`);
      if (onProgress) onProgress(this.executionLogs[this.executionLogs.length - 1]);

      // Find trigger nodes (nodes with no incoming connections)
      const triggerNodes = this.findTriggerNodes(workflow);

      if (triggerNodes.length === 0) {
        throw new Error('No trigger node found in workflow');
      }

      // Execute from trigger nodes
      for (const triggerNode of triggerNodes) {
        await this.executeNode(triggerNode, workflow, onProgress);
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      this.log('success', 'workflow-complete', `Workflow completed successfully`);
      if (onProgress) onProgress(this.executionLogs[this.executionLogs.length - 1]);
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', 'workflow-error', execution.error, { error });
      if (onProgress) onProgress(this.executionLogs[this.executionLogs.length - 1]);
    }

    execution.logs = [...this.executionLogs];
    return execution;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: IntegrationNode,
    workflow: Workflow,
    onProgress?: (log: ExecutionLog) => void
  ): Promise<any> {
    this.log('info', node.id, `Executing node: ${node.title}`);
    if (onProgress) onProgress(this.executionLogs[this.executionLogs.length - 1]);

    try {
      let result: any;

      // Execute based on node type
      switch (node.type) {
        case 'trigger':
          result = await this.executeTriggerNode(node);
          break;
        case 'action':
          result = await this.executeActionNode(node);
          break;
        case 'transform':
          result = await this.executeTransformNode(node);
          break;
        case 'condition':
          result = await this.executeConditionNode(node);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Store node output
      this.nodeOutputs.set(node.id, result);

      this.log('success', node.id, `Node completed: ${node.title}`, { result });
      if (onProgress) onProgress(this.executionLogs[this.executionLogs.length - 1]);

      // Execute downstream nodes
      const downstreamNodes = this.findDownstreamNodes(node.id, workflow);
      for (const downstreamNode of downstreamNodes) {
        await this.executeNode(downstreamNode, workflow, onProgress);
      }

      return result;
    } catch (error) {
      this.log('error', node.id, `Node failed: ${node.title}`, { error });
      if (onProgress) onProgress(this.executionLogs[this.executionLogs.length - 1]);
      throw error;
    }
  }

  /**
   * Execute trigger node
   */
  private async executeTriggerNode(node: IntegrationNode): Promise<any> {
    // Trigger nodes typically just pass through their configuration
    return node.config || {};
  }

  /**
   * Execute action node (API call via Nango)
   */
  private async executeActionNode(node: IntegrationNode): Promise<any> {
    const { provider, operation, config } = node;

    // Get upstream data
    const inputData = this.getInputDataForNode(node.id);

    // Merge config with input data
    const requestData = { ...config, ...inputData };

    // Execute via Nango
    if (config?.connectionId) {
      return await nangoService.executeOperation(
        config.connectionId,
        operation,
        requestData
      );
    }

    throw new Error(`No connection configured for ${provider}`);
  }

  /**
   * Execute transform node (data manipulation)
   */
  private async executeTransformNode(node: IntegrationNode): Promise<any> {
    const inputData = this.getInputDataForNode(node.id);
    const { config } = node;

    // Apply transformations based on config
    if (config?.transformations) {
      return this.applyTransformations(inputData, config.transformations);
    }

    return inputData;
  }

  /**
   * Execute condition node (branching logic)
   */
  private async executeConditionNode(node: IntegrationNode): Promise<any> {
    const inputData = this.getInputDataForNode(node.id);
    const { config } = node;

    if (config?.condition) {
      // Evaluate condition
      const result = this.evaluateCondition(inputData, config.condition);
      return { conditionMet: result, data: inputData };
    }

    return { conditionMet: true, data: inputData };
  }

  /**
   * Find trigger nodes (no incoming connections)
   */
  private findTriggerNodes(workflow: Workflow): IntegrationNode[] {
    const nodesWithIncoming = new Set(workflow.connections.map(c => c.to));
    return workflow.nodes.filter(node => !nodesWithIncoming.has(node.id));
  }

  /**
   * Find downstream nodes
   */
  private findDownstreamNodes(nodeId: string, workflow: Workflow): IntegrationNode[] {
    const downstreamIds = workflow.connections
      .filter(c => c.from === nodeId)
      .map(c => c.to);
    return workflow.nodes.filter(node => downstreamIds.includes(node.id));
  }

  /**
   * Get input data for a node from upstream nodes
   */
  private getInputDataForNode(nodeId: string): any {
    // This would aggregate data from all upstream nodes
    // For now, return empty object
    return {};
  }

  /**
   * Apply data transformations
   */
  private applyTransformations(data: any, transformations: any[]): any {
    let result = { ...data };
    
    for (const transform of transformations) {
      const { type, source, target, value } = transform;
      
      switch (type) {
        case 'map':
          result[target] = data[source];
          break;
        case 'set':
          result[target] = value;
          break;
        case 'remove':
          delete result[target];
          break;
      }
    }
    
    return result;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(data: any, condition: any): boolean {
    const { field, operator, value } = condition;
    const fieldValue = data[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(value);
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      default:
        return false;
    }
  }

  /**
   * Add log entry
   */
  private log(
    level: 'info' | 'warning' | 'error' | 'success',
    nodeId: string,
    message: string,
    data?: any
  ): void {
    this.executionLogs.push({
      timestamp: new Date(),
      nodeId,
      level,
      message,
      data,
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

