import { useState, useCallback } from 'react';

export const useZoomPan = () => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingBackground, setIsDraggingBackground] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  }, []);

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDraggingBackground(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleBackgroundMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingBackground) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDraggingBackground, dragStart]);

  const handleBackgroundMouseUp = useCallback(() => {
    setIsDraggingBackground(false);
  }, []);

  return {
    zoom,
    pan,
    isDraggingBackground,
    handleWheel,
    handleBackgroundMouseDown,
    handleBackgroundMouseMove,
    handleBackgroundMouseUp
  };
};
