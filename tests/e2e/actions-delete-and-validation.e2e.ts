import { test, expect } from '@playwright/test';

test.describe('Actions Delete and Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/login');
    // Add your authentication setup here
  });

  test('should allow deleting actions with confirmation', async ({ page }) => {
    // Navigate to a company page with actions
    await page.goto('/companies/test-company-123?tab=actions');
    
    // Wait for actions to load
    await page.waitForSelector('[data-testid="actions-list"]');
    
    // Find the delete button for the first action
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await expect(deleteButton).toBeVisible();
    
    // Click delete button
    await deleteButton.click();
    
    // Verify confirmation modal appears
    await expect(page.locator('text=Delete Action')).toBeVisible();
    await expect(page.locator('text=This action cannot be undone.')).toBeVisible();
    await expect(page.locator('input[placeholder="Type \'delete\' here"]')).toBeVisible();
    
    // Verify delete button is disabled initially
    const confirmButton = page.locator('button:has-text("Delete Action")');
    await expect(confirmButton).toBeDisabled();
    
    // Type "delete" to enable button
    await page.fill('input[placeholder="Type \'delete\' here"]', 'delete');
    await expect(confirmButton).toBeEnabled();
    
    // Click confirm
    await confirmButton.click();
    
    // Verify success message
    await expect(page.locator('text=Action deleted successfully')).toBeVisible();
    
    // Verify modal is closed
    await expect(page.locator('text=Delete Action')).not.toBeVisible();
  });

  test('should not allow deletion without typing "delete"', async ({ page }) => {
    await page.goto('/companies/test-company-123?tab=actions');
    await page.waitForSelector('[data-testid="actions-list"]');
    
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    
    const confirmButton = page.locator('button:has-text("Delete Action")');
    const input = page.locator('input[placeholder="Type \'delete\' here"]');
    
    // Try different text
    await input.fill('cancel');
    await expect(confirmButton).toBeDisabled();
    
    await input.fill('DELETE'); // Wrong case
    await expect(confirmButton).toBeDisabled();
    
    await input.fill('delete'); // Correct
    await expect(confirmButton).toBeEnabled();
  });

  test('should allow canceling deletion', async ({ page }) => {
    await page.goto('/companies/test-company-123?tab=actions');
    await page.waitForSelector('[data-testid="actions-list"]');
    
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();
    
    // Verify modal is closed
    await expect(page.locator('text=Delete Action')).not.toBeVisible();
  });

  test('should allow inline editing of action description without company validation error', async ({ page }) => {
    // This test verifies the main fix - editing description shouldn't trigger company validation
    await page.goto('/companies/test-company-123?tab=actions');
    await page.waitForSelector('[data-testid="actions-list"]');
    
    // Find an action with a description field
    const descriptionField = page.locator('textarea, input[type="text"]').first();
    await expect(descriptionField).toBeVisible();
    
    // Click to edit
    await descriptionField.click();
    
    // Clear and type new description
    await descriptionField.clear();
    await descriptionField.fill('Updated action description');
    
    // Press Enter or click outside to save
    await descriptionField.press('Enter');
    
    // Verify no error message about company not found
    await expect(page.locator('text=Company not found')).not.toBeVisible();
    await expect(page.locator('text=Failed to save description')).not.toBeVisible();
    
    // Verify success message or that the change was saved
    await expect(page.locator('text=Updated action description')).toBeVisible();
  });

  test('should show error when trying to delete with network failure', async ({ page }) => {
    // Mock network failure for delete request
    await page.route('**/api/v1/actions/*', route => {
      if (route.request().method() === 'DELETE') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto('/companies/test-company-123?tab=actions');
    await page.waitForSelector('[data-testid="actions-list"]');
    
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    
    const input = page.locator('input[placeholder="Type \'delete\' here"]');
    const confirmButton = page.locator('button:has-text("Delete Action")');
    
    await input.fill('delete');
    await confirmButton.click();
    
    // Verify error message
    await expect(page.locator('text=Failed to delete action')).toBeVisible();
  });

  test('should handle multiple actions with different statuses', async ({ page }) => {
    await page.goto('/companies/test-company-123?tab=actions');
    await page.waitForSelector('[data-testid="actions-list"]');
    
    // Verify different action types are displayed
    await expect(page.locator('text=LinkedIn Connection')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Phone')).toBeVisible();
    
    // Verify status badges
    await expect(page.locator('text=COMPLETED')).toBeVisible();
    await expect(page.locator('text=PENDING')).toBeVisible();
    
    // Verify all actions have delete buttons
    const deleteButtons = page.locator('button:has-text("Delete")');
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should maintain action list after deletion', async ({ page }) => {
    await page.goto('/companies/test-company-123?tab=actions');
    await page.waitForSelector('[data-testid="actions-list"]');
    
    // Count initial actions
    const initialActions = await page.locator('[data-testid="action-item"]').count();
    
    // Delete first action
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    
    const input = page.locator('input[placeholder="Type \'delete\' here"]');
    const confirmButton = page.locator('button:has-text("Delete Action")');
    
    await input.fill('delete');
    await confirmButton.click();
    
    // Wait for deletion to complete
    await page.waitForSelector('text=Action deleted successfully');
    
    // Verify action count decreased
    const finalActions = await page.locator('[data-testid="action-item"]').count();
    expect(finalActions).toBe(initialActions - 1);
  });
});

test.describe('Actions API Validation - Backend', () => {
  test('should validate company reference only when changing companyId', async ({ request }) => {
    // Test the API directly
    const response = await request.patch('/api/v1/actions/test-action-123', {
      data: {
        description: 'Updated description only',
        // No companyId change - should not validate
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('should validate company reference when changing companyId', async ({ request }) => {
    const response = await request.patch('/api/v1/actions/test-action-123', {
      data: {
        companyId: 'new-company-id',
        description: 'Updated description',
      }
    });
    
    // This should trigger validation
    expect(response.status()).toBe(400); // Assuming new-company-id doesn't exist
    const data = await response.json();
    expect(data.error).toContain('Company with ID new-company-id not found');
  });

  test('should not validate when companyId is same as existing', async ({ request }) => {
    const response = await request.patch('/api/v1/actions/test-action-123', {
      data: {
        companyId: 'existing-company-id', // Same as existing
        description: 'Updated description',
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
