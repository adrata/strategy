/**
 * Test Helper Utilities
 * 
 * Common utilities for authentication and UI testing
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Test user factory
export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  email: 'test@adrata.com',
  username: 'testuser',
  name: 'Test User',
  isActive: true,
  activeWorkspaceId: 'test-workspace-id',
  workspaces: [
    {
      id: 'test-workspace-id',
      name: 'Test Workspace',
      role: 'admin',
    },
  ],
  ...overrides,
});

// Mock authentication responses
export const createMockAuthResponse = (success: boolean, overrides: any = {}) => {
  if (success) {
    return {
      success: true,
      user: createTestUser(),
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      rememberMe: false,
      message: 'Authentication successful',
      platformRoute: {
        path: '/speedrun',
        app: 'speedrun',
        section: 'dashboard',
      },
      redirectTo: '/speedrun',
      ...overrides,
    };
  } else {
    return {
      success: false,
      error: 'Invalid credentials',
      ...overrides,
    };
  }
};

// Mock useUnifiedAuth hook
export const createMockUseUnifiedAuth = (overrides: any = {}) => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  user: null,
  session: null,
  isLoading: false,
  error: null,
  ...overrides,
});

// Custom render function with providers
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    ...options,
  });
};

// Test form data
export const createTestFormData = (overrides: any = {}) => ({
  email: 'test@adrata.com',
  password: 'testpassword123',
  rememberMe: false,
  ...overrides,
});

// Mock fetch responses
export const mockFetchResponse = (response: any, status: number = 200) => {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
  };
  
  (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
  return mockResponse;
};

// Mock fetch error
export const mockFetchError = (error: string = 'Network error') => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error(error));
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Simulate user input
export const simulateUserInput = async (element: HTMLElement, value: string) => {
  const input = element as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await waitForAsync();
};

// Simulate form submission
export const simulateFormSubmit = async (form: HTMLFormElement) => {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await waitForAsync();
};

// Simulate keyboard events
export const simulateKeyPress = (element: HTMLElement, key: string, modifiers: string[] = []) => {
  const event = new KeyboardEvent('keydown', {
    key,
    metaKey: modifiers.includes('meta'),
    ctrlKey: modifiers.includes('ctrl'),
    altKey: modifiers.includes('alt'),
    shiftKey: modifiers.includes('shift'),
    bubbles: true,
  });
  
  element.dispatchEvent(event);
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset document.cookie
  document.cookie = '';
  
  // Reset window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000/sign-in',
      hostname: 'localhost',
      search: '',
      pathname: '/sign-in',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
    writable: true,
  });
};

// Assertion helpers
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectElementToHaveValue = (element: HTMLInputElement, value: string) => {
  expect(element).toHaveValue(value);
};

export const expectElementToBeDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled();
};

export const expectElementToBeEnabled = (element: HTMLElement) => {
  expect(element).not.toBeDisabled();
};

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
