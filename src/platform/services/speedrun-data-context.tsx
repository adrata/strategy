"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SpeedrunDataService, SpeedrunProspect } from './speedrun-data-service';
import { useUnifiedAuth } from '@/platform/auth';

interface SpeedrunDataContextType {
  prospects: SpeedrunProspect[];
  addDataCorpProspects: (dataCorpProspects: SpeedrunProspect[]) => void;
  updateProspects: (newProspects: SpeedrunProspect[]) => void;
  getProspectById: (id: string) => SpeedrunProspect | undefined;
  updateProspect: (id: string, updates: Partial<SpeedrunProspect>) => void;
  applySpeedrunEngineSettings: (settings: any) => void;
  isLoading: boolean;
}

const SpeedrunDataContext = createContext<SpeedrunDataContextType | undefined>(undefined);

export function useSpeedrunDataContext() {
  const context = useContext(SpeedrunDataContext);
  if (context === undefined) {
    throw new Error('useSpeedrunDataContext must be used within a SpeedrunDataProvider');
  }
  return context;
}

interface SpeedrunDataProviderProps {
  children: React.ReactNode;
}

export function SpeedrunDataProvider({ children }: SpeedrunDataProviderProps) {
  const { user } = useUnifiedAuth();
  const [prospects, setProspects] = useState<SpeedrunProspect[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);
  const speedrunServiceRef = useRef<SpeedrunDataService | null>(null);

  useEffect(() => {
    // PREVENT DEFAULT WORKSPACE POLLUTION: Only initialize with valid workspace/user
    const workspaceId = user?.activeWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId || workspaceId === 'default' || userId === 'default') {
      console.log("🔥 SpeedrunDataProvider: Waiting for valid workspace/user IDs...");
      return;
    }

    if (isInitialized.current) {
      return;
    }

    isInitialized.current = true;
    
    console.log(`🔥 SpeedrunDataProvider: Initializing for workspace ${workspaceId}...`);
    
    try {
      // Get workspace-aware service instance
      speedrunServiceRef.current = SpeedrunDataService.getInstance(workspaceId, userId);
      
      // Get existing data first (if any)
      const existingProspects = speedrunServiceRef.current?.getProspects?.() || [];
      if (existingProspects.length > 0) {
        setProspects(existingProspects);
      } else {
        setIsLoading(true);
      }
      
      // Load fresh data
      if (speedrunServiceRef.current?.refreshProspects) {
        speedrunServiceRef.current.refreshProspects()
          .then(() => {
            const freshProspects = speedrunServiceRef.current?.getProspects?.() || [];
            setProspects(freshProspects);
            setIsLoading(false);
            console.log("🔥 SpeedrunDataProvider: Loaded fresh data");
          })
          .catch((error) => {
            console.error("❌ SpeedrunDataProvider: Error loading data:", error);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }

      // Subscribe to updates
      const unsubscribe = speedrunServiceRef.current?.subscribe?.((newProspects) => {
        console.log("🔥 SpeedrunDataProvider: Received update with", newProspects.length, "prospects");
        setProspects(newProspects);
      });

      return unsubscribe || (() => {});
    } catch (error) {
      console.error('❌ SpeedrunDataProvider: Failed to initialize:', error);
      setIsLoading(false);
      return () => {};
    }
  }, [user?.activeWorkspaceId, user?.id]);

  const value: SpeedrunDataContextType = {
    prospects,
    addDataCorpProspects: (dataCorpProspects: SpeedrunProspect[]) => 
      speedrunServiceRef.current?.addDataCorpProspects?.(dataCorpProspects),
    updateProspects: (newProspects: SpeedrunProspect[]) => 
      speedrunServiceRef.current?.updateProspects?.(newProspects),
    getProspectById: (id: string) => 
      speedrunServiceRef.current?.getProspectById?.(id),
    updateProspect: (id: string, updates: Partial<SpeedrunProspect>) => 
      speedrunServiceRef.current?.updateProspect?.(id, updates),
    applySpeedrunEngineSettings: (settings: any) => 
      speedrunServiceRef.current?.applySpeedrunEngineSettings?.(settings),
    isLoading
  };

  return (
    <SpeedrunDataContext.Provider value={value}>
      {children}
    </SpeedrunDataContext.Provider>
  );
}

// No fallback data - removed 