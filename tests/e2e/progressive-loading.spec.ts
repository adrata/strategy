/**
 * E2E Tests for Progressive Loading
 * 
 * Tests actual page behavior, prefetch timing, and user experience
 */

import { test, expect } from '@playwright/test';

test.describe('Progressive Loading E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should show 100 records instantly when navigating to leads', async ({ page }) => {
    // Login (adjust selectors based on your auth flow)
    // This is a placeholder - adjust based on your actual login flow
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');

    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password');
      await loginButton.click();
      await page.waitForURL('**/top/**', { timeout: 10000 });
    }

    // Navigate to speedrun first
    await page.goto('http://localhost:3000/top/speedrun');
    await page.waitForLoadState('networkidle');

    // Wait a bit for prefetch to start
    await page.waitForTimeout(2000);

    // Navigate to leads
    const startTime = Date.now();
    await page.goto('http://localhost:3000/top/leads');
    
    // Wait for table to appear
    await page.waitForSelector('table, [data-testid="pipeline-table"]', { timeout: 5000 });
    
    const loadTime = Date.now() - startTime;

    // Should load quickly (< 2 seconds) due to prefetch
    expect(loadTime).toBeLessThan(2000);

    // Check that records are displayed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(100); // Should show max 100 initially
  });

  test('should prefetch leads immediately when landing on speedrun', async ({ page, context }) => {
    // Track network requests
    const requests: string[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/v1/people') && url.includes('section=leads')) {
        requests.push('leads');
      }
      if (url.includes('/api/v1/people') && url.includes('section=prospects')) {
        requests.push('prospects');
      }
    });

    // Navigate to speedrun
    await page.goto('http://localhost:3000/top/speedrun');
    await page.waitForLoadState('networkidle');

    // Wait for prefetch to complete (debounce + delays)
    await page.waitForTimeout(2000);

    // Leads should be prefetched first
    expect(requests).toContain('leads');
    
    // Prospects should be prefetched second
    const leadsIndex = requests.indexOf('leads');
    const prospectsIndex = requests.indexOf('prospects');
    if (leadsIndex !== -1 && prospectsIndex !== -1) {
      expect(leadsIndex).toBeLessThan(prospectsIndex);
    }
  });

  test('should show correct pagination count (1-100 of 3000)', async ({ page }) => {
    // Navigate to leads page
    await page.goto('http://localhost:3000/top/leads');
    await page.waitForLoadState('networkidle');

    // Wait for pagination to appear
    await page.waitForSelector('text=/Showing.*to.*of.*results/', { timeout: 10000 });

    // Check pagination text
    const paginationText = await page.locator('text=/Showing.*to.*of.*results/').textContent();
    
    // Should show "Showing 1 to 100 of X" format
    expect(paginationText).toMatch(/Showing\s+\d+\s+to\s+\d+\s+of\s+\d+/);
    
    // Extract numbers
    const match = paginationText?.match(/Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)/);
    if (match) {
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);
      const total = parseInt(match[3]);
      
      // Should start at 1
      expect(start).toBe(1);
      // Should end at 100 (or less if fewer records)
      expect(end).toBeLessThanOrEqual(100);
      // Total should be accurate (from API count)
      expect(total).toBeGreaterThan(0);
    }
  });

  test('should update pagination count when page size changes', async ({ page }) => {
    await page.goto('http://localhost:3000/top/leads');
    await page.waitForLoadState('networkidle');

    // Wait for pagination controls
    await page.waitForSelector('select', { timeout: 10000 });

    // Get initial pagination text
    const initialText = await page.locator('text=/Showing.*to.*of.*results/').textContent();
    const initialMatch = initialText?.match(/Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)/);
    const initialTotal = initialMatch ? parseInt(initialMatch[3]) : 0;

    // Change page size to 50
    const pageSizeSelect = page.locator('select').first();
    await pageSizeSelect.selectOption('50');

    // Wait for update
    await page.waitForTimeout(500);

    // Check new pagination text
    const newText = await page.locator('text=/Showing.*to.*of.*results/').textContent();
    const newMatch = newText?.match(/Showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)/);
    
    if (newMatch) {
      const newStart = parseInt(newMatch[1]);
      const newEnd = parseInt(newMatch[2]);
      const newTotal = parseInt(newMatch[3]);
      
      // Total should remain the same
      expect(newTotal).toBe(initialTotal);
      // End should be 50 (or less)
      expect(newEnd).toBeLessThanOrEqual(50);
    }
  });

  test('should not show loading skeleton when cache exists', async ({ page }) => {
    // First visit - populate cache
    await page.goto('http://localhost:3000/top/leads');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for cache to be written

    // Navigate away
    await page.goto('http://localhost:3000/top/speedrun');
    await page.waitForLoadState('networkidle');

    // Navigate back to leads
    const startTime = Date.now();
    await page.goto('http://localhost:3000/top/leads');
    
    // Should not show skeleton (instant hydration)
    const skeleton = page.locator('[data-testid="skeleton"], .animate-pulse');
    const skeletonVisible = await skeleton.first().isVisible().catch(() => false);
    
    const loadTime = Date.now() - startTime;

    // Should load very quickly from cache
    expect(loadTime).toBeLessThan(1000);
    
    // Skeleton should not be visible (or disappear quickly)
    if (skeletonVisible) {
      await page.waitForTimeout(500);
      const stillVisible = await skeleton.first().isVisible().catch(() => false);
      expect(stillVisible).toBe(false);
    }
  });
});

