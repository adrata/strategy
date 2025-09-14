"use client";

import React from "react";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { MonacoApp } from "@/products/monaco/components/MonacoApp";

  // Preload critical data for instant experience (disabled to prevent multiple API calls)
  const preloadSpeedrunData = () => {
    // Data is now preloaded by the service constructor
    console.log("🚀 Speedrun data preloaded by service");
  };

export default function MonacoSpeedrunPage() {
  // Preload data immediately when component mounts
  React.useEffect(() => {
    preloadSpeedrunData();
  }, []);

  return (
    <ZoomProvider>
      <MonacoApp />
    </ZoomProvider>
  );
} 