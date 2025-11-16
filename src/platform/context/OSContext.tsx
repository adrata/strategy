"use client";

import React, { createContext, useContext, ReactNode } from "react";

export type OSType = "acquisition" | "retention" | "expansion" | "revenue";

interface OSContextType {
  osType: OSType;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

interface OSProviderProps {
  children: ReactNode;
  osType: OSType;
}

export function OSProvider({ children, osType }: OSProviderProps) {
  return (
    <OSContext.Provider value={{ osType }}>
      {children}
    </OSContext.Provider>
  );
}

export function useOS(): OSContextType {
  const context = useContext(OSContext);
  if (context === undefined) {
    // Default to revenue-os if no context provided (backward compatibility)
    return { osType: "revenue" };
  }
  return context;
}

