// Browser console script to force refresh all counts
// Copy and paste this into the browser console to force refresh the left panel counts

console.log('🔄 Force refreshing all counts...');

// Method 1: Clear all caches
if (typeof window !== 'undefined') {
  // Clear localStorage cache
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(key => 
    key.includes('counts') || 
    key.includes('fastCounts') || 
    key.includes('acquisition') ||
    key.includes('unified')
  );
  cacheKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('🧹 Cleared cache key:', key);
  });
  
  // Clear sessionStorage
  sessionStorage.clear();
  console.log('🧹 Cleared sessionStorage');
}

// Method 2: Dispatch workspace switch event to force refresh
if (typeof window !== 'undefined') {
  const event = new CustomEvent('adrata-workspace-switched', {
    detail: { workspaceId: '01K1VBYX2YERMXBFJ60RC6J194' }
  });
  window.dispatchEvent(event);
  console.log('✅ Dispatched workspace switch event');
}

// Method 3: Force page reload to clear all caches
console.log('🔄 Reloading page to clear all caches...');
if (typeof window !== 'undefined') {
  window.location.reload();
}

console.log('✅ Force refresh script completed');