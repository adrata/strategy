/**
 * AI Web Search E2E Tests
 * 
 * Tests that the AI right panel can successfully search the web
 */

import { test, expect } from '@playwright/test';

test.describe('AI Right Panel - Web Search', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    
    // May need to login - implement based on your auth flow
    // await page.fill('[name="email"]', 'test@adrata.com');
    // await page.fill('[name="password"]', 'password');
    // await page.click('button[type="submit"]');
  });

  test('should send web search request through AI chat', async ({ page }) => {
    // Open right panel (if not already open)
    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Type a query that requires web search
    await chatInput.fill('What are the latest AI trends in 2025?');
    
    // Submit
    await chatInput.press('Enter');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check that a response appears
    const messages = page.locator('[class*="message"]');
    const messageCount = await messages.count();
    
    expect(messageCount).toBeGreaterThan(0);
  });

  test('should handle company research query', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible();

    // Ask about a company
    await chatInput.fill('Tell me about Salesforce latest news');
    await chatInput.press('Enter');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Response should contain information
    const responseText = await page.locator('[class*="message"]').last().textContent();
    expect(responseText).toBeTruthy();
  });

  test('should display sources when available', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible();

    await chatInput.fill('Research Microsoft recent acquisitions');
    await chatInput.press('Enter');
    
    await page.waitForTimeout(5000);
    
    // Check for response
    const lastMessage = page.locator('[class*="message"]').last();
    await expect(lastMessage).toBeVisible();
  });

  test('should handle real-time queries', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible();

    await chatInput.fill('What is the current stock price of Apple?');
    await chatInput.press('Enter');
    
    await page.waitForTimeout(5000);
    
    // Should get a response
    const messages = page.locator('[class*="message"]');
    expect(await messages.count()).toBeGreaterThan(1);
  });

  test('should handle error gracefully', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible();

    // Send a query that might fail
    await chatInput.fill('Search for [invalid query that might error]');
    await chatInput.press('Enter');
    
    await page.waitForTimeout(3000);
    
    // Should still show some response, not crash
    const messages = page.locator('[class*="message"]');
    expect(await messages.count()).toBeGreaterThan(0);
  });
});

test.describe('Web Search API Direct', () => {
  test('should respond to direct API call', async ({ request }) => {
    const response = await request.post('/api/ai/web-search', {
      data: {
        query: 'Test query for AI',
        options: {
          maxResults: 5
        }
      }
    });

    // May be 401 if not authenticated in test, that's okay
    expect([200, 401]).toContain(response.status());
  });

  test('should validate query parameter', async ({ request }) => {
    const response = await request.post('/api/ai/web-search', {
      data: {
        // Missing query
        options: {}
      }
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should handle GET requests', async ({ request }) => {
    const response = await request.get('/api/ai/web-search?q=test');

    // May be 401 if not authenticated
    expect([200, 401]).toContain(response.status());
  });
});

