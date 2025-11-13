/**
 * Speedrun Background Prefetch Service
 * 
 * Intelligently prefetches speedrun data in the background when actions are completed,
 * ensuring instant loading with fresh rankings when users navigate to speedrun.
 */

let prefetchTimeout: NodeJS.Timeout | null = null;
let lastPrefetchTime = 0;
const DEBOUNCE_DELAY = 500; // Wait 500ms after last action before prefetching
const MIN_PREFETCH_INTERVAL = 2000; // Minimum 2 seconds between prefetches

interface PrefetchOptions {
  workspaceId: string;
  userId: string;
  trigger?: string;
  force?: boolean;
}

/**
 * Prefetch speedrun data in the background and update cache
 */
async function prefetchSpeedrunData(options: PrefetchOptions): Promise<void> {
  const { workspaceId, userId, trigger = 'unknown', force = false } = options;
  
  // Check if enough time has passed since last prefetch (unless forced)
  const timeSinceLastPrefetch = Date.now() - lastPrefetchTime;
  if (!force && timeSinceLastPrefetch < MIN_PREFETCH_INTERVAL) {
    console.log(`⏭️ [SPEEDRUN PREFETCH] Skipping - too soon since last prefetch (${Math.round(timeSinceLastPrefetch / 1000)}s ago)`);
    return;
  }
  
  lastPrefetchTime = Date.now();
  
  console.log(`🔄 [SPEEDRUN PREFETCH] Starting background fetch (trigger: ${trigger}):`, {
    workspaceId,
    userId,
    trigger,
    timestamp: new Date().toISOString()
  });
  
  try {
    const response = await fetch(`/api/v1/speedrun?limit=1000`, {
      credentials: 'include',
      headers: {
        'X-Background-Prefetch': 'true', // Mark as background request
      }
    });
    
    if (!response.ok) {
      console.warn(`⚠️ [SPEEDRUN PREFETCH] HTTP ${response.status}:`, response.statusText);
      return;
    }
    
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      // Update localStorage cache with fresh data
      const storageKey = `adrata-speedrun-${workspaceId}`;
      const cacheData = {
        data: result.data,
        count: result.meta?.count || result.data.length,
        ts: Date.now()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(cacheData));
      
      console.log(`✅ [SPEEDRUN PREFETCH] Successfully cached ${result.data.length} records:`, {
        workspaceId,
        count: result.data.length,
        cacheKey: storageKey,
        trigger,
        responseTime: Date.now() - lastPrefetchTime
      });
      
      // Dispatch event to notify components that fresh data is available
      window.dispatchEvent(new CustomEvent('speedrun-prefetch-complete', {
        detail: {
          workspaceId,
          count: result.data.length,
          trigger,
          timestamp: new Date().toISOString()
        }
      }));
    } else {
      console.warn(`⚠️ [SPEEDRUN PREFETCH] Invalid response format:`, result);
    }
  } catch (error) {
    // Non-blocking error - just log it
    console.warn(`⚠️ [SPEEDRUN PREFETCH] Background fetch failed (non-blocking):`, error);
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
  
  // Schedule new prefetch
  prefetchTimeout = setTimeout(() => {
    prefetchSpeedrunData(options);
  }, DEBOUNCE_DELAY);
}

/**
 * Initialize the speedrun prefetch service
 * Should be called once at app startup
 */
export function initSpeedrunPrefetch(workspaceId: string, userId: string): () => void {
  if (!workspaceId || !userId) {
    console.warn('⚠️ [SPEEDRUN PREFETCH] Cannot initialize - missing workspaceId or userId');
    return () => {};
  }
  
  console.log('🚀 [SPEEDRUN PREFETCH] Initializing service:', { workspaceId, userId });
  
  // Event handlers
  const handleActionCreated = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { recordType } = customEvent.detail || {};
    
    console.log('🎯 [SPEEDRUN PREFETCH] Action created event:', customEvent.detail);
    
    // Only prefetch for people actions (most relevant to speedrun rankings)
    if (recordType === 'people' || !recordType) {
      debouncedPrefetch({
        workspaceId,
        userId,
        trigger: 'action_created'
      });
    }
  };
  
  const handleSpeedrunActionLogged = (event: Event) => {
    console.log('🏃 [SPEEDRUN PREFETCH] Speedrun action logged event');
    
    // Immediate prefetch after speedrun actions (user is actively using speedrun)
    debouncedPrefetch({
      workspaceId,
      userId,
      trigger: 'speedrun_action_logged'
    });
  };
  
  const handleCacheInvalidated = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { recordType } = customEvent.detail || {};
    
    // Only prefetch if it's related to people/speedrun
    if (recordType === 'people' || recordType === 'speedrun') {
      console.log('🗑️ [SPEEDRUN PREFETCH] Cache invalidated for speedrun-related data');
      
      debouncedPrefetch({
        workspaceId,
        userId,
        trigger: 'cache_invalidated'
      });
    }
  };
  
  // Attach event listeners
  document.addEventListener('actionCreated', handleActionCreated);
  document.addEventListener('speedrunActionLogged', handleSpeedrunActionLogged);
  window.addEventListener('cache-invalidated', handleCacheInvalidated);
  
  console.log('✅ [SPEEDRUN PREFETCH] Service initialized and listening for events');
  
  // Return cleanup function
  return () => {
    console.log('🛑 [SPEEDRUN PREFETCH] Cleaning up service');
    
    if (prefetchTimeout) {
      clearTimeout(prefetchTimeout);
    }
    
    document.removeEventListener('actionCreated', handleActionCreated);
    document.removeEventListener('speedrunActionLogged', handleSpeedrunActionLogged);
    window.removeEventListener('cache-invalidated', handleCacheInvalidated);
  };
}

/**
 * Manually trigger a prefetch (useful for testing or forced refreshes)
 */
export function triggerManualPrefetch(workspaceId: string, userId: string): void {
  console.log('🔄 [SPEEDRUN PREFETCH] Manual prefetch triggered');
  
  prefetchSpeedrunData({
    workspaceId,
    userId,
    trigger: 'manual',
    force: true // Bypass interval check
  });
}

