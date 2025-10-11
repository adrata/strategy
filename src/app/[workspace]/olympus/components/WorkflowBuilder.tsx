"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { WorkflowNode, WorkflowConnection, WorkflowBuilderState, CFO_CRO_PIPELINE_STEPS } from "../types/workflow";

interface WorkflowBuilderProps {
  onExecute?: (workflow: { nodes: WorkflowNode[]; connections: WorkflowConnection[] }) => void;
}

export default function WorkflowBuilder({ onExecute }: WorkflowBuilderProps) {
  const [state, setState] = useState<WorkflowBuilderState>({
    nodes: [],
    connections: [],
    isExecuting: false,
    zoom: 1,
    pan: { x: 0, y: 0 }
  });

  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize with CFO/CRO pipeline
  useEffect(() => {
    const initialNodes: WorkflowNode[] = CFO_CRO_PIPELINE_STEPS.map((step, index) => ({
      id: step.id,
      type: index === 0 ? 'start' : index === CFO_CRO_PIPELINE_STEPS.length - 1 ? 'end' : 'process',
      title: step.name,
      description: step.description,
      position: { x: 100, y: 100 + (index * 120) },
      status: 'pending',
      config: { step },
      inputs: index > 0 ? [CFO_CRO_PIPELINE_STEPS[index - 1].id] : [],
      outputs: index < CFO_CRO_PIPELINE_STEPS.length - 1 ? [CFO_CRO_PIPELINE_STEPS[index + 1].id] : []
    }));

    const initialConnections: WorkflowConnection[] = CFO_CRO_PIPELINE_STEPS.slice(0, -1).map((step, index) => ({
      id: `conn-${step.id}-${CFO_CRO_PIPELINE_STEPS[index + 1].id}`,
      sourceId: step.id,
      targetId: CFO_CRO_PIPELINE_STEPS[index + 1].id,
      type: 'success'
    }));

    setState(prev => ({
      ...prev,
      nodes: initialNodes,
      connections: initialConnections
    }));
  }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingNode(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.position.x,
      y: e.clientY - rect.top - node.position.y
    });
  }, [state.nodes]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingNode) return;

    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === draggingNode 
          ? { 
              ...node, 
              position: { 
                x: e.clientX - dragOffset.x, 
                y: e.clientY - dragOffset.y 
              } 
            }
          : node
      )
    }));
  }, [draggingNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  useEffect(() => {
    if (draggingNode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingNode, handleMouseMove, handleMouseUp]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, state.zoom * delta));
    setState(prev => ({ ...prev, zoom: newZoom }));
  }, [state.zoom]);

  const getNodeColor = (node: WorkflowNode) => {
    switch (node.status) {
      case 'running': return 'bg-blue-500 border-blue-600';
      case 'completed': return 'bg-green-500 border-green-600';
      case 'error': return 'bg-red-500 border-red-600';
      case 'skipped': return 'bg-gray-400 border-gray-500';
      default: return 'bg-[var(--background)] border-[var(--border)]';
    }
  };

  const getNodeIcon = (node: WorkflowNode) => {
    switch (node.type) {
      case 'start': return '▶️';
      case 'end': return '🏁';
      case 'process': return '⚙️';
      case 'decision': return '💎';
      case 'parallel': return '⚡';
      case 'merge': return '🔗';
      default: return '📦';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--panel-background)]">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">CFO/CRO Discovery Pipeline</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted)]">Nodes: {state.nodes.length}</span>
            <span className="text-sm text-[var(--muted)]">Connections: {state.connections.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExecute?.({ nodes: state.nodes, connections: state.connections })}
            disabled={state.isExecuting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.isExecuting ? 'Executing...' : 'Execute Pipeline'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-[var(--panel-background)]"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
        onWheel={handleWheel}
      >
        <div 
          className="relative w-full h-full"
          style={{
            transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            {state.connections.map((connection) => {
              const sourceNode = state.nodes.find(n => n.id === connection.sourceId);
              const targetNode = state.nodes.find(n => n.id === connection.targetId);
              
              if (!sourceNode || !targetNode) return null;

              const startX = sourceNode.position.x + 120;
              const startY = sourceNode.position.y + 30;
              const endX = targetNode.position.x;
              const endY = targetNode.position.y + 30;

              const distance = Math.abs(endX - startX);
              const controlOffset = Math.min(distance / 3, 50);
              const controlX1 = startX + controlOffset;
              const controlX2 = endX - controlOffset;

              return (
                <path
                  key={connection.id}
                  d={`M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`}
                  stroke={connection.type === 'error' ? '#ef4444' : '#6b7280'}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={connection.type === 'failure' ? '5,5' : '0'}
                />
              );
            })}
          </svg>

          {/* Workflow Nodes */}
          {state.nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute w-60 p-4 border-2 rounded-lg shadow-sm cursor-move transition-all ${
                getNodeColor(node)
              } ${draggingNode === node.id ? 'scale-105 shadow-lg' : ''}`}
              style={{
                transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                zIndex: draggingNode === node.id ? 10 : 2
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{getNodeIcon(node)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-[var(--foreground)]">{node.title}</h3>
                  <p className="text-xs text-[var(--muted)] mt-1">{node.description}</p>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    node.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    node.status === 'completed' ? 'bg-green-500' :
                    node.status === 'error' ? 'bg-red-500' :
                    'bg-gray-300'
                  }`}></div>
                  <span className="text-xs text-[var(--muted)] capitalize">{node.status}</span>
                </div>
                
                {/* Cost and Time */}
                {node.cost !== undefined && (
                  <div className="text-xs text-[var(--muted)]">
                    ${node.cost.toFixed(2)}
                  </div>
                )}
                {node.executionTime !== undefined && (
                  <div className="text-xs text-[var(--muted)]">
                    {node.executionTime}ms
                  </div>
                )}
              </div>

              {/* Error Message */}
              {node.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {node.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--panel-background)] text-sm text-[var(--muted)]">
        <div className="flex items-center gap-4">
          <span>Zoom: {Math.round(state.zoom * 100)}%</span>
          <span>Pan: ({Math.round(state.pan.x)}, {Math.round(state.pan.y)})</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Total Cost: $0.50</span>
          <span>Success Rate: 85%</span>
          <span>Execution Time: 2.5min</span>
        </div>
      </div>
    </div>
  );
}
