/**
 * Companies Background Prefetch Service
 * 
 * Intelligently prefetches accurate lastAction/nextAction data for companies in the background,
 * ensuring world-class speed: instant loading with accurate data when users navigate to companies.
 * 
 * Strategy:
 * 1. On login/workspace load: Prefetch accurate lastAction/nextAction for all companies
 * 2. On action completion: Update affected companies' lastAction in background
 * 3. On cache invalidation: Refresh accurate data for companies
 * 4. Uses idle time and debouncing to never block the main thread
 */

let prefetchTimeout: NodeJS.Timeout | null = null;
let lastPrefetchTime = 0;
let isInitialized = false;
let currentWorkspaceId: string | null = null;
let currentUserId: string | null = null;

const DEBOUNCE_DELAY = 1000; // Wait 1s after trigger before prefetching
const MIN_PREFETCH_INTERVAL = 5000; // Minimum 5 seconds between prefetches
const MAX_COMPANIES_PER_PREFETCH = 1000; // Limit to prevent overload

interface PrefetchOptions {
  workspaceId: string;
  userId: string;
  trigger?: string;
  force?: boolean;
  companyIds?: string[]; // Specific companies to prefetch (for action updates)
}

/**
 * Prefetch accurate lastAction/nextAction for companies in the background
 */
