/**
 * 🔍 BROWSER CONSOLE DEBUG SCRIPT
 * 
 * Copy and paste this script into the browser console when you're on the
 * TOP Engineering Plus workspace to debug the count issues.
 * 
 * Instructions:
 * 1. Navigate to the TOP Engineering Plus workspace
 * 2. Open browser developer tools (F12)
 * 3. Go to the Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run it
 */

(function debugTopEngineeringPlusCounts() {
  console.log('🔍 DEBUGGING TOP ENGINEERING PLUS COUNTS');
  console.log('==========================================');
  
  // Check if we're in the right workspace
  const currentPath = window.location.pathname;
  console.log('📍 Current path:', currentPath);
  
  // Check for workspace ID in URL or localStorage
  const workspaceId = localStorage.getItem('activeWorkspaceId') || 
                     new URLSearchParams(window.location.search).get('workspaceId') ||
                     'Not found in URL or localStorage';
  console.log('🏢 Workspace ID:', workspaceId);
  
  // Check if it's the correct workspace
  if (workspaceId !== '01K5D01YCQJ9TJ7CT4DZDE79T1') {
    console.error('❌ WRONG WORKSPACE ID!');
    console.error('   Expected: 01K5D01YCQJ9TJ7CT4DZDE79T1');
    console.error('   Found:', workspaceId);
    console.error('   This is likely the cause of the count issues.');
  } else {
    console.log('✅ Correct workspace ID found');
  }
  
  // Test API call
  console.log('🌐 Testing API call...');
  fetch('/api/data/unified?type=dashboard&action=get&workspaceId=' + workspaceId + '&userId=test-user')
    .then(response => {
      console.log('📡 API Response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('📊 API Response data:', data);
      
      if (data.success && data.data?.counts) {
        console.log('✅ API returned counts:', data.data.counts);
        
        // Check if counts match expected values
        const expectedCounts = {
          leads: 3939,
          prospects: 587,
          people: 3172,
          companies: 476,
          opportunities: 0,
          clients: 0,
          partners: 0
        };
        
        console.log('🎯 Comparing with expected counts:');
        Object.keys(expectedCounts).forEach(key => {
          const actual = data.data.counts[key] || 0;
          const expected = expectedCounts[key];
          const match = actual === expected;
          console.log(`   ${key}: ${actual} (expected: ${expected}) ${match ? '✅' : '❌'}`);
        });
      } else {
        console.error('❌ API did not return counts');
        console.error('   Response:', data);
      }
    })
    .catch(error => {
      console.error('❌ API call failed:', error);
    });
  
  // Check for React components in the DOM
  console.log('⚛️ Checking for React components...');
  const leftPanel = document.querySelector('[class*="PipelineLeftPanel"]');
  if (leftPanel) {
    console.log('✅ Found Pipeline Left Panel component');
  } else {
    console.log('❌ Pipeline Left Panel component not found');
  }
  
  // Check for acquisition data in window object
  console.log('🔍 Checking for acquisition data...');
  if (window.__NEXT_DATA__) {
    console.log('📦 Next.js data found:', window.__NEXT_DATA__);
  }
  
  // Check for any global state
  console.log('🌍 Checking for global state...');
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔧 React DevTools found');
  }
  
  console.log('✅ Debug script completed');
  console.log('💡 If counts are still wrong, check:');
  console.log('   1. Workspace ID is correct');
  console.log('   2. API response contains correct data');
  console.log('   3. Cache is not stale');
  console.log('   4. Acquisition data is loading properly');
})();

