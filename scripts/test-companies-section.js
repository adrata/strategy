// Browser console script to test companies section API
// Copy and paste this into the browser console

console.log('🧪 Testing companies section API...');

// Test 1: Check if useFastSectionData is being called
console.log('🔍 Checking if useFastSectionData is being called for companies...');

// Test 2: Make direct API call to companies section
fetch('/api/data/section?section=companies&limit=30', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📡 Companies API response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('📊 Companies API response:', data);
  if (data.success && data.data) {
    console.log('✅ Companies API working:', {
      count: data.data.count,
      totalCount: data.data.totalCount,
      items: data.data.data?.length,
      firstItem: data.data.data?.[0]?.name || 'No items'
    });
  } else {
    console.log('❌ Companies API failed:', data.error);
  }
})
.catch(error => {
  console.error('❌ Companies API error:', error);
});

// Test 3: Check localStorage for any cached data
console.log('🔍 Checking localStorage for cached data...');
const cacheKeys = Object.keys(localStorage).filter(key => 
  key.includes('companies') || 
  key.includes('section') || 
  key.includes('fastSection')
);
console.log('📊 Cache keys found:', cacheKeys);
cacheKeys.forEach(key => {
  const value = localStorage.getItem(key);
  console.log(`📊 ${key}:`, value?.substring(0, 100) + '...');
});

// Test 4: Check if there are any errors in the console
console.log('🔍 Check the browser console for any errors related to companies section loading');

console.log('✅ Companies section test completed');
