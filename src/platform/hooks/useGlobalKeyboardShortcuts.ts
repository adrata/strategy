"use client";

import { useEffect, useState, useCallback } from "react";

interface GlobalKeyboardShortcutsOptions {
  onToggleRightPanel?: () => void;
  onToggleLeftPanel?: () => void;
  isRightPanelVisible?: boolean;
  isLeftPanelVisible?: boolean;
}

// Zoom levels - similar to browser zoom
const ZOOM_LEVELS = [
  0.5, 0.67, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0,
];
const DEFAULT_ZOOM_INDEX = 5; // 100% zoom

export function useGlobalKeyboardShortcuts({
  onToggleRightPanel,
  onToggleLeftPanel,
  isRightPanelVisible,
  isLeftPanelVisible,
}: GlobalKeyboardShortcutsOptions = {}) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [currentZoom, setCurrentZoom] = useState(
    ZOOM_LEVELS[DEFAULT_ZOOM_INDEX],
  );

  // Zoom loading removed - handled by ZoomProvider

  // Zoom functionality removed - handled by ZoomProvider

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
          console.log('🚨 Global signal popup triggered with Cmd+I');
        }
      }

      // Zoom shortcuts are handled by ZoomProvider globally
      // No longer handling zoom here to prevent conflicts
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onToggleRightPanel, onToggleLeftPanel]);

  return {
    isRightPanelVisible,
    isLeftPanelVisible,
  };
}
