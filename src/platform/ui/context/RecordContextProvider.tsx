"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ListViewContext {
  visibleRecords: any[];
  activeSection: string;
  appliedFilters: {
    searchQuery?: string;
    verticalFilter?: string;
    statusFilter?: string;
    priorityFilter?: string;
    sortField?: string;
    sortDirection?: string;
  };
  totalCount: number;
  lastUpdated: Date;
}

interface RecordContextType {
  currentRecord: any | null;
  recordType: string | null;
  listViewContext: ListViewContext | null;
  setCurrentRecord: (record: any, type: string) => void;
  updateCurrentRecord: (updates: Partial<any>) => void;
  clearCurrentRecord: () => void;
  setListViewContext: (context: ListViewContext) => void;
  clearListViewContext: () => void;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

interface RecordContextProviderProps {
  children: ReactNode;
}

export function RecordContextProvider({ children }: RecordContextProviderProps) {
  const [currentRecord, setCurrentRecordState] = useState<any | null>(null);
  const [recordType, setRecordType] = useState<string | null>(null);
  const [listViewContext, setListViewContextState] = useState<ListViewContext | null>(null);

  const setCurrentRecord = useCallback((record: any, type: string) => {
    console.log('🎯 [RecordContext] Setting current record:', { 
      id: record?.id, 
      name: record?.name || record?.fullName, 
      type 
    });
    setCurrentRecordState(record);
    setRecordType(type);
  }, []);

  const updateCurrentRecord = useCallback((updates: Partial<any>) => {
    setCurrentRecordState((prev: any) => {
      if (!prev) return prev;
      console.log('🔄 [RecordContext] Updating current record:', { 
        id: prev?.id, 
        updates: Object.keys(updates) 
      });
      return {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const clearCurrentRecord = useCallback(() => {
    console.log('🧹 [RecordContext] Clearing current record');
    setCurrentRecordState(null);
    setRecordType(null);
  }, []);

  const setListViewContext = useCallback((context: ListViewContext) => {
    console.log('📋 [RecordContext] Setting list view context:', {
      section: context.activeSection,
      recordCount: context.visibleRecords?.length || 0,
      totalCount: context.totalCount,
      filters: context.appliedFilters
    });
    setListViewContextState(context);
  }, []);

  const clearListViewContext = useCallback(() => {
    console.log('🧹 [RecordContext] Clearing list view context');
    setListViewContextState(null);
  }, []);

  return (
    <RecordContext.Provider value={{
      currentRecord,
      recordType,
      listViewContext,
      setCurrentRecord,
      updateCurrentRecord,
      clearCurrentRecord,
      setListViewContext,
      clearListViewContext
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
      listViewContext: null,
      setCurrentRecord: () => {},
      updateCurrentRecord: () => {},
      clearCurrentRecord: () => {},
      setListViewContext: () => {},
      clearListViewContext: () => {}
    };
  }
  return context;
}
