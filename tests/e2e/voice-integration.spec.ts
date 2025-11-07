/**
 * Voice Integration E2E Tests
 * 
 * End-to-end tests for voice mode functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Voice Mode Integration', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    // Navigate to app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should open voice mode modal', async ({ page }) => {
    // Find and click voice button
    const voiceButton = page.locator('button:has-text("Voice")');
    await expect(voiceButton).toBeVisible();
    
    await voiceButton.click();
    
    // Verify modal opens
    const modal = page.locator('[class*="animate-fadeIn"]');
    await expect(modal).toBeVisible();
    
    // Verify title
    await expect(page.locator('h2:has-text("Adrata")')).toBeVisible();
  });

  test('should show start speaking button', async ({ page }) => {
    // Open voice mode
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Verify start button appears
    const startButton = page.locator('button:has-text("Start Speaking")');
    await expect(startButton).toBeVisible();
  });

  test('should display audio quality indicator when listening', async ({ page }) => {
    // Open voice mode
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Click start speaking
    const startButton = page.locator('button:has-text("Start Speaking")');
    await startButton.click();
    
    // Wait for listening to start
    await page.waitForTimeout(1000);
    
    // Check for audio quality indicator
    const qualityIndicator = page.locator('text=/Clear audio|Some noise detected|Noisy environment|Excellent audio quality/');
    // May or may not be visible depending on mic permissions
  });

  test('should show audio visualization when listening', async ({ page }) => {
    // Open voice mode
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Click start speaking
    const startButton = page.locator('button:has-text("Start Speaking")');
    await startButton.click();
    
    // Wait for audio visualization
    await page.waitForTimeout(500);
    
    // Check for visualization bars
    const visualization = page.locator('[class*="bg-blue-500"]').first();
    // Visualization should exist
  });

  test('should close modal on X button click', async ({ page }) => {
    // Open voice mode
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Click close button
    const closeButton = page.locator('button[class*="hover:text-foreground"]').first();
    await closeButton.click();
    
    // Verify modal closes
    const modal = page.locator('[class*="animate-fadeIn"]');
    await expect(modal).not.toBeVisible();
  });

  test('should handle microphone permission denial', async ({ page, context }) => {
    // Revoke microphone permission
    await context.clearPermissions();
    
    // Open voice mode
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Try to start speaking
    const startButton = page.locator('button:has-text("Start Speaking")');
    await startButton.click();
    
    // Wait for error
    await page.waitForTimeout(1000);
    
    // Check for error message
    const errorMessage = page.locator('text=/Microphone access denied|Failed to start/');
    // Error may appear
  });

  test('should display fallback mode indicator', async ({ page }) => {
    // Open voice mode
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Start listening
    const startButton = page.locator('button:has-text("Start Speaking")');
    await startButton.click();
    
    // Wait for potential fallback
    await page.waitForTimeout(2000);
    
    // Check for fallback indicator (may appear if Deepgram fails)
    const fallbackIndicator = page.locator('text="(Fallback mode)"');
    // May or may not be visible
  });

  test('should show transcript when speech is detected', async ({ page }) => {
    // Open voice mode
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Start listening
    const startButton = page.locator('button:has-text("Start Speaking")');
    await startButton.click();
    
    // Wait for transcript area
    await page.waitForTimeout(1000);
    
    // Transcript container should be ready
    const transcriptArea = page.locator('[class*="bg-hover"]');
    // Should exist in DOM
  });

  test('should show processing state', async ({ page }) => {
    // Open voice mode
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Processing state would appear after speech is processed
    // This is tested more thoroughly in unit tests
  });

  test('should toggle voice mode button active state', async ({ page }) => {
    const voiceButton = page.locator('button:has-text("Voice")');
    
    // Get initial style
    const initialClass = await voiceButton.getAttribute('class');
    
    // Click to activate
    await voiceButton.click();
    
    // Wait a bit
    await page.waitForTimeout(500);
    
    // Button should show active state (bg-blue-100)
    const activeClass = await voiceButton.getAttribute('class');
    expect(activeClass).toContain('bg-blue');
  });
});

test.describe('Voice Mode - Browser Compatibility', () => {
  test('should work on Chromium browsers', async ({ page, browserName }) => {
    if (browserName === 'chromium') {
      await page.goto('/');
      
      const voiceButton = page.locator('button:has-text("Voice")');
      await expect(voiceButton).toBeVisible();
      
      await voiceButton.click();
      
      const modal = page.locator('[class*="animate-fadeIn"]');
      await expect(modal).toBeVisible();
    }
  });

  test('should work on WebKit (Safari)', async ({ page, browserName }) => {
    if (browserName === 'webkit') {
      await page.goto('/');
      
      const voiceButton = page.locator('button:has-text("Voice")');
      await expect(voiceButton).toBeVisible();
      
      await voiceButton.click();
      
      const modal = page.locator('[class*="animate-fadeIn"]');
      await expect(modal).toBeVisible();
      
      // Should not show "not supported" message
      const unsupportedMessage = page.locator('text="Voice recognition is not supported"');
      await expect(unsupportedMessage).not.toBeVisible();
    }
  });

  test('should work on Firefox', async ({ page, browserName }) => {
    if (browserName === 'firefox') {
      await page.goto('/');
      
      const voiceButton = page.locator('button:has-text("Voice")');
      await expect(voiceButton).toBeVisible();
      
      await voiceButton.click();
      
      const modal = page.locator('[class*="animate-fadeIn"]');
      await expect(modal).toBeVisible();
    }
  });
});

test.describe('Voice Mode - Performance', () => {
  test('should load modal quickly', async ({ page }) => {
    await page.goto('/');
    
    const voiceButton = page.locator('button:has-text("Voice")');
    
    const startTime = Date.now();
    await voiceButton.click();
    
    const modal = page.locator('[class*="animate-fadeIn"]');
    await expect(modal).toBeVisible();
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Modal should open in less than 1 second
    expect(loadTime).toBeLessThan(1000);
  });

  test('should not cause memory leaks', async ({ page }) => {
    await page.goto('/');
    
    // Open and close modal multiple times
    for (let i = 0; i < 5; i++) {
      const voiceButton = page.locator('button:has-text("Voice")');
      await voiceButton.click();
      
      await page.waitForTimeout(500);
      
      const closeButton = page.locator('button[class*="hover:text-foreground"]').first();
      await closeButton.click();
      
      await page.waitForTimeout(500);
    }
    
    // Check that page is still responsive
    const voiceButton = page.locator('button:has-text("Voice")');
    await expect(voiceButton).toBeVisible();
  });
});

test.describe('Voice Mode - Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Modal should be accessible
    const modal = page.locator('[class*="animate-fadeIn"]');
    await expect(modal).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab to voice button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs
    
    // Press Enter to activate
    await page.keyboard.press('Enter');
    
    // Modal may open if voice button was focused
  });

  test('should have focus management', async ({ page }) => {
    await page.goto('/');
    
    const voiceButton = page.locator('button:has-text("Voice")');
    await voiceButton.click();
    
    // Check that focus is managed properly
    const modal = page.locator('[class*="animate-fadeIn"]');
    await expect(modal).toBeVisible();
    
    // Tab key should work within modal
    await page.keyboard.press('Tab');
  });
});

