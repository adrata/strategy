/**
 * Unit Tests for PipelineDetailPage Component
 * 
 * Tests the core page logic, record loading, error handling, and navigation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PipelineDetailPage } from '@/frontend/components/pipeline/PipelineDetailPage';
import { 
  createTestRecordPageProps,
  createMockApiResponse,
  createMockErrorResponse,
  createTestContextData
} from '../../utils/record-page-factories';
import { 
  renderWithProviders,
  mockFetch,
  mockFetchError,
  waitForElement,
  waitForText,
  createMockContextProviders,
  setupTestEnvironment,
  cleanupTestEnvironment
} from '../../utils/record-page-helpers';

// Mock the auth function
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      activeWorkspaceId: 'test-workspace-id'
    }
  })
}));

// Mock the workspace navigation hook
jest.mock('@/platform/hooks/useWorkspaceNavigation', () => ({
  useWorkspaceNavigation: () => ({
    navigateToPipeline: jest.fn(),
    navigateToPipelineItem: jest.fn()
  })
}));

// Mock the profile popup context
jest.mock('@/platform/ui/components/ProfilePopupContext', () => ({
  useProfilePopup: () => ({
    isProfileOpen: false,
    setIsProfileOpen: jest.fn(),
    profileAnchor: null,
    profilePopupRef: { current: null }
  })
}));

// Mock the acquisition OS context
jest.mock('@/platform/ui/context/AcquisitionOSProvider', () => ({
  useAcquisitionOS: () => ({
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
  })
}));

// Mock the pipeline context
jest.mock('@/products/pipeline/context/PipelineContext', () => ({
  usePipeline: () => ({
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
  })
}));

// Mock the record context
jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: () => ({
    record: null,
    setRecord: jest.fn(),
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

// Mock the fast section data hook
jest.mock('@/platform/hooks/useFastSectionData', () => ({
  useFastSectionData: () => ({
    data: [],
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

describe('PipelineDetailPage', () => {
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupTestEnvironment();
  });

  afterEach(() => {
    cleanup();
    cleanupTestEnvironment();
  });

  describe('Component Rendering', () => {
    it('should render without crashing for people section', async () => {
      const props = createTestRecordPageProps('people');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Should render the main container
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
    });

    it('should render without crashing for companies section', async () => {
      const props = createTestRecordPageProps('companies');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
    });

    it('should render without crashing for leads section', async () => {
      const props = createTestRecordPageProps('leads');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
    });

    it('should render without crashing for prospects section', async () => {
      const props = createTestRecordPageProps('prospects');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
    });

    it('should render without crashing for opportunities section', async () => {
      const props = createTestRecordPageProps('opportunities');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
    });

    it('should render without crashing for clients section', async () => {
      const props = createTestRecordPageProps('clients');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
    });

    it('should render without crashing for speedrun section', async () => {
      const props = createTestRecordPageProps('speedrun');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
    });
  });

  describe('Record Loading', () => {
    it('should load record data successfully', async () => {
      const mockResponse = createMockApiResponse('people', 'test-person-id');
      const restoreFetch = mockFetch(mockResponse);
      
      const props = createTestRecordPageProps('people', { slug: 'test-person-id' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('record-loaded')).toBeInTheDocument();
      });
      
      restoreFetch();
    });

    it('should handle record loading errors gracefully', async () => {
      const mockError = createMockErrorResponse(404, 'Record not found');
      const restoreFetch = mockFetch(mockError, 404);
      
      const props = createTestRecordPageProps('people', { slug: 'invalid-id' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('record-error')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
      
      restoreFetch();
    });

    it('should handle network errors gracefully', async () => {
      const restoreFetch = mockFetchError(new Error('Network error'));
      
      const props = createTestRecordPageProps('people', { slug: 'test-person-id' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('record-error')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
      
      restoreFetch();
    });

    it('should handle unauthorized access', async () => {
      const mockError = createMockErrorResponse(401, 'Unauthorized');
      const restoreFetch = mockFetch(mockError, 401);
      
      const props = createTestRecordPageProps('people', { slug: 'test-person-id' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('record-error')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
      
      restoreFetch();
    });
  });

  describe('URL Parameter Handling', () => {
    it('should extract record ID from URL parameters', async () => {
      const props = createTestRecordPageProps('people', { slug: 'test-record-123' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Check that the record ID is extracted and used
      await waitFor(() => {
        expect(screen.getByTestId('record-id-display')).toHaveTextContent('test-record-123');
      });
    });

    it('should handle empty or invalid slugs', async () => {
      const props = createTestRecordPageProps('people', { slug: '' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Should show error for invalid slug
      await waitFor(() => {
        expect(screen.getByTestId('record-error')).toBeInTheDocument();
      });
    });
  });

  describe('Context Provider Integration', () => {
    it('should integrate with AcquisitionOSProvider', async () => {
      const props = createTestRecordPageProps('people');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Check that the acquisition OS context is available
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('acquisition-os-integration')).toBeInTheDocument();
    });

    it('should integrate with PipelineProvider', async () => {
      const props = createTestRecordPageProps('people');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Check that the pipeline context is available
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('pipeline-integration')).toBeInTheDocument();
    });

    it('should integrate with RecordContextProvider', async () => {
      const props = createTestRecordPageProps('people');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Check that the record context is available
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('record-context-integration')).toBeInTheDocument();
    });

    it('should integrate with ProfilePopupProvider', async () => {
      const props = createTestRecordPageProps('people');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Check that the profile popup context is available
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('profile-popup-integration')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should handle back navigation', async () => {
      const props = createTestRecordPageProps('people');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      // Should trigger navigation back
      expect(backButton).toBeInTheDocument();
    });

    it('should handle record navigation when data is available', async () => {
      const mockResponse = createMockApiResponse('people', 'test-person-id');
      const restoreFetch = mockFetch(mockResponse);
      
      const props = createTestRecordPageProps('people', { slug: 'test-person-id' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('record-loaded')).toBeInTheDocument();
      });
      
      // Check that navigation controls are available
      const prevButton = screen.getByTestId('navigate-previous-button');
      const nextButton = screen.getByTestId('navigate-next-button');
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
      
      restoreFetch();
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', async () => {
      const props = createTestRecordPageProps('people');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Should show loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should hide loading state when data is loaded', async () => {
      const mockResponse = createMockApiResponse('people', 'test-person-id');
      const restoreFetch = mockFetch(mockResponse);
      
      const props = createTestRecordPageProps('people', { slug: 'test-person-id' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
      
      restoreFetch();
    });

    it('should show loading state during transitions', async () => {
      const props = createTestRecordPageProps('people');
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Simulate section transition
      const transitionEvent = new CustomEvent('pipeline-section-change', {
        detail: { from: 'people', to: 'companies' }
      });
      window.dispatchEvent(transitionEvent);
      
      // Should show transition loading state
      expect(screen.getByTestId('transition-loading')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('should catch and display component errors', async () => {
      // Mock a component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error');
      };
      
      const props = createTestRecordPageProps('people');
      
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      // Should show error boundary
      await waitFor(() => {
        expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      });
      
      console.error = originalError;
    });
  });

  describe('Standalone Mode', () => {
    it('should render in standalone mode when specified', async () => {
      const props = createTestRecordPageProps('people', { standalone: true });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('standalone-mode')).toBeInTheDocument();
    });

    it('should render in embedded mode by default', async () => {
      const props = createTestRecordPageProps('people', { standalone: false });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      expect(screen.getByTestId('embedded-mode')).toBeInTheDocument();
    });
  });
});
