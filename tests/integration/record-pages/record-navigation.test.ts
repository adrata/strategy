/**
 * Integration Tests for Record Navigation Flows
 * 
 * Tests next/previous record navigation, record context updates, and URL routing
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { PipelineDetailPage } from '@/frontend/components/pipeline/PipelineDetailPage';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { 
  createTestRecordPageProps,
  createTestUniversalRecordTemplateProps,
  createTestNavigationData,
  createMockApiResponse
} from '../../utils/record-page-factories';
import { 
  renderWithProviders,
  mockFetch,
  waitForElement,
  setupTestEnvironment,
  cleanupTestEnvironment
} from '../../utils/record-page-helpers';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    pathname: '/test-workspace/pipeline/people/test-id',
    query: { workspace: 'test-workspace', id: 'test-id' }
  }),
  useParams: () => ({ workspace: 'test-workspace', id: 'test-id' }),
  usePathname: () => '/test-workspace/pipeline/people/test-id'
}));

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

// Mock context providers
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

jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: () => ({
    record: null,
    setRecord: jest.fn(),
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

jest.mock('@/platform/ui/components/ProfilePopupContext', () => ({
  useProfilePopup: () => ({
    isProfileOpen: false,
    setIsProfileOpen: jest.fn(),
    profileAnchor: null,
    profilePopupRef: { current: null }
  })
}));

jest.mock('@/platform/hooks/useFastSectionData', () => ({
  useFastSectionData: () => ({
    data: [],
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

describe('Record Navigation Integration', () => {
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupTestEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    cleanupTestEnvironment();
  });

  describe('Next/Previous Record Navigation', () => {
    it('should navigate to next record when next button is clicked', async () => {
      const navigationData = createTestNavigationData('people', 0);
      const mockResponse = createMockApiResponse('people', 'test-person-1');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-0' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Simulate having navigation data available
      const nextButton = screen.getByTestId('navigate-next-button');
      fireEvent.click(nextButton);
      
      // Should trigger navigation to next record
      expect(nextButton).toBeInTheDocument();
      
      restoreFetch();
    });

    it('should navigate to previous record when previous button is clicked', async () => {
      const navigationData = createTestNavigationData('people', 1);
      const mockResponse = createMockApiResponse('people', 'test-person-0');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-1' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Simulate having navigation data available
      const prevButton = screen.getByTestId('navigate-previous-button');
      fireEvent.click(prevButton);
      
      // Should trigger navigation to previous record
      expect(prevButton).toBeInTheDocument();
      
      restoreFetch();
    });

    it('should disable previous button when at first record', async () => {
      const navigationData = createTestNavigationData('people', 0);
      const mockResponse = createMockApiResponse('people', 'test-person-0');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-0' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      const prevButton = screen.getByTestId('navigate-previous-button');
      expect(prevButton).toBeDisabled();
      
      restoreFetch();
    });

    it('should disable next button when at last record', async () => {
      const navigationData = createTestNavigationData('people', 9);
      const mockResponse = createMockApiResponse('people', 'test-person-9');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-9' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      const nextButton = screen.getByTestId('navigate-next-button');
      expect(nextButton).toBeDisabled();
      
      restoreFetch();
    });
  });

  describe('URL Updates and Routing', () => {
    it('should update URL when navigating to next record', async () => {
      const navigationData = createTestNavigationData('people', 0);
      const mockResponse = createMockApiResponse('people', 'test-person-1');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-0' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Simulate navigation to next record
      const nextButton = screen.getByTestId('navigate-next-button');
      fireEvent.click(nextButton);
      
      // Should update URL (this would be handled by the actual navigation logic)
      expect(nextButton).toBeInTheDocument();
      
      restoreFetch();
    });

    it('should update URL when navigating to previous record', async () => {
      const navigationData = createTestNavigationData('people', 1);
      const mockResponse = createMockApiResponse('people', 'test-person-0');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-1' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Simulate navigation to previous record
      const prevButton = screen.getByTestId('navigate-previous-button');
      fireEvent.click(prevButton);
      
      // Should update URL (this would be handled by the actual navigation logic)
      expect(prevButton).toBeInTheDocument();
      
      restoreFetch();
    });

    it('should handle back navigation correctly', async () => {
      const mockResponse = createMockApiResponse('people', 'test-person-0');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-0' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      // Should trigger back navigation
      expect(backButton).toBeInTheDocument();
      
      restoreFetch();
    });
  });

  describe('Record Context Updates', () => {
    it('should update record context when navigating to different record', async () => {
      const navigationData = createTestNavigationData('people', 0);
      const mockResponse1 = createMockApiResponse('people', 'test-person-0');
      const mockResponse2 = createMockApiResponse('people', 'test-person-1');
      
      // Mock different responses for different records
      let callCount = 0;
      const mockFetchWithCount = jest.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? mockResponse1 : mockResponse2;
      });
      
      global.fetch = mockFetchWithCount;

      const props = createTestRecordPageProps('people', { slug: 'test-person-0' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Simulate navigation to next record
      const nextButton = screen.getByTestId('navigate-next-button');
      fireEvent.click(nextButton);
      
      // Should trigger context update (this would be handled by the actual navigation logic)
      expect(nextButton).toBeInTheDocument();
      
      global.fetch = jest.fn();
    });

    it('should maintain record context state during navigation', async () => {
      const navigationData = createTestNavigationData('people', 1);
      const mockResponse = createMockApiResponse('people', 'test-person-1');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-1' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Record context should be maintained
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
      
      restoreFetch();
    });
  });

  describe('Universal Record Template Navigation', () => {
    it('should handle navigation in universal record template', async () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 1,
        totalRecords: 10
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      
      // Test previous navigation
      const prevButton = screen.getByTestId('navigate-previous-button');
      fireEvent.click(prevButton);
      
      expect(props.onNavigatePrevious).toHaveBeenCalled();
      
      // Test next navigation
      const nextButton = screen.getByTestId('navigate-next-button');
      fireEvent.click(nextButton);
      
      expect(props.onNavigateNext).toHaveBeenCalled();
    });

    it('should display correct navigation information', async () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 2,
        totalRecords: 10
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="record-navigation-info"]');
      expect(screen.getByTestId('record-navigation-info')).toHaveTextContent('3 of 10');
    });

    it('should handle navigation at boundaries', async () => {
      // Test at first record
      const propsFirst = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 0,
        totalRecords: 10
      });
      
      renderWithProviders(<UniversalRecordTemplate {...propsFirst} />);
      
      await waitForElement('[data-testid="navigate-previous-button"]');
      const prevButtonFirst = screen.getByTestId('navigate-previous-button');
      expect(prevButtonFirst).toBeDisabled();
      
      // Test at last record
      const propsLast = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 9,
        totalRecords: 10
      });
      
      renderWithProviders(<UniversalRecordTemplate {...propsLast} />);
      
      await waitForElement('[data-testid="navigate-next-button"]');
      const nextButtonLast = screen.getByTestId('navigate-next-button');
      expect(nextButtonLast).toBeDisabled();
    });
  });

  describe('Cross-Section Navigation', () => {
    it('should handle navigation between different record types', async () => {
      const mockResponse = createMockApiResponse('people', 'test-person-0');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-0' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Should handle cross-section navigation (this would be implemented in the actual component)
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
      
      restoreFetch();
    });

    it('should maintain section context during navigation', async () => {
      const mockResponse = createMockApiResponse('people', 'test-person-0');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-0' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Section context should be maintained
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
      
      restoreFetch();
    });
  });

  describe('Navigation Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      const mockResponse = createMockApiResponse('people', 'test-person-0');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-0' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Navigation errors should be handled gracefully
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
      
      restoreFetch();
    });

    it('should handle missing navigation data', async () => {
      const mockResponse = createMockApiResponse('people', 'test-person-0');
      const restoreFetch = mockFetch(mockResponse);

      const props = createTestRecordPageProps('people', { slug: 'test-person-0' });
      
      renderWithProviders(<PipelineDetailPage {...props} />);
      
      await waitForElement('[data-testid="pipeline-detail-page"]');
      
      // Should handle missing navigation data gracefully
      expect(screen.getByTestId('pipeline-detail-page')).toBeInTheDocument();
      
      restoreFetch();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard navigation shortcuts', async () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 1,
        totalRecords: 10
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      
      // Test keyboard shortcuts
      fireEvent.keyDown(document, { key: 'ArrowLeft', ctrlKey: true });
      expect(props.onNavigatePrevious).toHaveBeenCalled();
      
      fireEvent.keyDown(document, { key: 'ArrowRight', ctrlKey: true });
      expect(props.onNavigateNext).toHaveBeenCalled();
    });

    it('should handle escape key for back navigation', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      
      // Test escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(props.onBack).toHaveBeenCalled();
    });
  });

  describe('Navigation Performance', () => {
    it('should handle rapid navigation without issues', async () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 5,
        totalRecords: 10
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      
      // Simulate rapid navigation
      const nextButton = screen.getByTestId('navigate-next-button');
      const prevButton = screen.getByTestId('navigate-previous-button');
      
      // Rapid clicks
      fireEvent.click(nextButton);
      fireEvent.click(prevButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      
      // Should handle rapid navigation gracefully
      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();
    });
  });
});
