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

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onMouseLeave={() => setContextMenu(null)}
    >
      <button
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => {
          const step = workflowSteps.find(s => s.id === contextMenu.stepId);
          if (step) setSelectedStep(step);
          setContextMenu(null);
        }}
      >
        Edit
      </button>
      <button
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => {
          const step = workflowSteps.find(s => s.id === contextMenu.stepId);
          if (step) {
            const newStep = {
              ...step,
              id: `${step.id}-copy-${Date.now()}`,
              position: { x: step.position.x + 20, y: step.position.y + 20 }
            };
            setWorkflowSteps(prev => [...prev, newStep]);
          }
          setContextMenu(null);
        }}
      >
        Duplicate
      </button>
      <button
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
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
