import { useState, useRef, useCallback } from 'react';
import { WorkflowStep, DragState, ActiveTool } from '../types';

export const useDrag = (
  workflowSteps: WorkflowStep[],
  setWorkflowSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>,
  activeTool: ActiveTool,
  saveToHistory: () => void
) => {
  const [draggingStep, setDraggingStep] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const handleStepMouseDown = useCallback((e: React.MouseEvent, stepId: string) => {
    if (activeTool === 'hand') {
      e.preventDefault();
      e.stopPropagation();
      
      setDraggingStep(stepId);
      const step = workflowSteps.find(s => s.id === stepId);
      if (!step) return;
      
      // Calculate offset from mouse to widget center for smooth dragging
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      dragStateRef.current = {
        stepId,
        startX: offsetX,
        startY: offsetY,
        rect
      };
      
      const handleMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        mouseEvent.preventDefault();
        if (!dragStateRef.current) return;
        
        const { startX, startY } = dragStateRef.current;
        const headerHeight = 60;
        const minY = headerHeight + 10; // 10px padding below header
        const newX = Math.max(0, mouseEvent.clientX - startX);
        const newY = Math.max(minY, mouseEvent.clientY - startY);
        
        // Update drag position for CSS transform (no re-renders!)
        setDragPosition({ x: newX, y: newY });
      };

      const handleMouseUp = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        mouseEvent.preventDefault();
        
        if (dragStateRef.current && dragPosition) {
          // Only update state on mouseup (final position)
          const { stepId: currentStepId } = dragStateRef.current;
          setWorkflowSteps(prev => prev.map(s => 
            s.id === currentStepId 
              ? { ...s, position: { x: dragPosition.x, y: dragPosition.y } }
              : s
          ));
        }
        
        setDraggingStep(null);
        setDragPosition(null);
        dragStateRef.current = null;
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // Save to history after drag ends
        setTimeout(() => saveToHistory(), 0);
      };

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [activeTool, workflowSteps, setWorkflowSteps, saveToHistory, dragPosition]);

  return {
    draggingStep,
    dragPosition,
    handleStepMouseDown
  };
};
