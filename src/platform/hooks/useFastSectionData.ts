/**
 * 🚀 FAST SECTION DATA HOOK - LIGHTNING SPEED SECTION LOADING
 * 
 * Ultra-fast hook for loading specific section data only
 * Replaces heavy acquisition data for middle panel sections
 * 
 * Performance Target: <500ms response time per section
 */

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useWorkspaceContext } from '@/platform/hooks/useWorkspaceContext';
import { authFetch } from '@/platform/api-fetch';

// 🛠️ DEVELOPMENT: Mock data generator for when API is unavailable
function generateMockData(section: string, limit: number): any[] {
  const mockData = [];
  const baseNames = {
    companies: ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Future Systems'],
    people: ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown'],
    leads: ['Sarah Connor', 'John Wick', 'Jane Foster', 'Mike Tyson', 'David Lee'],
    prospects: ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'Dan Wilson', 'Eve Brown']
  };
  
  const names = baseNames[section as keyof typeof baseNames] || baseNames.people;
  
  for (let i = 0; i < Math.min(limit, 20); i++) {
    mockData.push({
      id: `mock-${section}-${i + 1}`,
      name: names[i % names.length],
      company: section === 'companies' ? names[i % names.length] : 'Sample Company',
      email: `user${i + 1}@example.com`,
      rank: i + 1,
      createdAt: new Date().toISOString()
    });
  }
  
  return mockData;
}

