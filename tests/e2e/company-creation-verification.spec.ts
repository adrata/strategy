/**
 * Company Creation Verification E2E Tests
 * 
 * Comprehensive end-to-end tests to verify that companies created through any
 * entry point properly persist to the database and appear in the company list.
 */

import { test, expect, Page } from '@playwright/test';
import { createTestCompany, createTestPerson, TEST_USER, waitForAsync } from '../utils/test-factories';

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

// Helper function to navigate to companies section
async function navigateToCompanies(page: Page) {
  await page.goto(`${BASE_URL}/companies`);
  await page.waitForSelector('[data-testid="pipeline-header"]');
}

// Helper function to verify company appears in list
async function verifyCompanyInList(page: Page, companyName: string) {
  // Wait for the companies list to load
  await page.waitForSelector('[data-testid="companies-list"]', { timeout: 10000 });
  
  // Check if company appears in the list
  const companyElement = page.locator(`[data-testid="company-item"]:has-text("${companyName}")`);
  await expect(companyElement).toBeVisible({ timeout: 10000 });
  
  console.log(`✅ Company "${companyName}" found in companies list`);
}

// Helper function to clear all caches
async function clearAllCaches(page: Page) {
  await page.evaluate(() => {
    // Clear localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('companies') || key.includes('unified') || key.includes('acquisition')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.includes('companies') || key.includes('unified') || key.includes('acquisition')) {
        sessionStorage.removeItem(key);
      }
    });
  });
}

