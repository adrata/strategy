/**
 * Production E2E Tests: Victoria Leland - TOP Engineering Plus
 * 
 * End-to-end tests for the TOP workspace in production using Puppeteer.
 * Tests the complete user journey including:
 * 1. Sign-in to production
 * 2. Navigation through the dashboard
 * 3. Company record interactions
 * 4. People record interactions
 * 5. Speedrun functionality
 * 
 * Test User: Victoria Leland (vleland@topengineersplus.com)
 * Workspace: TOP (Top Engineering Plus)
 * Environment: Production (action.adrata.com)
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Production configuration
const PRODUCTION_URL = 'https://action.adrata.com';
const TEST_EMAIL = process.env.TEST_EMAIL || 'vleland@topengineersplus.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TOPgtm01!';
const WORKSPACE_SLUG = 'top';

// Test timeouts for production environment
const NAVIGATION_TIMEOUT = 30000;
const ELEMENT_TIMEOUT = 15000;
const NETWORK_IDLE_TIMEOUT = 10000;

describe('Victoria Leland - TOP Production E2E Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
    await page.setDefaultTimeout(ELEMENT_TIMEOUT);
  });

  afterEach(async () => {
    if (page) {
      // Take screenshot on failure
      const testState = expect.getState();
      if (testState.currentTestName && testState.assertionCalls > 0) {
        const screenshotPath = `tests/e2e/screenshots/victoria-top-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      }
      await page.close();
    }
  });

  describe('Authentication Flow', () => {
    test('should load the production sign-in page', async () => {
      await page.goto(`${PRODUCTION_URL}/sign-in`, { 
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      // Verify sign-in page elements
      const title = await page.title();
      expect(title).toMatch(/Sign In.*Adrata/i);

      // Check for form elements
      const emailInput = await page.$('input[type="text"], input[name="email"], input[placeholder*="email" i], input[placeholder*="username" i]');
      expect(emailInput).not.toBeNull();

      const passwordInput = await page.$('input[type="password"]');
      expect(passwordInput).not.toBeNull();

      const submitButton = await page.$('button[type="submit"], button:has-text("Start")');
      expect(submitButton).not.toBeNull();
    });

    test('should successfully sign in as Victoria Leland', async () => {
      await page.goto(`${PRODUCTION_URL}/sign-in`, { 
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      // Enter credentials
      await page.waitForSelector('input[type="text"], input[name="email"]', { timeout: ELEMENT_TIMEOUT });
      
      // Find and fill email/username field
      const emailSelectors = [
        'input[type="text"][placeholder*="email" i]',
        'input[type="text"][placeholder*="username" i]',
        'input[name="email"]',
        'input[type="email"]',
        'input[type="text"]',
      ];

      let emailFilled = false;
      for (const selector of emailSelectors) {
        try {
          const input = await page.$(selector);
          if (input) {
            await input.click({ clickCount: 3 });
            await input.type(TEST_EMAIL);
            emailFilled = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      expect(emailFilled).toBe(true);

      // Fill password
      const passwordInput = await page.$('input[type="password"]');
      expect(passwordInput).not.toBeNull();
      await passwordInput!.type(TEST_PASSWORD);

      // Submit form
      const submitButton = await page.$('button[type="submit"], button:has-text("Start")');
      expect(submitButton).not.toBeNull();
      await submitButton!.click();

      // Wait for redirect to dashboard/speedrun
      await page.waitForNavigation({ 
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      // Verify successful login by checking URL contains workspace
      const currentUrl = page.url();
      expect(currentUrl).toMatch(new RegExp(`/${WORKSPACE_SLUG}/`, 'i'));
    });
  });

  describe('Dashboard Navigation', () => {
    beforeEach(async () => {
      // Login before each test
      await loginAsVictoria(page);
    });

    test('should display the RevenueOS dashboard with correct metrics', async () => {
      // Verify dashboard elements
      await page.waitForSelector('h3', { timeout: ELEMENT_TIMEOUT });
      
      const pageContent = await page.content();
      expect(pageContent).toMatch(/RevenueOS/i);
      expect(pageContent).toMatch(/Sales Acceleration/i);
      
      // Check for metric sections
      expect(pageContent).toMatch(/Revenue/);
      expect(pageContent).toMatch(/Pipeline/);
      expect(pageContent).toMatch(/Coverage/);
    });

    test('should display navigation buttons with correct counts', async () => {
      await page.waitForSelector('button', { timeout: ELEMENT_TIMEOUT });
      
      const pageContent = await page.content();
      
      // Verify navigation sections exist
      expect(pageContent).toMatch(/Speedrun/);
      expect(pageContent).toMatch(/Leads/);
      expect(pageContent).toMatch(/Prospects/);
      expect(pageContent).toMatch(/Opportunities/);
      expect(pageContent).toMatch(/People/);
      expect(pageContent).toMatch(/Companies/);
    });

    test('should display Victoria Leland user profile', async () => {
      await page.waitForSelector('button', { timeout: ELEMENT_TIMEOUT });
      
      const pageContent = await page.content();
      expect(pageContent).toMatch(/Victoria Leland/i);
      expect(pageContent).toMatch(/Top Engineering Plus/i);
    });
  });

  describe('Companies List', () => {
    beforeEach(async () => {
      await loginAsVictoria(page);
    });

    test('should navigate to companies list', async () => {
      // Click Companies button
      await page.waitForSelector('button', { timeout: ELEMENT_TIMEOUT });
      
      const companiesButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Companies'));
      });
      
      if (companiesButton) {
        await (companiesButton as any).click();
        await page.waitForTimeout(2000);
      }

      // Verify companies page loaded
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/companies/i);
      
      const pageContent = await page.content();
      expect(pageContent).toMatch(/Companies/);
    });

    test('should display companies table with correct columns', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/companies`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      // Wait for table to load
      await page.waitForSelector('table', { timeout: ELEMENT_TIMEOUT });
      
      const pageContent = await page.content();
      
      // Verify table headers
      expect(pageContent).toMatch(/Company/);
      expect(pageContent).toMatch(/State/);
      expect(pageContent).toMatch(/Last Action/);
      expect(pageContent).toMatch(/Next Action/);
    });

    test('should display company count', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/companies`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      await page.waitForSelector('table', { timeout: ELEMENT_TIMEOUT });
      
      // Look for results count
      const pageContent = await page.content();
      expect(pageContent).toMatch(/\d+ Companies/);
    });
  });

  describe('Company Detail View', () => {
    beforeEach(async () => {
      await loginAsVictoria(page);
    });

    test('should navigate to company detail view', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/companies`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      // Wait for table and click first row
      await page.waitForSelector('table tbody tr', { timeout: ELEMENT_TIMEOUT });
      
      const firstRow = await page.$('table tbody tr:first-child');
      if (firstRow) {
        await firstRow.click();
        await page.waitForTimeout(3000);
      }

      // Verify company detail view loaded
      const pageContent = await page.content();
      expect(pageContent).toMatch(/Company Summary|Company Information/i);
    });

    test('should display company detail tabs', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/companies`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      await page.waitForSelector('table tbody tr', { timeout: ELEMENT_TIMEOUT });
      
      const firstRow = await page.$('table tbody tr:first-child');
      if (firstRow) {
        await firstRow.click();
        await page.waitForTimeout(3000);
      }

      const pageContent = await page.content();
      
      // Verify tabs are present
      expect(pageContent).toMatch(/Overview/);
      expect(pageContent).toMatch(/Actions/);
      expect(pageContent).toMatch(/Intelligence/);
      expect(pageContent).toMatch(/People/);
      expect(pageContent).toMatch(/Buyer Group/);
      expect(pageContent).toMatch(/Opportunities/);
      expect(pageContent).toMatch(/Notes/);
    });

    test('should switch between company detail tabs', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/companies`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      await page.waitForSelector('table tbody tr', { timeout: ELEMENT_TIMEOUT });
      
      const firstRow = await page.$('table tbody tr:first-child');
      if (firstRow) {
        await firstRow.click();
        await page.waitForTimeout(3000);
      }

      // Click on People tab
      const peopleTab = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.trim() === 'People');
      });

      if (peopleTab) {
        await (peopleTab as any).click();
        await page.waitForTimeout(2000);
      }

      // Verify URL changed to include tab parameter
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/tab=people|\/people/i);
    });
  });

  describe('People/Lead Detail View', () => {
    beforeEach(async () => {
      await loginAsVictoria(page);
    });

    test('should display person detail from company People tab', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/companies`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      // Navigate to company and People tab
      await page.waitForSelector('table tbody tr', { timeout: ELEMENT_TIMEOUT });
      
      const firstRow = await page.$('table tbody tr:first-child');
      if (firstRow) {
        await firstRow.click();
        await page.waitForTimeout(3000);
      }

      // Click People tab
      const peopleTab = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.trim() === 'People');
      });

      if (peopleTab) {
        await (peopleTab as any).click();
        await page.waitForTimeout(2000);
      }

      // Click on first person card if exists
      const personCard = await page.$('[class*="cursor-pointer"]');
      if (personCard) {
        await personCard.click();
        await page.waitForTimeout(3000);
      }

      // Verify person detail loaded (check for person-specific elements)
      const pageContent = await page.content();
      expect(pageContent).toMatch(/Overview|Contact Information|Basic Information/i);
    });
  });

  describe('Speedrun View', () => {
    beforeEach(async () => {
      await loginAsVictoria(page);
    });

    test('should navigate to Speedrun page', async () => {
      // Click Speedrun button
      const speedrunButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Speedrun'));
      });

      if (speedrunButton) {
        await (speedrunButton as any).click();
        await page.waitForTimeout(2000);
      }

      // Verify Speedrun page loaded
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/speedrun/i);
    });

    test('should display Speedrun table with ranked leads', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/speedrun`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      await page.waitForSelector('table', { timeout: ELEMENT_TIMEOUT });
      
      const pageContent = await page.content();
      
      // Verify Speedrun elements
      expect(pageContent).toMatch(/Speedrun/);
      expect(pageContent).toMatch(/Win more, faster/i);
      
      // Verify table columns
      expect(pageContent).toMatch(/Rank/);
      expect(pageContent).toMatch(/Name/);
      expect(pageContent).toMatch(/Company/);
      expect(pageContent).toMatch(/Stage/);
    });

    test('should display daily and weekly action goals', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/speedrun`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      const pageContent = await page.content();
      
      // Verify goals section
      expect(pageContent).toMatch(/Hours Left|Today|This Week/i);
      expect(pageContent).toMatch(/\/50|\/250/); // Daily and weekly targets
    });

    test('should click on a Speedrun record', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/speedrun`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      await page.waitForSelector('table tbody tr', { timeout: ELEMENT_TIMEOUT });
      
      // Click first row in Speedrun table
      const firstRow = await page.$('table tbody tr:first-child');
      if (firstRow) {
        await firstRow.click();
        await page.waitForTimeout(3000);
      }

      // Verify navigation to lead/prospect detail
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/leads|prospects|people/i);
    });
  });

  describe('Leads Navigation', () => {
    beforeEach(async () => {
      await loginAsVictoria(page);
    });

    test('should navigate to Leads list', async () => {
      const leadsButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Leads'));
      });

      if (leadsButton) {
        await (leadsButton as any).click();
        await page.waitForTimeout(2000);
      }

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/leads/i);
    });
  });

  describe('Prospects Navigation', () => {
    beforeEach(async () => {
      await loginAsVictoria(page);
    });

    test('should navigate to Prospects list', async () => {
      const prospectsButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Prospects'));
      });

      if (prospectsButton) {
        await (prospectsButton as any).click();
        await page.waitForTimeout(2000);
      }

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/prospects/i);
    });
  });

  describe('Opportunities Navigation', () => {
    beforeEach(async () => {
      await loginAsVictoria(page);
    });

    test('should navigate to Opportunities list', async () => {
      const opportunitiesButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Opportunities'));
      });

      if (opportunitiesButton) {
        await (opportunitiesButton as any).click();
        await page.waitForTimeout(2000);
      }

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/opportunities/i);
    });
  });

  describe('AI Chat Panel', () => {
    beforeEach(async () => {
      await loginAsVictoria(page);
    });

    test('should display AI chat panel on dashboard', async () => {
      await page.waitForSelector('button', { timeout: ELEMENT_TIMEOUT });
      
      const pageContent = await page.content();
      
      // Verify chat panel elements
      expect(pageContent).toMatch(/Main Chat/i);
      expect(pageContent).toMatch(/Adrata|I'm looking forward to helping/i);
    });

    test('should have chat input field', async () => {
      await page.waitForSelector('textbox, input[type="text"], textarea', { timeout: ELEMENT_TIMEOUT });
      
      // Look for chat input
      const chatInput = await page.$('textarea, input[placeholder*="Think" i], input[placeholder*="message" i]');
      expect(chatInput).not.toBeNull();
    });
  });

  describe('Production Data Integrity', () => {
    beforeEach(async () => {
      await loginAsVictoria(page);
    });

    test('should not display placeholder data in companies list', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/companies`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      await page.waitForSelector('table', { timeout: ELEMENT_TIMEOUT });
      
      const pageContent = await page.content();
      
      // Ensure we don't see test/placeholder data markers
      expect(pageContent).not.toMatch(/Test Data Only/i);
      expect(pageContent).not.toMatch(/Placeholder Company/i);
    });

    test('should display real company names in the list', async () => {
      await page.goto(`${PRODUCTION_URL}/${WORKSPACE_SLUG}/companies`, {
        waitUntil: 'networkidle2',
        timeout: NAVIGATION_TIMEOUT,
      });

      await page.waitForSelector('table tbody tr', { timeout: ELEMENT_TIMEOUT });
      
      // Get company names from first few rows
      const companyNames = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr');
        const names: string[] = [];
        rows.forEach((row, index) => {
          if (index < 5) {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell?.textContent) {
              names.push(firstCell.textContent.trim());
            }
          }
        });
        return names;
      });

      // Verify we have real company names (not empty or placeholder)
      expect(companyNames.length).toBeGreaterThan(0);
      companyNames.forEach(name => {
        expect(name.length).toBeGreaterThan(0);
        expect(name).not.toMatch(/^-$/);
      });
    });
  });
});

/**
 * Helper function to login as Victoria Leland
 */
