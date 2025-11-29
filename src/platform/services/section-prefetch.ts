/**
 * Section Background Prefetch Service
 * 
 * Intelligently prefetches section data in the background when user is on other pages,
 * ensuring instant loading when users navigate to those sections.
 * 
 * Strategy:
 * 1. When user lands on speedrun (or any page), prefetch first 100 records of other sections
 * 2. After first page loads, continue loading remaining pages in background
 * 3. Cache all data for instant navigation
 */

let prefetchTimeouts: Map<string, NodeJS.Timeout> = new Map();
let lastPrefetchTimes: Map<string, number> = new Map();
let failedRecordIds: Set<string> = new Set(); // Track records that returned 404 to avoid retrying
const DEBOUNCE_DELAY = 1000; // Wait 1s after navigation before prefetching
const MIN_PREFETCH_INTERVAL = 5000; // Minimum 5 seconds between prefetches for same section
const INITIAL_PAGE_SIZE = 100; // First page size for instant loading
const BACKGROUND_PAGE_SIZE = 100; // Subsequent pages loaded in background
const MAX_CACHE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB max cache size per section

/**
 * Estimate the size of data in bytes
 * Used to check if data exceeds cache size threshold
 */
function estimateDataSize(data: any): number {
  try {
    return JSON.stringify(data).length * 2; // UTF-16 uses 2 bytes per character
  } catch {
    return Infinity; // If we can't stringify, assume too large
  }
}

/**
 * Safely store data in localStorage with size check
 * Returns true if stored successfully, false if skipped due to size
 */
function safeLocalStorageSet(key: string, data: any, maxSize: number = MAX_CACHE_SIZE_BYTES): boolean {
  if (typeof window === 'undefined') return false;
  
  const dataSize = estimateDataSize(data);
  
  // Skip caching if data exceeds threshold
  if (dataSize > maxSize) {
    // Don't log warning - this is expected for large datasets
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    // Handle QuotaExceeded silently - clear old caches and retry once
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldRecordCaches();
      clearOldSectionCaches();
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch {
        // Still failed - skip caching silently
        return false;
      }
    }
    return false;
  }
}

/**
 * Clear old section caches to free up localStorage space
 */
function clearOldSectionCaches(): void {
  if (typeof window === 'undefined') return;
  
  const SECTION_CACHE_PREFIX = 'adrata-';
  const MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes
  const keysToRemove: string[] = [];
  
  // Find all section cache entries (but not record caches)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(SECTION_CACHE_PREFIX) && !key.includes('-record-')) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - (parsed.ts || 0);
          if (cacheAge > MAX_CACHE_AGE) {
            keysToRemove.push(key);
          }
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}

/**
 * Clear old record caches to free up localStorage space
 * Called when QuotaExceeded error occurs
 */
function clearOldRecordCaches(): void {
  if (typeof window === 'undefined') return;
  
  const RECORD_CACHE_PREFIX = 'adrata-record-';
  const MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes
  const keysToRemove: string[] = [];
  
  // Find all record cache entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(RECORD_CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - (parsed.ts || 0);
          // Remove caches older than MAX_CACHE_AGE
          if (cacheAge > MAX_CACHE_AGE) {
            keysToRemove.push(key);
          }
        }
      } catch {
        // Invalid cache entry, remove it
        keysToRemove.push(key);
      }
    }
  }
  
  // Remove old caches
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
  
  console.log(`🧹 [PREFETCH] Cleared ${keysToRemove.length} old record caches`);
}

interface PrefetchOptions {
  workspaceId: string;
  userId: string;
  section: string;
  trigger?: string;
  force?: boolean;
  initialOnly?: boolean; // Only fetch first page
  osType?: 'acquisition' | 'retention' | 'expansion'; // OS type for filtering
}

/**
 * Prefetch section data with OS type support
 */
async function prefetchSectionDataWithOSType(options: PrefetchOptions): Promise<void> {
  return prefetchSectionData(options);
}

/**
 * Prefetch section data in the background and update cache
 */
