"use client";

import React from "react";
import { WorkflowExecution } from "../types/workflow";

interface MonitoringDashboardProps {
  execution: WorkflowExecution;
}

export default function MonitoringDashboard({ execution }: MonitoringDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-muted bg-panel-background';
      default: return 'text-muted bg-panel-background';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '⏹️';
      default: return '⏸️';
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStepStatus = (stepId: string) => {
    const result = execution.results[stepId];
    if (!result) return { status: 'pending', icon: '⏳' };
    
    if (result.status === 'completed') return { status: 'completed', icon: '✅' };
    if (result.status === 'error') return { status: 'error', icon: '❌' };
    return { status: 'running', icon: '🔄' };
  };

  const steps = [
    { id: 'company-resolution', name: 'Company Resolution' },
    { id: 'executive-discovery', name: 'Executive Discovery' },
    { id: 'contact-enrichment', name: 'Contact Enrichment' },
    { id: 'parallel-verification', name: 'Parallel Verification' },
    { id: 'result-aggregation', name: 'Result Aggregation' },
    { id: 'efficacy-tracking', name: 'Efficacy Tracking' },
    { id: 'results-storage', name: 'Results Storage' }
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Pipeline Execution Monitor</h2>
            <p className="text-sm text-muted">Real-time monitoring of CFO/CRO discovery pipeline</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(execution.status)}`}>
            {getStatusIcon(execution.status)} {execution.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-muted">{Math.round(execution.progress)}%</span>
        </div>
        <div className="w-full bg-loading-bg rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${execution.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-panel-background p-3 rounded-lg">
            <div className="text-2xl font-bold text-foreground">${execution.totalCost.toFixed(2)}</div>
            <div className="text-sm text-muted">Total Cost</div>
          </div>
          <div className="bg-panel-background p-3 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{execution.successRate.toFixed(1)}%</div>
            <div className="text-sm text-muted">Success Rate</div>
          </div>
          <div className="bg-panel-background p-3 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{formatDuration(execution.startTime, execution.endTime)}</div>
            <div className="text-sm text-muted">Duration</div>
          </div>
          <div className="bg-panel-background p-3 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{execution.errors.length}</div>
            <div className="text-sm text-muted">Errors</div>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-md font-semibold text-foreground mb-4">Step Progress</h3>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step.id);
            const result = execution.results[step.id];
            
            return (
              <div key={step.id} className="flex items-center gap-3 p-3 bg-panel-background rounded-lg">
                <div className="flex-shrink-0">
                  <span className="text-lg">{stepStatus.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{step.name}</span>
                    {result?.executionTime && (
                      <span className="text-sm text-muted">{result.executionTime}ms</span>
                    )}
                  </div>
                  {result?.status && (
                    <div className="text-sm text-muted capitalize">{result.status}</div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    <span className="text-xs font-bold text-muted">{index + 1}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Errors */}
      {execution.errors.length > 0 && (
        <div className="p-4 border-t border-border">
          <h3 className="text-md font-semibold text-red-600 mb-2">Errors</h3>
          <div className="space-y-2">
            {execution.errors.map((error, index) => (
              <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {execution.status === 'completed' && (
        <div className="p-4 border-t border-border bg-green-50">
          <h3 className="text-md font-semibold text-green-800 mb-2">Execution Complete</h3>
          <div className="text-sm text-green-700">
            <p>Pipeline executed successfully in {formatDuration(execution.startTime, execution.endTime)}</p>
            <p>Total cost: ${execution.totalCost.toFixed(2)} | Success rate: {execution.successRate.toFixed(1)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
