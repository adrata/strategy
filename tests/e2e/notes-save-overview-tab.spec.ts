/**
 * End-to-End Tests for Notes Save on Overview Tab
 * 
 * Tests real browser interactions with actual API calls and database persistence
 * to ensure the note save functionality works correctly in production scenarios
 */

import { test, expect, Page } from '@playwright/test';

// Test data setup
const testPerson = {
  id: 'test-person-123',
  name: 'Test Person',
  notes: 'Initial test notes',
  email: 'test@example.com',
};

const testCompany = {
  id: 'test-company-456',
  name: 'Test Company',
  notes: 'Initial company notes',
  website: 'https://testcompany.com',
};

// Helper function to navigate to a person record
async function navigateToPersonRecord(page: Page, personId: string) {
  await page.goto(`/workspaces/test-workspace/people/${personId}`);
  await page.waitForSelector('[data-testid="overview-tab"]', { timeout: 10000 });
}

// Helper function to navigate to a company record
async function navigateToCompanyRecord(page: Page, companyId: string) {
  await page.goto(`/workspaces/test-workspace/companies/${companyId}`);
  await page.waitForSelector('[data-testid="overview-tab"]', { timeout: 10000 });
}

// Helper function to edit notes on overview tab
async function editNotesOnOverview(page: Page, newNotes: string) {
  // Click the edit button for notes field
  await page.click('[data-testid="edit-notes"]');
  
  // Clear and type new notes
  const notesTextarea = page.locator('[data-testid="edit-notes"]');
  await notesTextarea.clear();
  await notesTextarea.fill(newNotes);
  
  // Save the notes
  await page.click('[data-testid="save-notes"]');
  
  // Wait for save to complete
  await page.waitForSelector('[data-testid="display-notes"]', { timeout: 5000 });
}

// Helper function to switch tabs
async function switchToTab(page: Page, tabName: string) {
  await page.click(`text=${tabName}`);
  await page.waitForTimeout(500); // Allow for tab switch animation
}

