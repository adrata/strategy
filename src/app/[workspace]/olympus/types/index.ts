export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  position: { x: number; y: number };
  isActive: boolean;
}

export interface WorkflowConnection {
  from: string;
  to: string;
  fromSide: string;
  toSide: string;
}

export interface DragState {
  stepId: string;
  startX: number;
  startY: number;
  rect: DOMRect;
}

export interface ContextMenuState {
  x: number;
  y: number;
  stepId: string;
}

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorkflowCategory {
  category: string;
  color: string;
  items: WorkflowItem[];
}

export interface WorkflowItem {
  id: string;
  title: string;
  description: string;
}

export type ActiveTool = 'cursor' | 'hand';
