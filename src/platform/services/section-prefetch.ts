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
const DEBOUNCE_DELAY = 1000; // Wait 1s after navigation before prefetching
const MIN_PREFETCH_INTERVAL = 5000; // Minimum 5 seconds between prefetches for same section
const INITIAL_PAGE_SIZE = 100; // First page size for instant loading
const BACKGROUND_PAGE_SIZE = 100; // Subsequent pages loaded in background

interface PrefetchOptions {
  workspaceId: string;
  userId: string;
  section: string;
  trigger?: string;
  force?: boolean;
  initialOnly?: boolean; // Only fetch first page
}

/**
 * Prefetch section data in the background and update cache
 */
async function prefetchSectionData(options: PrefetchOptions): Promise<void> {
  const { workspaceId, userId, section, trigger, force = false, initialOnly = false } = options;
  
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
    const limit = initialOnly ? INITIAL_PAGE_SIZE : 10000; // Fetch first 100 for initial, or all for background
    
    switch (section) {
      case 'leads':
        url = `/api/v1/people?section=leads&sortBy=globalRank&sortOrder=desc&limit=${limit}`;
        break;
      case 'prospects':
        url = `/api/v1/people?section=prospects&sortBy=lastActionDate&sortOrder=asc&limit=${limit}`;
        break;
      case 'opportunities':
        url = `/api/v1/people?section=opportunities&limit=${limit}`;
        break;
      case 'people':
        url = `/api/v1/people?sortBy=globalRank&sortOrder=desc&limit=${limit}`;
        break;
      case 'companies':
        url = `/api/v1/companies?sortBy=name&sortOrder=asc&limit=${limit}`;
        break;
      case 'speedrun':
        url = `/api/v1/speedrun?limit=${limit}`;
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
      const CACHE_VERSION = 2;
      // Use same TTL logic as useFastSectionData
      const CACHE_TTL = section === 'speedrun' ? 2 * 60 * 1000 : 5 * 60 * 1000;
      const cacheData = {
        data: result.data,
        count: result.meta?.count || result.data.length,
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
      
      localStorage.setItem(storageKey, JSON.stringify(cacheData));
      
      console.log(`✅ [SECTION PREFETCH] Successfully cached ${result.data.length} ${section} records:`, {
        workspaceId,
        count: result.data.length,
        cacheKey: storageKey,
        trigger,
        initialOnly,
        responseTime: Date.now() - lastPrefetch
      });
      
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
  priorityOrder.forEach(({ section, delay }) => {
    // Skip current section - it's already loading with priority
    if (section !== detectedCurrentSection && section !== currentSection) {
      // Fetch first page with priority-based delay for instant loading
      setTimeout(() => {
        debouncedPrefetch({
          workspaceId,
          userId,
          section,
          trigger: `${trigger}-initial-${section}`,
          initialOnly: true // Only fetch first 100 records
        });
      }, delay);
      
      // Then fetch remaining pages in background after additional delay
      // Use requestIdleCallback for low-priority sections (companies, people)
      const backgroundDelay = delay + 2000; // Wait 2s after initial prefetch
      
      if (section === 'companies' || section === 'people') {
        // Use requestIdleCallback for low-priority sections to avoid blocking
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          requestIdleCallback(() => {
            setTimeout(() => {
              prefetchSectionData({
                workspaceId,
                userId,
                section,
                trigger: `${trigger}-background-${section}`,
                initialOnly: false // Fetch all remaining records
              });
            }, backgroundDelay - delay);
          }, { timeout: 5000 });
        } else {
          // Fallback to setTimeout if requestIdleCallback not available
          setTimeout(() => {
            prefetchSectionData({
              workspaceId,
              userId,
              section,
              trigger: `${trigger}-background-${section}`,
              initialOnly: false
            });
          }, backgroundDelay);
        }
      } else {
        // High-priority sections use regular setTimeout
        setTimeout(() => {
          prefetchSectionData({
            workspaceId,
            userId,
            section,
            trigger: `${trigger}-background-${section}`,
            initialOnly: false // Fetch all remaining records
          });
        }, backgroundDelay);
      }
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

