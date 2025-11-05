"use client";

import React, { createContext, useContext, useState } from 'react';

interface SettingsPopupContextType {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const SettingsPopupContext = createContext<SettingsPopupContextType | undefined>(undefined);

export function SettingsPopupProvider({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const value = {
    isSettingsOpen,
    setIsSettingsOpen,
  };

  return (
    <SettingsPopupContext.Provider value={value}>
      {children}
    </SettingsPopupContext.Provider>
  );
}

export function useSettingsPopup() {
  const context = useContext(SettingsPopupContext);
  if (context === undefined) {
    throw new Error('useSettingsPopup must be used within a SettingsPopupProvider');
  }
  return context;
}

/**
 * Optional version of useSettingsPopup that returns undefined if provider is not available
 * Use this when the provider might not be present
 */
export function useOptionalSettingsPopup() {
  return useContext(SettingsPopupContext);
}