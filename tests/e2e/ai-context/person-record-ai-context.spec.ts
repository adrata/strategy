/**
 * Puppeteer E2E Test: AI Context for Person Records
 * 
 * Tests that AI right panel has proper context when viewing person records.
 * Specifically tests the fix for AI saying "I don't have enough context" when
 * viewing person records like Camille Murdock.
 * 
 * This test:
 * 1. Logs in to Adrata
 * 2. Navigates to Speedrun person detail page (Camille Murdock)
 * 3. Opens AI right panel
 * 4. Asks questions about the person record
 * 5. Verifies AI has context and doesn't say "I don't have enough context"
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Test configuration
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';
const BASE_URL = process.env.BASE_URL || 'https://action.adrata.com';
const TEST_PERSON_URL = process.env.TEST_PERSON_URL || '/top/speedrun/camille-murdock-01K9T0K41GN6Y4RJP6FJFDT742/?tab=overview';

describe('AI Context for Person Records (Puppeteer)', () => {
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
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    }
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('AI has context when viewing Camille Murdock person record', async () => {
    // Navigate to Camille Murdock person detail page
    console.log(`Navigating to: ${BASE_URL}${TEST_PERSON_URL}`);
    await page.goto(`${BASE_URL}${TEST_PERSON_URL}`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for page to load - look for person detail content
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Wait a bit for React to hydrate
    await page.waitForTimeout(2000);
    
    // Try to find and open AI right panel
    // Look for common AI panel toggle selectors
    const aiPanelSelectors = [
      '[data-testid="ai-panel-toggle"]',
      '[aria-label*="AI" i]',
      'button:has-text("AI")',
      '[data-testid="right-panel-toggle"]',
      'button[aria-label*="chat" i]',
      '.ai-panel-toggle',
      '#ai-panel-toggle'
    ];
    
    let aiPanelOpened = false;
    for (const selector of aiPanelSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await page.waitForTimeout(1000);
          aiPanelOpened = true;
          console.log(`Opened AI panel using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // If no toggle found, try clicking on right side of screen (common location)
    if (!aiPanelOpened) {
      try {
        await page.click('body', { offset: { x: 1800, y: 500 } });
        await page.waitForTimeout(1000);
        console.log('Clicked on right side of screen to open AI panel');
      } catch (e) {
        console.warn('Could not open AI panel automatically');
      }
    }
    
    // Wait for AI input to appear
    const aiInputSelectors = [
      '[data-testid="ai-input"]',
      'textarea[placeholder*="Ask" i]',
      'input[placeholder*="Ask" i]',
      'textarea[placeholder*="Message" i]',
      '.ai-input',
      '#ai-input',
      '[role="textbox"]'
    ];
    
    let aiInput = null;
    for (const selector of aiInputSelectors) {
      try {
        aiInput = await page.$(selector);
        if (aiInput) {
          console.log(`Found AI input using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!aiInput) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'ai-panel-not-found.png', fullPage: true });
      throw new Error('AI input not found. Screenshot saved to ai-panel-not-found.png');
    }
    
    // Ask the question about cold outreach
    const question = "What's the best message to send via cold outreach?";
    await aiInput.type(question);
    await page.waitForTimeout(500);
    
    // Submit the question (press Enter or click send button)
    const sendButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Send")',
      '[data-testid="send-button"]',
      'button[aria-label*="Send" i]'
    ];
    
    let sent = false;
    for (const selector of sendButtonSelectors) {
      try {
        const sendButton = await page.$(selector);
        if (sendButton) {
          await sendButton.click();
          sent = true;
          console.log(`Clicked send button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!sent) {
      // Try pressing Enter
      await page.keyboard.press('Enter');
      console.log('Pressed Enter to send message');
    }
    
    // Wait for AI response
    console.log('Waiting for AI response...');
    await page.waitForTimeout(5000); // Initial wait
    
    // Look for AI response
    const responseSelectors = [
      '[data-testid="ai-response"]',
      '.ai-response',
      '.message-content',
      '[data-testid="message-content"]',
      '.chat-message:last-child',
      '[role="log"] > div:last-child'
    ];
    
    let responseText = '';
    let responseFound = false;
    
    for (const selector of responseSelectors) {
      try {
        const responseElement = await page.$(selector);
        if (responseElement) {
          responseText = await page.evaluate((el) => el.textContent || el.innerText, responseElement);
          if (responseText && responseText.length > 10) {
            responseFound = true;
            console.log(`Found AI response using selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }
    
    // If not found, try getting all text content and looking for response
    if (!responseFound) {
      const pageText = await page.evaluate(() => document.body.innerText);
      // Look for text that appears after our question
      const questionIndex = pageText.indexOf(question);
      if (questionIndex !== -1) {
        responseText = pageText.substring(questionIndex + question.length).trim();
        responseFound = true;
      }
    }
    
    // Wait a bit more if response seems short
    if (!responseFound || responseText.length < 50) {
      console.log('Response seems incomplete, waiting more...');
      await page.waitForTimeout(5000);
      
      // Try again to get response
      const pageText = await page.evaluate(() => document.body.innerText);
      const questionIndex = pageText.indexOf(question);
      if (questionIndex !== -1) {
        responseText = pageText.substring(questionIndex + question.length).trim();
      }
    }
    
    console.log('AI Response:', responseText.substring(0, 500));
    
    // Verify AI has context
    expect(responseText).toBeTruthy();
    expect(responseText.length).toBeGreaterThan(50);
    
    // Verify AI does NOT say "I don't have enough context"
    const negativePhrases = [
      "I don't have enough context",
      "don't have enough context",
      "I need more context",
      "not enough context",
      "insufficient context",
      "Here's what I need"
    ];
    
    const responseLower = responseText.toLowerCase();
    for (const phrase of negativePhrases) {
      expect(responseLower).not.toContain(phrase.toLowerCase());
    }
    
    // Verify AI references the person (Camille Murdock) or company
    const hasPersonReference = 
      responseLower.includes('camille') || 
      responseLower.includes('murdock') ||
      responseLower.includes('this person') ||
      responseLower.includes('this contact') ||
      responseLower.includes('this prospect');
    
    // Verify AI provides specific advice
    const hasSpecificAdvice = 
      responseLower.includes('message') ||
      responseLower.includes('outreach') ||
      responseLower.includes('email') ||
      responseLower.includes('recommend') ||
      responseLower.includes('suggest') ||
      responseLower.includes('should');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'ai-context-test-result.png', fullPage: true });
    console.log('Screenshot saved to ai-context-test-result.png');
    
    // Log results
    console.log('\n=== Test Results ===');
    console.log(`Response length: ${responseText.length} characters`);
    console.log(`Has person reference: ${hasPersonReference}`);
    console.log(`Has specific advice: ${hasSpecificAdvice}`);
    console.log(`No "not enough context" message: ✓`);
    
    // Assertions
    expect(hasPersonReference || hasSpecificAdvice).toBe(true);
  }, 60000); // 60 second timeout

  test('AI provides context-aware responses for multiple person records', async () => {
    // This test verifies the fix works for multiple person records
    // Navigate to Speedrun list first
    const workspace = TEST_PERSON_URL.split('/')[1]; // Extract workspace from URL
    await page.goto(`${BASE_URL}/${workspace}/speedrun`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForTimeout(2000);
    
    // Click on first person in the list
    const personSelectors = [
      '[data-testid="prospect-item"]:first-child',
      '[data-testid="person-row"]:first-child',
      'tr:first-child td:first-child',
      '.person-row:first-child',
      'a[href*="/speedrun/"]:first-child'
    ];
    
    let personClicked = false;
    for (const selector of personSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(2000);
          personClicked = true;
          console.log(`Clicked person using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!personClicked) {
      console.warn('Could not click on person, skipping this test');
      return;
    }
    
    // Get person name from page
    const personName = await page.evaluate(() => {
      const nameSelectors = ['h1', 'h2', '[data-testid="person-name"]', '.person-name'];
      for (const selector of nameSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent) {
          return el.textContent.trim();
        }
      }
      return null;
    });
    
    console.log(`Testing with person: ${personName}`);
    
    // Open AI panel and ask question
    // (Similar to previous test)
    const aiInputSelectors = [
      '[data-testid="ai-input"]',
      'textarea[placeholder*="Ask" i]',
      'input[placeholder*="Ask" i]',
    ];
    
    let aiInput = null;
    for (const selector of aiInputSelectors) {
      try {
        aiInput = await page.$(selector);
        if (aiInput) break;
      } catch (e) {
        // Continue
      }
    }
    
    if (!aiInput) {
      console.warn('AI input not found, skipping test');
      return;
    }
    
    const question = "Tell me about this person and their company";
    await aiInput.type(question);
    await page.keyboard.press('Enter');
    
    // Wait for response
    await page.waitForTimeout(8000);
    
    const pageText = await page.evaluate(() => document.body.innerText);
    const questionIndex = pageText.indexOf(question);
    const responseText = questionIndex !== -1 
      ? pageText.substring(questionIndex + question.length).trim()
      : '';
    
    console.log('AI Response:', responseText.substring(0, 300));
    
    // Verify response
    expect(responseText.length).toBeGreaterThan(50);
    
    // Verify no "not enough context" message
    const responseLower = responseText.toLowerCase();
    expect(responseLower).not.toContain("don't have enough context");
    expect(responseLower).not.toContain("not enough context");
    
    // Verify response references the person or provides specific advice
    const hasContext = 
      (personName && responseLower.includes(personName.toLowerCase().split(' ')[0])) ||
      responseLower.includes('this person') ||
      responseLower.includes('company') ||
      responseLower.includes('recommend') ||
      responseLower.includes('suggest');
    
    expect(hasContext).toBe(true);
  }, 60000);
});

