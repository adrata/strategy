"use client";

import React from "react";
import { MonacoProvider } from "@/products/monaco/context/MonacoContext";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { MonacoContainer } from "./MonacoContainer";

export function MonacoApp() {
  return (
    <AcquisitionOSProvider>
      <SpeedrunDataProvider>
        <MonacoProvider>
          <MonacoContainer />
        </MonacoProvider>
      </SpeedrunDataProvider>
    </AcquisitionOSProvider>
  );
}
