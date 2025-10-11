import { useState, useCallback } from 'react';
import { Workflow, WorkflowExecution, ExecutionLog } from '../types/workflow';
import { WorkflowEngine } from '../services/WorkflowEngine';

export function useWorkflowExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);

  const executeWorkflow = useCallback(async (workflow: Workflow) => {
    setIsExecuting(true);
    setExecutionLogs([]);
    setCurrentExecution(null);

    const engine = new WorkflowEngine();

    try {
      const execution = await engine.execute(workflow, (log) => {
        setExecutionLogs((prev) => [...prev, log]);
      });

      setCurrentExecution(execution);
      return execution;
    } catch (error) {
      console.error('Workflow execution error:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const stopExecution = useCallback(() => {
    setIsExecuting(false);
    if (currentExecution) {
      setCurrentExecution({
        ...currentExecution,
        status: 'cancelled',
        completedAt: new Date(),
      });
    }
  }, [currentExecution]);

  const clearLogs = useCallback(() => {
    setExecutionLogs([]);
    setCurrentExecution(null);
  }, []);

  return {
    isExecuting,
    executionLogs,
    currentExecution,
    executeWorkflow,
    stopExecution,
    clearLogs,
  };
}

