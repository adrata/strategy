"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// --- Zoom Context ---
type ZoomContextType = { zoom: number; setZoom: (z: number) => void };
const ZoomContext = createContext<ZoomContextType>({
  zoom: 100,
  setZoom: () => {},
});

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const [zoom, setZoom] = useState(100);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load zoom from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedZoom = localStorage.getItem("zoom");
        if (savedZoom) {
          const zoomValue = parseInt(savedZoom, 10);
          if (zoomValue >= 50 && zoomValue <= 300) {
            setZoom(zoomValue);
            // Apply zoom immediately
            document.documentElement.style.setProperty("--zoom-level", `${zoomValue}%`);
            document.documentElement['style']['transform'] = `scale(${zoomValue / 100})`;
            document.documentElement['style']['transformOrigin'] = "top left";
          }
        }
      } catch (error) {
        console.warn("Failed to load zoom from localStorage:", error);
      }
      setIsInitialized(true);
    }
  }, []);

  // Apply zoom changes
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      try {
        // Save to localStorage
        localStorage.setItem("zoom", zoom.toString());
        
        // Apply CSS zoom
        document.documentElement.style.setProperty("--zoom-level", `${zoom}%`);
        document.documentElement['style']['transform'] = `scale(${zoom / 100})`;
        document.documentElement['style']['transformOrigin'] = "top left";
        
        // Adjust body width to prevent horizontal scroll
        const scale = zoom / 100;
        document.body['style']['width'] = `${100 / scale}%`;
      } catch (error) {
        console.warn("Failed to apply zoom:", error);
      }
    }
  }, [zoom, isInitialized]);

  const contextValue = {
    zoom,
    setZoom: (newZoom: number) => {
      if (newZoom >= 50 && newZoom <= 300) {
        setZoom(newZoom);
      }
    },
  };

  return (
    <ZoomContext.Provider value={contextValue}>
      {children}
    </ZoomContext.Provider>
  );
}

export const useZoom = () => {
  const context = useContext(ZoomContext);
  
  if (!context) {
    throw new Error("useZoom must be used within a ZoomProvider");
  }

  return context;
};
