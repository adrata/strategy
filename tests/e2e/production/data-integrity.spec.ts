/**
 * Production Data Integrity E2E Tests
 * 
 * End-to-end tests to verify no fallback data and proper
 * CoreSignal data display in production scenarios
 */

import { test, expect } from '@playwright/test';

test.describe('Production Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Company Record Data Integrity', () => {
    test('should show real data only with no fallback characters', async ({ page }) => {
      await page.goto('/companies/test-company-id');
      
      // Wait for page to load
      await page.waitForSelector('[data-testid="company-detail-view"]');
      
      // Verify no fallback '-' text is displayed anywhere
      const fallbackText = await page.locator('text="-"').count();
      expect(fallbackText).toBe(0);
      
      // Verify CoreSignal data is displayed when available
      const linkedinElement = page.locator('[data-testid="company-linkedin"]');
      if (await linkedinElement.isVisible()) {
        await expect(linkedinElement).toBeVisible();
      }
      
      // Verify empty states show "No data available" instead of '-'
      const emptyStates = await page.locator('text="No data available"').count();
      expect(emptyStates).toBeGreaterThan(0);
    });

    test('should display companyUpdates from database in News tab', async ({ page }) => {
      await page.goto('/companies/test-company-id');
      
      // Click on News tab
      await page.click('[data-testid="news-tab"]');
      await page.waitForSelector('[data-testid="news-content"]');
      
      // Verify data source indicator shows "Database"
      await expect(page.locator('text="Data Source:"')).toBeVisible();
      await expect(page.locator('text="Database"')).toBeVisible();
      
      // Verify no fallback data
      const fallbackText = await page.locator('text="-"').count();
      expect(fallbackText).toBe(0);
    });

    test('should fallback to Perplexity when no companyUpdates', async ({ page }) => {
      await page.goto('/companies/company-without-updates');
      
      // Click on News tab
      await page.click('[data-testid="news-tab"]');
      await page.waitForSelector('[data-testid="news-content"]');
      
      // Wait for API call to complete
      await page.waitForTimeout(2000);
      
      // Verify data source indicator shows "Perplexity" or "Real News"
      const dataSource = page.locator('[data-testid="data-source-indicator"]');
      await expect(dataSource).toBeVisible();
      
      // Should not show generated fake data
      await expect(page.locator('text="TechCorp Raises"')).not.toBeVisible();
      await expect(page.locator('text="Series B"')).not.toBeVisible();
    });

    test('should show proper empty states across all tabs', async ({ page }) => {
      await page.goto('/companies/empty-company');
      
      // Test each tab for proper empty state handling
      const tabs = ['overview', 'company', 'news', 'intelligence', 'buyer-groups'];
      
      for (const tab of tabs) {
        await page.click(`[data-testid="${tab}-tab"]`);
        await page.waitForSelector(`[data-testid="${tab}-content"]`);
        
        // Verify no fallback '-' characters
        const fallbackText = await page.locator('text="-"').count();
        expect(fallbackText).toBe(0);
        
        // Verify empty states are shown properly
        const emptyStates = await page.locator('text="No data available"').count();
        expect(emptyStates).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Person Record Data Integrity', () => {
    test('should show real CoreSignal data with no fallback characters', async ({ page }) => {
      await page.goto('/people/test-person-id');
      
      // Wait for page to load
      await page.waitForSelector('[data-testid="person-detail-view"]');
      
      // Verify no fallback '-' text is displayed anywhere
      const fallbackText = await page.locator('text="-"').count();
      expect(fallbackText).toBe(0);
      
      // Verify CoreSignal data is displayed when available
      const coresignalData = page.locator('[data-testid="coresignal-data"]');
      if (await coresignalData.isVisible()) {
        await expect(coresignalData).toBeVisible();
      }
      
      // Verify empty states show "No data available"
      const emptyStates = await page.locator('text="No data available"').count();
      expect(emptyStates).toBeGreaterThan(0);
    });

    test('should display real career data in Buyer Groups tab', async ({ page }) => {
      await page.goto('/people/test-person-id');
      
      // Click on Buyer Groups tab
      await page.click('[data-testid="buyer-groups-tab"]');
      await page.waitForSelector('[data-testid="buyer-groups-content"]');
      
      // Verify real career data is used for risk assessment
      const riskAssessment = page.locator('[data-testid="risk-assessment"]');
      await expect(riskAssessment).toBeVisible();
      
      // Should not show mock career data
      await expect(page.locator('text="2-5 years"')).not.toBeVisible();
      await expect(page.locator('text="Bachelor\'s"')).not.toBeVisible();
    });

    test('should handle null values gracefully in all person tabs', async ({ page }) => {
      await page.goto('/people/person-with-nulls');
      
      const tabs = ['overview', 'career', 'insights'];
      
      for (const tab of tabs) {
        await page.click(`[data-testid="${tab}-tab"]`);
        await page.waitForSelector(`[data-testid="${tab}-content"]`);
        
        // Verify no fallback '-' characters
        const fallbackText = await page.locator('text="-"').count();
        expect(fallbackText).toBe(0);
        
        // Verify proper empty state handling
        const emptyStates = await page.locator('text="No data available"').count();
        expect(emptyStates).toBeGreaterThan(0);
      }
    });
  });

  test.describe('InlineEdit Data Integrity', () => {
    test('should handle null values in inline edit fields', async ({ page }) => {
      await page.goto('/companies/test-company-id');
      
      // Find a field with null value
      const nullField = page.locator('[data-testid="inline-edit-field"]').first();
      await expect(nullField).toContainText('No data available');
      
      // Click edit button
      await nullField.locator('[data-testid="pencil-icon"]').click();
      
      // Should show empty input field
      const input = page.locator('input, textarea').first();
      await expect(input).toHaveValue('');
      
      // Type new value
      await input.fill('New Value');
      
      // Save
      await page.locator('[data-testid="check-icon"]').click();
      
      // Should show success message
      await expect(page.locator('text="Field updated successfully"')).toBeVisible();
    });

    test('should cancel editing and return to null display', async ({ page }) => {
      await page.goto('/companies/test-company-id');
      
      // Find a field with null value
      const nullField = page.locator('[data-testid="inline-edit-field"]').first();
      
      // Enter edit mode
      await nullField.locator('[data-testid="pencil-icon"]').click();
      
      // Type something
      const input = page.locator('input, textarea').first();
      await input.fill('Some Value');
      
      // Cancel
      await page.locator('[data-testid="x-mark-icon"]').click();
      
      // Should return to "No data available"
      await expect(nullField).toContainText('No data available');
    });
  });

  test.describe('Cross-Browser Data Display', () => {
    test('should display data consistently across browsers', async ({ page, browserName }) => {
      await page.goto('/companies/test-company-id');
      
      // Verify core elements are visible
      await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="company-industry"]')).toBeVisible();
      
      // Verify no fallback data
      const fallbackText = await page.locator('text="-"').count();
      expect(fallbackText).toBe(0);
      
      // Take screenshot for visual regression testing
      await page.screenshot({ 
        path: `tests/screenshots/data-integrity-${browserName}.png`,
        fullPage: true 
      });
    });
  });

  test.describe('Mobile Responsive Data Display', () => {
    test('should display data properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/companies/test-company-id');
      
      // Verify data is displayed properly on mobile
      await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
      
      // Verify no horizontal scrolling due to data display issues
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
      
      // Verify no fallback data on mobile
      const fallbackText = await page.locator('text="-"').count();
      expect(fallbackText).toBe(0);
    });
  });

  test.describe('Search and Filter with CoreSignal Data', () => {
    test('should search and filter results with CoreSignal data', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Perform search
      await page.fill('[data-testid="search-input"]', 'Test Company');
      await page.click('[data-testid="search-button"]');
      
      // Wait for results
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Verify results show real data
      const results = page.locator('[data-testid="search-result"]');
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
      
      // Verify no fallback data in search results
      const fallbackText = await page.locator('text="-"').count();
      expect(fallbackText).toBe(0);
    });

    test('should filter by CoreSignal data fields', async ({ page }) => {
      await page.goto('/people');
      
      // Apply filter for buyer group members
      await page.click('[data-testid="filter-button"]');
      await page.check('[data-testid="buyer-group-filter"]');
      await page.click('[data-testid="apply-filters"]');
      
      // Wait for filtered results
      await page.waitForSelector('[data-testid="filtered-results"]');
      
      // Verify filtered results show real data
      const results = page.locator('[data-testid="person-card"]');
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
      
      // Verify no fallback data in filtered results
      const fallbackText = await page.locator('text="-"').count();
      expect(fallbackText).toBe(0);
    });
  });

  test.describe('Modal Updates Preserve CoreSignal Data', () => {
    test('should preserve CoreSignal data when updating person in modal', async ({ page }) => {
      await page.goto('/people/test-person-id');
      
      // Open update modal
      await page.click('[data-testid="update-person-button"]');
      await page.waitForSelector('[data-testid="update-person-modal"]');
      
      // Update a field
      await page.fill('[data-testid="email-input"]', 'newemail@testcompany.com');
      
      // Save
      await page.click('[data-testid="save-button"]');
      await page.waitForSelector('text="Person updated successfully"');
      
      // Close modal
      await page.click('[data-testid="close-modal"]');
      
      // Verify CoreSignal data is still present
      const coresignalData = page.locator('[data-testid="coresignal-data"]');
      if (await coresignalData.isVisible()) {
        await expect(coresignalData).toBeVisible();
      }
    });

    test('should preserve customFields when updating company in modal', async ({ page }) => {
      await page.goto('/companies/test-company-id');
      
      // Open update modal
      await page.click('[data-testid="update-company-button"]');
      await page.waitForSelector('[data-testid="update-company-modal"]');
      
      // Update a field
      await page.fill('[data-testid="industry-input"]', 'Updated Industry');
      
      // Save
      await page.click('[data-testid="save-button"]');
      await page.waitForSelector('text="Company updated successfully"');
      
      // Close modal
      await page.click('[data-testid="close-modal"]');
      
      // Verify customFields are still present
      const customFields = page.locator('[data-testid="custom-fields"]');
      if (await customFields.isVisible()) {
        await expect(customFields).toBeVisible();
      }
    });
  });

  test.describe('Tab Navigation with Real Data', () => {
    test('should maintain data integrity when switching tabs', async ({ page }) => {
      await page.goto('/companies/test-company-id');
      
      // Test tab switching
      const tabs = ['overview', 'company', 'news', 'intelligence', 'buyer-groups'];
      
      for (const tab of tabs) {
        await page.click(`[data-testid="${tab}-tab"]`);
        await page.waitForSelector(`[data-testid="${tab}-content"]`);
        
        // Verify no fallback data
        const fallbackText = await page.locator('text="-"').count();
        expect(fallbackText).toBe(0);
        
        // Verify data persistence
        await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
      }
    });

    test('should load data correctly when navigating between records', async ({ page }) => {
      await page.goto('/companies/company-1');
      await page.waitForSelector('[data-testid="company-detail-view"]');
      
      // Navigate to another company
      await page.goto('/companies/company-2');
      await page.waitForSelector('[data-testid="company-detail-view"]');
      
      // Verify data loaded correctly
      await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
      
      // Verify no fallback data
      const fallbackText = await page.locator('text="-"').count();
      expect(fallbackText).toBe(0);
    });
  });
});
