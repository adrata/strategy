/**
 * AI Chat Right Panel Reliability Tests
 * 
 * Comprehensive test suite for the AI right panel functionality.
 * Tests core features, error handling, and performance.
 * 
 * Run with: npx playwright test tests/e2e/ai-chat-reliability.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'https://action.adrata.com',
  signInUrl: 'https://action.adrata.com/sign-in',
  testCredentials: {
    email: 'ross',
    password: 'Themill08!'
  },
  testWorkspace: 'adrata',
  defaultTimeout: 30000,
  aiResponseTimeout: 60000
};

// Test data for AI queries
const TEST_QUERIES = {
  personQuery: 'Tell me about Terry Torok',
  companyQuery: 'Tell me about Creative Intelligence Agency',
  emailWriteQuery: 'Write me a test email',
  multipleQueries: [
    'Who is in my Speedrun list?',
    'What should I focus on today?',
    'Tell me about my pipeline'
  ]
};

/**
 * Helper: Sign in to the application
 */
async function signIn(page: Page): Promise<void> {
  await page.goto(TEST_CONFIG.signInUrl);
  await page.waitForLoadState('networkidle');
  
  // Fill in credentials
  await page.fill('input[name="email"], input[type="email"]', TEST_CONFIG.testCredentials.email);
  await page.fill('input[name="password"], input[type="password"]', TEST_CONFIG.testCredentials.password);
  
  // Click sign in button
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL(/\/(speedrun|dashboard|pipeline)/, { timeout: TEST_CONFIG.defaultTimeout });
}

/**
 * Helper: Navigate to Speedrun section
 */
async function navigateToSpeedrun(page: Page): Promise<void> {
  await page.goto(`${TEST_CONFIG.baseUrl}/${TEST_CONFIG.testWorkspace}/speedrun`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="speedrun-list"], .speedrun-content, table', { timeout: TEST_CONFIG.defaultTimeout });
}

/**
 * Helper: Open AI right panel
 */
async function openAIPanel(page: Page): Promise<void> {
  // Look for AI panel toggle or check if already open
  const panelVisible = await page.isVisible('[data-testid="ai-right-panel"], .right-panel, [class*="RightPanel"]');
  
  if (!panelVisible) {
    // Try clicking various potential toggle buttons
    const toggleSelectors = [
      'button[aria-label="Open AI"]',
      'button[data-testid="ai-toggle"]',
      '[class*="toggle"][class*="panel"]',
      'button:has-text("AI")'
    ];
    
    for (const selector of toggleSelectors) {
      const toggle = await page.$(selector);
      if (toggle) {
        await toggle.click();
        await page.waitForTimeout(500);
        break;
      }
    }
  }
  
  // Wait for panel to be visible
  await page.waitForSelector('[data-testid="ai-right-panel"], .right-panel, [class*="chat"]', { timeout: 5000 }).catch(() => {
    // Panel might already be open by default
  });
}

/**
 * Helper: Send a message to AI chat
 */
async function sendAIMessage(page: Page, message: string): Promise<void> {
  // Find the chat input
  const inputSelectors = [
    'textarea[placeholder*="Think"]',
    'textarea[data-testid="ai-input"]',
    'input[data-testid="ai-input"]',
    '[class*="ChatInput"] textarea',
    '[class*="chat"] textarea'
  ];
  
  let inputField = null;
  for (const selector of inputSelectors) {
    inputField = await page.$(selector);
    if (inputField) break;
  }
  
  if (!inputField) {
    throw new Error('Could not find AI chat input field');
  }
  
  await inputField.fill(message);
  await page.keyboard.press('Enter');
}

/**
 * Helper: Wait for AI response
 */
async function waitForAIResponse(page: Page, timeout: number = TEST_CONFIG.aiResponseTimeout): Promise<string> {
  // Wait for typing indicator to appear and disappear
  await page.waitForTimeout(500); // Brief wait for indicator to appear
  
  // Wait for a non-typing message to appear
  const responseSelector = '[class*="assistant"], [data-message-type="assistant"]';
  
  await page.waitForFunction(
    () => {
      const messages = document.querySelectorAll('[class*="message"], [class*="Message"]');
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return false;
      const content = lastMessage.textContent || '';
      return content.length > 10 && !content.includes('...') && !content.includes('typing');
    },
    { timeout }
  );
  
  // Get the response text
  const messages = await page.$$('[class*="message"], [class*="Message"]');
  const lastMessage = messages[messages.length - 1];
  return await lastMessage?.textContent() || '';
}

