/**
 * E2E Tests for Settings Change Password
 * 
 * Tests the complete password change workflow in the settings popup
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  currentPassword: 'CurrentPass123!',
  newPassword: 'NewPassword456!',
  weakPassword: 'weak',
  mismatchedPassword: 'DifferentPass789!'
};

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/sign-in`);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.currentPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/speedrun');
}

// Helper function to open settings popup
async function openSettings(page: Page) {
  // Click on profile/settings button to open settings popup
  await page.click('[data-testid="profile-button"], .profile-button, button:has-text("Settings")');
  await page.waitForSelector('[data-testid="settings-popup"], .settings-popup', { timeout: 5000 });
}

// Helper function to navigate to security tab
async function navigateToSecurityTab(page: Page) {
  await page.click('button:has-text("Security")');
  await page.waitForSelector('h3:has-text("Change Password")', { timeout: 5000 });
}

test.describe('Settings Change Password E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        workspaceId: 'test-workspace-123'
      }));
    });

    // Mock API responses for settings
    await page.route('**/api/settings/user', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            settings: {
              firstName: 'Test',
              lastName: 'User',
              title: 'Test Title',
              department: 'Sales',
              phoneNumber: '+1234567890',
              linkedinUrl: 'https://linkedin.com/in/testuser',
              timezone: 'America/New_York',
              communicationStyle: 'consultative',
              preferredDetailLevel: 'detailed',
              quota: 1000000,
              territory: 'North America',
              dailyActivityTarget: 25
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock password change API
    await page.route('**/api/v1/users/password', async (route) => {
      const request = route.request();
      const body = await request.postDataJSON();
      
      if (body.currentPassword === TEST_USER.currentPassword && 
          body.newPassword === TEST_USER.newPassword &&
          body.confirmPassword === TEST_USER.newPassword) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Password changed successfully'
          })
        });
      } else if (body.currentPassword !== TEST_USER.currentPassword) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Current password is incorrect'
          })
        });
      } else if (body.newPassword !== body.confirmPassword) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'New password and confirmation do not match'
          })
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
          })
        });
      }
    });
  });

  test('should successfully change password with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/speedrun`);
    await openSettings(page);
    await navigateToSecurityTab(page);

    // Click "Change Password" button
    await page.click('button:has-text("Change Password")');

    // Fill in password fields
    await page.fill('input[placeholder*="current password"], input[placeholder*="Current password"]', TEST_USER.currentPassword);
    await page.fill('input[placeholder*="new password"], input[placeholder*="New password"]', TEST_USER.newPassword);
    await page.fill('input[placeholder*="confirm"], input[placeholder*="Confirm"]', TEST_USER.newPassword);

    // Verify password strength indicators appear
    await expect(page.locator('text=At least 8 characters')).toBeVisible();
    await expect(page.locator('text=One uppercase letter')).toBeVisible();
    await expect(page.locator('text=One lowercase letter')).toBeVisible();
    await expect(page.locator('text=One number')).toBeVisible();
    await expect(page.locator('text=One special character')).toBeVisible();

    // Verify password match indicator
    await expect(page.locator('text=Passwords match')).toBeVisible();

    // Submit password change
    await page.click('button:has-text("Change Password"):not(:has-text("Cancel"))');

    // Verify success message
    await expect(page.locator('text=Password updated successfully')).toBeVisible();

    // Verify form is reset
    await expect(page.locator('input[placeholder*="current password"], input[placeholder*="Current password"]')).toHaveValue('');
    await expect(page.locator('input[placeholder*="new password"], input[placeholder*="New password"]')).toHaveValue('');
    await expect(page.locator('input[placeholder*="confirm"], input[placeholder*="Confirm"]')).toHaveValue('');
  });

  test('should show error for incorrect current password', async ({ page }) => {
    await page.goto(`${BASE_URL}/speedrun`);
    await openSettings(page);
    await navigateToSecurityTab(page);

    // Click "Change Password" button
    await page.click('button:has-text("Change Password")');

    // Fill in password fields with wrong current password
    await page.fill('input[placeholder*="current password"], input[placeholder*="Current password"]', 'WrongPassword123!');
    await page.fill('input[placeholder*="new password"], input[placeholder*="New password"]', TEST_USER.newPassword);
    await page.fill('input[placeholder*="confirm"], input[placeholder*="Confirm"]', TEST_USER.newPassword);

    // Submit password change
    await page.click('button:has-text("Change Password"):not(:has-text("Cancel"))');

    // Verify error message
    await expect(page.locator('text=Current password is incorrect')).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto(`${BASE_URL}/speedrun`);
    await openSettings(page);
    await navigateToSecurityTab(page);

    // Click "Change Password" button
    await page.click('button:has-text("Change Password")');

    // Fill in password fields with mismatched passwords
    await page.fill('input[placeholder*="current password"], input[placeholder*="Current password"]', TEST_USER.currentPassword);
    await page.fill('input[placeholder*="new password"], input[placeholder*="New password"]', TEST_USER.newPassword);
    await page.fill('input[placeholder*="confirm"], input[placeholder*="Confirm"]', TEST_USER.mismatchedPassword);

    // Verify password mismatch indicator
    await expect(page.locator('text=Passwords do not match')).toBeVisible();

    // Submit password change
    await page.click('button:has-text("Change Password"):not(:has-text("Cancel"))');

    // Verify error message
    await expect(page.locator('text=New password and confirmation do not match')).toBeVisible();
  });

  test('should show error for weak password', async ({ page }) => {
    await page.goto(`${BASE_URL}/speedrun`);
    await openSettings(page);
    await navigateToSecurityTab(page);

    // Click "Change Password" button
    await page.click('button:has-text("Change Password")');

    // Fill in password fields with weak password
    await page.fill('input[placeholder*="current password"], input[placeholder*="Current password"]', TEST_USER.currentPassword);
    await page.fill('input[placeholder*="new password"], input[placeholder*="New password"]', TEST_USER.weakPassword);
    await page.fill('input[placeholder*="confirm"], input[placeholder*="Confirm"]', TEST_USER.weakPassword);

    // Verify password strength indicators show requirements not met
    await expect(page.locator('text=At least 8 characters').locator('..').locator('text=red')).toBeVisible();

    // Submit password change
    await page.click('button:has-text("Change Password"):not(:has-text("Cancel"))');

    // Verify error message
    await expect(page.locator('text=New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/speedrun`);
    await openSettings(page);
    await navigateToSecurityTab(page);

    // Click "Change Password" button
    await page.click('button:has-text("Change Password")');

    // Fill in a password
    await page.fill('input[placeholder*="new password"], input[placeholder*="New password"]', TEST_USER.newPassword);

    // Verify password is hidden by default
    const passwordInput = page.locator('input[placeholder*="new password"], input[placeholder*="New password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click eye icon to show password
    await page.click('button:has(svg):near(input[placeholder*="new password"], input[placeholder*="New password"])');
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click eye slash icon to hide password
    await page.click('button:has(svg):near(input[placeholder*="new password"], input[placeholder*="New password"])');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should cancel password change and reset form', async ({ page }) => {
    await page.goto(`${BASE_URL}/speedrun`);
    await openSettings(page);
    await navigateToSecurityTab(page);

    // Click "Change Password" button
    await page.click('button:has-text("Change Password")');

    // Fill in password fields
    await page.fill('input[placeholder*="current password"], input[placeholder*="Current password"]', TEST_USER.currentPassword);
    await page.fill('input[placeholder*="new password"], input[placeholder*="New password"]', TEST_USER.newPassword);
    await page.fill('input[placeholder*="confirm"], input[placeholder*="Confirm"]', TEST_USER.newPassword);

    // Click cancel button
    await page.click('button:has-text("Cancel")');

    // Verify form is hidden and reset
    await expect(page.locator('input[placeholder*="current password"], input[placeholder*="Current password"]')).not.toBeVisible();
    await expect(page.locator('button:has-text("Change Password")')).toBeVisible();
  });

  test('should disable submit button when fields are empty', async ({ page }) => {
    await page.goto(`${BASE_URL}/speedrun`);
    await openSettings(page);
    await navigateToSecurityTab(page);

    // Click "Change Password" button
    await page.click('button:has-text("Change Password")');

    // Verify submit button is disabled when fields are empty
    const submitButton = page.locator('button:has-text("Change Password"):not(:has-text("Cancel"))');
    await expect(submitButton).toBeDisabled();

    // Fill in current password only
    await page.fill('input[placeholder*="current password"], input[placeholder*="Current password"]', TEST_USER.currentPassword);
    await expect(submitButton).toBeDisabled();

    // Fill in new password
    await page.fill('input[placeholder*="new password"], input[placeholder*="New password"]', TEST_USER.newPassword);
    await expect(submitButton).toBeDisabled();

    // Fill in confirm password
    await page.fill('input[placeholder*="confirm"], input[placeholder*="Confirm"]', TEST_USER.newPassword);
    await expect(submitButton).toBeEnabled();
  });
});
