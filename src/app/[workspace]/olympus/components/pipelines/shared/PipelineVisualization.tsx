"use client";

import React from 'react';
import { PipelineStep } from './PipelineStep';

interface PipelineStepData {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  estimatedTime?: string;
  estimatedCost?: string;
  inputPreview?: string;
  outputPreview?: string;
}

interface PipelineVisualizationProps {
  steps: PipelineStepData[];
  isExecuting?: boolean;
  currentStepIndex?: number;
  onStepToggle?: (stepId: string) => void;
  expandedSteps?: string[];
}

export const PipelineVisualization: React.FC<PipelineVisualizationProps> = ({
  steps,
  isExecuting = false,
  currentStepIndex = -1,
  onStepToggle,
  expandedSteps = []
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Pipeline Progress</h3>
        {isExecuting && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Executing...</span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {steps.map((step, index) => {
          const isExpanded = expandedSteps.includes(step.id);
          const isCurrentStep = currentStepIndex === index;
          const isCompleted = index < currentStepIndex;
          const isPending = index > currentStepIndex;
          
          let stepStatus: 'pending' | 'running' | 'completed' | 'error' = 'pending';
          if (isCompleted) stepStatus = 'completed';
          else if (isCurrentStep && isExecuting) stepStatus = 'running';
          else if (isPending) stepStatus = 'pending';

          return (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index > 0 && (
                <div className="absolute -top-2 left-8 w-0.5 h-4 bg-border"></div>
              )}
              
              <PipelineStep
                stepNumber={index + 1}
                title={step.title}
                description={step.description}
                status={stepStatus}
                estimatedTime={step.estimatedTime}
                estimatedCost={step.estimatedCost}
                inputPreview={step.inputPreview}
                outputPreview={step.outputPreview}
                isExpandable={true}
                isExpanded={isExpanded}
                onToggleExpand={() => onStepToggle?.(step.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Pipeline Summary */}
      <div className="mt-6 p-4 bg-hover rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted">Total Steps</div>
            <div className="font-semibold text-foreground">{steps.length}</div>
          </div>
          <div>
            <div className="text-muted">Completed</div>
            <div className="font-semibold text-green-600">
              {steps.filter((_, index) => index < currentStepIndex).length}
            </div>
          </div>
          <div>
            <div className="text-muted">Remaining</div>
            <div className="font-semibold text-foreground">
              {steps.length - Math.max(0, currentStepIndex)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
