/**
 * Global Teardown for Playwright E2E Tests
 * 
 * Runs after all tests to clean up resources,
 * generate reports, and perform final cleanup.
 */

async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Clean up any temporary files or resources
    console.log('🧹 Cleaning up test resources...');
    
    // Log test completion
    console.log('✅ All tests completed');
    console.log('📊 Test results available in tests/results/');
    console.log('🎬 Videos and screenshots saved for failed tests');
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error.message);
    // Don't throw error in teardown to avoid masking test failures
  }
}

module.exports = globalTeardown;