async function prefetchCompaniesAccurateData(options: PrefetchOptions): Promise<void> {
  const { workspaceId, userId, trigger = 'unknown', force = false, companyIds } = options;
  
  // Check if enough time has passed since last prefetch (unless forced)
  const timeSinceLastPrefetch = Date.now() - lastPrefetchTime;
  if (!force && timeSinceLastPrefetch < MIN_PREFETCH_INTERVAL) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏭️ [COMPANIES PREFETCH] Skipping - too soon since last prefetch (${Math.round(timeSinceLastPrefetch / 1000)}s ago)`);
    }
    return;
  }
  
  lastPrefetchTime = Date.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 [COMPANIES PREFETCH] Starting background fetch (trigger: ${trigger}):`, {
      workspaceId,
      userId,
      trigger,
      companyIds: companyIds?.length || 'all',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // Build URL with appropriate parameters
    let url = `/api/v1/companies?computeLastAction=true&limit=${MAX_COMPANIES_PER_PREFETCH}&workspaceId=${encodeURIComponent(workspaceId)}`;
    
    // If specific company IDs provided, filter to just those
    if (companyIds && companyIds.length > 0) {
      const idsParam = companyIds.slice(0, MAX_COMPANIES_PER_PREFETCH).join(',');
      url = `/api/v1/companies?ids=${idsParam}&computeLastAction=true&limit=${companyIds.length}&workspaceId=${encodeURIComponent(workspaceId)}`;
    }
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'X-Background-Prefetch': 'true', // Mark as background request
      }
    });
    
    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ [COMPANIES PREFETCH] HTTP ${response.status}:`, response.statusText);
      }
      return;
    }
    
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      // Update localStorage cache with accurate data
      const storageKey = `adrata-companies-${workspaceId}`;
      try {
        const existingCache = localStorage.getItem(storageKey);
        let updatedData: any[] = [];
        
        if (existingCache) {
          const parsed = JSON.parse(existingCache);
          if (Array.isArray(parsed.data)) {
            // Merge accurate lastAction/nextAction into existing cache
            const accurateMap = new Map(result.data.map((c: any) => [c.id, c]));
            updatedData = parsed.data.map((company: any) => {
              const accurate = accurateMap.get(company.id);
              if (accurate) {
                return {
                  ...company,
                  lastAction: accurate.lastAction,
                  lastActionDate: accurate.lastActionDate,
                  nextAction: accurate.nextAction,
                  nextActionDate: accurate.nextActionDate
                };
              }
              return company;
            });
          } else {
            updatedData = result.data;
          }
        } else {
          updatedData = result.data;
        }
        
        const cacheData = {
          data: updatedData,
          count: result.meta?.count || updatedData.length,
          ts: Date.now(),
          version: 3 // CACHE_VERSION
        };
        
        localStorage.setItem(storageKey, JSON.stringify(cacheData));
        
        // Dispatch event to update UI with accurate values
        window.dispatchEvent(new CustomEvent('companies-data-updated', {
          detail: { updatedCompanies: result.data }
        }));
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ [COMPANIES PREFETCH] Successfully cached accurate data for ${result.data.length} companies:`, {
            workspaceId,
            count: result.data.length,
            cacheKey: storageKey,
            trigger,
            responseTime: Date.now() - lastPrefetchTime
          });
        }
      } catch (cacheError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ [COMPANIES PREFETCH] Cache update failed:`, cacheError);
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ [COMPANIES PREFETCH] Invalid response format:`, result);
      }
    }
  } catch (error) {
    // Non-blocking error - just log it
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ [COMPANIES PREFETCH] Background fetch failed (non-blocking):`, error);
    }
  }
}

/**
 * Debounced prefetch - waits for actions to settle before fetching
 */
function debouncedPrefetch(options: PrefetchOptions): void {
  // Clear existing timeout
  if (prefetchTimeout) {
    clearTimeout(prefetchTimeout);
  }
  
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePrefetch = (callback: () => void): NodeJS.Timeout | number => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      return (window as any).requestIdleCallback(callback, { timeout: DEBOUNCE_DELAY });
    } else {
      return setTimeout(callback, DEBOUNCE_DELAY);
    }
  };
  
  prefetchTimeout = schedulePrefetch(() => {
    prefetchCompaniesAccurateData(options);
  }) as NodeJS.Timeout;
}

/**
 * Initialize the companies prefetch service
 * Should be called once at app startup (on login/workspace load)
 */
export function initCompaniesPrefetch(workspaceId: string, userId: string): () => void {
  if (!workspaceId || !userId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [COMPANIES PREFETCH] Cannot initialize - missing workspaceId or userId');
    }
    return () => {};
  }
  
  // If already initialized for this workspace, skip
  if (isInitialized && currentWorkspaceId === workspaceId && currentUserId === userId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⏭️ [COMPANIES PREFETCH] Already initialized for this workspace');
    }
    return () => {};
  }
  
  isInitialized = true;
  currentWorkspaceId = workspaceId;
  currentUserId = userId;
  
  console.log('🚀 [COMPANIES PREFETCH] Initializing service:', { workspaceId, userId });
  
  // 🚀 WORLD-CLASS SPEED: Prefetch accurate data immediately on login/workspace load
  // Use requestIdleCallback to not block main thread
  const scheduleInitialPrefetch = () => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        prefetchCompaniesAccurateData({
          workspaceId,
          userId,
          trigger: 'workspace_load',
          force: true // Force on initial load
        });
      }, { timeout: 2000 }); // Start within 2 seconds
    } else {
      setTimeout(() => {
        prefetchCompaniesAccurateData({
          workspaceId,
          userId,
          trigger: 'workspace_load',
          force: true
        });
      }, 2000);
    }
  };
  
  scheduleInitialPrefetch();
  
  // Event handlers for reactive updates
  const handleActionCreated = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { recordType, recordId, companyId } = customEvent.detail || {};
    
    // If action is for a company or person with company, prefetch that company
    if (companyId) {
      debouncedPrefetch({
        workspaceId,
        userId,
        trigger: 'action_created',
        companyIds: [companyId]
      });
    } else if (recordType === 'company') {
      debouncedPrefetch({
        workspaceId,
        userId,
        trigger: 'action_created',
        companyIds: recordId ? [recordId] : undefined
      });
    }
  };
  
  const handleCacheInvalidated = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { recordType, pattern } = customEvent.detail || {};
    
    // Only prefetch if it's related to companies
    if (recordType === 'company' || pattern?.includes('companies')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ [COMPANIES PREFETCH] Cache invalidated for companies');
      }
      
      debouncedPrefetch({
        workspaceId,
        userId,
        trigger: 'cache_invalidated'
      });
    }
  };
  
  // Attach event listeners
  document.addEventListener('actionCreated', handleActionCreated);
  document.addEventListener('cache-invalidate', handleCacheInvalidated);
  
  // Cleanup function
  return () => {
    isInitialized = false;
    currentWorkspaceId = null;
    currentUserId = null;
    
    if (prefetchTimeout) {
      clearTimeout(prefetchTimeout);
      prefetchTimeout = null;
    }
    
    document.removeEventListener('actionCreated', handleActionCreated);
    document.removeEventListener('cache-invalidate', handleCacheInvalidated);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 [COMPANIES PREFETCH] Service cleaned up');
    }
  };
}

/**
 * Manually trigger prefetch (useful for testing or manual refresh)
 */
export function triggerCompaniesPrefetch(workspaceId: string, userId: string, force = false): void {
  prefetchCompaniesAccurateData({
    workspaceId,
    userId,
    trigger: 'manual',
    force
  });
}

