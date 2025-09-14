"use client";

import React from "react";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { SpeedrunProvider } from "@/products/speedrun/context/SpeedrunProvider";

interface ConditionalSpeedrunProviderProps {
  children: React.ReactNode;
}

export function ConditionalSpeedrunProvider({
  children,
}: ConditionalSpeedrunProviderProps) {
  const {
    ui: { activeSubApp },
  } = useAcquisitionOS();

  console.log("🔧 ConditionalSpeedrunProvider: activeSubApp =", activeSubApp);

  // For Speedrun app, provide SpeedrunProvider
  if (activeSubApp === "Speedrun") {
    return (
      <SpeedrunProvider>
        {children}
      </SpeedrunProvider>
    );
  }

  // For other apps, just wrap children without provider
  return <>{children}</>;
}
