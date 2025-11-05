"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SprintContextType {
  selectedRecord: any;
  setSelectedRecord: (record: any) => void;
  currentSprintIndex: number;
  setCurrentSprintIndex: (index: number) => void;
  completedRecords: string[];
  setCompletedRecords: (records: string[] | ((prev: string[]) => string[])) => void;
}

const SprintContext = createContext<SprintContextType | undefined>(undefined);

export const useSprint = () => {
  const context = useContext(SprintContext);
  if (!context) {
    throw new Error('useSprint must be used within a SprintProvider');
  }
  return context;
};

interface SprintProviderProps {
  children: ReactNode;
  initialSelectedRecord?: any;
  initialSprintIndex?: number;
  initialCompletedRecords?: string[];
}

export function SprintProvider({ 
  children, 
  initialSelectedRecord = null,
  initialSprintIndex = 0,
  initialCompletedRecords = []
}: SprintProviderProps) {
  const [selectedRecord, setSelectedRecord] = useState(initialSelectedRecord);
  const [currentSprintIndex, setCurrentSprintIndex] = useState(initialSprintIndex);
  const [completedRecords, setCompletedRecords] = useState(initialCompletedRecords);

  return (
    <SprintContext.Provider value={{
      selectedRecord,
      setSelectedRecord,
      currentSprintIndex,
      setCurrentSprintIndex,
      completedRecords,
      setCompletedRecords
    }}>
      {children}
    </SprintContext.Provider>
  );
}
