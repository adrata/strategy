"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PasswordProtection from '../../PasswordProtection';
import { WorkflowVisualization } from './components/WorkflowVisualization';
import { RealTimeMonitoring } from './components/RealTimeMonitoring';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  dependencies: string[];
  parallel: boolean;
  output?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

interface WorkflowExecution {
  id: string;
  companyName: string;
  steps: WorkflowStep[];
  startTime: number;
  endTime?: number;
  status: 'idle' | 'running' | 'completed' | 'error';
}

const InteractiveWorkflowValidator: React.FC = () => {
  const [workflow, setWorkflow] = useState<WorkflowExecution>({
    id: '',
    companyName: 'Dell Technologies',
    steps: [
      {
        id: 'step1',
        name: 'Input Processing & Validation',
        description: 'Validate company name and load seller profile',
        status: 'pending',
        dependencies: [],
        parallel: false
      },
      {
        id: 'step2',
        name: 'Company Data Discovery',
        description: 'Search CoreSignal API for company information',
        status: 'pending',
        dependencies: ['step1'],
        parallel: false
      },
      {
        id: 'step3',
        name: 'Search Query Generation',
        description: 'Generate targeted searches for different buyer roles',
        status: 'pending',
        dependencies: ['step2'],
        parallel: false
      },
      {
        id: 'step4a',
        name: 'Parallel Search Execution',
        description: 'Execute multiple targeted searches simultaneously',
        status: 'pending',
        dependencies: ['step3'],
        parallel: true
      },
      {
        id: 'step4b',
        name: 'Seller Profile Adaptation',
        description: 'Adapt seller profile based on company context',
        status: 'pending',
        dependencies: ['step2'],
        parallel: true
      },
      {
        id: 'step5',
        name: 'Profile Collection',
        description: 'Collect detailed professional profiles',
        status: 'pending',
        dependencies: ['step4a'],
        parallel: false
      },
      {
        id: 'step6a',
        name: 'Quality Filtering',
        description: 'Filter and rank prospects by relevance',
        status: 'pending',
        dependencies: ['step5'],
        parallel: true
      },
      {
        id: 'step6b',
        name: 'Company Intelligence Analysis',
        description: 'Analyze company health and pain signals',
        status: 'pending',
        dependencies: ['step2'],
        parallel: true
      },
      {
        id: 'step6c',
        name: 'Pain Intelligence Analysis',
        description: 'Identify individual pain points and buying signals',
        status: 'pending',
        dependencies: ['step5'],
        parallel: true
      },
      {
        id: 'step7',
        name: 'Role Assignment',
        description: 'Assign buyer group roles to each person',
        status: 'pending',
        dependencies: ['step6a', 'step6b', 'step6c'],
        parallel: false
      },
      {
        id: 'step8',
        name: 'Buyer Group Assembly',
        description: 'Create cohesive, balanced buyer group',
        status: 'pending',
        dependencies: ['step7'],
        parallel: false
      },
      {
        id: 'step9a',
        name: 'Contact Validation',
        description: 'Verify email addresses and phone numbers',
        status: 'pending',
        dependencies: ['step8'],
        parallel: true
      },
      {
        id: 'step9b',
        name: 'Employment Verification',
        description: 'Confirm current employment status',
        status: 'pending',
        dependencies: ['step8'],
        parallel: true
      },
      {
        id: 'step10',
        name: 'Intelligence Synthesis',
        description: 'Generate strategic insights and recommendations',
        status: 'pending',
        dependencies: ['step9a', 'step9b'],
        parallel: false
      },
      {
        id: 'step11',
        name: 'Output Generation',
        description: 'Create comprehensive buyer group report',
        status: 'pending',
        dependencies: ['step10'],
        parallel: false
      }
    ],
    startTime: 0,
    status: 'idle'
  });

  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  const addLogEntry = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setExecutionLog(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const updateStepStatus = useCallback((stepId: string, status: WorkflowStep['status'], output?: any, error?: string) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => {
        if (step.id === stepId) {
          const now = Date.now();
          const updatedStep = { ...step, status };
          
          if (status === 'running') {
            updatedStep.startTime = now;
          } else if (status === 'completed' || status === 'error') {
            updatedStep.endTime = now;
            if (step.startTime) {
              updatedStep.duration = now - step.startTime;
            }
          }
          
          if (output) updatedStep.output = output;
          if (error) updatedStep.error = error;
          
          return updatedStep;
        }
        return step;
      })
    }));
  }, []);

  const canRunStep = useCallback((step: WorkflowStep): boolean => {
    if (step.status !== 'pending') return false;
    
    return step.dependencies.every(depId => {
      const depStep = workflow.steps.find(s => s.id === depId);
      return depStep?.status === 'completed';
    });
  }, [workflow.steps]);

  const getRunnableSteps = useCallback((): WorkflowStep[] => {
    return workflow.steps.filter(canRunStep);
  }, [workflow.steps, canRunStep]);

  const executeStep = useCallback(async (stepId: string) => {
    const step = workflow.steps.find(s => s.id === stepId);
    if (!step || !canRunStep(step)) return;

    addLogEntry(`🚀 Starting ${step.name}...`);
    updateStepStatus(stepId, 'running');

    try {
      // Simulate API call to execute the step
      const response = await fetch('/api/workflow/execute-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          companyName: workflow.companyName,
          workflowId: workflow.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      updateStepStatus(stepId, 'completed', result.output);
      addLogEntry(`✅ Completed ${step.name} in ${result.duration}ms`);
      
      if (result.output) {
        addLogEntry(`📊 Output: ${JSON.stringify(result.output, null, 2)}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateStepStatus(stepId, 'error', undefined, errorMessage);
      addLogEntry(`❌ Error in ${step.name}: ${errorMessage}`);
    }
  }, [workflow, canRunStep, addLogEntry, updateStepStatus]);

  const executeAllRunnableSteps = useCallback(async () => {
    const runnableSteps = getRunnableSteps();
    if (runnableSteps.length === 0) return;

    setIsMonitoringActive(true);
    addLogEntry(`🔄 Executing ${runnableSteps.length} runnable steps...`);

    // Execute parallel steps simultaneously
    const parallelSteps = runnableSteps.filter(step => step.parallel);
    const sequentialSteps = runnableSteps.filter(step => !step.parallel);

    // Execute parallel steps
    if (parallelSteps.length > 0) {
      addLogEntry(`⚡ Executing ${parallelSteps.length} parallel steps...`);
      await Promise.all(parallelSteps.map(step => executeStep(step.id)));
    }

    // Execute sequential steps one by one
    for (const step of sequentialSteps) {
      await executeStep(step.id);
    }

    setIsMonitoringActive(false);
  }, [getRunnableSteps, executeStep, addLogEntry]);

  const resetWorkflow = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => ({
        ...step,
        status: 'pending' as const,
        output: undefined,
        error: undefined,
        startTime: undefined,
        endTime: undefined,
        duration: undefined
      })),
      status: 'idle' as const,
      startTime: 0,
      endTime: undefined
    }));
    setExecutionLog([]);
    addLogEntry('🔄 Workflow reset');
  }, [addLogEntry]);

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 TOP Interactive Workflow Validator
          </h1>
          <p className="text-gray-600">
            Step-by-step validation of the buyer group generation process with real-time monitoring
          </p>
        </div>

        {/* Workflow Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Workflow Controls</h2>
            <div className="flex gap-3">
              <button
                onClick={executeAllRunnableSteps}
                disabled={getRunnableSteps().length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                ⚡ Run All Runnable Steps
              </button>
              <button
                onClick={resetWorkflow}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                🔄 Reset Workflow
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Company:</strong> {workflow.companyName}</p>
            <p><strong>Runnable Steps:</strong> {getRunnableSteps().length}</p>
            <p><strong>Completed Steps:</strong> {workflow.steps.filter(s => s.status === 'completed').length}</p>
          </div>
        </div>

        {/* Workflow Visualization */}
        <div className="mb-6">
          <WorkflowVisualization
            steps={workflow.steps}
            selectedStep={selectedStep}
            onStepSelect={setSelectedStep}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Steps */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Workflow Steps</h2>
              <div className="space-y-3">
                {workflow.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedStep === step.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${getStepStatusColor(step.status)}`}></div>
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="font-medium text-gray-900">{step.name}</span>
                        <span className="text-sm text-gray-500">
                          {step.parallel ? '⚡ Parallel' : '➡️ Sequential'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getStepStatusIcon(step.status)}</span>
                        {step.duration && (
                          <span className="text-xs text-gray-500">{step.duration}ms</span>
                        )}
                        {canRunStep(step) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              executeStep(step.id);
                            }}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Run
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 ml-7">{step.description}</p>
                    {step.dependencies.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 ml-7">
                        Depends on: {step.dependencies.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step Details & Execution Log */}
          <div className="space-y-6">
            {/* Step Details */}
            {selectedStep && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step Details</h3>
                {(() => {
                  const step = workflow.steps.find(s => s.id === selectedStep);
                  if (!step) return null;
                  
                  return (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{step.name}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                      
                      <div className="text-sm">
                        <p><strong>Status:</strong> {step.status}</p>
                        <p><strong>Type:</strong> {step.parallel ? 'Parallel' : 'Sequential'}</p>
                        {step.dependencies.length > 0 && (
                          <p><strong>Dependencies:</strong> {step.dependencies.join(', ')}</p>
                        )}
                        {step.duration && (
                          <p><strong>Duration:</strong> {step.duration}ms</p>
                        )}
                      </div>

                      {step.output && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Output:</h5>
                          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      )}

                      {step.error && (
                        <div>
                          <h5 className="font-medium text-red-600 mb-2">Error:</h5>
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {step.error}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Execution Log */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Log</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-auto">
                {executionLog.length === 0 ? (
                  <p className="text-gray-500">No execution log entries yet...</p>
                ) : (
                  executionLog.map((entry, index) => (
                    <div key={index} className="mb-1">
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Monitoring */}
        <div className="mt-6">
          <RealTimeMonitoring isActive={isMonitoringActive} />
        </div>
      </div>
    </div>
  );
};

export default function InteractiveWorkflowValidatorPage() {
  return (
    <PasswordProtection correctPassword="top2025">
      <InteractiveWorkflowValidator />
    </PasswordProtection>
  );
}
