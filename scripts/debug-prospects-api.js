/**
 * Debug Prospects API Script
 * 
 * This script helps debug the prospects API issue
 */

async function debugProspectsAPI() {
  console.log('🔍 Debugging Prospects API');
  console.log('==========================');
  
  try {
    // Test the prospects API directly
    console.log('Step 1: Testing prospects API...');
    const response = await fetch('/api/v1/people?section=prospects&limit=10000');
    const data = await response.json();
    
    console.log('Prospects API Response:', {
      status: response.status,
      success: data.success,
      hasData: !!data.data,
      dataLength: data.data ? data.data.length : 0,
      error: data.error,
      meta: data.meta
    });
    
    if (data.success && data.data) {
      console.log('✅ Prospects API working correctly');
      console.log('Sample data:', data.data.slice(0, 3));
    } else {
      console.error('❌ Prospects API failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing prospects API:', error);
  }
}

async function debugAllSections() {
  console.log('🔍 Testing All Sections');
  console.log('===========================');
  
  const sections = ['leads', 'prospects', 'opportunities', 'people', 'companies'];
  
  for (const section of sections) {
    try {
      console.log(`Testing ${section}...`);
      
      let url;
      switch (section) {
        case 'leads':
          url = '/api/v1/people?section=leads&limit=10000';
          break;
        case 'prospects':
          url = '/api/v1/people?section=prospects&limit=10000';
          break;
        case 'opportunities':
          url = '/api/v1/people?section=opportunities&limit=10000';
          break;
        case 'people':
          url = '/api/v1/people?limit=10000';
          break;
        case 'companies':
          url = '/api/v1/companies?limit=10000';
          break;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`${section}:`, {
        status: response.status,
        success: data.success,
        hasData: !!data.data,
        dataLength: data.data ? data.data.length : 0,
        error: data.error
      });
      
    } catch (error) {
      console.error(`❌ Error testing ${section}:`, error);
    }
  }
}

// Export functions
window.debugProspectsAPI = debugProspectsAPI;
window.debugAllSections = debugAllSections;

console.log('🔧 Prospects API Debug Script Loaded');
console.log('Available functions:');
console.log('- debugProspectsAPI() - Test prospects API specifically');
console.log('- debugAllSections() - Test all section APIs');
console.log('');
console.log('Run debugProspectsAPI() to start debugging');
