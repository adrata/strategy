import { useState, useCallback, useEffect } from 'react';
import { IntegrationNode } from '../types/integration';

export function useIntegrationDrag(
  nodes: IntegrationNode[],
  setNodes: (nodes: IntegrationNode[]) => void,
  activeTool: 'cursor' | 'hand'
) {
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (activeTool !== 'cursor') return;

      e.stopPropagation();
      setDraggingNode(nodeId);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [activeTool]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingNode || !dragStart) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setNodes(
        nodes.map((node) =>
          node.id === draggingNode
            ? {
                ...node,
                position: {
                  x: node.position.x + dx,
                  y: node.position.y + dy,
                },
              }
            : node
        )
      );

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [draggingNode, dragStart, nodes, setNodes]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
    setDragStart(null);
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

  return {
    draggingNode,
    handleNodeMouseDown,
  };
}

