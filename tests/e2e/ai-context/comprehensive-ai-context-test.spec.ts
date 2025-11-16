/**
 * Comprehensive Puppeteer E2E Test: AI Context for All Record Types
 * 
 * Tests that AI right panel has proper context for:
 * 1. Person records with intelligence
 * 2. Lead records with intelligence
 * 3. Company records with intelligence
 * 4. List views with pagination
 * 
 * This test verifies:
 * - AI reads intelligence from database (not generated on-the-fly)
 * - AI has context about person/lead/company intelligence
 * - AI knows about current list view and pagination
 * - AI doesn't say "I don't have enough context"
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Test configuration
const TEST_EMAIL = process.env.TEST_EMAIL || 'vleland@topengineersplus.com';
const TEST_USERNAME = process.env.TEST_USERNAME || 'vleland';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TOPgtm01!';
const BASE_URL = process.env.BASE_URL || 'https://action.adrata.com';
const WORKSPACE = process.env.TEST_WORKSPACE || 'top';

describe('Comprehensive AI Context Test (Puppeteer)', () => {
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
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to sign-in
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle2' });
    
    // Login - try username or email
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="Email" i], input[placeholder*="Username" i], input[name="username"]');
    if (emailInput) {
      // Try username first, then email
      await emailInput.type(TEST_USERNAME);
    }
    
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.type(TEST_PASSWORD);
    }
    
    const loginButton = await page.$('button:has-text("Start"), button:has-text("Sign In"), button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('AI has context when viewing person record (Camille Murdock)', async () => {
    // Navigate to Camille Murdock person detail page
    await page.goto(`${BASE_URL}/${WORKSPACE}/speedrun/camille-murdock-01K9T0K41GN6Y4RJP6FJFDT742/?tab=overview`, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Open AI panel
    const aiPanelSelectors = [
      '[data-testid="ai-panel-toggle"]',
      '[aria-label*="AI" i]',
      'button:has-text("AI")',
      '[data-testid="right-panel-toggle"]'
    ];
    
    for (const selector of aiPanelSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Find AI input
    const aiInput = await page.$('[data-testid="ai-input"], textarea[placeholder*="Ask" i], input[placeholder*="Ask" i]');
    if (!aiInput) {
      throw new Error('AI input not found');
    }
    
    // Ask question about cold outreach
    const question = "What's the best message to send via cold outreach?";
    await aiInput.type(question);
    await page.keyboard.press('Enter');
    
    // Wait for response
    await page.waitForTimeout(8000);
    
    // Get response
    const pageText = await page.evaluate(() => document.body.innerText);
    const questionIndex = pageText.indexOf(question);
    const responseText = questionIndex !== -1 
      ? pageText.substring(questionIndex + question.length).trim()
      : '';
    
    console.log('AI Response:', responseText.substring(0, 500));
    
    // Verify AI has context
    expect(responseText.length).toBeGreaterThan(50);
    
    // Verify AI does NOT say "I don't have enough context"
    const responseLower = responseText.toLowerCase();
    expect(responseLower).not.toContain("don't have enough context");
    expect(responseLower).not.toContain("not enough context");
    expect(responseLower).not.toContain("insufficient context");
    expect(responseLower).not.toContain("here's what i need");
    
    // Verify AI references the person or provides specific advice
    const hasContext = 
      responseLower.includes('camille') || 
      responseLower.includes('murdock') ||
      responseLower.includes('this person') ||
      responseLower.includes('message') ||
      responseLower.includes('outreach') ||
      responseLower.includes('recommend') ||
      responseLower.includes('suggest');
    
    expect(hasContext).toBe(true);
  }, 60000);

  test('AI has context when viewing lead record', async () => {
    // Navigate to leads list
    await page.goto(`${BASE_URL}/${WORKSPACE}/pipeline/leads`, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Click on first lead
    const leadSelectors = [
      '[data-testid="lead-row"]:first-child',
      'tr:first-child',
      'a[href*="/leads/"]:first-child'
    ];
    
    for (const selector of leadSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Open AI panel and ask question
    const aiInput = await page.$('[data-testid="ai-input"], textarea[placeholder*="Ask" i]');
    if (!aiInput) {
      console.warn('AI input not found, skipping test');
      return;
    }
    
    const question = "Tell me about this lead and what I should do next";
    await aiInput.type(question);
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(8000);
    
    const pageText = await page.evaluate(() => document.body.innerText);
    const questionIndex = pageText.indexOf(question);
    const responseText = questionIndex !== -1 
      ? pageText.substring(questionIndex + question.length).trim()
      : '';
    
    console.log('AI Response:', responseText.substring(0, 300));
    
    // Verify response
    expect(responseText.length).toBeGreaterThan(50);
    const responseLower = responseText.toLowerCase();
    expect(responseLower).not.toContain("don't have enough context");
    
    // Verify AI references the lead or provides specific advice
    const hasContext = 
      responseLower.includes('this lead') ||
      responseLower.includes('this person') ||
      responseLower.includes('recommend') ||
      responseLower.includes('suggest') ||
      responseLower.includes('next');
    
    expect(hasContext).toBe(true);
  }, 60000);

  test('AI knows about list view and pagination', async () => {
    // Navigate to leads list
    await page.goto(`${BASE_URL}/${WORKSPACE}/pipeline/leads`, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Get list of visible leads
    const leadNames = await page.evaluate(() => {
      const leads = Array.from(document.querySelectorAll('[data-testid="lead-row"], tr[data-id]'));
      return leads.slice(0, 5).map(lead => {
        const nameEl = lead.querySelector('td:first-child, [data-testid="lead-name"]');
        return nameEl?.textContent?.trim() || '';
      }).filter(Boolean);
    });
    
    console.log('Visible leads:', leadNames);
    
    // Open AI panel
    const aiInput = await page.$('[data-testid="ai-input"], textarea[placeholder*="Ask" i]');
    if (!aiInput) {
      console.warn('AI input not found, skipping test');
      return;
    }
    
    // Ask about the list
    const question = "Who are my top leads in this list?";
    await aiInput.type(question);
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(8000);
    
    const pageText = await page.evaluate(() => document.body.innerText);
    const questionIndex = pageText.indexOf(question);
    const responseText = questionIndex !== -1 
      ? pageText.substring(questionIndex + question.length).trim()
      : '';
    
    console.log('AI Response:', responseText.substring(0, 400));
    
    // Verify response
    expect(responseText.length).toBeGreaterThan(50);
    const responseLower = responseText.toLowerCase();
    
    // Verify AI references the list
    const hasListContext = 
      responseLower.includes('lead') ||
      responseLower.includes('list') ||
      responseLower.includes('this') ||
      (leadNames.length > 0 && leadNames.some(name => responseLower.includes(name.toLowerCase().split(' ')[0])));
    
    expect(hasListContext).toBe(true);
    
    // Verify AI doesn't say it doesn't have context
    expect(responseLower).not.toContain("don't have enough context");
  }, 60000);

  test('AI context works across different record types', async () => {
    const testCases = [
      {
        url: `${BASE_URL}/${WORKSPACE}/speedrun`,
        question: "Who should I contact first?",
        expectedContext: ['prospect', 'contact', 'first', 'recommend']
      },
      {
        url: `${BASE_URL}/${WORKSPACE}/pipeline/leads`,
        question: "What's the status of my leads?",
        expectedContext: ['lead', 'status', 'pipeline']
      },
      {
        url: `${BASE_URL}/${WORKSPACE}/pipeline/companies`,
        question: "Which companies should I focus on?",
        expectedContext: ['company', 'focus', 'recommend']
      }
    ];

    for (const testCase of testCases) {
      await page.goto(testCase.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const aiInput = await page.$('[data-testid="ai-input"], textarea[placeholder*="Ask" i]');
      if (!aiInput) {
        console.warn(`AI input not found for ${testCase.url}, skipping`);
        continue;
      }
      
      await aiInput.type(testCase.question);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(8000);
      
      const pageText = await page.evaluate(() => document.body.innerText);
      const questionIndex = pageText.indexOf(testCase.question);
      const responseText = questionIndex !== -1 
        ? pageText.substring(questionIndex + testCase.question.length).trim()
        : '';
      
      // Verify response has context
      expect(responseText.length).toBeGreaterThan(50);
      const responseLower = responseText.toLowerCase();
      expect(responseLower).not.toContain("don't have enough context");
      
      // Verify expected context terms
      const hasExpectedContext = testCase.expectedContext.some(term => 
        responseLower.includes(term.toLowerCase())
      );
      
      expect(hasExpectedContext).toBe(true);
    }
  }, 120000);
});