async function prefetchSectionData(options: PrefetchOptions): Promise<void> {
  const { workspaceId, userId, section, trigger, force = false, initialOnly = false, osType } = options;
  
  const prefetchKey = `${workspaceId}-${section}`;
  
  // Check if enough time has passed since last prefetch (unless forced)
  const lastPrefetch = lastPrefetchTimes.get(prefetchKey) || 0;
  const timeSinceLastPrefetch = Date.now() - lastPrefetch;
  if (!force && timeSinceLastPrefetch < MIN_PREFETCH_INTERVAL) {
    console.log(`⏭️ [SECTION PREFETCH] Skipping ${section} - too soon since last prefetch (${Math.round(timeSinceLastPrefetch / 1000)}s ago)`);
    return;
  }
  
  lastPrefetchTimes.set(prefetchKey, Date.now());
  
  console.log(`🚀 [SECTION PREFETCH] Prefetching ${section} data:`, {
    workspaceId,
    userId,
    trigger,
    initialOnly,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Build URL based on section
    let url = '';
    // 🚀 SPEED OPTIMIZATION: Use smaller limit for initial auth prefetch, full limit for normal prefetch
    // This makes initial login faster while still providing instant navigation
    const limit = initialOnly ? 30 : 10000; // Fetch first page only for auth prefetch, full dataset for normal prefetch
    
    // Add OS type parameter if provided
    const osTypeParam = options.osType ? `&osType=${options.osType}` : '';
    
    switch (section) {
      case 'leads':
        url = `/api/v1/people?section=leads&sortBy=globalRank&sortOrder=desc&limit=${limit}${osTypeParam}`;
        break;
      case 'prospects':
        url = `/api/v1/people?section=prospects&sortBy=lastActionDate&sortOrder=asc&limit=${limit}${osTypeParam}`;
        break;
      case 'opportunities':
        url = `/api/v1/people?section=opportunities&limit=${limit}${osTypeParam}`;
        break;
      case 'people':
        url = `/api/v1/people?sortBy=globalRank&sortOrder=desc&limit=${limit}${osTypeParam}`;
        break;
      case 'companies':
        url = `/api/v1/companies?sortBy=name&sortOrder=asc&limit=${limit}${osTypeParam}`;
        break;
      case 'clients':
        // Clients section for retention/expansion OS
        url = `/api/v1/companies?status=CLIENT&sortBy=name&sortOrder=asc&limit=${limit}${osTypeParam}`;
        break;
      case 'speedrun':
        url = `/api/v1/speedrun?limit=${limit}${osTypeParam}`;
        break;
      default:
        console.warn(`⚠️ [SECTION PREFETCH] Unknown section: ${section}`);
        return;
    }
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'X-Background-Prefetch': 'true', // Mark as background request
      }
    });
    
    if (!response.ok) {
      console.warn(`⚠️ [SECTION PREFETCH] HTTP ${response.status} for ${section}:`, response.statusText);
      return;
    }
    
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
      // Update localStorage cache with fresh data
      // 🔧 CACHE CONFLICT FIX: Check existing cache timestamp before overwriting
      // Only overwrite if prefetch data is fresher or no existing cache
      const storageKey = `adrata-${section}-${workspaceId}`;
      // Use same CACHE_VERSION as useFastSectionData for consistency
      const CACHE_VERSION = 3; // Match useFastSectionData CACHE_VERSION
      // Use same TTL logic as useFastSectionData
      const CACHE_TTL = section === 'speedrun' ? 2 * 60 * 1000 : 5 * 60 * 1000;
      // 🔧 PAGINATION FIX: Use same count extraction logic as useFastSectionData
      // Prioritize meta.totalCount for accurate pagination
      const count = result.meta?.totalCount || result.meta?.pagination?.totalCount || result.meta?.count || result.data.length;
      const cacheData = {
        data: result.data,
        count: count, // Use accurate total count from API
        ts: Date.now(),
        version: CACHE_VERSION
      };
      
      // Check if existing cache is newer - don't overwrite if it is
      // Also check TTL - don't overwrite if existing cache is still valid
      try {
        const existingCache = localStorage.getItem(storageKey);
        if (existingCache) {
          const parsed = JSON.parse(existingCache);
          const cacheAge = Date.now() - (parsed.ts || 0);
          
          // Only overwrite if our data is fresher OR if versions don't match OR if cache expired
          if (parsed.ts && parsed.version === CACHE_VERSION && parsed.ts > cacheData.ts && cacheAge < CACHE_TTL) {
            console.log(`⏭️ [SECTION PREFETCH] Skipping cache write for ${section} - existing cache is fresher and valid:`, {
              existingTs: parsed.ts,
              newTs: cacheData.ts,
              ageDiff: parsed.ts - cacheData.ts,
              cacheAge: Math.round(cacheAge / 1000) + 's',
              cacheTTL: Math.round(CACHE_TTL / 1000) + 's'
            });
            return;
          }
        }
      } catch (e) {
        // If we can't parse existing cache, proceed with write
        console.warn(`⚠️ [SECTION PREFETCH] Failed to check existing cache for ${section}, proceeding with write:`, e);
      }
      
      const cached = safeLocalStorageSet(storageKey, cacheData);
      
      if (cached) {
        console.log(`✅ [SECTION PREFETCH] Successfully cached ${result.data.length} ${section} records:`, {
          workspaceId,
          count: result.data.length,
          cacheKey: storageKey,
          trigger,
          initialOnly,
          responseTime: Date.now() - lastPrefetch
        });
      } else {
        // Data too large or quota exceeded - use in-memory only (no warning needed)
        console.log(`📦 [SECTION PREFETCH] ${section} data too large for cache (${result.data.length} records), using in-memory only`);
      }
      
      // 🚀 PERFORMANCE: Pre-fetch individual record details for first 10 records
      // This ensures instant loading when user clicks on a record
      if (result.data.length > 0) {
        prefetchRecordDetails(section, result.data.slice(0, 10), workspaceId).catch((error) => {
          console.warn(`⚠️ [SECTION PREFETCH] Failed to pre-fetch record details (non-blocking):`, error);
        });
      }
      
      // Dispatch event to notify components that fresh data is available
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('section-prefetch-complete', {
          detail: {
            section,
            workspaceId,
            count: result.data.length,
            trigger,
            initialOnly,
            timestamp: new Date().toISOString()
          }
        }));
      }
    } else {
      console.warn(`⚠️ [SECTION PREFETCH] Invalid response format for ${section}:`, result);
    }
  } catch (error) {
    // Non-blocking error - just log it
    console.warn(`⚠️ [SECTION PREFETCH] Background fetch failed for ${section} (non-blocking):`, error);
  }
}

