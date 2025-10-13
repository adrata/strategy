/**
 * End-to-End Pipeline CRUD Workflow Tests
 * 
 * Complete workflows for lead-to-opportunity conversion and company management
 */

import { test, expect, Page } from '@playwright/test';
import { createTestPerson, createTestCompany, createTestAction, TEST_USER, waitForAsync } from '../../utils/test-factories';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/sign-in`);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', 'test-password'); // This would be a test password
  await page.click('button[type="submit"]');
  await page.waitForURL('**/speedrun');
}

// Helper function to create test data via API
async function createTestData(page: Page) {
  const testCompany = createTestCompany();
  const testPerson = createTestPerson('LEAD');
  const testAction = createTestAction('CALL');

  // Create company
  const companyResponse = await page.request.post(`${BASE_URL}/api/v1/companies`, {
    data: testCompany,
    headers: { 'Content-Type': 'application/json' },
  });
  expect(companyResponse.ok()).toBeTruthy();
  const companyData = await companyResponse.json();
  const companyId = companyData.data.id;

  // Create person linked to company
  const personResponse = await page.request.post(`${BASE_URL}/api/v1/people`, {
    data: { ...testPerson, companyId },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(personResponse.ok()).toBeTruthy();
  const personData = await personResponse.json();
  const personId = personData.data.id;

  return { companyId, personId, testCompany, testPerson, testAction };
}

// Helper function to cleanup test data
async function cleanupTestData(page: Page, companyId: string, personId: string) {
  // Soft delete person
  await page.request.delete(`${BASE_URL}/api/v1/people/${personId}`);
  
  // Hard delete company (since it has no related data)
  await page.request.delete(`${BASE_URL}/api/v1/companies/${companyId}?mode=hard`);
}

test.describe('Lead-to-Opportunity Workflow', () => {
  test('Complete lead-to-opportunity conversion workflow', async ({ page }) => {
    await login(page);
    
    // Create test data
    const { companyId, personId, testPerson } = await createTestData(page);
    
    try {
      // Step 1: Navigate to pipeline and find the lead
      await page.goto(`${BASE_URL}/speedrun`);
      await page.waitForSelector('[data-testid="pipeline-table"]');
      
      // Find and click on the test person
      await page.click(`[data-testid="person-${personId}"]`);
      await page.waitForSelector('[data-testid="person-details"]');
      
      // Verify lead status
      await expect(page.locator('[data-testid="person-status"]')).toContainText('LEAD');
      
      // Step 2: Add initial action (call)
      await page.click('[data-testid="add-action-button"]');
      await page.waitForSelector('[data-testid="action-form"]');
      
      await page.selectOption('[data-testid="action-type"]', 'CALL');
      await page.fill('[data-testid="action-subject"]', 'Initial discovery call');
      await page.fill('[data-testid="action-description"]', 'Discuss needs and requirements');
      await page.selectOption('[data-testid="action-priority"]', 'HIGH');
      
      await page.click('[data-testid="submit-action"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify action was created
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Action created successfully');
      
      // Step 3: Update person to prospect status
      await page.click('[data-testid="edit-person-button"]');
      await page.waitForSelector('[data-testid="person-edit-form"]');
      
      await page.selectOption('[data-testid="person-status"]', 'PROSPECT');
      await page.fill('[data-testid="person-notes"]', 'Qualified lead, interested in our solution');
      
      await page.click('[data-testid="save-person"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify status update
      await expect(page.locator('[data-testid="person-status"]')).toContainText('PROSPECT');
      
      // Step 4: Add opportunity fields to company
      await page.click('[data-testid="company-tab"]');
      await page.waitForSelector('[data-testid="company-details"]');
      
      await page.click('[data-testid="edit-company-button"]');
      await page.waitForSelector('[data-testid="company-edit-form"]');
      
      await page.selectOption('[data-testid="company-status"]', 'OPPORTUNITY');
      await page.selectOption('[data-testid="opportunity-stage"]', 'Proposal');
      await page.fill('[data-testid="opportunity-amount"]', '50000');
      await page.fill('[data-testid="opportunity-probability"]', '75');
      await page.fill('[data-testid="expected-close-date"]', '2024-12-31');
      
      await page.click('[data-testid="save-company"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify opportunity fields
      await expect(page.locator('[data-testid="opportunity-stage"]')).toContainText('Proposal');
      await expect(page.locator('[data-testid="opportunity-amount"]')).toContainText('50000');
      
      // Step 5: Update person to opportunity status
      await page.click('[data-testid="person-tab"]');
      await page.waitForSelector('[data-testid="person-details"]');
      
      await page.click('[data-testid="edit-person-button"]');
      await page.waitForSelector('[data-testid="person-edit-form"]');
      
      await page.selectOption('[data-testid="person-status"]', 'OPPORTUNITY');
      
      await page.click('[data-testid="save-person"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify final status
      await expect(page.locator('[data-testid="person-status"]')).toContainText('OPPORTUNITY');
      
      // Step 6: Complete the action
      await page.click('[data-testid="timeline-tab"]');
      await page.waitForSelector('[data-testid="actions-timeline"]');
      
      await page.click('[data-testid="action-edit-button"]');
      await page.waitForSelector('[data-testid="action-edit-form"]');
      
      await page.selectOption('[data-testid="action-status"]', 'COMPLETED');
      await page.fill('[data-testid="action-outcome"]', 'Great call, client is very interested');
      
      await page.click('[data-testid="save-action"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify action completion
      await expect(page.locator('[data-testid="action-status"]')).toContainText('COMPLETED');
      
      // Step 7: Soft delete the person
      await page.click('[data-testid="person-tab"]');
      await page.waitForSelector('[data-testid="person-details"]');
      
      await page.click('[data-testid="delete-person-button"]');
      await page.waitForSelector('[data-testid="delete-confirmation"]');
      
      await page.click('[data-testid="confirm-delete"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify person is deleted (should not be visible in pipeline)
      await page.goto(`${BASE_URL}/speedrun`);
      await page.waitForSelector('[data-testid="pipeline-table"]');
      
      await expect(page.locator(`[data-testid="person-${personId}"]`)).not.toBeVisible();
      
    } finally {
      // Cleanup
      await cleanupTestData(page, companyId, personId);
    }
  }, TEST_TIMEOUT);
});

test.describe('Company Management Workflow', () => {
  test('Complete company management workflow', async ({ page }) => {
    await login(page);
    
    // Create test data
    const { companyId, personId, testCompany } = await createTestData(page);
    
    try {
      // Step 1: Navigate to companies view
      await page.goto(`${BASE_URL}/companies`);
      await page.waitForSelector('[data-testid="companies-table"]');
      
      // Find and click on the test company
      await page.click(`[data-testid="company-${companyId}"]`);
      await page.waitForSelector('[data-testid="company-details"]');
      
      // Verify company details
      await expect(page.locator('[data-testid="company-name"]')).toContainText(testCompany.name);
      
      // Step 2: Add person to company
      await page.click('[data-testid="add-person-button"]');
      await page.waitForSelector('[data-testid="person-form"]');
      
      const newPerson = createTestPerson('LEAD');
      await page.fill('[data-testid="person-first-name"]', newPerson.firstName);
      await page.fill('[data-testid="person-last-name"]', newPerson.lastName);
      await page.fill('[data-testid="person-email"]', newPerson.email);
      await page.fill('[data-testid="person-job-title"]', newPerson.jobTitle);
      await page.selectOption('[data-testid="person-status"]', 'LEAD');
      
      await page.click('[data-testid="submit-person"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify person was added
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Person created successfully');
      
      // Step 3: Add action to company
      await page.click('[data-testid="add-action-button"]');
      await page.waitForSelector('[data-testid="action-form"]');
      
      await page.selectOption('[data-testid="action-type"]', 'MEETING');
      await page.fill('[data-testid="action-subject"]', 'Company overview meeting');
      await page.fill('[data-testid="action-description"]', 'Present our solution to the team');
      await page.selectOption('[data-testid="action-priority"]', 'HIGH');
      
      await page.click('[data-testid="submit-action"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify action was created
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Action created successfully');
      
      // Step 4: Update opportunity fields
      await page.click('[data-testid="edit-company-button"]');
      await page.waitForSelector('[data-testid="company-edit-form"]');
      
      await page.selectOption('[data-testid="company-status"]', 'OPPORTUNITY');
      await page.selectOption('[data-testid="opportunity-stage"]', 'Negotiation');
      await page.fill('[data-testid="opportunity-amount"]', '75000');
      await page.fill('[data-testid="opportunity-probability"]', '85');
      await page.fill('[data-testid="expected-close-date"]', '2024-11-30');
      
      await page.click('[data-testid="save-company"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify opportunity fields
      await expect(page.locator('[data-testid="opportunity-stage"]')).toContainText('Negotiation');
      await expect(page.locator('[data-testid="opportunity-amount"]')).toContainText('75000');
      
      // Step 5: Soft delete person
      await page.click('[data-testid="people-tab"]');
      await page.waitForSelector('[data-testid="people-list"]');
      
      await page.click('[data-testid="delete-person-button"]');
      await page.waitForSelector('[data-testid="delete-confirmation"]');
      
      await page.click('[data-testid="confirm-delete"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify person is deleted
      await expect(page.locator('[data-testid="people-list"]')).not.toContainText(newPerson.fullName);
      
      // Step 6: Hard delete company
      await page.click('[data-testid="company-tab"]');
      await page.waitForSelector('[data-testid="company-details"]');
      
      await page.click('[data-testid="delete-company-button"]');
      await page.waitForSelector('[data-testid="delete-confirmation"]');
      
      // Select hard delete mode
      await page.check('[data-testid="hard-delete-checkbox"]');
      await page.click('[data-testid="confirm-delete"]');
      await page.waitForSelector('[data-testid="success-message"]');
      
      // Verify company is deleted
      await page.goto(`${BASE_URL}/companies`);
      await page.waitForSelector('[data-testid="companies-table"]');
      
      await expect(page.locator(`[data-testid="company-${companyId}"]`)).not.toBeVisible();
      
    } finally {
      // Cleanup (company should already be deleted)
      // Just clean up person if it still exists
      try {
        await page.request.delete(`${BASE_URL}/api/v1/people/${personId}`);
      } catch (error) {
        // Person might already be deleted, ignore error
      }
    }
  }, TEST_TIMEOUT);
});

test.describe('Error Handling Workflows', () => {
  test('Handle API errors gracefully', async ({ page }) => {
    await login(page);
    
    // Mock API errors
    await page.route('**/api/v1/people', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' }),
      });
    });
    
    // Navigate to pipeline
    await page.goto(`${BASE_URL}/speedrun`);
    await page.waitForSelector('[data-testid="pipeline-table"]');
    
    // Try to add a person
    await page.click('[data-testid="add-person-button"]');
    await page.waitForSelector('[data-testid="person-form"]');
    
    const testPerson = createTestPerson('LEAD');
    await page.fill('[data-testid="person-first-name"]', testPerson.firstName);
    await page.fill('[data-testid="person-last-name"]', testPerson.lastName);
    await page.fill('[data-testid="person-email"]', testPerson.email);
    
    await page.click('[data-testid="submit-person"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Internal server error');
  }, TEST_TIMEOUT);
  
  test('Handle network errors gracefully', async ({ page }) => {
    await login(page);
    
    // Mock network failure
    await page.route('**/api/v1/companies', route => {
      route.abort('failed');
    });
    
    // Navigate to companies
    await page.goto(`${BASE_URL}/companies`);
    
    // Should show error state
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
  }, TEST_TIMEOUT);
});

test.describe('Data Validation Workflows', () => {
  test('Validate required fields', async ({ page }) => {
    await login(page);
    
    // Navigate to pipeline
    await page.goto(`${BASE_URL}/speedrun`);
    await page.waitForSelector('[data-testid="pipeline-table"]');
    
    // Try to add person without required fields
    await page.click('[data-testid="add-person-button"]');
    await page.waitForSelector('[data-testid="person-form"]');
    
    await page.click('[data-testid="submit-person"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('First name is required');
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Last name is required');
  }, TEST_TIMEOUT);
  
  test('Validate email format', async ({ page }) => {
    await login(page);
    
    // Navigate to pipeline
    await page.goto(`${BASE_URL}/speedrun`);
    await page.waitForSelector('[data-testid="pipeline-table"]');
    
    // Try to add person with invalid email
    await page.click('[data-testid="add-person-button"]');
    await page.waitForSelector('[data-testid="person-form"]');
    
    await page.fill('[data-testid="person-first-name"]', 'John');
    await page.fill('[data-testid="person-last-name"]', 'Doe');
    await page.fill('[data-testid="person-email"]', 'invalid-email');
    
    await page.click('[data-testid="submit-person"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Invalid email format');
  }, TEST_TIMEOUT);
});

test.describe('Performance Workflows', () => {
  test('Handle large datasets efficiently', async ({ page }) => {
    await login(page);
    
    // Create multiple test records
    const promises = [];
    for (let i = 0; i < 50; i++) {
      const testPerson = createTestPerson('LEAD', { 
        firstName: `Test${i}`, 
        lastName: `User${i}`,
        email: `test${i}@example.com`
      });
      
      promises.push(
        page.request.post(`${BASE_URL}/api/v1/people`, {
          data: testPerson,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const personIds = await Promise.all(
      responses.map(async (response) => {
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        return data.data.id;
      })
    );
    
    try {
      // Navigate to pipeline with large dataset
      await page.goto(`${BASE_URL}/speedrun`);
      await page.waitForSelector('[data-testid="pipeline-table"]');
      
      // Should load within reasonable time
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="pipeline-row"]', { timeout: 10000 });
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
      
      // Test pagination
      await page.click('[data-testid="next-page"]');
      await page.waitForSelector('[data-testid="pipeline-row"]');
      
      // Test search
      await page.fill('[data-testid="search-input"]', 'Test1');
      await page.waitForSelector('[data-testid="pipeline-row"]');
      
      // Should filter results
      const rows = await page.locator('[data-testid="pipeline-row"]').count();
      expect(rows).toBeLessThan(50);
      
    } finally {
      // Cleanup all test records
      const deletePromises = personIds.map(id =>
        page.request.delete(`${BASE_URL}/api/v1/people/${id}`)
      );
      await Promise.all(deletePromises);
    }
  }, TEST_TIMEOUT);
});
