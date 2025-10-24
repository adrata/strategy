/**
 * E2E Tests for Company Record Field Persistence
 * 
 * Tests real browser interactions to ensure company field changes
 * persist across navigation using Playwright.
 */

import { test, expect } from '@playwright/test';

test.describe('Company Record Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the companies page
    await page.goto('/ne/companies');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should persist field edits after navigation', async ({ page }) => {
    // Find and click on the first company record
    const companyLink = page.locator('[data-testid="company-row"]').first();
    await companyLink.click();
    
    // Wait for the company detail page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on a company detail page
    await expect(page).toHaveURL(/\/companies\/.*/);
    
    // Find and edit the company name field
    const nameField = page.locator('[data-testid="company-name-field"]').first();
    await nameField.click();
    await nameField.fill('Updated Company Name');
    await nameField.press('Enter');
    
    // Wait for the save to complete
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Verify success message appears
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Navigate back to companies list
    await page.click('[data-testid="back-button"]');
    
    // Wait for the companies list to load
    await page.waitForLoadState('networkidle');
    
    // Click on the same company again
    await companyLink.click();
    
    // Wait for the company detail page to load
    await page.waitForLoadState('networkidle');
    
    // Verify the updated name is displayed
    await expect(nameField).toHaveValue('Updated Company Name');
  });

  test('should persist multiple field edits', async ({ page }) => {
    // Find and click on the first company record
    const companyLink = page.locator('[data-testid="company-row"]').first();
    await companyLink.click();
    
    // Wait for the company detail page to load
    await page.waitForLoadState('networkidle');
    
    // Edit company name
    const nameField = page.locator('[data-testid="company-name-field"]').first();
    await nameField.click();
    await nameField.fill('Updated Company Name');
    await nameField.press('Enter');
    
    // Wait for save
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Edit website
    const websiteField = page.locator('[data-testid="company-website-field"]').first();
    await websiteField.click();
    await websiteField.fill('updated-website.com');
    await websiteField.press('Enter');
    
    // Wait for save
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Edit description
    const descriptionField = page.locator('[data-testid="company-description-field"]').first();
    await descriptionField.click();
    await descriptionField.fill('Updated company description');
    await descriptionField.press('Enter');
    
    // Wait for save
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Navigate back to companies list
    await page.click('[data-testid="back-button"]');
    await page.waitForLoadState('networkidle');
    
    // Click on the same company again
    await companyLink.click();
    await page.waitForLoadState('networkidle');
    
    // Verify all changes are persisted
    await expect(nameField).toHaveValue('Updated Company Name');
    await expect(websiteField).toHaveValue('updated-website.com');
    await expect(descriptionField).toHaveValue('Updated company description');
  });

  test('should handle rapid edits and navigation', async ({ page }) => {
    // Find and click on the first company record
    const companyLink = page.locator('[data-testid="company-row"]').first();
    await companyLink.click();
    
    // Wait for the company detail page to load
    await page.waitForLoadState('networkidle');
    
    // Make rapid edits
    const nameField = page.locator('[data-testid="company-name-field"]').first();
    const websiteField = page.locator('[data-testid="company-website-field"]').first();
    
    // Edit name
    await nameField.click();
    await nameField.fill('Rapid Edit Company');
    await nameField.press('Enter');
    
    // Immediately edit website without waiting for save
    await websiteField.click();
    await websiteField.fill('rapid-edit.com');
    await websiteField.press('Enter');
    
    // Wait for all saves to complete
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    
    // Navigate away immediately
    await page.click('[data-testid="back-button"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate back
    await companyLink.click();
    await page.waitForLoadState('networkidle');
    
    // Verify changes are persisted
    await expect(nameField).toHaveValue('Rapid Edit Company');
    await expect(websiteField).toHaveValue('rapid-edit.com');
  });

  test('should persist changes with browser back button', async ({ page }) => {
    // Find and click on the first company record
    const companyLink = page.locator('[data-testid="company-row"]').first();
    await companyLink.click();
    
    // Wait for the company detail page to load
    await page.waitForLoadState('networkidle');
    
    // Edit company name
    const nameField = page.locator('[data-testid="company-name-field"]').first();
    await nameField.click();
    await nameField.fill('Browser Back Test Company');
    await nameField.press('Enter');
    
    // Wait for save
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Click on the same company again
    await companyLink.click();
    await page.waitForLoadState('networkidle');
    
    // Verify the change is persisted
    await expect(nameField).toHaveValue('Browser Back Test Company');
  });

  test('should persist changes with direct URL navigation', async ({ page }) => {
    // Find and click on the first company record
    const companyLink = page.locator('[data-testid="company-row"]').first();
    await companyLink.click();
    
    // Wait for the company detail page to load
    await page.waitForLoadState('networkidle');
    
    // Get the current URL
    const currentUrl = page.url();
    
    // Edit company name
    const nameField = page.locator('[data-testid="company-name-field"]').first();
    await nameField.click();
    await nameField.fill('Direct URL Test Company');
    await nameField.press('Enter');
    
    // Wait for save
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Navigate to a different page
    await page.goto('/ne/companies');
    await page.waitForLoadState('networkidle');
    
    // Navigate directly back to the company URL
    await page.goto(currentUrl);
    await page.waitForLoadState('networkidle');
    
    // Verify the change is persisted
    await expect(nameField).toHaveValue('Direct URL Test Company');
  });

  test('should handle session storage cache correctly', async ({ page }) => {
    // Find and click on the first company record
    const companyLink = page.locator('[data-testid="company-row"]').first();
    await companyLink.click();
    
    // Wait for the company detail page to load
    await page.waitForLoadState('networkidle');
    
    // Edit company name
    const nameField = page.locator('[data-testid="company-name-field"]').first();
    await nameField.click();
    await nameField.fill('Cache Test Company');
    await nameField.press('Enter');
    
    // Wait for save
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Check that force-refresh flags are set in sessionStorage
    const sessionStorage = await page.evaluate(() => {
      const keys = Object.keys(sessionStorage);
      return keys.filter(key => key.startsWith('force-refresh-'));
    });
    
    expect(sessionStorage.length).toBeGreaterThan(0);
    expect(sessionStorage.some(key => key.includes('companies'))).toBe(true);
    
    // Navigate away
    await page.click('[data-testid="back-button"]');
    await page.waitForLoadState('networkidle');
    
    // Click on the same company again
    await companyLink.click();
    await page.waitForLoadState('networkidle');
    
    // Verify the change is persisted
    await expect(nameField).toHaveValue('Cache Test Company');
    
    // Check that force-refresh flags were cleared
    const sessionStorageAfter = await page.evaluate(() => {
      const keys = Object.keys(sessionStorage);
      return keys.filter(key => key.startsWith('force-refresh-'));
    });
    
    expect(sessionStorageAfter.length).toBe(0);
  });

  test('should handle multiple companies with different changes', async ({ page }) => {
    // Get the first two company records
    const companyLinks = page.locator('[data-testid="company-row"]');
    const firstCompany = companyLinks.nth(0);
    const secondCompany = companyLinks.nth(1);
    
    // Edit first company
    await firstCompany.click();
    await page.waitForLoadState('networkidle');
    
    const firstCompanyNameField = page.locator('[data-testid="company-name-field"]').first();
    await firstCompanyNameField.click();
    await firstCompanyNameField.fill('First Company Updated');
    await firstCompanyNameField.press('Enter');
    
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Navigate back
    await page.click('[data-testid="back-button"]');
    await page.waitForLoadState('networkidle');
    
    // Edit second company
    await secondCompany.click();
    await page.waitForLoadState('networkidle');
    
    const secondCompanyNameField = page.locator('[data-testid="company-name-field"]').first();
    await secondCompanyNameField.click();
    await secondCompanyNameField.fill('Second Company Updated');
    await secondCompanyNameField.press('Enter');
    
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Navigate back
    await page.click('[data-testid="back-button"]');
    await page.waitForLoadState('networkidle');
    
    // Verify first company changes
    await firstCompany.click();
    await page.waitForLoadState('networkidle');
    await expect(firstCompanyNameField).toHaveValue('First Company Updated');
    
    // Navigate back
    await page.click('[data-testid="back-button"]');
    await page.waitForLoadState('networkidle');
    
    // Verify second company changes
    await secondCompany.click();
    await page.waitForLoadState('networkidle');
    await expect(secondCompanyNameField).toHaveValue('Second Company Updated');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure for the save request
    await page.route('**/api/v1/companies/*', route => {
      if (route.request().method() === 'PATCH') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Find and click on the first company record
    const companyLink = page.locator('[data-testid="company-row"]').first();
    await companyLink.click();
    
    // Wait for the company detail page to load
    await page.waitForLoadState('networkidle');
    
    // Try to edit company name
    const nameField = page.locator('[data-testid="company-name-field"]').first();
    await nameField.click();
    await nameField.fill('Network Error Test');
    await nameField.press('Enter');
    
    // Wait for error message
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });
    
    // Verify error message is shown
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Verify the field value was reverted
    await expect(nameField).toHaveValue(''); // Should be empty or original value
  });

  test('should handle concurrent edits from multiple tabs', async ({ browser }) => {
    // Open two tabs
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate both to companies page
    await page1.goto('/ne/companies');
    await page2.goto('/ne/companies');
    
    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    // Get the same company in both tabs
    const companyLink1 = page1.locator('[data-testid="company-row"]').first();
    const companyLink2 = page2.locator('[data-testid="company-row"]').first();
    
    await companyLink1.click();
    await companyLink2.click();
    
    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    // Edit in first tab
    const nameField1 = page1.locator('[data-testid="company-name-field"]').first();
    await nameField1.click();
    await nameField1.fill('Tab 1 Edit');
    await nameField1.press('Enter');
    
    await page1.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Edit in second tab
    const nameField2 = page2.locator('[data-testid="company-name-field"]').first();
    await nameField2.click();
    await nameField2.fill('Tab 2 Edit');
    await nameField2.press('Enter');
    
    await page2.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
    
    // Refresh both tabs
    await page1.reload();
    await page2.reload();
    
    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    // Verify both tabs show the latest change
    await expect(nameField1).toHaveValue('Tab 2 Edit');
    await expect(nameField2).toHaveValue('Tab 2 Edit');
    
    await context.close();
  });
});
