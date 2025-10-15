/**
 * Inline Editing Persistence E2E Tests
 * 
 * Comprehensive tests to verify that inline editing changes persist after page reload
 * Tests all editable fields across all record types
 */

import { test, expect } from '@playwright/test';

// Test data
const testData = {
  company: {
    website: 'https://test-persistence-company.com',
    name: 'Test Persistence Company',
    size: '51-200 employees'
  },
  person: {
    name: 'Test Persistence User',
    title: 'Test Engineer',
    department: 'Quality Assurance',
    email: 'test-persistence@example.com',
    phone: '+1-555-000-9999'
  }
};

test.describe('Inline Editing Persistence Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Login if needed (adjust selectors based on your auth flow)
    const loginButton = page.locator('text=Sign In').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      // Add login steps here if needed
    }
  });

  test.describe('Company Record Inline Editing Persistence', () => {
    test('should persist website field after reload', async ({ page }) => {
      // Navigate to companies page
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      // Find and click on a company record
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      
      // Wait for company detail page to load
      await page.waitForLoadState('networkidle');
      
      // Test website field
      await testFieldPersistence(page, 'website', testData.company.website, {
        fieldSelector: '[data-testid="display-field-website"]',
        editButtonSelector: '[data-testid="edit-website"]',
        inputSelector: '[data-testid="input-website"]',
        saveButtonSelector: '[data-testid="save-website"]',
        valueSelector: '[data-testid="value-website"]'
      });
    });

    test('should persist company name after reload', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      await testFieldPersistence(page, 'name', testData.company.name, {
        fieldSelector: '[data-testid="display-field-name"]',
        editButtonSelector: '[data-testid="edit-name"]',
        inputSelector: '[data-testid="input-name"]',
        saveButtonSelector: '[data-testid="save-name"]',
        valueSelector: '[data-testid="value-name"]'
      });
    });

    test('should persist company size after reload', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      await testFieldPersistence(page, 'size', testData.company.size, {
        fieldSelector: '[data-testid="display-field-size"]',
        editButtonSelector: '[data-testid="edit-size"]',
        inputSelector: '[data-testid="input-size"]',
        saveButtonSelector: '[data-testid="save-size"]',
        valueSelector: '[data-testid="value-size"]'
      });
    });

    test('should not allow editing of headquarters field', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      // Check that headquarters field is read-only
      const headquartersField = page.locator('[data-testid="display-field-headquarters"]');
      await expect(headquartersField).toBeVisible();
      
      // Should not have edit button
      const editButton = headquartersField.locator('[data-testid="edit-headquarters"]');
      await expect(editButton).not.toBeVisible();
    });
  });

  test.describe('Person Record Inline Editing Persistence', () => {
    test('should persist person name after reload', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const leadRow = page.locator('[data-testid="person-row"]').first();
      await leadRow.click();
      await page.waitForLoadState('networkidle');
      
      await testFieldPersistence(page, 'name', testData.person.name, {
        fieldSelector: '[data-testid="display-field-name"]',
        editButtonSelector: '[data-testid="edit-name"]',
        inputSelector: '[data-testid="input-name"]',
        saveButtonSelector: '[data-testid="save-name"]',
        valueSelector: '[data-testid="value-name"]'
      });
    });

    test('should persist person title after reload (mapped to jobTitle)', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const leadRow = page.locator('[data-testid="person-row"]').first();
      await leadRow.click();
      await page.waitForLoadState('networkidle');
      
      await testFieldPersistence(page, 'title', testData.person.title, {
        fieldSelector: '[data-testid="display-field-title"]',
        editButtonSelector: '[data-testid="edit-title"]',
        inputSelector: '[data-testid="input-title"]',
        saveButtonSelector: '[data-testid="save-title"]',
        valueSelector: '[data-testid="value-title"]'
      });
    });

    test('should persist person department after reload', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const leadRow = page.locator('[data-testid="person-row"]').first();
      await leadRow.click();
      await page.waitForLoadState('networkidle');
      
      await testFieldPersistence(page, 'department', testData.person.department, {
        fieldSelector: '[data-testid="display-field-department"]',
        editButtonSelector: '[data-testid="edit-department"]',
        inputSelector: '[data-testid="input-department"]',
        saveButtonSelector: '[data-testid="save-department"]',
        valueSelector: '[data-testid="value-department"]'
      });
    });

    test('should persist person email after reload', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const leadRow = page.locator('[data-testid="person-row"]').first();
      await leadRow.click();
      await page.waitForLoadState('networkidle');
      
      await testFieldPersistence(page, 'email', testData.person.email, {
        fieldSelector: '[data-testid="display-field-email"]',
        editButtonSelector: '[data-testid="edit-email"]',
        inputSelector: '[data-testid="input-email"]',
        saveButtonSelector: '[data-testid="save-email"]',
        valueSelector: '[data-testid="value-email"]'
      });
    });

    test('should persist person phone after reload', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const leadRow = page.locator('[data-testid="person-row"]').first();
      await leadRow.click();
      await page.waitForLoadState('networkidle');
      
      await testFieldPersistence(page, 'phone', testData.person.phone, {
        fieldSelector: '[data-testid="display-field-phone"]',
        editButtonSelector: '[data-testid="edit-phone"]',
        inputSelector: '[data-testid="input-phone"]',
        saveButtonSelector: '[data-testid="save-phone"]',
        valueSelector: '[data-testid="value-phone"]'
      });
    });
  });

  test.describe('Prospect Record Inline Editing Persistence', () => {
    test('should persist prospect fields after reload', async ({ page }) => {
      await page.goto('/prospects');
      await page.waitForLoadState('networkidle');
      
      const prospectRow = page.locator('[data-testid="person-row"]').first();
      await prospectRow.click();
      await page.waitForLoadState('networkidle');
      
      // Test multiple fields in sequence
      await testFieldPersistence(page, 'title', 'Senior Prospect Engineer', {
        fieldSelector: '[data-testid="display-field-title"]',
        editButtonSelector: '[data-testid="edit-title"]',
        inputSelector: '[data-testid="input-title"]',
        saveButtonSelector: '[data-testid="save-title"]',
        valueSelector: '[data-testid="value-title"]'
      });
      
      await testFieldPersistence(page, 'department', 'Prospect Engineering', {
        fieldSelector: '[data-testid="display-field-department"]',
        editButtonSelector: '[data-testid="edit-department"]',
        inputSelector: '[data-testid="input-department"]',
        saveButtonSelector: '[data-testid="save-department"]',
        valueSelector: '[data-testid="value-department"]'
      });
    });
  });

  test.describe('Opportunity Record Inline Editing Persistence', () => {
    test('should persist opportunity fields after reload', async ({ page }) => {
      await page.goto('/opportunities');
      await page.waitForLoadState('networkidle');
      
      const opportunityRow = page.locator('[data-testid="person-row"]').first();
      await opportunityRow.click();
      await page.waitForLoadState('networkidle');
      
      await testFieldPersistence(page, 'title', 'Opportunity Manager', {
        fieldSelector: '[data-testid="display-field-title"]',
        editButtonSelector: '[data-testid="edit-title"]',
        inputSelector: '[data-testid="input-title"]',
        saveButtonSelector: '[data-testid="save-title"]',
        valueSelector: '[data-testid="value-title"]'
      });
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/v1/companies/*', route => {
        route.abort('failed');
      });
      
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      // Try to edit a field
      const nameField = page.locator('[data-testid="display-field-name"]');
      const editNameButton = nameField.locator('[data-testid="edit-name"]');
      await editNameButton.click();
      
      const nameInput = page.locator('[data-testid="input-name"]');
      await nameInput.clear();
      await nameInput.fill('Network Error Test');
      
      const saveNameButton = page.locator('[data-testid="save-name"]');
      await saveNameButton.click();
      
      // Should show error message
      await expect(page.locator('text=Failed to update')).toBeVisible();
      
      // Should stay in edit mode
      await expect(nameInput).toBeVisible();
    });

    test('should handle rapid successive edits', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      const nameField = page.locator('[data-testid="display-field-name"]');
      
      // Make rapid edits
      for (let i = 1; i <= 3; i++) {
        const editNameButton = nameField.locator('[data-testid="edit-name"]');
        await editNameButton.click();
        
        const nameInput = page.locator('[data-testid="input-name"]');
        await nameInput.clear();
        await nameInput.fill(`Rapid Edit ${i}`);
        
        const saveNameButton = page.locator('[data-testid="save-name"]');
        await saveNameButton.click();
        
        await page.waitForResponse(response => 
          response.url().includes('/api/v1/companies/') && 
          response.request().method() === 'PATCH'
        );
        
        // Verify each change
        await expect(nameField.locator('[data-testid="value-name"]')).toHaveText(`Rapid Edit ${i}`);
      }
    });
  });
});

// Helper function to test field persistence
async function testFieldPersistence(
  page: any, 
  fieldName: string, 
  newValue: string, 
  selectors: {
    fieldSelector: string;
    editButtonSelector: string;
    inputSelector: string;
    saveButtonSelector: string;
    valueSelector: string;
  }
) {
  console.log(`Testing field persistence for: ${fieldName}`);
  
  // Find the field and click edit
  const field = page.locator(selectors.fieldSelector);
  await expect(field).toBeVisible();
  
  const editButton = field.locator(selectors.editButtonSelector);
  await editButton.click();
  
  // Edit the value
  const input = page.locator(selectors.inputSelector);
  await input.clear();
  await input.fill(newValue);
  
  // Save the changes
  const saveButton = page.locator(selectors.saveButtonSelector);
  await saveButton.click();
  
  // Wait for save to complete
  await page.waitForResponse(response => 
    (response.url().includes('/api/v1/companies/') || response.url().includes('/api/v1/people/')) && 
    response.request().method() === 'PATCH'
  );
  
  // Verify the change is displayed immediately
  await expect(field.locator(selectors.valueSelector)).toHaveText(newValue);
  
  // Refresh the page to verify persistence
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Verify the change persisted
  await expect(field.locator(selectors.valueSelector)).toHaveText(newValue);
  
  console.log(`✅ Field ${fieldName} persisted successfully after reload`);
}