/**
 * Debounced prefetch - waits for navigation to settle before fetching
 */
function debouncedPrefetch(options: PrefetchOptions): void {
  const prefetchKey = `${options.workspaceId}-${options.section}`;
  
  // Clear existing timeout
  const existingTimeout = prefetchTimeouts.get(prefetchKey);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  // Set new timeout
  const timeout = setTimeout(() => {
    prefetchSectionData(options);
    prefetchTimeouts.delete(prefetchKey);
  }, DEBOUNCE_DELAY);
  
  prefetchTimeouts.set(prefetchKey, timeout);
}

/**
 * Prefetch critical data immediately after authentication (before redirect)
 * This starts loading counts and current section data in parallel for instant page load
 */
export async function prefetchAfterAuth(
  workspaceId: string,
  userId: string,
  redirectPath: string
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  console.log(`🚀 [AUTH PREFETCH] Starting immediate pre-fetch after authentication:`, {
    workspaceId,
    userId,
    redirectPath
  });
  
  // Detect current section and OS type from redirect path
  // Handle OS variants: /[workspace]/acquisition-os/leads, /[workspace]/retention-os/clients, etc.
  const pathParts = redirectPath.split('/').filter(Boolean);
  
  // Check if this is an OS variant path (acquisition-os, retention-os, expansion-os)
  const osVariants = ['acquisition-os', 'retention-os', 'expansion-os'];
  const osIndex = pathParts.findIndex(part => osVariants.includes(part));
  
  let sectionFromPath: string;
  let detectedOSType: 'acquisition' | 'retention' | 'expansion' | null = null;
  
  if (osIndex !== -1 && pathParts.length > osIndex + 1) {
    // OS variant path: extract OS type and section after OS name
    const osPart = pathParts[osIndex];
    if (osPart === 'acquisition-os') {
      detectedOSType = 'acquisition';
    } else if (osPart === 'retention-os') {
      detectedOSType = 'retention';
    } else if (osPart === 'expansion-os') {
      detectedOSType = 'expansion';
    }
    sectionFromPath = pathParts[osIndex + 1];
  } else {
    // Regular path: use last segment
    sectionFromPath = pathParts[pathParts.length - 1] || 'speedrun';
  }
  
  const urlToSectionMap: Record<string, string> = {
    'speedrun': 'speedrun',
    'leads': 'leads',
    'prospects': 'prospects',
    'opportunities': 'opportunities',
    'people': 'people',
    'companies': 'companies',
    'clients': 'clients', // Retention/Expansion OS default section
    'dashboard': 'speedrun', // Dashboard defaults to speedrun
  };
  
  const currentSection = urlToSectionMap[sectionFromPath] || 'speedrun';
  
  console.log(`🔍 [AUTH PREFETCH] Detected section and OS from path:`, {
    redirectPath,
    pathParts,
    osIndex,
    detectedOSType,
    sectionFromPath,
    currentSection
  });
  
  try {
    // Pre-fetch critical data in parallel for maximum speed
    // Use Promise.allSettled to ensure both complete even if one fails
    await Promise.allSettled([
      // 1. Pre-fetch counts (for left panel) - highest priority
      fetch('/api/data/counts', {
        credentials: 'include',
        headers: {
          'X-Background-Prefetch': 'true',
        },
        // Optimize for speed
        cache: 'no-store', // Always get fresh data
        priority: 'high' as RequestPriority, // Browser hint for priority
      }).then(async (response) => {
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Transform counts data to match useFastCounts format
            const counts = result.data;
            const transformedCounts = {
              leads: counts.leads || 0,
              prospects: counts.prospects || 0,
              opportunities: counts.opportunities || 0,
              companies: counts.companies || 0,
              people: counts.people || 0,
              clients: counts.clients || 0,
              partners: counts.partners || 0,
              sellers: counts.sellers || 0,
              speedrun: counts.speedrun || 0,
              speedrunReady: counts.speedrunReady || 0,
              speedrunRemaining: counts.speedrunRemaining || 0,
              metrics: counts.metrics || 0,
              chronicle: counts.chronicle || 0
            };
            
            // Cache counts in localStorage - use same key format as useFastCounts hook
            const cacheKey = `adrata-fast-counts-${workspaceId}`;
            localStorage.setItem(cacheKey, JSON.stringify({
              counts: transformedCounts, // Store transformed format to match useFastCounts
              workspaceId: workspaceId, // Include workspaceId for validation
              ts: Date.now(),
              version: 1
            }));
            console.log(`✅ [AUTH PREFETCH] Cached counts data (transformed format)`);
          }
        }
      }).catch((error) => {
        console.warn(`⚠️ [AUTH PREFETCH] Failed to pre-fetch counts:`, error);
      }),
      
      // 2. Pre-fetch current section data (for main panel) - lower priority
      // Pass OS type if detected for proper filtering
      prefetchSectionDataWithOSType({
        workspaceId,
        userId,
        section: currentSection,
        osType: detectedOSType,
        trigger: 'auth-prefetch',
        force: true,
        initialOnly: true // Only fetch first page for speed - rest loads progressively
      }).catch((error) => {
        console.warn(`⚠️ [AUTH PREFETCH] Failed to pre-fetch ${currentSection}:`, error);
      })
    ]);
    
    console.log(`✅ [AUTH PREFETCH] Critical data pre-fetched successfully`);
  } catch (error) {
    console.warn(`⚠️ [AUTH PREFETCH] Error during pre-fetch (non-blocking):`, error);
  }
}