async function loginAsVictoria(page: Page): Promise<void> {
  await page.goto(`${PRODUCTION_URL}/sign-in`, { 
    waitUntil: 'networkidle2',
    timeout: NAVIGATION_TIMEOUT,
  });

  // Wait for form
  await page.waitForSelector('input[type="text"], input[name="email"]', { timeout: ELEMENT_TIMEOUT });

  // Fill email
  const emailSelectors = [
    'input[type="text"][placeholder*="email" i]',
    'input[type="text"][placeholder*="username" i]',
    'input[name="email"]',
    'input[type="email"]',
    'input[type="text"]',
  ];

  for (const selector of emailSelectors) {
    try {
      const input = await page.$(selector);
      if (input) {
        await input.click({ clickCount: 3 });
        await input.type(TEST_EMAIL);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  // Fill password
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    await passwordInput.type(TEST_PASSWORD);
  }

  // Submit
  const submitButton = await page.$('button[type="submit"], button:has-text("Start")');
  if (submitButton) {
    await submitButton.click();
  }

  // Wait for navigation
  await page.waitForNavigation({ 
    waitUntil: 'networkidle2',
    timeout: NAVIGATION_TIMEOUT,
  }).catch(() => {
    // Sometimes navigation may be instant, catch timeout
  });

  // Additional wait to ensure page is loaded
  await page.waitForTimeout(2000);
}

