/**
 * Record Page Test Helpers
 * 
 * Common test utilities and helpers for record page testing
 */

import { render, screen, fireEvent, waitFor, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { NextRouter } from 'next/router';

// Mock router for testing
export const mockRouter: Partial<NextRouter> = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  reload: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/test-workspace/pipeline/people/test-id',
  route: '/[workspace]/pipeline/people/[id]',
  query: { workspace: 'test-workspace', id: 'test-id' },
  asPath: '/test-workspace/pipeline/people/test-id',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isReady: true,
  isPreview: false,
  isLocaleDomain: false,
  basePath: '',
  locale: 'en',
  locales: ['en'],
  defaultLocale: 'en',
  domainLocales: [],
  isFallback: false,
};

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & {
    router?: Partial<NextRouter>;
    initialEntries?: string[];
  } = {}
) {
  const { router = mockRouter, initialEntries = ['/test-workspace/pipeline/people/test-id'], ...renderOptions } = options;

  // Mock Next.js router
  jest.mock('next/router', () => ({
    useRouter: () => router,
  }));

  // Mock Next.js navigation
  jest.mock('next/navigation', () => ({
    useRouter: () => router,
    useParams: () => ({ workspace: 'test-workspace', id: 'test-id' }),
    usePathname: () => '/test-workspace/pipeline/people/test-id',
    useSearchParams: () => new URLSearchParams(),
  }));

  return render(ui, renderOptions);
}

/**
 * Wait for element to appear with custom timeout
 */
export async function waitForElement(
  selector: string | (() => HTMLElement | null),
  timeout: number = 5000
): Promise<HTMLElement> {
  return waitFor(
    () => {
      const element = typeof selector === 'function' ? selector() : document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      return element;
    },
    { timeout }
  );
}

/**
 * Wait for text content to appear
 */
export async function waitForText(
  text: string | RegExp,
  timeout: number = 5000
): Promise<HTMLElement> {
  return waitFor(
    () => {
      const element = screen.getByText(text);
      if (!element) {
        throw new Error(`Text not found: ${text}`);
      }
      return element;
    },
    { timeout }
  );
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(
  selector: string | (() => HTMLElement | null),
  timeout: number = 5000
): Promise<void> {
  return waitFor(
    () => {
      const element = typeof selector === 'function' ? selector() : document.querySelector(selector);
      if (element) {
        throw new Error(`Element still present: ${selector}`);
      }
    },
    { timeout }
  );
}

/**
 * Simulate API delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock fetch with response
 */
export function mockFetch(response: any, status: number = 200, delay: number = 0) {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    headers: new Headers(),
  };

  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockImplementation(() => 
    delay > 0 ? new Promise(resolve => setTimeout(() => resolve(mockResponse), delay)) : Promise.resolve(mockResponse)
  );

  return () => {
    global.fetch = originalFetch;
  };
}

/**
 * Mock fetch with error
 */
export function mockFetchError(error: Error) {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockRejectedValue(error);

  return () => {
    global.fetch = originalFetch;
  };
}

/**
 * Create mock context providers
 */
export function createMockContextProviders() {
  const mockAcquisitionOS = {
    data: {
      people: [],
      companies: [],
      leads: [],
      prospects: [],
      opportunities: [],
      clients: []
    },
    loading: false,
    error: null,
    refetch: jest.fn(),
    ui: {
      selectedRecord: null,
      setSelectedRecord: jest.fn(),
      showLeftPanel: true,
      setShowLeftPanel: jest.fn(),
      showRightPanel: true,
      setShowRightPanel: jest.fn()
    }
  };

  const mockPipeline = {
    data: {
      people: [],
      companies: [],
      leads: [],
      prospects: [],
      opportunities: [],
      clients: []
    },
    loading: false,
    error: null,
    refetch: jest.fn(),
    selectedRecord: null,
    setSelectedRecord: jest.fn()
  };

  const mockRecordContext = {
    record: null,
    setRecord: jest.fn(),
    loading: false,
    error: null,
    refetch: jest.fn()
  };

  const mockProfilePopup = {
    isProfileOpen: false,
    setIsProfileOpen: jest.fn(),
    profileAnchor: null,
    profilePopupRef: { current: null }
  };

  return {
    mockAcquisitionOS,
    mockPipeline,
    mockRecordContext,
    mockProfilePopup
  };
}

/**
 * Assert record page renders without crashing
 */
