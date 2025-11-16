/**
 * Puppeteer E2E Test: No Refresh Loop on Opportunity and Lead Records
 * 
 * Tests that clicking on opportunity and lead records does not cause
 * perpetual page refreshes every 1-2 seconds.
 * 
 * This test validates the fix for the infinite refresh loop bug.
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Test configuration
const TEST_EMAIL = process.env.TEST_EMAIL || 'ross@adrata.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Themill08!';
const TEST_WORKSPACE = process.env.TEST_WORKSPACE || 'test-workspace';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('No Refresh Loop - Opportunity and Lead Records (Puppeteer)', () => {
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

  // Helper function to get first record ID from a section
  async function getFirstRecordId(section: string): Promise<string | null> {
    // Navigate to the section
    await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/${section}`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000); // Wait for data to load
    
    // Try to find a record row in the table
    const recordRow = await page.$('table tbody tr:first-child, [data-testid*="record-row"], [data-record-id]');
    
    if (recordRow) {
      // Try to get the ID from various possible attributes
      const id = await page.evaluate((el) => {
        return el.getAttribute('data-record-id') || 
               el.getAttribute('data-id') ||
               el.getAttribute('id') ||
               null;
      }, recordRow);
      
      if (id) return id;
      
      // Try to extract from href if it's a link
      const link = await recordRow.$('a');
      if (link) {
        const href = await page.evaluate((el) => el.getAttribute('href'), link);
        if (href) {
          const match = href.match(/\/([^\/]+)$/);
          if (match) return match[1];
        }
      }
      
      // Try to extract from click handler or data attribute
      const rowText = await page.evaluate((el) => el.textContent, recordRow);
      if (rowText) {
        // Try to find an ID pattern in the text or attributes
        const allAttributes = await page.evaluate((el) => {
          const attrs: Record<string, string> = {};
          for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            attrs[attr.name] = attr.value;
          }
          return attrs;
        }, recordRow);
        
        // Look for ID-like attributes
        for (const [key, value] of Object.entries(allAttributes)) {
          if (key.includes('id') || key.includes('record')) {
            if (value && value.length > 10) { // Likely an actual ID
              return value;
            }
          }
        }
      }
    }
    
    return null;
  }

  test('opportunity record should not cause refresh loop', async () => {
    // Get first opportunity record ID
    const recordId = await getFirstRecordId('opportunities');
    
    if (!recordId) {
      console.log('⚠️ No opportunity records found to test');
      return;
    }

    // Navigate to the opportunity record
    const recordUrl = `${BASE_URL}/${TEST_WORKSPACE}/opportunities/${recordId}`;
    console.log(`📍 Navigating to opportunity record: ${recordUrl}`);
    
    // Track navigation events
    let navigationCount = 0;
    const initialUrl = recordUrl;
    
    // Set up navigation listener
    page.on('framenavigated', () => {
      navigationCount++;
      console.log(`🔄 Navigation event #${navigationCount}: ${page.url()}`);
    });

    // Navigate to the record
    await page.goto(recordUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    
    // Wait for the page to stabilize
    await page.waitForTimeout(1000);
    
    // Monitor for 5 seconds
    const startTime = Date.now();
    const startUrl = page.url();
    let urlChangeCount = 0;
    
    // Check URL every 500ms for 5 seconds
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      
      if (currentUrl !== startUrl) {
        urlChangeCount++;
        console.log(`⚠️ URL changed from ${startUrl} to ${currentUrl}`);
      }
    }
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    // Verify results
    const finalUrl = page.url();
    console.log(`✅ Test completed:`);
    console.log(`   - Initial URL: ${startUrl}`);
    console.log(`   - Final URL: ${finalUrl}`);
    console.log(`   - Navigation events: ${navigationCount}`);
    console.log(`   - URL changes detected: ${urlChangeCount}`);
    console.log(`   - Elapsed time: ${elapsedTime}ms`);
    
    // Assertions
    expect(finalUrl).toBe(recordUrl);
    expect(navigationCount).toBeLessThan(3); // Allow for initial load
    expect(urlChangeCount).toBe(0); // No URL changes during monitoring
    
    // Verify the page is still functional
    const bodyContent = await page.evaluate(() => document.body.textContent);
    expect(bodyContent).toBeTruthy();
    expect(bodyContent!.length).toBeGreaterThan(100); // Should have content
  });

  test('lead record should not cause refresh loop', async () => {
    // Get first lead record ID
    const recordId = await getFirstRecordId('leads');
    
    if (!recordId) {
      console.log('⚠️ No lead records found to test');
      return;
    }

    // Navigate to the lead record
    const recordUrl = `${BASE_URL}/${TEST_WORKSPACE}/leads/${recordId}`;
    console.log(`📍 Navigating to lead record: ${recordUrl}`);
    
    // Track navigation events
    let navigationCount = 0;
    
    // Set up navigation listener
    page.on('framenavigated', () => {
      navigationCount++;
      console.log(`🔄 Navigation event #${navigationCount}: ${page.url()}`);
    });

    // Navigate to the record
    await page.goto(recordUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    
    // Wait for the page to stabilize
    await page.waitForTimeout(1000);
    
    // Monitor for 5 seconds
    const startTime = Date.now();
    const startUrl = page.url();
    let urlChangeCount = 0;
    
    // Check URL every 500ms for 5 seconds
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      
      if (currentUrl !== startUrl) {
        urlChangeCount++;
        console.log(`⚠️ URL changed from ${startUrl} to ${currentUrl}`);
      }
    }
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    // Verify results
    const finalUrl = page.url();
    console.log(`✅ Test completed:`);
    console.log(`   - Initial URL: ${startUrl}`);
    console.log(`   - Final URL: ${finalUrl}`);
    console.log(`   - Navigation events: ${navigationCount}`);
    console.log(`   - URL changes detected: ${urlChangeCount}`);
    console.log(`   - Elapsed time: ${elapsedTime}ms`);
    
    // Assertions
    expect(finalUrl).toBe(recordUrl);
    expect(navigationCount).toBeLessThan(3); // Allow for initial load
    expect(urlChangeCount).toBe(0); // No URL changes during monitoring
    
    // Verify the page is still functional
    const bodyContent = await page.evaluate(() => document.body.textContent);
    expect(bodyContent).toBeTruthy();
    expect(bodyContent!.length).toBeGreaterThan(100); // Should have content
  });

  test('prospect record should work normally (control test)', async () => {
    // Get first prospect record ID
    const recordId = await getFirstRecordId('prospects');
    
    if (!recordId) {
      console.log('⚠️ No prospect records found to test');
      return;
    }

    // Navigate to the prospect record
    const recordUrl = `${BASE_URL}/${TEST_WORKSPACE}/prospects/${recordId}`;
    console.log(`📍 Navigating to prospect record: ${recordUrl}`);
    
    await page.goto(recordUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Verify the page is stable
    const finalUrl = page.url();
    expect(finalUrl).toBe(recordUrl);
    
    const bodyContent = await page.evaluate(() => document.body.textContent);
    expect(bodyContent).toBeTruthy();
    
    console.log(`✅ Prospect record test passed (control test)`);
  });

  test('people record should work normally (control test)', async () => {
    // Get first people record ID
    const recordId = await getFirstRecordId('people');
    
    if (!recordId) {
      console.log('⚠️ No people records found to test');
      return;
    }

    // Navigate to the people record
    const recordUrl = `${BASE_URL}/${TEST_WORKSPACE}/people/${recordId}`;
    console.log(`📍 Navigating to people record: ${recordUrl}`);
    
    await page.goto(recordUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Verify the page is stable
    const finalUrl = page.url();
    expect(finalUrl).toBe(recordUrl);
    
    const bodyContent = await page.evaluate(() => document.body.textContent);
    expect(bodyContent).toBeTruthy();
    
    console.log(`✅ People record test passed (control test)`);
  });
});

