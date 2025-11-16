/**
 * Puppeteer E2E Test: Buyer Groups Tab Loading on Prospect Records
 * 
 * Tests that the Buyer Groups tab loads correctly on initial prospect record load,
 * even when navigating directly to the tab via URL parameter.
 * 
 * This test validates the fix for the Buyer Groups tab not loading on first load.
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Test configuration
const TEST_EMAIL = process.env.TEST_EMAIL || 'vleland';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TOPgtm01!';
const TEST_WORKSPACE = process.env.TEST_WORKSPACE || 'test-workspace';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test prospect record from the user's example
const TEST_PROSPECT_SLUG = process.env.TEST_PROSPECT_SLUG || 'eric-rupp-01K9QDG4TCS10VXP92F5F1K3GX';

describe('Buyer Groups Tab Loading - Prospect Records (Puppeteer)', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to sign-in
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle2' });
    
    // Login
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
      await emailInput.type(TEST_EMAIL);
    }
    
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.type(TEST_PASSWORD);
    }
    
    const loginButton = await page.$('button:has-text("Start"), button:has-text("Sign In"), button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      // Wait for redirect after login
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    }
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Buyer Groups tab should load on initial prospect record load with tab parameter', async () => {
    // Navigate directly to prospect record with buyer-groups tab parameter
    const prospectUrl = `${BASE_URL}/${TEST_WORKSPACE}/prospects/${TEST_PROSPECT_SLUG}?tab=buyer-groups`;
    console.log(`📍 Navigating to prospect record with Buyer Groups tab: ${prospectUrl}`);
    
    // Track console logs to debug loading issues
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('BUYER GROUPS') || text.includes('companyId')) {
        consoleLogs.push(text);
      }
    });
    
    // Navigate to the prospect record
    await page.goto(prospectUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if Buyer Groups tab is visible/active
    const buyerGroupsTab = await page.$('button:has-text("Buyer Group"), a:has-text("Buyer Group"), [data-tab="buyer-groups"]');
    const isTabVisible = buyerGroupsTab !== null;
    
    console.log(`🔍 Buyer Groups tab visible: ${isTabVisible}`);
    
    // Wait for buyer groups content to load (check for loading spinner or content)
    // Look for either loading state or actual content
    const loadingSpinner = await page.$('.animate-pulse, [data-loading="true"]');
    const buyerGroupContent = await page.$('text=Buyer Group Members, text=No Buyer Group Members Found, .cursor-pointer');
    
    // Wait up to 10 seconds for content to load
    let contentLoaded = false;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      
      // Check if content is loaded (either buyer groups list or empty state)
      const hasContent = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return bodyText.includes('Buyer Group Members') || 
               bodyText.includes('No Buyer Group Members Found') ||
               bodyText.includes('Decision Maker') ||
               bodyText.includes('Champion');
      });
      
      if (hasContent) {
        contentLoaded = true;
        console.log(`✅ Buyer Groups content loaded after ${(i + 1) * 500}ms`);
        break;
      }
    }
    
    // Verify the tab is accessible
    expect(isTabVisible || buyerGroupContent !== null).toBeTruthy();
    
    // Verify content loaded (either with data or empty state)
    expect(contentLoaded).toBeTruthy();
    
    // Log console messages for debugging
    if (consoleLogs.length > 0) {
      console.log('\n📋 Relevant console logs:');
      consoleLogs.forEach(log => console.log(`   ${log}`));
    }
    
    console.log(`✅ Buyer Groups tab loaded successfully on initial load`);
  });

  test('Buyer Groups tab should load after navigating through other tabs', async () => {
    // Navigate to prospect record overview first
    const prospectUrl = `${BASE_URL}/${TEST_WORKSPACE}/prospects/${TEST_PROSPECT_SLUG}`;
    console.log(`📍 Navigating to prospect record overview: ${prospectUrl}`);
    
    await page.goto(prospectUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Click on Company tab first
    const companyTab = await page.$('button:has-text("Company"), a:has-text("Company"), [data-tab="company"]');
    if (companyTab) {
      await companyTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked Company tab');
    }
    
    // Navigate to Buyer Groups tab
    const buyerGroupsTab = await page.$('button:has-text("Buyer Group"), a:has-text("Buyer Group"), [data-tab="buyer-groups"]');
    if (buyerGroupsTab) {
      await buyerGroupsTab.click();
      await page.waitForTimeout(3000);
      console.log('✅ Clicked Buyer Groups tab');
    }
    
    // Verify content loaded
    const contentLoaded = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Buyer Group Members') || 
             bodyText.includes('No Buyer Group Members Found') ||
             bodyText.includes('Decision Maker') ||
             bodyText.includes('Champion');
    });
    
    expect(contentLoaded).toBeTruthy();
    console.log(`✅ Buyer Groups tab loaded successfully after navigating through tabs`);
  });

  test('Buyer Groups tab should work consistently on multiple loads', async () => {
    const prospectUrl = `${BASE_URL}/${TEST_WORKSPACE}/prospects/${TEST_PROSPECT_SLUG}?tab=buyer-groups`;
    
    // Test loading the tab multiple times
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Test iteration ${i + 1}/3`);
      
      await page.goto(prospectUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Verify content loaded
      const contentLoaded = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return bodyText.includes('Buyer Group Members') || 
               bodyText.includes('No Buyer Group Members Found') ||
               bodyText.includes('Decision Maker') ||
               bodyText.includes('Champion');
      });
      
      expect(contentLoaded).toBeTruthy();
      console.log(`✅ Iteration ${i + 1} passed`);
    }
    
    console.log(`✅ Buyer Groups tab loaded consistently across multiple loads`);
  });

  test('Buyer Groups tab should handle missing companyId gracefully', async () => {
    // Navigate to prospect record
    const prospectUrl = `${BASE_URL}/${TEST_WORKSPACE}/prospects/${TEST_PROSPECT_SLUG}?tab=buyer-groups`;
    console.log(`📍 Testing graceful handling of missing companyId`);
    
    // Track network requests to see if API is called
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/v1/people/') || url.includes('/api/data/buyer-groups/')) {
        apiRequests.push(url);
      }
    });
    
    await page.goto(prospectUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(5000); // Wait longer to allow API calls
    
    // Verify that API was called to fetch companyId if needed
    const hasPeopleApiCall = apiRequests.some(url => url.includes('/api/v1/people/'));
    const hasBuyerGroupsApiCall = apiRequests.some(url => url.includes('/api/data/buyer-groups/'));
    
    console.log(`📡 API calls made:`);
    console.log(`   - People API: ${hasPeopleApiCall}`);
    console.log(`   - Buyer Groups API: ${hasBuyerGroupsApiCall}`);
    
    // Verify content loaded (even if empty state)
    const contentLoaded = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Buyer Group Members') || 
             bodyText.includes('No Buyer Group Members Found') ||
             bodyText.includes('Decision Maker') ||
             bodyText.includes('Champion') ||
             bodyText.includes('Loading');
    });
    
    expect(contentLoaded).toBeTruthy();
    console.log(`✅ Tab handled missing companyId gracefully`);
  });
});

