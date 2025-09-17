import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth-unified";

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
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  
  // Fix hydration issue: always start with the same value on server and client  
  const [rightPanelFlex, setRightPanelFlex] = useState(0.4603); // Increased by 35% from 0.3336 (20% + 15%)
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
  const dividerHitArea = 12; // Increased for better usability while maintaining precision
  const dividerLineWidth = 1;
  const dividerLineColor =
    dragging ? "#3B82F6" : hovering ? "#6B7280" : "var(--border)"; // Blue when dragging, gray when hovering

  // Mouse event handlers for resizing - improved for better cursor tracking
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    document.body.classList.add("dragging-panel-divider");
    
    // Set cursor immediately for better feedback
    document.body['style']['cursor'] = "col-resize";
    document.body['style']['userSelect'] = "none";
  };

  useEffect(() => {
    if (!dragging) {
      document.body.classList.remove("dragging-panel-divider");
      document.body['style']['cursor'] = "";
      document.body['style']['userSelect'] = "";
      return;
    }

    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      e.preventDefault();
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const leftPanelWidth = isLeftPanelVisible ? 224.357 : 0;
      const availableWidth = containerRect.width - leftPanelWidth;
      
      // Calculate the current middle panel width based on current flex values
      const currentMiddleFlex = 1; // Middle panel always has flex: 1
      const currentRightFlex = rightPanelFlex;
      const totalFlex = currentMiddleFlex + currentRightFlex;
      const currentMiddleWidth = (currentMiddleFlex / totalFlex) * availableWidth;
      
      // Precise mouse tracking - account for exact cursor position relative to the divider
      const mouseX = e.clientX - containerRect.left - leftPanelWidth;
      const dividerPosition = currentMiddleWidth; // Current position of the divider
      
      // Calculate how much the mouse has moved from the divider position
      const mouseOffset = mouseX - dividerPosition;
      
      // Convert mouse movement to flex ratio change
      // Each pixel of movement should correspond to a proportional change in flex
      const flexChangePerPixel = 0.01; // Adjust this value to control sensitivity
      const newRightFlex = Math.max(0.2, Math.min(1.8, rightPanelFlex + (mouseOffset * flexChangePerPixel)));
      
      setRightPanelFlex(newRightFlex);
    };

    const onUp = (e: MouseEvent) => {
      e.preventDefault();
      setDragging(false);
      document.body.classList.remove("dragging-panel-divider");
      document.body['style']['cursor'] = "";
      document.body['style']['userSelect'] = "";
    };

    // Use capture phase for better event handling
    document.addEventListener("mousemove", onMove, { capture: true });
    document.addEventListener("mouseup", onUp, { capture: true });
    
    return () => {
      document.removeEventListener("mousemove", onMove, { capture: true });
      document.removeEventListener("mouseup", onUp, { capture: true });
      document.body.classList.remove("dragging-panel-divider");
      document.body['style']['cursor'] = "";
      document.body['style']['userSelect'] = "";
    };
  }, [dragging, isLeftPanelVisible]);

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
        router.push("/grand-central/dashboard");
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
    <>
      <style jsx>{`
        .dragging-panel-divider {
          cursor: col-resize !important;
          user-select: none !important;
        }
        
        .dragging-panel-divider * {
          pointer-events: none !important;
        }
        
        .panel-divider-hover {
          background: rgba(59, 130, 246, 0.1) !important;
        }
        
        .panel-divider-drag {
          background: rgba(59, 130, 246, 0.2) !important;
        }
      `}</style>
      <div
        className="w-screen h-screen overflow-hidden bg-[var(--background)]"
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
        {isLeftPanelVisible && leftPanel}
        {/* Middle Panel */}
        <div
          className="relative min-w-0 bg-[var(--background)] h-full pb-6"
          style={{
            flex: isRightPanelVisible ? 1 : "1 1 0%",
            background: "var(--background)",
          }}
        >
          {middlePanel}
          {/* Draggable Divider */}
          {isRightPanelVisible && (
            <div
              className={`${hovering ? 'panel-divider-hover' : ''} ${dragging ? 'panel-divider-drag' : ''}`}
              style={{
                position: "absolute",
                top: 0,
                right: 0, // Position at the exact edge of the middle panel
                width: dividerHitArea,
                height: "100%",
                cursor: "col-resize",
                zIndex: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start", // Align the visual line to the left edge of hit area
                background: "transparent",
                pointerEvents: "auto",
                transform: `translateX(-${dividerHitArea / 2}px)`, // Center the hit area on the panel edge
                transition: "background 0.15s ease",
              }}
              onMouseDown={startDrag}
              onDoubleClick={() => setRightPanelFlex(0.4603)} // Reset to default ratio on double-click (35% wider)
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
            style={{
              flex: rightPanelFlex,
              minWidth: 0,
              height: "100%",
              overflow: "hidden",
              background: "var(--background)",
            }}
            className="flex flex-col h-full"
          >
            {rightPanel}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
