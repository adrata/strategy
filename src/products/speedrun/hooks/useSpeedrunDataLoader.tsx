"use client";

/**
 * 🚀 SPEEDRUN DATA LOADER - UNIFIED CACHE SYSTEM
 * Uses the new unified caching system for optimal performance
 */

import { useEffect, useRef, useCallback } from "react";
import { getDesktopEnvInfo } from "@/platform/desktop-env-check";
import { invoke } from "@tauri-apps/api/core";
import { authFetch } from "@/platform/api-fetch";
import { useSpeedrunContext, type SpeedrunPerson } from "@/products/speedrun/context/SpeedrunProvider";
import { UniversalRankingEngine, type RankedSpeedrunPerson } from "@/products/speedrun/UniversalRankingEngine";
import { RankingSystem } from "@/platform/services/ranking-system";
import { SpeedrunEngineSettingsService } from '@/platform/services/speedrun-engine-settings-service';
import { useAdrataData } from '@/platform/hooks/useAdrataData';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { useUnifiedAuth } from '@/platform/auth';

// Helper function to determine vertical from prospect/lead data
function determineVerticalFromData(data: any): string {
  const company = (data.company || data.companyName || "").toLowerCase();
  const industry = (data.industry || "").toLowerCase();
  const description = (data.description || "").toLowerCase();
  const searchText = `${company} ${industry} ${description}`;

  // C Stores patterns
  if (searchText.includes('convenience') || searchText.includes('gas') || searchText.includes('fuel') || 
      searchText.includes('petroleum') || searchText.includes('travel center') ||
      company.includes('casey') || company.includes('kwik') || company.includes('pilot') ||
      company.includes('shell') || company.includes('bp') || company.includes('exxon')) {
    return 'C Stores';
  }

  // Grocery Stores patterns
  if (searchText.includes('grocery') || searchText.includes('supermarket') || searchText.includes('food') ||
      searchText.includes('market') || company.includes('kroger') || company.includes('safeway') ||
      company.includes('albertsons') || company.includes('wegmans')) {
    return 'Grocery Stores';
  }

  // Restaurants patterns
  if (searchText.includes('restaurant') || searchText.includes('dining') || searchText.includes('food service') ||
      company.includes('mcdonalds') || company.includes('subway') || company.includes('starbucks') ||
      company.includes('pizza') || company.includes('burger')) {
    return 'Restaurants';
  }

  // Retail patterns
  if (searchText.includes('retail') || searchText.includes('store') || searchText.includes('shopping') ||
      company.includes('walmart') || company.includes('target') || company.includes('costco')) {
    return 'Retail';
  }

  // Healthcare patterns
  if (searchText.includes('healthcare') || searchText.includes('medical') || searchText.includes('hospital') ||
      searchText.includes('clinic') || searchText.includes('pharmacy')) {
    return 'Healthcare';
  }

  // Technology patterns
  if (searchText.includes('technology') || searchText.includes('software') || searchText.includes('tech') ||
      searchText.includes('digital') || searchText.includes('it')) {
    return 'Technology';
  }

  // Default fallback
  return 'General';
}

/**
 * 🚀 UNIFIED SPEEDRUN DATA LOADER
 * Uses the new unified caching system
 */
