/**
 * E2E Tests: Keyboard Shortcuts in Modals
 * 
 * Tests the complete user workflow with keyboard shortcuts in UpdateModal and Speedrun modals
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts in Modals E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the workspace
    await page.goto('/test-workspace');
    
    // Wait for authentication
    await page.waitForSelector('[data-testid="workspace-loaded"]', { timeout: 10000 });
  });

  test.describe('UpdateModal Keyboard Shortcuts', () => {
    test('should submit form with Ctrl+Enter on Windows', async ({ page }) => {
      // Navigate to people section
      await page.goto('/test-workspace/pipeline/people');
      await page.waitForSelector('[data-testid="people-table"]', { timeout: 10000 });
      
      // Click on first person to open UpdateModal
      const firstPerson = page.locator('[data-testid="person-row-0"]');
      await firstPerson.click();
      
      // Wait for UpdateModal to open
      await page.waitForSelector('[data-testid="update-modal"]', { timeout: 10000 });
      
      // Modify a field
      const nameField = page.locator('[data-testid="field-name"] input');
      await nameField.clear();
      await nameField.fill('Updated Name');
      
      // Press Ctrl+Enter to submit
      await page.keyboard.press('Control+Enter');
      
      // Wait for success message or modal to close
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
      
      // Verify success
      expect(await page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should submit form with CMD+Enter on Mac', async ({ page }) => {
      // Navigate to people section
      await page.goto('/test-workspace/pipeline/people');
      await page.waitForSelector('[data-testid="people-table"]', { timeout: 10000 });
      
      // Click on first person to open UpdateModal
      const firstPerson = page.locator('[data-testid="person-row-0"]');
      await firstPerson.click();
      
      // Wait for UpdateModal to open
      await page.waitForSelector('[data-testid="update-modal"]', { timeout: 10000 });
      
      // Modify a field
      const nameField = page.locator('[data-testid="field-name"] input');
      await nameField.clear();
      await nameField.fill('Updated Name Mac');
      
      // Press CMD+Enter to submit (simulate Mac)
      await page.keyboard.press('Meta+Enter');
      
      // Wait for success message or modal to close
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
      
      // Verify success
      expect(await page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should work for people records', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people');
      await page.waitForSelector('[data-testid="people-table"]', { timeout: 10000 });
      
      const firstPerson = page.locator('[data-testid="person-row-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="update-modal"]', { timeout: 10000 });
      
      // Verify it's a people record modal
      expect(await page.locator('[data-testid="update-modal"]')).toContainText('Update Person');
      
      // Test keyboard shortcut
      const emailField = page.locator('[data-testid="field-email"] input');
      await emailField.clear();
      await emailField.fill('test@example.com');
      
      await page.keyboard.press('Control+Enter');
      
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
      expect(await page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should work for company records', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/companies');
      await page.waitForSelector('[data-testid="companies-table"]', { timeout: 10000 });
      
      const firstCompany = page.locator('[data-testid="company-row-0"]');
      await firstCompany.click();
      
      await page.waitForSelector('[data-testid="update-modal"]', { timeout: 10000 });
      
      // Verify it's a company record modal
      expect(await page.locator('[data-testid="update-modal"]')).toContainText('Update Company');
      
      // Test keyboard shortcut
      const nameField = page.locator('[data-testid="field-name"] input');
      await nameField.clear();
      await nameField.fill('Updated Company Name');
      
      await page.keyboard.press('Control+Enter');
      
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
      expect(await page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should prevent submission when loading', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people');
      await page.waitForSelector('[data-testid="people-table"]', { timeout: 10000 });
      
      const firstPerson = page.locator('[data-testid="person-row-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="update-modal"]', { timeout: 10000 });
      
      // Mock slow API response
      await page.route('/api/v1/people/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });
      
      const nameField = page.locator('[data-testid="field-name"] input');
      await nameField.clear();
      await nameField.fill('Loading Test');
      
      // Press Ctrl+Enter
      await page.keyboard.press('Control+Enter');
      
      // Verify loading state
      await page.waitForSelector('[data-testid="loading-state"]', { timeout: 1000 });
      expect(await page.locator('[data-testid="loading-state"]')).toBeVisible();
      
      // Try to press Ctrl+Enter again - should be ignored
      await page.keyboard.press('Control+Enter');
      
      // Should still be in loading state
      expect(await page.locator('[data-testid="loading-state"]')).toBeVisible();
    });

    test('should show success message after submission', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people');
      await page.waitForSelector('[data-testid="people-table"]', { timeout: 10000 });
      
      const firstPerson = page.locator('[data-testid="person-row-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="update-modal"]', { timeout: 10000 });
      
      const nameField = page.locator('[data-testid="field-name"] input');
      await nameField.clear();
      await nameField.fill('Success Test');
      
      await page.keyboard.press('Control+Enter');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
      
      // Verify success message content
      const successMessage = page.locator('[data-testid="success-message"]');
      expect(await successMessage).toBeVisible();
      expect(await successMessage).toContainText('Record updated successfully');
    });
  });

  test.describe('Speedrun Keyboard Shortcuts', () => {
    test('should open CompleteActionModal with CMD+Enter', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Click on first person in sprint
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Press CMD+Enter to open CompleteActionModal
      await page.keyboard.press('Meta+Enter');
      
      // Wait for CompleteActionModal to open
      await page.waitForSelector('[data-testid="complete-action-modal"]', { timeout: 5000 });
      
      // Verify modal is open
      expect(await page.locator('[data-testid="complete-action-modal"]')).toBeVisible();
      expect(await page.locator('[data-testid="complete-action-modal"]')).toContainText('Add Action');
    });

    test('should submit action with CMD+Enter in modal', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Open CompleteActionModal
      await page.keyboard.press('Meta+Enter');
      await page.waitForSelector('[data-testid="complete-action-modal"]', { timeout: 5000 });
      
      // Fill in action details
      const notesField = page.locator('[data-testid="action-notes"] textarea');
      await notesField.fill('Test action notes');
      
      // Press CMD+Enter to submit
      await page.keyboard.press('Meta+Enter');
      
      // Wait for success
      await page.waitForSelector('[data-testid="action-success"]', { timeout: 5000 });
      
      // Verify success
      expect(await page.locator('[data-testid="action-success"]')).toBeVisible();
    });

    test('should display proper error when API fails', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Mock API error
      await page.route('/api/v1/actions', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        });
      });
      
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Open CompleteActionModal
      await page.keyboard.press('Meta+Enter');
      await page.waitForSelector('[data-testid="complete-action-modal"]', { timeout: 5000 });
      
      // Fill in action details
      const notesField = page.locator('[data-testid="action-notes"] textarea');
      await notesField.fill('Test action notes');
      
      // Press CMD+Enter to submit
      await page.keyboard.press('Meta+Enter');
      
      // Wait for error message
      await page.waitForSelector('[data-testid="action-error"]', { timeout: 5000 });
      
      // Verify error message
      const errorMessage = page.locator('[data-testid="action-error"]');
      expect(await errorMessage).toBeVisible();
      expect(await errorMessage).toContainText('Failed to save action log');
    });

    test('should handle non-JSON error responses', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Mock non-JSON error response
      await page.route('/api/v1/actions', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'text/plain',
          body: 'Internal server error'
        });
      });
      
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Open CompleteActionModal
      await page.keyboard.press('Meta+Enter');
      await page.waitForSelector('[data-testid="complete-action-modal"]', { timeout: 5000 });
      
      // Fill in action details
      const notesField = page.locator('[data-testid="action-notes"] textarea');
      await notesField.fill('Test action notes');
      
      // Press CMD+Enter to submit
      await page.keyboard.press('Meta+Enter');
      
      // Wait for error message
      await page.waitForSelector('[data-testid="action-error"]', { timeout: 5000 });
      
      // Verify fallback error message
      const errorMessage = page.locator('[data-testid="action-error"]');
      expect(await errorMessage).toBeVisible();
      expect(await errorMessage).toContainText('HTTP 500');
    });

    test('should work in Sprint View', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Verify we're in sprint view
      expect(await page.locator('[data-testid="sprint-page-container"]')).toBeVisible();
      
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Test CMD+Enter in sprint context
      await page.keyboard.press('Meta+Enter');
      
      await page.waitForSelector('[data-testid="complete-action-modal"]', { timeout: 5000 });
      expect(await page.locator('[data-testid="complete-action-modal"]')).toBeVisible();
    });
  });

  test.describe('Cross-Platform Compatibility', () => {
    test('should work with both Ctrl and CMD keys', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people');
      await page.waitForSelector('[data-testid="people-table"]', { timeout: 10000 });
      
      const firstPerson = page.locator('[data-testid="person-row-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="update-modal"]', { timeout: 10000 });
      
      const nameField = page.locator('[data-testid="field-name"] input');
      await nameField.clear();
      await nameField.fill('Cross Platform Test');
      
      // Test both Ctrl+Enter and CMD+Enter
      await page.keyboard.press('Control+Enter');
      
      // Wait a moment
      await page.waitForTimeout(1000);
      
      // If modal is still open, try CMD+Enter
      if (await page.locator('[data-testid="update-modal"]').isVisible()) {
        await page.keyboard.press('Meta+Enter');
      }
      
      // Verify success
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
      expect(await page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Error Scenarios', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people');
      await page.waitForSelector('[data-testid="people-table"]', { timeout: 10000 });
      
      // Mock network error
      await page.route('/api/v1/people/*', async route => {
        await route.abort('failed');
      });
      
      const firstPerson = page.locator('[data-testid="person-row-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="update-modal"]', { timeout: 10000 });
      
      const nameField = page.locator('[data-testid="field-name"] input');
      await nameField.clear();
      await nameField.fill('Network Error Test');
      
      await page.keyboard.press('Control+Enter');
      
      // Wait for error message
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });
      
      // Verify error handling
      const errorMessage = page.locator('[data-testid="error-message"]');
      expect(await errorMessage).toBeVisible();
      expect(await errorMessage).toContainText('Failed to update record');
    });

    test('should handle validation errors', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people');
      await page.waitForSelector('[data-testid="people-table"]', { timeout: 10000 });
      
      // Mock validation error
      await page.route('/api/v1/people/*', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Validation failed: Name is required'
          })
        });
      });
      
      const firstPerson = page.locator('[data-testid="person-row-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="update-modal"]', { timeout: 10000 });
      
      // Clear required field
      const nameField = page.locator('[data-testid="field-name"] input');
      await nameField.clear();
      
      await page.keyboard.press('Control+Enter');
      
      // Wait for validation error
      await page.waitForSelector('[data-testid="validation-error"]', { timeout: 5000 });
      
      // Verify validation error
      const errorMessage = page.locator('[data-testid="validation-error"]');
      expect(await errorMessage).toBeVisible();
      expect(await errorMessage).toContainText('Name is required');
    });
  });
});
