/**
 * E2E Tests for All Record Page Types
 * 
 * Comprehensive tests for all record types: people, companies, leads, prospects, opportunities, clients, speedrun
 */

import { test, expect } from '@playwright/test';

test.describe('Record Pages E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the workspace
    await page.goto('/test-workspace');
    
    // Wait for authentication
    await page.waitForSelector('[data-testid="workspace-loaded"]', { timeout: 10000 });
  });

  test.describe('People Record Pages', () => {
    test('should render people record page without crashing', async ({ page }) => {
      // Navigate to a people record
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Wait for the page to load
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Check that the page renders without errors
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
      expect(await page.locator('[data-testid="record-type-indicator"]')).toHaveText('people');
    });

    test('should display people record data correctly', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Check that person data is displayed
      await expect(page.locator('[data-testid="record-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="record-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="record-title"]')).toBeVisible();
    });

    test('should handle people record navigation', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Test navigation controls
      const prevButton = page.locator('[data-testid="navigate-previous-button"]');
      const nextButton = page.locator('[data-testid="navigate-next-button"]');
      
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(1000);
      }
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Page should still be functional
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });

    test('should switch tabs in people record', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Test tab switching
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      const insightsTab = page.locator('[data-testid="tab-insights"]');
      
      await overviewTab.click();
      await page.waitForTimeout(500);
      
      await insightsTab.click();
      await page.waitForTimeout(500);
      
      // Should show insights tab content
      await expect(page.locator('[data-testid="tab-content-insights"]')).toBeVisible();
    });

    test('should complete actions in people record', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Test complete action
      const completeButton = page.locator('[data-testid="complete-button"]');
      if (await completeButton.isVisible()) {
        await completeButton.click();
        
        // Should open complete action modal
        await expect(page.locator('[data-testid="complete-action-modal"]')).toBeVisible();
        
        // Fill in action details
        await page.fill('[data-testid="action-notes"]', 'Test completion notes');
        await page.selectOption('[data-testid="action-outcome"]', 'positive');
        
        // Complete the action
        await page.click('[data-testid="complete-action"]');
        
        // Should show success message
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      }
    });
  });

  test.describe('Companies Record Pages', () => {
    test('should render companies record page without crashing', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/companies/test-company-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
      expect(await page.locator('[data-testid="record-type-indicator"]')).toHaveText('companies');
    });

    test('should display company data correctly', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/companies/test-company-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Check that company data is displayed
      await expect(page.locator('[data-testid="record-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="record-website"]')).toBeVisible();
      await expect(page.locator('[data-testid="record-industry"]')).toBeVisible();
    });

    test('should handle company record navigation', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/companies/test-company-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Test navigation
      const nextButton = page.locator('[data-testid="navigate-next-button"]');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }
      
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });
  });

  test.describe('Leads Record Pages', () => {
    test('should render leads record page without crashing', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/leads/test-lead-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
      expect(await page.locator('[data-testid="record-type-indicator"]')).toHaveText('leads');
    });

    test('should display lead data correctly', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/leads/test-lead-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      await expect(page.locator('[data-testid="record-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="record-status"]')).toHaveText('LEAD');
    });
  });

  test.describe('Prospects Record Pages', () => {
    test('should render prospects record page without crashing', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/prospects/test-prospect-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
      expect(await page.locator('[data-testid="record-type-indicator"]')).toHaveText('prospects');
    });

    test('should display prospect data correctly', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/prospects/test-prospect-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      await expect(page.locator('[data-testid="record-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="record-status"]')).toHaveText('PROSPECT');
    });
  });

  test.describe('Opportunities Record Pages', () => {
    test('should render opportunities record page without crashing', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/opportunities/test-opportunity-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
      expect(await page.locator('[data-testid="record-type-indicator"]')).toHaveText('opportunities');
    });

    test('should display opportunity data correctly', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/opportunities/test-opportunity-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      await expect(page.locator('[data-testid="record-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="record-status"]')).toHaveText('OPPORTUNITY');
      await expect(page.locator('[data-testid="opportunity-amount"]')).toBeVisible();
    });
  });

  test.describe('Clients Record Pages', () => {
    test('should render clients record page without crashing', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/clients/test-client-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
      expect(await page.locator('[data-testid="record-type-indicator"]')).toHaveText('clients');
    });

    test('should display client data correctly', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/clients/test-client-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      await expect(page.locator('[data-testid="record-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="record-status"]')).toHaveText('CLIENT');
    });
  });

  test.describe('Speedrun Record Pages', () => {
    test('should render speedrun record page without crashing', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
      expect(await page.locator('[data-testid="record-type-indicator"]')).toHaveText('speedrun');
    });

    test('should display speedrun data correctly', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      await expect(page.locator('[data-testid="record-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="speedrun-rank"]')).toBeVisible();
    });

    test('should handle speedrun navigation', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Test speedrun-specific navigation
      const nextButton = page.locator('[data-testid="navigate-next-button"]');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
      }
      
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });

    test('should handle speedrun actions', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Test snooze action
      const snoozeButton = page.locator('[data-testid="snooze-button"]');
      if (await snoozeButton.isVisible()) {
        await snoozeButton.click();
        
        // Should open snooze modal
        await expect(page.locator('[data-testid="snooze-modal"]')).toBeVisible();
        
        // Select snooze duration
        await page.selectOption('[data-testid="snooze-duration"]', '1 day');
        
        // Confirm snooze
        await page.click('[data-testid="confirm-snooze"]');
        
        // Should show success message
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      }
    });
  });

  test.describe('Cross-Record Type Navigation', () => {
    test('should navigate between different record types', async ({ page }) => {
      // Start with people record
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Navigate to companies
      await page.goto('/test-workspace/pipeline/companies/test-company-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Navigate to leads
      await page.goto('/test-workspace/pipeline/leads/test-lead-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // All pages should render without crashing
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });

    test('should maintain state during navigation', async ({ page }) => {
      // Start with people record
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Switch to insights tab
      await page.click('[data-testid="tab-insights"]');
      await page.waitForTimeout(500);
      
      // Navigate to different record
      await page.goto('/test-workspace/pipeline/companies/test-company-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Page should still be functional
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });
  });

  test.describe('Record Page Performance', () => {
    test('should load record pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle rapid navigation without issues', async ({ page }) => {
      // Rapid navigation between records
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      await page.goto('/test-workspace/pipeline/companies/test-company-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      await page.goto('/test-workspace/pipeline/leads/test-lead-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Should still be functional
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });
  });

  test.describe('Record Page Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to navigate with keyboard
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Check for ARIA labels
      const elementsWithAria = await page.locator('[aria-label]').count();
      expect(elementsWithAria).toBeGreaterThan(0);
    });

    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Check for proper heading structure
      const h1 = await page.locator('h1').count();
      const h2 = await page.locator('h2').count();
      
      expect(h1).toBeGreaterThan(0);
      expect(h2).toBeGreaterThan(0);
    });
  });

  test.describe('Record Page Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Should be visible on mobile
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      await page.waitForSelector('[data-testid="record-page-container"]', { timeout: 10000 });
      
      // Should be visible on tablet
      expect(await page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });
  });
});
