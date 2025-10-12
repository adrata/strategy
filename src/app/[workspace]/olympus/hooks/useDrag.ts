import { useState, useRef, useCallback } from 'react';
import { WorkflowStep, DragState, ActiveTool } from '../types';

export const useDrag = (
  workflowSteps: WorkflowStep[],
  setWorkflowSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>,
  activeTool: ActiveTool,
  saveToHistory: () => void,
  zoom: number = 1,
  pan: { x: number; y: number } = { x: 0, y: 0 }
) => {
  const [draggingStep, setDraggingStep] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const handleStepMouseDown = useCallback((e: React.MouseEvent, stepId: string) => {
    // Handle both cursor and hand tools for step dragging
    if (activeTool === 'cursor' || activeTool === 'hand') {
      e.preventDefault();
      e.stopPropagation();
      
      setDraggingStep(stepId);
      const step = workflowSteps.find(s => s.id === stepId);
      if (!step) return;
      
      // Calculate offset from mouse to widget center for smooth dragging
      const rect = e.currentTarget.getBoundingClientRect();
      // Convert offset to canvas coordinates by dividing by zoom
      const offsetX = (e.clientX - rect.left) / zoom;
      const offsetY = (e.clientY - rect.top) / zoom;
      
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
        
        const { startX, startY, stepId } = dragStateRef.current;
        const step = workflowSteps.find(s => s.id === stepId);
        if (!step) return;
        
        // Get the canvas container
        const canvasContainer = document.querySelector('[data-canvas-container="true"]');
        if (!canvasContainer) return;
        
        const canvasRect = canvasContainer.getBoundingClientRect();
        
        // Calculate the mouse position relative to the canvas, accounting for zoom and pan
        const mouseX = (mouseEvent.clientX - canvasRect.left - pan.x) / zoom;
        const mouseY = (mouseEvent.clientY - canvasRect.top - pan.y) / zoom;
        
        // Calculate new position using step's current position as base and adding mouse delta
        const newX = step.position.x + (mouseX - (step.position.x + startX));
        const newY = step.position.y + (mouseY - (step.position.y + startY));
        
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
  }, [activeTool, workflowSteps, setWorkflowSteps, saveToHistory, dragPosition, zoom, pan]);

  return {
    draggingStep,
    dragPosition,
    handleStepMouseDown
  };
};
