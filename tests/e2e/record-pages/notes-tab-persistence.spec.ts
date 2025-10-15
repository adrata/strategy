/**
 * Notes Tab Persistence End-to-End Tests
 * 
 * Tests the critical fix for notes disappearing when switching tabs.
 * Ensures notes are properly saved and state is preserved during tab navigation.
 */

import { test, expect } from '@playwright/test';

test.describe('Notes Tab Persistence', () => {
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

  test.describe('People Record Notes Persistence', () => {
    test('should preserve notes when switching from Notes to Overview tab', async ({ page }) => {
      // Navigate to people/leads page
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Find and click on a person record
      const personRow = page.locator('[data-testid="person-row"]').first();
      await personRow.click();
      
      // Wait for person detail page to load
      await page.waitForLoadState('networkidle');
      
      // Navigate to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await expect(notesTab).toBeVisible();
      await notesTab.click();
      
      // Wait for notes tab to load
      await page.waitForLoadState('networkidle');
      
      // Find the notes textarea and type some notes
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      const testNotes = 'This is a test note to verify persistence when switching tabs.';
      await notesTextarea.clear();
      await notesTextarea.fill(testNotes);
      
      // Wait for auto-save to complete (1 second debounce + API call)
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );
      
      // Verify save status shows as saved
      await expect(page.locator('text=Last saved')).toBeVisible();
      
      // Switch to Overview tab
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await expect(overviewTab).toBeVisible();
      await overviewTab.click();
      
      // Wait for overview tab to load - should NOT blink or remount
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the overview tab
      await expect(page.locator('[data-testid="overview-tab"]')).toBeVisible();
      
      // Switch back to Notes tab
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      // Verify notes are still there and preserved
      await expect(notesTextarea).toHaveValue(testNotes);
      
      // Verify save status is still showing
      await expect(page.locator('text=Last saved')).toBeVisible();
    });

    test('should auto-save notes while typing and preserve on tab switch', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const personRow = page.locator('[data-testid="person-row"]').first();
      await personRow.click();
      await page.waitForLoadState('networkidle');
      
      // Go to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      // Type notes character by character to test auto-save
      const testNotes = 'Auto-save test notes for tab switching.';
      await notesTextarea.clear();
      
      // Type slowly to trigger multiple auto-saves
      for (let i = 0; i < testNotes.length; i++) {
        await notesTextarea.type(testNotes[i]);
        await page.waitForTimeout(100); // Small delay between characters
      }
      
      // Wait for final auto-save
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );
      
      // Switch to Overview tab
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await overviewTab.click();
      await page.waitForLoadState('networkidle');
      
      // Switch back to Notes tab
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      // Verify all typed notes are preserved
      await expect(notesTextarea).toHaveValue(testNotes);
    });

    test('should save notes immediately on blur and preserve on tab switch', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const personRow = page.locator('[data-testid="person-row"]').first();
      await personRow.click();
      await page.waitForLoadState('networkidle');
      
      // Go to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      // Type notes
      const testNotes = 'Blur save test notes.';
      await notesTextarea.clear();
      await notesTextarea.fill(testNotes);
      
      // Blur the textarea to trigger immediate save
      await notesTextarea.blur();
      
      // Wait for immediate save on blur
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );
      
      // Switch to Overview tab
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await overviewTab.click();
      await page.waitForLoadState('networkidle');
      
      // Switch back to Notes tab
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      // Verify notes are preserved
      await expect(notesTextarea).toHaveValue(testNotes);
    });

    test('should preserve notes across page reload', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const personRow = page.locator('[data-testid="person-row"]').first();
      await personRow.click();
      await page.waitForLoadState('networkidle');
      
      // Go to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      // Type and save notes
      const testNotes = 'Notes that should persist across page reload.';
      await notesTextarea.clear();
      await notesTextarea.fill(testNotes);
      
      // Wait for auto-save
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Go back to Notes tab
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      // Verify notes persisted across reload
      await expect(notesTextarea).toHaveValue(testNotes);
    });
  });

  test.describe('Company Record Notes Persistence', () => {
    test('should preserve notes when switching tabs for company records', async ({ page }) => {
      // Navigate to companies page
      await page.goto('/companies');
      await page.waitForLoadState('networkidle');
      
      // Find and click on a company record
      const companyRow = page.locator('[data-testid="company-row"]').first();
      await companyRow.click();
      
      // Wait for company detail page to load
      await page.waitForLoadState('networkidle');
      
      // Navigate to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await expect(notesTab).toBeVisible();
      await notesTab.click();
      
      // Wait for notes tab to load
      await page.waitForLoadState('networkidle');
      
      // Find the notes textarea and type some notes
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      const testNotes = 'Company notes test for tab switching persistence.';
      await notesTextarea.clear();
      await notesTextarea.fill(testNotes);
      
      // Wait for auto-save to complete
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/companies/') && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );
      
      // Switch to Overview tab
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await overviewTab.click();
      await page.waitForLoadState('networkidle');
      
      // Switch back to Notes tab
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      // Verify notes are preserved
      await expect(notesTextarea).toHaveValue(testNotes);
    });
  });

  test.describe('Speedrun Workflow Notes Persistence', () => {
    test('should preserve notes in speedrun workflow when switching tabs', async ({ page }) => {
      // Navigate to speedrun
      await page.goto('/speedrun');
      await page.waitForLoadState('networkidle');
      
      // Wait for lead to load
      await page.waitForSelector('[data-testid="speedrun-lead-details"]');
      
      // Go to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      // Type notes
      const testNotes = 'Speedrun workflow notes test.';
      await notesTextarea.clear();
      await notesTextarea.fill(testNotes);
      
      // Wait for auto-save
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );
      
      // Switch to Overview tab
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await overviewTab.click();
      await page.waitForLoadState('networkidle');
      
      // Switch back to Notes tab
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      // Verify notes are preserved
      await expect(notesTextarea).toHaveValue(testNotes);
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle rapid tab switching while typing', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const personRow = page.locator('[data-testid="person-row"]').first();
      await personRow.click();
      await page.waitForLoadState('networkidle');
      
      // Go to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      // Start typing
      await notesTextarea.clear();
      await notesTextarea.type('Rapid switching test');
      
      // Rapidly switch tabs while typing
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await overviewTab.click();
      await page.waitForTimeout(100);
      await notesTab.click();
      await page.waitForTimeout(100);
      await overviewTab.click();
      await page.waitForTimeout(100);
      await notesTab.click();
      
      // Wait for any pending saves
      await page.waitForTimeout(2000);
      
      // Verify notes are still there
      await expect(notesTextarea).toHaveValue('Rapid switching test');
    });

    test('should handle very long notes (1000+ characters)', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const personRow = page.locator('[data-testid="person-row"]').first();
      await personRow.click();
      await page.waitForLoadState('networkidle');
      
      // Go to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      // Create very long notes
      const longNotes = 'A'.repeat(1000) + ' - This is a very long note to test persistence.';
      await notesTextarea.clear();
      await notesTextarea.fill(longNotes);
      
      // Wait for auto-save
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );
      
      // Switch tabs
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await overviewTab.click();
      await page.waitForLoadState('networkidle');
      
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      // Verify long notes are preserved
      await expect(notesTextarea).toHaveValue(longNotes);
    });

    test('should handle special characters and unicode in notes', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const personRow = page.locator('[data-testid="person-row"]').first();
      await personRow.click();
      await page.waitForLoadState('networkidle');
      
      // Go to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      // Type notes with special characters and unicode
      const specialNotes = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~` and unicode: 中文, العربية, русский, 日本語';
      await notesTextarea.clear();
      await notesTextarea.fill(specialNotes);
      
      // Wait for auto-save
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH' &&
        response.status() === 200
      );
      
      // Switch tabs
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await overviewTab.click();
      await page.waitForLoadState('networkidle');
      
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      // Verify special characters and unicode are preserved
      await expect(notesTextarea).toHaveValue(specialNotes);
    });

    test('should handle API errors gracefully and preserve notes', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/v1/people/*', route => {
        if (route.request().method() === 'PATCH') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' })
          });
        } else {
          route.continue();
        }
      });
      
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const personRow = page.locator('[data-testid="person-row"]').first();
      await personRow.click();
      await page.waitForLoadState('networkidle');
      
      // Go to Notes tab
      const notesTab = page.locator('[data-testid="tab-notes"]');
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      const notesTextarea = page.locator('[data-testid="notes-textarea"]');
      await expect(notesTextarea).toBeVisible();
      
      // Type notes
      const testNotes = 'Notes that should be preserved even with API errors.';
      await notesTextarea.clear();
      await notesTextarea.fill(testNotes);
      
      // Wait for failed save attempt
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/people/') && 
        response.request().method() === 'PATCH' &&
        response.status() === 500
      );
      
      // Verify error status is shown
      await expect(page.locator('text=Save failed')).toBeVisible();
      
      // Switch tabs
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await overviewTab.click();
      await page.waitForLoadState('networkidle');
      
      await notesTab.click();
      await page.waitForLoadState('networkidle');
      
      // Verify notes are still preserved despite API error
      await expect(notesTextarea).toHaveValue(testNotes);
    });
  });
});
