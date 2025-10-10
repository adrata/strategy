import { test as base, expect } from '@playwright/test';
import { SignInPage } from '../pages/SignInPage';

/**
 * Authentication Test Fixtures
 * 
 * Provides reusable test utilities and helper functions for authentication tests.
 * Includes test user management, session handling, and common test scenarios.
 */

// Test user interface
export interface TestUser {
  email: string;
  password: string;
  name?: string;
  workspaceId?: string;
}

// Test user credentials - configurable via environment variables
export const TEST_USERS: Record<string, TestUser> = {
  valid: {
    email: process.env.TEST_USER_EMAIL || 'ross@adrata.com',
    password: process.env.TEST_USER_PASSWORD || 'rosspass',
    name: 'Ross Sylvester',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
  empty: {
    email: '',
    password: '',
  },
};

// Extended test context with auth utilities
export interface AuthTestContext {
  signInPage: SignInPage;
  testUser: TestUser;
  login: (email?: string, password?: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
  isAuthenticated: () => Promise<boolean>;
  waitForAuthRedirect: () => Promise<void>;
}

/**
 * Authentication test fixture
 */
export const test = base.extend<AuthTestContext>({
  // Sign-in page instance
  signInPage: async ({ page }, use) => {
    const signInPage = new SignInPage(page);
    await use(signInPage);
  },

  // Test user (defaults to valid user)
  testUser: async ({}, use) => {
    await use(TEST_USERS.valid);
  },

  // Login helper function
  login: async ({ signInPage, testUser }, use) => {
    const login = async (email?: string, password?: string, rememberMe: boolean = false) => {
      const userEmail = email || testUser.email;
      const userPassword = password || testUser.password;
      
      await signInPage.goto();
      await signInPage.signIn(userEmail, userPassword, rememberMe);
    };
    await use(login);
  },

  // Logout helper function
  logout: async ({ page }, use) => {
    const logout = async () => {
      // Clear all auth-related storage
      await page.evaluate(() => {
        localStorage.removeItem('adrata_unified_session_v3');
        localStorage.removeItem('adrata_remembered_email');
        localStorage.removeItem('adrata_remembered_password');
        sessionStorage.clear();
      });
      
      // Navigate to sign-in page
      await page.goto('/sign-in');
    };
    await use(logout);
  },

  // Clear session helper
  clearSession: async ({ page }, use) => {
    const clearSession = async () => {
      await page.evaluate(() => {
        localStorage.removeItem('adrata_unified_session_v3');
        localStorage.removeItem('adrata_remembered_email');
        localStorage.removeItem('adrata_remembered_password');
        sessionStorage.clear();
      });
    };
    await use(clearSession);
  },

  // Check if user is authenticated
  isAuthenticated: async ({ page }, use) => {
    const isAuthenticated = async () => {
      const session = await page.evaluate(() => {
        return localStorage.getItem('adrata_unified_session_v3');
      });
      return session !== null;
    };
    await use(isAuthenticated);
  },

  // Wait for authentication redirect
  waitForAuthRedirect: async ({ page }, use) => {
    const waitForAuthRedirect = async () => {
      await page.waitForURL('**/speedrun**', { timeout: 10000 });
    };
    await use(waitForAuthRedirect);
  },
});

export { expect };

/**
 * Utility functions for authentication tests
 */
export class AuthTestUtils {
  /**
   * Generate a random test email
   */
  static generateTestEmail(): string {
    const timestamp = Date.now();
    return `test-${timestamp}@adrata.com`;
  }

  /**
   * Generate a random test password
   */
  static generateTestPassword(): string {
    return `TestPassword${Math.random().toString(36).substring(2, 15)}!`;
  }

  /**
   * Wait for network requests to complete
   */
  static async waitForNetworkIdle(page: any, timeout: number = 5000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Check if URL contains credentials (security test)
   */
  static hasCredentialsInUrl(url: string): boolean {
    const urlObj = new URL(url);
    const hasUsername = urlObj.searchParams.has('username') || urlObj.searchParams.has('email');
    const hasPassword = urlObj.searchParams.has('password');
    return hasUsername || hasPassword;
  }

  /**
   * Validate session structure
   */
  static isValidSession(session: any): boolean {
    if (!session || typeof session !== 'object') {
      return false;
    }

    // Check for required session properties
    const requiredFields = ['user', 'token', 'expires'];
    return requiredFields.every(field => session.hasOwnProperty(field));
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(session: any): boolean {
    if (!session || !session.expires) {
      return true;
    }

    const expiresAt = new Date(session.expires);
    return expiresAt < new Date();
  }

  /**
   * Get error message patterns for validation
   */
  static getExpectedErrorMessages(): Record<string, string> {
    return {
      invalidCredentials: 'Invalid email or password',
      emptyFields: 'Please enter your username and password',
      networkError: 'An unexpected error occurred',
      serverError: 'Internal server error',
    };
  }

  /**
   * Validate error message format
   */
  static isValidErrorMessage(message: string): boolean {
    if (!message || typeof message !== 'string') {
      return false;
    }

    // Error message should not be empty and should be user-friendly
    return message.length > 0 && message.length < 200;
  }

  /**
   * Check if page has security headers
   */
  static async checkSecurityHeaders(page: any): Promise<boolean> {
    const response = await page.goto('/sign-in');
    const headers = response?.headers();
    
    // Check for important security headers
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
    ];

    return securityHeaders.every(header => headers?.[header]);
  }

  /**
   * Simulate slow network for testing
   */
  static async simulateSlowNetwork(page: any, delay: number = 2000): Promise<void> {
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.continue();
    });
  }

  /**
   * Simulate network failure
   */
  static async simulateNetworkFailure(page: any): Promise<void> {
    await page.route('**/api/auth/sign-in', route => {
      route.abort('failed');
    });
  }

  /**
   * Get form validation errors
   */
  static async getFormValidationErrors(page: any): Promise<string[]> {
    const errors: string[] = [];
    
    // Check for HTML5 validation errors
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    const passwordValidity = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    
    if (emailValidity) errors.push(emailValidity);
    if (passwordValidity) errors.push(passwordValidity);
    
    return errors;
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  /**
   * Generate test user data
   */
  static generateTestUser(): TestUser {
    const timestamp = Date.now();
    return {
      email: `test-${timestamp}@adrata.com`,
      password: `TestPassword${timestamp}!`,
      name: `Test User ${timestamp}`,
    };
  }

  /**
   * Generate invalid email formats
   */
  static getInvalidEmails(): string[] {
    return [
      'invalid-email',
      '@invalid.com',
      'invalid@',
      'invalid@.com',
      'invalid@com.',
      'invalid..email@com',
      '',
      '   ',
    ];
  }

  /**
   * Generate weak passwords
   */
  static getWeakPasswords(): string[] {
    return [
      '123',
      'password',
      '12345678',
      'qwerty',
      '',
      '   ',
    ];
  }

  /**
   * Generate SQL injection attempts
   */
  static getSqlInjectionAttempts(): string[] {
    return [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users --",
    ];
  }

  /**
   * Generate XSS attempts
   */
  static getXssAttempts(): string[] {
    return [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      '"><script>alert("xss")</script>',
    ];
  }
}
