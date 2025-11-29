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
import { validatePhoneNumber } from '@/platform/utils/phone-validator';

// Helper function to extract company name from email domain
function extractCompanyFromEmail(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  
  // Skip personal email domains
  const personalDomains = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com'
  ]);
  
  if (personalDomains.has(domain)) return null;
  
  // Convert domain to company name
  const companyName = domain
    .replace(/\.(com|org|net|gov|edu|co|io|ai|tech)$/, '')
    .replace(/[^a-z0-9]/g, ' ')
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  return companyName || null;
}

// Helper function to calculate comprehensive score based on optimization settings
function calculateOptimizationScore(person: any, settings: any): number {
  if (!settings) return 50; // Default score if no settings
  
  let score = 0;
  
  // Deal Value Score (based on estimated deal size or company indicators)
  const dealValueWeight = (settings.dealValueFocus || 50) / 100;
  let dealScore = 50; // Base deal score
  const title = (person.title || person.jobTitle || '').toLowerCase();
  const company = (person.company || person.companyName || '').toLowerCase();
  
  // Higher titles often correlate with larger deals
  if (title.includes('ceo') || title.includes('president') || title.includes('owner')) {
    dealScore = 90;
  } else if (title.includes('vp') || title.includes('vice president') || title.includes('director')) {
    dealScore = 80;
  } else if (title.includes('manager') || title.includes('head')) {
    dealScore = 65;
  }
  
  // Larger companies often mean larger deals
  if (company.includes('corp') || company.includes('inc') || company.includes('enterprise')) {
    dealScore += 15;
  }
  
  score += Math.min(dealScore, 100) * dealValueWeight;
  
  // Warm Lead Priority (engagement signals)
  const warmLeadWeight = (settings.warmLeadPriority || 50) / 100;
  let engagementScore = 30;
  
  if (person.lastAction && person.lastAction !== 'No action taken') {
    engagementScore = 70;
  }
  if (person.status === 'qualified' || person.status === 'contacted') {
    engagementScore += 20;
  }
  if (person.enrichmentScore && person.enrichmentScore > 50) {
    engagementScore += 10;
  }
  
  score += Math.min(engagementScore, 100) * warmLeadWeight;
  
  // Decision Maker Focus (title-based)
  const decisionMakerWeight = (settings.decisionMakerFocus || 50) / 100;
  let dmScore = 30;
  
  if (title.includes('ceo') || title.includes('cto') || title.includes('cfo') || title.includes('cmo') || title.includes('coo')) {
    dmScore = 100;
  } else if (title.includes('vp') || title.includes('vice president') || title.includes('svp')) {
    dmScore = 85;
  } else if (title.includes('director') || title.includes('head of')) {
    dmScore = 70;
  } else if (title.includes('manager') || title.includes('lead')) {
    dmScore = 50;
  }
  
  score += dmScore * decisionMakerWeight;
  
  // Time Sensitivity (recency weighting)
  const timeSensitivityWeight = (settings.timeSensitivity || 50) / 100;
  let recencyScore = 50;
  
  if (person.updatedAt || person.lastContact) {
    const lastDate = new Date(person.updatedAt || person.lastContact);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 1) recencyScore = 100;
    else if (daysSince <= 7) recencyScore = 80;
    else if (daysSince <= 30) recencyScore = 60;
    else recencyScore = 30;
  }
  
  score += recencyScore * timeSensitivityWeight;
  
  // Economic Buyer Priority
  const economicBuyerWeight = (settings.economicBuyerPriority || 50) / 100;
  let budgetScore = 40;
  
  if (title.includes('cfo') || title.includes('finance') || title.includes('procurement') || title.includes('purchasing')) {
    budgetScore = 95;
  } else if (title.includes('ceo') || title.includes('owner') || title.includes('president')) {
    budgetScore = 90;
  } else if (title.includes('vp') && (title.includes('operations') || title.includes('finance'))) {
    budgetScore = 80;
  }
  
  score += budgetScore * economicBuyerWeight;
  
  // Competition Mode (prioritize if competitive signals)
  const competitionWeight = (settings.competitionMode || 50) / 100;
  let competitionScore = 50;
  
  // Check for competition indicators in notes or tags
  const notes = (person.notes || '').toLowerCase();
  const tags = (person.tags || []).join(' ').toLowerCase();
  
  if (notes.includes('competitor') || tags.includes('competitor') || notes.includes('incumbent')) {
    competitionScore = settings.competitionMode > 50 ? 90 : 30; // Boost or avoid based on mode
  }
  
  score += competitionScore * competitionWeight * 0.5; // Lower weight for competition
  
  // Normalize to 0-100 range
  const maxPossibleScore = 100 * (dealValueWeight + warmLeadWeight + decisionMakerWeight + 
                                   timeSensitivityWeight + economicBuyerWeight + competitionWeight * 0.5);
  
  return maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 50;
}

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

      // Load user settings and optimization settings
      const userSettings = SpeedrunEngineSettingsService.getUserSettings();
      const optimizationSettings = SpeedrunEngineSettingsService.getOptimizationSettings();
      console.log("⚙️ [USER SETTINGS]", userSettings);
      console.log("⚙️ [OPTIMIZATION SETTINGS]", optimizationSettings);

      // Fetch data from v1 speedrun API (best practice - consistent with platform)
      const response = await authFetch('/api/v1/speedrun?limit=100');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch speedrun data: ${response.statusText}`);
      }

      const result = await response.json();
      const rawData = result.data || [];

      console.log(`📊 [DATA LOADED] ${rawData.length} raw speedrun items`);

      // Transform and rank data
      const transformedData: SpeedrunPerson[] = rawData.map((item: any) => {
        // Try to get company from multiple sources
        let company = item.company || item.companyName;
        
        // If no company found, try to extract from email domain
        if (!company || company === 'Unknown Company' || company === '-') {
          const emailCompany = extractCompanyFromEmail(item.email);
          if (emailCompany) {
            company = emailCompany;
          } else {
            company = 'Unknown Company';
          }
        }
        
        return {
          id: item.id || `speedrun-${Math.random()}`,
          name: item.name || item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
          email: item.email || '',
          company: company,
          title: item.title || item.jobTitle || 'Unknown Title',
          phone: (() => {
            const rawPhone = item.phone || item.phoneNumber || '';
            const validation = validatePhoneNumber(rawPhone);
            return validation.isValid ? validation.phone : '';
          })(),
          location: item.location || item.city || '',
          industry: item.industry || determineVerticalFromData(item),
          status: item.status || 'Lead',
          priority: item.priority || 'medium',
          lastContact: item.lastContact || item.updatedAt,
          lastAction: item.lastAction || 'No action taken',
          lastActionDate: item.lastActionDate || null,
          lastActionTime: item.lastActionTime || 'Never',
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
        };
      });

      console.log(`🔄 [TRANSFORMED] ${transformedData.length} speedrun people`);

      // 🎯 OPTIMIZATION SCORING: Apply speedrun engine settings to calculate scores
      // If optimization settings exist, use them to rank. Otherwise, use default ordering.
      let scoredData = transformedData;
      
      if (optimizationSettings) {
        console.log(`🎯 [OPTIMIZATION] Applying speedrun engine settings to ranking...`);
        
        // Calculate optimization score for each person
        scoredData = transformedData.map(person => ({
          ...person,
          _optimizationScore: calculateOptimizationScore(person, optimizationSettings)
        }));
        
        // Sort by optimization score (highest first)
        scoredData.sort((a: any, b: any) => (b._optimizationScore || 0) - (a._optimizationScore || 0));
        
        console.log(`🎯 [OPTIMIZATION] Top 5 by optimization score:`, 
          scoredData.slice(0, 5).map((p: any) => `${p.name} (${p._optimizationScore?.toFixed(1)})`));
      } else {
        console.log(`📊 [DEFAULT] No optimization settings, using API order`);
      }

      // 🏆 SMART COUNTDOWN RANKING: 50 → 1 (start at 50, work down to #1 top prospect)
      // Now based on optimization-sorted data when settings exist
      console.log(`🏆 [SPEEDRUN] Assigning countdown ranks ${scoredData.length} → 1 for gamified display`);
      
      const totalRecords = scoredData.length;
      const rankedData: RankedSpeedrunPerson[] = scoredData.map((person: any, index: number) => {
        const countdownRank = totalRecords - index; // Countdown: 50, 49, 48... 3, 2, 1
        const optimizationScore = person._optimizationScore || (100 - index * 2);
        
        // Clean up internal field
        const { _optimizationScore, ...cleanPerson } = person;
        
        return {
          ...cleanPerson,
          globalRank: countdownRank, // Countdown display rank
          rank: countdownRank, // Fallback field
          winningScore: {
            totalScore: optimizationScore, // Use calculated optimization score
            rank: countdownRank.toString(), // Countdown rank string
            confidence: person.winningScore?.confidence || 0.9,
            winFactors: person.winningScore?.winFactors || [
              `Priority rank: ${countdownRank}`,
              optimizationSettings ? `Optimization score: ${optimizationScore.toFixed(1)}` : 'Default ranking'
            ],
            urgencyLevel: countdownRank <= 5 ? "Critical" : countdownRank <= 15 ? "High" : "Medium",
            bestContactTime: person.winningScore?.bestContactTime || "Morning",
            dealPotential: Math.max(0, countdownRank * 2) // Higher rank = higher potential
          }
        };
      });

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

  // Listen for speedrun data update events to refresh when fields are saved
  useEffect(() => {
    const handleSpeedrunDataUpdated = (event: CustomEvent) => {
      const { personId, field, value } = event.detail;
      console.log(`🔄 [SPEEDRUN DATA LOADER] Data updated event received for person ${personId}, field ${field}`);
      // Clear cache and refresh to ensure fresh data
      clearCache();
      // Small delay to ensure database update is complete
      setTimeout(() => {
        refresh();
      }, 500);
    };

    window.addEventListener('speedrun-data-updated', handleSpeedrunDataUpdated as EventListener);
    
    return () => {
      window.removeEventListener('speedrun-data-updated', handleSpeedrunDataUpdated as EventListener);
    };
  }, [clearCache, refresh]);

  // Listen for speedrun engine settings changes to re-rank data
  useEffect(() => {
    const handleSpeedrunSettingsChanged = () => {
      console.log(`🎯 [SPEEDRUN DATA LOADER] Engine settings changed - clearing cache and refreshing with new ranking...`);
      // Clear cache to force re-fetch and re-rank with new settings
      clearCache();
      // Refresh to apply new optimization settings
      setTimeout(() => {
        refresh();
      }, 100);
    };

    window.addEventListener('speedrunSettingsChanged', handleSpeedrunSettingsChanged);
    
    return () => {
      window.removeEventListener('speedrunSettingsChanged', handleSpeedrunSettingsChanged);
    };
  }, [clearCache, refresh]);

  // Check for daily reset and trigger intelligent re-ranking
  useEffect(() => {
    const checkDailyReset = async () => {
      const lastReset = localStorage.getItem('speedrun-last-reset');
      const today = new Date().toDateString();
      
      if (lastReset !== today) {
        console.log("🔄 [DAILY RESET] New day detected - triggering intelligent re-ranking...");
        
        try {
          // Trigger the re-rank API to recalculate rankings for the new day
          // This ensures people contacted yesterday drop in priority,
          // and people who need attention rise up
          const response = await authFetch('/api/v1/speedrun/re-rank', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              completedCount: 0,
              isDailyReset: true,
              trigger: 'daily_reset',
              timestamp: new Date().toISOString()
            }),
          });
          
          if (response.ok) {
            console.log("✅ [DAILY RESET] Re-ranking completed successfully");
          } else {
            console.warn("⚠️ [DAILY RESET] Re-ranking failed, using existing rankings");
          }
        } catch (error) {
          console.error("❌ [DAILY RESET] Error triggering re-rank:", error);
        }
        
        // After re-ranking, clear cache and load fresh data
        localStorage.setItem('speedrun-last-reset', today);
        loadFreshData();
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