import { test, expect } from '../fixtures/auth.fixture';
import { AuthTestUtils, TestDataGenerator } from '../fixtures/auth.fixture';

/**
 * Authentication E2E Tests
 * 
 * Comprehensive test suite that validates the complete authentication flow
 * including successful login, failed attempts, form validation, security,
 * and post-authentication state management.
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ clearSession }) => {
    // Clear any existing session before each test
    await clearSession();
  });

  test.describe('Page Load & UI Validation', () => {
    test('should load sign-in page correctly', async ({ signInPage }) => {
      await signInPage.goto();
      
      // Verify page loads without console errors
      const hasErrors = await signInPage.hasConsoleErrors();
      expect(hasErrors).toBe(false);
      
      // Verify all form elements are present
      await expect(signInPage.emailInput).toBeVisible();
      await expect(signInPage.passwordInput).toBeVisible();
      await expect(signInPage.submitButton).toBeVisible();
      await expect(signInPage.rememberMeCheckbox).toBeVisible();
      
      // Verify page title and URL
      await expect(signInPage.page).toHaveTitle(/Sign In.*Adrata/);
      expect(signInPage.page.url()).toContain('/sign-in');
    });

    test('should have proper form validation attributes', async ({ signInPage }) => {
      await signInPage.goto();
      
      // Check email input attributes
      await expect(signInPage.emailInput).toHaveAttribute('type', 'email');
      
      // Check password input attributes
      await expect(signInPage.passwordInput).toHaveAttribute('type', 'password');
      
      // Check submit button attributes
      await expect(signInPage.submitButton).toHaveAttribute('type', 'submit');
    });

    test('should not have credentials in URL', async ({ signInPage }) => {
      await signInPage.goto();
      
      const currentUrl = await signInPage.getCurrentUrl();
      const hasCredentials = AuthTestUtils.hasCredentialsInUrl(currentUrl);
      
      expect(hasCredentials).toBe(false);
    });
  });

  test.describe('Failed Authentication', () => {
    test('should show validation error for empty form submission', async ({ signInPage }) => {
      await signInPage.goto();
      
      // Submit empty form
      await signInPage.submit();
      
      // Check for validation errors
      const formErrors = await AuthTestUtils.getFormValidationErrors(signInPage.page);
      expect(formErrors.length).toBeGreaterThan(0);
    });

    test('should show error for invalid credentials', async ({ signInPage }) => {
      await signInPage.goto();
      
      // Try to sign in with invalid credentials
      await signInPage.signIn('invalid@example.com', 'wrongpassword');
      
      // Wait for error message
      const hasError = await signInPage.hasErrorMessage();
      expect(hasError).toBe(true);
      
      // Verify error message is user-friendly
      const errorMessage = await signInPage.getErrorMessage();
      expect(errorMessage).toContain('Invalid email or password');
      expect(AuthTestUtils.isValidErrorMessage(errorMessage)).toBe(true);
    });

    test('should handle empty email field', async ({ signInPage }) => {
      await signInPage.goto();
      
      // Fill only password
      await signInPage.fillPassword('somepassword');
      await signInPage.submit();
      
      // Should show validation error
      const formErrors = await AuthTestUtils.getFormValidationErrors(signInPage.page);
      expect(formErrors.length).toBeGreaterThan(0);
    });

    test('should handle empty password field', async ({ signInPage }) => {
      await signInPage.goto();
      
      // Fill only email
      await signInPage.fillEmail('test@example.com');
      await signInPage.submit();
      
      // Should show validation error
      const formErrors = await AuthTestUtils.getFormValidationErrors(signInPage.page);
      expect(formErrors.length).toBeGreaterThan(0);
    });

    test('should handle invalid email formats', async ({ signInPage }) => {
      const invalidEmails = TestDataGenerator.getInvalidEmails();
      
      for (const email of invalidEmails) {
        await signInPage.goto();
        await signInPage.fillEmail(email);
        await signInPage.fillPassword('somepassword');
        await signInPage.submit();
        
        // Should show validation error for invalid email format
        const formErrors = await AuthTestUtils.getFormValidationErrors(signInPage.page);
        expect(formErrors.length).toBeGreaterThan(0);
      }
    });

    test('should remain functional after error', async ({ signInPage }) => {
      await signInPage.goto();
      
      // Try invalid login
      await signInPage.signIn('invalid@example.com', 'wrongpassword');
      await signInPage.hasErrorMessage();
      
      // Form should still be functional
      await expect(signInPage.emailInput).toBeVisible();
      await expect(signInPage.passwordInput).toBeVisible();
      await expect(signInPage.submitButton).toBeVisible();
      
      // Should be able to try again
      await signInPage.clearForm();
      await signInPage.fillEmail('test@example.com');
      await signInPage.fillPassword('password');
      await expect(signInPage.submitButton).toBeEnabled();
    });
  });

  test.describe('Successful Authentication', () => {
    test('should authenticate with valid credentials', async ({ signInPage, testUser, waitForAuthRedirect }) => {
      await signInPage.goto();
      
      // Sign in with valid credentials
      await signInPage.signIn(testUser.email, testUser.password);
      
      // Wait for successful redirect
      await waitForAuthRedirect();
      
      // Verify redirect to dashboard
      const isRedirected = await signInPage.isRedirectedToDashboard();
      expect(isRedirected).toBe(true);
      
      // Verify session is stored
      const hasSession = await signInPage.hasSession();
      expect(hasSession).toBe(true);
      
      // Verify session structure
      const session = await signInPage.getSession();
      expect(AuthTestUtils.isValidSession(session)).toBe(true);
      expect(AuthTestUtils.isSessionExpired(session)).toBe(false);
    });

    test('should redirect authenticated users from sign-in page', async ({ signInPage, testUser, login }) => {
      // First, authenticate
      await login();
      
      // Try to visit sign-in page again
      await signInPage.goto();
      
      // Should be redirected to dashboard
      const isRedirected = await signInPage.isRedirectedToDashboard();
      expect(isRedirected).toBe(true);
    });

    test('should maintain session across page refreshes', async ({ signInPage, testUser, login }) => {
      // Authenticate
      await login();
      
      // Refresh the page
      await signInPage.page.reload();
      
      // Should still be authenticated
      const hasSession = await signInPage.hasSession();
      expect(hasSession).toBe(true);
      
      // Should be on dashboard
      const isRedirected = await signInPage.isRedirectedToDashboard();
      expect(isRedirected).toBe(true);
    });
  });

  test.describe('Remember Me Functionality', () => {
    test('should save credentials when remember me is checked', async ({ signInPage, testUser, clearSession }) => {
      await signInPage.goto();
      
      // Sign in with remember me checked
      await signInPage.signIn(testUser.email, testUser.password, true);
      
      // Wait for successful login
      await signInPage.waitForNavigation();
      
      // Clear session but keep remember me data
      await clearSession();
      
      // Go back to sign-in page
      await signInPage.goto();
      
      // Check if credentials are pre-filled
      const emailValue = await signInPage.getEmailValue();
      const passwordValue = await signInPage.getPasswordValue();
      const isRememberMeChecked = await signInPage.isRememberMeChecked();
      
      expect(emailValue).toBe(testUser.email);
      expect(passwordValue).toBe(testUser.password);
      expect(isRememberMeChecked).toBe(true);
    });

    test('should not save credentials when remember me is unchecked', async ({ signInPage, testUser, clearSession }) => {
      await signInPage.goto();
      
      // Sign in without remember me
      await signInPage.signIn(testUser.email, testUser.password, false);
      
      // Wait for successful login
      await signInPage.waitForNavigation();
      
      // Clear session
      await clearSession();
      
      // Go back to sign-in page
      await signInPage.goto();
      
      // Check that credentials are not pre-filled
      const emailValue = await signInPage.getEmailValue();
      const passwordValue = await signInPage.getPasswordValue();
      const isRememberMeChecked = await signInPage.isRememberMeChecked();
      
      expect(emailValue).toBe('');
      expect(passwordValue).toBe('');
      expect(isRememberMeChecked).toBe(false);
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should submit form with Cmd/Ctrl+Enter', async ({ signInPage, testUser }) => {
      await signInPage.goto();
      
      // Fill form
      await signInPage.fillEmail(testUser.email);
      await signInPage.fillPassword(testUser.password);
      
      // Submit with keyboard shortcut
      await signInPage.submitWithKeyboard();
      
      // Should navigate to dashboard
      await signInPage.waitForNavigation();
      const isRedirected = await signInPage.isRedirectedToDashboard();
      expect(isRedirected).toBe(true);
    });

    test('should support tab navigation', async ({ signInPage }) => {
      await signInPage.goto();
      
      // Tab through form elements
      await signInPage.emailInput.focus();
      await signInPage.page.keyboard.press('Tab');
      await expect(signInPage.passwordInput).toBeFocused();
      
      await signInPage.page.keyboard.press('Tab');
      await expect(signInPage.rememberMeCheckbox).toBeFocused();
      
      await signInPage.page.keyboard.press('Tab');
      await expect(signInPage.submitButton).toBeFocused();
    });
  });

  test.describe('Security Validation', () => {
    test('should not expose credentials in network requests', async ({ signInPage, testUser }) => {
      const requests: string[] = [];
      
      // Listen for network requests
      signInPage.page.on('request', request => {
        const url = request.url();
        if (url.includes('sign-in') || url.includes('auth')) {
          requests.push(url);
        }
      });
      
      await signInPage.goto();
      await signInPage.signIn(testUser.email, testUser.password);
      
      // Check that no URLs contain credentials
      for (const requestUrl of requests) {
        const hasCredentials = AuthTestUtils.hasCredentialsInUrl(requestUrl);
        expect(hasCredentials).toBe(false);
      }
    });

    test('should handle SQL injection attempts safely', async ({ signInPage }) => {
      const sqlInjectionAttempts = TestDataGenerator.getSqlInjectionAttempts();
      
      for (const attempt of sqlInjectionAttempts) {
        await signInPage.goto();
        await signInPage.signIn(attempt, 'password');
        
        // Should show generic error message, not expose database details
        const hasError = await signInPage.hasErrorMessage();
        expect(hasError).toBe(true);
        
        const errorMessage = await signInPage.getErrorMessage();
        expect(errorMessage).not.toContain('SQL');
        expect(errorMessage).not.toContain('database');
        expect(errorMessage).not.toContain('table');
      }
    });

    test('should handle XSS attempts safely', async ({ signInPage }) => {
      const xssAttempts = TestDataGenerator.getXssAttempts();
      
      for (const attempt of xssAttempts) {
        await signInPage.goto();
        await signInPage.fillEmail(attempt);
        await signInPage.fillPassword('password');
        await signInPage.submit();
        
        // Should not execute any scripts
        const hasErrors = await signInPage.hasConsoleErrors();
        expect(hasErrors).toBe(false);
        
        // Page should still be functional
        await expect(signInPage.emailInput).toBeVisible();
        await expect(signInPage.passwordInput).toBeVisible();
      }
    });

    test('should have proper security headers', async ({ signInPage }) => {
      const hasSecurityHeaders = await AuthTestUtils.checkSecurityHeaders(signInPage.page);
      expect(hasSecurityHeaders).toBe(true);
    });
  });

  test.describe('Network Error Handling', () => {
    test('should handle network failures gracefully', async ({ signInPage, testUser }) => {
      // Simulate network failure
      await AuthTestUtils.simulateNetworkFailure(signInPage.page);
      
      await signInPage.goto();
      await signInPage.signIn(testUser.email, testUser.password);
      
      // Should show user-friendly error message
      const hasError = await signInPage.hasErrorMessage();
      expect(hasError).toBe(true);
      
      const errorMessage = await signInPage.getErrorMessage();
      expect(errorMessage).toContain('error occurred');
      expect(AuthTestUtils.isValidErrorMessage(errorMessage)).toBe(true);
    });

    test('should handle slow network responses', async ({ signInPage, testUser }) => {
      // Simulate slow network
      await AuthTestUtils.simulateSlowNetwork(signInPage.page, 1000);
      
      await signInPage.goto();
      await signInPage.signIn(testUser.email, testUser.password);
      
      // Should show loading state
      const isLoading = await signInPage.isLoading();
      expect(isLoading).toBe(true);
      
      // Should eventually complete successfully
      await signInPage.waitForNavigation();
      const isRedirected = await signInPage.isRedirectedToDashboard();
      expect(isRedirected).toBe(true);
    });
  });

  test.describe('Session Management', () => {
    test('should create valid session on successful login', async ({ signInPage, testUser, login }) => {
      await login();
      
      const session = await signInPage.getSession();
      expect(session).not.toBeNull();
      expect(AuthTestUtils.isValidSession(session)).toBe(true);
      expect(session.user.email).toBe(testUser.email);
    });

    test('should handle session expiration', async ({ signInPage, testUser, login }) => {
      await login();
      
      // Manually expire the session
      await signInPage.page.evaluate(() => {
        const session = JSON.parse(localStorage.getItem('adrata_unified_session_v3') || '{}');
        session.expires = new Date(Date.now() - 1000).toISOString();
        localStorage.setItem('adrata_unified_session_v3', JSON.stringify(session));
      });
      
      // Try to access protected route
      await signInPage.page.goto('/speedrun');
      
      // Should be redirected to sign-in
      expect(signInPage.page.url()).toContain('/sign-in');
    });

    test('should clear session on logout', async ({ signInPage, testUser, login, logout }) => {
      await login();
      
      // Verify session exists
      const hasSession = await signInPage.hasSession();
      expect(hasSession).toBe(true);
      
      // Logout
      await logout();
      
      // Verify session is cleared
      const hasSessionAfterLogout = await signInPage.hasSession();
      expect(hasSessionAfterLogout).toBe(false);
    });
  });
});
