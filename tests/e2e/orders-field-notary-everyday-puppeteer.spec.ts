/**
 * Puppeteer E2E Tests: Orders Field for Notary Everyday Workspace
 * 
 * Comprehensive test suite to verify Orders field functionality using Puppeteer:
 * 1. Orders field in company detail view (Overview tab)
 * 2. Orders field in company tabs for leads/prospects/opportunities/people records
 * 3. Orders column in clients table (retention-os)
 * 4. Orders sorting functionality
 * 5. Orders editing functionality
 * 
 * This test requires:
 * - Notary Everyday workspace access
 * - Test user with access to Notary Everyday workspace
 * - At least one company record in Notary Everyday workspace
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Test configuration
const TEST_EMAIL = process.env.TEST_EMAIL || 'ryan@notaryeveryday.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';
const TEST_WORKSPACE = process.env.TEST_WORKSPACE || 'notary-everyday';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('Orders Field - Notary Everyday Workspace (Puppeteer)', () => {
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
    
    // Login - try multiple selectors
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="Email" i]',
      'input[placeholder*="Username" i]',
      'label:has-text("Email") + input',
      'label:has-text("Username") + input'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.$(selector);
        if (emailInput) break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
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
    
    // Verify we're in the workspace
    const url = page.url();
    expect(url).toMatch(/\/(notary-everyday|ne)\//);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Company Detail View - Orders Field', () => {
    test('should display Orders field in company Overview tab', async () => {
      // Navigate to companies page
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`, { waitUntil: 'networkidle2' });
      
      // Wait for companies table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      
      // Click on first company
      const firstRow = await page.$('table tbody tr:first-child');
      if (firstRow) {
        await firstRow.click();
        
        // Wait for navigation or content to load
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
        } catch (e) {
          // Navigation might not happen if it's a SPA, just wait for content
        }
        await page.waitForTimeout(2000);
        
        // Look for Orders field in Key Metrics section
        const ordersText = await page.$eval('body', (el) => {
          return el.textContent?.includes('Orders') || false;
        });
        
        expect(ordersText).toBe(true);
        
        // Verify Orders field is visible by checking for the text
        const ordersElement = await page.evaluateHandle(() => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let node;
          while (node = walker.nextNode()) {
            if (node.textContent?.trim() === 'Orders') {
              return node.parentElement;
            }
          }
          return null;
        });
        
        expect(ordersElement).not.toBeNull();
      }
    });

    test('should allow editing Orders field in company Overview tab', async () => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`, { waitUntil: 'networkidle2' });
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      
      const firstRow = await page.$('table tbody tr:first-child');
      if (firstRow) {
        await firstRow.click();
        
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
        } catch (e) {
          // Navigation might not happen
        }
        await page.waitForTimeout(2000);
        
        // Find Orders input field - look for number input near "Orders" text
        const ordersInput = await page.evaluateHandle(() => {
          // Find element containing "Orders" text
          const ordersText = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent?.trim() === 'Orders'
          );
          
          if (ordersText) {
            // Look for input in the same container
            const container = ordersText.closest('div, section, article');
            if (container) {
              const input = container.querySelector('input[type="number"], input');
              return input;
            }
          }
          return null;
        });
        
        if (ordersInput && ordersInput.asElement()) {
          const inputElement = ordersInput.asElement() as any;
          await inputElement.click();
          await page.waitForTimeout(500);
          
          // Clear and enter new value
          await inputElement.click({ clickCount: 3 });
          await inputElement.type('150');
          await page.keyboard.press('Enter');
          
          // Wait for API call
          await page.waitForResponse(
            (response) => 
              response.url().includes('/api/v1/companies/') && 
              response.request().method() === 'PATCH',
            { timeout: 5000 }
          );
          
          await page.waitForTimeout(1000);
          
          // Verify the value
          const value = await page.evaluate((el) => (el as HTMLInputElement).value, inputElement);
          expect(value).toContain('150');
        }
      }
    });
  });

  describe('Company Tab - Orders Field for People/Leads/Prospects', () => {
    test('should display Orders field in company tab for people records', async () => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/people`, { waitUntil: 'networkidle2' });
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.click('table tbody tr:first-child');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Navigate to Company tab
      const companyTab = await page.$('button:has-text("Account"), button:has-text("Company")');
      if (companyTab) {
        await companyTab.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for Orders field
      const ordersText = await page.$eval('body', (el) => {
        return el.textContent?.includes('Orders') || false;
      });
      
      expect(ordersText).toBe(true);
    });

    test('should allow editing Orders field in company tab', async () => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/people`, { waitUntil: 'networkidle2' });
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.click('table tbody tr:first-child');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Navigate to Company tab
      const companyTab = await page.$('button:has-text("Account"), button:has-text("Company")');
      if (companyTab) {
        await companyTab.click();
        await page.waitForTimeout(1000);
      }
      
      // Find and edit Orders field
      const ordersInput = await page.$('input[type="number"]');
      if (ordersInput) {
        await ordersInput.click();
        await page.waitForTimeout(500);
        
        await ordersInput.click({ clickCount: 3 });
        await ordersInput.type('200');
        await page.keyboard.press('Enter');
        
        // Wait for save
        await page.waitForResponse(
          (response) => 
            response.url().includes('/api/v1/companies/') && 
            response.request().method() === 'PATCH',
          { timeout: 5000 }
        );
        
        await page.waitForTimeout(1000);
        const value = await page.evaluate((el) => (el as HTMLInputElement).value, ordersInput);
        expect(value).toContain('200');
      }
    });
  });

  describe('Clients Table - Orders Column', () => {
    test('should display Orders column in retention-os clients table', async () => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/retention-os/clients`, { waitUntil: 'networkidle2' });
      
      // Wait for table to load
      await page.waitForSelector('table thead th', { timeout: 10000 });
      
      // Check for Orders column header
      const hasOrdersHeader = await page.evaluate(() => {
        const headers = Array.from(document.querySelectorAll('table thead th'));
        return headers.some(th => th.textContent?.includes('Orders'));
      });
      
      expect(hasOrdersHeader).toBe(true);
    });

    test('should allow sorting by Orders column', async () => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/retention-os/clients`, { waitUntil: 'networkidle2' });
      
      await page.waitForSelector('table thead th', { timeout: 10000 });
      
      // Find Orders header and click
      const ordersHeader = await page.evaluateHandle(() => {
        const headers = Array.from(document.querySelectorAll('table thead th'));
        return headers.find(th => th.textContent?.includes('Orders'));
      });
      
      if (ordersHeader) {
        await (ordersHeader as any).click();
        await page.waitForTimeout(1000);
        
        // Wait for API call with sortBy=orders
        await page.waitForResponse(
          (response) => 
            response.url().includes('/api/v1/companies') && 
            response.url().includes('sortBy=orders'),
          { timeout: 5000 }
        );
        
        // Verify table is still visible
        const tableVisible = await page.$('table tbody tr');
        expect(tableVisible).not.toBeNull();
      }
    });
  });

  describe('Orders Field Persistence', () => {
    test('should persist Orders value after page refresh', async () => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`, { waitUntil: 'networkidle2' });
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.click('table tbody tr:first-child');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Find and edit Orders field
      const ordersInput = await page.$('input[type="number"]');
      if (ordersInput) {
        await ordersInput.click();
        await page.waitForTimeout(500);
        
        const testValue = '999';
        await ordersInput.click({ clickCount: 3 });
        await ordersInput.type(testValue);
        await page.keyboard.press('Enter');
        
        // Wait for save
        await page.waitForResponse(
          (response) => 
            response.url().includes('/api/v1/companies/') && 
            response.request().method() === 'PATCH',
          { timeout: 5000 }
        );
        
        await page.waitForTimeout(1000);
        
        // Refresh page
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        // Verify Orders value persisted
        const ordersInputAfterRefresh = await page.$('input[type="number"]');
        if (ordersInputAfterRefresh) {
          const persistedValue = await page.evaluate((el) => (el as HTMLInputElement).value, ordersInputAfterRefresh);
          expect(persistedValue).toContain(testValue);
        }
      }
    });
  });

  describe('Orders API Integration', () => {
    test('should save Orders value via API correctly', async () => {
      let patchRequest: any = null;
      
      // Intercept API calls
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.url().includes('/api/v1/companies/') && request.method() === 'PATCH') {
          patchRequest = request;
        }
        request.continue();
      });
      
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`, { waitUntil: 'networkidle2' });
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.click('table tbody tr:first-child');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Edit Orders field
      const ordersInput = await page.$('input[type="number"]');
      if (ordersInput) {
        await ordersInput.click();
        await page.waitForTimeout(500);
        
        const testValue = '777';
        await ordersInput.click({ clickCount: 3 });
        await ordersInput.type(testValue);
        await page.keyboard.press('Enter');
        
        // Wait for PATCH request
        await page.waitForTimeout(2000);
        
        if (patchRequest) {
          const postData = patchRequest.postData();
          if (postData) {
            const body = JSON.parse(postData);
            expect(body.customFields).toBeTruthy();
            expect(body.customFields.orders).toBe(testValue);
          }
        }
      }
      
      await page.setRequestInterception(false);
    });
  });
});

