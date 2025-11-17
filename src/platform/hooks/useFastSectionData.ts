/**
 * 🚀 FAST SECTION DATA HOOK - LIGHTNING SPEED SECTION LOADING
 * 
 * Ultra-fast hook for loading specific section data only
 * Replaces heavy acquisition data for middle panel sections
 * 
 * Performance Target: <500ms response time per section
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useWorkspaceContext } from '@/platform/hooks/useWorkspaceContext';
import { authFetch } from '@/platform/api-fetch';


interface UseFastSectionDataReturn {
  data: any[];
  loading: boolean;
  error: string | null;
  count: number;
  isLoadingMore: boolean;
  hasLoadedInitial: boolean;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

/**
 * 🚀 FAST SECTION DATA HOOK
 * Provides instant section data for middle panel with smart caching
 */
// Progressive loading constants
const INITIAL_PAGE_SIZE = 100; // First page for instant loading
const PROGRESSIVE_LOAD_DELAY = 500; // Delay before loading remaining pages

// 🔧 CACHE TTL CONSTANTS: Centralized TTL values for consistent cache behavior
const CACHE_TTL_SPEEDRUN = 2 * 60 * 1000; // 2 minutes for speedrun (shorter TTL for freshness)
const CACHE_TTL_DEFAULT = 5 * 60 * 1000; // 5 minutes for other sections
const CACHE_VERSION = 3; // Increment this when sorting/data structure changes - v3: pagination count fix

