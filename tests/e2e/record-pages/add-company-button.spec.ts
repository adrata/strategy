import { test, expect, Page } from '@playwright/test';

// Helper function to create a test person without company
async function createTestPerson(page: Page): Promise<string> {
  // Navigate to people section
  await page.goto('/people');
  
  // Click add person button
  await page.click('[data-testid="add-person-button"]');
  
  // Fill out person form
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'Person');
  await page.fill('input[name="email"]', 'test.person@example.com');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect to person detail page
  await page.waitForURL(/\/people\/[a-f0-9-]+/);
  
  // Extract person ID from URL
  const url = page.url();
  const personId = url.split('/').pop();
  
  return personId || '';
}

// Helper function to cleanup test person
async function cleanupTestPerson(page: Page, personId: string) {
  if (personId) {
    // Navigate to person and delete
    await page.goto(`/people/${personId}`);
    await page.click('[data-testid="delete-button"]');
    await page.fill('input[placeholder*="name"]', 'Test Person');
    await page.click('button:has-text("Delete")');
  }
}

test.describe('Add Company Button E2E', () => {
  let testPersonId: string;

  test.beforeEach(async ({ page }) => {
    // Create a test person without company
    testPersonId = await createTestPerson(page);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test person
    await cleanupTestPerson(page, testPersonId);
  });

  test('should show Add Company button for person without company', async ({ page }) => {
    // Navigate to the test person
    await page.goto(`/people/${testPersonId}`);
    
    // Verify Add Company button is visible
    const addCompanyButton = page.locator('button:has-text("Add Company")');
    await expect(addCompanyButton).toBeVisible();
  });

  test('should open Add Company modal when button is clicked', async ({ page }) => {
    // Navigate to the test person
    await page.goto(`/people/${testPersonId}`);
    
    // Click Add Company button
    await page.click('button:has-text("Add Company")');
    
    // Verify modal opens
    await expect(page.locator('[data-testid="add-company-modal"]')).toBeVisible();
    
    // Verify modal has correct title
    await expect(page.locator('h2:has-text("Add Company")')).toBeVisible();
  });

  test('should create company and associate with person', async ({ page }) => {
    // Navigate to the test person
    await page.goto(`/people/${testPersonId}`);
    
    // Click Add Company button
    await page.click('button:has-text("Add Company")');
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="add-company-modal"]')).toBeVisible();
    
    // Fill out company form
    await page.fill('input[name="name"]', 'Test Company Inc');
    await page.fill('input[name="website"]', 'https://testcompany.com');
    await page.fill('textarea[name="notes"]', 'Test company notes');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="add-company-modal"]')).not.toBeVisible();
    
    // Verify success message
    await expect(page.locator('text=Company added and associated successfully!')).toBeVisible();
    
    // Verify Add Company button is no longer visible
    await expect(page.locator('button:has-text("Add Company")')).not.toBeVisible();
    
    // Verify company information is displayed in person details
    await expect(page.locator('text=Test Company Inc')).toBeVisible();
  });

  test('should close modal when cancel is clicked', async ({ page }) => {
    // Navigate to the test person
    await page.goto(`/people/${testPersonId}`);
    
    // Click Add Company button
    await page.click('button:has-text("Add Company")');
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="add-company-modal"]')).toBeVisible();
    
    // Click cancel/close button
    await page.click('button:has-text("Cancel")');
    
    // Verify modal is closed
    await expect(page.locator('[data-testid="add-company-modal"]')).not.toBeVisible();
    
    // Verify Add Company button is still visible
    await expect(page.locator('button:has-text("Add Company")')).toBeVisible();
  });

  test('should validate required fields in company form', async ({ page }) => {
    // Navigate to the test person
    await page.goto(`/people/${testPersonId}`);
    
    // Click Add Company button
    await page.click('button:has-text("Add Company")');
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="add-company-modal"]')).toBeVisible();
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Verify validation error is shown
    await expect(page.locator('text=Company name is required')).toBeVisible();
    
    // Verify modal is still open
    await expect(page.locator('[data-testid="add-company-modal"]')).toBeVisible();
  });

  test('should work for leads without company', async ({ page }) => {
    // Navigate to leads section
    await page.goto('/leads');
    
    // Find a lead without company (or create one)
    const leadWithoutCompany = page.locator('[data-testid="lead-row"]').first();
    await leadWithoutCompany.click();
    
    // Verify Add Company button is visible
    await expect(page.locator('button:has-text("Add Company")')).toBeVisible();
    
    // Click Add Company button
    await page.click('button:has-text("Add Company")');
    
    // Verify modal opens
    await expect(page.locator('[data-testid="add-company-modal"]')).toBeVisible();
  });

  test('should work for prospects without company', async ({ page }) => {
    // Navigate to prospects section
    await page.goto('/prospects');
    
    // Find a prospect without company (or create one)
    const prospectWithoutCompany = page.locator('[data-testid="prospect-row"]').first();
    await prospectWithoutCompany.click();
    
    // Verify Add Company button is visible
    await expect(page.locator('button:has-text("Add Company")')).toBeVisible();
    
    // Click Add Company button
    await page.click('button:has-text("Add Company")');
    
    // Verify modal opens
    await expect(page.locator('[data-testid="add-company-modal"]')).toBeVisible();
  });

  test('should not show Add Company button for person with existing company', async ({ page }) => {
    // First, add a company to the test person
    await page.goto(`/people/${testPersonId}`);
    
    // Click Add Company button
    await page.click('button:has-text("Add Company")');
    
    // Fill out and submit company form
    await page.fill('input[name="name"]', 'Existing Company');
    await page.click('button[type="submit"]');
    
    // Wait for association to complete
    await expect(page.locator('text=Company added and associated successfully!')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Verify Add Company button is no longer visible
    await expect(page.locator('button:has-text("Add Company")')).not.toBeVisible();
    
    // Verify company information is displayed
    await expect(page.locator('text=Existing Company')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/companies', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Navigate to the test person
    await page.goto(`/people/${testPersonId}`);
    
    // Click Add Company button
    await page.click('button:has-text("Add Company")');
    
    // Fill out company form
    await page.fill('input[name="name"]', 'Test Company');
    await page.click('button[type="submit"]');
    
    // Verify error message is shown
    await expect(page.locator('text=Failed to create company')).toBeVisible();
    
    // Verify modal is still open
    await expect(page.locator('[data-testid="add-company-modal"]')).toBeVisible();
  });
});
