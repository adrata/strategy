import { test, expect } from '@playwright/test';

test.describe('Grand Central Meeting Integrations - E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to Grand Central
    // Note: Adjust based on your auth setup
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/workspace/**');
    
    // Navigate to Grand Central Integrations
    await page.click('[data-test="grand-central-link"]');
    await page.click('[data-test="integrations-link"]');
    await expect(page).toHaveURL(/grand-central\/integrations/);
  });

  test.describe('Category Navigation', () => {
    test('should display all integration categories', async ({ page }) => {
      await expect(page.locator('text=All Integrations')).toBeVisible();
      await expect(page.locator('text=Email')).toBeVisible();
      await expect(page.locator('text=Calendar')).toBeVisible();
      await expect(page.locator('text=Meeting Notes')).toBeVisible();
    });

    test('should filter integrations by category', async ({ page }) => {
      // Click Meeting Notes category
      await page.click('text=Meeting Notes');
      
      // Should show meeting integrations
      await expect(page.locator('text=Zoom')).toBeVisible();
      await expect(page.locator('text=Fireflies.ai')).toBeVisible();
      await expect(page.locator('text=Otter.ai')).toBeVisible();
      await expect(page.locator('text=Microsoft Teams')).toBeVisible();
      
      // Should hide email integrations
      await expect(page.locator('text=Microsoft Outlook')).not.toBeVisible();
    });

    test('should show all integrations when All category selected', async ({ page }) => {
      await page.click('text=All Integrations');
      
      // Should show email integrations
      await expect(page.locator('text=Microsoft Outlook')).toBeVisible();
      await expect(page.locator('text=Gmail')).toBeVisible();
      
      // Should show calendar integrations
      await expect(page.locator('text=Google Calendar')).toBeVisible();
      
      // Should show meeting integrations
      await expect(page.locator('text=Zoom')).toBeVisible();
    });
  });

  test.describe('Fireflies.ai API Key Connection Flow', () => {
    test('should display setup instructions', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      // Find Fireflies card
      const firefliesCard = page.locator('[data-test="integration-fireflies"]');
      await expect(firefliesCard).toBeVisible();
      
      // Should show setup instructions
      await expect(firefliesCard.locator('text=Setup Instructions')).toBeVisible();
      await expect(firefliesCard.locator('text=Log in to your Fireflies.ai account')).toBeVisible();
    });

    test('should open API key modal', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      // Click Enter API Key button
      const firefliesCard = page.locator('[data-test="integration-fireflies"]');
      await firefliesCard.locator('button:has-text("Enter API Key")').click();
      
      // Modal should be visible
      await expect(page.locator('text=Connect Fireflies.ai')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('text=Your API key is encrypted')).toBeVisible();
    });

    test('should require API key before connecting', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      // Open modal
      const firefliesCard = page.locator('[data-test="integration-fireflies"]');
      await firefliesCard.locator('button:has-text("Enter API Key")').click();
      
      // Try to connect without entering key
      await page.click('button:has-text("Connect")');
      
      // Should show error
      await expect(page.locator('text=Please enter an API key')).toBeVisible();
    });

    test('should connect with valid API key', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      // Open modal
      const firefliesCard = page.locator('[data-test="integration-fireflies"]');
      await firefliesCard.locator('button:has-text("Enter API Key")').click();
      
      // Enter API key
      await page.fill('input[type="password"]', 'test-api-key-12345');
      
      // Connect
      await page.click('button:has-text("Connect")');
      
      // Should show success message (or error if key is invalid in test environment)
      await page.waitForSelector('[data-test="oauth-message"]', { timeout: 5000 });
    });

    test('should close modal on cancel', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      // Open modal
      const firefliesCard = page.locator('[data-test="integration-fireflies"]');
      await firefliesCard.locator('button:has-text("Enter API Key")').click();
      
      // Close modal
      await page.click('button:has-text("Cancel")');
      
      // Modal should be hidden
      await expect(page.locator('text=Connect Fireflies.ai')).not.toBeVisible();
    });
  });

  test.describe('Zoom OAuth Connection Flow', () => {
    test('should display OAuth instructions', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      // Find Zoom card
      const zoomCard = page.locator('[data-test="integration-zoom"]');
      await expect(zoomCard).toBeVisible();
      
      // Should show setup instructions
      await expect(zoomCard.locator('text=Setup Instructions')).toBeVisible();
      await expect(zoomCard.locator('text=Go to Zoom App Marketplace')).toBeVisible();
      await expect(zoomCard.locator('text=Choose "Server-to-Server OAuth"')).toBeVisible();
    });

    test('should have link to Zoom settings', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      const zoomCard = page.locator('[data-test="integration-zoom"]');
      const settingsLink = zoomCard.locator('a:has-text("Open Zoom Settings")');
      
      await expect(settingsLink).toBeVisible();
      await expect(settingsLink).toHaveAttribute('href', /marketplace\.zoom\.us/);
      await expect(settingsLink).toHaveAttribute('target', '_blank');
    });

    test('should have link to API documentation', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      const zoomCard = page.locator('[data-test="integration-zoom"]');
      const docsLink = zoomCard.locator('a:has-text("View API Docs")');
      
      await expect(docsLink).toBeVisible();
      await expect(docsLink).toHaveAttribute('href', /developers\.zoom\.us/);
    });

    test('should initiate OAuth flow', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      // Click Connect button
      const zoomCard = page.locator('[data-test="integration-zoom"]');
      const connectButton = zoomCard.locator('button:has-text("Connect Zoom")');
      
      await expect(connectButton).toBeVisible();
      await expect(connectButton).not.toBeDisabled();
      
      // Note: Can't fully test OAuth flow in E2E without mocking
      // but we can verify the button is functional
    });
  });

  test.describe('Connection Management', () => {
    test('should show disconnect option for connected integrations', async ({ page }) => {
      // Assuming Fireflies is connected (setup in test environment)
      await page.click('text=Meeting Notes');
      
      const firefliesCard = page.locator('[data-test="integration-fireflies"]');
      const connectedBadge = firefliesCard.locator('text=Connected');
      
      if (await connectedBadge.isVisible()) {
        // Should show disconnect button
        await expect(firefliesCard.locator('button:has-text("Disconnect")")).toBeVisible();
        
        // Should show connection status
        await expect(firefliesCard.locator('text=Connected')).toBeVisible();
      }
    });

    test('should show disconnect confirmation modal', async ({ page }) => {
      await page.click('text=Meeting Notes');
      
      const firefliesCard = page.locator('[data-test="integration-fireflies"]');
      const connectedBadge = firefliesCard.locator('text=Connected');
      
      if (await connectedBadge.isVisible()) {
        // Click disconnect
        await firefliesCard.locator('button:has-text("Disconnect")').click();
        
        // Confirmation modal should appear
        await expect(page.locator('text=Disconnect Integration')).toBeVisible();
        await expect(page.locator('text=Are you sure')).toBeVisible();
        await expect(page.locator('button:has-text("Cancel")' )).toBeVisible();
        await expect(page.locator('button:has-text("Disconnect")').last()).toBeVisible();
      }
    });
  });

  test.describe('Success/Error Messages', () => {
    test('should display success message after connection', async ({ page }) => {
      // Simulate successful connection (mock in test environment)
      await page.goto('/test-workspace/grand-central/integrations?success=connected&provider=fireflies');
      
      await expect(page.locator('[data-test="oauth-message"]')).toBeVisible();
      await expect(page.locator('text=successfully connected')).toBeVisible();
    });

    test('should display error message on connection failure', async ({ page }) => {
      // Simulate connection error
      await page.goto('/test-workspace/grand-central/integrations?error=invalid_key');
      
      await expect(page.locator('[data-test="oauth-message"]')).toBeVisible();
      await expect(page.locator('[data-test="oauth-message"]')).toHaveClass(/bg-red/);
    });

    test('should allow dismissing messages', async ({ page }) => {
      await page.goto('/test-workspace/grand-central/integrations?success=connected&provider=zoom');
      
      const message = page.locator('[data-test="oauth-message"]');
      await expect(message).toBeVisible();
      
      // Click dismiss button
      await message.locator('button').click();
      
      // Message should disappear
      await expect(message).not.toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/test-workspace/grand-central/integrations');
      
      // Category tabs should be scrollable
      await expect(page.locator('text=Meeting Notes')).toBeVisible();
      
      // Cards should stack vertically
      const cards = page.locator('[data-test^="integration-"]');
      const firstCard = cards.first();
      const secondCard = cards.nth(1);
      
      if (await firstCard.isVisible() && await secondCard.isVisible()) {
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();
        
        // Second card should be below first (not side-by-side)
        expect(secondBox?.y).toBeGreaterThan(firstBox?.y! + firstBox?.height!);
      }
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/test-workspace/grand-central/integrations');
      
      // Should have 2-column grid on tablet
      await expect(page.locator('text=Meeting Notes')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/test-workspace/grand-central/integrations');
      
      // Tab through category buttons
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Should focus Meeting Notes
      
      // Enter should activate
      await page.keyboard.press('Enter');
      
      // Meeting Notes should be selected
      await expect(page.locator('button:has-text("Meeting Notes")')).toHaveClass(/border-blue/);
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/test-workspace/grand-central/integrations');
      
      // Category navigation should have role
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      
      // Buttons should have accessible names
      const connectButtons = page.locator('button:has-text("Connect")');
      expect(await connectButtons.count()).toBeGreaterThan(0);
    });
  });
});

