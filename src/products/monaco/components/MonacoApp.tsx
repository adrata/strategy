"use client";

import React from "react";
import { MonacoProvider } from "@/products/monaco/context/MonacoContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { RevenueOSProvider } from "@/platform/ui/context/RevenueOSProvider";
import { MonacoContainer } from "./MonacoContainer";

export function MonacoApp() {
  return (
    <RevenueOSProvider>
      <SpeedrunDataProvider>
        <MonacoProvider>
          <MonacoContainer />
        </MonacoProvider>
      </SpeedrunDataProvider>
    </RevenueOSProvider>
  );
}
