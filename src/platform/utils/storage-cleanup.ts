/**
 * Storage Cleanup Utility
 * 
 * Proactively manages localStorage to prevent QuotaExceeded errors.
 * Prioritizes keeping conversation data while cleaning up section/record caches.
 */

// Cache age thresholds (in milliseconds)
const SECTION_CACHE_MAX_AGE = 10 * 60 * 1000; // 10 minutes for section data
const RECORD_CACHE_MAX_AGE = 5 * 60 * 1000;   // 5 minutes for individual records
const CONVERSATION_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days for conversations

// Storage limits (in bytes)
const MAX_STORAGE_USAGE = 4.5 * 1024 * 1024; // 4.5MB target (leave headroom)
const EMERGENCY_CLEANUP_THRESHOLD = 4.8 * 1024 * 1024; // 4.8MB triggers aggressive cleanup

/**
 * Estimate localStorage usage in bytes
 */
export function estimateStorageUsage(): number {
  if (typeof window === 'undefined') return 0;
  
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        // UTF-16 uses 2 bytes per character
        total += (key.length + value.length) * 2;
      }
    }
  }
  return total;
}

/**
 * Get categorized storage breakdown
 */
export function getStorageBreakdown(): {
  sections: number;
  records: number;
  conversations: number;
  other: number;
  total: number;
} {
  if (typeof window === 'undefined') {
    return { sections: 0, records: 0, conversations: 0, other: 0, total: 0 };
  }
  
  let sections = 0;
  let records = 0;
  let conversations = 0;
  let other = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const value = localStorage.getItem(key);
    const size = value ? (key.length + value.length) * 2 : 0;
    
    if (key.startsWith('adrata-record-')) {
      records += size;
    } else if (key.includes('-conversations-') || key.includes('-conversation-')) {
      conversations += size;
    } else if (key.startsWith('adrata-') && (
      key.includes('-people') ||
      key.includes('-companies') ||
      key.includes('-speedrun') ||
      key.includes('-leads') ||
      key.includes('-prospects') ||
      key.includes('-opportunities')
    )) {
      sections += size;
    } else {
      other += size;
    }
  }
  
  return {
    sections,
    records,
    conversations,
    other,
    total: sections + records + conversations + other
  };
}

/**
 * Clear old section caches (people, companies, speedrun, etc.)
 */
export function clearOldSectionCaches(maxAge: number = SECTION_CACHE_MAX_AGE): number {
  if (typeof window === 'undefined') return 0;
  
  const keysToRemove: string[] = [];
  const sectionPrefixes = [
    'adrata-people-',
    'adrata-companies-',
    'adrata-speedrun-',
    'adrata-leads-',
    'adrata-prospects-',
    'adrata-opportunities-',
    'adrata-fast-counts-',
    'adrata-cache-revenue-os'
  ];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const isSection = sectionPrefixes.some(prefix => key.startsWith(prefix));
    if (isSection) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - (parsed.ts || parsed.timestamp || 0);
          if (cacheAge > maxAge || !parsed.ts && !parsed.timestamp) {
            keysToRemove.push(key);
          }
        }
      } catch {
        // Invalid cache, remove it
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
  
  if (keysToRemove.length > 0) {
    console.log(`🧹 [STORAGE CLEANUP] Cleared ${keysToRemove.length} old section caches`);
  }
  
  return keysToRemove.length;
}

/**
 * Clear old individual record caches
 */
