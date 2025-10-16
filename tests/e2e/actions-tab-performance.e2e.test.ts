import { test, expect } from '@playwright/test';

test.describe('Actions Tab Performance E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test record page
    await page.goto('/test-workspace/leads/test-person-123');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="record-detail-page"]');
  });

  test('should load Actions tab instantly on second visit', async ({ page }) => {
    // First visit to Actions tab
    await page.click('[data-testid="actions-tab"]');
    
    // Should show loading initially
    await expect(page.locator('text=Loading...')).toBeVisible();
    
    // Wait for data to load
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    
    // Switch to another tab
    await page.click('[data-testid="overview-tab"]');
    
    // Switch back to Actions tab
    const startTime = Date.now();
    await page.click('[data-testid="actions-tab"]');
    
    // Should load instantly (no loading state)
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    
    // Should show data immediately
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    
    // Should load within 100ms (instant)
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(100);
  });

  test('should not show loading skeleton when cached data exists', async ({ page }) => {
    // Visit Actions tab first time to populate cache
    await page.click('[data-testid="actions-tab"]');
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    
    // Switch away and back
    await page.click('[data-testid="overview-tab"]');
    await page.click('[data-testid="actions-tab"]');
    
    // Should never show loading skeleton
    await expect(page.locator('[data-testid="loading-skeleton"]')).not.toBeVisible();
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    
    // Should show data immediately
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
  });

  test('should handle record navigation with proper caching', async ({ page }) => {
    // Visit first record's Actions tab
    await page.click('[data-testid="actions-tab"]');
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    
    // Navigate to next record
    await page.click('[data-testid="next-record-button"]');
    await page.waitForSelector('[data-testid="record-detail-page"]');
    
    // Visit Actions tab for second record
    await page.click('[data-testid="actions-tab"]');
    
    // Should show data for second record
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    
    // Navigate back to first record
    await page.click('[data-testid="previous-record-button"]');
    await page.waitForSelector('[data-testid="record-detail-page"]');
    
    // Visit Actions tab - should load instantly from cache
    const startTime = Date.now();
    await page.click('[data-testid="actions-tab"]');
    
    // Should load instantly
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(100);
  });

  test('should handle background refresh for stale cache', async ({ page }) => {
    // Visit Actions tab to populate cache
    await page.click('[data-testid="actions-tab"]');
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    
    // Simulate stale cache by modifying localStorage
    await page.evaluate(() => {
      const cacheKey = 'actions-test-person-123-people-v1';
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        parsed.timestamp = Date.now() - 120000; // 2 minutes old
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      }
    });
    
    // Switch away and back
    await page.click('[data-testid="overview-tab"]');
    await page.click('[data-testid="actions-tab"]');
    
    // Should show cached data immediately
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    
    // Should not show loading skeleton
    await expect(page.locator('text=Loading...')).not.toBeVisible();
    
    // Wait for background refresh (check network requests)
    await page.waitForResponse(response => 
      response.url().includes('/api/v1/actions') && response.status() === 200
    );
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/v1/actions*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Visit Actions tab
    await page.click('[data-testid="actions-tab"]');
    
    // Should show error state
    await expect(page.locator('text=Failed to load actions')).toBeVisible();
    await expect(page.locator('text=Try Again')).toBeVisible();
    
    // Mock successful retry
    await page.route('/api/v1/actions*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'action-1',
              subject: 'Retry Action',
              description: 'Success after retry',
              userId: 'user-1',
              completedAt: new Date().toISOString(),
              type: 'call',
              status: 'completed'
            }
          ]
        })
      });
    });
    
    // Click retry button
    await page.click('text=Try Again');
    
    // Should show loading during retry
    await expect(page.locator('text=Loading...')).toBeVisible();
    
    // Should show data after successful retry
    await expect(page.locator('text=Retry Action')).toBeVisible();
  });

  test('should minimize network requests with proper caching', async ({ page }) => {
    const requests: string[] = [];
    
    // Track API requests
    page.on('request', request => {
      if (request.url().includes('/api/v1/actions')) {
        requests.push(request.url());
      }
    });
    
    // Visit Actions tab first time
    await page.click('[data-testid="actions-tab"]');
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    
    // Should have made one API request
    expect(requests.length).toBe(1);
    
    // Switch away and back multiple times
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="overview-tab"]');
      await page.click('[data-testid="actions-tab"]');
    }
    
    // Should still have only one API request (cached)
    expect(requests.length).toBe(1);
  });

  test('should handle rapid tab switching without issues', async ({ page }) => {
    // Rapidly switch between tabs
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="actions-tab"]');
      await page.click('[data-testid="overview-tab"]');
    }
    
    // Final visit to Actions tab should work correctly
    await page.click('[data-testid="actions-tab"]');
    
    // Should show data without errors
    await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
    
    // Should not show loading skeleton
    await expect(page.locator('text=Loading...')).not.toBeVisible();
  });

  test('should maintain performance across different record types', async ({ page }) => {
    const recordTypes = ['leads', 'prospects', 'people', 'companies'];
    
    for (const recordType of recordTypes) {
      // Navigate to different record type
      await page.goto(`/test-workspace/${recordType}/test-record-123`);
      await page.waitForSelector('[data-testid="record-detail-page"]');
      
      // Visit Actions tab
      const startTime = Date.now();
      await page.click('[data-testid="actions-tab"]');
      
      // Should load quickly
      await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (500ms for first visit)
      expect(loadTime).toBeLessThan(500);
      
      // Second visit should be instant
      await page.click('[data-testid="overview-tab"]');
      const secondStartTime = Date.now();
      await page.click('[data-testid="actions-tab"]');
      
      await expect(page.locator('[data-testid="action-item"]')).toBeVisible();
      const secondLoadTime = Date.now() - secondStartTime;
      expect(secondLoadTime).toBeLessThan(100);
    }
  });
});

