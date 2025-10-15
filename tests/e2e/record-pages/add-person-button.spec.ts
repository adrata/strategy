import { test, expect, Page } from '@playwright/test';

// Helper function to create a test company
async function createTestCompany(page: Page): Promise<string> {
  // Navigate to companies section
  await page.goto('/companies');
  
  // Click add company button
  await page.click('[data-testid="add-company-button"]');
  
  // Fill out company form
  await page.fill('input[name="name"]', 'Test Company Inc');
  await page.fill('input[name="website"]', 'https://testcompany.com');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to company detail page
  await page.waitForURL(/\/companies\/[a-f0-9-]+/);
  
  // Extract company ID from URL
  const url = page.url();
  const companyId = url.split('/').pop();
  
  return companyId || '';
}

// Helper function to cleanup test company
async function cleanupTestCompany(page: Page, companyId: string) {
  if (companyId) {
    // Navigate to company and delete
    await page.goto(`/companies/${companyId}`);
    await page.click('[data-testid="delete-button"]');
    await page.fill('input[placeholder*="name"]', 'Test Company Inc');
    await page.click('button:has-text("Delete")');
  }
}

test.describe('Add Person Button E2E', () => {
  let testCompanyId: string;

  test.beforeEach(async ({ page }) => {
    // Create a test company
    testCompanyId = await createTestCompany(page);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test company
    await cleanupTestCompany(page, testCompanyId);
  });

  test('should show Add Person button for company records', async ({ page }) => {
    // Navigate to the test company
    await page.goto(`/companies/${testCompanyId}`);
    
    // Verify Add Person button is visible
    const addPersonButton = page.locator('button:has-text("Add Person")');
    await expect(addPersonButton).toBeVisible();
  });

  test('should open Add Person modal when button is clicked', async ({ page }) => {
    // Navigate to the test company
    await page.goto(`/companies/${testCompanyId}`);
    
    // Click Add Person button
    await page.click('button:has-text("Add Person")');
    
    // Verify modal opens
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).toBeVisible();
    
    // Verify modal has correct title
    await expect(page.locator('h2:has-text("Add Person")')).toBeVisible();
  });

  test('should have company locked in the modal', async ({ page }) => {
    // Navigate to the test company
    await page.goto(`/companies/${testCompanyId}`);
    
    // Click Add Person button
    await page.click('button:has-text("Add Person")');
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).toBeVisible();
    
    // Verify company field is locked/pre-filled
    const companyField = page.locator('input[name="company"]');
    await expect(companyField).toHaveValue('Test Company Inc');
    
    // Verify company field is disabled/read-only
    await expect(companyField).toBeDisabled();
  });

  test('should create person and associate with company', async ({ page }) => {
    // Navigate to the test company
    await page.goto(`/companies/${testCompanyId}`);
    
    // Click Add Person button
    await page.click('button:has-text("Add Person")');
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).toBeVisible();
    
    // Fill out person form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@testcompany.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.fill('input[name="jobTitle"]', 'Software Engineer');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).not.toBeVisible();
    
    // Verify success message
    await expect(page.locator('text=Person added successfully!')).toBeVisible();
    
    // Verify person appears in company's people list (if such a section exists)
    // This would depend on the actual UI implementation
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should close modal when cancel is clicked', async ({ page }) => {
    // Navigate to the test company
    await page.goto(`/companies/${testCompanyId}`);
    
    // Click Add Person button
    await page.click('button:has-text("Add Person")');
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).toBeVisible();
    
    // Click cancel/close button
    await page.click('button:has-text("Cancel")');
    
    // Verify modal is closed
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).not.toBeVisible();
    
    // Verify Add Person button is still visible
    await expect(page.locator('button:has-text("Add Person")')).toBeVisible();
  });

  test('should validate required fields in person form', async ({ page }) => {
    // Navigate to the test company
    await page.goto(`/companies/${testCompanyId}`);
    
    // Click Add Person button
    await page.click('button:has-text("Add Person")');
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).toBeVisible();
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors are shown
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Last name is required')).toBeVisible();
    
    // Verify modal is still open
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).toBeVisible();
  });

  test('should not show Add Person button for person records', async ({ page }) => {
    // Navigate to a person record (assuming there's a way to access one)
    await page.goto('/people');
    
    // Click on first person
    const firstPerson = page.locator('[data-testid="person-row"]').first();
    await firstPerson.click();
    
    // Verify Add Person button is NOT visible
    await expect(page.locator('button:has-text("Add Person")')).not.toBeVisible();
  });

  test('should not show Add Person button for lead records', async ({ page }) => {
    // Navigate to a lead record
    await page.goto('/leads');
    
    // Click on first lead
    const firstLead = page.locator('[data-testid="lead-row"]').first();
    await firstLead.click();
    
    // Verify Add Person button is NOT visible
    await expect(page.locator('button:has-text("Add Person")')).not.toBeVisible();
  });

  test('should not show Add Person button for prospect records', async ({ page }) => {
    // Navigate to a prospect record
    await page.goto('/prospects');
    
    // Click on first prospect
    const firstProspect = page.locator('[data-testid="prospect-row"]').first();
    await firstProspect.click();
    
    // Verify Add Person button is NOT visible
    await expect(page.locator('button:has-text("Add Person")')).not.toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/companies/*/people', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Navigate to the test company
    await page.goto(`/companies/${testCompanyId}`);
    
    // Click Add Person button
    await page.click('button:has-text("Add Person")');
    
    // Fill out person form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.click('button[type="submit"]');
    
    // Verify error message is shown
    await expect(page.locator('text=Failed to create person')).toBeVisible();
    
    // Verify modal is still open
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).toBeVisible();
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    // Navigate to the test company
    await page.goto(`/companies/${testCompanyId}`);
    
    // Click Add Person button
    await page.click('button:has-text("Add Person")');
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).toBeVisible();
    
    // Fill out form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    
    // Test Ctrl+Enter shortcut (if implemented)
    await page.keyboard.press('Control+Enter');
    
    // Verify form was submitted (modal should close)
    await expect(page.locator('[data-testid="add-person-to-company-modal"]')).not.toBeVisible();
  });

  test('should maintain company association after person creation', async ({ page }) => {
    // Navigate to the test company
    await page.goto(`/companies/${testCompanyId}`);
    
    // Click Add Person button
    await page.click('button:has-text("Add Person")');
    
    // Fill out and submit person form
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'jane.smith@testcompany.com');
    await page.click('button[type="submit"]');
    
    // Wait for success
    await expect(page.locator('text=Person added successfully!')).toBeVisible();
    
    // Navigate to the created person's detail page
    // This would require the person ID from the response or navigation
    // For now, we'll verify the person appears in the company's people list
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    
    // Verify the person is associated with the correct company
    await expect(page.locator('text=Test Company Inc')).toBeVisible();
  });
});
