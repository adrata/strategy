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
  dragPosition: { x: number; y: number } | null;
  activeTool: 'cursor' | 'hand';
  zoom: number;
  pan: { x: number; y: number };
  isExecuting: boolean;
  currentStepIndex: number;
  hoveredCard: string | null;
  closestConnectionPoint: string | null;
  stepStatus: Record<string, 'success' | 'error' | 'pending'>;
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
  dragPosition,
  activeTool,
  zoom,
  pan,
  isExecuting,
  currentStepIndex,
  hoveredCard,
  closestConnectionPoint,
  stepStatus,
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
  // Helper function to get step position (either from dragPosition or step.position)
  const getStepPosition = useCallback((step: WorkflowStep) => {
    if (draggingStep === step.id && dragPosition) {
      return dragPosition;
    }
    return step.position;
  }, [draggingStep, dragPosition]);

  // Memoize connection lines for better performance
  const connectionLines = useMemo(() => {
    return workflowSteps.map((step, index) => {
      if (index === workflowSteps.length - 1) return null;

      const nextStep = workflowSteps[index + 1];
      const widgetHeight = 60;
      const widgetWidth = 200;
      
      // Use helper function to get current position (including during drag)
      const currentStepPos = getStepPosition(step);
      const currentNextStepPos = getStepPosition(nextStep);
      
      const startX = currentStepPos.x + widgetWidth;
      const startY = currentStepPos.y + widgetHeight / 2;
      const endX = currentNextStepPos.x;
      const endY = currentNextStepPos.y + widgetHeight / 2;
      
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
  }, [workflowSteps, getStepPosition]);

  return (
    <div 
      className={`flex-1 bg-[var(--background)] overflow-hidden relative ${
        activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'
      }`}
      data-canvas-container="true"
    >
      {/* Background layer for panning */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          zIndex: 1
        }}
        onWheel={onWheel}
        onMouseDown={onBackgroundMouseDown}
        onClick={onBackgroundClick}
      />
      
      {/* Content layer with workflow steps */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-8"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          zIndex: 2,
          pointerEvents: 'none'
        }}
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
              className={`absolute bg-[var(--background)] border rounded-lg p-3 shadow-sm transition-all duration-150 ${
                draggingStep === step.id ? 'scale-105 shadow-xl border-blue-300' : ''
              } ${activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'} ${
                draggingStep === step.id ? 'cursor-grabbing' : ''
              } ${
                stepStatus[step.id] === 'success' 
                  ? 'border-green-500 bg-green-100' 
                  : stepStatus[step.id] === 'error'
                  ? 'border-red-500 bg-red-100'
                  : isExecuting && currentStepIndex === workflowSteps.findIndex(s => s.id === step.id) 
                  ? 'border-green-500 bg-green-50' 
                  : step.isActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-100 hover:border-[var(--border)]'
              }`}
              style={{
                transform: draggingStep === step.id && dragPosition 
                  ? `translate3d(${dragPosition.x}px, ${dragPosition.y}px, 0)`
                  : `translate(${step.position.x}px, ${step.position.y}px)`,
                willChange: draggingStep === step.id ? 'transform' : 'auto',
                zIndex: draggingStep === step.id ? 1000 : 3,
                width: '200px',
                minHeight: '60px',
                pointerEvents: 'auto'
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
                  className={`absolute w-4 h-4 bg-[var(--background)] border border-[var(--border)] rounded-full flex items-center justify-center transition-all duration-150 hover:border-blue-400 ${
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
                  <svg className="w-2 h-2 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-medium border ${
                      stepStatus[step.id] === 'success'
                        ? 'bg-green-500 text-white border-green-500'
                        : stepStatus[step.id] === 'error'
                        ? 'bg-red-500 text-white border-red-500'
                        : isExecuting && currentStepIndex === workflowSteps.findIndex(s => s.id === step.id)
                        ? 'bg-green-500 text-white border-green-500'
                        : step.isActive 
                          ? 'bg-[var(--loading-bg)] text-gray-800 border-gray-800' 
                          : 'bg-[var(--background)] text-[var(--muted)] border-[var(--border)]'
                    }`}>
                      {workflowSteps.findIndex(s => s.id === step.id) + 1}
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                      step.id.includes('company-resolution') ? 'bg-blue-100 text-blue-700' :
                      step.id.includes('executive-discovery') ? 'bg-purple-100 text-purple-700' :
                      step.id.includes('contact-enrichment') ? 'bg-green-100 text-green-700' :
                      step.id.includes('verification') ? 'bg-yellow-100 text-yellow-700' :
                      step.id.includes('aggregation') ? 'bg-indigo-100 text-indigo-700' :
                      step.id.includes('tracking') ? 'bg-pink-100 text-pink-700' :
                      step.id.includes('storage') ? 'bg-[var(--hover)] text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {step.id.includes('company-resolution') ? 'Data' :
                       step.id.includes('executive-discovery') ? 'Research' :
                       step.id.includes('contact-enrichment') ? 'Enrichment' :
                       step.id.includes('verification') ? 'Verification' :
                       step.id.includes('aggregation') ? 'Aggregation' :
                       step.id.includes('tracking') ? 'Tracking' :
                       step.id.includes('storage') ? 'Storage' :
                       'Step'}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{step.title}</div>
                </div>
              </div>
              <div className="text-xs text-[var(--muted)] mt-1">{step.description}</div>
              
              {/* Key metrics */}
              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)]">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{step.id.includes('company-resolution') ? '30s' :
                         step.id.includes('executive-discovery') ? '2m' :
                         step.id.includes('contact-enrichment') ? '45s' :
                         step.id.includes('verification') ? '1m' :
                         step.id.includes('aggregation') ? '15s' :
                         step.id.includes('tracking') ? '10s' :
                         step.id.includes('storage') ? '5s' : '30s'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>{step.id.includes('company-resolution') ? '$0.05' :
                         step.id.includes('executive-discovery') ? '$0.25' :
                         step.id.includes('contact-enrichment') ? '$0.15' :
                         step.id.includes('verification') ? '$0.20' :
                         step.id.includes('aggregation') ? '$0.02' :
                         step.id.includes('tracking') ? '$0.01' :
                         step.id.includes('storage') ? '$0.01' : '$0.05'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{step.id.includes('company-resolution') ? '95%' :
                         step.id.includes('executive-discovery') ? '85%' :
                         step.id.includes('contact-enrichment') ? '90%' :
                         step.id.includes('verification') ? '88%' :
                         step.id.includes('aggregation') ? '98%' :
                         step.id.includes('tracking') ? '99%' :
                         step.id.includes('storage') ? '100%' : '95%'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
