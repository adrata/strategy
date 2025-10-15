/**
 * Add Company Modal E2E Tests
 * 
 * End-to-end tests for the AddCompanyModal component
 */

import { test, expect, Page } from '@playwright/test';
import { createTestCompany, TEST_USER, waitForAsync } from '../../utils/test-factories';

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

// Helper function to open Add Company modal
async function openAddCompanyModal(page: Page) {
  // Navigate to pipeline header and click Add Company button
  await page.goto(`${BASE_URL}/speedrun`);
  await page.waitForSelector('[data-testid="pipeline-header"]');
  
  // Click the Add Company button in the header
  await page.click('[data-testid="add-company-button"]');
  await page.waitForSelector('[data-testid="add-company-modal"]');
}

test.describe('Add Company Modal E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should open modal from pipeline header', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Verify modal is open
    expect(await page.locator('[data-testid="add-company-modal"]')).toBeVisible();
    expect(await page.locator('h2:has-text("Add Company")')).toBeVisible();
    
    // Verify form fields are present
    expect(await page.locator('input[name="name"]')).toBeVisible();
    expect(await page.locator('input[name="website"]')).toBeVisible();
    expect(await page.locator('textarea[name="notes"]')).toBeVisible();
  });

  test('should create company with minimal data (name only)', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in company name
    await page.fill('input[name="name"]', 'Minimal Company');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company created successfully');
    
    // Verify modal closes
    await page.waitForSelector('[data-testid="add-company-modal"]', { state: 'hidden' });
  });

  test('should create company with full data', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in all fields
    await page.fill('input[name="name"]', 'Full Company');
    await page.fill('input[name="website"]', 'https://fullcompany.com');
    await page.fill('textarea[name="notes"]', 'This is a test company with full data');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company created successfully');
    
    // Verify modal closes
    await page.waitForSelector('[data-testid="add-company-modal"]', { state: 'hidden' });
  });

  test('should create company and use it immediately', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in company data
    await page.fill('input[name="name"]', 'Immediate Use Company');
    await page.fill('input[name="website"]', 'https://immediateuse.com');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success and modal to close
    await page.waitForSelector('[data-testid="success-message"]');
    await page.waitForSelector('[data-testid="add-company-modal"]', { state: 'hidden' });
    
    // Navigate to companies page to verify company was created
    await page.goto(`${BASE_URL}/companies`);
    await page.waitForSelector('[data-testid="companies-table"]');
    
    // Verify company appears in the list
    expect(await page.locator('text=Immediate Use Company')).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in company name
    await page.fill('input[name="name"]', 'Keyboard Company');
    
    // Use Cmd+Enter (or Ctrl+Enter on Windows) to submit
    await page.keyboard.press('Meta+Enter');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company created successfully');
  });

  test('should close modal on success', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in company name
    await page.fill('input[name="name"]', 'Close Test Company');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify modal closes automatically
    await page.waitForSelector('[data-testid="add-company-modal"]', { state: 'hidden' });
  });

  test('should display and recover from errors', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Try to submit without company name
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await page.waitForSelector('[data-testid="error-message"]');
    expect(await page.locator('[data-testid="error-message"]')).toContainText('Company name is required');
    
    // Fill in company name and try again
    await page.fill('input[name="name"]', 'Error Recovery Company');
    await page.click('button[type="submit"]');
    
    // Should succeed this time
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company created successfully');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/v1/companies', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' }),
      });
    });
    
    await openAddCompanyModal(page);
    
    // Fill in company data
    await page.fill('input[name="name"]', 'Network Error Company');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await page.waitForSelector('[data-testid="error-message"]');
    expect(await page.locator('[data-testid="error-message"]')).toContainText('Internal server error');
    
    // Modal should remain open for retry
    expect(await page.locator('[data-testid="add-company-modal"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Try to submit with empty name
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await page.waitForSelector('[data-testid="error-message"]');
    expect(await page.locator('[data-testid="error-message"]')).toContainText('Company name is required');
    
    // Try with whitespace only
    await page.fill('input[name="name"]', '   ');
    await page.click('button[type="submit"]');
    
    // Should still show validation error
    expect(await page.locator('[data-testid="error-message"]')).toContainText('Company name is required');
    
    // Fill with valid name
    await page.fill('input[name="name"]', 'Valid Company');
    await page.click('button[type="submit"]');
    
    // Should succeed
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company created successfully');
  });

  test('should normalize website URLs', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in company data with unnormalized URL
    await page.fill('input[name="name"]', 'URL Test Company');
    await page.fill('input[name="website"]', 'testcompany.com');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Navigate to companies page to verify URL was normalized
    await page.goto(`${BASE_URL}/companies`);
    await page.waitForSelector('[data-testid="companies-table"]');
    
    // Find the company row and verify website
    const companyRow = page.locator('tr:has-text("URL Test Company")');
    expect(await companyRow.locator('text=https://testcompany.com')).toBeVisible();
  });

  test('should handle special characters in company names', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in company name with special characters
    await page.fill('input[name="name"]', 'Company & Associates, LLC');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Navigate to companies page to verify company was created
    await page.goto(`${BASE_URL}/companies`);
    await page.waitForSelector('[data-testid="companies-table"]');
    
    // Verify company appears with special characters
    expect(await page.locator('text=Company & Associates, LLC')).toBeVisible();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Click outside the modal (on the backdrop)
    await page.click('[data-testid="modal-backdrop"]');
    
    // Modal should close
    await page.waitForSelector('[data-testid="add-company-modal"]', { state: 'hidden' });
  });

  test('should close modal when pressing Escape', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Press Escape key
    await page.keyboard.press('Escape');
    
    // Modal should close
    await page.waitForSelector('[data-testid="add-company-modal"]', { state: 'hidden' });
  });

  test('should focus name input when modal opens', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Name input should be focused
    const nameInput = page.locator('input[name="name"]');
    expect(await nameInput).toBeFocused();
  });

  test('should handle rapid form submissions', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in company data
    await page.fill('input[name="name"]', 'Rapid Submit Company');
    
    // Click submit multiple times rapidly
    await page.click('button[type="submit"]');
    await page.click('button[type="submit"]');
    await page.click('button[type="submit"]');
    
    // Should only create one company
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Navigate to companies page to verify only one company was created
    await page.goto(`${BASE_URL}/companies`);
    await page.waitForSelector('[data-testid="companies-table"]');
    
    // Should only see one instance of the company
    const companyCount = await page.locator('text=Rapid Submit Company').count();
    expect(companyCount).toBe(1);
  });

  test('should reset form when modal reopens', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in some data
    await page.fill('input[name="name"]', 'Reset Test Company');
    await page.fill('input[name="website"]', 'https://resettest.com');
    
    // Close modal without submitting
    await page.keyboard.press('Escape');
    await page.waitForSelector('[data-testid="add-company-modal"]', { state: 'hidden' });
    
    // Reopen modal
    await openAddCompanyModal(page);
    
    // Form should be reset
    expect(await page.locator('input[name="name"]').inputValue()).toBe('');
    expect(await page.locator('input[name="website"]').inputValue()).toBe('');
  });

  test('should handle long company names', async ({ page }) => {
    await openAddCompanyModal(page);
    
    // Fill in very long company name
    const longName = 'A'.repeat(200);
    await page.fill('input[name="name"]', longName);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should succeed
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Navigate to companies page to verify company was created
    await page.goto(`${BASE_URL}/companies`);
    await page.waitForSelector('[data-testid="companies-table"]');
    
    // Verify company appears (may be truncated in display)
    expect(await page.locator(`text=${longName.substring(0, 50)}`)).toBeVisible();
  });
});