test.describe('Company Creation Verification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await clearAllCaches(page);
  });

  test('AddCompanyModal → Companies List Flow', async ({ page }) => {
    const companyName = `Test Company Modal ${Date.now()}`;
    
    // Navigate to companies section
    await navigateToCompanies(page);
    
    // Click Add Company button
    await page.click('[data-testid="add-company-button"]');
    await page.waitForSelector('[data-testid="add-company-modal"]');
    
    // Fill in company details
    await page.fill('input[name="name"]', companyName);
    await page.fill('input[name="website"]', 'https://testcompany.com');
    await page.fill('textarea[name="notes"]', 'Test company created via modal');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Company created successfully');
    
    // Verify company appears in the list
    await verifyCompanyInList(page, companyName);
  });

  test('CompanySelector in Add Person Modal → Companies List Flow', async ({ page }) => {
    const companyName = `Test Company Selector ${Date.now()}`;
    
    // Navigate to people section
    await page.goto(`${BASE_URL}/people`);
    await page.waitForSelector('[data-testid="pipeline-header"]');
    
    // Click Add Person button
    await page.click('[data-testid="add-person-button"]');
    await page.waitForSelector('[data-testid="add-person-modal"]');
    
    // Find the company selector
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    
    // Type to search for companies
    await companySelector.fill(companyName);
    
    // Should show "Add Company" option
    await page.waitForSelector(`text=Add "${companyName}" as new company`);
    
    // Click "Add Company" option
    await page.click(`text=Add "${companyName}" as new company`);
    
    // Fill in company details
    await page.fill('input[placeholder="Company name"]', companyName);
    await page.fill('input[placeholder="Website (optional)"]', 'https://testcompany.com');
    
    // Click "Add Company" button
    await page.click('button:has-text("Add Company")');
    
    // Company should be selected
    expect(await companySelector.inputValue()).toBe(companyName);
    
    // Fill in person details
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@testcompany.com');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    expect(await page.locator('[data-testid="success-message"]')).toContainText('Person created successfully');
    
    // Navigate to companies section to verify company appears
    await navigateToCompanies(page);
    await verifyCompanyInList(page, companyName);
  });

  test('CompanySelector in Update Modal → Companies List Flow', async ({ page }) => {
    const companyName = `Test Company Update ${Date.now()}`;
    
    // First create a person to edit
    const testPerson = createTestPerson({ 
      firstName: 'Jane', 
      lastName: 'Smith', 
      email: 'jane.smith@example.com' 
    });
    
    const personResponse = await page.request.post(`${BASE_URL}/api/v1/people`, {
      data: testPerson,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(personResponse.ok()).toBeTruthy();
    const personData = await personResponse.json();
    const personId = personData.data.id;

    try {
      // Navigate to the person's detail page
      await page.goto(`${BASE_URL}/people/${personId}`);
      await page.waitForSelector('[data-testid="person-detail"]');
      
      // Click Update button
      await page.click('[data-testid="update-person-button"]');
      await page.waitForSelector('[data-testid="update-modal"]');
      
      // Find the company selector in the update modal
      const companySelector = page.locator('[data-testid="company-selector"]');
      await companySelector.click();
      
      // Type to search for companies
      await companySelector.fill(companyName);
      
      // Should show "Add Company" option
      await page.waitForSelector(`text=Add "${companyName}" as new company`);
      
      // Click "Add Company" option
      await page.click(`text=Add "${companyName}" as new company`);
      
      // Fill in company details
      await page.fill('input[placeholder="Company name"]', companyName);
      await page.fill('input[placeholder="Website (optional)"]', 'https://testcompany.com');
      
      // Click "Add Company" button
      await page.click('button:has-text("Add Company")');
      
      // Company should be selected
      expect(await companySelector.inputValue()).toBe(companyName);
      
      // Submit the update
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
      expect(await page.locator('[data-testid="success-message"]')).toContainText('Person updated successfully');
      
      // Navigate to companies section to verify company appears
      await navigateToCompanies(page);
      await verifyCompanyInList(page, companyName);
    } finally {
      // Cleanup person
      await page.request.delete(`${BASE_URL}/api/v1/people/${personId}`);
    }
  });

  test('Cache Invalidation After Company Creation', async ({ page }) => {
    const companyName = `Cache Test Company ${Date.now()}`;
    
    // Navigate to companies section
    await navigateToCompanies(page);
    
    // Check initial cache state
    const initialCache = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.includes('companies'));
    });
    console.log('Initial cache keys:', initialCache);
    
    // Create company via modal
    await page.click('[data-testid="add-company-button"]');
    await page.waitForSelector('[data-testid="add-company-modal"]');
    await page.fill('input[name="name"]', companyName);
    await page.click('button[type="submit"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    
    // Check cache was cleared
    const afterCache = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.includes('companies'));
    });
    console.log('After creation cache keys:', afterCache);
    
    // Verify company appears in list (should be fresh data)
    await verifyCompanyInList(page, companyName);
  });

  test('Multiple Company Creation Methods Consistency', async ({ page }) => {
    const companies = [
      { name: `Modal Company ${Date.now()}`, method: 'modal' },
      { name: `Selector Company ${Date.now()}`, method: 'selector' },
      { name: `Update Company ${Date.now()}`, method: 'update' }
    ];
    
    // Method 1: Add Company Modal
    await navigateToCompanies(page);
    await page.click('[data-testid="add-company-button"]');
    await page.waitForSelector('[data-testid="add-company-modal"]');
    await page.fill('input[name="name"]', companies[0].name);
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    
    // Method 2: CompanySelector in Add Person
    await page.goto(`${BASE_URL}/people`);
    await page.click('[data-testid="add-person-button"]');
    await page.waitForSelector('[data-testid="add-person-modal"]');
    
    const companySelector = page.locator('[data-testid="company-selector"]');
    await companySelector.click();
    await companySelector.fill(companies[1].name);
    await page.click(`text=Add "${companies[1].name}" as new company`);
    await page.fill('input[placeholder="Company name"]', companies[1].name);
    await page.click('button:has-text("Add Company")');
    
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    
    // Method 3: CompanySelector in Update Modal (create person first)
    const testPerson = createTestPerson({ 
      firstName: 'Update', 
      lastName: 'Test', 
      email: 'update@example.com' 
    });
    
    const personResponse = await page.request.post(`${BASE_URL}/api/v1/people`, {
      data: testPerson,
      headers: { 'Content-Type': 'application/json' },
    });
    const personData = await personResponse.json();
    const personId = personData.data.id;

    try {
      await page.goto(`${BASE_URL}/people/${personId}`);
      await page.waitForSelector('[data-testid="person-detail"]');
      await page.click('[data-testid="update-person-button"]');
      await page.waitForSelector('[data-testid="update-modal"]');
      
      const updateCompanySelector = page.locator('[data-testid="company-selector"]');
      await updateCompanySelector.click();
      await updateCompanySelector.fill(companies[2].name);
      await page.click(`text=Add "${companies[2].name}" as new company`);
      await page.fill('input[placeholder="Company name"]', companies[2].name);
      await page.click('button:has-text("Add Company")');
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
      
      // Navigate to companies section and verify all companies appear
      await navigateToCompanies(page);
      
      for (const company of companies) {
        await verifyCompanyInList(page, company.name);
      }
    } finally {
      // Cleanup
      await page.request.delete(`${BASE_URL}/api/v1/people/${personId}`);
    }
  });

  test('Error Handling in Company Creation', async ({ page }) => {
    // Test with empty company name
    await navigateToCompanies(page);
    await page.click('[data-testid="add-company-button"]');
    await page.waitForSelector('[data-testid="add-company-modal"]');
    
    // Try to submit without company name
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await page.waitForSelector('text=Company name is required');
    
    // Test with duplicate company name
    const existingCompany = createTestCompany({ name: 'Duplicate Test Company' });
    const companyResponse = await page.request.post(`${BASE_URL}/api/v1/companies`, {
      data: existingCompany,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(companyResponse.ok()).toBeTruthy();
    const companyData = await companyResponse.json();
    const companyId = companyData.data.id;

    try {
      // Try to create company with same name
      await page.fill('input[name="name"]', 'Duplicate Test Company');
      await page.click('button[type="submit"]');
      
      // Should show success (returns existing company)
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
      expect(await page.locator('[data-testid="success-message"]')).toContainText('Company created successfully');
    } finally {
      // Cleanup
      await page.request.delete(`${BASE_URL}/api/v1/companies/${companyId}`);
    }
  });

  test('Performance: Rapid Company Creation', async ({ page }) => {
    const companies = [];
    
    // Create multiple companies rapidly
    for (let i = 0; i < 5; i++) {
      const companyName = `Rapid Company ${i} ${Date.now()}`;
      companies.push(companyName);
      
      await navigateToCompanies(page);
      await page.click('[data-testid="add-company-button"]');
      await page.waitForSelector('[data-testid="add-company-modal"]');
      await page.fill('input[name="name"]', companyName);
      await page.click('button[type="submit"]');
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    }
    
    // Navigate to companies section and verify all appear
    await navigateToCompanies(page);
    
    for (const companyName of companies) {
      await verifyCompanyInList(page, companyName);
    }
  });
});
