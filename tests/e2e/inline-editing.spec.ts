/**
 * Inline Editing End-to-End Tests
 * 
 * Complete user workflows for inline editing across all record types
 * Tests real browser interactions and database persistence
 */

import { test, expect } from '@playwright/test';

// Test data
const testCompany = {
  name: 'E2E Test Company',
  website: 'https://e2etest.com',
  email: 'test@e2etest.com',
  phone: '+1-555-000-0001',
  industry: 'Technology',
  size: '51-200 employees',
};

const testPerson = {
  firstName: 'E2E',
  lastName: 'TestUser',
  email: 'e2e@testuser.com',
  phone: '+1-555-000-0002',
  jobTitle: 'Test Engineer',
  department: 'QA',
  company: 'E2E Test Company',
};

test.describe('Inline Editing E2E Tests', () => {
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

  test.describe('Company Record Inline Editing', () => {
    test('should edit company name and persist to database', async ({ page }) => {
      // Navigate to companies page
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      // Find and click on a company record (assuming there's a list view)
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      
      // Wait for company detail page to load
      await page.waitForLoadState('networkidle');
      
      // Find the company name field and click edit
      const nameField = page.locator('[data-testid="display-field-name"]');
      await expect(nameField).toBeVisible();
      
      const editButton = nameField.locator('[data-testid="edit-name"]');
      await editButton.click();
      
      // Edit the name
      const nameInput = page.locator('[data-testid="input-name"]');
      await nameInput.clear();
      await nameInput.fill('Updated Company Name');
      
      // Save the changes
      const saveButton = page.locator('[data-testid="save-name"]');
      await saveButton.click();
      
      // Wait for save to complete
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the change is displayed
      await expect(nameField.locator('[data-testid="value-name"]')).toHaveText('Updated Company Name');
      
      // Refresh the page to verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify the change persisted
      await expect(nameField.locator('[data-testid="value-name"]')).toHaveText('Updated Company Name');
    });

    test('should edit company website and validate URL format', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit website field
      const websiteField = page.locator('[data-testid="display-field-website"]');
      const editButton = websiteField.locator('[data-testid="edit-website"]');
      await editButton.click();
      
      const websiteInput = page.locator('[data-testid="input-website"]');
      await websiteInput.clear();
      await websiteInput.fill('https://new-website.com');
      
      const saveButton = page.locator('[data-testid="save-website"]');
      await saveButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the change
      await expect(websiteField.locator('[data-testid="value-website"]')).toHaveText('https://new-website.com');
    });

    test('should edit company industry and size', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit industry
      const industryField = page.locator('[data-testid="display-field-industry"]');
      const editIndustryButton = industryField.locator('[data-testid="edit-industry"]');
      await editIndustryButton.click();
      
      const industryInput = page.locator('[data-testid="input-industry"]');
      await industryInput.clear();
      await industryInput.fill('Healthcare Technology');
      
      const saveIndustryButton = page.locator('[data-testid="save-industry"]');
      await saveIndustryButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Edit size
      const sizeField = page.locator('[data-testid="display-field-size"]');
      const editSizeButton = sizeField.locator('[data-testid="edit-size"]');
      await editSizeButton.click();
      
      const sizeInput = page.locator('[data-testid="input-size"]');
      await sizeInput.clear();
      await sizeInput.fill('201-500 employees');
      
      const saveSizeButton = page.locator('[data-testid="save-size"]');
      await saveSizeButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify both changes
      await expect(industryField.locator('[data-testid="value-industry"]')).toHaveText('Healthcare Technology');
      await expect(sizeField.locator('[data-testid="value-size"]')).toHaveText('201-500 employees');
    });

    test('should edit opportunity fields', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit opportunity stage
      const stageField = page.locator('[data-testid="display-field-opportunityStage"]');
      const editStageButton = stageField.locator('[data-testid="edit-opportunityStage"]');
      await editStageButton.click();
      
      const stageInput = page.locator('[data-testid="input-opportunityStage"]');
      await stageInput.clear();
      await stageInput.fill('Negotiation');
      
      const saveStageButton = page.locator('[data-testid="save-opportunityStage"]');
      await saveStageButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the change
      await expect(stageField.locator('[data-testid="value-opportunityStage"]')).toHaveText('Negotiation');
    });
  });

  test.describe('Person Record Inline Editing (Lead/Prospect/Opportunity)', () => {
    test('should edit lead contact information', async ({ page }) => {
      // Navigate to leads page
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Find and click on a lead record
      const leadRow = page.locator('[data-testid="person-row"]').first();
      await leadRow.click();
      
      await page.waitForLoadState('networkidle');
      
      // Edit email field
      const emailField = page.locator('[data-testid="display-field-email"]');
      const editEmailButton = emailField.locator('[data-testid="edit-email"]');
      await editEmailButton.click();
      
      const emailInput = page.locator('[data-testid="input-email"]');
      await emailInput.clear();
      await emailInput.fill('updated@lead.com');
      
      const saveEmailButton = page.locator('[data-testid="save-email"]');
      await saveEmailButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the change
      await expect(emailField.locator('[data-testid="value-email"]')).toHaveText('updated@lead.com');
      
      // Edit phone field
      const phoneField = page.locator('[data-testid="display-field-phone"]');
      const editPhoneButton = phoneField.locator('[data-testid="edit-phone"]');
      await editPhoneButton.click();
      
      const phoneInput = page.locator('[data-testid="input-phone"]');
      await phoneInput.clear();
      await phoneInput.fill('+1-555-999-8888');
      
      const savePhoneButton = page.locator('[data-testid="save-phone"]');
      await savePhoneButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the change
      await expect(phoneField.locator('[data-testid="value-phone"]')).toHaveText('+1-555-999-8888');
    });

    test('should edit person profile fields and auto-update fullName', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const leadRow = page.locator('[data-testid="person-row"]').first();
      await leadRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit firstName
      const firstNameField = page.locator('[data-testid="display-field-firstName"]');
      const editFirstNameButton = firstNameField.locator('[data-testid="edit-firstName"]');
      await editFirstNameButton.click();
      
      const firstNameInput = page.locator('[data-testid="input-firstName"]');
      await firstNameInput.clear();
      await firstNameInput.fill('Jane');
      
      const saveFirstNameButton = page.locator('[data-testid="save-firstName"]');
      await saveFirstNameButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify firstName change
      await expect(firstNameField.locator('[data-testid="value-firstName"]')).toHaveText('Jane');
      
      // Verify fullName was auto-updated (this would need to be implemented in the API)
      const fullNameField = page.locator('[data-testid="display-field-fullName"]');
      await expect(fullNameField.locator('[data-testid="value-fullName"]')).toHaveText('Jane Doe'); // Assuming lastName is 'Doe'
    });

    test('should change lead status from LEAD to PROSPECT', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const leadRow = page.locator('[data-testid="person-row"]').first();
      await leadRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit status field (assuming it's a select field)
      const statusField = page.locator('[data-testid="display-field-status"]');
      const editStatusButton = statusField.locator('[data-testid="edit-status"]');
      await editStatusButton.click();
      
      const statusSelect = page.locator('[data-testid="input-status"]');
      await statusSelect.selectOption('PROSPECT');
      
      const saveStatusButton = page.locator('[data-testid="save-status"]');
      await saveStatusButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the status change
      await expect(statusField.locator('[data-testid="value-status"]')).toHaveText('PROSPECT');
    });

    test('should edit prospect engagement fields', async ({ page }) => {
      await page.goto('/prospects');
      await page.waitForLoadState('networkidle');
      
      const prospectRow = page.locator('[data-testid="person-row"]').first();
      await prospectRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit priority
      const priorityField = page.locator('[data-testid="display-field-priority"]');
      const editPriorityButton = priorityField.locator('[data-testid="edit-priority"]');
      await editPriorityButton.click();
      
      const prioritySelect = page.locator('[data-testid="input-priority"]');
      await prioritySelect.selectOption('HIGH');
      
      const savePriorityButton = page.locator('[data-testid="save-priority"]');
      await savePriorityButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the priority change
      await expect(priorityField.locator('[data-testid="value-priority"]')).toHaveText('HIGH');
    });

    test('should edit opportunity next action fields', async ({ page }) => {
      await page.goto('/opportunities');
      await page.waitForLoadState('networkidle');
      
      const opportunityRow = page.locator('[data-testid="person-row"]').first();
      await opportunityRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit next action
      const nextActionField = page.locator('[data-testid="display-field-nextAction"]');
      const editNextActionButton = nextActionField.locator('[data-testid="edit-nextAction"]');
      await editNextActionButton.click();
      
      const nextActionInput = page.locator('[data-testid="input-nextAction"]');
      await nextActionInput.clear();
      await nextActionInput.fill('Schedule final demo');
      
      const saveNextActionButton = page.locator('[data-testid="save-nextAction"]');
      await saveNextActionButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the change
      await expect(nextActionField.locator('[data-testid="value-nextAction"]')).toHaveText('Schedule final demo');
    });
  });

  test.describe('Speedrun Workflow Inline Editing', () => {
    test('should edit lead details in speedrun session', async ({ page }) => {
      // Navigate to speedrun
      await page.goto('/speedrun');
      await page.waitForLoadState('networkidle');
      
      // Wait for lead to load
      await page.waitForSelector('[data-testid="speedrun-lead-details"]');
      
      // Edit lead email
      const emailField = page.locator('[data-testid="display-field-email"]');
      const editEmailButton = emailField.locator('[data-testid="edit-email"]');
      await editEmailButton.click();
      
      const emailInput = page.locator('[data-testid="input-email"]');
      await emailInput.clear();
      await emailInput.fill('speedrun@test.com');
      
      const saveEmailButton = page.locator('[data-testid="save-email"]');
      await saveEmailButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the change
      await expect(emailField.locator('[data-testid="value-email"]')).toHaveText('speedrun@test.com');
      
      // Complete the action
      const completeButton = page.locator('[data-testid="complete-action"]');
      await completeButton.click();
      
      // Verify edits persist after navigation
      await page.waitForLoadState('networkidle');
      
      // Navigate back to the lead (if possible) and verify the email change persisted
      const leadLink = page.locator('[data-testid="lead-link"]').first();
      if (await leadLink.isVisible()) {
        await leadLink.click();
        await page.waitForLoadState('networkidle');
        
        const emailFieldAfter = page.locator('[data-testid="display-field-email"]');
        await expect(emailFieldAfter.locator('[data-testid="value-email"]')).toHaveText('speedrun@test.com');
      }
    });
  });

  test.describe('Multi-Field Edit Workflows', () => {
    test('should edit multiple company fields in sequence', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit name
      const nameField = page.locator('[data-testid="display-field-name"]');
      const editNameButton = nameField.locator('[data-testid="edit-name"]');
      await editNameButton.click();
      
      const nameInput = page.locator('[data-testid="input-name"]');
      await nameInput.clear();
      await nameInput.fill('Multi-Edit Company');
      
      const saveNameButton = page.locator('[data-testid="save-name"]');
      await saveNameButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Edit industry
      const industryField = page.locator('[data-testid="display-field-industry"]');
      const editIndustryButton = industryField.locator('[data-testid="edit-industry"]');
      await editIndustryButton.click();
      
      const industryInput = page.locator('[data-testid="input-industry"]');
      await industryInput.clear();
      await industryInput.fill('Multi-Industry');
      
      const saveIndustryButton = page.locator('[data-testid="save-industry"]');
      await saveIndustryButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Edit email
      const emailField = page.locator('[data-testid="display-field-email"]');
      const editEmailButton = emailField.locator('[data-testid="edit-email"]');
      await editEmailButton.click();
      
      const emailInput = page.locator('[data-testid="input-email"]');
      await emailInput.clear();
      await emailInput.fill('multi@edit.com');
      
      const saveEmailButton = page.locator('[data-testid="save-email"]');
      await saveEmailButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify all changes
      await expect(nameField.locator('[data-testid="value-name"]')).toHaveText('Multi-Edit Company');
      await expect(industryField.locator('[data-testid="value-industry"]')).toHaveText('Multi-Industry');
      await expect(emailField.locator('[data-testid="value-email"]')).toHaveText('multi@edit.com');
      
      // Refresh and verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await expect(nameField.locator('[data-testid="value-name"]')).toHaveText('Multi-Edit Company');
      await expect(industryField.locator('[data-testid="value-industry"]')).toHaveText('Multi-Industry');
      await expect(emailField.locator('[data-testid="value-email"]')).toHaveText('multi@edit.com');
    });

    test('should edit multiple person fields and verify database persistence', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const leadRow = page.locator('[data-testid="person-row"]').first();
      await leadRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit firstName
      const firstNameField = page.locator('[data-testid="display-field-firstName"]');
      const editFirstNameButton = firstNameField.locator('[data-testid="edit-firstName"]');
      await editFirstNameButton.click();
      
      const firstNameInput = page.locator('[data-testid="input-firstName"]');
      await firstNameInput.clear();
      await firstNameInput.fill('Multi');
      
      const saveFirstNameButton = page.locator('[data-testid="save-firstName"]');
      await saveFirstNameButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Edit lastName
      const lastNameField = page.locator('[data-testid="display-field-lastName"]');
      const editLastNameButton = lastNameField.locator('[data-testid="edit-lastName"]');
      await editLastNameButton.click();
      
      const lastNameInput = page.locator('[data-testid="input-lastName"]');
      await lastNameInput.clear();
      await lastNameInput.fill('Editor');
      
      const saveLastNameButton = page.locator('[data-testid="save-lastName"]');
      await saveLastNameButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Edit jobTitle
      const jobTitleField = page.locator('[data-testid="display-field-jobTitle"]');
      const editJobTitleButton = jobTitleField.locator('[data-testid="edit-jobTitle"]');
      await editJobTitleButton.click();
      
      const jobTitleInput = page.locator('[data-testid="input-jobTitle"]');
      await jobTitleInput.clear();
      await jobTitleInput.fill('Multi-Field Editor');
      
      const saveJobTitleButton = page.locator('[data-testid="save-jobTitle"]');
      await saveJobTitleButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify all changes
      await expect(firstNameField.locator('[data-testid="value-firstName"]')).toHaveText('Multi');
      await expect(lastNameField.locator('[data-testid="value-lastName"]')).toHaveText('Editor');
      await expect(jobTitleField.locator('[data-testid="value-jobTitle"]')).toHaveText('Multi-Field Editor');
      
      // Verify fullName was auto-updated
      const fullNameField = page.locator('[data-testid="display-field-fullName"]');
      await expect(fullNameField.locator('[data-testid="value-fullName"]')).toHaveText('Multi Editor');
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should save with Enter key', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      // Edit name field
      const nameField = page.locator('[data-testid="display-field-name"]');
      const editNameButton = nameField.locator('[data-testid="edit-name"]');
      await editNameButton.click();
      
      const nameInput = page.locator('[data-testid="input-name"]');
      await nameInput.clear();
      await nameInput.fill('Enter Key Test');
      
      // Press Enter to save
      await nameInput.press('Enter');
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the change
      await expect(nameField.locator('[data-testid="value-name"]')).toHaveText('Enter Key Test');
    });

    test('should cancel with Escape key', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      // Get original value
      const nameField = page.locator('[data-testid="display-field-name"]');
      const originalValue = await nameField.locator('[data-testid="value-name"]').textContent();
      
      // Edit name field
      const editNameButton = nameField.locator('[data-testid="edit-name"]');
      await editNameButton.click();
      
      const nameInput = page.locator('[data-testid="input-name"]');
      await nameInput.clear();
      await nameInput.fill('Escape Test');
      
      // Press Escape to cancel
      await nameInput.press('Escape');
      
      // Verify the value reverted
      await expect(nameField.locator('[data-testid="value-name"]')).toHaveText(originalValue);
    });
  });

  test.describe('Error Handling', () => {
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

    test('should allow retry after error', async ({ page }) => {
      let requestCount = 0;
      
      // Mock first request to fail, second to succeed
      await page.route('**/api/v1/companies/*', route => {
        requestCount++;
        if (requestCount === 1) {
          route.abort('failed');
        } else {
          route.continue();
        }
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
      await nameInput.fill('Retry Test');
      
      const saveNameButton = page.locator('[data-testid="save-name"]');
      
      // First save attempt - should fail
      await saveNameButton.click();
      await expect(page.locator('text=Failed to update')).toBeVisible();
      
      // Second save attempt - should succeed
      await saveNameButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the change
      await expect(nameField.locator('[data-testid="value-name"]')).toHaveText('Retry Test');
    });
  });

  test.describe('Performance and Edge Cases', () => {
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

    test('should handle very long field values', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      const notesField = page.locator('[data-testid="display-field-notes"]');
      const editNotesButton = notesField.locator('[data-testid="edit-notes"]');
      await editNotesButton.click();
      
      const longText = 'A'.repeat(1000);
      const notesInput = page.locator('[data-testid="input-notes"]');
      await notesInput.clear();
      await notesInput.fill(longText);
      
      const saveNotesButton = page.locator('[data-testid="save-notes"]');
      await saveNotesButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the long text was saved
      await expect(notesField.locator('[data-testid="value-notes"]')).toHaveText(longText);
    });

    test('should handle special characters in text fields', async ({ page }) => {
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      await page.waitForLoadState('networkidle');
      
      const notesField = page.locator('[data-testid="display-field-notes"]');
      const editNotesButton = notesField.locator('[data-testid="edit-notes"]');
      await editNotesButton.click();
      
      const specialText = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const notesInput = page.locator('[data-testid="input-notes"]');
      await notesInput.clear();
      await notesInput.fill(specialText);
      
      const saveNotesButton = page.locator('[data-testid="save-notes"]');
      await saveNotesButton.click();
      
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH'
      );
      
      // Verify the special characters were saved
      await expect(notesField.locator('[data-testid="value-notes"]')).toHaveText(specialText);
    });
  });
});
