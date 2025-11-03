"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { OasisMiddlePanel } from "./OasisMiddlePanel";
import { OasisRightPanel } from "./OasisRightPanel";

export function OasisContainer() {
  const [activeSection, setActiveSection] = useState('channels');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  // High-performance drag state management
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  
  // Performance-optimized panel width management
  const rightPanelWidthRef = useRef<number>(320); // Default width in pixels
  const rafIdRef = useRef<number | null>(null);
  const containerDimensionsRef = useRef<{ width: number } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved panel width from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("oasis-panel-width");
      if (saved) {
        const width = parseInt(saved, 10);
        if (width >= 200 && width <= 600) { // Reasonable bounds
          rightPanelWidthRef.current = width;
        }
      }
    }
  }, []);

  // Cache container dimensions to avoid repeated getBoundingClientRect calls
  const updateContainerDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    containerDimensionsRef.current = {
      width: containerRect.width
    };
  }, []);

  // High-performance drag handlers using requestAnimationFrame
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Cache container dimensions once at start
    updateContainerDimensions();
    
    // Store initial mouse position and panel width for cursor tracking
    const startMouseX = e.clientX;
    const startPanelWidth = rightPanelWidthRef.current;
    
    // Calculate the offset of the mouse from the divider position
    const containerRect = containerRef.current!.getBoundingClientRect();
    const dividerX = containerRect.left + containerRect.width - startPanelWidth;
    const mouseOffsetFromDivider = startMouseX - dividerX;
    
    setDragging(true);
    document.body.classList.add("dragging-panel-divider");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    
    // Disable pointer events on panel content during drag for better performance
    if (rightPanelRef.current) {
      rightPanelRef.current.style.pointerEvents = "none";
    }
    
    // Store drag start data for cursor tracking
    const dragStartData = { 
      startMouseX, 
      startPanelWidth, 
      mouseOffsetFromDivider,
      containerRect
    };
    (window as any).__oasisDragStart = dragStartData;
  }, [updateContainerDimensions]);

  const endDrag = useCallback(() => {
    setDragging(false);
    document.body.classList.remove("dragging-panel-divider");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    
    // Re-enable pointer events
    if (rightPanelRef.current) {
      rightPanelRef.current.style.pointerEvents = "";
    }
    
    // Cancel any pending animation frame
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    // Clean up drag start data
    delete (window as any).__oasisDragStart;
    
    // Save final position to localStorage
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("oasis-panel-width", rightPanelWidthRef.current.toString());
    }
  }, [isHydrated]);

  useEffect(() => {
    if (!dragging) {
      endDrag();
      return;
    }

    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      
      // Cancel previous frame if not processed yet
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Schedule update for next frame (60fps max)
      rafIdRef.current = requestAnimationFrame(() => {
        const dragStartData = (window as any).__oasisDragStart;
        if (!dragStartData) return;
        
        // Use cached container data from drag start
        const { containerRect, mouseOffsetFromDivider } = dragStartData;
        
        // Calculate new divider position based on mouse position minus the offset
        const newDividerX = e.clientX - mouseOffsetFromDivider;
        const newWidth = Math.max(200, Math.min(600, containerRect.left + containerRect.width - newDividerX));
        
        // Update ref (no re-render)
        rightPanelWidthRef.current = newWidth;
        
        // Apply via CSS width for smooth resizing
        if (rightPanelRef.current) {
          rightPanelRef.current.style.width = `${newWidth}px`;
        }
      });
    };

    const onUp = (e: MouseEvent) => {
      e.preventDefault();
      endDrag();
    };

    // Use passive listeners for better performance
    document.addEventListener("mousemove", onMove, { capture: true, passive: false });
    document.addEventListener("mouseup", onUp, { capture: true, passive: false });
    
    return () => {
      document.removeEventListener("mousemove", onMove, { capture: true });
      document.removeEventListener("mouseup", onUp, { capture: true });
      endDrag();
    };
  }, [dragging, endDrag]);

  // Handle section changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSelectedChannel(null);
    setShowRightPanel(false);
  };

  // Handle channel selection
  const handleChannelSelect = (channel: any) => {
    setSelectedChannel(channel);
    setShowRightPanel(true);
  };

  // Handle right panel close
  const handleCloseRightPanel = () => {
    setShowRightPanel(false);
  };

  const dividerLineColor = dragging ? "var(--accent)" : hovering ? "var(--muted)" : "var(--border)";

  return (
    <div ref={containerRef} className="flex h-full relative">
      {/* Middle Panel */}
      <div className="flex-1 min-w-0">
        <OasisMiddlePanel
          activeSection={activeSection}
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          isLoading={false}
        />
      </div>

      {/* Draggable Divider */}
      {showRightPanel && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: rightPanelWidthRef.current,
            width: 8,
            height: "100%",
            cursor: "col-resize",
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            pointerEvents: "auto",
          }}
          onMouseDown={startDrag}
          onDoubleClick={() => {
            const defaultWidth = 320;
            rightPanelWidthRef.current = defaultWidth;
            if (rightPanelRef.current) {
              rightPanelRef.current.style.width = `${defaultWidth}px`;
            }
            if (isHydrated && typeof window !== "undefined") {
              localStorage.setItem("oasis-panel-width", defaultWidth.toString());
            }
          }}
          onMouseEnter={() => {
            setHovering(true);
            document.body.style.cursor = "col-resize";
          }}
          onMouseLeave={() => {
            setHovering(false);
            if (!dragging) {
              document.body.style.cursor = "";
            }
          }}
        >
          <div
            style={{
              width: 1,
              height: "100%",
              background: dividerLineColor,
              transition: "background 0.15s",
            }}
          />
        </div>
      )}

      {/* Right Panel */}
      {showRightPanel && (
        <div
          ref={rightPanelRef}
          style={{
            width: `${rightPanelWidthRef.current}px`,
            minWidth: 200,
            maxWidth: 600,
            height: "100%",
            willChange: dragging ? "width" : "auto", // GPU acceleration during drag
          }}
          className="flex-shrink-0"
        >
          <OasisRightPanel
            selectedChannel={selectedChannel}
            onClose={handleCloseRightPanel}
          />
        </div>
      )}
    </div>
  );
}