export function useSpeedrunDataLoader() {
  const {
    isDataLoaded,
    setReadyPeople,
    setSelectedPerson,
    setIsDataLoaded,
    readyPeople,
  } = useSpeedrunContext();

  // Get workspace and user context for cache key
  const { user } = useUnifiedAuth();
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id || '';
  const userId = user?.id || '';

  const dataLoadPromiseRef = useRef<Promise<void> | null>(null);

  // Cache key for unified data fetching - stable and workspace-specific
  const cacheKey = `speedrun:data:${workspaceId}:${userId}`;

  // Fetch function for speedrun data
  const fetchSpeedrunData = useCallback(async () => {
    console.log("⚡ INSTANT: Starting unified speedrun data loading...");

    try {
      // Get desktop environment info
      const desktopEnv = await getDesktopEnvInfo();
      console.log("🖥️ [DESKTOP ENV]", desktopEnv);

      // Load settings
      const settings = SpeedrunEngineSettingsService.getUserSettings();
      console.log("⚙️ [SETTINGS]", settings);

      // Fetch data from unified API (best practice - consistent with platform)
      const response = await authFetch('/api/data/unified?type=speedrun&action=get');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch speedrun data: ${response.statusText}`);
      }

      const result = await response.json();
      const rawData = result.data?.speedrunItems || [];

      console.log(`📊 [DATA LOADED] ${rawData.length} raw speedrun items`);

      // Transform and rank data
      const transformedData: SpeedrunPerson[] = rawData.map((item: any) => ({
        id: item.id || `speedrun-${Math.random()}`,
        name: item.name || item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
        email: item.email || '',
        company: item.company || item.companyName || 'Unknown Company',
        title: item.title || item.jobTitle || 'Unknown Title',
        phone: item.phone || item.phoneNumber || '',
        location: item.location || item.city || '',
        industry: item.industry || determineVerticalFromData(item),
        status: item.status || 'active',
        priority: item.priority || 'medium',
        lastContact: item.lastContact || item.updatedAt,
        notes: item.notes || '',
        tags: item.tags || [],
        source: item.source || 'speedrun',
        enrichmentScore: item.enrichmentScore || 0,
        buyerGroupRole: item.buyerGroupRole || 'unknown',
        currentStage: item.currentStage || 'initial',
        nextAction: item.nextAction || '',
        nextActionDate: item.nextActionDate || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        assignedUser: item.assignedUser || null,
        workspaceId: item.workspaceId || '',
        ...item // Include any additional fields
      }));

      console.log(`🔄 [TRANSFORMED] ${transformedData.length} speedrun people`);

      // 🏆 DATA IS ALREADY RANKED by the unified API using new ranking system
      console.log(`🏆 [SPEEDRUN] Data is already ranked by unified API, no additional ranking needed`);
      
      // The unified API has already applied the new unified ranking system
      // Just convert to the expected format
      const rankedData: RankedSpeedrunPerson[] = transformedData.map((person, index) => ({
        ...person,
        winningScore: {
          totalScore: index + 1, // Use position in the already-ranked list
          rank: (index + 1).toString(),
          confidence: 0.9,
          winFactors: [`Unified ranking position: ${index + 1}`],
          urgencyLevel: index < 5 ? "Critical" : index < 15 ? "High" : "Medium",
          bestContactTime: "Morning",
          dealPotential: Math.max(0, 100 - (index * 3))
        }
      }));

      console.log(`🏆 [RANKED] ${rankedData.length} ranked speedrun people`);

      // Set the data
      setReadyPeople(rankedData);
      setIsDataLoaded(true);

      console.log("✅ [UNIFIED SPEEDRUN] Data loading completed successfully");

      return rankedData;
    } catch (error) {
      console.error("❌ [UNIFIED SPEEDRUN] Error loading data:", error);
      setIsDataLoaded(false);
      throw error;
    }
  }, [setReadyPeople, setSelectedPerson, setIsDataLoaded]);

  // Use AdrataData hook (the correct unified data hook)
  const { 
    data, 
    isLoading, 
    error, 
    refresh,
    clearCache 
  } = useAdrataData(cacheKey, fetchSpeedrunData, {
    ttl: 30000, // 30 seconds cache for speedrun data
    priority: 'high',
    tags: ['speedrun', 'data'],
    revalidateOnReconnect: true,
    enabled: true
  });

  // Update the context when data changes
  useEffect(() => {
    if (data && !isLoading) {
      setReadyPeople(data);
      setIsDataLoaded(true);
    }
  }, [data, isLoading, setReadyPeople, setIsDataLoaded]);

  // Load fresh data function
  const loadFreshData = useCallback(() => {
    clearCache();
    setIsDataLoaded(false);
    refresh();
  }, [clearCache, setIsDataLoaded, refresh]);

  // Check for daily reset and auto-progression
  useEffect(() => {
    const checkDailyReset = () => {
      const lastReset = localStorage.getItem('speedrun-last-reset');
      const today = new Date().toDateString();
      
      if (lastReset !== today) {
        console.log("🔄 [DAILY RESET] New day detected, refreshing data");
        loadFreshData();
        localStorage.setItem('speedrun-last-reset', today);
      }
    };

    // Check on mount
    checkDailyReset();

    // Check every hour
    const interval = setInterval(checkDailyReset, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadFreshData]);

  return {
    isDataLoaded,
    readyPeople,
    isLoading,
    error,
    loadFreshData,
    refreshData: refresh,
    clearCache
  };
}