/**
 * Prefetch all sections when user lands on a page (like speedrun)
 * This ensures other sections are ready when user navigates to them
 * 🔧 PRIORITY QUEUE: Prefetches in priority order (leads → prospects → others)
 */
export function prefetchAllSections(workspaceId: string, userId: string, currentSection: string, trigger: string = 'navigation'): void {
  if (typeof window === 'undefined') return;
  
  // Detect current section from URL if not provided
  let detectedCurrentSection = currentSection;
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
    
    if (urlToSectionMap[sectionFromUrl]) {
      detectedCurrentSection = urlToSectionMap[sectionFromUrl];
      console.log(`🎯 [PREFETCH] Detected current section from URL: ${detectedCurrentSection}`);
    }
  }
  
  console.log(`🚀 [SECTION PREFETCH] Prefetching all sections (current: ${detectedCurrentSection}):`, {
    workspaceId,
    userId,
    trigger
  });
  
  // 🔧 PRIORITY ORDER: Leads first, then prospects, then others in left panel order
  const priorityOrder = [
    { section: 'leads', delay: 0 },           // Highest priority - immediate
    { section: 'prospects', delay: 100 },     // Second priority - 100ms delay
    { section: 'opportunities', delay: 200 }, // Third priority - 200ms delay
    { section: 'companies', delay: 300 },    // Fourth priority - 300ms delay
    { section: 'people', delay: 400 },       // Fifth priority - 400ms delay
    { section: 'speedrun', delay: 500 }      // Lowest priority - 500ms delay
  ];
  
  // Prefetch all sections except the current one, in priority order
  // 🔧 OPTIMIZATION: Load full 10,000 records immediately for instant navigation
  // This ensures all pages work when user navigates to prefetched sections
  priorityOrder.forEach(({ section, delay }) => {
    // Skip current section - it's already loading with priority
    if (section !== detectedCurrentSection && section !== currentSection) {
      // Fetch full dataset with priority-based delay for instant navigation
      // No need for two-stage loading - just load everything upfront
      setTimeout(() => {
        debouncedPrefetch({
          workspaceId,
          userId,
          section,
          trigger: `${trigger}-prefetch-${section}`,
          initialOnly: false // Fetch full 10,000 records for complete pagination
        });
      }, delay);
    } else {
      console.log(`⏭️ [PREFETCH] Skipping prefetch for current section: ${section}`);
    }
  });
}

