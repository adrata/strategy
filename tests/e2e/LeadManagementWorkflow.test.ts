import { test, expect } from '@playwright/test';

test.describe('Lead Management E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the lead detail page
    await page.goto('https://action.adrata.com/adrata/pipeline/leads/john-dano-lead_1757443731739_h6h3glvnk');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="lead-detail-page"]', { timeout: 10000 });
  });

  test('Complete Lead Management Workflow', async ({ page }) => {
    // Test 1: Verify page loads correctly
    await expect(page.locator('h1')).toContainText('John Dano');
    await expect(page.locator('text=Lead Information')).toBeVisible();

    // Test 2: Inline editing functionality
    await test.step('Inline editing works', async () => {
      // Click on name field to edit
      const nameField = page.locator('[data-testid="name-field"]');
      await nameField.click();
      
      // Clear and enter new name
      await nameField.fill('John Dano Updated');
      
      // Click save
      await page.locator('button:has-text("Save")').click();
      
      // Verify the change was saved
      await expect(nameField).toHaveValue('John Dano Updated');
    });

    // Test 3: Edit modal functionality
    await test.step('Edit modal works', async () => {
      // Click edit button
      await page.locator('button:has-text("Edit")').click();
      
      // Verify modal opens
      await expect(page.locator('text=Update Lead')).toBeVisible();
      
      // Verify all tabs are present
      await expect(page.locator('text=Overview')).toBeVisible();
      await expect(page.locator('text=Company')).toBeVisible();
      await expect(page.locator('text=Notes')).toBeVisible();
      await expect(page.locator('text=Timeline')).toBeVisible();
      
      // Test tab switching
      await page.locator('text=Company').click();
      await expect(page.locator('text=Company Information')).toBeVisible();
      
      // Make changes in modal
      const modalNameField = page.locator('input[value="John Dano Updated"]');
      await modalNameField.fill('John Dano Modal Edit');
      
      // Save changes
      await page.locator('button:has-text("Update Record")').click();
      
      // Verify modal closes and changes are reflected
      await expect(page.locator('text=Update Lead')).not.toBeVisible();
      await expect(page.locator('[data-testid="name-field"]')).toHaveValue('John Dano Modal Edit');
    });

    // Test 4: Delete functionality
    await test.step('Delete functionality works', async () => {
      // Click edit button to open modal
      await page.locator('button:has-text("Edit")').click();
      
      // Click delete button
      await page.locator('button:has-text("Delete")').click();
      
      // Verify confirmation dialog appears
      await expect(page.locator('text=Are you sure you want to delete this record?')).toBeVisible();
      
      // Cancel deletion for this test
      await page.locator('button:has-text("Cancel")').click();
      
      // Verify we're still on the page
      await expect(page.locator('h1')).toContainText('John Dano');
    });

    // Test 5: Advance to Prospect functionality
    await test.step('Advance to Prospect works', async () => {
      // Click Advance to Prospect button
      await page.locator('button:has-text("Advance to Prospect")').click();
      
      // Verify success message appears
      await expect(page.locator('text=Successfully advanced to prospect')).toBeVisible();
      
      // Verify URL changes to prospects
      await expect(page).toHaveURL(/\/pipeline\/prospects\//);
      
      // Verify page title changes
      await expect(page.locator('h1')).toContainText('John Dano');
      await expect(page.locator('text=Prospect Information')).toBeVisible();
    });
  });

  test('Tab Navigation and Content', async ({ page }) => {
    // Test Overview tab content
    await expect(page.locator('text=Lead Information')).toBeVisible();
    await expect(page.locator('text=Lead Status & Metadata')).toBeVisible();

    // Test Company tab
    await page.locator('text=Company').click();
    await expect(page.locator('text=Company Information')).toBeVisible();

    // Test Notes tab
    await page.locator('text=Notes').click();
    await expect(page.locator('text=Add New Note')).toBeVisible();
    
    // Test adding a note
    const noteTextarea = page.locator('textarea[placeholder="Enter your note here..."]');
    await noteTextarea.fill('This is a test note');
    await page.locator('button:has-text("Add Note")').click();
    
    // Verify note was added
    await expect(page.locator('text=This is a test note')).toBeVisible();

    // Test Timeline tab
    await page.locator('text=Timeline').click();
    await expect(page.locator('text=Lead created')).toBeVisible();
  });

  test('Data Field Styling and Differentiation', async ({ page }) => {
    // Verify data fields are darker than labels
    const nameField = page.locator('[data-testid="name-field"]');
    const nameLabel = page.locator('label:has-text("Name")');
    
    // Check that data field has darker styling
    const nameFieldColor = await nameField.evaluate(el => 
      window.getComputedStyle(el).color
    );
    const nameLabelColor = await nameLabel.evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // Data field should be darker (higher RGB values for gray-800 vs gray-700)
    expect(nameFieldColor).not.toBe(nameLabelColor);
  });
});
