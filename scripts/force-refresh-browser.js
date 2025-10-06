// Browser console script to force refresh all data
// Copy and paste this into the browser console to force refresh everything

console.log('🔄 Force refreshing all data...');

// Method 1: Clear all caches
if (typeof window !== 'undefined') {
  // Clear localStorage cache
  const keys = Object.keys(localStorage);
  const cacheKeys = keys.filter(key => 
    key.includes('counts') || 
    key.includes('fastCounts') || 
    key.includes('acquisition') ||
    key.includes('unified') ||
    key.includes('section')
  );
  cacheKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('🧹 Cleared cache key:', key);
  });
  
  // Clear sessionStorage
  sessionStorage.clear();
  console.log('🧹 Cleared sessionStorage');
  
  // Clear any fetch cache
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('🧹 Cleared cache:', cacheName);
      });
    });
  }
}

// Method 2: Force refresh counts API
if (typeof window !== 'undefined') {
  console.log('🔄 Force refreshing counts API...');
  
  // Try to call the counts API directly
  fetch('/api/data/counts?t=' + Date.now(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('📊 Counts API response:', data);
    if (data.success && data.data) {
      console.log('✅ Counts loaded:', data.data);
    } else {
      console.log('❌ Counts API failed:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Counts API error:', error);
  });
}

// Method 3: Force refresh section API
if (typeof window !== 'undefined') {
  console.log('🔄 Force refreshing section API...');
  
  // Try to call the section API for companies
  fetch('/api/data/section?section=companies&limit=30&t=' + Date.now(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('📊 Section API response:', data);
    if (data.success && data.data) {
      console.log('✅ Section data loaded:', data.data.data?.length || 0, 'items');
    } else {
      console.log('❌ Section API failed:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Section API error:', error);
  });
}

// Method 4: Force page reload
console.log('🔄 Reloading page to clear all caches...');
if (typeof window !== 'undefined') {
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

console.log('✅ Force refresh script completed');
