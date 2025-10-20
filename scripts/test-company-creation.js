/**
 * Manual Test Script for Company Creation Verification
 * 
 * This script can be run in the browser console to test company creation flows
 * and verify that companies appear in the company list after creation.
 */

// Test configuration
const TEST_COMPANY_NAME = `Test Company ${Date.now()}`;
const TEST_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP'; // Replace with actual workspace ID

// Helper function to clear all caches
function clearAllCaches() {
  console.log('🧹 Clearing all caches...');
  
  // Clear localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('companies') || key.includes('unified') || key.includes('acquisition')) {
      localStorage.removeItem(key);
      console.log(`🗑️ Cleared localStorage key: ${key}`);
    }
  });
  
  // Clear sessionStorage
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    if (key.includes('companies') || key.includes('unified') || key.includes('acquisition')) {
      sessionStorage.removeItem(key);
      console.log(`🗑️ Cleared sessionStorage key: ${key}`);
    }
  });
  
  console.log('✅ Cache clearing completed');
}

// Helper function to create a company via API
async function createCompanyViaAPI(companyName) {
  console.log(`🏢 Creating company via API: ${companyName}`);
  
  try {
    const response = await fetch('/api/v1/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: companyName,
        website: 'https://testcompany.com',
        notes: 'Test company created via API'
      })
    });
    
    const result = await response.json();
    console.log('📡 API Response:', result);
    
    if (result.success) {
      console.log('✅ Company created successfully via API');
      return result.data;
    } else {
      console.error('❌ Company creation failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating company:', error);
    return null;
  }
}

// Helper function to fetch companies from API
async function fetchCompaniesFromAPI() {
  console.log('🔍 Fetching companies from API...');
  
  try {
    const response = await fetch('/api/v1/companies');
    const result = await response.json();
    console.log('📡 Companies API Response:', result);
    
    if (result.success) {
      console.log(`✅ Found ${result.data.length} companies`);
      return result.data;
    } else {
      console.error('❌ Failed to fetch companies:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    return [];
  }
}

// Helper function to check if company exists in list
function checkCompanyInList(companies, companyName) {
  const found = companies.find(company => company.name === companyName);
  if (found) {
    console.log(`✅ Company "${companyName}" found in list with ID: ${found.id}`);
    return true;
  } else {
    console.log(`❌ Company "${companyName}" not found in list`);
    return false;
  }
}

// Main test function
async function testCompanyCreation() {
  console.log('🚀 Starting Company Creation Test');
  console.log('=====================================');
  
  // Step 1: Clear all caches
  clearAllCaches();
  
  // Step 2: Create company via API
  const createdCompany = await createCompanyViaAPI(TEST_COMPANY_NAME);
  if (!createdCompany) {
    console.error('❌ Test failed: Could not create company');
    return;
  }
  
  // Step 3: Wait a moment for any async operations
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Fetch companies from API
  const companies = await fetchCompaniesFromAPI();
  
  // Step 5: Check if company appears in list
  const companyFound = checkCompanyInList(companies, TEST_COMPANY_NAME);
  
  if (companyFound) {
    console.log('✅ TEST PASSED: Company creation and retrieval working correctly');
  } else {
    console.log('❌ TEST FAILED: Company not found in list after creation');
  }
  
  // Step 6: Test cache invalidation
  console.log('🧪 Testing cache invalidation...');
  
  // Check if cache was cleared
  const cacheKey = `adrata-companies-${TEST_WORKSPACE_ID}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    console.log('⚠️ Cache still contains data:', JSON.parse(cachedData));
  } else {
    console.log('✅ Cache was properly cleared');
  }
  
  console.log('=====================================');
  console.log('🏁 Test completed');
}

// Helper function to test cache invalidation events
function testCacheInvalidationEvents() {
  console.log('🧪 Testing cache invalidation events...');
  
  // Listen for cache invalidation events
  window.addEventListener('cache-invalidate', (event) => {
    console.log('📡 Cache invalidation event received:', event.detail);
  });
  
  // Dispatch a test event
  window.dispatchEvent(new CustomEvent('cache-invalidate', {
    detail: { 
      pattern: 'companies-*', 
      reason: 'test_event',
      section: 'companies'
    }
  }));
  
  console.log('✅ Cache invalidation event test completed');
}

// Export functions for manual testing
window.testCompanyCreation = testCompanyCreation;
window.clearAllCaches = clearAllCaches;
window.createCompanyViaAPI = createCompanyViaAPI;
window.fetchCompaniesFromAPI = fetchCompaniesFromAPI;
window.testCacheInvalidationEvents = testCacheInvalidationEvents;

console.log('🔧 Company Creation Test Script Loaded');
console.log('Available functions:');
console.log('- testCompanyCreation() - Run full test');
console.log('- clearAllCaches() - Clear all caches');
console.log('- createCompanyViaAPI(name) - Create company via API');
console.log('- fetchCompaniesFromAPI() - Fetch companies from API');
console.log('- testCacheInvalidationEvents() - Test cache events');
console.log('');
console.log('Run testCompanyCreation() to start the test');
