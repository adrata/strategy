/**
 * React Hook for Rust WebAssembly API
 * 
 * Provides easy access to high-performance Rust operations
 * with automatic initialization and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { rustApiService } from '@/platform/services/rust-api';

interface UseRustApiReturn {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  generateBuyerGroup: (companies: any[]) => Promise<any>;
  processData: (operation: string, params: any) => Promise<any>;
  processIntelligence: (operation: string, params: any) => Promise<any>;
  processPipeline: (operation: string, params: any) => Promise<any>;
  initialize: () => Promise<void>;
}

export function useRustApi(): UseRustApiReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Rust API on mount
  useEffect(() => {
    const initializeRust = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await rustApiService.initialize();
        setIsInitialized(true);
        console.log('✅ [RUST-HOOK] Rust API initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Rust API';
        setError(errorMessage);
        console.error('❌ [RUST-HOOK] Rust API initialization failed:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRust();

    // Cleanup on unmount
    return () => {
      rustApiService.cleanup();
    };
  }, []);

  // Manual initialization function
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await rustApiService.initialize();
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Rust API';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Wrapper functions with error handling
  const generateBuyerGroup = useCallback(async (companies: any[]) => {
    if (!isInitialized) {
      throw new Error('Rust API not initialized');
    }
    
    try {
      setError(null);
      return await rustApiService.generateBuyerGroup(companies);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Buyer group generation failed';
      setError(errorMessage);
      throw err;
    }
  }, [isInitialized]);

  const processData = useCallback(async (operation: string, params: any) => {
    if (!isInitialized) {
      throw new Error('Rust API not initialized');
    }
    
    try {
      setError(null);
      return await rustApiService.processData(operation, params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Data processing failed';
      setError(errorMessage);
      throw err;
    }
  }, [isInitialized]);

  const processIntelligence = useCallback(async (operation: string, params: any) => {
    if (!isInitialized) {
      throw new Error('Rust API not initialized');
    }
    
    try {
      setError(null);
      return await rustApiService.processIntelligence(operation, params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Intelligence processing failed';
      setError(errorMessage);
      throw err;
    }
  }, [isInitialized]);

  const processPipeline = useCallback(async (operation: string, params: any) => {
    if (!isInitialized) {
      throw new Error('Rust API not initialized');
    }
    
    try {
      setError(null);
      return await rustApiService.processPipeline(operation, params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Pipeline processing failed';
      setError(errorMessage);
      throw err;
    }
  }, [isInitialized]);

  return {
    isInitialized,
    isLoading,
    error,
    generateBuyerGroup,
    processData,
    processIntelligence,
    processPipeline,
    initialize,
  };
}
