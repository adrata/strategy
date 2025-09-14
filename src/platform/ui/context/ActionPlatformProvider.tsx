"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { ActionPlatformConfig, Lead, Opportunity, Contact, Account, PaginatedResponse } from "@/platform/aos/aos";
import { ActionPlatformApiClient } from "@/platform/api/action-platform/api-client";

interface ActionPlatformContextType {
  client: ActionPlatformApiClient;
  config: ActionPlatformConfig;
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Data operations
  getLeads: (filters?: any, sort?: any) => Promise<PaginatedResponse<Lead>>;
  getOpportunities: (filters?: any, sort?: any) => Promise<PaginatedResponse<Opportunity>>;
  
  // Utility functions
  clearCache: () => void;
  reconnect: () => void;
}

const ActionPlatformContext = createContext<ActionPlatformContextType | undefined>(undefined);

interface ActionPlatformProviderProps {
  children: React.ReactNode;
  config?: Partial<ActionPlatformConfig>;
  workspaceId: string;
  userId: string;
}

export function ActionPlatformProvider({ 
  children, 
  config = {}, 
  workspaceId, 
  userId 
}: ActionPlatformProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create client with merged config
  const mergedConfig: ActionPlatformConfig = useMemo(() => ({
    apiUrl: process['env']['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000/api',
    apiBaseUrl: process['env']['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    cacheTimeout: 300000,
    enableRealTime: process['env']['NODE_ENV'] === 'production',
    enableOfflineMode: true,
    workspaceId,
    userId,
    ...config,
  }), [config, workspaceId, userId]);

  const client = useMemo(() => {
    return new ActionPlatformApiClient(mergedConfig);
  }, [mergedConfig]);

  // Data operations
  const getLeads = useCallback(async (filters?: any, sort?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getLeads(filters, sort);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const getOpportunities = useCallback(async (filters?: any, sort?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await client.getOpportunities(filters, sort);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);



  // Utility functions
  const clearCache = useCallback(() => {
    client.clearCache();
  }, [client]);

  const reconnect = useCallback(() => {
    setIsOnline(true);
    setError(null);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = useMemo((): ActionPlatformContextType => ({
    client,
    config: mergedConfig,
    isOnline,
    isLoading,
    error,
    getLeads,
    getOpportunities,
    clearCache,
    reconnect,
  }), [
    client,
    mergedConfig,
    isOnline,
    isLoading,
    error,
    getLeads,
    getOpportunities,
    clearCache,
    reconnect,
  ]);

  return (
    <ActionPlatformContext.Provider value={value}>
      {children}
    </ActionPlatformContext.Provider>
  );
}

export function useActionPlatform() {
  const context = useContext(ActionPlatformContext);
  if (context === undefined) {
    throw new Error('useActionPlatform must be used within an ActionPlatformProvider');
  }
  return context;
} 