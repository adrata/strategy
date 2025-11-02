import React from 'react';
import { ContextMenuState, WorkflowStep } from '../types';

interface ContextMenuProps {
  contextMenu: ContextMenuState | null;
  workflowSteps: WorkflowStep[];
  setContextMenu: (menu: ContextMenuState | null) => void;
  setSelectedStep: (step: WorkflowStep | null) => void;
  setWorkflowSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  workflowSteps,
  setContextMenu,
  setSelectedStep,
  setWorkflowSteps
}) => {
  if (!contextMenu) return null;

  const findOpenSpace = (originalStep: WorkflowStep) => {
    const stepWidth = 200;
    const stepHeight = 120;
    const padding = 20;
    
    // Try positions in a grid pattern
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 5; col++) {
        const x = 100 + (col * (stepWidth + padding));
        const y = 100 + (row * (stepHeight + padding));
        
        // Check if this position conflicts with existing steps
        const hasConflict = workflowSteps.some(step => {
          const dx = Math.abs(step.position.x - x);
          const dy = Math.abs(step.position.y - y);
          return dx < stepWidth + padding && dy < stepHeight + padding;
        });
        
        if (!hasConflict) {
          return { x, y };
        }
      }
    }
    
    // Fallback: place to the right of the original
    return { x: originalStep.position.x + 250, y: originalStep.position.y };
  };

  return (
    <div
      className="fixed bg-background border border-border rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onMouseLeave={() => setContextMenu(null)}
    >
      <button
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-hover"
        onClick={() => {
          const step = workflowSteps.find(s => s.id === contextMenu.stepId);
          if (step) {
            const openSpace = findOpenSpace(step);
            const newStep = {
              ...step,
              id: `${step.id}-copy-${Date.now()}`,
              position: openSpace,
              isActive: false
            };
            setWorkflowSteps(prev => [...prev, newStep]);
          }
          setContextMenu(null);
        }}
      >
        Duplicate
      </button>
      <button
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-hover"
        onClick={() => {
          const step = workflowSteps.find(s => s.id === contextMenu.stepId);
          if (step) {
            const newStep = {
              ...step,
              id: `${step.id}-${Date.now()}`,
              title: `${step.title} (Copy)`,
              position: findOpenSpace(step),
              isActive: false
            };
            setWorkflowSteps(prev => [...prev, newStep]);
          }
          setContextMenu(null);
        }}
      >
        Clone
      </button>
      <div className="border-t border-gray-100 my-1"></div>
      <button
        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
        onClick={() => {
          setWorkflowSteps(prev => prev.filter(s => s.id !== contextMenu.stepId));
          setContextMenu(null);
        }}
      >
        Delete
      </button>
    </div>
  );
};