export function useFastSectionData(section: string, limit: number = 30, osType?: 'acquisition' | 'retention' | 'expansion' | 'revenue'): UseFastSectionDataReturn {
  const DEBUG_PIPELINE = process.env.NODE_ENV === 'development' && false; // Enable manually when needed
  if (DEBUG_PIPELINE) console.log(`🚀 [FAST SECTION DATA] Hook initialized for section: ${section}, limit: ${limit}`);
  
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  
  // 🔧 CRITICAL FIX: Use authUser directly like useFastCounts does, instead of async useWorkspaceContext
  // This ensures workspaceId and userId are available immediately for API calls
  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  // 🔧 CRITICAL FIX: Use ref instead of state for loadedSections to prevent infinite loops
  // loadedSections is only used for tracking, not for rendering, so it doesn't need to be state
  const loadedSectionsRef = useRef<Set<string>>(new Set());
  // 🔧 RACE CONDITION FIX: Track if progressive loading useEffect already hydrated from cache
  // This prevents fetchSectionData from also checking cache and causing duplicate fetches
  const hasHydratedRef = useRef<boolean>(false);

  const fetchSectionData = useCallback(async (forceRefresh: boolean = false, initialOnly: boolean = false) => {
    if (DEBUG_PIPELINE) console.log(`🔍 [FAST SECTION DATA] Hook called for ${section}:`, {
      workspaceId: !!workspaceId,
      userId: !!userId,
      authLoading,
      hasWorkspaceId: !!workspaceId,
      hasUserId: !!userId,
      alreadyLoaded: loadedSectionsRef.current.has(section),
      loadedSections: Array.from(loadedSectionsRef.current),
      actualWorkspaceId: workspaceId,
      actualUserId: userId,
      forceRefresh
    });
    
    if (!workspaceId || !userId || authLoading) {
      if (DEBUG_PIPELINE) console.log(`⏳ [FAST SECTION DATA] Skipping fetch - missing requirements:`, {
        workspaceId: !!workspaceId,
        userId: !!userId,
        authLoading,
        actualWorkspaceId: workspaceId,
        actualUserId: userId
      });
      setLoading(false);
      return;
    }

    // 🚀 CRITICAL FIX: Check for force-refresh flags FIRST before any caching logic
    // This ensures that when a field is saved, we ALWAYS fetch fresh data instead of stale cache
    let shouldForceRefresh = forceRefresh;
    if (typeof window !== 'undefined' && !forceRefresh) {
      // 🚀 INDUSTRY BEST PRACTICE: Only clear section-level flags, ignore record-specific flags
      // Record-specific flags (like force-refresh-companies-01K8B82...) are only read/cleared by loadDirectRecord
      // This prevents race conditions where useFastSectionData clears flags before PipelineDetailPage can read them
      const sectionLevelFlag = `force-refresh-${section}`;
      const hasSectionLevelFlag = sessionStorage.getItem(sectionLevelFlag);
      
      if (hasSectionLevelFlag) {
        console.log(`🔄 [FAST SECTION DATA] Section-level force refresh detected for ${section}`, {
          section,
          sectionLevelFlag,
          workspaceId
        });
        
        // Remove only the section-level flag (not record-specific flags)
        sessionStorage.removeItem(sectionLevelFlag);
        console.log(`🗑️ [FAST SECTION DATA] Removed section-level force-refresh key: ${sectionLevelFlag}`);
        
        // Clear localStorage cache to prevent stale data
        const storageKey = `adrata-${section}-${workspaceId}`;
        localStorage.removeItem(storageKey);
        console.log(`🗑️ [FAST SECTION DATA] Cleared localStorage cache: ${storageKey}`);
        
        // Clear loaded sections to force refetch
        loadedSectionsRef.current.delete(section);
        console.log(`🔄 [FAST SECTION DATA] Cleared section ${section} from loadedSections:`, {
          remaining: Array.from(loadedSectionsRef.current)
        });
        
        // Set flag to skip all caching below
        shouldForceRefresh = true;
      }
    }

    // 🚀 SMART CACHE: Use localStorage cache with TTL checking for instant loading
    // Speedrun now uses cache but with shorter TTL (2 minutes) and background prefetch
    // 🔧 RACE CONDITION FIX: Skip cache check if progressive loading useEffect already hydrated
    // This prevents duplicate cache checks and duplicate fetches
    
    if (!shouldForceRefresh && !hasHydratedRef.current) {
      try {
        const storageKey = `adrata-${section}-${workspaceId}`;
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.data)) {
            // Check cache version - invalidate if version mismatch
            if (parsed.version !== CACHE_VERSION) {
              console.log(`🔄 [FAST SECTION DATA] Cache version mismatch for ${section}, invalidating:`, {
                cachedVersion: parsed.version,
                currentVersion: CACHE_VERSION
              });
              localStorage.removeItem(storageKey);
            } else {
              // Check cache age - use centralized TTL constants
              const cacheAge = Date.now() - (parsed.ts || 0);
              const maxAge = section === 'speedrun' ? CACHE_TTL_SPEEDRUN : CACHE_TTL_DEFAULT;
              
              if (cacheAge < maxAge) {
                // Use cached count if available, otherwise fall back to data.length
                const cachedCount = parsed.count || parsed.data.length;
                console.log(`⚡ [FAST SECTION DATA] Loading ${section} from localStorage cache:`, {
                  section,
                  cachedDataLength: parsed.data.length,
                  cachedCount: cachedCount,
                  cacheTimestamp: parsed.ts,
                  cacheVersion: parsed.version,
                  cacheAge: Math.round(cacheAge / 1000) + 's'
                });
                setData(parsed.data);
                setCount(cachedCount); // Use cached count, not data.length
                setLoading(false);
                setError(null);
                // Still mark as loaded in memory cache
                loadedSectionsRef.current.add(section);
                return;
              } else {
                console.log(`🔄 [FAST SECTION DATA] Cache expired for ${section}, fetching fresh data:`, {
                  cacheAge: Math.round(cacheAge / 1000) + 's',
                  maxAge: Math.round(maxAge / 1000) + 's'
                });
                localStorage.removeItem(storageKey);
              }
            }
          }
        }
      } catch (e) {
        console.warn(`⚠️ [FAST SECTION DATA] Failed to load ${section} from cache:`, e);
      }
    } else if (hasHydratedRef.current && !shouldForceRefresh) {
      console.log(`⏭️ [FAST SECTION DATA] Skipping cache check - already hydrated by progressive loading useEffect`);
    }

    // 🚀 PERFORMANCE: Skip if we already loaded this section (unless force refresh)
    // Now includes speedrun - relies on cache TTL and background prefetch for freshness
    if (!shouldForceRefresh && loadedSectionsRef.current.has(section)) {
      console.log(`⚡ [FAST SECTION DATA] Skipping fetch - section ${section} already loaded in memory`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 🚀 PERFORMANCE: Use v1 APIs for better performance and consistency
    let url: string = '';
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 [FAST SECTION DATA] Loading ${section} data for workspace:`, workspaceId);
      }
      
      // Add refresh parameter to bypass backend cache when force refreshing
      const refreshParam = shouldForceRefresh ? '&refresh=true' : '';
      
      // Check if we're in PartnerOS mode
      const isPartnerOS = typeof window !== 'undefined' && sessionStorage.getItem('activeSubApp') === 'partneros';
      const partnerosParam = isPartnerOS ? '&partneros=true' : '';
      
      // Add OS type parameter for filtering
      const osTypeParam = osType && osType !== 'revenue' ? `&osType=${osType}` : '';

      switch (section) {
        case 'speedrun':
          url = `/api/v1/speedrun?limit=${limit}${refreshParam}${partnerosParam}${osTypeParam}`;
          break;
        case 'leads':
          // 🔧 FIX: Always fetch 10,000 records like companies (ensures all pages work)
          // Progressive loading caused blank pages when navigating to later pages
          url = `/api/v1/people?section=leads&sortBy=globalRank&sortOrder=desc&limit=10000${refreshParam}${partnerosParam}${osTypeParam}`;
          break;
        case 'prospects':
          // 🔧 FIX: Always fetch 10,000 records like companies (ensures all pages work)
          // Progressive loading caused blank pages when navigating to later pages
          url = `/api/v1/people?section=prospects&sortBy=lastActionDate&sortOrder=asc&limit=10000${refreshParam}${partnerosParam}${osTypeParam}`;
          break;
        case 'opportunities':
          // 🔧 FIX: Always fetch 10,000 records like companies (ensures all pages work)
          // Progressive loading caused blank pages when navigating to later pages
          // Opportunities are companies with status=OPPORTUNITY
          url = `/api/v1/companies?status=OPPORTUNITY&limit=10000${refreshParam}${partnerosParam}${osTypeParam}`;
          break;
        case 'people':
          // 🔧 FIX: Always fetch 10,000 records like companies (ensures all pages work)
          // Progressive loading caused blank pages when navigating to later pages
          url = `/api/v1/people?sortBy=globalRank&sortOrder=desc&limit=${Math.max(limit, 10000)}${refreshParam}${partnerosParam}${osTypeParam}`;
          break;
        case 'companies':
          // For companies, use v1 API with pre-sorting and increased limit
          // Pass workspaceId to ensure correct workspace filtering
          const workspaceParam = workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : '';
          url = `/api/v1/companies?sortBy=name&sortOrder=asc&limit=${Math.max(limit, 10000)}${refreshParam}${workspaceParam}${partnerosParam}${osTypeParam}`;
          break;
        case 'partners':
          url = `/api/v1/partners?limit=${Math.max(limit, 10000)}${refreshParam}${partnerosParam}${osTypeParam}`;
          break;
        case 'clients':
          const clientsWorkspaceParam = workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : '';
          url = `/api/v1/companies?status=CLIENT&limit=${Math.max(limit, 10000)}${refreshParam}${clientsWorkspaceParam}${partnerosParam}${osTypeParam}`;
          break;
        default:
          // Fallback to old section API for unsupported sections
          const timestamp = Date.now();
          url = `/api/data/section?section=${section}&limit=${limit}&t=${timestamp}`;
          break;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 [FAST SECTION DATA] Making authenticated request to:`, url);
        console.log(`🔍 [FAST SECTION DATA] Request context:`, {
          section,
          url,
          workspaceId,
          userId,
          hasCredentials: typeof window !== 'undefined' && document.cookie.length > 0
        });
      }
      
      // Use direct fetch with credentials instead of authFetch with problematic fallback
      const response = await fetch(url, { credentials: 'include' });
      
      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [FAST SECTION DATA] HTTP error for ${section}:`, {
          status: response.status,
          statusText: response.statusText,
          url,
          errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      let result;
      try {
        result = await response.json();
        console.log(`📡 [FAST SECTION DATA] Raw response for ${section}:`, {
          url,
          status: response.status,
          resultKeys: Object.keys(result || {}),
          hasSuccess: 'success' in (result || {}),
          successValue: result?.success,
          hasData: 'data' in (result || {}),
          dataType: typeof result?.data,
          dataIsArray: Array.isArray(result?.data),
          dataHasData: result?.data && typeof result.data === 'object' && 'data' in result.data,
          dataDataIsArray: Array.isArray(result?.data?.data)
        });
      } catch (jsonError) {
        console.error(`❌ [FAST SECTION DATA] JSON parsing error for ${section}:`, {
          jsonError,
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          url
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
        console.error(`❌ [FAST SECTION DATA] Invalid API response format for ${section}:`, {
          url,
          result,
          resultType: typeof result,
          isNull: result === null,
          isUndefined: result === undefined
        });
        throw new Error('Invalid API response format');
      }

      // Check if we got an empty object (this indicates an API issue)
      if (Object.keys(result).length === 0) {
        console.error(`❌ [FAST SECTION DATA] API returned empty object for ${section}:`, {
          url,
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          result,
          workspaceId,
          userId,
          hasCredentials: typeof window !== 'undefined' && document.cookie.length > 0
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

      // Handle both v1 API format (data is array) and data/section format (data.data is array)
      if (result.success === true || result.data) {
        let responseData: any[];
        let responseCount: number;
        
        if (Array.isArray(result.data)) {
          // V1 API format: { success: true, data: [...], meta: { count, totalCount } }
          responseData = result.data;
          // 🔧 PAGINATION FIX: Prioritize totalCount over count for accurate pagination
          // totalCount is the accurate database count, count might be the limited result count
          responseCount = result.meta?.totalCount || result.meta?.pagination?.totalCount || result.meta?.count || responseData.length;
          
          // 🔍 DEBUG: Log count values for leads/people sections to diagnose pagination issues
          if (section === 'leads' || section === 'people') {
            console.log(`🔍 [FAST SECTION DATA] ${section} count extraction:`, {
              section,
              dataLength: responseData.length,
              metaTotalCount: result.meta?.totalCount,
              metaPaginationTotalCount: result.meta?.pagination?.totalCount,
              metaCount: result.meta?.count,
              finalCount: responseCount,
              metaKeys: result.meta ? Object.keys(result.meta) : 'no meta',
              paginationKeys: result.meta?.pagination ? Object.keys(result.meta.pagination) : 'no pagination'
            });
          }
        } else if (result.data && Array.isArray(result.data.data)) {
          // data/section API format: { success: true, data: { data: [...], count, totalCount }, meta }
          responseData = result.data.data;
          responseCount = result.data.totalCount || result.data.count || responseData.length;
        } else {
          throw new Error('Invalid API response format - data is not an array');
        }
        
        // 🔧 PAGINATION FIX: Always show all loaded data
        // Client-side pagination will handle showing the correct page
        // All tables now fetch 10,000 records upfront (like companies) to ensure all pages work
        setData(responseData);
        
        // 🔧 CRITICAL FIX: Preserve the larger count to prevent overwriting correct totals
        // If we already have a count that's larger than the response count, keep it
        // This prevents the count from being reset to 100 when we have the correct total (e.g., 1,355)
        // Check if responseCount came from API meta (not data.length fallback)
        const isFromMeta = !!(result.meta?.totalCount || result.meta?.pagination?.totalCount || result.meta?.count);
        setCount((prevCount) => {
          // If we have a large count (likely correct) and new count is small (likely wrong), preserve the large one
          const isLargeCount = prevCount > 500; // Threshold for "large" counts (leads: 923, people: 1,355, etc.)
          const isSmallCount = responseCount < 200; // Threshold for "small" counts (likely wrong: 100, 102, etc.)
          
          if (isFromMeta && responseCount > prevCount) {
            // API provided a count that's larger than what we have - use it (this is an improvement)
            return responseCount;
          } else if (isLargeCount && isSmallCount) {
            // We have a large count (likely correct) and new count is small (likely wrong) - preserve the large count
            console.log(`🛡️ [FAST SECTION DATA] Preserving large count ${prevCount} over small count ${responseCount} for ${section}`);
            return prevCount;
          } else if (prevCount > 0 && prevCount > responseCount && responseCount === responseData.length) {
            // We already have a larger count and responseCount is just data.length - preserve the larger count
            return prevCount;
          } else if (prevCount > 0 && prevCount > responseCount && isLargeCount) {
            // We have a large count that's larger than response - preserve it (even if response is from meta)
            console.log(`🛡️ [FAST SECTION DATA] Preserving large count ${prevCount} over ${responseCount} for ${section}`);
            return prevCount;
          } else {
            // Use the response count (either it's valid or it's our best guess)
            return responseCount;
          }
        });
        
        // Log for debugging pagination issues - ALL sections for audit
        console.log(`📊 [FAST SECTION DATA] ${section} data loaded:`, {
          initialOnly,
          dataLength: responseData.length,
          totalCount: responseCount,
          prevCount: count, // Log previous count to see if it's being overwritten
          hasAllData: responseData.length >= responseCount,
          isFromMeta: isFromMeta,
          metaTotalCount: result.meta?.totalCount,
          metaPaginationTotalCount: result.meta?.pagination?.totalCount,
          metaCount: result.meta?.count,
          responseCountSource: result.meta?.totalCount ? 'meta.totalCount' : 
                              result.meta?.pagination?.totalCount ? 'meta.pagination.totalCount' :
                              result.meta?.count ? 'meta.count' : 'responseData.length'
        });
        loadedSectionsRef.current.add(section);
        
        // 🚀 PERFORMANCE: Cache data in localStorage (like leads pattern)
        // Always cache full responseData, not just the displayed slice
        try {
          const storageKey = `adrata-${section}-${workspaceId}`;
          // Use centralized CACHE_VERSION constant
          const cacheData = {
            data: responseData, // Cache full dataset, not just initial slice
            count: responseCount,
            ts: Date.now(),
            version: CACHE_VERSION
          };
          localStorage.setItem(storageKey, JSON.stringify(cacheData));
          console.log(`💾 [FAST SECTION DATA] Cached ${section} data to localStorage:`, {
            section,
            storageKey,
            cachedCount: responseData.length,
            cacheTimestamp: cacheData.ts,
            cacheVersion: CACHE_VERSION
          });
        } catch (e) {
          console.warn(`⚠️ [FAST SECTION DATA] Failed to cache ${section} data:`, e);
        }
        
        console.log(`⚡ [FAST SECTION DATA] Loaded ${section} data:`, {
          count: responseCount,
          totalCount: result.meta?.totalCount || result.meta?.pagination?.totalCount,
          items: responseData.length,
          responseTime: result.meta?.responseTime,
          firstItem: responseData?.[0] ? {
            rank: responseData[0].rank,
            name: responseData[0].name,
            company: responseData[0].company?.name || responseData[0].company,
            legalName: responseData[0].legalName,
            localName: responseData[0].localName,
            description: responseData[0].description,
            website: responseData[0].website,
            phone: responseData[0].phone
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
      
      // Ensure we always have a meaningful error message
      const safeErrorMessage = errorMessage || 'Unknown error occurred';
      const errorDetails: any = {
        error: safeErrorMessage,
        url,
        workspaceId,
        userId,
        section
      };
      
      // Only add error details if they exist and are meaningful
      if (err) {
        if (err instanceof Error) {
          errorDetails.errorType = 'Error';
          errorDetails.errorMessage = err.message;
          errorDetails.errorStack = err.stack;
        } else if (typeof err === 'object') {
          errorDetails.errorType = typeof err;
          errorDetails.errorConstructor = err?.constructor?.name;
          errorDetails.errorKeys = Object.keys(err);
          // Try to stringify, but catch if it fails
          try {
            errorDetails.errorStringified = JSON.stringify(err, null, 2);
          } catch (e) {
            errorDetails.errorStringified = '[Unable to stringify error]';
          }
        } else {
          errorDetails.errorType = typeof err;
          errorDetails.errorValue = String(err);
        }
      }
      
      console.error(`❌ [FAST SECTION DATA] Error loading ${section}:`, errorDetails);
      
      // Don't set error for network failures - just log and continue
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('HTTP')) {
        console.warn(`⚠️ [FAST SECTION DATA] Network/HTTP error for ${section} - will retry later`);
        setError(null); // Clear any previous errors
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [section, limit, workspaceId, userId, authLoading]);

  // 🚀 PROGRESSIVE LOADING: Fetch first 100 records immediately, then load remaining in background
  useEffect(() => {
    if (!workspaceId || authLoading) return;
    
    // 🔧 BLANK TABLES FIX: Don't clear data when section changes - preserve until new data loads
    // This prevents the flash of blank tables when navigating between sections
    
    // Instant hydration from cache
    let hasCachedData = false;
    try {
      const storageKey = `adrata-${section}-${workspaceId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Use centralized TTL constants
        const CACHE_TTL = section === 'speedrun' ? CACHE_TTL_SPEEDRUN : CACHE_TTL_DEFAULT;
        
        // Check cache validity: version match, has data, and not expired
        if (parsed?.version === CACHE_VERSION && 
            Array.isArray(parsed?.data) && 
            parsed.data.length > 0 && 
            (Date.now() - (parsed?.ts || 0)) < CACHE_TTL) {
          console.log(`💾 [FAST SECTION DATA] Hydrating ${section} from localStorage cache:`, {
            section,
            cachedCount: parsed.data.length,
            cacheAge: Date.now() - parsed.ts
          });
          
          // 🔧 PAGINATION FIX: Show all cached data immediately, don't limit to 100
          // The client-side pagination will handle showing the right page
          setData(parsed.data);
          setCount(parsed.count || parsed.data.length);
          setLoading(false);
          hasCachedData = true;
          setHasLoadedInitial(true);
          hasHydratedRef.current = true; // Mark as hydrated to prevent fetchSectionData from checking cache
          
          // If we have less data than the total count, load remaining in background
          const cachedCount = parsed.count || parsed.data.length;
          if (parsed.data.length < cachedCount) {
            console.log(`🔄 [FAST SECTION DATA] Cached data incomplete (${parsed.data.length}/${cachedCount}), loading remaining in background...`);
            setIsLoadingMore(true);
            // Load remaining data after a short delay
            setTimeout(() => {
              fetchSectionData(false, false).then(() => {
                setIsLoadingMore(false);
              });
            }, PROGRESSIVE_LOAD_DELAY);
          }
        } else {
          console.log(`🗑️ [FAST SECTION DATA] Cache invalid for ${section}, will fetch fresh:`, {
            versionMatch: parsed?.version === CACHE_VERSION,
            hasData: Array.isArray(parsed?.data) && parsed.data.length > 0,
            notExpired: (Date.now() - (parsed?.ts || 0)) < CACHE_TTL
          });
        }
      }
    } catch (e) {
      console.warn(`⚠️ [FAST SECTION DATA] Failed to hydrate ${section} from cache:`, e);
    }
    
    // Detect current section from URL
    let isCurrentSection = false;
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const sectionFromUrl = pathname.split('/').filter(Boolean).pop() || '';
      
      const urlToSectionMap: Record<string, string> = {
        'speedrun': 'speedrun',
        'leads': 'leads',
        'prospects': 'prospects',
        'opportunities': 'opportunities',
        'people': 'people',
        'companies': 'companies'
      };
      
      if (urlToSectionMap[sectionFromUrl] === section || pathname.includes(`/${section}`)) {
        isCurrentSection = true;
        console.log(`🎯 [FAST SECTION DATA] Detected direct navigation to ${section}, prioritizing load`);
      }
    }
    
    // If no cached data, fetch first 100 records immediately
    // 🔧 BLANK TABLES FIX: Only fetch if we don't already have data for this section
    // This prevents clearing data when switching sections
    if (workspaceId && userId && !authLoading && !loadedSectionsRef.current.has(section) && !hasCachedData) {
      // Mark as hydrated to prevent fetchSectionData from checking cache
      hasHydratedRef.current = true;
      
      // Set loading to true only if we don't have data yet
      if (data.length === 0) {
        setLoading(true);
      }
      
      // 🔧 FIX: All tables now fetch 10,000 records upfront (like companies)
      // This ensures all pages work correctly without progressive loading
      // Progressive loading caused blank pages when navigating to later pages
      if (isCurrentSection) {
        console.log(`🚀 [FAST SECTION DATA] Prioritizing current section ${section} - loading all data immediately`);
        fetchSectionData(false, false).then(() => {
          setHasLoadedInitial(true);
        });
      } else {
        // Other sections: Load all data upfront
        console.log(`🚀 [FAST SECTION DATA] Fetching all ${section} records...`);
        fetchSectionData(false, false).then(() => {
          setHasLoadedInitial(true);
        });
      }
    } else if (loadedSectionsRef.current.has(section) && data.length > 0) {
      // 🔧 BLANK TABLES FIX: If we already have data for this section, don't show loading
      // This prevents the flash of blank tables when switching back to a previously loaded section
      setLoading(false);
    }
  }, [section, workspaceId, userId, authLoading, fetchSectionData]);
  
  // 🔧 RACE CONDITION FIX: Reset hydration flag when section changes
  // BUT don't clear data - let the new section's useEffect handle loading
  useEffect(() => {
    hasHydratedRef.current = false;
    // Don't clear data here - it causes blank tables when switching sections
    // The new section's useEffect will load fresh data
  }, [section]);

  // 🚀 PERFORMANCE FIX: Event-based force refresh monitoring (no interval polling)
  // This solves the issue where saved changes don't persist when navigating back to a record
  useEffect(() => {
    if (!workspaceId || !userId || authLoading) {
      return;
    }

    // Check for force-refresh flags in sessionStorage immediately
    if (typeof window !== 'undefined') {
      const forceRefreshKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('force-refresh-') && key.includes(section)
      );
      
      if (forceRefreshKeys.length > 0) {
        console.log(`🔄 [FAST SECTION DATA] Force refresh flags detected for section ${section}, triggering refetch:`, forceRefreshKeys);
        
        // Remove force-refresh flags
        forceRefreshKeys.forEach(key => {
          sessionStorage.removeItem(key);
        });
        
        // Trigger a forced refetch
        fetchSectionData(true);
      }
    }
  }, [section, workspaceId, userId, authLoading]);

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

  // 🔧 CRITICAL FIX: Clear stale localStorage cache on mount
  // This ensures we don't show old empty data from cache for any section
  // Note: Uses same TTL as hydration (5 minutes) to prevent clearing valid cache
  useEffect(() => {
    if (workspaceId) {
      const storageKey = `adrata-${section}-${workspaceId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Use centralized TTL constants
          const CACHE_TTL = section === 'speedrun' ? CACHE_TTL_SPEEDRUN : CACHE_TTL_DEFAULT;
          const cacheAge = Date.now() - (parsed?.ts || 0);
          
          // Clear cache if it's empty, wrong version, or stale (older than 5 minutes)
          if (!parsed?.data || 
              parsed.data.length === 0 || 
              parsed?.version !== CACHE_VERSION ||
              cacheAge > CACHE_TTL) {
            console.log(`🗑️ [FAST SECTION DATA] Clearing stale ${section} cache:`, { 
              cacheAge, 
              isEmpty: !parsed?.data || parsed.data.length === 0,
              wrongVersion: parsed?.version !== CACHE_VERSION,
              expired: cacheAge > CACHE_TTL
            });
            localStorage.removeItem(storageKey);
          }
        } catch (e) {
          console.warn(`⚠️ [FAST SECTION DATA] Failed to parse ${section} cache, clearing:`, e);
          localStorage.removeItem(storageKey);
        }
      }
    }
  }, [section, workspaceId]);

  // 🚀 PERFORMANCE: Track workspace changes to reset loaded sections only when needed
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Only reset if workspace or user actually changed (not on initial load)
    if (workspaceId && userId && (workspaceId !== lastWorkspaceId || userId !== lastUserId) && lastWorkspaceId !== null) {
      console.log(`🔄 [FAST SECTION DATA] Workspace/user changed, resetting loaded sections for ${section}`);
      loadedSectionsRef.current.clear();
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
        loadedSectionsRef.current.clear();
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

  // 🚀 CACHE INVALIDATION: Listen for cache invalidation events
  useEffect(() => {
    const handleCacheInvalidate = (event: CustomEvent) => {
      const { pattern, reason } = event.detail;
      console.log(`🗑️ [FAST SECTION DATA] Cache invalidation event received:`, { pattern, reason, section });
      
      // Check if this invalidation affects our section
      if (pattern.includes(section) || pattern.includes('*')) {
        console.log(`🔄 [FAST SECTION DATA] Refreshing ${section} data due to cache invalidation`);
        fetchSectionData();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cache-invalidate', handleCacheInvalidate as EventListener);
      return () => {
        window.removeEventListener('cache-invalidate', handleCacheInvalidate as EventListener);
      };
    }
  }, [section, fetchSectionData]);

  // 🚀 CACHE OPTIMIZATION: Removed debug force refresh that was causing unnecessary reloads

  // Memoize refresh function to prevent infinite loops in components that depend on it
  const refresh = useCallback(() => {
    console.log(`🔄 [FAST SECTION DATA] Refresh called for section: ${section}`);
    return fetchSectionData(true);
  }, [fetchSectionData, section]);

  return {
    data,
    loading,
    error,
    count,
    isLoadingMore,
    hasLoadedInitial,
    refresh,
    clearCache: () => {
      console.log(`🧹 [FAST SECTION DATA] Clearing cache for section: ${section}`);
      // Critical: Remove section from loaded sections Set to allow refetch
      loadedSectionsRef.current.delete(section);
      console.log(`🧹 [FAST SECTION DATA] Removed ${section} from loaded sections. Remaining:`, Array.from(loadedSectionsRef.current));
      setData([]);
      setCount(0);
      setError(null);
      setLoading(true); // Set loading to true to show loading state
      
      // Force a refetch with refresh=true to bypass backend cache
      // Add small delay to ensure any pending API operations complete
      setTimeout(() => {
        console.log(`🔄 [FAST SECTION DATA] Force refetching after cache clear for: ${section}`);
        fetchSectionData(true);
      }, 50);
    }
  };
}
