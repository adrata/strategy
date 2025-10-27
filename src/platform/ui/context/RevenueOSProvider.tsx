"use client";

import React, { createContext, useContext, ReactNode } from "react";

// Create context
const RevenueOSContext = createContext<{
  // Add any RevenueOS-specific context here
  isRevenueOS: boolean;
} | undefined>(undefined);

// Provider component
interface RevenueOSProviderProps {
  children: ReactNode;
}

/**
 * RevenueOS Provider
 * 
 * Provides RevenueOS-specific context and functionality
 */
export function RevenueOSProvider({ children }: RevenueOSProviderProps) {
  const value = {
    isRevenueOS: true,
  };

  return (
    <RevenueOSContext.Provider value={value}>
      {children}
    </RevenueOSContext.Provider>
  );
}

// Hook to use RevenueOS context
export function useRevenueOS() {
  const context = useContext(RevenueOSContext);
  if (context === undefined) {
    throw new Error('useRevenueOS must be used within a RevenueOSProvider');
  }
  return context;
}