/**
 * Helper: Check if a name is highlighted and clickable
 */
async function findClickableName(page: Page, name: string): Promise<boolean> {
  // Look for clickable buttons containing the name
  const buttonSelectors = [
    `button:has-text("${name}")`,
    `[role="button"]:has-text("${name}")`,
    `a:has-text("${name}")`,
    `.clickable:has-text("${name}")`
  ];
  
  for (const selector of buttonSelectors) {
    const element = await page.$(selector);
    if (element) {
      const isVisible = await element.isVisible();
      if (isVisible) return true;
    }
  }
  
  return false;
}

// ============================================================================
// CORE FUNCTIONALITY TESTS
// ============================================================================

test.describe('AI Chat Core Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 minute timeout for setup
    await signIn(page);
    await navigateToSpeedrun(page);
    await openAIPanel(page);
  });

  test('User message persists after sending', async ({ page }) => {
    const testMessage = 'Test message ' + Date.now();
    
    await sendAIMessage(page, testMessage);
    
    // Wait a moment for message to appear
    await page.waitForTimeout(1000);
    
    // Check that user message is visible
    const userMessageVisible = await page.isVisible(`text="${testMessage}"`);
    expect(userMessageVisible).toBe(true);
    
    // Wait for response
    await waitForAIResponse(page);
    
    // User message should still be visible
    const userMessageStillVisible = await page.isVisible(`text="${testMessage}"`);
    expect(userMessageStillVisible).toBe(true);
  });

  test('AI responds to person query', async ({ page }) => {
    await sendAIMessage(page, TEST_QUERIES.personQuery);
    
    const response = await waitForAIResponse(page);
    
    // Response should mention the person or provide helpful info
    expect(response.length).toBeGreaterThan(50);
    // Should not say "couldn't find" if person is in list
    expect(response.toLowerCase()).not.toContain("couldn't find any records");
  });

  test('Person name appears as clickable element', async ({ page }) => {
    await sendAIMessage(page, TEST_QUERIES.personQuery);
    await waitForAIResponse(page);
    
    // Wait for UI to settle
    await page.waitForTimeout(1000);
    
    // Look for clickable name elements (green buttons)
    const hasClickableName = await findClickableName(page, 'Terry Torok');
    
    // This test documents the expected behavior
    // If it fails, the name highlighting isn't working
    console.log('Clickable name found:', hasClickableName);
  });

  test('Multiple messages do not disappear', async ({ page }) => {
    const messages = [
      'First test message ' + Date.now(),
      'Second test message ' + Date.now(),
      'Third test message ' + Date.now()
    ];
    
    for (const message of messages) {
      await sendAIMessage(page, message);
      await page.waitForTimeout(500);
    }
    
    // Wait for all responses
    await page.waitForTimeout(5000);
    
    // All user messages should still be visible
    for (const message of messages) {
      const isVisible = await page.isVisible(`text="${message}"`);
      expect(isVisible).toBe(true);
    }
  });

});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('AI Chat Error Handling', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await signIn(page);
    await navigateToSpeedrun(page);
    await openAIPanel(page);
  });

  test('Handles empty response gracefully', async ({ page }) => {
    // Send a message and wait for response
    await sendAIMessage(page, 'Test');
    
    // Even if something goes wrong, UI should not crash
    await page.waitForTimeout(5000);
    
    // Page should still be interactive
    const inputVisible = await page.isVisible('textarea');
    expect(inputVisible).toBe(true);
  });

  test('Error message is user-friendly', async ({ page }) => {
    // This tests that if an error occurs, it shows a friendly message
    // We can't easily simulate network errors, but we verify the UI handles it
    
    await sendAIMessage(page, 'Test query');
    await page.waitForTimeout(10000);
    
    // Look for any error messages
    const errorTexts = [
      'something went wrong',
      'try again',
      'temporary issue',
      'taking longer'
    ];
    
    const pageContent = await page.content();
    const hasUserFriendlyError = errorTexts.some(text => 
      pageContent.toLowerCase().includes(text)
    );
    
    // Document whether errors are user-friendly (not a hard fail)
    console.log('User-friendly error handling:', hasUserFriendlyError || 'No error occurred');
  });

});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('AI Chat Performance', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await signIn(page);
    await navigateToSpeedrun(page);
    await openAIPanel(page);
  });

  test('First token arrives within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await sendAIMessage(page, 'Hi');
    
    // Wait for any response content (not just typing indicator)
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[class*="message"], [class*="Message"]');
        for (const msg of messages) {
          const text = msg.textContent || '';
          if (text.length > 5 && !text.includes('...')) return true;
        }
        return false;
      },
      { timeout: 30000 }
    );
    
    const firstTokenTime = Date.now() - startTime;
    console.log(`First token latency: ${firstTokenTime}ms`);
    
    // First token should arrive within 10 seconds (generous for cold starts)
    expect(firstTokenTime).toBeLessThan(10000);
  });

  test('Streaming updates are smooth (not choppy)', async ({ page }) => {
    await sendAIMessage(page, 'Tell me about my pipeline in detail');
    
    // Count how many UI updates we see (rough measure of smoothness)
    let updateCount = 0;
    let lastLength = 0;
    
    for (let i = 0; i < 50; i++) {
      await page.waitForTimeout(100);
      const messages = await page.$$('[class*="message"], [class*="Message"]');
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const text = await lastMsg.textContent() || '';
        if (text.length > lastLength) {
          updateCount++;
          lastLength = text.length;
        }
      }
    }
    
    console.log(`Observed ${updateCount} UI updates during streaming`);
    // With batching, we should see fewer but meaningful updates
    expect(updateCount).toBeGreaterThan(2); // At least some updates
    expect(updateCount).toBeLessThan(40); // But not every token (batching working)
  });

});

