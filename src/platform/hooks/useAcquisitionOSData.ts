/**
 * 🚀 ACQUISITION OS DATA HOOK - UNIFIED CACHE SYSTEM
 * Uses the new unified caching system for optimal performance
 */

import { useCallback, useState, useEffect } from "react";
import { UnifiedUser, Workspace } from "@/platform/auth-unified";
import { safeApiFetch } from "@/platform/safe-api-fetch";
import { useAdrataData } from "@/platform/hooks/useAdrataData";
import { cache } from "@/platform/services/unified-cache";

// Types for better type safety
interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  status: string;
  source: string;
  notes?: string;
  createdAt: string;
  nextAction?: string;
  nextActionDate?: string;
  enrichmentScore?: number;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  type?: string;
  buyerGroupRole?: string;
  location?: string;
  currentStage?: string;
}

interface DataLoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  lastLoadTime: string | null;
}

interface UseAcquisitionOSDataProps {
  authUser: UnifiedUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  activeWorkspace: Workspace | null;
}

interface UseAcquisitionOSDataReturn {
  acquireData: {
    leads: Lead[];
    prospects: any[];
    opportunities: any[];
    accounts: any[];
    contacts: any[];
    partnerships: any[];
    customers: any[];
    sellers: any[]; // 🆕 FIX: Add sellers to interface
    buyerGroups: any[];
    catalyst: any[];
    calendar: any[];
    champions: any[];
    decisionMakers: any[];
    speedrunItems: any[];
    counts: {
      leads: number;
      prospects: number;
      opportunities: number;
      accounts: number;
      people: number;
      partners: number;
      customers: number;
      sellers: number; // 🆕 FIX: Add sellers count to interface
      speedrun: number; // 🆕 FIX: Add speedrun count to interface
    };
  };
  loading: DataLoadingState;
  dataSource: string;
  refreshData: () => Promise<void>;
  clearDataCache: () => void;
}

/**
 * 🚀 ACQUISITION OS DATA HOOK - UNIFIED CACHE SYSTEM
 * Uses the new unified caching system for optimal performance
 */
