import { useState, useCallback, useRef } from 'react';

export const useZoomPan = (activeTool: 'cursor' | 'hand') => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingBackground, setIsDraggingBackground] = useState(false);
  const [tempPan, setTempPan] = useState<{ x: number; y: number } | null>(null);
  
  // Use refs to avoid stale closures
  const rafIdRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  }, []);

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow dragging when hand tool is active
    if (activeTool === 'hand' && e.target === e.currentTarget) {
      setIsDraggingBackground(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [activeTool, pan]);

  const handleBackgroundMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingBackground && dragStartRef.current) {
      // Cancel previous frame if not processed yet
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Schedule update for next frame (60fps max)
      rafIdRef.current = requestAnimationFrame(() => {
        if (!dragStartRef.current) return;
        
        const newPan = {
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y
        };
        // Use temp pan for CSS transform (no re-renders during drag)
        setTempPan(newPan);
      });
    }
  }, [isDraggingBackground]);

  const handleBackgroundMouseUp = useCallback(() => {
    if (tempPan) {
      // Only update actual pan state on mouseup
      setPan(tempPan);
    }
    setIsDraggingBackground(false);
    setTempPan(null);
    dragStartRef.current = null;
    
    // Cancel any pending animation frame
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, [tempPan]);

  return {
    zoom,
    pan: tempPan || pan, // Use temp pan during drag, actual pan otherwise
    isDraggingBackground,
    handleWheel,
    handleBackgroundMouseDown,
    handleBackgroundMouseMove,
    handleBackgroundMouseUp
  };
};
