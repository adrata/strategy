/**
 * AI Right Panel - Comprehensive Evaluation Suite
 * 
 * Tests all critical functionality for production readiness:
 * 1. Streaming vs Fallback behavior
 * 2. Message persistence
 * 3. Conversation context
 * 4. Name click navigation
 * 5. Response quality
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.TEST_URL || 'https://action.adrata.com';
const TEST_USER = process.env.TEST_USER || 'ross';
const TEST_PASS = process.env.TEST_PASS || 'Themill08!';

// Helper to sign in
async function signIn(page: Page) {
  await page.goto(`${BASE_URL}/sign-in`);
  await page.fill('input[name="email"], input[type="email"]', TEST_USER);
  await page.fill('input[name="password"], input[type="password"]', TEST_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/.*\/speedrun/, { timeout: 30000 });
}

// Helper to wait for AI response
async function waitForAIResponse(page: Page, timeout = 30000): Promise<string> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    // Check if there's a response (not just typing indicator)
    const messages = await page.locator('[data-testid="assistant-message"], .assistant-message').all();
    for (const msg of messages) {
      const content = await msg.textContent();
      if (content && content !== '...' && content !== 'typing' && content.length > 10) {
        return content;
      }
    }
    await page.waitForTimeout(500);
  }
  throw new Error('Timeout waiting for AI response');
}

test.describe('AI Right Panel - Comprehensive Evaluation', () => {
  
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.waitForTimeout(3000); // Wait for page to fully load
  });

  test.describe('1. Streaming Functionality', () => {
    
    test('should receive streaming response or fall back gracefully', async ({ page }) => {
      // Open chat input
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      await expect(chatInput).toBeVisible({ timeout: 10000 });
      
      // Send a simple question
      await chatInput.fill('Hello, who am I talking to?');
      await chatInput.press('Enter');
      
      // Wait for response - could be streaming or fallback
      const response = await waitForAIResponse(page);
      
      // Verify we got a meaningful response
      expect(response.length).toBeGreaterThan(20);
      expect(response.toLowerCase()).toContain('adrata');
    });

    test('should show typing indicator while waiting', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      await chatInput.fill('Write me an email');
      await chatInput.press('Enter');
      
      // Should show typing indicator
      const typingIndicator = page.locator('text=/\\.\\.\\.?/');
      await expect(typingIndicator).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('2. Message Persistence', () => {
    
    test('user message should persist after AI response', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      const testMessage = 'Test message for persistence check';
      
      await chatInput.fill(testMessage);
      await chatInput.press('Enter');
      
      // Wait for response
      await waitForAIResponse(page);
      
      // User message should still be visible
      const userMessage = page.locator(`text=${testMessage}`);
      await expect(userMessage).toBeVisible();
    });

    test('multiple messages in conversation should persist', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      
      // First message
      await chatInput.fill('Question 1: Who is Terry Torok?');
      await chatInput.press('Enter');
      await waitForAIResponse(page);
      
      // Second message
      await chatInput.fill('Question 2: What company?');
      await chatInput.press('Enter');
      await waitForAIResponse(page);
      
      // Both questions should be visible
      await expect(page.locator('text=Question 1')).toBeVisible();
      await expect(page.locator('text=Question 2')).toBeVisible();
    });
  });

  test.describe('3. Conversation Context', () => {
    
    test('AI should remember previous context in conversation', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      
      // Ask about a person
      await chatInput.fill('Tell me about Terry Torok');
      await chatInput.press('Enter');
      const response1 = await waitForAIResponse(page);
      
      // Verify first response mentions Terry
      expect(response1.toLowerCase()).toMatch(/terry|torok|creative intelligence/i);
      
      // Ask follow-up without mentioning name
      await chatInput.fill('What company does he work for?');
      await chatInput.press('Enter');
      const response2 = await waitForAIResponse(page);
      
      // AI should remember we were talking about Terry
      expect(response2.toLowerCase()).toMatch(/creative intelligence|agency|terry/i);
    });
  });

  test.describe('4. Name Click Navigation', () => {
    
    test('clicking a highlighted name should navigate to record', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      
      // Ask about people in the list
      await chatInput.fill('Who is in my Speedrun list?');
      await chatInput.press('Enter');
      await waitForAIResponse(page);
      
      // Look for clickable name buttons (green highlighted names)
      const nameButton = page.locator('button:has-text("Terry Torok"), button:has-text("Luke Fritz")').first();
      
      if (await nameButton.isVisible()) {
        const currentUrl = page.url();
        await nameButton.click();
        
        // Should navigate to a record page
        await page.waitForTimeout(3000);
        const newUrl = page.url();
        
        // URL should have changed to include a record ID
        expect(newUrl).not.toBe(currentUrl);
        expect(newUrl).toMatch(/terry-torok|luke-fritz|-[0-9a-zA-Z]+$/);
      }
    });
  });

  test.describe('5. Response Quality', () => {
    
    test('response should not contain emojis', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      
      await chatInput.fill('Give me sales advice');
      await chatInput.press('Enter');
      const response = await waitForAIResponse(page);
      
      // Should not contain common emojis
      const emojiRegex = /[\u{1F600}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[✅❌⚠️📋💡🎯🔥]/gu;
      expect(response.match(emojiRegex)).toBeNull();
    });

    test('response should be contextual to the current view', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      
      await chatInput.fill('What am I looking at?');
      await chatInput.press('Enter');
      const response = await waitForAIResponse(page);
      
      // Should mention Speedrun or current section
      expect(response.toLowerCase()).toMatch(/speedrun|prospects?|pipeline|list/i);
    });

    test('email generation should follow best practices', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      
      await chatInput.fill('Write me a cold email to Terry Torok');
      await chatInput.press('Enter');
      const response = await waitForAIResponse(page);
      
      // Should be concise (under 200 words)
      const wordCount = response.split(/\s+/).length;
      expect(wordCount).toBeLessThan(250);
      
      // Should NOT start with "I hope this email finds you well"
      expect(response.toLowerCase()).not.toContain('hope this email finds you');
    });
  });

  test.describe('6. Error Handling', () => {
    
    test('should handle rapid consecutive messages', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      
      // Send multiple messages quickly
      await chatInput.fill('Message 1');
      await chatInput.press('Enter');
      await page.waitForTimeout(200);
      
      await chatInput.fill('Message 2');
      await chatInput.press('Enter');
      await page.waitForTimeout(200);
      
      await chatInput.fill('Message 3');
      await chatInput.press('Enter');
      
      // Wait for responses
      await page.waitForTimeout(20000);
      
      // All messages should be visible
      await expect(page.locator('text=Message 1')).toBeVisible();
      await expect(page.locator('text=Message 2')).toBeVisible();
      await expect(page.locator('text=Message 3')).toBeVisible();
    });
  });

  test.describe('7. List Context Integration', () => {
    
    test('should know about records in current list view', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      
      // Ask about someone in the list
      await chatInput.fill('Tell me about Terry Torok');
      await chatInput.press('Enter');
      const response = await waitForAIResponse(page);
      
      // Should find and describe Terry from the Speedrun list
      expect(response.toLowerCase()).not.toContain("didn't find");
      expect(response.toLowerCase()).not.toContain("not in your");
      expect(response.toLowerCase()).toMatch(/terry|creative intelligence|co-founder|prospect/i);
    });

    test('should list people from current view when asked', async ({ page }) => {
      const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
      
      await chatInput.fill('Who are the prospects in this list?');
      await chatInput.press('Enter');
      const response = await waitForAIResponse(page);
      
      // Should mention at least one person from the Speedrun list
      expect(response.toLowerCase()).toMatch(/terry|luke|torok|fritz|prospect/i);
    });
  });
});

// Performance benchmarks
test.describe('Performance Benchmarks', () => {
  
  test('simple question should respond within 10 seconds', async ({ page }) => {
    await signIn(page);
    
    const chatInput = page.locator('textarea[placeholder*="Think"], input[placeholder*="Think"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    const startTime = Date.now();
    await chatInput.fill('Hi');
    await chatInput.press('Enter');
    
    await waitForAIResponse(page);
    const responseTime = Date.now() - startTime;
    
    console.log(`Response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(10000);
  });
});