export function clearOldRecordCaches(maxAge: number = RECORD_CACHE_MAX_AGE): number {
  if (typeof window === 'undefined') return 0;
  
  const keysToRemove: string[] = [];
  const RECORD_CACHE_PREFIX = 'adrata-record-';
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(RECORD_CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - (parsed.ts || 0);
          if (cacheAge > maxAge || !parsed.ts) {
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
  
  if (keysToRemove.length > 0) {
    console.log(`🧹 [STORAGE CLEANUP] Cleared ${keysToRemove.length} old record caches`);
  }
  
  return keysToRemove.length;
}

/**
 * Clear all caches for a specific workspace (except conversations)
 */
export function clearWorkspaceCaches(workspaceId: string): number {
  if (typeof window === 'undefined' || !workspaceId) return 0;
  
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(workspaceId)) {
      // Don't clear conversation data
      if (!key.includes('-conversations-') && !key.includes('-conversation-')) {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
  
  if (keysToRemove.length > 0) {
    console.log(`🧹 [STORAGE CLEANUP] Cleared ${keysToRemove.length} workspace caches for ${workspaceId}`);
  }
  
  return keysToRemove.length;
}

/**
 * Emergency cleanup - aggressively clear old data when quota is near
 */
export function emergencyCleanup(): number {
  if (typeof window === 'undefined') return 0;
  
  let cleared = 0;
  
  // 1. Clear ALL record caches immediately (they reload fast)
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('adrata-record-')) {
      try {
        localStorage.removeItem(key);
        cleared++;
      } catch {}
    }
  }
  
  // 2. Clear all section caches older than 1 minute
  cleared += clearOldSectionCaches(60 * 1000);
  
  // 3. Clear buyer-groups and people-tab caches
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('buyer-groups-') || key.startsWith('people-'))) {
      try {
        localStorage.removeItem(key);
        cleared++;
      } catch {}
    }
  }
  
  console.log(`🚨 [STORAGE CLEANUP] Emergency cleanup cleared ${cleared} items`);
  return cleared;
}

/**
 * Proactive storage cleanup - call this on app initialization
 * Returns true if cleanup was needed
 */
export function proactiveStorageCleanup(): boolean {
  if (typeof window === 'undefined') return false;
  
  const usage = estimateStorageUsage();
  const breakdown = getStorageBreakdown();
  
  console.log(`📊 [STORAGE] Current usage: ${(usage / 1024 / 1024).toFixed(2)}MB`, {
    sections: `${(breakdown.sections / 1024).toFixed(0)}KB`,
    records: `${(breakdown.records / 1024).toFixed(0)}KB`,
    conversations: `${(breakdown.conversations / 1024).toFixed(0)}KB`,
    other: `${(breakdown.other / 1024).toFixed(0)}KB`
  });
  
  // Check if we need emergency cleanup
  if (usage > EMERGENCY_CLEANUP_THRESHOLD) {
    console.warn(`⚠️ [STORAGE] Usage near limit (${(usage / 1024 / 1024).toFixed(2)}MB), running emergency cleanup`);
    emergencyCleanup();
    return true;
  }
  
  // Check if we should do normal cleanup
  if (usage > MAX_STORAGE_USAGE) {
    console.log(`🧹 [STORAGE] Usage above target (${(usage / 1024 / 1024).toFixed(2)}MB), running cleanup`);
    clearOldSectionCaches();
    clearOldRecordCaches();
    return true;
  }
  
  // Always clear very old caches (> 30 minutes)
  const oldCachesCleared = clearOldSectionCaches(30 * 60 * 1000) + clearOldRecordCaches(30 * 60 * 1000);
  
  return oldCachesCleared > 0;
}

/**
 * Clear stale opportunity caches - opportunities change frequently
 * and stale IDs cause 404 errors during prefetch
 */
export function clearStaleOpportunityCaches(): number {
  if (typeof window === 'undefined') return 0;
  
  const OPPORTUNITY_CACHE_MAX_AGE = 2 * 60 * 1000; // 2 minutes for opportunities (they change frequently)
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    // Target opportunity-related caches
    const isOpportunityCache = key.includes('-opportunities-') || 
                               key.includes('-opportunities') ||
                               (key.startsWith('adrata-record-') && key.includes('opportunities'));
    
    if (isOpportunityCache) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - (parsed.ts || parsed.timestamp || 0);
          if (cacheAge > OPPORTUNITY_CACHE_MAX_AGE || (!parsed.ts && !parsed.timestamp)) {
            keysToRemove.push(key);
          }
        }
      } catch {
        // Invalid cache, remove it
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
  
  if (keysToRemove.length > 0) {
    console.log(`🧹 [STORAGE CLEANUP] Cleared ${keysToRemove.length} stale opportunity caches`);
  }
  
  return keysToRemove.length;
}

/**
 * AGGRESSIVE: Clear ALL opportunity caches immediately (use on page load)
 * This prevents 404 errors from stale opportunity IDs during prefetch
 */
