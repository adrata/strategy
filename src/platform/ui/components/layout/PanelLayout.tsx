import React, { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";

export function PanelLayout({
  thinLeftPanel,
  leftPanel,
  middlePanel,
  rightPanel,
  zoom = 100,
  isLeftPanelVisible = true,
  isRightPanelVisible = true,
  accentColor,
  onToggleRightPanel,
  onToggleLeftPanel,
}: {
  thinLeftPanel?: React.ReactNode;
  leftPanel: React.ReactNode;
  middlePanel: React.ReactNode;
  rightPanel: React.ReactNode;
  zoom?: number;
  isLeftPanelVisible?: boolean;
  isRightPanelVisible?: boolean;
  accentColor?: string;
  onToggleRightPanel?: () => void;
  onToggleLeftPanel?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  
  // Performance-optimized panel width management
  const rightPanelWidthRef = useRef<number>(0.35); // Store width in ref (no re-renders)
  const rafIdRef = useRef<number | null>(null);
  const containerDimensionsRef = useRef<{ width: number; leftPanelWidth: number } | null>(null);
  
  // Fix hydration issue: always start with the same value on server and client  
  const [rightPanelFlex, setRightPanelFlex] = useState(0.35); // Only for initial render and localStorage
  const [isHydrated, setIsHydrated] = useState(false);

  const router = useRouter();
  const { isDesktop } = useUnifiedAuth();

  // Load saved panel ratio from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adrata-panel-ratio");
      if (saved) {
        setRightPanelFlex(parseFloat(saved));
      }
    }
  }, []);

  // Save panel ratio to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("adrata-panel-ratio", rightPanelFlex.toString());
    }
  }, [rightPanelFlex, isHydrated]);

  // Divider logic: always a 1px line, 100% height, with a wider responsive hit area
  const dividerHitArea = 8; // Reduced for more precise cursor alignment
  const dividerLineWidth = 1;
  const dividerLineColor =
    dragging ? "#3B82F6" : hovering ? "#6B7280" : "var(--border)"; // Blue when dragging, gray when hovering

  // Cache container dimensions to avoid repeated getBoundingClientRect calls
  const updateContainerDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const leftPanelWidth = isLeftPanelVisible ? 224.357 : 0;
    containerDimensionsRef.current = {
      width: containerRect.width,
      leftPanelWidth
    };
  }, [isLeftPanelVisible]);

  // High-performance drag handlers using requestAnimationFrame and CSS transforms
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
    const leftPanelWidth = isLeftPanelVisible ? 224.357 : 0;
    const availableWidth = containerRect.width - leftPanelWidth;
    const currentRightPanelWidth = availableWidth * (startPanelWidth / (1 + startPanelWidth));
    const dividerX = containerRect.left + leftPanelWidth + (availableWidth - currentRightPanelWidth);
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
      containerRect,
      leftPanelWidth,
      availableWidth
    };
    (window as any).__panelDragStart = dragStartData;
  }, [updateContainerDimensions, isLeftPanelVisible]);

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
    delete (window as any).__panelDragStart;
    
    // Save final position to localStorage
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("adrata-panel-ratio", rightPanelWidthRef.current.toString());
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
        const dragStartData = (window as any).__panelDragStart;
        if (!dragStartData) return;
        
        // Use cached container data from drag start
        const { containerRect, leftPanelWidth, availableWidth, mouseOffsetFromDivider } = dragStartData;
        
        // Calculate new divider position based on mouse position minus the offset
        const newDividerX = e.clientX - mouseOffsetFromDivider;
        const newDividerXRelative = newDividerX - containerRect.left - leftPanelWidth;
        
        // Calculate mouse ratio based on new divider position
        const mouseRatio = Math.max(0, Math.min(1, newDividerXRelative / availableWidth));
        
        // Calculate right panel flex more smoothly
        const rightPanelRatio = Math.max(0.1, Math.min(0.9, 1 - mouseRatio));
        const newRightFlex = Math.max(0.2, Math.min(1.8, rightPanelRatio * 2));
        
        // Update ref (no re-render)
        rightPanelWidthRef.current = newRightFlex;
        
        // Apply via CSS transform for GPU acceleration
        if (rightPanelRef.current) {
          const currentFlex = rightPanelWidthRef.current;
          rightPanelRef.current.style.flex = currentFlex.toString();
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

  // Global keyboard shortcuts (zoom handled by ZoomProvider)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + L: Toggle right panel (AI chat)
      if ((e.metaKey || e.ctrlKey) && e['key'] === "l") {
        e.preventDefault();
        if (onToggleRightPanel) {
          onToggleRightPanel();
        }
      }

      // Command/Ctrl + Shift + E: Toggle left panel (updated to avoid conflicts)
      if ((e.metaKey || e.ctrlKey) && e['shiftKey'] && (e['key'] === "e" || e['key'] === "E")) {
        const target = e.target as HTMLElement;
        const isInput =
          target['tagName'] === "INPUT" ||
          target['tagName'] === "TEXTAREA" ||
          target.isContentEditable;
        if (!isInput && onToggleLeftPanel) {
          e.preventDefault();
          onToggleLeftPanel();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onToggleRightPanel, onToggleLeftPanel]);

  useEffect(() => {
    const handleGlobalAppSwitch = (e: KeyboardEvent) => {
      // REMOVED: CMD+1-9 shortcuts to avoid conflict with browser tab switching
      // Users should use CMD+K command palette or navigation menu instead
      // Cmd+, for profile settings
      if ((e.metaKey || e.ctrlKey) && e['key'] === ",") {
        e.preventDefault();
        // In desktop mode, redirect to home since profile route doesn't exist
        if (isDesktop) {
          console.log(
            "🖥️ PanelLayout: Desktop mode detected, redirecting to home instead of /profile",
          );
          router.push("/");
        } else {
          router.push("/profile");
        }
      }
      // Cmd+Shift+G for Grand Central (changed to avoid conflict with Speedrun)
      if ((e.metaKey || e.ctrlKey) && e['shiftKey'] && e['key'] === "g") {
        e.preventDefault();
        console.log(
          "🏢 PanelLayout: Grand Central keyboard shortcut triggered",
        );
        router.push("./grand-central/dashboard");
      }
      
      // Command/Ctrl + I: Signal popup (global demo trigger)
      if ((e.metaKey || e.ctrlKey) && e['key'] === "i") {
        const target = e.target as HTMLElement;
        const isInput =
          target['tagName'] === "INPUT" ||
          target['tagName'] === "TEXTAREA" ||
          target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          // Dispatch a custom event that signal components can listen for
          window.dispatchEvent(new CustomEvent('adrata-signal-popup', {
            detail: {
              type: 'BUYING_INTENT_DETECTED',
              priority: 'HIGH',
              contact: {
                id: 'demo-signal-' + Date.now(),
                name: 'Sarah Mitchell',
                company: 'Retail Solutions Inc',
                type: 'prospect'
              },
              note: {
                title: 'Strong Buying Intent',
                content: 'Looking to purchase a solution soon - budget approved!',
                source: 'demo_trigger'
              }
            }
          }));
          console.log('🚨 Global signal popup triggered with Cmd+I from PanelLayout');
        }
      }
    };
    window.addEventListener("keydown", handleGlobalAppSwitch);
    return () => window.removeEventListener("keydown", handleGlobalAppSwitch);
  }, [router, isDesktop]);

  return (
    <div
      className="w-full h-screen overflow-hidden bg-[var(--background)]"
      style={{ position: "relative" }}
    >
      <div ref={containerRef} className="flex h-full w-full relative">
        {/* Thin Left Panel */}
        {thinLeftPanel && (
          <div
            className="h-full"
            style={{ width: 60, minWidth: 60, maxWidth: 60 }}
          >
            {thinLeftPanel}
          </div>
        )}
        {/* Left Panel */}
        {isLeftPanelVisible && (
          <div key="left-panel-container" className="h-full">
            {leftPanel}
          </div>
        )}
        {/* Middle Panel */}
        <div
          className="relative min-w-0 bg-[var(--background)] h-full pb-6 overflow-hidden"
          style={{
            flex: isRightPanelVisible ? 1 : "1 1 0%",
            background: "var(--background)",
          }}
        >
          {middlePanel}
          {/* Draggable Divider */}
          {isRightPanelVisible && (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: -(dividerHitArea / 2),
                width: dividerHitArea,
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
                const defaultFlex = 0.35;
                rightPanelWidthRef.current = defaultFlex;
                setRightPanelFlex(defaultFlex);
                if (rightPanelRef.current) {
                  rightPanelRef.current.style.flex = defaultFlex.toString();
                }
              }} // Reset to default ratio on double-click
              onMouseEnter={() => {
                setHovering(true);
                // Immediate cursor feedback
                document.body['style']['cursor'] = "col-resize";
              }}
              onMouseLeave={() => {
                setHovering(false);
                // Reset cursor if not dragging
                if (!dragging) {
                  document.body['style']['cursor'] = "";
                }
              }}
            >
              <div
                style={{
                  width: dividerLineWidth,
                  height: "100%",
                  background: dividerLineColor,
                  transition: "background 0.15s",
                }}
              />
            </div>
          )}
        </div>
        {/* Right Panel */}
        {isRightPanelVisible && (
          <div
            ref={rightPanelRef}
            style={{
              flex: rightPanelFlex,
              minWidth: 0,
              height: "100%",
              overflow: "hidden",
              background: "var(--background)",
              willChange: dragging ? "flex" : "auto", // GPU acceleration during drag
            }}
            className="flex flex-col h-full"
          >
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}
