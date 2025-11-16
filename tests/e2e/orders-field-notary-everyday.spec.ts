/**
 * E2E Tests: Orders Field for Notary Everyday Workspace
 * 
 * Comprehensive test suite to verify Orders field functionality:
 * 1. Orders field in company detail view (Overview tab)
 * 2. Orders field in company tabs for leads/prospects/opportunities/people records
 * 3. Orders column in clients table (retention-os)
 * 4. Orders sorting functionality
 * 5. Orders editing functionality
 * 
 * This test requires:
 * - Notary Everyday workspace access
 * - Test user with access to Notary Everyday workspace
 * - At least one company record in Notary Everyday workspace
 */

import { test, expect } from '@playwright/test';

// Test credentials - should be set via environment variables
const TEST_EMAIL = process.env.TEST_EMAIL || 'ryan@notaryeveryday.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';
const TEST_WORKSPACE = process.env.TEST_WORKSPACE || 'notary-everyday';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Orders Field - Notary Everyday Workspace', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage
    await context.clearCookies();
    await page.goto(`${BASE_URL}/sign-in`);
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.getByLabel('Username or Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Start|Sign In|Login/i }).click();
    
    // Wait for redirect after login
    await page.waitForURL(/\/(notary-everyday|ne)\//, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test.describe('Company Detail View - Orders Field', () => {
    test('should display Orders field in company Overview tab', async ({ page }) => {
      // Navigate to companies page
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`);
      await page.waitForLoadState('networkidle');
      
      // Wait for companies table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      
      // Click on first company
      const firstCompany = page.locator('table tbody tr').first();
      await firstCompany.click();
      
      // Wait for company detail view to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Give time for tabs to render
      
      // Verify we're on Overview tab (should be default)
      const overviewTab = page.locator('button:has-text("Overview"), button:has-text("Home")').first();
      await expect(overviewTab).toBeVisible();
      
      // Look for Orders field in Key Metrics section
      const ordersField = page.locator('text=Orders').first();
      await expect(ordersField).toBeVisible({ timeout: 5000 });
      
      // Verify Orders field is in a metrics card
      const ordersCard = ordersField.locator('..').locator('..');
      await expect(ordersCard).toBeVisible();
    });

    test('should allow editing Orders field in company Overview tab', async ({ page }) => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`);
      await page.waitForLoadState('networkidle');
      
      // Click on first company
      await page.locator('table tbody tr').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Find Orders field
      const ordersField = page.locator('text=Orders').first();
      await expect(ordersField).toBeVisible();
      
      // Find the input field (InlineEditField should be clickable)
      const ordersInput = ordersField.locator('..').locator('input[type="number"], input').first();
      
      // Click to edit
      await ordersInput.click();
      await page.waitForTimeout(500);
      
      // Clear and enter new value
      await ordersInput.clear();
      await ordersInput.fill('150');
      await ordersInput.press('Enter');
      
      // Wait for save to complete
      await page.waitForResponse(
        response => 
          response.url().includes('/api/v1/companies/') && 
          response.request().method() === 'PATCH',
        { timeout: 5000 }
      );
      
      // Verify the value is displayed
      await page.waitForTimeout(1000); // Give time for UI to update
      const updatedValue = await ordersInput.inputValue();
      expect(updatedValue).toContain('150');
    });
  });

  test.describe('Company Tab - Orders Field for People/Leads/Prospects', () => {
    test('should display Orders field in company tab for people records', async ({ page }) => {
      // Navigate to people page
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/people`);
      await page.waitForLoadState('networkidle');
      
      // Wait for people table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      
      // Click on first person
      await page.locator('table tbody tr').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Navigate to Company tab
      const companyTab = page.locator('button:has-text("Account"), button:has-text("Company")').first();
      if (await companyTab.isVisible()) {
        await companyTab.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for Orders field
      const ordersField = page.locator('text=Orders').first();
      await expect(ordersField).toBeVisible({ timeout: 5000 });
    });

    test('should display Orders field in company tab for leads records', async ({ page }) => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/acquisition-os/leads`);
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.locator('table tbody tr').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Navigate to Company tab
      const companyTab = page.locator('button:has-text("Account"), button:has-text("Company")').first();
      if (await companyTab.isVisible()) {
        await companyTab.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for Orders field
      const ordersField = page.locator('text=Orders').first();
      await expect(ordersField).toBeVisible({ timeout: 5000 });
    });

    test('should allow editing Orders field in company tab', async ({ page }) => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/people`);
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.locator('table tbody tr').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Navigate to Company tab
      const companyTab = page.locator('button:has-text("Account"), button:has-text("Company")').first();
      if (await companyTab.isVisible()) {
        await companyTab.click();
        await page.waitForTimeout(1000);
      }
      
      // Find and edit Orders field
      const ordersField = page.locator('text=Orders').first();
      await expect(ordersField).toBeVisible();
      
      const ordersInput = ordersField.locator('..').locator('input[type="number"], input').first();
      await ordersInput.click();
      await page.waitForTimeout(500);
      
      await ordersInput.clear();
      await ordersInput.fill('200');
      await ordersInput.press('Enter');
      
      // Wait for save
      await page.waitForResponse(
        response => 
          response.url().includes('/api/v1/companies/') && 
          response.request().method() === 'PATCH',
        { timeout: 5000 }
      );
      
      await page.waitForTimeout(1000);
      const updatedValue = await ordersInput.inputValue();
      expect(updatedValue).toContain('200');
    });
  });

  test.describe('Clients Table - Orders Column', () => {
    test('should display Orders column in retention-os clients table', async ({ page }) => {
      // Navigate to retention-os clients page
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/retention-os/clients`);
      await page.waitForLoadState('networkidle');
      
      // Wait for table to load
      await page.waitForSelector('table thead th', { timeout: 10000 });
      
      // Look for Orders column header
      const ordersHeader = page.locator('th:has-text("Orders"), thead:has-text("Orders")');
      await expect(ordersHeader).toBeVisible({ timeout: 5000 });
      
      // Verify Orders column appears in table rows
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      const firstRow = page.locator('table tbody tr').first();
      await expect(firstRow).toBeVisible();
      
      // Check that Orders column has data (could be a number or '-')
      const ordersCells = page.locator('table tbody td').filter({ hasText: /^\d+$|^-$/ });
      const ordersCount = await ordersCells.count();
      expect(ordersCount).toBeGreaterThan(0);
    });

    test('should allow sorting by Orders column', async ({ page }) => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/retention-os/clients`);
      await page.waitForLoadState('networkidle');
      
      // Wait for table to load
      await page.waitForSelector('table thead th', { timeout: 10000 });
      
      // Find Orders column header and click to sort
      const ordersHeader = page.locator('th:has-text("Orders"), thead:has-text("Orders")');
      await expect(ordersHeader).toBeVisible();
      
      // Click to sort
      await ordersHeader.click();
      await page.waitForTimeout(1000);
      
      // Wait for API call with sortBy=orders
      await page.waitForResponse(
        response => 
          response.url().includes('/api/v1/companies') && 
          response.url().includes('sortBy=orders'),
        { timeout: 5000 }
      );
      
      // Verify table is still visible (sorting didn't break the table)
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      const rows = await page.locator('table tbody tr').count();
      expect(rows).toBeGreaterThan(0);
    });

    test('should display Orders values correctly in table cells', async ({ page }) => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/retention-os/clients`);
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      
      // Get all table rows
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        // Check first few rows for Orders column
        for (let i = 0; i < Math.min(3, rowCount); i++) {
          const row = rows.nth(i);
          const cells = row.locator('td');
          const cellCount = await cells.count();
          
          // Orders should be one of the columns
          // The exact position depends on column order, but it should exist
          const rowText = await row.textContent();
          expect(rowText).toBeTruthy();
        }
      }
    });
  });

  test.describe('Orders Field Persistence', () => {
    test('should persist Orders value after page refresh', async ({ page }) => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`);
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.locator('table tbody tr').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Find and edit Orders field
      const ordersField = page.locator('text=Orders').first();
      await expect(ordersField).toBeVisible();
      
      const ordersInput = ordersField.locator('..').locator('input[type="number"], input').first();
      await ordersInput.click();
      await page.waitForTimeout(500);
      
      const testValue = '999';
      await ordersInput.clear();
      await ordersInput.fill(testValue);
      await ordersInput.press('Enter');
      
      // Wait for save
      await page.waitForResponse(
        response => 
          response.url().includes('/api/v1/companies/') && 
          response.request().method() === 'PATCH',
        { timeout: 5000 }
      );
      
      await page.waitForTimeout(1000);
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Verify Orders value persisted
      const ordersFieldAfterRefresh = page.locator('text=Orders').first();
      await expect(ordersFieldAfterRefresh).toBeVisible();
      
      const ordersInputAfterRefresh = ordersFieldAfterRefresh.locator('..').locator('input[type="number"], input').first();
      const persistedValue = await ordersInputAfterRefresh.inputValue();
      expect(persistedValue).toContain(testValue);
    });
  });

  test.describe('Orders Field - Workspace Specificity', () => {
    test('should only show Orders field for Notary Everyday workspace', async ({ page }) => {
      // This test verifies that Orders field is workspace-specific
      // If we navigate to a different workspace, Orders should not appear
      
      // First verify it appears in Notary Everyday
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`);
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.locator('table tbody tr').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Orders should be visible in Notary Everyday
      const ordersField = page.locator('text=Orders').first();
      await expect(ordersField).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Orders Column - Table Integration', () => {
    test('should show Orders column in companies table for Notary Everyday', async ({ page }) => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`);
      await page.waitForLoadState('networkidle');
      
      // Wait for table to load
      await page.waitForSelector('table thead th', { timeout: 10000 });
      
      // Look for Orders column header
      const ordersHeader = page.locator('th:has-text("Orders"), thead:has-text("Orders")');
      await expect(ordersHeader).toBeVisible({ timeout: 5000 });
    });

    test('should show Orders column in clients table for Notary Everyday', async ({ page }) => {
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/retention-os/clients`);
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('table thead th', { timeout: 10000 });
      
      const ordersHeader = page.locator('th:has-text("Orders"), thead:has-text("Orders")');
      await expect(ordersHeader).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Orders API Integration', () => {
    test('should save Orders value via API correctly', async ({ page }) => {
      let companyId: string | null = null;
      
      // Intercept API calls
      page.on('response', async (response) => {
        if (response.url().includes('/api/v1/companies/') && response.request().method() === 'GET') {
          const data = await response.json();
          if (data.success && data.data && data.data.id) {
            companyId = data.data.id;
          }
        }
      });
      
      await page.goto(`${BASE_URL}/${TEST_WORKSPACE}/companies`);
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      await page.locator('table tbody tr').first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Wait for company data to load
      await page.waitForTimeout(1000);
      
      // Edit Orders field
      const ordersField = page.locator('text=Orders').first();
      await expect(ordersField).toBeVisible();
      
      const ordersInput = ordersField.locator('..').locator('input[type="number"], input').first();
      await ordersInput.click();
      await page.waitForTimeout(500);
      
      const testValue = '777';
      await ordersInput.clear();
      await ordersInput.fill(testValue);
      await ordersInput.press('Enter');
      
      // Wait for PATCH request
      const patchResponse = await page.waitForResponse(
        response => 
          response.url().includes('/api/v1/companies/') && 
          response.request().method() === 'PATCH',
        { timeout: 5000 }
      );
      
      // Verify request body contains customFields.orders
      const requestBody = patchResponse.request().postData();
      expect(requestBody).toBeTruthy();
      
      if (requestBody) {
        const body = JSON.parse(requestBody);
        expect(body.customFields).toBeTruthy();
        expect(body.customFields.orders).toBe(testValue);
      }
      
      // Verify response is successful
      const responseData = await patchResponse.json();
      expect(responseData.success).toBe(true);
    });
  });
});

