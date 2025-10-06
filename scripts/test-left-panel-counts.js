// Browser console script to test left panel counts
// Copy and paste this into the browser console

console.log('🧪 Testing left panel counts...');

// Test 1: Check if useFastCounts is being called
console.log('🔍 Checking if useFastCounts hook is working...');

// Test 2: Check localStorage for any cached data
console.log('🔍 Checking localStorage for cached counts...');
const cacheKeys = Object.keys(localStorage).filter(key => 
  key.includes('counts') || 
  key.includes('fastCounts') ||
  key.includes('acquisition')
);
console.log('📊 Cache keys found:', cacheKeys);
cacheKeys.forEach(key => {
  const value = localStorage.getItem(key);
  console.log(`📊 ${key}:`, value?.substring(0, 100) + '...');
});

// Test 3: Check if there are any errors in the console
console.log('🔍 Check the browser console for any errors related to counts loading');

// Test 4: Check current workspace and user
console.log('🔍 Checking current workspace and user...');
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('📊 User data:', {
  id: user.id,
  activeWorkspaceId: user.activeWorkspaceId,
  workspaces: user.workspaces?.map(w => ({ id: w.id, name: w.name }))
});

// Test 5: Check if the counts API is being called
console.log('🔍 Check Network tab in DevTools for calls to /api/data/counts');

// Test 6: Force refresh counts
console.log('🔍 Attempting to force refresh counts...');
if (typeof window !== 'undefined' && window.location.href.includes('demo')) {
  // Clear all caches
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear any service worker caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  console.log('🧹 Cleared all caches - refreshing page...');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

console.log('✅ Left panel counts test completed');
