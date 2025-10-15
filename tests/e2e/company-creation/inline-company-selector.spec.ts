/**
 * Inline Company Selector E2E Tests
 * 
 * End-to-end tests for the InlineCompanySelector component
 */

import { test, expect, Page } from '@playwright/test';
import { createTestCompany, createTestPerson, TEST_USER, waitForAsync } from '../../utils/test-factories';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/sign-in`);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', 'test-password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/speedrun');
}

// Helper function to create test person
async function createTestPersonRecord(page: Page) {
  const testPerson = createTestPerson('LEAD');
  
  const response = await page.request.post(`${BASE_URL}/api/v1/people`, {
    data: testPerson,
    headers: { 'Content-Type': 'application/json' },
  });
  
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.data;
}

// Helper function to navigate to person record
async function navigateToPersonRecord(page: Page, personId: string) {
  await page.goto(`${BASE_URL}/speedrun`);
  await page.waitForSelector('[data-testid="pipeline-table"]');
  
  // Find and click on the person record
  await page.click(`[data-testid="person-${personId}"]`);
  await page.waitForSelector('[data-testid="person-details"]');
}

test.describe('Inline Company Selector E2E Tests', () => {
  let testPersonId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    testPersonId = (await createTestPersonRecord(page)).id;
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test person
    if (testPersonId) {
      await page.request.delete(`${BASE_URL}/api/v1/people/${testPersonId}`);
    }
  });

  test('should create company inline from person record', async ({ page }) => {
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type new company name
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.fill('Inline Created Company');
    
    // Wait for "Add Company" option to appear
    await page.waitForSelector('text=+ Add "Inline Created Company"');
    
    // Click "Add Company" option
    await page.click('text=+ Add "Inline Created Company"');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Inline Created Company');
    await page.fill('input[placeholder="Website (optional)"]', 'https://inlinecreated.com');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Wait for company to be created and input to be updated
    await page.waitForSelector('input[value="Inline Created Company"]');
    
    // Save the record
    await page.click('button[title="Save"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company updated successfully');
  });

  test('should search and select existing company', async ({ page }) => {
    // First create a company via API
    const testCompany = createTestCompany({ name: 'Existing Company' });
    const companyResponse = await page.request.post(`${BASE_URL}/api/v1/companies`, {
      data: testCompany,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(companyResponse.ok()).toBeTruthy();
    const companyData = await companyResponse.json();
    const companyId = companyData.data.id;

    try {
      await navigateToPersonRecord(page, testPersonId);
      
      // Find the company field and click edit
      const companyField = page.locator('[data-testid="company-field"]');
      await companyField.hover();
      await companyField.locator('button[title="Edit"]').click();
      
      // Type company name to search
      const input = page.locator('input[placeholder="Enter company name"]');
      await input.fill('Existing');
      
      // Wait for search results
      await page.waitForSelector('text=Existing Company');
      
      // Click on the existing company
      await page.click('text=Existing Company');
      
      // Verify input is updated
      expect(await input.inputValue()).toBe('Existing Company');
      
      // Save the record
      await page.click('button[title="Save"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-message"]');
      expect(await page.locator('[data-testid="success-message"]')).toContainText('Company updated successfully');
    } finally {
      // Cleanup company
      await page.request.delete(`${BASE_URL}/api/v1/companies/${companyId}`);
    }
  });

  test('should create new company inline and use it immediately', async ({ page }) => {
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type new company name
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.fill('Immediate Use Company');
    
    // Wait for "Add Company" option
    await page.waitForSelector('text=+ Add "Immediate Use Company"');
    
    // Click "Add Company" option
    await page.click('text=+ Add "Immediate Use Company"');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Immediate Use Company');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Wait for company to be created
    await page.waitForSelector('input[value="Immediate Use Company"]');
    
    // The company should now be available for future searches
    // Clear and retype to test search
    await input.clear();
    await input.fill('Immediate');
    
    // Should find the newly created company
    await page.waitForSelector('text=Immediate Use Company');
    
    // Save the record
    await page.click('button[title="Save"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company updated successfully');
  });

  test('should handle company creation errors', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/v1/companies', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Company creation failed' }),
      });
    });
    
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type new company name
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.fill('Error Test Company');
    
    // Wait for "Add Company" option
    await page.waitForSelector('text=+ Add "Error Test Company"');
    
    // Click "Add Company" option
    await page.click('text=+ Add "Error Test Company"');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Error Test Company');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Should show error message
    await page.waitForSelector('text=Company creation failed');
    
    // Should remain in edit mode for retry
    expect(await input).toBeVisible();
  });

  test('should cancel company creation', async ({ page }) => {
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type new company name
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.fill('Cancel Test Company');
    
    // Wait for "Add Company" option
    await page.waitForSelector('text=+ Add "Cancel Test Company"');
    
    // Click "Add Company" option
    await page.click('text=+ Add "Cancel Test Company"');
    
    // Click Cancel button
    await page.click('button:has-text("Cancel")');
    
    // Should return to search mode
    expect(await page.locator('input[placeholder="Enter company name"]')).toBeVisible();
    expect(await page.locator('text=+ Add "Cancel Test Company"')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type new company name
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.fill('Keyboard Test Company');
    
    // Press Enter to save (should trigger save since no "Add Company" option is shown for exact match)
    await page.keyboard.press('Enter');
    
    // Should save the company name as text
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company updated successfully');
  });

  test('should handle escape key to cancel', async ({ page }) => {
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type some text
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.fill('Escape Test Company');
    
    // Press Escape to cancel
    await page.keyboard.press('Escape');
    
    // Should exit edit mode
    expect(await page.locator('input[placeholder="Enter company name"]')).not.toBeVisible();
    expect(await page.locator('[data-testid="company-field"]')).toBeVisible();
  });

  test('should handle click outside to close dropdown', async ({ page }) => {
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type to trigger search
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.fill('Click Outside Test');
    
    // Wait for dropdown to appear
    await page.waitForSelector('text=+ Add "Click Outside Test"');
    
    // Click outside the dropdown
    await page.click('body');
    
    // Dropdown should close
    expect(await page.locator('text=+ Add "Click Outside Test"')).not.toBeVisible();
  });

  test('should handle empty company name gracefully', async ({ page }) => {
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Leave input empty and try to save
    const input = page.locator('input[placeholder="Enter company name"]');
    await page.keyboard.press('Enter');
    
    // Should save empty value (clearing the company)
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company updated successfully');
  });

  test('should handle special characters in company names', async ({ page }) => {
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type company name with special characters
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.fill('Special & Associates, LLC');
    
    // Wait for "Add Company" option
    await page.waitForSelector('text=+ Add "Special & Associates, LLC"');
    
    // Click "Add Company" option
    await page.click('text=+ Add "Special & Associates, LLC"');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Special & Associates, LLC');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Wait for company to be created
    await page.waitForSelector('input[value="Special & Associates, LLC"]');
    
    // Save the record
    await page.click('button[title="Save"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company updated successfully');
  });

  test('should handle rapid typing and searching', async ({ page }) => {
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type rapidly
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.type('Rapid', { delay: 50 });
    await input.type(' Test', { delay: 50 });
    await input.type(' Company', { delay: 50 });
    
    // Should show "Add Company" option
    await page.waitForSelector('text=+ Add "Rapid Test Company"');
    
    // Click "Add Company" option
    await page.click('text=+ Add "Rapid Test Company"');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Rapid Test Company');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Wait for company to be created
    await page.waitForSelector('input[value="Rapid Test Company"]');
    
    // Save the record
    await page.click('button[title="Save"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company updated successfully');
  });

  test('should handle loading states during company creation', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/v1/companies', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'test-id', name: 'Loading Test Company' },
        }),
      });
    });
    
    await navigateToPersonRecord(page, testPersonId);
    
    // Find the company field and click edit
    const companyField = page.locator('[data-testid="company-field"]');
    await companyField.hover();
    await companyField.locator('button[title="Edit"]').click();
    
    // Type new company name
    const input = page.locator('input[placeholder="Enter company name"]');
    await input.fill('Loading Test Company');
    
    // Wait for "Add Company" option
    await page.waitForSelector('text=+ Add "Loading Test Company"');
    
    // Click "Add Company" option
    await page.click('text=+ Add "Loading Test Company"');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Loading Test Company');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Should show loading state
    await page.waitForSelector('text=Creating...');
    
    // Wait for company to be created
    await page.waitForSelector('input[value="Loading Test Company"]');
    
    // Save the record
    await page.click('button[title="Save"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company updated successfully');
  });
});
