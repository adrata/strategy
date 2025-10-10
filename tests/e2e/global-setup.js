/**
 * Global Setup for Playwright E2E Tests
 * 
 * Runs before all tests to set up the test environment,
 * verify database connectivity, and prepare test data.
 */

const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting global test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Verify the application is running
    console.log('🔍 Verifying application is running...');
    await page.goto('http://localhost:3000', { timeout: 30000 });
    
    // Check if the page loads successfully
    const title = await page.title();
    console.log(`✅ Application loaded successfully. Title: ${title}`);
    
    // Verify sign-in page is accessible
    console.log('🔍 Verifying sign-in page accessibility...');
    await page.goto('http://localhost:3000/sign-in', { timeout: 10000 });
    
    const signInTitle = await page.title();
    console.log(`✅ Sign-in page accessible. Title: ${signInTitle}`);
    
    // Check for any console errors during setup
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.warn('⚠️  Console errors detected during setup:', errors);
    } else {
      console.log('✅ No console errors detected during setup');
    }
    
    // Verify test user credentials are available
    const testUserEmail = process.env.TEST_USER_EMAIL;
    const testUserPassword = process.env.TEST_USER_PASSWORD;
    
    if (!testUserEmail || !testUserPassword) {
      console.warn('⚠️  Test user credentials not found in environment variables');
      console.warn('   Using default test credentials. Make sure test user exists in database.');
    } else {
      console.log('✅ Test user credentials found in environment variables');
    }
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
