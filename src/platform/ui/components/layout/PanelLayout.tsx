import React, { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";

export function PanelLayout({
  thinLeftPanel,
  leftPanel,
  middlePanel,
  rightPanel,
  profilePanel,
  isProfilePanelVisible = false,
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
  profilePanel?: React.ReactNode;
  isProfilePanelVisible?: boolean;
  zoom?: number;
  isLeftPanelVisible?: boolean;
  isRightPanelVisible?: boolean;
  accentColor?: string;
  onToggleRightPanel?: () => void;
  onToggleLeftPanel?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [leftDragging, setLeftDragging] = useState(false);
  const [leftHovering, setLeftHovering] = useState(false);
  
  // Performance-optimized panel width management
  const rightPanelWidthRef = useRef<number>(0.35); // Store width in ref (no re-renders)
  const leftPanelWidthRef = useRef<number>(209.357); // Default width ~13.085rem in pixels
  const rafIdRef = useRef<number | null>(null);
  const leftRafIdRef = useRef<number | null>(null);
  const containerDimensionsRef = useRef<{ width: number; leftPanelWidth: number } | null>(null);
  
  // Visual enhancement state
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentWidthPercent, setCurrentWidthPercent] = useState(35);
  const [currentLeftWidth, setCurrentLeftWidth] = useState(209);
  
  // Fix hydration issue: always start with the same value on server and client  
  const [rightPanelFlex, setRightPanelFlex] = useState(0.35); // Only for initial render and localStorage
  const [leftPanelWidth, setLeftPanelWidth] = useState(209.357); // Default width in pixels
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
      const savedLeft = localStorage.getItem("adrata-left-panel-width");
      if (savedLeft) {
        const width = parseFloat(savedLeft);
        setLeftPanelWidth(width);
        leftPanelWidthRef.current = width;
      }
    }
  }, []);

  // Save panel ratio to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("adrata-panel-ratio", rightPanelFlex.toString());
    }
  }, [rightPanelFlex, isHydrated]);

  // Save left panel width to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("adrata-left-panel-width", leftPanelWidth.toString());
    }
  }, [leftPanelWidth, isHydrated]);

  // Divider logic: always a 1px line, 100% height, with a wider responsive hit area
  const dividerHitArea = 8; // Reduced for more precise cursor alignment
  const dividerLineWidth = 1;
  const dividerLineColor = dragging ? "#3B82F6" : hovering ? "#6B7280" : "#e5e7eb";
  
  // Simple divider styles without visual effects
  const dividerStyle = {
    position: "absolute" as const,
    top: 0,
    right: 0,
    width: dividerHitArea,
    height: "100%",
    cursor: "col-resize",
    zIndex: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    background: "transparent",
    pointerEvents: "auto" as const,
  };

  // Cache container dimensions to avoid repeated getBoundingClientRect calls
  const updateContainerDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentLeftWidth = isLeftPanelVisible ? leftPanelWidthRef.current : 0;
    containerDimensionsRef.current = {
      width: containerRect.width,
      leftPanelWidth: currentLeftWidth
    };
  }, [isLeftPanelVisible]);

  // Left panel drag handlers
  const startLeftDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const isTouch = 'touches' in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    
    const startMouseX = clientX;
    const startPanelWidth = leftPanelWidthRef.current;
    
    setLeftDragging(true);
    document.body.classList.add("dragging-panel-divider");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    
    if (leftPanelRef.current) {
      leftPanelRef.current.style.pointerEvents = "none";
    }
    
    const leftDragStartData = {
      startMouseX,
      startPanelWidth,
      containerRect,
      isTouch
    };
    (window as any).__leftPanelDragStart = leftDragStartData;
  }, []);

  const endLeftDrag = useCallback(() => {
    setLeftDragging(false);
    document.body.classList.remove("dragging-panel-divider");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    
    if (leftPanelRef.current) {
      leftPanelRef.current.style.pointerEvents = "";
    }
    
    if (leftRafIdRef.current) {
      cancelAnimationFrame(leftRafIdRef.current);
      leftRafIdRef.current = null;
    }
    
    delete (window as any).__leftPanelDragStart;
    
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("adrata-left-panel-width", leftPanelWidthRef.current.toString());
    }
  }, [isHydrated]);

  // High-performance drag handlers using requestAnimationFrame and CSS transforms
  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Cache container dimensions once at start
    updateContainerDimensions();
    
    // Handle both mouse and touch events
    const isTouch = 'touches' in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    
    // Store initial position and panel width for cursor tracking
    const startMouseX = clientX;
    const startPanelWidth = rightPanelWidthRef.current;
    
    // Calculate the offset of the pointer from the divider position
    const containerRect = containerRef.current!.getBoundingClientRect();
    const currentLeftWidth = isLeftPanelVisible ? leftPanelWidthRef.current : 0;
    const availableWidth = containerRect.width - currentLeftWidth;
    const currentRightPanelWidth = availableWidth * (startPanelWidth / (1 + startPanelWidth));
    const dividerX = containerRect.left + currentLeftWidth + (availableWidth - currentRightPanelWidth);
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
      leftPanelWidth: currentLeftWidth,
      availableWidth,
      isTouch
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
    
    // Add smooth easing animation on release
    setIsAnimating(true);
    if (rightPanelRef.current) {
      rightPanelRef.current.style.transition = "flex 0.2s cubic-bezier(0.4, 0, 0.2, 1)";
      setTimeout(() => {
        if (rightPanelRef.current) {
          rightPanelRef.current.style.transition = "";
        }
        setIsAnimating(false);
      }, 200);
    }
    
    // Save final position to localStorage
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("adrata-panel-ratio", rightPanelWidthRef.current.toString());
    }
  }, [isHydrated]);

  // Left panel drag effect
  useEffect(() => {
    if (!leftDragging) {
      return;
    }

    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      
      if (leftRafIdRef.current) {
        cancelAnimationFrame(leftRafIdRef.current);
      }
      
      leftRafIdRef.current = requestAnimationFrame(() => {
        const dragStartData = (window as any).__leftPanelDragStart;
        if (!dragStartData) return;
        
        const { startMouseX, startPanelWidth, containerRect } = dragStartData;
        const deltaX = e.clientX - startMouseX;
        const newWidth = Math.max(200, Math.min(600, startPanelWidth + deltaX));
        
        leftPanelWidthRef.current = newWidth;
        setLeftPanelWidth(newWidth);
        setCurrentLeftWidth(Math.round(newWidth));
        
        if (leftPanelRef.current) {
          leftPanelRef.current.style.width = `${newWidth}px`;
        }
      });
    };

    const onUp = (e: MouseEvent) => {
      e.preventDefault();
      endLeftDrag();
    };

    document.addEventListener("mousemove", onMove, { capture: true, passive: false });
    document.addEventListener("mouseup", onUp, { capture: true, passive: false });
    
    return () => {
      document.removeEventListener("mousemove", onMove, { capture: true });
      document.removeEventListener("mouseup", onUp, { capture: true });
      endLeftDrag();
    };
  }, [leftDragging, endLeftDrag]);

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
        
        // Update width percentage
        const percent = Math.round((1 - rightPanelRatio) * 100);
        setCurrentWidthPercent(percent);
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

  // Panel resize function with animation
  const resizePanel = useCallback((newFlex: number, animate = true) => {
    rightPanelWidthRef.current = newFlex;
    setRightPanelFlex(newFlex);
    
    if (rightPanelRef.current) {
      if (animate) {
        setIsAnimating(true);
        rightPanelRef.current.style.transition = "flex 0.2s cubic-bezier(0.4, 0, 0.2, 1)";
        rightPanelRef.current.style.flex = newFlex.toString();
        setTimeout(() => {
          if (rightPanelRef.current) {
            rightPanelRef.current.style.transition = "";
          }
          setIsAnimating(false);
        }, 200);
      } else {
        rightPanelRef.current.style.flex = newFlex.toString();
      }
    }
    
    // Save to localStorage
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("adrata-panel-ratio", newFlex.toString());
    }
  }, [isHydrated]);

  // Global keyboard shortcuts (zoom handled by ZoomProvider)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target['tagName'] === "INPUT" ||
        target['tagName'] === "TEXTAREA" ||
        target.isContentEditable;
      
      // Skip keyboard shortcuts if user is typing
      if (isInput) return;
      
      const isModifierPressed = e.metaKey || e.ctrlKey;
      
      // Panel resize shortcuts
      if (isModifierPressed && isRightPanelVisible) {
        switch (e.key) {
          case '[':
            e.preventDefault();
            resizePanel(Math.max(0.2, rightPanelWidthRef.current - 0.1));
            break;
          case ']':
            e.preventDefault();
            resizePanel(Math.min(1.8, rightPanelWidthRef.current + 0.1));
            break;
          case '0':
            e.preventDefault();
            resizePanel(0.35); // Default size
            break;
        }
      }
      
      // Command/Ctrl + L: Toggle right panel (AI chat)
      if (isModifierPressed && e['key'] === "l") {
        e.preventDefault();
        if (onToggleRightPanel) {
          onToggleRightPanel();
        }
      }

      // Command/Ctrl + B: Toggle left panel
      if (isModifierPressed && e['key'] === "b") {
        if (onToggleLeftPanel) {
          e.preventDefault();
          onToggleLeftPanel();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onToggleRightPanel, onToggleLeftPanel, isRightPanelVisible, resizePanel]);

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
      className="w-full h-screen overflow-hidden bg-background"
      style={{ position: "relative" }}
    >
      <div ref={containerRef} className="flex h-full w-full relative">
        {/* Profile Panel - Slides in from left */}
        {isProfilePanelVisible && profilePanel && (
          <div className="flex-shrink-0 z-50">
            {profilePanel}
          </div>
        )}
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
          <div key="left-panel-container" className="h-full relative">
            <div
              ref={leftPanelRef}
              className="h-full"
              style={{
                width: `${leftPanelWidth}px`,
                minWidth: 200,
                maxWidth: 600,
                willChange: leftDragging ? "width" : "auto",
              }}
            >
              {leftPanel}
            </div>
            {/* Draggable Divider on right edge of left panel */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: dividerHitArea,
                height: "100%",
                cursor: "col-resize",
                zIndex: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                background: "transparent",
                pointerEvents: "auto" as const,
              }}
              onMouseDown={startLeftDrag}
              onMouseEnter={() => {
                setLeftHovering(true);
                document.body.style.cursor = "col-resize";
              }}
              onMouseLeave={() => {
                setLeftHovering(false);
                if (!leftDragging) {
                  document.body.style.cursor = "";
                }
              }}
              onDoubleClick={() => {
                const defaultWidth = 209.357;
                leftPanelWidthRef.current = defaultWidth;
                setLeftPanelWidth(defaultWidth);
                if (leftPanelRef.current) {
                  leftPanelRef.current.style.transition = "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                  leftPanelRef.current.style.width = `${defaultWidth}px`;
                  setTimeout(() => {
                    if (leftPanelRef.current) {
                      leftPanelRef.current.style.transition = "";
                    }
                  }, 300);
                }
              }}
              role="separator"
              aria-label="Resize left panel"
            >
              <div
                style={{
                  width: dividerLineWidth,
                  height: "100%",
                  background: leftDragging ? "#3B82F6" : leftHovering ? "#6B7280" : "#e5e7eb",
                }}
              />
            </div>
          </div>
        )}
        {/* Middle Panel */}
        <div
          className="relative min-w-0 bg-background h-full overflow-hidden"
          style={{
            flex: isRightPanelVisible ? 1 : "1 1 0%",
            background: "var(--background)",
          }}
        >
          {middlePanel}
          {/* Draggable Divider */}
          {isRightPanelVisible && (
            <div
              style={dividerStyle}
              onMouseDown={startDrag}
              onDoubleClick={() => {
                const defaultFlex = 0.35;
                rightPanelWidthRef.current = defaultFlex;
                setRightPanelFlex(defaultFlex);
                setIsAnimating(true);
                if (rightPanelRef.current) {
                  rightPanelRef.current.style.transition = "flex 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                  rightPanelRef.current.style.flex = defaultFlex.toString();
                  setTimeout(() => {
                    if (rightPanelRef.current) {
                      rightPanelRef.current.style.transition = "";
                    }
                    setIsAnimating(false);
                  }, 300);
                }
              }} // Reset to default ratio on double-click with animation
              onMouseEnter={() => {
                setHovering(true);
                // Immediate cursor feedback
                document.body.style.cursor = "col-resize";
              }}
              onMouseLeave={() => {
                setHovering(false);
                // Reset cursor if not dragging
                if (!dragging) {
                  document.body.style.cursor = "";
                }
              }}
              role="separator"
              aria-label="Resize right panel"
              aria-valuenow={currentWidthPercent}
              aria-valuemin={10}
              aria-valuemax={90}
            >
              <div
                style={{
                  width: dividerLineWidth,
                  height: "100%",
                  background: dividerLineColor,
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
              minWidth: 320, // Set minimum width to 320px for better UX on small screens
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