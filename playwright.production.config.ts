import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Production E2E Tests
 * 
 * Runs tests against production (action.adrata.com) without local server
 */

export default defineConfig({
  testDir: './tests/e2e/production',
  
  // Global test timeout - production tests need more time
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  
  // Fail fast on production - no retries by default
  forbidOnly: true,
  retries: 0,
  
  // Run sequentially for production
  workers: 1,
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/results/production-html-report', open: 'never' }],
  ],
  
  use: {
    // Production URL
    baseURL: 'https://action.adrata.com',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Output directory
    outputDir: 'tests/results/production-artifacts',
    
    // Browser context options
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    
    // Headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  // Only Chromium for production tests
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // NO webServer - we're testing production directly
});

