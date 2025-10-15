/**
 * Company Selector E2E Tests
 * 
 * End-to-end tests for the CompanySelector component in various contexts
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

// Helper function to open Add Person modal
async function openAddPersonModal(page: Page) {
  await page.goto(`${BASE_URL}/speedrun`);
  await page.waitForSelector('[data-testid="pipeline-header"]');
  
  // Click the Add Person button
  await page.click('[data-testid="add-person-button"]');
  await page.waitForSelector('[data-testid="add-person-modal"]');
}

// Helper function to open Add Lead modal
async function openAddLeadModal(page: Page) {
  await page.goto(`${BASE_URL}/leads`);
  await page.waitForSelector('[data-testid="leads-header"]');
  
  // Click the Add Lead button
  await page.click('[data-testid="add-lead-button"]');
  await page.waitForSelector('[data-testid="add-lead-modal"]');
}

test.describe('Company Selector E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should work in Add Person modal', async ({ page }) => {
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    expect(await companySelector).toBeVisible();
    
    // Click on the company selector
    await companySelector.click();
    
    // Type to search for companies
    await companySelector.fill('Test Company');
    
    // Should show "Add Company" option
    await page.waitForSelector('text=Add "Test Company" as new company');
    
    // Click "Add Company" option
    await page.click('text=Add "Test Company" as new company');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Test Company');
    await page.fill('input[placeholder="Website (optional)"]', 'https://testcompany.com');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Company should be selected
    expect(await companySelector.inputValue()).toBe('Test Company');
    
    // Fill in person details
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@testcompany.com');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Person created successfully');
  });

  test('should work in Add Lead modal', async ({ page }) => {
    await openAddLeadModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    expect(await companySelector).toBeVisible();
    
    // Click on the company selector
    await companySelector.click();
    
    // Type to search for companies
    await companySelector.fill('Lead Company');
    
    // Should show "Add Company" option
    await page.waitForSelector('text=Add "Lead Company" as new company');
    
    // Click "Add Company" option
    await page.click('text=Add "Lead Company" as new company');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Lead Company');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Company should be selected
    expect(await companySelector.inputValue()).toBe('Lead Company');
    
    // Fill in lead details
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'jane.smith@leadcompany.com');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Lead created successfully');
  });

  test('should search and select existing company', async ({ page }) => {
    // First create a company via API
    const testCompany = createTestCompany({ name: 'Existing Search Company' });
    const companyResponse = await page.request.post(`${BASE_URL}/api/v1/companies`, {
      data: testCompany,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(companyResponse.ok()).toBeTruthy();
    const companyData = await companyResponse.json();
    const companyId = companyData.data.id;

    try {
      await openAddPersonModal(page);
      
      // Find the company selector
      const companySelector = page.locator('[data-testid="company-selector"]');
      await companySelector.click();
      
      // Type to search for the existing company
      await companySelector.fill('Existing Search');
      
      // Should show the existing company in results
      await page.waitForSelector('text=Existing Search Company');
      
      // Click on the existing company
      await page.click('text=Existing Search Company');
      
      // Company should be selected
      expect(await companySelector.inputValue()).toBe('Existing Search Company');
      
      // Fill in person details
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john.doe@existingsearch.com');
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-message"]');
      expect(await page.locator('[data-testid="success-message"]')).toContainText('Person created successfully');
    } finally {
      // Cleanup company
      await page.request.delete(`${BASE_URL}/api/v1/companies/${companyId}`);
    }
  });

  test('should handle dropdown search behavior', async ({ page }) => {
    // Create multiple companies for testing search
    const companies = [
      createTestCompany({ name: 'Alpha Corporation' }),
      createTestCompany({ name: 'Beta Industries' }),
      createTestCompany({ name: 'Gamma Solutions' }),
    ];
    
    const companyIds = [];
    for (const company of companies) {
      const response = await page.request.post(`${BASE_URL}/api/v1/companies`, {
        data: company,
        headers: { 'Content-Type': 'application/json' },
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      companyIds.push(data.data.id);
    }

    try {
      await openAddPersonModal(page);
      
      // Find the company selector
      const companySelector = page.locator('[data-testid="company-selector"]');
      await companySelector.click();
      
      // Type to search
      await companySelector.fill('Alpha');
      
      // Should show only Alpha Corporation
      await page.waitForSelector('text=Alpha Corporation');
      expect(await page.locator('text=Beta Industries')).not.toBeVisible();
      expect(await page.locator('text=Gamma Solutions')).not.toBeVisible();
      
      // Clear and search for Beta
      await companySelector.clear();
      await companySelector.fill('Beta');
      
      // Should show only Beta Industries
      await page.waitForSelector('text=Beta Industries');
      expect(await page.locator('text=Alpha Corporation')).not.toBeVisible();
      expect(await page.locator('text=Gamma Solutions')).not.toBeVisible();
      
      // Clear and search for common term
      await companySelector.clear();
      await companySelector.fill('Corp');
      
      // Should show Alpha Corporation
      await page.waitForSelector('text=Alpha Corporation');
    } finally {
      // Cleanup companies
      for (const companyId of companyIds) {
        await page.request.delete(`${BASE_URL}/api/v1/companies/${companyId}`);
      }
    }
  });

  test('should show "Add Company" option when no exact match', async ({ page }) => {
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type a unique company name
    await companySelector.fill('Unique Company Name');
    
    // Should show "Add Company" option
    await page.waitForSelector('text=Add "Unique Company Name" as new company');
    
    // Should not show any existing companies
    expect(await page.locator('[data-testid="company-option"]')).toHaveCount(0);
  });

  test('should not show "Add Company" option when exact match exists', async ({ page }) => {
    // First create a company
    const testCompany = createTestCompany({ name: 'Exact Match Company' });
    const companyResponse = await page.request.post(`${BASE_URL}/api/v1/companies`, {
      data: testCompany,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(companyResponse.ok()).toBeTruthy();
    const companyData = await companyResponse.json();
    const companyId = companyData.data.id;

    try {
      await openAddPersonModal(page);
      
      // Find the company selector
      const companySelector = page.locator('[data-testid="company-selector"]');
      await companySelector.click();
      
      // Type the exact company name
      await companySelector.fill('Exact Match Company');
      
      // Should show the existing company
      await page.waitForSelector('text=Exact Match Company');
      
      // Should not show "Add Company" option
      expect(await page.locator('text=Add "Exact Match Company" as new company')).not.toBeVisible();
    } finally {
      // Cleanup company
      await page.request.delete(`${BASE_URL}/api/v1/companies/${companyId}`);
    }
  });

  test('should create and select company in one flow', async ({ page }) => {
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type new company name
    await companySelector.fill('One Flow Company');
    
    // Click "Add Company" option
    await page.click('text=Add "One Flow Company" as new company');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'One Flow Company');
    await page.fill('input[placeholder="Website (optional)"]', 'https://oneflow.com');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Company should be selected automatically
    expect(await companySelector.inputValue()).toBe('One Flow Company');
    
    // Fill in person details
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@oneflow.com');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Person created successfully');
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
    
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type new company name
    await companySelector.fill('Error Test Company');
    
    // Click "Add Company" option
    await page.click('text=Add "Error Test Company" as new company');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Error Test Company');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Should show error message
    await page.waitForSelector('text=Company creation failed');
    
    // Company should not be selected
    expect(await companySelector.inputValue()).toBe('');
  });

  test('should handle click outside to close dropdown', async ({ page }) => {
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type to trigger dropdown
    await companySelector.fill('Click Outside Test');
    
    // Wait for dropdown to appear
    await page.waitForSelector('text=Add "Click Outside Test" as new company');
    
    // Click outside the dropdown
    await page.click('body');
    
    // Dropdown should close
    expect(await page.locator('text=Add "Click Outside Test" as new company')).not.toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type to trigger dropdown
    await companySelector.fill('Keyboard Test');
    
    // Wait for dropdown to appear
    await page.waitForSelector('text=Add "Keyboard Test" as new company');
    
    // Press Escape to close dropdown
    await page.keyboard.press('Escape');
    
    // Dropdown should close
    expect(await page.locator('text=Add "Keyboard Test" as new company')).not.toBeVisible();
  });

  test('should handle disabled state', async ({ page }) => {
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    
    // Should not be disabled by default
    expect(await companySelector).not.toBeDisabled();
    
    // If there's a way to disable it, test that scenario
    // This would depend on the specific implementation
  });

  test('should handle loading state during search', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/v1/companies?search=*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });
    
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type to trigger search
    await companySelector.fill('Loading Test');
    
    // Should show loading state
    await page.waitForSelector('text=Searching...');
    
    // Wait for loading to complete
    await page.waitForSelector('text=Add "Loading Test" as new company');
  });

  test('should handle empty search results', async ({ page }) => {
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type a search term that returns no results
    await companySelector.fill('No Results Company');
    
    // Should show "Add Company" option
    await page.waitForSelector('text=Add "No Results Company" as new company');
    
    // Should not show any existing companies
    expect(await page.locator('[data-testid="company-option"]')).toHaveCount(0);
  });

  test('should handle special characters in company names', async ({ page }) => {
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type company name with special characters
    await companySelector.fill('Special & Associates, LLC');
    
    // Should show "Add Company" option
    await page.waitForSelector('text=Add "Special & Associates, LLC" as new company');
    
    // Click "Add Company" option
    await page.click('text=Add "Special & Associates, LLC" as new company');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Special & Associates, LLC');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Company should be selected
    expect(await companySelector.inputValue()).toBe('Special & Associates, LLC');
  });

  test('should handle rapid typing and searching', async ({ page }) => {
    await openAddPersonModal(page);
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type rapidly
    await companySelector.type('Rapid', { delay: 50 });
    await companySelector.type(' Test', { delay: 50 });
    await companySelector.type(' Company', { delay: 50 });
    
    // Should show "Add Company" option
    await page.waitForSelector('text=Add "Rapid Test Company" as new company');
    
    // Click "Add Company" option
    await page.click('text=Add "Rapid Test Company" as new company');
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', 'Rapid Test Company');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Company should be selected
    expect(await companySelector.inputValue()).toBe('Rapid Test Company');
  });
});
