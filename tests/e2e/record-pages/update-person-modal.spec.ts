/**
 * Update Person Modal End-to-End Tests
 * 
 * Complete user workflows for updating person records via modal
 * Tests real browser interactions and database persistence
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Test data
const testPerson = {
  firstName: 'E2E',
  lastName: 'TestUser',
  fullName: 'E2E TestUser',
  email: 'e2e.testuser@example.com',
  phone: '+1-555-000-0002',
  jobTitle: 'Test Engineer',
  department: 'QA',
  company: 'E2E Test Company',
  status: 'ACTIVE',
  priority: 'HIGH'
};

const updatedPerson = {
  firstName: 'Updated',
  lastName: 'TestUser',
  fullName: 'Updated TestUser',
  email: 'updated.testuser@example.com',
  phone: '+1-555-000-0003',
  jobTitle: 'Senior Test Engineer',
  department: 'Quality Assurance',
  company: 'Updated Test Company',
  status: 'PROSPECT',
  priority: 'MEDIUM'
};

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/sign-in`);
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'test-password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/speedrun');
}

// Helper function to create test person via API
async function createTestPerson(page: Page) {
  const response = await page.request.post(`${BASE_URL}/api/v1/people`, {
    data: testPerson,
    headers: { 'Content-Type': 'application/json' },
  });
  
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.data.id;
}

// Helper function to cleanup test person
async function cleanupTestPerson(page: Page, personId: string) {
  await page.request.delete(`${BASE_URL}/api/v1/people/${personId}`);
}

test.describe('Update Person Modal E2E Tests', () => {
  let testPersonId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    testPersonId = await createTestPerson(page);
  });

  test.afterEach(async ({ page }) => {
    if (testPersonId) {
      await cleanupTestPerson(page, testPersonId);
    }
  });

  test.describe('Update Person Button Functionality', () => {
    test('should open UpdateModal when Update Person button is clicked', async ({ page }) => {
      // Navigate to person record
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Wait for the record to load
      await expect(page.locator('[data-testid="record-name"]')).toContainText('E2E TestUser');
      
      // Click Update Person button
      const updateButton = page.locator('button:has-text("Update Person")');
      await expect(updateButton).toBeVisible();
      await updateButton.click();
      
      // Verify UpdateModal opens (not inline edit modal)
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="edit-record-form"]')).not.toBeVisible();
      
      // Verify modal shows correct person data
      await expect(page.locator('input[name="firstName"]')).toHaveValue('E2E');
      await expect(page.locator('input[name="lastName"]')).toHaveValue('TestUser');
      await expect(page.locator('input[name="email"]')).toHaveValue('e2e.testuser@example.com');
      await expect(page.locator('input[name="jobTitle"]')).toHaveValue('Test Engineer');
    });

    test('should update person via UpdateModal with button click', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Open UpdateModal
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      // Edit person fields
      await page.fill('input[name="firstName"]', updatedPerson.firstName);
      await page.fill('input[name="lastName"]', updatedPerson.lastName);
      await page.fill('input[name="email"]', updatedPerson.email);
      await page.fill('input[name="phone"]', updatedPerson.phone);
      await page.fill('input[name="jobTitle"]', updatedPerson.jobTitle);
      await page.fill('input[name="department"]', updatedPerson.department);
      
      // Select new status and priority
      await page.selectOption('select[name="status"]', updatedPerson.status);
      await page.selectOption('select[name="priority"]', updatedPerson.priority);
      
      // Click Update Person button in modal
      const updateButton = page.locator('[data-testid="update-modal"] button:has-text("Update Person")');
      await updateButton.click();
      
      // Wait for API call to complete
      await page.waitForResponse(response => 
        response.url().includes(`/api/v1/people/${testPersonId}`) && 
        response.request().method() === 'PATCH'
      );
      
      // Verify success message (if shown)
      const successMessage = page.locator('[data-testid="success-message"]');
      if (await successMessage.isVisible()) {
        await expect(successMessage).toContainText('updated successfully');
      }
      
      // Verify modal closes
      await expect(page.locator('[data-testid="update-modal"]')).not.toBeVisible();
      
      // Verify UI updates with new data
      await expect(page.locator('[data-testid="record-name"]')).toContainText('Updated TestUser');
    });

    test('should update person via UpdateModal with CMD+Enter', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Open UpdateModal
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      // Edit person fields
      await page.fill('input[name="firstName"]', updatedPerson.firstName);
      await page.fill('input[name="lastName"]', updatedPerson.lastName);
      await page.fill('input[name="email"]', updatedPerson.email);
      await page.fill('input[name="jobTitle"]', updatedPerson.jobTitle);
      
      // Press CMD+Enter (Mac) or CTRL+Enter (Windows)
      const isMac = await page.evaluate(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0);
      const modifierKey = isMac ? 'Meta' : 'Control';
      
      await page.keyboard.press(`${modifierKey}+Enter`);
      
      // Wait for API call to complete
      await page.waitForResponse(response => 
        response.url().includes(`/api/v1/people/${testPersonId}`) && 
        response.request().method() === 'PATCH'
      );
      
      // Verify modal closes
      await expect(page.locator('[data-testid="update-modal"]')).not.toBeVisible();
      
      // Verify UI updates with new data
      await expect(page.locator('[data-testid="record-name"]')).toContainText('Updated TestUser');
    });
  });

  test.describe('Database Persistence', () => {
    test('should persist changes to database after update', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Update person record
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      await page.fill('input[name="firstName"]', updatedPerson.firstName);
      await page.fill('input[name="lastName"]', updatedPerson.lastName);
      await page.fill('input[name="email"]', updatedPerson.email);
      await page.fill('input[name="jobTitle"]', updatedPerson.jobTitle);
      
      await page.click('[data-testid="update-modal"] button:has-text("Update Person")');
      
      // Wait for update to complete
      await page.waitForResponse(response => 
        response.url().includes(`/api/v1/people/${testPersonId}`) && 
        response.request().method() === 'PATCH'
      );
      
      // Refresh the page to verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify changes persisted
      await expect(page.locator('[data-testid="record-name"]')).toContainText('Updated TestUser');
      
      // Verify individual fields persisted
      const firstNameField = page.locator('[data-testid="field-firstName"]');
      if (await firstNameField.isVisible()) {
        await expect(firstNameField).toContainText('Updated');
      }
      
      const emailField = page.locator('[data-testid="field-email"]');
      if (await emailField.isVisible()) {
        await expect(emailField).toContainText('updated.testuser@example.com');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Open UpdateModal
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      // Mock API error by intercepting the request
      await page.route(`**/api/v1/people/${testPersonId}`, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Internal server error' })
        });
      });
      
      // Attempt to update with invalid data
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('[data-testid="update-modal"] button:has-text("Update Person")');
      
      // Verify error message is displayed
      const errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]');
      await expect(errorMessage).toBeVisible();
      
      // Verify modal stays open for retry
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
    });

    test('should allow retry after error', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Open UpdateModal
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      // First attempt - mock error
      await page.route(`**/api/v1/people/${testPersonId}`, route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Internal server error' })
        });
      });
      
      await page.fill('input[name="firstName"]', 'ErrorTest');
      await page.click('[data-testid="update-modal"] button:has-text("Update Person")');
      
      // Verify error shown
      const errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]');
      await expect(errorMessage).toBeVisible();
      
      // Remove route interception for retry
      await page.unroute(`**/api/v1/people/${testPersonId}`);
      
      // Second attempt - should succeed
      await page.fill('input[name="firstName"]', 'RetryTest');
      await page.click('[data-testid="update-modal"] button:has-text("Update Person")');
      
      // Wait for successful update
      await page.waitForResponse(response => 
        response.url().includes(`/api/v1/people/${testPersonId}`) && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );
      
      // Verify modal closes after successful retry
      await expect(page.locator('[data-testid="update-modal"]')).not.toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should handle CMD+Enter in UpdateModal correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Open UpdateModal
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      // Edit a field
      await page.fill('input[name="firstName"]', 'KeyboardTest');
      
      // Press CMD+Enter
      const isMac = await page.evaluate(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0);
      const modifierKey = isMac ? 'Meta' : 'Control';
      
      await page.keyboard.press(`${modifierKey}+Enter`);
      
      // Verify API call is made
      await page.waitForResponse(response => 
        response.url().includes(`/api/v1/people/${testPersonId}`) && 
        response.request().method() === 'PATCH'
      );
      
      // Verify modal closes
      await expect(page.locator('[data-testid="update-modal"]')).not.toBeVisible();
    });

    test('should not trigger CMD+Enter when in input field', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Open UpdateModal
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      // Focus on an input field
      const firstNameInput = page.locator('input[name="firstName"]');
      await firstNameInput.focus();
      await firstNameInput.fill('InputTest');
      
      // Press CMD+Enter while focused on input
      const isMac = await page.evaluate(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0);
      const modifierKey = isMac ? 'Meta' : 'Control';
      
      await page.keyboard.press(`${modifierKey}+Enter`);
      
      // Verify modal is still open (should not submit when in input field)
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
    });
  });

  test.describe('Modal Navigation', () => {
    test('should close modal when clicking outside', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Open UpdateModal
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      // Click outside the modal (on backdrop)
      await page.click('[data-testid="update-modal"]', { position: { x: -10, y: -10 } });
      
      // Verify modal closes
      await expect(page.locator('[data-testid="update-modal"]')).not.toBeVisible();
    });

    test('should close modal when pressing Escape', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Open UpdateModal
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      // Press Escape key
      await page.keyboard.press('Escape');
      
      // Verify modal closes
      await expect(page.locator('[data-testid="update-modal"]')).not.toBeVisible();
    });

    test('should close modal when clicking Cancel button', async ({ page }) => {
      await page.goto(`${BASE_URL}/people/${testPersonId}`);
      await page.waitForLoadState('networkidle');
      
      // Open UpdateModal
      await page.click('button:has-text("Update Person")');
      await expect(page.locator('[data-testid="update-modal"]')).toBeVisible();
      
      // Click Cancel button
      const cancelButton = page.locator('[data-testid="update-modal"] button:has-text("Cancel")');
      await cancelButton.click();
      
      // Verify modal closes
      await expect(page.locator('[data-testid="update-modal"]')).not.toBeVisible();
    });
  });
});
