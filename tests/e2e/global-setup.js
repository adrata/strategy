/**
 * Global Setup for Playwright E2E Tests
 * 
 * Runs before all tests to set up the test environment
 */

const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the dev server to be ready
    console.log('⏳ Waiting for dev server to be ready...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Dev server is ready');
    
    // Optional: Set up any global test data or authentication
    // This could include creating test users, setting up test data, etc.
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
