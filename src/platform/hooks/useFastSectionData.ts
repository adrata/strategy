/**
 * Fast section data hook for loading specific section data
 */

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useWorkspaceContext } from '@/platform/hooks/useWorkspaceContext';
import { authFetch } from '@/platform/api-fetch';

// Global state for tracking loaded sections
const globalLoadedSections = new Set<string>();
const globalSectionData = new Map<string, { data: any[], count: number, timestamp: number }>();

// Mock data generator for development
function generateMockData(section: string, limit: number): any[] {
  const mockData = [];
  const baseNames = {
    companies: ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Future Systems', 'DataCorp', 'CloudTech', 'AI Solutions', 'Blockchain Inc', 'Quantum Labs'],
    people: ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Chen', 'Alex Rodriguez', 'Emma Thompson', 'Chris Anderson', 'Maria Garcia'],
    leads: ['Sarah Connor', 'John Wick', 'Jane Foster', 'Mike Tyson', 'David Lee', 'Anna Smith', 'Tom Wilson', 'Kate Brown', 'Sam Davis', 'Alex Johnson'],
    prospects: ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'Dan Wilson', 'Eve Brown', 'Frank Miller', 'Grace Lee', 'Henry Chen', 'Ivy Wang', 'Jack Taylor']
  };
  
  const names = baseNames[section as keyof typeof baseNames] || baseNames.people;
  
  for (let i = 0; i < Math.min(limit, 20); i++) {
    const baseRecord = {
      id: `mock-${section}-${i + 1}`,
      name: names[i % names.length],
      email: `user${i + 1}@example.com`,
      globalRank: i + 1,
      createdAt: new Date().toISOString(),
      status: section === 'companies' ? 'ACTIVE' : 'LEAD'
    };

    // Add section-specific fields
    if (section === 'companies') {
      mockData.push({
        ...baseRecord,
        website: `https://${names[i % names.length].toLowerCase().replace(/\s+/g, '')}.com`,
        industry: ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail'][i % 5],
        size: ['Small', 'Medium', 'Large', 'Enterprise'][i % 4]
      });
    } else {
      // Generate more realistic company names for people records
      const companyNames = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Future Systems', 'DataCorp', 'CloudTech', 'AI Solutions', 'Blockchain Inc', 'Quantum Labs'];
      mockData.push({
        ...baseRecord,
        company: companyNames[i % companyNames.length],
        jobTitle: ['Manager', 'Director', 'VP', 'CEO', 'CTO'][i % 5],
        fullName: names[i % names.length]
      });
    }
  }
  
  return mockData;
}

