import React, { useMemo, useState, useCallback } from 'react';
import { 
  CircleStackIcon, 
  ArrowPathRoundedSquareIcon, 
  BoltIcon 
} from "@heroicons/react/24/outline";
import { WorkflowStep, WorkflowConnection, ContextMenuState } from '../types';

interface WorkflowCanvasProps {
  workflowSteps: WorkflowStep[];
  setWorkflowSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>;
  draggingStep: string | null;
  activeTool: 'cursor' | 'hand';
  zoom: number;
  pan: { x: number; y: number };
  isExecuting: boolean;
  currentStepIndex: number;
  hoveredCard: string | null;
  closestConnectionPoint: string | null;
  onStepClick: (stepId: string) => void;
  onStepMouseDown: (e: React.MouseEvent, stepId: string) => void;
  onStepMouseEnter: (stepId: string) => void;
  onStepMouseLeave: () => void;
  onStepMouseMove: (e: React.MouseEvent, stepId: string) => void;
  onConnectionPointClick: (stepId: string, side: string) => void;
  onContextMenu: (e: React.MouseEvent, stepId: string) => void;
  onBackgroundClick: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onBackgroundMouseDown: (e: React.MouseEvent) => void;
}

const getTypeIcon = (stepId: string) => {
  if (stepId.startsWith('data-')) return CircleStackIcon;
  if (stepId.startsWith('condition') || stepId.startsWith('switch') || stepId.startsWith('loop') || stepId.startsWith('parallel')) return ArrowPathRoundedSquareIcon;
  if (stepId.startsWith('http-request') || stepId.startsWith('webhook') || stepId.startsWith('delay') || stepId.startsWith('schedule')) return BoltIcon;
  return CircleStackIcon; // Default for existing CFO/CRO pipeline steps
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflowSteps,
  draggingStep,
  activeTool,
  zoom,
  pan,
  isExecuting,
  currentStepIndex,
  hoveredCard,
  closestConnectionPoint,
  onStepClick,
  onStepMouseDown,
  onStepMouseEnter,
  onStepMouseLeave,
  onStepMouseMove,
  onConnectionPointClick,
  onContextMenu,
  onBackgroundClick,
  onWheel,
  onBackgroundMouseDown
}) => {
  // Memoize connection lines for better performance
  const connectionLines = useMemo(() => {
    return workflowSteps.map((step, index) => {
      if (index === workflowSteps.length - 1) return null;

      const nextStep = workflowSteps[index + 1];
      const widgetHeight = 60;
      const widgetWidth = 200;
      
      const startX = step.position.x + widgetWidth;
      const startY = step.position.y + widgetHeight / 2;
      const endX = nextStep.position.x;
      const endY = nextStep.position.y + widgetHeight / 2;
      
      const distance = Math.abs(endX - startX);
      const controlOffset = Math.min(distance * 0.3, 100);
      const verticalOffset = Math.min(Math.abs(endY - startY) * 0.3, 50);
      
      const controlX1 = startX + controlOffset;
      const controlY1 = startY + verticalOffset;
      const controlX2 = endX - controlOffset;
      const controlY2 = endY - verticalOffset;
      
      return (
        <path
          key={`connection-${step.id}-${nextStep.id}`}
          d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
          stroke="#d1d5db"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });
  }, [workflowSteps]);

  return (
    <div className="flex-1 bg-white overflow-hidden relative">
      <div 
        className={`absolute inset-0 flex items-center justify-center p-8 ${
          activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'
        }`}
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
        onWheel={onWheel}
        onMouseDown={onBackgroundMouseDown}
        onClick={onBackgroundClick}
      >
        <div className="relative w-full h-full">
          {/* Connection Lines */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, width: '100%', height: '100%' }}>
            {connectionLines}
          </svg>

          {/* CFO/CRO Pipeline Step Widgets */}
          {workflowSteps.map((step) => (
            <div
              key={step.id}
              className={`absolute bg-white border rounded-lg p-3 shadow-sm transition-all duration-150 ${
                draggingStep === step.id ? 'scale-105 shadow-xl border-blue-300' : ''
              } ${activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'} ${
                draggingStep === step.id ? 'cursor-grabbing' : ''
              } ${
                isExecuting && currentStepIndex === workflowSteps.findIndex(s => s.id === step.id) 
                  ? 'border-green-500 bg-green-50' 
                  : step.isActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-100 hover:border-gray-200'
              }`}
              style={{
                transform: `translate(${step.position.x}px, ${step.position.y}px)`,
                zIndex: draggingStep === step.id ? 1000 : 2,
                width: '200px',
                minHeight: '60px'
              }}
              onMouseDown={(e) => onStepMouseDown(e, step.id)}
              onClick={() => onStepClick(step.id)}
              onContextMenu={(e) => onContextMenu(e, step.id)}
              onMouseEnter={() => onStepMouseEnter(step.id)}
              onMouseLeave={onStepMouseLeave}
              onMouseMove={(e) => onStepMouseMove(e, step.id)}
            >
              {/* Connection Points - Only show closest one on hover */}
              {hoveredCard === step.id && closestConnectionPoint && (
                <div
                  className={`absolute w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center transition-all duration-150 hover:border-blue-400 ${
                    closestConnectionPoint === `${step.id}-right` ? '-right-2 top-1/2 transform -translate-y-1/2' :
                    closestConnectionPoint === `${step.id}-left` ? '-left-2 top-1/2 transform -translate-y-1/2' :
                    closestConnectionPoint === `${step.id}-top` ? '-top-2 left-1/2 transform -translate-x-1/2' :
                    closestConnectionPoint === `${step.id}-bottom` ? '-bottom-2 left-1/2 transform -translate-x-1/2' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const side = closestConnectionPoint.split('-')[1];
                    onConnectionPointClick(step.id, side);
                  }}
                >
                  <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-medium border ${
                    isExecuting && currentStepIndex === workflowSteps.findIndex(s => s.id === step.id)
                      ? 'bg-green-500 text-white border-green-500'
                      : step.isActive 
                        ? 'bg-gray-200 text-gray-800 border-gray-800' 
                        : 'bg-white text-gray-600 border-gray-300'
                  }`}>
                    {workflowSteps.findIndex(s => s.id === step.id) + 1}
                  </div>
                  <div className="text-xs font-medium text-gray-700">{step.title}</div>
                </div>
                {/* Type indicator icon */}
                <div className="w-5 h-5 border border-gray-300 rounded-md flex items-center justify-center">
                  {(() => {
                    const IconComponent = getTypeIcon(step.id);
                    return <IconComponent className="w-3 h-3 text-gray-400" />;
                  })()}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
