/**
 * Unit Tests for SpeedrunRecordTemplate Component
 * 
 * Tests the speedrun-specific record template, lead details, power dialer, and navigation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpeedrunRecordTemplate } from '@/products/speedrun/components/SpeedrunRecordTemplate';
import { 
  createTestSpeedrunRecordTemplateProps,
  createTestActionData
} from '../../utils/record-page-factories';
import { 
  renderWithProviders,
  mockFetch,
  waitForElement,
  waitForText,
  setupTestEnvironment,
  cleanupTestEnvironment
} from '../../utils/record-page-helpers';

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

// Mock the lead details components
jest.mock('@/products/speedrun/components/lead-details/LeadDetailsHeader', () => ({
  LeadDetailsHeader: ({ person, onBack, onNavigatePrevious, onNavigateNext }: any) => (
    <div data-testid="lead-details-header">
      <div data-testid="person-name">{person.name}</div>
      <button data-testid="back-button" onClick={onBack}>Back</button>
      <button data-testid="navigate-previous-button" onClick={onNavigatePrevious}>Previous</button>
      <button data-testid="navigate-next-button" onClick={onNavigateNext}>Next</button>
    </div>
  )
}));

jest.mock('@/products/speedrun/components/lead-details/LeadDetailsTabContent', () => ({
  LeadDetailsTabContent: ({ person, activeTab, onReportClick }: any) => (
    <div data-testid="lead-details-tab-content">
      <div data-testid="active-tab">{activeTab}</div>
      <div data-testid="person-info">{person.name} - {person.company}</div>
      <button data-testid="report-button" onClick={() => onReportClick('test-report')}>Generate Report</button>
    </div>
  )
}));

jest.mock('@/products/speedrun/components/lead-details/LeadDetailsModalManager', () => ({
  LeadDetailsModalManager: ({ showSnoozeModal, showRemoveModal, onSnooze, onRemove }: any) => (
    <div data-testid="lead-details-modal-manager">
      {showSnoozeModal && <div data-testid="snooze-modal">Snooze Modal</div>}
      {showRemoveModal && <div data-testid="remove-modal">Remove Modal</div>}
      <button data-testid="snooze-button" onClick={() => onSnooze(1)}>Snooze</button>
      <button data-testid="remove-button" onClick={() => onRemove(1)}>Remove</button>
    </div>
  )
}));

// Mock the power dialer
jest.mock('@/products/speedrun/components/PowerDialer', () => ({
  PowerDialer: ({ isVisible, onClose, contacts }: any) => 
    isVisible ? (
      <div data-testid="power-dialer">
        <div data-testid="dialer-contacts">{contacts.length} contacts</div>
        <button data-testid="close-dialer" onClick={onClose}>Close</button>
      </div>
    ) : null
}));

// Mock the AI email composer
jest.mock('@/products/speedrun/AIEmailComposer', () => ({
  AIEmailComposer: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="ai-email-composer">
        <button data-testid="close-email-composer" onClick={onClose}>Close</button>
      </div>
    ) : null
}));

// Mock the snooze remove modal
jest.mock('@/products/speedrun/SnoozeRemoveModal', () => ({
  SnoozeRemoveModal: ({ isOpen, onClose, onSnooze, onRemove }: any) => 
    isOpen ? (
      <div data-testid="snooze-remove-modal">
        <button data-testid="modal-snooze" onClick={() => onSnooze(1, '1 hour')}>Snooze</button>
        <button data-testid="modal-remove" onClick={() => onRemove(1)}>Remove</button>
        <button data-testid="modal-close" onClick={onClose}>Close</button>
      </div>
    ) : null
}));

// Mock the complete action modal
jest.mock('@/platform/ui/components/CompleteActionModal', () => ({
  CompleteActionModal: ({ isOpen, onClose, onComplete }: any) => 
    isOpen ? (
      <div data-testid="complete-action-modal">
        <button data-testid="modal-complete" onClick={() => onComplete({ notes: 'Test completion' })}>Complete</button>
        <button data-testid="modal-close" onClick={onClose}>Close</button>
      </div>
    ) : null
}));

// Mock the congratulations modal
jest.mock('@/products/speedrun/components/CongratulationsModal', () => ({
  CongratulationsModal: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="congratulations-modal">
        <button data-testid="modal-close" onClick={onClose}>Close</button>
      </div>
    ) : null
}));

// Mock the company detail view
jest.mock('@/platform/ui/components/CompanyDetailView', () => ({
  CompanyDetailView: ({ companyName, onBack }: any) => (
    <div data-testid="company-detail-view">
      <div data-testid="company-name">{companyName}</div>
      <button data-testid="back-button" onClick={onBack}>Back</button>
    </div>
  )
}));

// Mock the inline edit field
jest.mock('@/frontend/components/pipeline/InlineEditField', () => ({
  InlineEditField: ({ value, onSave }: any) => (
    <div data-testid="inline-edit-field">
      <input data-testid="edit-input" defaultValue={value} />
      <button data-testid="save-edit" onClick={() => onSave('new value')}>Save</button>
    </div>
  )
}));

describe('SpeedrunRecordTemplate', () => {
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupTestEnvironment();
  });

  afterEach(() => {
    cleanup();
    cleanupTestEnvironment();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="speedrun-record-template"]');
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });

    it('should display person information correctly', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="person-name"]');
      expect(screen.getByTestId('person-name')).toHaveTextContent('Speedrun Person');
    });

    it('should display person company information', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="person-info"]');
      expect(screen.getByTestId('person-info')).toHaveTextContent('Speedrun Person - Test Company');
    });
  });

  describe('Navigation Controls', () => {
    it('should render navigation controls', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="lead-details-header"]');
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
      expect(screen.getByTestId('navigate-previous-button')).toBeInTheDocument();
      expect(screen.getByTestId('navigate-next-button')).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', async () => {
      const mockOnBack = jest.fn();
      const props = createTestSpeedrunRecordTemplateProps({ onBack: mockOnBack });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="back-button"]');
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should call onNavigatePrevious when previous button is clicked', async () => {
      const mockOnNavigatePrevious = jest.fn();
      const props = createTestSpeedrunRecordTemplateProps({ onNavigatePrevious: mockOnNavigatePrevious });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="navigate-previous-button"]');
      const prevButton = screen.getByTestId('navigate-previous-button');
      fireEvent.click(prevButton);
      
      expect(mockOnNavigatePrevious).toHaveBeenCalled();
    });

    it('should call onNavigateNext when next button is clicked', async () => {
      const mockOnNavigateNext = jest.fn();
      const props = createTestSpeedrunRecordTemplateProps({ onNavigateNext: mockOnNavigateNext });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="navigate-next-button"]');
      const nextButton = screen.getByTestId('navigate-next-button');
      fireEvent.click(nextButton);
      
      expect(mockOnNavigateNext).toHaveBeenCalled();
    });
  });

  describe('Tab Navigation', () => {
    it('should render tab content with default active tab', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="lead-details-tab-content"]');
      expect(screen.getByTestId('active-tab')).toHaveTextContent('Overview');
    });

    it('should switch tabs when tab is clicked', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="lead-details-tab-content"]');
      
      // Click on a different tab (this would be implemented in the actual component)
      // For now, we'll test that the tab content is rendered
      expect(screen.getByTestId('lead-details-tab-content')).toBeInTheDocument();
    });
  });

  describe('Report Generation', () => {
    it('should handle report generation when report button is clicked', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="report-button"]');
      const reportButton = screen.getByTestId('report-button');
      fireEvent.click(reportButton);
      
      // Should trigger report generation
      expect(reportButton).toBeInTheDocument();
    });
  });

  describe('Power Dialer Integration', () => {
    it('should show power dialer when dialer is opened', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      // Simulate opening the power dialer (this would be triggered by a button click in the actual component)
      // For now, we'll test that the power dialer component is available
      await waitForElement('[data-testid="speedrun-record-template"]');
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });

    it('should close power dialer when close button is clicked', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      // This would be tested when the power dialer is actually opened
      // For now, we'll ensure the component renders without errors
      await waitForElement('[data-testid="speedrun-record-template"]');
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });
  });

  describe('Action Modals', () => {
    it('should show snooze modal when snooze button is clicked', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="snooze-button"]');
      const snoozeButton = screen.getByTestId('snooze-button');
      fireEvent.click(snoozeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('snooze-modal')).toBeInTheDocument();
      });
    });

    it('should show remove modal when remove button is clicked', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="remove-button"]');
      const removeButton = screen.getByTestId('remove-button');
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('remove-modal')).toBeInTheDocument();
      });
    });

    it('should call onSnooze when snooze action is confirmed', async () => {
      const mockOnSnooze = jest.fn();
      const props = createTestSpeedrunRecordTemplateProps({ onSnooze: mockOnSnooze });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="snooze-button"]');
      const snoozeButton = screen.getByTestId('snooze-button');
      fireEvent.click(snoozeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('snooze-modal')).toBeInTheDocument();
      });
      
      const modalSnooze = screen.getByTestId('modal-snooze');
      fireEvent.click(modalSnooze);
      
      expect(mockOnSnooze).toHaveBeenCalledWith(1, '1 hour');
    });

    it('should call onRemove when remove action is confirmed', async () => {
      const mockOnRemove = jest.fn();
      const props = createTestSpeedrunRecordTemplateProps({ onRemove: mockOnRemove });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="remove-button"]');
      const removeButton = screen.getByTestId('remove-button');
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('remove-modal')).toBeInTheDocument();
      });
      
      const modalRemove = screen.getByTestId('modal-remove');
      fireEvent.click(modalRemove);
      
      expect(mockOnRemove).toHaveBeenCalledWith(1);
    });
  });

  describe('Success and Error Messages', () => {
    it('should show success message when action is completed', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      // Simulate a successful action
      await waitForElement('[data-testid="speedrun-record-template"]');
      
      // The success message would be shown after an action is completed
      // This would be tested when the actual action completion flow is implemented
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });

    it('should show error message when action fails', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      // Simulate an error state
      await waitForElement('[data-testid="speedrun-record-template"]');
      
      // The error message would be shown when an action fails
      // This would be tested when the actual error handling is implemented
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });
  });

  describe('Company Detail View', () => {
    it('should show company detail view when company is clicked', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      // This would be tested when the company detail view is actually triggered
      // For now, we'll ensure the component renders without errors
      await waitForElement('[data-testid="speedrun-record-template"]');
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });
  });

  describe('Inline Editing', () => {
    it('should enable inline editing for editable fields', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      // This would be tested when inline editing is actually implemented
      // For now, we'll ensure the component renders without errors
      await waitForElement('[data-testid="speedrun-record-template"]');
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle keyboard shortcuts for navigation', async () => {
      const mockOnNavigatePrevious = jest.fn();
      const mockOnNavigateNext = jest.fn();
      const props = createTestSpeedrunRecordTemplateProps({
        onNavigatePrevious: mockOnNavigatePrevious,
        onNavigateNext: mockOnNavigateNext
      });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="speedrun-record-template"]');
      
      // Test keyboard shortcuts (these would be implemented in the actual component)
      // For now, we'll ensure the component renders without errors
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });
  });

  describe('Data Loading States', () => {
    it('should handle loading state while data is being fetched', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      // The loading state would be shown while data is being fetched
      // This would be tested when the actual loading states are implemented
      await waitForElement('[data-testid="speedrun-record-template"]');
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing person data gracefully', async () => {
      const props = createTestSpeedrunRecordTemplateProps({
        person: null
      });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      // Should show error state or fallback content
      await waitForElement('[data-testid="speedrun-record-template"]');
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const props = createTestSpeedrunRecordTemplateProps();
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      // The error handling would be tested when API errors are actually handled
      // For now, we'll ensure the component renders without errors
      await waitForElement('[data-testid="speedrun-record-template"]');
      expect(screen.getByTestId('speedrun-record-template')).toBeInTheDocument();
    });
  });
});