export function useAcquisitionOSData(
  props: UseAcquisitionOSDataProps,
): UseAcquisitionOSDataReturn {
  const { authUser, isAuthenticated, isAuthLoading, activeWorkspace } = props;

  // Simplified cache key - let useAdrataData handle workspace-specific caching
  // Add version to force cache refresh when data transformation is updated
  const cacheKey = authUser?.id && activeWorkspace?.id ? 
    `acquisition-os:v3:${activeWorkspace.id}:${authUser.id}` : null;

  // Helper function to map API data to acquisition format
  const mapApiDataToAcquisitionFormat = useCallback((apiData: any) => {
    // Transform leads and prospects to ensure consistent field mapping
    const transformPersonData = (records: any[]) => {
      return records.map(record => ({
        ...record,
        name: record.fullName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown',
        // Ensure firstName and lastName are available for display logic
        firstName: record.firstName || record.fullName?.split(' ')[0] || 'Unknown',
        lastName: record.lastName || record.fullName?.split(' ').slice(1).join(' ') || 'Person'
      }));
    };

    // Debug: Log the transformation results
    const transformedLeads = transformPersonData(apiData.leads || []);
    const transformedProspects = transformPersonData(apiData.prospects || []);
    
    console.log('🔍 [DATA TRANSFORMATION DEBUG] Transformed leads sample:', transformedLeads.slice(0, 2).map(item => ({
      id: item.id,
      fullName: item.fullName,
      firstName: item.firstName,
      lastName: item.lastName,
      name: item.name,
      company: item.company
    })));
    
    console.log('🔍 [DATA TRANSFORMATION DEBUG] Transformed prospects sample:', transformedProspects.slice(0, 2).map(item => ({
      id: item.id,
      fullName: item.fullName,
      firstName: item.firstName,
      lastName: item.lastName,
      name: item.name,
      company: item.company
    })));

    return {
      leads: transformedLeads,
      prospects: transformedProspects,
      opportunities: apiData.opportunities || [],
      companies: apiData.companies || [], // Use companies directly
      people: apiData.people || [], // Use people directly
      partnerships: apiData.partners || [], // API uses 'partners', interface expects 'partnerships'
      customers: apiData.customers || [],
      sellers: apiData.sellers || [], // 🆕 FIX: Include sellers data
      buyerGroups: apiData.buyerGroups || [],
      catalyst: apiData.catalyst || [],
      calendar: apiData.calendar || [],
      champions: apiData.champions || [],
      decisionMakers: apiData.decisionMakers || [],
      speedrunItems: apiData.speedrunItems || [],
      // Include counts for the left panel
      counts: apiData.counts || {},
    };
  }, []);

  // Fetch function for unified data
  const fetchAcquisitionData = useCallback(async () => {
    console.log('🚀 [ACQUISITION OS DATA] fetchAcquisitionData called with:', {
      authUserId: authUser?.id,
      activeWorkspaceId: activeWorkspace?.id
    });
    
    // Check if we're in demo mode
    const isDemoMode = typeof window !== "undefined" && window.location.pathname.startsWith('/demo/');
    
    if (!activeWorkspace?.id) {
      console.error('❌ [ACQUISITION OS DATA] Missing workspace ID:', {
        hasActiveWorkspaceId: !!activeWorkspace?.id
      });
      throw new Error('Workspace is required');
    }
    
    // In demo mode, we can proceed without authUser
    if (!isDemoMode && !authUser?.id) {
      console.error('❌ [ACQUISITION OS DATA] Missing user ID (non-demo mode):', {
        hasAuthUserId: !!authUser?.id,
        isDemoMode
      });
      throw new Error('User is required in non-demo mode');
    }

    // Get the current session to include authentication
    const { UnifiedAuthService } = await import('@/platform/auth/service');
    const session = await UnifiedAuthService.getSession();
    
    // 🆕 IMPROVED AUTHENTICATION HANDLING: Better error handling for missing/invalid tokens
    if (!session?.accessToken) {
      console.warn('⚠️ [AUTH] No authentication token available, attempting unauthenticated request');
      
      // Fallback to unauthenticated request with explicit workspace/user parameters
      const url = new URL('/api/data/unified', window.location.origin);
      url.searchParams.set('type', 'dashboard');
      url.searchParams.set('action', 'get');
      url.searchParams.set('forceRefresh', 'true');
      url.searchParams.set('workspaceId', activeWorkspace.id);
      
      // In demo mode, use a demo user ID, otherwise use the authenticated user ID
      const userId = isDemoMode ? 'demo-user-2025' : authUser.id;
      url.searchParams.set('userId', userId);
      
      const result = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!result.ok) {
        console.error(`❌ [API ERROR] Unauthenticated request failed: ${result.status} ${result.statusText}`);
        throw new Error(`API error: ${result.status} - ${result.statusText}`);
      }

      const response = await result.json();
      if (!response.success) {
        throw new Error(response.error || 'API request failed');
      }
      
      const apiData = response.data || {};
      return mapApiDataToAcquisitionFormat(apiData);
    }

    // 🆕 IMPROVED JWT TOKEN VALIDATION: Better error handling and fallback
    let useAuthenticatedRequest = true;
    try {
      const tokenPayload = JSON.parse(atob(session.accessToken.split('.')[1]));
      const tokenWorkspaceId = tokenPayload.workspaceId;
      const tokenExp = tokenPayload.exp;
      
      // Check if token is expired
      if (tokenExp && Date.now() >= tokenExp * 1000) {
        console.warn('⚠️ [JWT] Token is expired, falling back to unauthenticated request');
        useAuthenticatedRequest = false;
      }
      
      // Check workspace mismatch
      if (tokenWorkspaceId !== activeWorkspace.id) {
        console.warn(`⚠️ [WORKSPACE MISMATCH] JWT token workspace (${tokenWorkspaceId}) doesn't match active workspace (${activeWorkspace.id})`);
        useAuthenticatedRequest = false;
      }
    } catch (error) {
      console.error('❌ [JWT VERIFICATION] Failed to verify JWT token:', error);
      console.log('🔄 [JWT FIX] Falling back to unauthenticated request');
      useAuthenticatedRequest = false;
    }

    // Build URL with parameters
    const url = new URL('/api/data/unified', window.location.origin);
    url.searchParams.set('type', 'dashboard');
    url.searchParams.set('action', 'get');
    url.searchParams.set('forceRefresh', 'true');
    url.searchParams.set('timestamp', Date.now().toString()); // Cache busting
    url.searchParams.set('workspaceId', activeWorkspace.id);
    
    // In demo mode, use a demo user ID, otherwise use the authenticated user ID
    const userId = isDemoMode ? 'demo-user-2025' : authUser.id;
    url.searchParams.set('userId', userId);
    
    console.log('🔍 [ACQUISITION OS DATA] API request details:', {
      isDemoMode,
      workspaceId: activeWorkspace.id,
      userId,
      url: url.toString()
    });
    
    // Make request with or without authentication
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    if (useAuthenticatedRequest) {
      requestOptions['headers'] = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${session.accessToken}`,
      };
    }
    
    const result = await fetch(url.toString(), requestOptions);

    if (!result.ok) {
      console.error(`❌ [API ERROR] Request failed: ${result.status} ${result.statusText}`);
      const errorText = await result.text();
      console.error(`❌ [API ERROR] Error details:`, errorText);
      throw new Error(`API error: ${result.status} - ${result.statusText}`);
    }

    const response = await result.json();
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }
    
    const apiData = response.data || {};

    console.log('🚨🚨🚨 [SPEEDRUN API DEBUG] CRITICAL API RESPONSE CHECK:', {
      success: response.success,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      prospectsCount: apiData.prospects?.length || 0,
      leadsCount: apiData.leads?.length || 0,
      speedrunItemsCount: apiData.speedrunItems?.length || 0,
      speedrunItemsExists: !!apiData.speedrunItems,
      speedrunItemsType: typeof apiData.speedrunItems,
      speedrunItemsIsArray: Array.isArray(apiData.speedrunItems),
      rawSpeedrunItems: apiData.speedrunItems,
      counts: apiData.counts,
      speedrunCount: apiData.counts?.speedrun,
      fullApiData: apiData
    });

    // Map the API response to the expected structure
    const mappedData = mapApiDataToAcquisitionFormat(apiData);

    console.log('📊 [ACQUISITION OS DATA] Mapped data:', {
      prospectsLength: mappedData.prospects.length,
      leadsLength: mappedData.leads.length,
      speedrunItemsLength: mappedData.speedrunItems.length,
      counts: mappedData.counts,
      speedrunCount: mappedData.counts?.speedrun
    });

    return mappedData;
  }, [authUser?.id, activeWorkspace?.id]);

  // Debug the enabled condition
  const enabled = isAuthenticated && !isAuthLoading && !!authUser?.id && !!activeWorkspace?.id;
  console.log('🔍 [ACQUISITION OS DATA] Enabled condition check:', {
    isAuthenticated,
    isAuthLoading,
    hasAuthUserId: !!authUser?.id,
    hasActiveWorkspaceId: !!activeWorkspace?.id,
    enabled,
    authUserId: authUser?.id,
    activeWorkspaceId: activeWorkspace?.id
  });

  // Use unified data hook
  const { 
    data: acquireData, 
    isLoading, 
    error, 
    refresh,
    clearCache 
  } = useAdrataData(cacheKey, fetchAcquisitionData, {
    ttl: 300000, // 5 minutes
    priority: 'high',
    tags: ['acquisition-os', activeWorkspace?.id || '', authUser?.id || ''],
    revalidateOnReconnect: true,
    enabled,
    // 🆕 CRITICAL FIX: Pass workspace and user IDs for workspace-specific caching
    workspaceId: activeWorkspace?.id,
    userId: authUser?.id
  });

  // 🧹 WORKSPACE SWITCH DETECTION: Force refresh when workspace changes
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  
  useEffect(() => {
    if (activeWorkspace?.id && activeWorkspace.id !== lastWorkspaceId && lastWorkspaceId !== null) {
      console.log(`🔄 [WORKSPACE SWITCH] Detected workspace change from ${lastWorkspaceId} to ${activeWorkspace.id}`);
      
      // Clear cache and force refresh
      clearCache();
      refresh();
      
      setLastWorkspaceId(activeWorkspace.id);
    } else if (activeWorkspace?.id && lastWorkspaceId === null) {
      // Initial load - just set the workspace ID
      setLastWorkspaceId(activeWorkspace.id);
    }
  }, [activeWorkspace?.id, lastWorkspaceId, clearCache, refresh]);

  // 🧹 LISTEN FOR WORKSPACE SWITCH EVENTS: Force refresh when workspace switch event is fired
  useEffect(() => {
    const handleWorkspaceSwitch = (event: CustomEvent) => {
      const { workspaceId } = event.detail;
      if (workspaceId && workspaceId !== lastWorkspaceId) {
        console.log(`🔄 [WORKSPACE SWITCH EVENT] Received workspace switch event for: ${workspaceId}`);
        clearCache();
        refresh();
        setLastWorkspaceId(workspaceId);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('adrata-workspace-switched', handleWorkspaceSwitch as EventListener);
      return () => {
        window.removeEventListener('adrata-workspace-switched', handleWorkspaceSwitch as EventListener);
      };
    }
  }, [lastWorkspaceId, clearCache, refresh]);

  // Session token change detection removed - simplified cache key handles this automatically

  // Transform loading state
  const loading: DataLoadingState = {
    isLoading,
    isLoaded: !isLoading && !error && !!acquireData,
    error: error?.message || null,
    lastLoadTime: acquireData ? new Date().toISOString() : null,
  };

  const dataSource = acquireData ? "unified-cache" : "none";

  // Refresh function
  const refreshData = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Clear cache function
  const clearDataCache = useCallback(() => {
    clearCache();
  }, [clearCache]);

  return {
    acquireData: acquireData || {
      leads: [],
      prospects: [],
      opportunities: [],
      accounts: [],
      contacts: [],
      partnerships: [],
      customers: [],
      sellers: [], // 🆕 FIX: Add sellers to fallback data
      buyerGroups: [],
      catalyst: [],
      calendar: [],
      champions: [],
      decisionMakers: [],
      speedrunItems: [],
      counts: {
        leads: 0,
        prospects: 0,
        opportunities: 0,
        accounts: 0,
        contacts: 0,
        partners: 0,
        customers: 0,
        sellers: 0, // 🆕 FIX: Add sellers count to fallback data
        speedrun: 0, // 🆕 FIX: Add speedrun count to fallback data
      },
    },
    loading,
    dataSource,
    refreshData,
    clearDataCache,
  };
}