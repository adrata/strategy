"use client";

import React from "react";
import { SpeedrunProvider } from "@/products/speedrun/context/SpeedrunProvider";
import { SpeedrunContainer } from "@/products/speedrun/SpeedrunContainer";

export function SpeedrunContentModule() {
  return <SpeedrunContainer panel="content" />;
}

export function SpeedrunLeftModule() {
  return <SpeedrunContainer panel="left" />;
}

export function SpeedrunShouldShowLeftPanel() {
  // Speedrun should always show left panel
  return true;
}
