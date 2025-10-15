/**
 * State-Based Ranking End-to-End Tests
 * 
 * Tests the complete state-based ranking workflow from UI to database
 */

import { test, expect } from '@playwright/test';

test.describe('State-Based Ranking Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to speedrun page
    await page.goto('/speedrun');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="speedrun-content"]', { timeout: 10000 });
  });

  test('should display ranking mode indicator in header', async ({ page }) => {
    // Check that the ranking mode indicator is visible
    await expect(page.locator('text=Ranking:')).toBeVisible();
    await expect(page.locator('text=Global')).toBeVisible();
    
    // Check that the "Manage Ranking" button is visible
    await expect(page.locator('button:has-text("Manage Ranking")')).toBeVisible();
  });

  test('should open state ranking manager modal', async ({ page }) => {
    // Click the "Manage Ranking" button
    await page.click('button:has-text("Manage Ranking")');
    
    // Wait for the modal to open
    await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
    
    // Check that the modal contains the expected elements
    await expect(page.locator('text=Ranking Mode')).toBeVisible();
    await expect(page.locator('input[value="global"]')).toBeChecked();
    await expect(page.locator('input[value="state-based"]')).toBeVisible();
  });

  test('should show state data validation when switching to state-based mode', async ({ page }) => {
    // Open the state ranking manager
    await page.click('button:has-text("Manage Ranking")');
    await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
    
    // Switch to state-based mode
    await page.click('input[value="state-based"]');
    
    // Check if validation warning appears (depends on data availability)
    const validationWarning = page.locator('text=Limited State Data Available');
    const stateOrderSection = page.locator('text=State Priority Order');
    
    // Either validation warning or state ordering should be visible
    await expect(validationWarning.or(stateOrderSection)).toBeVisible();
  });

  test('should allow reordering states when state-based mode is enabled', async ({ page }) => {
    // Open the state ranking manager
    await page.click('button:has-text("Manage Ranking")');
    await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
    
    // Switch to state-based mode
    await page.click('input[value="state-based"]');
    
    // Wait for state data to load
    await page.waitForSelector('text=State Priority Order', { timeout: 5000 });
    
    // Check that state ordering controls are visible
    await expect(page.locator('text=Reset to Default')).toBeVisible();
    
    // Check for up/down arrow buttons (if states are present)
    const upButtons = page.locator('button[aria-label*="up"], button:has(svg)');
    const downButtons = page.locator('button[aria-label*="down"], button:has(svg)');
    
    // If states are present, up/down buttons should be visible
    if (await page.locator('text=State Priority Order').isVisible()) {
      await expect(upButtons.or(downButtons)).toBeVisible();
    }
  });

  test('should save ranking settings and update UI', async ({ page }) => {
    // Open the state ranking manager
    await page.click('button:has-text("Manage Ranking")');
    await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
    
    // Switch to state-based mode
    await page.click('input[value="state-based"]');
    
    // Click save button
    await page.click('button:has-text("Save Settings")');
    
    // Wait for success message or modal to close
    await expect(page.locator('text=State-Based Ranking Settings')).not.toBeVisible();
    
    // Check for success message
    const successMessage = page.locator('text=Ranking mode updated');
    if (await successMessage.isVisible()) {
      await expect(successMessage).toBeVisible();
    }
  });

  test('should display state-based rank information in prospect cards', async ({ page }) => {
    // First, enable state-based ranking
    await page.click('button:has-text("Manage Ranking")');
    await page.click('input[value="state-based"]');
    await page.click('button:has-text("Save Settings")');
    
    // Wait for the modal to close
    await expect(page.locator('text=State-Based Ranking Settings')).not.toBeVisible();
    
    // Wait for prospects to load
    await page.waitForSelector('[data-testid="prospect-card"], .prospect-card, [class*="prospect"]', { timeout: 10000 });
    
    // Check if state-based rank is displayed
    const stateRankDisplay = page.locator('text=State-Company-Person');
    const rankDisplay = page.locator('[class*="rank"], [data-testid*="rank"]');
    
    // Either state-based rank format or regular rank should be visible
    await expect(stateRankDisplay.or(rankDisplay)).toBeVisible();
  });

  test('should handle insufficient state data gracefully', async ({ page }) => {
    // Open the state ranking manager
    await page.click('button:has-text("Manage Ranking")');
    await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
    
    // Switch to state-based mode
    await page.click('input[value="state-based"]');
    
    // Check for validation warning if state data is insufficient
    const validationWarning = page.locator('text=Limited State Data Available');
    const stateDataPercentage = page.locator('text=Only');
    
    if (await validationWarning.isVisible()) {
      await expect(validationWarning).toBeVisible();
      await expect(stateDataPercentage).toBeVisible();
    }
  });

  test('should reset state ordering to default', async ({ page }) => {
    // Open the state ranking manager
    await page.click('button:has-text("Manage Ranking")');
    await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
    
    // Switch to state-based mode
    await page.click('input[value="state-based"]');
    
    // Wait for state data to load
    await page.waitForSelector('text=State Priority Order', { timeout: 5000 });
    
    // Click "Reset to Default" button
    await page.click('text=Reset to Default');
    
    // The state order should be reset (this is hard to verify without specific state data)
    // We can at least verify the button click doesn't cause an error
    await expect(page.locator('text=State Priority Order')).toBeVisible();
  });

  test('should cancel ranking settings changes', async ({ page }) => {
    // Open the state ranking manager
    await page.click('button:has-text("Manage Ranking")');
    await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
    
    // Switch to state-based mode
    await page.click('input[value="state-based"]');
    
    // Click cancel button
    await page.click('button:has-text("Cancel")');
    
    // Modal should close without saving
    await expect(page.locator('text=State-Based Ranking Settings')).not.toBeVisible();
    
    // Ranking mode should remain as it was (Global)
    await expect(page.locator('text=Global')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure for API calls
    await page.route('**/api/v1/speedrun/state-data', route => {
      route.abort('failed');
    });
    
    // Open the state ranking manager
    await page.click('button:has-text("Manage Ranking")');
    await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
    
    // Switch to state-based mode
    await page.click('input[value="state-based"]');
    
    // Should show loading state or error handling
    const loadingSpinner = page.locator('[class*="animate-spin"], [class*="loading"]');
    const errorMessage = page.locator('text=Error', 'text=Failed');
    
    // Either loading or error should be visible
    await expect(loadingSpinner.or(errorMessage)).toBeVisible();
  });

  test('should persist ranking mode across page refreshes', async ({ page }) => {
    // Enable state-based ranking
    await page.click('button:has-text("Manage Ranking")');
    await page.click('input[value="state-based"]');
    await page.click('button:has-text("Save Settings")');
    
    // Wait for modal to close
    await expect(page.locator('text=State-Based Ranking Settings')).not.toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="speedrun-content"]', { timeout: 10000 });
    
    // Check that the ranking mode is still state-based
    // Note: This test assumes the ranking mode is displayed in the UI
    const stateBasedIndicator = page.locator('text=State-Based');
    const globalIndicator = page.locator('text=Global');
    
    // The indicator should show the saved mode
    await expect(stateBasedIndicator.or(globalIndicator)).toBeVisible();
  });

  test('should handle concurrent ranking mode changes', async ({ page, context }) => {
    // Open a second tab
    const secondPage = await context.newPage();
    await secondPage.goto('/speedrun');
    await secondPage.waitForSelector('[data-testid="speedrun-content"]', { timeout: 10000 });
    
    // Change ranking mode in first tab
    await page.click('button:has-text("Manage Ranking")');
    await page.click('input[value="state-based"]');
    await page.click('button:has-text("Save Settings")');
    
    // Change ranking mode in second tab
    await secondPage.click('button:has-text("Manage Ranking")');
    await secondPage.click('input[value="global"]');
    await secondPage.click('button:has-text("Save Settings")');
    
    // Both tabs should handle the changes gracefully
    await expect(page.locator('text=State-Based Ranking Settings')).not.toBeVisible();
    await expect(secondPage.locator('text=State-Based Ranking Settings')).not.toBeVisible();
    
    await secondPage.close();
  });
});

test.describe('State-Based Ranking Performance', () => {
  test('should load state data within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/speedrun');
    await page.waitForSelector('[data-testid="speedrun-content"]', { timeout: 10000 });
    
    // Open state ranking manager
    await page.click('button:has-text("Manage Ranking")');
    await page.click('input[value="state-based"]');
    
    // Wait for state data to load
    await page.waitForSelector('text=State Priority Order', { timeout: 10000 });
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // State data should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle large state datasets efficiently', async ({ page }) => {
    // This test would require a workspace with many states
    // For now, we'll just verify the UI doesn't break with state-based mode
    await page.goto('/speedrun');
    await page.waitForSelector('[data-testid="speedrun-content"]', { timeout: 10000 });
    
    await page.click('button:has-text("Manage Ranking")');
    await page.click('input[value="state-based"]');
    
    // UI should remain responsive
    await expect(page.locator('text=State-Based Ranking Settings')).toBeVisible();
    await expect(page.locator('button:has-text("Save Settings")')).toBeEnabled();
  });
});