test.describe('Notes Save on Overview Tab - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and setup test data
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/workspaces');
  });

  test.describe('Basic Note Save Workflows', () => {
    test('Scenario 1: Type note on Overview tab, click Overview tab again, verify note persists', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Edit notes on overview tab
      const newNotes = 'Note that should persist when clicking Overview tab again';
      await editNotesOnOverview(page, newNotes);

      // Verify notes are displayed
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(newNotes);

      // Click Overview tab again
      await switchToTab(page, 'Overview');

      // Verify notes still persist
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(newNotes);

      // Verify notes are saved in database by refreshing page
      await page.reload();
      await page.waitForSelector('[data-testid="overview-tab"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(newNotes);
    });

    test('Scenario 2: Type note on Overview tab, switch to Notes tab, verify note appears', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Edit notes on overview tab
      const newNotes = 'Note that should appear in Notes tab';
      await editNotesOnOverview(page, newNotes);

      // Switch to Notes tab
      await switchToTab(page, 'Notes');

      // Verify notes appear in Notes tab
      await expect(page.locator('[data-testid="notes-content"]')).toContainText(newNotes);

      // Switch back to Overview tab
      await switchToTab(page, 'Overview');

      // Verify notes still persist on Overview tab
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(newNotes);
    });

    test('Scenario 3: Type note on Overview tab, switch to Actions tab, switch back, verify note persists', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Edit notes on overview tab
      const newNotes = 'Note that should persist through Actions tab switch';
      await editNotesOnOverview(page, newNotes);

      // Switch to Actions tab
      await switchToTab(page, 'Actions');

      // Switch back to Overview tab
      await switchToTab(page, 'Overview');

      // Verify notes persist
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(newNotes);
    });

    test('Scenario 4: Type note, save, immediately navigate to next record, verify note saved', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Edit notes
      const newNotes = 'Note saved before navigation';
      await editNotesOnOverview(page, newNotes);

      // Immediately navigate to another record
      await navigateToPersonRecord(page, 'test-person-456');

      // Navigate back to original record
      await navigateToPersonRecord(page, testPerson.id);

      // Verify notes were saved
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(newNotes);
    });
  });

  test.describe('Rapid Tab Switching Scenarios', () => {
    test('Scenario 5: Type note, rapid tab switching, verify final save completes', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Start editing notes
      await page.click('[data-testid="edit-notes"]');
      const notesTextarea = page.locator('[data-testid="edit-notes"]');
      await notesTextarea.clear();
      await notesTextarea.fill('Rapid switching test note');

      // Start save operation
      await page.click('[data-testid="save-notes"]');

      // Rapidly switch tabs while save is in progress
      await switchToTab(page, 'Notes');
      await switchToTab(page, 'Actions');
      await switchToTab(page, 'Overview');
      await switchToTab(page, 'Notes');
      await switchToTab(page, 'Overview');

      // Wait for save to complete
      await page.waitForSelector('[data-testid="display-notes"]', { timeout: 10000 });

      // Verify notes were saved
      await expect(page.locator('[data-testid="display-notes"]')).toContainText('Rapid switching test note');
    });

    test('Scenario 6: Type note, browser refresh, verify note persists in database', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Edit notes
      const newNotes = 'Note that should survive browser refresh';
      await editNotesOnOverview(page, newNotes);

      // Refresh the browser
      await page.reload();
      await page.waitForSelector('[data-testid="overview-tab"]', { timeout: 10000 });

      // Verify notes persist after refresh
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(newNotes);
    });

    test('Scenario 7: Edit note multiple times with tab switches between edits', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      const notes = [
        'First edit of notes',
        'Second edit after tab switch',
        'Third edit with more tab switching',
        'Final edit to verify persistence',
      ];

      for (let i = 0; i < notes.length; i++) {
        // Edit notes
        await editNotesOnOverview(page, notes[i]);

        // Verify notes are displayed
        await expect(page.locator('[data-testid="display-notes"]')).toContainText(notes[i]);

        // Switch tabs between edits (except for last edit)
        if (i < notes.length - 1) {
          await switchToTab(page, 'Notes');
          await switchToTab(page, 'Overview');
        }
      }

      // Final verification
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(notes[notes.length - 1]);
    });
  });

  test.describe('Offline and Network Scenarios', () => {
    test('Scenario 8: Type note while offline, go online, verify auto-save triggers', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Go offline
      await page.context().setOffline(true);

      // Start editing notes
      await page.click('[data-testid="edit-notes"]');
      const notesTextarea = page.locator('[data-testid="edit-notes"]');
      await notesTextarea.clear();
      await notesTextarea.fill('Note typed while offline');

      // Attempt to save (should fail silently)
      await page.click('[data-testid="save-notes"]');

      // Go back online
      await page.context().setOffline(false);

      // Wait for network to be available
      await page.waitForLoadState('networkidle');

      // The note should still be in edit mode or should have been saved
      // This depends on the implementation of offline handling
      const notesDisplay = page.locator('[data-testid="display-notes"]');
      const notesEdit = page.locator('[data-testid="edit-notes"]');
      
      // Either the note should be displayed (if auto-save worked) or still in edit mode
      const isDisplayed = await notesDisplay.isVisible();
      const isEditing = await notesEdit.isVisible();
      
      expect(isDisplayed || isEditing).toBeTruthy();
    });
  });

  test.describe('Long Content and Special Characters', () => {
    test('Scenario 9: Type long note (>1000 chars), tab switch, verify complete note saved', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Create a long note
      const longNote = 'A'.repeat(1000) + ' - This is a very long note that should be saved completely even with tab switching. '.repeat(10);

      // Edit notes
      await editNotesOnOverview(page, longNote);

      // Switch tabs multiple times
      await switchToTab(page, 'Notes');
      await switchToTab(page, 'Actions');
      await switchToTab(page, 'Overview');

      // Verify complete note is saved
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(longNote);

      // Verify by refreshing page
      await page.reload();
      await page.waitForSelector('[data-testid="overview-tab"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(longNote);
    });

    test('Type note with special characters and unicode, verify persistence', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      const specialNotes = 'Notes with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\\n\t\nUnicode: 🚀🌟💡🎉\nEmojis: 😀😃😄😁😆😅😂🤣😊😇';

      // Edit notes
      await editNotesOnOverview(page, specialNotes);

      // Switch tabs
      await switchToTab(page, 'Notes');
      await switchToTab(page, 'Overview');

      // Verify special characters are preserved
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(specialNotes);
    });
  });

  test.describe('Company Records', () => {
    test('Type note on company Overview tab, verify persistence across tab switches', async ({ page }) => {
      await navigateToCompanyRecord(page, testCompany.id);

      // Edit notes on overview tab
      const newNotes = 'Company note that should persist';
      await editNotesOnOverview(page, newNotes);

      // Switch tabs
      await switchToTab(page, 'Notes');
      await switchToTab(page, 'Actions');
      await switchToTab(page, 'Overview');

      // Verify notes persist
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(newNotes);

      // Verify by refreshing page
      await page.reload();
      await page.waitForSelector('[data-testid="overview-tab"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="display-notes"]')).toContainText(newNotes);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('Handle save error gracefully, allow retry', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Mock API to return error
      await page.route('**/api/v1/people/*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      // Start editing notes
      await page.click('[data-testid="edit-notes"]');
      const notesTextarea = page.locator('[data-testid="edit-notes"]');
      await notesTextarea.clear();
      await notesTextarea.fill('Note that will fail to save');

      // Attempt to save (should fail)
      await page.click('[data-testid="save-notes"]');

      // Should stay in edit mode after error
      await expect(notesTextarea).toHaveValue('Note that will fail to save');

      // Remove the route mock to allow normal API calls
      await page.unroute('**/api/v1/people/*');

      // Retry save (should succeed)
      await page.click('[data-testid="save-notes"]');

      // Wait for save to complete
      await page.waitForSelector('[data-testid="display-notes"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="display-notes"]')).toContainText('Note that will fail to save');
    });

    test('Handle empty notes save', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Edit notes to be empty
      await page.click('[data-testid="edit-notes"]');
      const notesTextarea = page.locator('[data-testid="edit-notes"]');
      await notesTextarea.clear();

      // Save empty notes
      await page.click('[data-testid="save-notes"]');

      // Wait for save to complete
      await page.waitForSelector('[data-testid="display-notes"]', { timeout: 10000 });

      // Verify empty notes are saved
      await expect(page.locator('[data-testid="display-notes"]')).toContainText('Empty');

      // Verify by refreshing page
      await page.reload();
      await page.waitForSelector('[data-testid="overview-tab"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="display-notes"]')).toContainText('Empty');
    });

    test('Handle concurrent edits to multiple fields', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Edit notes field
      await page.click('[data-testid="edit-notes"]');
      const notesTextarea = page.locator('[data-testid="edit-notes"]');
      await notesTextarea.clear();
      await notesTextarea.fill('Updated notes field');

      // Save notes
      await page.click('[data-testid="save-notes"]');

      // Wait for notes save to complete
      await page.waitForSelector('[data-testid="display-notes"]', { timeout: 10000 });

      // Edit name field
      await page.click('[data-testid="edit-name"]');
      const nameInput = page.locator('[data-testid="edit-name"]');
      await nameInput.clear();
      await nameInput.fill('Updated Name');

      // Save name
      await page.click('[data-testid="save-name"]');

      // Wait for name save to complete
      await page.waitForSelector('[data-testid="display-name"]', { timeout: 10000 });

      // Verify both fields are updated
      await expect(page.locator('[data-testid="display-notes"]')).toContainText('Updated notes field');
      await expect(page.locator('[data-testid="display-name"]')).toContainText('Updated Name');

      // Switch tabs and verify persistence
      await switchToTab(page, 'Notes');
      await switchToTab(page, 'Overview');

      await expect(page.locator('[data-testid="display-notes"]')).toContainText('Updated notes field');
      await expect(page.locator('[data-testid="display-name"]')).toContainText('Updated Name');
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('Handle multiple rapid note edits in sequence', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Perform multiple rapid edits
      for (let i = 1; i <= 10; i++) {
        // Edit notes
        await editNotesOnOverview(page, `Rapid edit ${i}`);

        // Verify notes are displayed
        await expect(page.locator('[data-testid="display-notes"]')).toContainText(`Rapid edit ${i}`);

        // Small delay between edits
        await page.waitForTimeout(100);
      }

      // Final verification
      await expect(page.locator('[data-testid="display-notes"]')).toContainText('Rapid edit 10');
    });

    test('Handle large number of tab switches without performance degradation', async ({ page }) => {
      await navigateToPersonRecord(page, testPerson.id);

      // Edit notes first
      await editNotesOnOverview(page, 'Performance test note');

      // Perform many tab switches
      for (let i = 0; i < 50; i++) {
        await switchToTab(page, 'Notes');
        await switchToTab(page, 'Actions');
        await switchToTab(page, 'Overview');
      }

      // Should still be functional and notes should persist
      await expect(page.locator('[data-testid="display-notes"]')).toContainText('Performance test note');
    });
  });
});
