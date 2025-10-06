// Browser console script to force refresh counts
// Copy and paste this into the browser console to force refresh the left panel counts

console.log('🔄 Force refreshing left panel counts...');

// Method 1: Force refresh the useFastCounts hook
if (typeof window !== 'undefined') {
  // Dispatch a custom event to force refresh
  const event = new CustomEvent('adrata-workspace-switched', {
    detail: { workspaceId: '01K1VBYX2YERMXBFJ60RC6J194' }
  });
  window.dispatchEvent(event);
  console.log('✅ Dispatched workspace switch event');
}

// Method 2: Clear localStorage cache
if (typeof window !== 'undefined') {
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(key => key.includes('counts') || key.includes('fastCounts'));
  cacheKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('🧹 Cleared cache key:', key);
  });
  console.log('✅ Cleared localStorage cache');
}

// Method 3: Force page reload
console.log('🔄 Reloading page to clear all caches...');
if (typeof window !== 'undefined') {
  window.location.reload();
}

console.log('✅ Browser console script completed');
