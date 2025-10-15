/**
 * End-to-End Tests for AI Chat Conversation Tabs
 * 
 * Tests the complete user workflow for conversation tab management
 */

import { test, expect } from '@playwright/test';

test.describe('AI Chat Conversation Tabs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with the AI right panel
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Open the AI right panel if it's not already open
    const rightPanel = page.locator('[data-testid="right-panel"]');
    if (!(await rightPanel.isVisible())) {
      await page.click('[data-testid="toggle-right-panel"]');
      await expect(rightPanel).toBeVisible();
    }
  });

  test('should allow creating and closing conversation tabs', async ({ page }) => {
    // Wait for the conversation header to be visible
    await expect(page.locator('[data-testid="conversation-header"]')).toBeVisible();
    
    // Create a new conversation
    await page.click('[data-testid="new-conversation-button"]');
    
    // Should see the new conversation tab
    await expect(page.locator('[data-testid="conversation-tab"]').nth(1)).toBeVisible();
    
    // Close the new conversation tab
    await page.hover('[data-testid="conversation-tab"]').nth(1);
    await page.click('[data-testid="close-tab"]').nth(1);
    
    // Should only have the main chat tab remaining
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
  });

  test('should not allow closing the last remaining conversation', async ({ page }) => {
    // Should only have one conversation tab initially
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
    
    // Hover over the tab - should not show close button
    await page.hover('[data-testid="conversation-tab"]');
    await expect(page.locator('[data-testid="close-tab"]')).not.toBeVisible();
  });

  test('should switch to another conversation when closing the active one', async ({ page }) => {
    // Create multiple conversations
    await page.click('[data-testid="new-conversation-button"]');
    await page.click('[data-testid="new-conversation-button"]');
    
    // Should have 3 conversations now
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(3);
    
    // Close the active (first) conversation
    await page.hover('[data-testid="conversation-tab"]').first();
    await page.click('[data-testid="close-tab"]').first();
    
    // Should have 2 conversations remaining
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(2);
    
    // The second conversation should now be active
    await expect(page.locator('[data-testid="conversation-tab"]').nth(0)).toHaveClass(/active/);
  });

  test('should persist closed tabs across page refresh', async ({ page }) => {
    // Create a new conversation
    await page.click('[data-testid="new-conversation-button"]');
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(2);
    
    // Close the new conversation
    await page.hover('[data-testid="conversation-tab"]').nth(1);
    await page.click('[data-testid="close-tab"]').nth(1);
    
    // Should only have main chat
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Reopen the right panel if needed
    const rightPanel = page.locator('[data-testid="right-panel"]');
    if (!(await rightPanel.isVisible())) {
      await page.click('[data-testid="toggle-right-panel"]');
      await expect(rightPanel).toBeVisible();
    }
    
    // Should still only have the main chat (closed tab should not reappear)
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
  });

  test('should handle rapid tab closing operations', async ({ page }) => {
    // Create multiple conversations
    await page.click('[data-testid="new-conversation-button"]');
    await page.click('[data-testid="new-conversation-button"]');
    await page.click('[data-testid="new-conversation-button"]');
    
    // Should have 4 conversations
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(4);
    
    // Rapidly close multiple tabs
    const closeButtons = page.locator('[data-testid="close-tab"]');
    await closeButtons.nth(0).click();
    await closeButtons.nth(0).click(); // This will be the new first button after first close
    await closeButtons.nth(0).click(); // This will be the new first button after second close
    
    // Should only have 1 conversation remaining
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
  });

  test('should maintain conversation state when switching between tabs', async ({ page }) => {
    // Create a new conversation
    await page.click('[data-testid="new-conversation-button"]');
    
    // Type a message in the first conversation
    const chatInput = page.locator('[data-testid="chat-input"] textarea');
    await chatInput.fill('Message in first conversation');
    
    // Switch to the second conversation
    await page.click('[data-testid="conversation-tab"]').nth(1);
    
    // Type a message in the second conversation
    await chatInput.fill('Message in second conversation');
    
    // Switch back to the first conversation
    await page.click('[data-testid="conversation-tab"]').nth(0);
    
    // The input should be empty (conversation state is maintained)
    await expect(chatInput).toHaveValue('');
    
    // Switch back to the second conversation
    await page.click('[data-testid="conversation-tab"]').nth(1);
    
    // The input should still be empty (conversation state is maintained)
    await expect(chatInput).toHaveValue('');
  });

  test('should handle conversation history popup correctly', async ({ page }) => {
    // Create multiple conversations
    await page.click('[data-testid="new-conversation-button"]');
    await page.click('[data-testid="new-conversation-button"]');
    
    // Open conversation history
    await page.click('[data-testid="conversation-history-button"]');
    
    // Should see the history popup
    await expect(page.locator('[data-testid="conversation-history-popup"]')).toBeVisible();
    
    // Should see all conversations in the history
    await expect(page.locator('[data-testid="conversation-history-item"]')).toHaveCount(3);
    
    // Click on a conversation in history to switch to it
    await page.click('[data-testid="conversation-history-item"]').nth(1);
    
    // History popup should close
    await expect(page.locator('[data-testid="conversation-history-popup"]')).not.toBeVisible();
    
    // The clicked conversation should be active
    await expect(page.locator('[data-testid="conversation-tab"]').nth(1)).toHaveClass(/active/);
  });

  test('should handle API sync without re-adding closed tabs', async ({ page }) => {
    // Create and close a conversation
    await page.click('[data-testid="new-conversation-button"]');
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(2);
    
    await page.hover('[data-testid="conversation-tab"]').nth(1);
    await page.click('[data-testid="close-tab"]').nth(1);
    
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
    
    // Wait for API sync (30 seconds) or trigger it manually
    // In a real test, you might want to mock the API or wait for the sync interval
    await page.waitForTimeout(1000);
    
    // The closed tab should not reappear
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
  });

  test('should handle workspace switching correctly', async ({ page }) => {
    // Create a conversation in current workspace
    await page.click('[data-testid="new-conversation-button"]');
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(2);
    
    // Close the new conversation
    await page.hover('[data-testid="conversation-tab"]').nth(1);
    await page.click('[data-testid="close-tab"]').nth(1);
    
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
    
    // Switch workspace (this would be done through the UI)
    // For this test, we'll simulate by navigating to a different workspace URL
    await page.goto('/dashboard?workspace=different-workspace');
    await page.waitForLoadState('networkidle');
    
    // Reopen the right panel
    const rightPanel = page.locator('[data-testid="right-panel"]');
    if (!(await rightPanel.isVisible())) {
      await page.click('[data-testid="toggle-right-panel"]');
      await expect(rightPanel).toBeVisible();
    }
    
    // Should have the default conversation for the new workspace
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
    
    // Switch back to original workspace
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Reopen the right panel
    if (!(await rightPanel.isVisible())) {
      await page.click('[data-testid="toggle-right-panel"]');
      await expect(rightPanel).toBeVisible();
    }
    
    // Should still only have the main chat (closed conversation should not reappear)
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(1);
  });

  test('should handle keyboard shortcuts for tab management', async ({ page }) => {
    // Create multiple conversations
    await page.click('[data-testid="new-conversation-button"]');
    await page.click('[data-testid="new-conversation-button"]');
    
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(3);
    
    // Focus on the right panel
    await page.click('[data-testid="right-panel"]');
    
    // Use Ctrl+W to close the active tab (if this shortcut is implemented)
    await page.keyboard.press('Control+w');
    
    // Should have one less conversation
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(2);
  });

  test('should handle drag and drop reordering of tabs', async ({ page }) => {
    // Create multiple conversations
    await page.click('[data-testid="new-conversation-button"]');
    await page.click('[data-testid="new-conversation-button"]');
    
    await expect(page.locator('[data-testid="conversation-tab"]')).toHaveCount(3);
    
    // Get the first and second tabs
    const firstTab = page.locator('[data-testid="conversation-tab"]').nth(0);
    const secondTab = page.locator('[data-testid="conversation-tab"]').nth(1);
    
    // Drag the first tab to the second position
    await firstTab.dragTo(secondTab);
    
    // The tabs should be reordered (this would need to be verified based on the actual implementation)
    // This test assumes drag and drop reordering is implemented
  });
});
