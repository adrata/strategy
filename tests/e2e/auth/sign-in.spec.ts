/**
 * E2E Tests: Sign-In Journey
 * 
 * End-to-end tests for the complete sign-in user journey
 */

import { test, expect } from '@playwright/test';

test.describe('Sign-In E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('/sign-in');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load and Rendering', () => {
    test('loads sign-in page successfully', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Sign In.*Adrata/);
      
      // Check main heading
      await expect(page.getByRole('heading', { name: 'Adrata Sign In' })).toBeVisible();
      
      // Check form elements
      await expect(page.getByLabel('Username or Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByLabel('Remember me')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
      
      // Check demo link
      await expect(page.getByText("Don't have an account yet?")).toBeVisible();
      await expect(page.getByText('Get a demo')).toBeVisible();
    });

    test('displays correct button text without keyboard shortcut', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: 'Start' });
      
      // Button should show "Start" without any keyboard shortcut hint
      await expect(submitButton).toHaveText('Start');
      
      // Ensure no keyboard shortcut symbols are present
      const buttonText = await submitButton.textContent();
      expect(buttonText).not.toMatch(/⌘|Ctrl|Enter|⏎/);
    });

    test('has proper form structure and accessibility', async ({ page }) => {
      // Check form element
      const form = page.locator('form');
      await expect(form).toBeVisible();
      
      // Check input labels and associations
      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const rememberMeCheckbox = page.getByLabel('Remember me');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(rememberMeCheckbox).toBeVisible();
      
      // Check input attributes
      await expect(emailInput).toHaveAttribute('type', 'text');
      await expect(emailInput).toHaveAttribute('required');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(passwordInput).toHaveAttribute('required');
    });
  });

  test.describe('Form Interaction', () => {
    test('allows user to input email and password', async ({ page }) => {
      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('password123');
      
      await expect(emailInput).toHaveValue('test@adrata.com');
      await expect(passwordInput).toHaveValue('password123');
    });

    test('allows user to toggle remember me checkbox', async ({ page }) => {
      const rememberMeCheckbox = page.getByLabel('Remember me');
      
      // Initially unchecked
      await expect(rememberMeCheckbox).not.toBeChecked();
      
      // Click to check
      await rememberMeCheckbox.check();
      await expect(rememberMeCheckbox).toBeChecked();
      
      // Click to uncheck
      await rememberMeCheckbox.uncheck();
      await expect(rememberMeCheckbox).not.toBeChecked();
    });

    test('submit button is enabled when form has content', async ({ page }) => {
      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Start' });
      
      // Button should be enabled initially
      await expect(submitButton).toBeEnabled();
      
      // Fill form
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('password123');
      
      // Button should still be enabled
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Form Submission', () => {
    test('shows loading state during form submission', async ({ page }) => {
      // Mock successful authentication response
      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'test-user-id',
              email: 'test@adrata.com',
              name: 'Test User',
              activeWorkspaceId: 'test-workspace-id',
              workspaces: [{ id: 'test-workspace-id', name: 'Test Workspace', role: 'admin' }],
            },
            accessToken: 'mock-token',
            redirectTo: '/speedrun',
          }),
        });
      });

      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Start' });
      
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('password123');
      
      // Click submit and check loading state
      await submitButton.click();
      
      // Check loading state appears
      await expect(submitButton).toHaveText('Starting...');
      await expect(submitButton).toBeDisabled();
      await expect(emailInput).toBeDisabled();
      await expect(passwordInput).toBeDisabled();
    });

    test('displays error message on authentication failure', async ({ page }) => {
      // Mock authentication failure response
      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid credentials',
          }),
        });
      });

      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Start' });
      
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('wrongpassword');
      await submitButton.click();
      
      // Check error message appears
      await expect(page.getByText('Invalid credentials')).toBeVisible();
      
      // Check form is re-enabled after error
      await expect(submitButton).toHaveText('Start');
      await expect(submitButton).toBeEnabled();
      await expect(emailInput).toBeEnabled();
      await expect(passwordInput).toBeEnabled();
    });

    test('handles network errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/api/auth/sign-in', async (route) => {
        await route.abort('failed');
      });

      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Start' });
      
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('password123');
      await submitButton.click();
      
      // Check error message appears
      await expect(page.getByText('An unexpected error occurred. Please try again.')).toBeVisible();
    });

    test('redirects to correct page on successful authentication', async ({ page }) => {
      // Mock successful authentication response
      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'test-user-id',
              email: 'test@adrata.com',
              name: 'Test User',
              activeWorkspaceId: 'test-workspace-id',
              workspaces: [{ id: 'test-workspace-id', name: 'Test Workspace', role: 'admin' }],
            },
            accessToken: 'mock-token',
            redirectTo: '/speedrun',
          }),
        });
      });

      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Start' });
      
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('password123');
      await submitButton.click();
      
      // Check redirect occurs
      await page.waitForURL('**/speedrun', { timeout: 5000 });
      expect(page.url()).toContain('/speedrun');
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('does NOT trigger form submission with Command+Enter', async ({ page }) => {
      // Mock authentication endpoint to track calls
      let authCallCount = 0;
      await page.route('**/api/auth/sign-in', async (route) => {
        authCallCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'test-user-id', email: 'test@adrata.com' },
            accessToken: 'mock-token',
            redirectTo: '/speedrun',
          }),
        });
      });

      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('password123');
      
      // Simulate Command+Enter keypress
      await page.keyboard.press('Meta+Enter');
      
      // Wait a bit to ensure no submission occurred
      await page.waitForTimeout(500);
      
      // No authentication call should have been made
      expect(authCallCount).toBe(0);
    });

    test('does NOT trigger form submission with Ctrl+Enter', async ({ page }) => {
      // Mock authentication endpoint to track calls
      let authCallCount = 0;
      await page.route('**/api/auth/sign-in', async (route) => {
        authCallCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'test-user-id', email: 'test@adrata.com' },
            accessToken: 'mock-token',
            redirectTo: '/speedrun',
          }),
        });
      });

      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('password123');
      
      // Simulate Ctrl+Enter keypress
      await page.keyboard.press('Control+Enter');
      
      // Wait a bit to ensure no submission occurred
      await page.waitForTimeout(500);
      
      // No authentication call should have been made
      expect(authCallCount).toBe(0);
    });

    test('allows normal Enter key to submit form when focused on submit button', async ({ page }) => {
      // Mock successful authentication response
      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'test-user-id',
              email: 'test@adrata.com',
              name: 'Test User',
              activeWorkspaceId: 'test-workspace-id',
              workspaces: [{ id: 'test-workspace-id', name: 'Test Workspace', role: 'admin' }],
            },
            accessToken: 'mock-token',
            redirectTo: '/speedrun',
          }),
        });
      });

      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Start' });
      
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('password123');
      
      // Focus submit button and press Enter
      await submitButton.focus();
      await page.keyboard.press('Enter');
      
      // Check redirect occurs
      await page.waitForURL('**/speedrun', { timeout: 5000 });
      expect(page.url()).toContain('/speedrun');
    });
  });

  test.describe('Error Handling', () => {
    test('keeps error message visible until next form submission', async ({ page }) => {
      // Mock authentication failure response
      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid credentials',
          }),
        });
      });

      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Start' });
      
      // Submit with invalid credentials
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('wrongpassword');
      await submitButton.click();
      
      // Check error message appears
      await expect(page.getByText('Invalid credentials')).toBeVisible();
      
      // Start typing again - error should remain visible
      await emailInput.clear();
      await emailInput.fill('new@adrata.com');
      
      // Error should still be visible (component doesn't clear on typing)
      await expect(page.getByText('Invalid credentials')).toBeVisible();
    });

    test('handles multiple rapid form submissions gracefully', async ({ page }) => {
      // Mock authentication endpoint with delay
      await page.route('**/api/auth/sign-in', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'test-user-id', email: 'test@adrata.com' },
            accessToken: 'mock-token',
            redirectTo: '/speedrun',
          }),
        });
      });

      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const submitButton = page.getByRole('button', { name: 'Start' });
      
      await emailInput.fill('test@adrata.com');
      await passwordInput.fill('password123');
      
      // Click submit multiple times rapidly
      await submitButton.click();
      await submitButton.click();
      await submitButton.click();
      
      // Should show loading state
      await expect(submitButton).toHaveText('Starting...');
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Navigation', () => {
    test('forgot password link navigates to reset password page', async ({ page }) => {
      const forgotPasswordLink = page.getByText('Forgot password?');
      
      await forgotPasswordLink.click();
      
      // Check navigation to reset password page
      await page.waitForURL('**/reset-password');
      expect(page.url()).toContain('/reset-password');
    });

    test('demo link navigates to demo page', async ({ page }) => {
      const demoLink = page.getByText('Get a demo');
      
      await demoLink.click();
      
      // Check navigation to demo page
      await page.waitForURL('**/demo');
      expect(page.url()).toContain('/demo');
    });
  });

  test.describe('Responsive Design', () => {
    test('form is responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check form elements are still visible and properly sized
      await expect(page.getByRole('heading', { name: 'Adrata Sign In' })).toBeVisible();
      await expect(page.getByLabel('Username or Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
      
      // Check form is centered and properly sized
      const form = page.locator('form').first();
      await expect(form).toBeVisible();
    });

    test('form is responsive on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check form elements are still visible and properly sized
      await expect(page.getByRole('heading', { name: 'Adrata Sign In' })).toBeVisible();
      await expect(page.getByLabel('Username or Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('has proper heading structure', async ({ page }) => {
      // Check for h1 heading
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
      await expect(heading).toHaveText('Adrata Sign In');
    });

    test('has proper form labels and associations', async ({ page }) => {
      // Check that inputs have proper labels
      const emailInput = page.getByLabel('Username or Email');
      const passwordInput = page.getByLabel('Password');
      const rememberMeCheckbox = page.getByLabel('Remember me');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(rememberMeCheckbox).toBeVisible();
    });

    test('supports keyboard navigation', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab'); // Should focus email input
      await expect(page.getByLabel('Username or Email')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Should focus password input
      await expect(page.getByLabel('Password')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Should focus remember me checkbox
      await expect(page.getByLabel('Remember me')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Should focus submit button
      await expect(page.getByRole('button', { name: 'Start' })).toBeFocused();
    });
  });
});