interface UseFastSectionDataReturn {
  data: any[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => Promise<void>;
}

/**
 * Fast section data hook with smart caching
 */
export function useFastSectionData(section: string, limit: number = 100): UseFastSectionDataReturn {
  // console.log(`🚀 [FAST SECTION DATA] Hook initialized for section: ${section}, limit: ${limit}`);
  
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useUnifiedAuth();
  const { workspaceId, userId, isLoading: workspaceLoading, error: workspaceError } = useWorkspaceContext();
  const [data, setData] = useState<any[]>(() => {
    // Initialize with global cached data if available
    const cached = globalSectionData.get(section);
    return cached ? cached.data : [];
  });
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have cached data
    const cached = globalSectionData.get(section);
    return !cached || cached.data.length === 0;
  });
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(() => {
    // Initialize with global cached count if available
    const cached = globalSectionData.get(section);
    return cached ? cached.count : 0;
  });

  const fetchSectionData = useCallback(async () => {
    // console.log(`🔍 [FAST SECTION DATA] Hook called for ${section}:`, {
    //   workspaceId: !!workspaceId,
    //   userId: !!userId,
    //   authLoading,
    //   hasWorkspaceId: !!workspaceId,
    //   hasUserId: !!userId,
    //   alreadyLoaded: globalLoadedSections.has(section),
    //   loadedSections: Array.from(globalLoadedSections),
    //   actualWorkspaceId: workspaceId,
    //   actualUserId: userId
    // });
    
    if (!workspaceId || !userId || authLoading || workspaceLoading) {
      console.log(`⏳ [FAST SECTION DATA] Skipping fetch - missing requirements:`, {
        workspaceId: !!workspaceId,
        userId: !!userId,
        authLoading,
        workspaceLoading,
        actualWorkspaceId: workspaceId,
        actualUserId: userId
      });
      setLoading(false);
      return;
    }

    // Don't fetch if user is not authenticated
    if (!isAuthenticated) {
      console.warn(`🔐 [FAST SECTION DATA] User not authenticated for ${section}`);
      setError('Authentication required. Please sign in.');
      setData([]);
      setCount(0);
      setLoading(false);
      return;
    }

    // Skip if we already loaded this section AND have valid data
    if (globalLoadedSections.has(section)) {
      const cachedData = globalSectionData.get(section);
      if (cachedData && cachedData.data.length > 0) {
        // Valid cache exists, skip fetch
        // console.log(`⚡ [FAST SECTION DATA] Skipping fetch - section ${section} already loaded with valid data`);
        setLoading(false);
        return;
      }
      // Cache is empty or invalid, continue to fetch
      console.log(`🔄 [FAST SECTION DATA] Clearing invalid cache for section ${section} - data length: ${cachedData?.data.length || 0}`);
      globalLoadedSections.delete(section);
    }

    // Only set loading to true if we don't have data yet
    if (data.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      // console.log(`🚀 [FAST SECTION DATA] Loading ${section} data for workspace:`, workspaceId);
      
      // 🚀 PROGRESSIVE LOADING: Load initial batch first, then full dataset
      const timestamp = Date.now();
      const initialLimit = Math.min(10, limit); // Show first 10 records immediately
      let url: string;
      let fullUrl: string;
      
      // Map section names to v1 API endpoints
      switch (section) {
        case 'companies':
          url = `/api/v1/companies?limit=${initialLimit}&t=${timestamp}`;
          fullUrl = `/api/v1/companies?limit=${limit}&t=${timestamp}`;
          break;
        case 'people':
          url = `/api/v1/people?limit=${initialLimit}&t=${timestamp}`;
          fullUrl = `/api/v1/people?limit=${limit}&t=${timestamp}`;
          break;
        case 'actions':
          url = `/api/v1/actions?limit=${initialLimit}&t=${timestamp}`;
          fullUrl = `/api/v1/actions?limit=${limit}&t=${timestamp}`;
          break;
        case 'leads':
          url = `/api/v1/people?status=LEAD&limit=${initialLimit}&t=${timestamp}`;
          fullUrl = `/api/v1/people?status=LEAD&limit=${limit}&t=${timestamp}`;
          break;
        case 'prospects':
          url = `/api/v1/people?status=PROSPECT&limit=${initialLimit}&t=${timestamp}`;
          fullUrl = `/api/v1/people?status=PROSPECT&limit=${limit}&t=${timestamp}`;
          break;
        case 'opportunities':
          url = `/api/v1/companies?status=OPPORTUNITY&limit=${initialLimit}&t=${timestamp}`;
          fullUrl = `/api/v1/companies?status=OPPORTUNITY&limit=${limit}&t=${timestamp}`;
          break;
        case 'speedrun':
          url = `/api/data/section?section=speedrun&limit=${initialLimit}&t=${timestamp}`;
          fullUrl = `/api/data/section?section=speedrun&limit=${limit}&t=${timestamp}`;
          break;
        default:
          // No v1 API available for this section yet
          console.warn(`⚠️ [FAST SECTION DATA] No v1 API available for section: ${section}`);
          throw new Error(`No v1 API available for section: ${section}`);
      }
      
      // console.log(`🔗 [FAST SECTION DATA] Making authenticated request to:`, url);
      
      const result = await authFetch(url);
      
      console.log(`📡 [FAST SECTION DATA] API Response for ${section}:`, {
        success: result?.success,
        dataLength: result?.data ? (Array.isArray(result.data) ? result.data.length : result.data.data?.length || 0) : 0,
        data: result?.data ? (Array.isArray(result.data) ? result.data.slice(0, 2) : result.data.data?.slice(0, 2) || []) : [],
        totalCount: result?.data ? (result.data.totalCount || result.data.count || result.meta?.pagination?.totalCount) : 0
      });
      
      // Check if we got a successful response
      if (!result) {
        throw new Error('No response from API');
      }
      
      if (result.success) {
        // Handle both v1 API and section API response formats
        let dataArray, totalCount;
        
        if (section === 'speedrun') {
          // Section API returns: { success: true, data: { data: [...records...], totalCount: X } }
          const sectionData = result.data;
          dataArray = Array.isArray(sectionData?.data) ? sectionData.data : [];
          totalCount = sectionData?.totalCount || dataArray.length;
        } else {
          // v1 API returns: { success: true, data: [...records...], meta: { pagination: { totalCount: X } } }
          dataArray = Array.isArray(result.data) ? result.data : [];
          totalCount = result.meta?.pagination?.totalCount || dataArray.length;
        }
        
        // 🚀 PROGRESSIVE LOADING: Set initial data immediately
        console.log(`✅ [FAST SECTION DATA] Setting data for ${section}:`, {
          dataArrayLength: dataArray.length,
          totalCount,
          firstRecord: dataArray[0] ? {
            id: dataArray[0].id,
            name: dataArray[0].fullName || dataArray[0].name,
            status: dataArray[0].status
          } : null
        });
        setData(dataArray);
        setCount(totalCount);
        setLoading(false); // Show initial data immediately
        
        // If we loaded less than the full limit, load the rest in background
        if (dataArray.length < limit && dataArray.length < totalCount) {
          console.log(`🚀 [PROGRESSIVE LOADING] Loading remaining ${section} data in background...`);
          
          // Load full dataset in background
          setTimeout(async () => {
            try {
              const fullResult = await authFetch(fullUrl);
              
              if (fullResult.success) {
                let fullDataArray, fullTotalCount;
                
                if (section === 'speedrun') {
                  // Section API response format
                  const sectionData = fullResult.data;
                  fullDataArray = Array.isArray(sectionData?.data) ? sectionData.data : [];
                  fullTotalCount = sectionData?.totalCount || fullDataArray.length;
                } else {
                  // v1 API response format
                  fullDataArray = Array.isArray(fullResult.data) ? fullResult.data : [];
                  fullTotalCount = fullResult.meta?.pagination?.totalCount || fullDataArray.length;
                }
                
                // Update with full dataset
                setData(fullDataArray);
                setCount(fullTotalCount);
                globalSectionData.set(section, { data: fullDataArray, count: fullTotalCount, timestamp: Date.now() });
                
                console.log(`✅ [PROGRESSIVE LOADING] Loaded full ${section} dataset: ${fullDataArray.length} records`);
              }
            } catch (error) {
              console.warn(`⚠️ [PROGRESSIVE LOADING] Failed to load full ${section} dataset:`, error);
            }
          }, 100); // Small delay to let initial render complete
        } else {
          // Full dataset loaded, cache it
          globalLoadedSections.add(section);
          globalSectionData.set(section, { data: dataArray, count: totalCount, timestamp: Date.now() });
        }
        
        // console.log(`⚡ [FAST SECTION DATA] Loaded ${section} data:`, {
        //   count: dataArray.length,
        //   totalCount: totalCount,
        //   items: dataArray.length,
        //   responseTime: result.meta?.responseTime,
        //   firstItem: dataArray[0] ? {
        //     rank: dataArray[0].rank || dataArray[0].globalRank,
        //     name: dataArray[0].name,
        //     company: dataArray[0].company?.name || dataArray[0].company
        //   } : null
        // });
      } else {
        // API returned success: false or no data
        const errorMsg = result.error || result.message || 'No data available';
        console.warn(`⚠️ [FAST SECTION DATA] API returned error for ${section}:`, errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Handle authentication errors specifically
      if (errorMessage.includes('Authentication required') || errorMessage.includes('AUTH_REQUIRED') || errorMessage.includes('401')) {
        console.error(`🔐 [FAST SECTION DATA] Authentication failed for ${section}:`, errorMessage);
        setError('Authentication required. Please sign in again.');
        setData([]);
        setCount(0);
        setLoading(false);
        return;
      }
      
      // Handle empty workspace (0 records is OK, not an error)
      if (errorMessage.includes('No data available')) {
        console.log(`📊 [FAST SECTION DATA] No data for ${section} (empty workspace)`);
        setData([]);
        setCount(0);
        setError(null); // Clear error - empty state is not an error
        globalLoadedSections.add(section);
        globalSectionData.set(section, { data: [], count: 0, timestamp: Date.now() });
        setLoading(false);
        return;
      }
      
      // Log actual errors (not empty states)
      console.error(`❌ [FAST SECTION DATA] Error loading ${section}:`, errorMessage, err);
      
      // Handle other errors
      console.error(`❌ [FAST SECTION DATA] Unhandled error for ${section}:`, errorMessage);
      setError(errorMessage);
      setData([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [section, limit, workspaceId, userId, authLoading, workspaceLoading, isAuthenticated]);

  // 🚀 PERFORMANCE: Only load section data when section changes and not already loaded
  useEffect(() => {
    if (workspaceId && userId && !authLoading && !workspaceLoading && isAuthenticated && !globalLoadedSections.has(section)) {
      fetchSectionData();
    }
  }, [section, workspaceId, userId, authLoading, workspaceLoading, isAuthenticated, fetchSectionData]);

  // 🚀 RETRY: Retry failed network requests after a delay
  useEffect(() => {
    if (error && error.includes('Failed to fetch')) {
      const retryTimeout = setTimeout(() => {
        console.log(`🔄 [FAST SECTION DATA] Retrying ${section} after network error...`);
        setError(null);
        fetchSectionData();
      }, 5000); // Retry after 5 seconds

      return () => clearTimeout(retryTimeout);
    }
    return undefined;
  }, [error, section]); // Removed fetchSectionData to prevent infinite loops

  // 🚀 PERFORMANCE: Track workspace changes to reset loaded sections only when needed
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Only reset if workspace or user actually changed (not on initial load)
    if (workspaceId && userId && (workspaceId !== lastWorkspaceId || userId !== lastUserId) && lastWorkspaceId !== null) {
      console.log(`🔄 [FAST SECTION DATA] Workspace/user changed, resetting global loaded sections`);
      globalLoadedSections.clear();
      globalSectionData.clear();
      setData([]); // Clear data to prevent showing stale data
      setCount(0);
      setLastWorkspaceId(workspaceId);
      setLastUserId(userId);
    } else if (workspaceId && userId && lastWorkspaceId === null) {
      // Initial load - just set the workspace/user IDs, don't reset loaded sections
      setLastWorkspaceId(workspaceId);
      setLastUserId(userId);
    }
  }, [workspaceId, userId, lastWorkspaceId, lastUserId, section]);

  // Cache for any workspace that was previously blocked by demo workspace check
  useEffect(() => {
    // Clear cache for any section that was previously loaded with empty data
    // This fixes the issue where sections were marked as "loaded" but had no data
    // due to the incorrect demo workspace blocking logic
    if (workspaceId && globalLoadedSections.has(section)) {
      const cachedData = globalSectionData.get(section);
      // If the cached data is empty, clear it to allow re-fetching
      if (cachedData && (cachedData.data.length === 0 || cachedData.count === 0)) {
        console.log(`🔄 [FAST SECTION DATA] Clearing empty cache for workspace ${workspaceId}, section: ${section}`);
        globalLoadedSections.delete(section);
        globalSectionData.delete(section);
        setData([]);
        setCount(0);
        setError(null);
      }
    }
  }, [workspaceId, section]);

  // 🧹 LISTEN FOR WORKSPACE SWITCH EVENTS: Clear cache when workspace switch event is fired
  useEffect(() => {
    const handleWorkspaceSwitch = (event: CustomEvent) => {
      const { workspaceId: newWorkspaceId } = event.detail;
      if (newWorkspaceId && newWorkspaceId !== workspaceId) {
        console.log(`🔄 [FAST SECTION DATA] Received workspace switch event for: ${newWorkspaceId}, clearing global data`);
        globalLoadedSections.clear();
        globalSectionData.clear();
        setData([]); // Clear data to prevent showing stale data
        setCount(0);
        setError(null);
        // Force refresh for new workspace
        fetchSectionData();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('adrata-workspace-switched', handleWorkspaceSwitch as EventListener);
      return () => {
        window.removeEventListener('adrata-workspace-switched', handleWorkspaceSwitch as EventListener);
      };
    }
    return undefined;
  }, [workspaceId, section, fetchSectionData]);

  // 🚀 CACHE OPTIMIZATION: Removed debug force refresh that was causing unnecessary reloads

  return {
    data,
    loading,
    error,
    count,
    refresh: fetchSectionData
  };
}
