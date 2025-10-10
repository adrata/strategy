import { Page, Locator, expect } from '@playwright/test';

/**
 * SignInPage - Page Object Model for Sign-In Page
 * 
 * Encapsulates all interactions with the sign-in page including
 * form filling, submission, error handling, and state verification.
 */
export class SignInPage {
  readonly page: Page;
  
  // Form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;
  
  // Error and status elements
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;
  
  // Navigation elements
  readonly resetPasswordLink: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form selectors - using data-testid attributes for reliability
    this.emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    this.passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    this.rememberMeCheckbox = page.locator('input[type="checkbox"], input[name="rememberMe"]').first();
    this.submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first();
    
    // Error and status selectors
    this.errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error, [role="alert"]').first();
    this.loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner').first();
    
    // Navigation selectors
    this.resetPasswordLink = page.locator('a:has-text("Reset"), a:has-text("Forgot")').first();
    this.signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Register")').first();
  }

  /**
   * Navigate to the sign-in page
   */
  async goto(): Promise<void> {
    await this.page.goto('/sign-in');
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }

  /**
   * Set remember me checkbox
   */
  async setRememberMe(checked: boolean): Promise<void> {
    const isChecked = await this.rememberMeCheckbox.isChecked();
    if (isChecked !== checked) {
      await this.rememberMeCheckbox.click();
    }
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Fill and submit the form in one action
   */
  async signIn(email: string, password: string, rememberMe: boolean = false): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    if (rememberMe) {
      await this.setRememberMe(true);
    }
    await this.submit();
  }

  /**
   * Submit form using keyboard shortcut (Cmd/Ctrl + Enter)
   */
  async submitWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('Meta+Enter'); // Cmd+Enter on Mac, Ctrl+Enter on Windows/Linux
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if error message is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for navigation after successful login
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForURL('**/speedrun**', { timeout: 10000 });
  }

  /**
   * Check if user is redirected to dashboard (authenticated)
   */
  async isRedirectedToDashboard(): Promise<boolean> {
    try {
      await this.page.waitForURL('**/speedrun**', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Check if form is in valid state
   */
  async isFormValid(): Promise<boolean> {
    const email = await this.emailInput.inputValue();
    const password = await this.passwordInput.inputValue();
    return email.length > 0 && password.length > 0;
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
    await this.setRememberMe(false);
  }

  /**
   * Check if remember me is checked
   */
  async isRememberMeChecked(): Promise<boolean> {
    return await this.rememberMeCheckbox.isChecked();
  }

  /**
   * Get email field value
   */
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  /**
   * Get password field value
   */
  async getPasswordValue(): Promise<string> {
    return await this.passwordInput.inputValue();
  }

  /**
   * Check if page has console errors
   */
  async hasConsoleErrors(): Promise<boolean> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any console errors to appear
    await this.page.waitForTimeout(1000);
    
    return errors.length > 0;
  }

  /**
   * Get all console errors
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await this.page.waitForTimeout(1000);
    return errors;
  }

  /**
   * Check if session exists in localStorage
   */
  async hasSession(): Promise<boolean> {
    const session = await this.page.evaluate(() => {
      return localStorage.getItem('adrata_unified_session_v3');
    });
    return session !== null;
  }

  /**
   * Get session data from localStorage
   */
  async getSession(): Promise<any> {
    return await this.page.evaluate(() => {
      const session = localStorage.getItem('adrata_unified_session_v3');
      return session ? JSON.parse(session) : null;
    });
  }

  /**
   * Clear session from localStorage
   */
  async clearSession(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('adrata_unified_session_v3');
      localStorage.removeItem('adrata_remembered_email');
      localStorage.removeItem('adrata_remembered_password');
      sessionStorage.clear();
    });
  }

  /**
   * Get session expiration date
   */
  async getSessionExpiration(): Promise<Date> {
    const session = await this.page.evaluate(() => {
      const sessionStr = localStorage.getItem('adrata_unified_session_v3');
      return JSON.parse(sessionStr || '{}');
    });
    return new Date(session.expires);
  }

  /**
   * Get remember me cookie value
   */
  async getRememberMeCookie(): Promise<string | null> {
    const cookies = await this.page.context().cookies();
    const rememberMeCookie = cookies.find(c => c.name === 'adrata_remember_me');
    return rememberMeCookie?.value || null;
  }

  /**
   * Get auth-token cookie value
   */
  async getAuthTokenCookie(): Promise<string | null> {
    const cookies = await this.page.context().cookies();
    const authTokenCookie = cookies.find(c => c.name === 'auth-token');
    return authTokenCookie?.value || null;
  }
}