export async function assertRecordPageRenders(
  recordType: string,
  recordId: string = 'test-record-id'
) {
  // Check that the page container is present
  const pageContainer = await waitForElement('[data-testid="record-page-container"]');
  expect(pageContainer).toBeInTheDocument();

  // Check that the record type is correct
  const recordTypeIndicator = screen.getByTestId('record-type-indicator');
  expect(recordTypeIndicator).toHaveTextContent(recordType);

  // Check that the record ID is correct
  const recordIdIndicator = screen.getByTestId('record-id-indicator');
  expect(recordIdIndicator).toHaveTextContent(recordId);
}

/**
 * Assert navigation controls work
 */
export async function assertNavigationControls(
  hasPrevious: boolean = true,
  hasNext: boolean = true
) {
  if (hasPrevious) {
    const prevButton = screen.getByTestId('navigate-previous-button');
    expect(prevButton).toBeInTheDocument();
    expect(prevButton).not.toBeDisabled();
  }

  if (hasNext) {
    const nextButton = screen.getByTestId('navigate-next-button');
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();
  }
}

/**
 * Assert tabs render and switch correctly
 */
export async function assertTabsWork(tabIds: string[]) {
  // Check that all tabs are present
  for (const tabId of tabIds) {
    const tab = screen.getByTestId(`tab-${tabId}`);
    expect(tab).toBeInTheDocument();
  }

  // Test tab switching
  for (const tabId of tabIds) {
    const tab = screen.getByTestId(`tab-${tabId}`);
    fireEvent.click(tab);
    
    await waitFor(() => {
      const tabContent = screen.getByTestId(`tab-content-${tabId}`);
      expect(tabContent).toBeInTheDocument();
    });
  }
}

/**
 * Assert error states are handled
 */
export async function assertErrorHandling(errorType: 'network' | 'not-found' | 'unauthorized') {
  const errorContainer = await waitForElement('[data-testid="error-container"]');
  expect(errorContainer).toBeInTheDocument();

  switch (errorType) {
    case 'network':
      expect(screen.getByText(/network error|connection failed/i)).toBeInTheDocument();
      break;
    case 'not-found':
      expect(screen.getByText(/not found|404/i)).toBeInTheDocument();
      break;
    case 'unauthorized':
      expect(screen.getByText(/unauthorized|401/i)).toBeInTheDocument();
      break;
  }

  // Check that retry button is present
  const retryButton = screen.getByTestId('retry-button');
  expect(retryButton).toBeInTheDocument();
}

/**
 * Assert loading states are shown
 */
export async function assertLoadingStates() {
  // Check initial loading state
  const loadingSpinner = await waitForElement('[data-testid="loading-spinner"]');
  expect(loadingSpinner).toBeInTheDocument();

  // Wait for loading to complete
  await waitForElementToDisappear('[data-testid="loading-spinner"]');
}

/**
 * Assert record data displays correctly
 */
export async function assertRecordData(recordType: string, expectedData: any) {
  // Check that record name/title is displayed
  const nameElement = screen.getByTestId('record-name');
  expect(nameElement).toHaveTextContent(expectedData.name || expectedData.fullName);

  // Check that record type specific data is displayed
  switch (recordType) {
    case 'people':
      if (expectedData.email) {
        expect(screen.getByTestId('record-email')).toHaveTextContent(expectedData.email);
      }
      if (expectedData.jobTitle) {
        expect(screen.getByTestId('record-title')).toHaveTextContent(expectedData.jobTitle);
      }
      break;
    case 'companies':
      if (expectedData.website) {
        expect(screen.getByTestId('record-website')).toHaveTextContent(expectedData.website);
      }
      if (expectedData.industry) {
        expect(screen.getByTestId('record-industry')).toHaveTextContent(expectedData.industry);
      }
      break;
  }
}

/**
 * Assert actions work correctly
 */
export async function assertActionsWork(actionTypes: string[]) {
  for (const actionType of actionTypes) {
    const actionButton = screen.getByTestId(`action-${actionType}-button`);
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    
    // Check that action modal opens
    const actionModal = await waitForElement(`[data-testid="action-${actionType}-modal"]`);
    expect(actionModal).toBeInTheDocument();
  }
}

/**
 * Clean up test environment
 */
export function cleanupTestEnvironment() {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Clear any timers
  jest.clearAllTimers();
}

/**
 * Setup test environment
 */
export function setupTestEnvironment() {
  // Mock console methods to reduce noise in tests
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = jest.fn();
  console.warn = jest.fn();
  
  return () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  };
}