/**
 * Prefetch a specific section
 */
export function prefetchSection(workspaceId: string, userId: string, section: string, force: boolean = false): void {
  if (typeof window === 'undefined') return;
  
  debouncedPrefetch({
    workspaceId,
    userId,
    section,
    trigger: 'manual',
    force,
    initialOnly: false
  });
}

/**
 * Pre-fetch individual record details for instant loading when user clicks
 * Pre-fetches first 10 records' full details and caches them
 * 
 * Note: Skips speedrun section as rankings change frequently and records may be deleted
 */
async function prefetchRecordDetails(
  section: string,
  records: any[],
  workspaceId: string
): Promise<void> {
  if (typeof window === 'undefined' || !records || records.length === 0) return;
  
  // Skip prefetching for speedrun section - rankings change frequently and records may be stale/deleted
  if (section === 'speedrun') {
    return;
  }
  
  console.log(`🚀 [RECORD PREFETCH] Pre-fetching details for ${records.length} ${section} records`);
  
  const RECORD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL
  let successCount = 0;
  let skippedCount = 0;
  
  // Pre-fetch all records in parallel
  const prefetchPromises = records.map(async (record) => {
    const recordId = record.id;
    if (!recordId) return;
    
    // Skip records that previously returned 404
    const failedKey = `${section}-${recordId}`;
    if (failedRecordIds.has(failedKey)) {
      skippedCount++;
      return;
    }
    
    try {
      // Determine API endpoint based on section
      let apiUrl = '';
      if (section === 'companies') {
        apiUrl = `/api/v1/companies/${recordId}`;
      } else if (section === 'opportunities') {
        apiUrl = `/api/v1/opportunities/${recordId}`;
      } else if (section === 'people' || section === 'leads' || section === 'prospects') {
        apiUrl = `/api/v1/people/${recordId}`;
      } else {
        return; // Unknown section type
      }
      
      // Check if already cached and still valid
      const cacheKey = `adrata-record-${section}-${recordId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - (parsed.ts || 0);
          if (parsed.ts && cacheAge < RECORD_CACHE_TTL) {
            // Cache is still valid, skip
            skippedCount++;
            return;
          }
        } catch (e) {
          // Invalid cache, proceed with fetch
        }
      }
      
      // Fetch record details
      const response = await fetch(apiUrl, {
        credentials: 'include',
        headers: {
          'X-Background-Prefetch': 'true',
        }
      });
      
      // Handle 404 - record no longer exists, track to avoid retrying
      if (response.status === 404) {
        failedRecordIds.add(failedKey);
        // Don't log 404s - they're expected for deleted records
        return;
      }
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Cache record details using safe storage
          const cacheData = {
            data: result.data,
            ts: Date.now(),
            version: 1
          };
          
          if (safeLocalStorageSet(cacheKey, cacheData)) {
            successCount++;
          }
        }
      }
    } catch (error) {
      // Non-blocking error - suppress to avoid console spam
      // Only log non-network errors in development
      if (process.env.NODE_ENV === 'development' && !(error instanceof TypeError)) {
        console.warn(`⚠️ [RECORD PREFETCH] Failed to pre-fetch ${section} record ${recordId}:`, error);
      }
    }
  });
  
  await Promise.all(prefetchPromises);
  
  if (successCount > 0 || skippedCount > 0) {
    console.log(`✅ [RECORD PREFETCH] Pre-fetched ${successCount} ${section} records (${skippedCount} skipped/cached)`);
  }
}

/**
 * Load remaining pages for a section in background
 * Called after first page is displayed
 */
export async function loadRemainingPages(
  workspaceId: string,
  userId: string,
  section: string,
  currentCount: number,
  totalCount: number
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // If we already have all data, skip
  if (currentCount >= totalCount) {
    console.log(`✅ [SECTION PREFETCH] Already have all ${section} data (${currentCount}/${totalCount})`);
    return;
  }
  
  console.log(`🔄 [SECTION PREFETCH] Loading remaining ${section} pages:`, {
    workspaceId,
    currentCount,
    totalCount,
    remaining: totalCount - currentCount
  });
  
  // Load remaining data in background
  await prefetchSectionData({
    workspaceId,
    userId,
    section,
    trigger: 'remaining-pages',
    initialOnly: false // Fetch all remaining records
  });
}

