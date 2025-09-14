"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RecordContextType {
  currentRecord: any | null;
  recordType: string | null;
  setCurrentRecord: (record: any, type: string) => void;
  clearCurrentRecord: () => void;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

interface RecordContextProviderProps {
  children: ReactNode;
}

export function RecordContextProvider({ children }: RecordContextProviderProps) {
  const [currentRecord, setCurrentRecordState] = useState<any | null>(null);
  const [recordType, setRecordType] = useState<string | null>(null);

  const setCurrentRecord = (record: any, type: string) => {
    setCurrentRecordState(record);
    setRecordType(type);
  };

  const clearCurrentRecord = () => {
    setCurrentRecordState(null);
    setRecordType(null);
  };

  return (
    <RecordContext.Provider value={{
      currentRecord,
      recordType,
      setCurrentRecord,
      clearCurrentRecord
    }}>
      {children}
    </RecordContext.Provider>
  );
}

export function useRecordContext() {
  const context = useContext(RecordContext);
  if (context === undefined) {
    // Return default values instead of throwing error for better resilience
    return {
      currentRecord: null,
      recordType: null,
      setCurrentRecord: () => {},
      clearCurrentRecord: () => {}
    };
  }
  return context;
}