interface UseFastSectionDataReturn {
  data: any[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

/**
 * 🚀 FAST SECTION DATA HOOK
 * Provides instant section data for middle panel with smart caching
 */
export function useFastSectionData(section: string, limit: number = 30): UseFastSectionDataReturn {
  console.log(`🚀 [FAST SECTION DATA] Hook initialized for section: ${section}, limit: ${limit}`);
  
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { workspaceId, userId, isLoading: workspaceLoading, error: workspaceError } = useWorkspaceContext();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());

  const fetchSectionData = useCallback(async () => {
    console.log(`🔍 [FAST SECTION DATA] Hook called for ${section}:`, {
      workspaceId: !!workspaceId,
      userId: !!userId,
      authLoading,
      hasWorkspaceId: !!workspaceId,
      hasUserId: !!userId,
      alreadyLoaded: loadedSections.has(section),
      loadedSections: Array.from(loadedSections),
      actualWorkspaceId: workspaceId,
      actualUserId: userId
    });
    
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

    // 🚀 PERFORMANCE: Skip if we already loaded this section
    if (loadedSections.has(section)) {
      console.log(`⚡ [FAST SECTION DATA] Skipping fetch - section ${section} already loaded`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 🚀 PERFORMANCE: Use v1 APIs for better performance and consistency
    let url: string = '';
    
    try {
      console.log(`🚀 [FAST SECTION DATA] Loading ${section} data for workspace:`, workspaceId);
      
      switch (section) {
        case 'speedrun':
          url = `/api/v1/speedrun?limit=${limit}`;
          break;
        case 'leads':
          url = `/api/v1/people?section=leads&limit=${limit}`;
          break;
        case 'prospects':
          url = `/api/v1/people?section=prospects&limit=${limit}`;
          break;
        case 'opportunities':
          url = `/api/v1/people?section=opportunities&limit=${limit}`;
          break;
        case 'people':
          url = `/api/v1/people?limit=${limit}`;
          break;
        case 'companies':
          url = `/api/v1/companies?limit=${limit}`;
          break;
        default:
          // Fallback to old section API for unsupported sections
          const timestamp = Date.now();
          url = `/api/data/section?section=${section}&limit=${limit}&t=${timestamp}`;
          break;
      }
      
      console.log(`🔗 [FAST SECTION DATA] Making authenticated request to:`, url);
      console.log(`🔍 [FAST SECTION DATA] Request context:`, {
        section,
        url,
        workspaceId,
        userId,
        hasCredentials: typeof window !== 'undefined' && document.cookie.length > 0
      });
      
      // Use direct fetch with credentials instead of authFetch with problematic fallback
      const response = await fetch(url, { credentials: 'include' });
      
      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error(`❌ [FAST SECTION DATA] JSON parsing error for ${section}:`, {
          jsonError,
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseText: await response.text()
        });
        throw new Error(`Failed to parse JSON response: ${jsonError}`);
      }
      
      console.log(`📡 [FAST SECTION DATA] Response received:`, result);
      console.log(`📡 [FAST SECTION DATA] Response status:`, response.status);
      console.log(`📡 [FAST SECTION DATA] Response headers:`, Object.fromEntries(response.headers.entries()));
      
      // Add detailed logging to see exact response structure
      console.log(`📡 [FAST SECTION DATA] Full response for ${section}:`, {
        result,
        resultKeys: Object.keys(result || {}),
        hasSuccess: 'success' in (result || {}),
        successValue: result?.success,
        hasData: 'data' in (result || {}),
        dataValue: result?.data,
        dataLength: result?.data?.length,
        hasError: 'error' in (result || {}),
        errorValue: result?.error,
        hasCode: 'code' in (result || {}),
        codeValue: result?.code,
        allKeys: Object.keys(result || {}),
        resultType: typeof result,
        isNull: result === null,
        isUndefined: result === undefined
      });
      
      // Check if we got a valid response
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid API response format');
      }

      // Check if we got an empty object (this indicates an API issue)
      if (Object.keys(result).length === 0) {
        console.error(`❌ [FAST SECTION DATA] API returned empty object for ${section}:`, {
          url,
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          result
        });
        throw new Error('API returned empty response - this may indicate a server-side error');
      }

      // V1 API returns { success: true, data: [...] }
      // But if auth failed, we might get the fallback { success: false }
      if (result.success === false) {
        const errorMsg = result.error || result.message || 'API request failed';
        console.error(`❌ [FAST SECTION DATA] API returned error for ${section}:`, {
          url,
          error: errorMsg,
          code: result.code || 'No error code',
          fullResponse: JSON.stringify(result, null, 2)
        });
        throw new Error(errorMsg);
      }

      // If success field is missing, check for data directly (some APIs don't use success wrapper)
      if (result.success === true || (result.data && Array.isArray(result.data))) {
        // 🚀 V1 API RESPONSE: Handle both v1 and legacy section API responses
        const responseData = result.data || [];
        const responseCount = result.meta?.count || result.meta?.totalCount || responseData.length;
        
        setData(responseData);
        setCount(responseCount);
        setLoadedSections(prev => new Set(prev).add(section));
        
        console.log(`⚡ [FAST SECTION DATA] Loaded ${section} data:`, {
          count: responseCount,
          items: responseData.length,
          responseTime: result.meta?.responseTime,
          firstItem: responseData?.[0] ? {
            rank: responseData[0].rank,
            name: responseData[0].name,
            company: responseData[0].company?.name || responseData[0].company
          } : null
        });
      } else {
        throw new Error(result?.error || 'Failed to load section data');
      }
    } catch (err) {
      // Comprehensive error debugging
      console.log(`🔍 [FAST SECTION DATA] Raw error caught for ${section}:`, {
        err,
        errType: typeof err,
        errConstructor: err?.constructor?.name,
        errPrototype: Object.getPrototypeOf(err),
        errOwnProps: err ? Object.getOwnPropertyNames(err) : 'no err',
        errDescriptors: err ? Object.getOwnPropertyDescriptors(err) : 'no err',
        errStringified: JSON.stringify(err),
        errToString: err?.toString(),
        errValueOf: err?.valueOf?.(),
        stack: (err as any)?.stack
      });
      
      // Better error message extraction
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        errorMessage = (err as any).message || (err as any).error || JSON.stringify(err);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      console.error(`❌ [FAST SECTION DATA] Error loading ${section}:`, {
        error: errorMessage,
        url,
        workspaceId,
        userId,
        fullError: err,
        errorType: typeof err,
        errorConstructor: err?.constructor?.name,
        errorKeys: err && typeof err === 'object' ? Object.keys(err) : 'not an object'
      });
      
      // Don't set error for network failures - just log and continue
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        console.warn(`⚠️ [FAST SECTION DATA] Network error for ${section} - will retry later`);
        
        // In development mode, provide mock data to prevent UI issues
        if (process.env.NODE_ENV === 'development') {
          console.log(`🛠️ [FAST SECTION DATA] Development mode - providing mock data for ${section}`);
          const mockData = generateMockData(section, limit);
          setData(mockData);
          setCount(mockData.length);
          setLoadedSections(prev => new Set(prev).add(section));
        }
        
        setError(null); // Clear any previous errors
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [section, limit, workspaceId, userId, authLoading, workspaceLoading, loadedSections]);

  // 🚀 PERFORMANCE: Only load section data when section changes and not already loaded
  useEffect(() => {
    if (workspaceId && userId && !authLoading && !workspaceLoading && !loadedSections.has(section)) {
      fetchSectionData();
    }
  }, [section, workspaceId, userId, authLoading, workspaceLoading, loadedSections]); // Removed fetchSectionData to prevent infinite loops

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
  }, [error, section]); // Removed fetchSectionData to prevent infinite loops

  // 🚀 PERFORMANCE: Track workspace changes to reset loaded sections only when needed
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Only reset if workspace or user actually changed (not on initial load)
    if (workspaceId && userId && (workspaceId !== lastWorkspaceId || userId !== lastUserId) && lastWorkspaceId !== null) {
      console.log(`🔄 [FAST SECTION DATA] Workspace/user changed, resetting loaded sections for ${section}`);
      setLoadedSections(new Set());
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

  // 🧹 LISTEN FOR WORKSPACE SWITCH EVENTS: Clear cache when workspace switch event is fired
  useEffect(() => {
    const handleWorkspaceSwitch = (event: CustomEvent) => {
      const { workspaceId: newWorkspaceId } = event.detail;
      if (newWorkspaceId && newWorkspaceId !== workspaceId) {
        console.log(`🔄 [FAST SECTION DATA] Received workspace switch event for: ${newWorkspaceId}, clearing ${section} data`);
        setLoadedSections(new Set());
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
  }, [workspaceId, section, fetchSectionData]);

  // 🚀 CACHE OPTIMIZATION: Removed debug force refresh that was causing unnecessary reloads

  return {
    data,
    loading,
    error,
    count,
    refresh: fetchSectionData,
    clearCache: () => {
      setLoadedSections(new Set());
      setData([]);
      setCount(0);
      setError(null);
    }
  };
}
