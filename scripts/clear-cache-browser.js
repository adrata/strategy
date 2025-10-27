/**
 * Browser Console Commands to Clear Cache
 * 
 * Run these commands in your browser console to clear the cache
 */

// Method 1: Clear speedrun cache specifically
console.log('🧹 Clearing speedrun cache...');
window.dispatchEvent(new CustomEvent('cache-invalidate', {
  detail: { pattern: 'speedrun', reason: 'manual-clear' }
}));

// Method 2: Clear all localStorage and sessionStorage
console.log('🧹 Clearing all browser storage...');
localStorage.clear();
sessionStorage.clear();

// Method 3: Force reload without cache
console.log('🔄 Force reloading page...');
location.reload(true);

console.log('✅ Cache cleared! Ross should now see ranks 1-12');