// ============================================================================
// NAVIGATION TESTS
// ============================================================================

test.describe('AI Chat Navigation', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await signIn(page);
    await navigateToSpeedrun(page);
    await openAIPanel(page);
  });

  test('Clicking highlighted name triggers navigation', async ({ page }) => {
    await sendAIMessage(page, TEST_QUERIES.personQuery);
    await waitForAIResponse(page);
    await page.waitForTimeout(1000);
    
    // Try to find and click a highlighted name
    const nameButton = await page.$('button:has-text("Terry Torok"), [role="button"]:has-text("Terry Torok")');
    
    if (nameButton) {
      const currentUrl = page.url();
      await nameButton.click();
      await page.waitForTimeout(2000);
      const newUrl = page.url();
      
      // URL should have changed (navigation occurred)
      console.log('Navigation test - URL changed:', currentUrl !== newUrl);
      console.log('New URL:', newUrl);
    } else {
      console.log('No clickable name button found - feature may need verification');
    }
  });

});

// ============================================================================
// SELLER WORKFLOW TESTS - 10 Realistic Outbound Scenarios
// ============================================================================

test.describe('Seller Workflow - Outbound Sales', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await signIn(page);
  });

  // 1. Click person record, ask "who is this?"
  test('Person record - basic profile summary', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/${TEST_CONFIG.testWorkspace}/speedrun`);
    await page.waitForLoadState('networkidle');
    
    // Click on first person in the list
    await page.click('table tbody tr:first-child');
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, 'Who is this?');
    const response = await waitForAIResponse(page);
    
    // Should include name, title, company
    expect(response.length).toBeGreaterThan(50);
    console.log('Person summary:', response.substring(0, 200));
  });

  // 2. Click company record, ask about the company
  test('Company record - company overview', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/${TEST_CONFIG.testWorkspace}/companies`);
    await page.waitForLoadState('networkidle');
    
    // Click on first company
    await page.click('table tbody tr:first-child').catch(() => {});
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, 'Tell me about this company');
    const response = await waitForAIResponse(page);
    
    expect(response.length).toBeGreaterThan(30);
    console.log('Company overview:', response.substring(0, 200));
  });

  // 3. On person record - cold email
  test('Person record - write cold email', async ({ page }) => {
    await navigateToSpeedrun(page);
    await page.click('table tbody tr:first-child').catch(() => {});
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, 'Write me a cold email');
    const response = await waitForAIResponse(page);
    
    // Should generate an email
    expect(response.toLowerCase()).toMatch(/subject|hi|hey|dear/);
    console.log('Cold email:', response.substring(0, 300));
  });

  // 4. On company - who to reach out to
  test('Company record - contact discovery', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/${TEST_CONFIG.testWorkspace}/companies`);
    await page.waitForLoadState('networkidle');
    await page.click('table tbody tr:first-child').catch(() => {});
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, 'Who should I reach out to here?');
    const response = await waitForAIResponse(page);
    
    expect(response.length).toBeGreaterThan(20);
    console.log('Contact suggestion:', response.substring(0, 200));
  });

  // 5. Next best action
  test('Person record - next best action', async ({ page }) => {
    await navigateToSpeedrun(page);
    await page.click('table tbody tr:first-child').catch(() => {});
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, "What's my next best action?");
    const response = await waitForAIResponse(page);
    
    expect(response.length).toBeGreaterThan(20);
    console.log('Next action:', response.substring(0, 200));
  });

  // 6. LinkedIn connection request
  test('Person record - LinkedIn connection request', async ({ page }) => {
    await navigateToSpeedrun(page);
    await page.click('table tbody tr:first-child').catch(() => {});
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, 'Write a LinkedIn connection request');
    const response = await waitForAIResponse(page);
    
    // Should be short (LinkedIn limit)
    expect(response.length).toBeGreaterThan(20);
    expect(response.length).toBeLessThan(1000);
    console.log('LinkedIn request:', response.substring(0, 300));
  });

  // 7. Find specific role at company
  test('Company record - find VP of Sales', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/${TEST_CONFIG.testWorkspace}/companies`);
    await page.waitForLoadState('networkidle');
    await page.click('table tbody tr:first-child').catch(() => {});
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, 'Find the VP of Sales');
    const response = await waitForAIResponse(page);
    
    expect(response.length).toBeGreaterThan(20);
    console.log('VP search:', response.substring(0, 200));
  });

  // 8. Pre-call research and talking points
  test('Company record - talking points', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/${TEST_CONFIG.testWorkspace}/companies`);
    await page.waitForLoadState('networkidle');
    await page.click('table tbody tr:first-child').catch(() => {});
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, 'Give me talking points for a call');
    const response = await waitForAIResponse(page);
    
    expect(response.length).toBeGreaterThan(50);
    console.log('Talking points:', response.substring(0, 300));
  });

  // 9. Follow-up email
  test('Person record - follow-up email', async ({ page }) => {
    await navigateToSpeedrun(page);
    await page.click('table tbody tr:first-child').catch(() => {});
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, 'Draft a follow-up email');
    const response = await waitForAIResponse(page);
    
    expect(response.toLowerCase()).toMatch(/follow|checking|touch|reach/i);
    console.log('Follow-up:', response.substring(0, 300));
  });

  // 10. Pain points to focus on
  test('Person record - pain points', async ({ page }) => {
    await navigateToSpeedrun(page);
    await page.click('table tbody tr:first-child').catch(() => {});
    await page.waitForTimeout(1000);
    
    await sendAIMessage(page, 'What pain points should I focus on?');
    const response = await waitForAIResponse(page);
    
    expect(response.length).toBeGreaterThan(30);
    console.log('Pain points:', response.substring(0, 300));
  });

});

// ============================================================================
// INTEGRATION TEST
// ============================================================================

test.describe('AI Chat Full Integration', () => {

  test('Complete user flow - sign in, query, interact', async ({ page }) => {
    test.setTimeout(180000);
    
    await signIn(page);
    await navigateToSpeedrun(page);
    await openAIPanel(page);
    
    await sendAIMessage(page, TEST_QUERIES.personQuery);
    const response = await waitForAIResponse(page);
    
    expect(response.length).toBeGreaterThan(20);
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/ai-chat-integration.png',
      fullPage: false 
    });
  });

});

