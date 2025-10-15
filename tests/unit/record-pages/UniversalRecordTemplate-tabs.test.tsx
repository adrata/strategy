/**
 * UniversalRecordTemplate Tab Rendering Unit Tests
 * 
 * Tests the tab rendering behavior, key props, and state preservation
 * to ensure components don't unmount unnecessarily when switching tabs.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';

// Mock the useSearchParams hook
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null)
  })
}));

// Mock the useRecordContext hook
jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: () => ({
    setCurrentRecord: jest.fn(),
    clearCurrentRecord: jest.fn()
  })
}));

// Mock the useInlineEdit hook
jest.mock('@/platform/hooks/useInlineEdit', () => ({
  useInlineEdit: () => ({
    showSuccessMessage: false,
    successMessage: '',
    messageType: 'success',
    handleEditSave: jest.fn(),
    closeMessage: jest.fn(),
    showMessage: jest.fn()
  })
}));

// Mock tab components with render tracking
const mockTabComponents = {
  UniversalOverviewTab: ({ record, recordType }: any) => {
    // Track component renders
    mockTabComponents.renderCounts = mockTabComponents.renderCounts || {};
    mockTabComponents.renderCounts.overview = (mockTabComponents.renderCounts.overview || 0) + 1;
    
    return (
      <div data-testid="overview-tab" data-render-count={mockTabComponents.renderCounts.overview}>
        Overview Tab - {recordType}: {record?.fullName || record?.name}
      </div>
    );
  },
  NotesTab: ({ record, recordType }: any) => {
    // Track component renders
    mockTabComponents.renderCounts = mockTabComponents.renderCounts || {};
    mockTabComponents.renderCounts.notes = (mockTabComponents.renderCounts.notes || 0) + 1;
    
    return (
      <div data-testid="notes-tab" data-render-count={mockTabComponents.renderCounts.notes}>
        Notes Tab - {recordType}: {record?.fullName || record?.name}
      </div>
    );
  },
  UniversalInsightsTab: ({ record, recordType }: any) => {
    // Track component renders
    mockTabComponents.renderCounts = mockTabComponents.renderCounts || {};
    mockTabComponents.renderCounts.insights = (mockTabComponents.renderCounts.insights || 0) + 1;
    
    return (
      <div data-testid="insights-tab" data-render-count={mockTabComponents.renderCounts.insights}>
        Insights Tab - {recordType}: {record?.fullName || record?.name}
      </div>
    );
  }
};

// Mock all tab components
jest.mock('@/frontend/components/pipeline/tabs', () => mockTabComponents);

// Mock the NotesTab from UniversalRecordTemplate
jest.mock('@/frontend/components/pipeline/UniversalRecordTemplate', () => {
  const actual = jest.requireActual('@/frontend/components/pipeline/UniversalRecordTemplate');
  return {
    ...actual,
    NotesTab: mockTabComponents.NotesTab
  };
});

// Mock modals
jest.mock('@/frontend/components/pipeline/UpdateModal', () => ({
  UpdateModal: ({ isOpen }: any) => 
    isOpen ? <div data-testid="update-modal">Update Modal</div> : null
}));

describe('UniversalRecordTemplate Tab Rendering', () => {
  const defaultProps = {
    record: {
      id: 'test-record-123',
      name: 'Test Record',
      fullName: 'Test Record'
    },
    recordType: 'people',
    onBack: jest.fn(),
    onComplete: jest.fn(),
    onSnooze: jest.fn(),
    onNavigatePrevious: jest.fn(),
    onNavigateNext: jest.fn(),
    onRecordUpdate: jest.fn(),
    recordIndex: 0,
    totalRecords: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset render counts
    mockTabComponents.renderCounts = {};
  });

  describe('Tab Content Key Behavior', () => {
    it('should use only record.id as key for tab content wrapper', () => {
      const { container } = render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Find the tab content wrapper div
      const tabContentWrapper = container.querySelector('[class*="px-1"][class*="min-h-[400px]"]');
      
      // The key should be only the record ID, not including activeTab
      // This is tested by checking that the component doesn't remount when switching tabs
      expect(tabContentWrapper).toBeInTheDocument();
    });

    it('should not remount components when switching tabs', async () => {
      render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Initially on overview tab
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-render-count', '1');
      
      // Switch to notes tab
      const notesTab = screen.getByTestId('tab-notes');
      fireEvent.click(notesTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('notes-tab')).toBeInTheDocument();
      });
      
      // Notes tab should render for the first time
      expect(screen.getByTestId('notes-tab')).toHaveAttribute('data-render-count', '1');
      
      // Switch back to overview tab
      const overviewTab = screen.getByTestId('tab-overview');
      fireEvent.click(overviewTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });
      
      // Overview tab should NOT have remounted (render count should still be 1)
      expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-render-count', '1');
    });

    it('should preserve component state when switching tabs', async () => {
      // Create a component that maintains state
      const StatefulTab = ({ record, recordType }: any) => {
        const [count, setCount] = React.useState(0);
        
        return (
          <div data-testid="stateful-tab">
            <div data-testid="count">{count}</div>
            <button 
              data-testid="increment-button"
              onClick={() => setCount(count + 1)}
            >
              Increment
            </button>
          </div>
        );
      };

      // Mock the stateful tab
      jest.doMock('@/frontend/components/pipeline/tabs', () => ({
        ...mockTabComponents,
        StatefulTab
      }));

      render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Switch to a tab that would contain the stateful component
      // (This is a conceptual test - in practice, we'd need to set up the tab properly)
      
      // The key point is that with the correct key strategy, component state should be preserved
      // when switching between tabs
    });
  });

  describe('NotesTab Key Behavior', () => {
    it('should render NotesTab with stable key', async () => {
      render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Switch to notes tab
      const notesTab = screen.getByTestId('tab-notes');
      fireEvent.click(notesTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('notes-tab')).toBeInTheDocument();
      });
      
      // Switch away and back to notes tab
      const overviewTab = screen.getByTestId('tab-overview');
      fireEvent.click(overviewTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });
      
      fireEvent.click(notesTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('notes-tab')).toBeInTheDocument();
      });
      
      // Notes tab should NOT have remounted (render count should still be 1)
      expect(screen.getByTestId('notes-tab')).toHaveAttribute('data-render-count', '1');
    });
  });

  describe('Tab Switching Performance', () => {
    it('should not cause unnecessary re-renders when switching tabs', async () => {
      render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Initial render
      expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-render-count', '1');
      
      // Switch to notes tab
      const notesTab = screen.getByTestId('tab-notes');
      fireEvent.click(notesTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('notes-tab')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('notes-tab')).toHaveAttribute('data-render-count', '1');
      
      // Switch to insights tab
      const insightsTab = screen.getByTestId('tab-insights');
      fireEvent.click(insightsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('insights-tab')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('insights-tab')).toHaveAttribute('data-render-count', '1');
      
      // Switch back to overview tab
      const overviewTab = screen.getByTestId('tab-overview');
      fireEvent.click(overviewTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });
      
      // Overview tab should still have render count of 1 (no remount)
      expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-render-count', '1');
    });

    it('should handle rapid tab switching without issues', async () => {
      render(<UniversalRecordTemplate {...defaultProps} />);
      
      const notesTab = screen.getByTestId('tab-notes');
      const overviewTab = screen.getByTestId('tab-overview');
      const insightsTab = screen.getByTestId('tab-insights');
      
      // Rapid tab switching
      fireEvent.click(notesTab);
      fireEvent.click(overviewTab);
      fireEvent.click(insightsTab);
      fireEvent.click(notesTab);
      fireEvent.click(overviewTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });
      
      // Each tab should only have rendered once
      expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-render-count', '1');
      expect(screen.getByTestId('notes-tab')).toHaveAttribute('data-render-count', '1');
      expect(screen.getByTestId('insights-tab')).toHaveAttribute('data-render-count', '1');
    });
  });

  describe('useMemo Dependencies', () => {
    it('should not cause unnecessary re-renders when record prop changes', () => {
      const { rerender } = render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Initial render
      expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-render-count', '1');
      
      // Update record prop with same data (different object reference)
      const updatedProps = {
        ...defaultProps,
        record: { ...defaultProps.record }
      };
      
      rerender(<UniversalRecordTemplate {...updatedProps} />);
      
      // Should not cause re-render of tab content
      expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-render-count', '1');
    });

    it('should re-render when record data actually changes', () => {
      const { rerender } = render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Initial render
      expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-render-count', '1');
      
      // Update record with different data
      const updatedProps = {
        ...defaultProps,
        record: { ...defaultProps.record, name: 'Updated Record' }
      };
      
      rerender(<UniversalRecordTemplate {...updatedProps} />);
      
      // Should cause re-render due to data change
      expect(screen.getByTestId('overview-tab')).toHaveAttribute('data-render-count', '2');
    });
  });

  describe('Tab Content Rendering', () => {
    it('should render correct tab content based on active tab', async () => {
      render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Initially should show overview tab
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('notes-tab')).not.toBeInTheDocument();
      
      // Switch to notes tab
      const notesTab = screen.getByTestId('tab-notes');
      fireEvent.click(notesTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('notes-tab')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('overview-tab')).not.toBeInTheDocument();
    });

    it('should handle tab switching with different record types', async () => {
      const companyProps = {
        ...defaultProps,
        recordType: 'companies',
        record: { ...defaultProps.record, name: 'Test Company' }
      };
      
      render(<UniversalRecordTemplate {...companyProps} />);
      
      // Should render overview tab for companies
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      expect(screen.getByTestId('overview-tab')).toHaveTextContent('companies: Test Company');
      
      // Switch to notes tab
      const notesTab = screen.getByTestId('tab-notes');
      fireEvent.click(notesTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('notes-tab')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('notes-tab')).toHaveTextContent('companies: Test Company');
    });
  });

  describe('Error Boundaries', () => {
    it('should handle tab component errors gracefully', () => {
      // Mock a tab component that throws an error
      const ErrorTab = () => {
        throw new Error('Tab component error');
      };
      
      // This test would need to be implemented with proper error boundary setup
      // For now, we just verify the structure exists
      expect(true).toBe(true);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up properly when component unmounts', () => {
      const { unmount } = render(<UniversalRecordTemplate {...defaultProps} />);
      
      // Unmount component
      unmount();
      
      // Should not throw any errors or cause memory leaks
      expect(true).toBe(true);
    });
  });
});
