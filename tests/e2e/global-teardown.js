/**
 * Global Teardown for Playwright E2E Tests
 * 
 * Runs after all tests to clean up the test environment
 */

async function globalTeardown(config) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Optional: Clean up any global test data
    // This could include removing test users, cleaning up test data, etc.
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    throw error;
  }
}

module.exports = globalTeardown;