export function clearAllOpportunityCaches(): number {
  if (typeof window === 'undefined') return 0;
  
  const keysToRemove: string[] = [];
  
  // Clear localStorage opportunity caches
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    // Target ALL opportunity-related caches
    const isOpportunityCache = key.includes('-opportunities') || 
                               key.includes('opportunity') ||
                               (key.startsWith('adrata-record-') && key.toLowerCase().includes('opportunit'));
    
    if (isOpportunityCache) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
  
  // Also clear sessionStorage opportunity caches (these cause the 404s during prefetch)
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key) continue;
    
    const isOpportunityCache = key.includes('opportunities') || 
                               key.includes('opportunity');
    
    if (isOpportunityCache) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  });
  
  const totalCleared = keysToRemove.length + sessionKeysToRemove.length;
  if (totalCleared > 0) {
    console.log(`🧹 [STORAGE CLEANUP] Cleared ALL ${totalCleared} opportunity caches (localStorage: ${keysToRemove.length}, sessionStorage: ${sessionKeysToRemove.length})`);
  }
  
  return totalCleared;
}

/**
 * Clear all prefetch/record caches to prevent 404 errors
 * Call this when navigating to a new page or on app init
 */
export function clearStalePrefetchCaches(): number {
  if (typeof window === 'undefined') return 0;
  
  const PREFETCH_CACHE_MAX_AGE = 60 * 1000; // 1 minute for prefetch caches
  let cleared = 0;
  
  // Clear stale sessionStorage caches (these are used for prefetch)
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key) continue;
    
    // Target prefetch/cached record keys
    if (key.startsWith('cached-') || key.includes('-prefetch-') || key.includes('-record-')) {
      try {
        const cached = sessionStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const timestamp = parsed.ts || parsed.timestamp || parsed.updatedAt;
          if (timestamp) {
            const cacheAge = Date.now() - new Date(timestamp).getTime();
            if (cacheAge > PREFETCH_CACHE_MAX_AGE) {
              sessionKeysToRemove.push(key);
            }
          } else {
            // No timestamp, consider stale
            sessionKeysToRemove.push(key);
          }
        }
      } catch {
        sessionKeysToRemove.push(key);
      }
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    try {
      sessionStorage.removeItem(key);
      cleared++;
    } catch {}
  });
  
  if (cleared > 0) {
    console.log(`🧹 [STORAGE CLEANUP] Cleared ${cleared} stale prefetch caches`);
  }
  
  return cleared;
}

/**
 * Initialize storage cleanup - call this when the app starts
 */
export function initStorageCleanup(): void {
  if (typeof window === 'undefined') return;
  
  console.log('🚀 [STORAGE CLEANUP] Initializing storage cleanup on app start...');
  
  // AGGRESSIVE: Clear ALL opportunity caches on startup to prevent 404 errors
  // This is the main fix for "stale opportunity prefetch cache" 404s
  clearAllOpportunityCaches();
  
  // Clear stale prefetch caches to prevent 404 errors from old record IDs
  clearStalePrefetchCaches();
  
  // Run proactive cleanup on initialization
  proactiveStorageCleanup();
  
  // Set up periodic cleanup every 5 minutes
  setInterval(() => {
    proactiveStorageCleanup();
  }, 5 * 60 * 1000);
  
  // Set up more frequent opportunity cache cleanup (every 2 minutes)
  setInterval(() => {
    clearStaleOpportunityCaches();
    clearStalePrefetchCaches();
  }, 2 * 60 * 1000);
  
  // Listen for storage quota errors
  window.addEventListener('error', (event) => {
    if (event.message?.includes('QuotaExceeded') || 
        event.message?.includes('quota')) {
      console.warn('🚨 [STORAGE] Quota error detected, running emergency cleanup');
      emergencyCleanup();
    }
  });
  
  // Listen for 404 errors and clear related caches
  window.addEventListener('error', (event) => {
    if (event.message?.includes('404') || event.message?.includes('not found')) {
      console.warn('🚨 [STORAGE] 404 error detected, clearing opportunity caches');
      clearAllOpportunityCaches();
      clearStalePrefetchCaches();
    }
  });
  
  console.log('✅ [STORAGE CLEANUP] Initialization complete');
}

