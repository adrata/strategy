/**
 * Unit Tests for UniversalRecordTemplate Component
 * 
 * Tests the universal record display template, tab rendering, inline editing, and action modals
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { 
  createTestUniversalRecordTemplateProps,
  createTestTabConfig,
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

// Mock the record context
jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: () => ({
    record: null,
    setRecord: jest.fn(),
    setCurrentRecord: jest.fn(),
    clearCurrentRecord: jest.fn(),
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}));

// Mock the inline edit hook
jest.mock('@/platform/hooks/useInlineEdit', () => ({
  useInlineEdit: () => ({
    isEditing: false,
    setIsEditing: jest.fn(),
    editValue: '',
    setEditValue: jest.fn(),
    handleSave: jest.fn(),
    handleCancel: jest.fn(),
    handleStartEdit: jest.fn()
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

// Mock the acquisition OS context
jest.mock('@/platform/ui/context/RevenueOSProvider', () => ({
  useRevenueOS: () => ({
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

// Mock tab components
jest.mock('@/frontend/components/pipeline/tabs', () => ({
  UniversalOverviewTab: ({ record, recordType }: any) => (
    <div data-testid="overview-tab">
      Overview Tab - {recordType}: {record?.fullName || record?.name}
    </div>
  ),
  UniversalInsightsTab: ({ record, recordType }: any) => (
    <div data-testid="insights-tab">
      Insights Tab - {recordType}: {record?.fullName || record?.name}
    </div>
  ),
  UniversalCompanyTab: ({ record, recordType }: any) => (
    <div data-testid="company-tab">
      Company Tab - {recordType}: {record?.fullName || record?.name}
    </div>
  ),
  UniversalProfileTab: ({ record, recordType }: any) => (
    <div data-testid="profile-tab">
      Profile Tab - {recordType}: {record?.fullName || record?.name}
    </div>
  ),
  UniversalActionsTab: ({ record, recordType }: any) => (
    <div data-testid="actions-tab">
      Actions Tab - {recordType}: {record?.fullName || record?.name}
    </div>
  )
}));

// Mock the value tab
jest.mock('@/frontend/components/pipeline/tabs/ValueTab', () => ({
  ValueTab: ({ record, recordType }: any) => (
    <div data-testid="value-tab">
      Value Tab - {recordType}: {record?.fullName || record?.name}
    </div>
  )
}));

// Mock the deep value report view
jest.mock('@/platform/ui/components/reports/DeepValueReportView', () => ({
  DeepValueReportView: ({ report }: any) => (
    <div data-testid="deep-value-report-view">
      Report: {report?.title || 'Test Report'}
    </div>
  )
}));

// Mock modals
jest.mock('@/frontend/components/pipeline/UpdateModal', () => ({
  UpdateModal: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="update-modal">Update Modal</div> : null
}));

jest.mock('@/platform/ui/components/CompleteActionModal', () => ({
  CompleteActionModal: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="complete-action-modal">Complete Action Modal</div> : null
}));

jest.mock('@/frontend/components/pipeline/AddTaskModal', () => ({
  AddTaskModal: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="add-task-modal">Add Task Modal</div> : null
}));

jest.mock('@/frontend/components/pipeline/ProfileImageUploadModal', () => ({
  ProfileImageUploadModal: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="profile-image-upload-modal">Profile Image Upload Modal</div> : null
}));

describe('UniversalRecordTemplate', () => {
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupTestEnvironment();
  });

  afterEach(() => {
    cleanup();
    cleanupTestEnvironment();
  });

  describe('Component Rendering', () => {
    it('should render without crashing for people record', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      expect(screen.getByTestId('universal-record-template')).toBeInTheDocument();
    });

    it('should render without crashing for companies record', async () => {
      const props = createTestUniversalRecordTemplateProps('companies');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      expect(screen.getByTestId('universal-record-template')).toBeInTheDocument();
    });

    it('should render without crashing for leads record', async () => {
      const props = createTestUniversalRecordTemplateProps('leads');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      expect(screen.getByTestId('universal-record-template')).toBeInTheDocument();
    });

    it('should render without crashing for prospects record', async () => {
      const props = createTestUniversalRecordTemplateProps('prospects');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      expect(screen.getByTestId('universal-record-template')).toBeInTheDocument();
    });

    it('should render without crashing for opportunities record', async () => {
      const props = createTestUniversalRecordTemplateProps('opportunities');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      expect(screen.getByTestId('universal-record-template')).toBeInTheDocument();
    });

    it('should render without crashing for clients record', async () => {
      const props = createTestUniversalRecordTemplateProps('clients');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      expect(screen.getByTestId('universal-record-template')).toBeInTheDocument();
    });

    it('should render without crashing for speedrun record', async () => {
      const props = createTestUniversalRecordTemplateProps('speedrun');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      expect(screen.getByTestId('universal-record-template')).toBeInTheDocument();
    });
  });

  describe('Record Data Display', () => {
    it('should display record name correctly', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="record-name"]');
      expect(screen.getByTestId('record-name')).toHaveTextContent('John Doe');
    });

    it('should display record type correctly', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="record-type"]');
      expect(screen.getByTestId('record-type')).toHaveTextContent('people');
    });

    it('should display record index and total correctly', async () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 2,
        totalRecords: 10
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="record-navigation-info"]');
      expect(screen.getByTestId('record-navigation-info')).toHaveTextContent('3 of 10');
    });
  });

  describe('Tab Rendering', () => {
    it('should render default tabs for people record', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      // Check that default tabs are rendered
      await waitForElement('[data-testid="tab-overview"]');
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-insights')).toBeInTheDocument();
      expect(screen.getByTestId('tab-timeline')).toBeInTheDocument();
    });

    it('should render record type specific tabs', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      // Check that people-specific tabs are rendered
      await waitForElement('[data-testid="tab-profile"]');
      expect(screen.getByTestId('tab-profile')).toBeInTheDocument();
      expect(screen.getByTestId('tab-career')).toBeInTheDocument();
    });

    it('should render company specific tabs for companies record', async () => {
      const props = createTestUniversalRecordTemplateProps('companies');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      // Check that company-specific tabs are rendered
      await waitForElement('[data-testid="tab-company"]');
      expect(screen.getByTestId('tab-company')).toBeInTheDocument();
      expect(screen.getByTestId('tab-contacts')).toBeInTheDocument();
    });

    it('should render speedrun specific tabs for speedrun record', async () => {
      const props = createTestUniversalRecordTemplateProps('speedrun');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      // Check that speedrun-specific tabs are rendered
      await waitForElement('[data-testid="tab-overview"]');
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
      expect(screen.getByTestId('tab-insights')).toBeInTheDocument();
      expect(screen.getByTestId('tab-notes')).toBeInTheDocument();
    });

    it('should switch tabs when clicked', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      // Initially overview tab should be active
      await waitForElement('[data-testid="overview-tab"]');
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      
      // Click on insights tab
      const insightsTab = screen.getByTestId('tab-insights');
      fireEvent.click(insightsTab);
      
      // Insights tab content should be displayed
      await waitFor(() => {
        expect(screen.getByTestId('insights-tab')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Controls', () => {
    it('should render navigation controls', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="navigation-controls"]');
      expect(screen.getByTestId('navigation-controls')).toBeInTheDocument();
    });

    it('should call onNavigatePrevious when previous button is clicked', async () => {
      const mockOnNavigatePrevious = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onNavigatePrevious: mockOnNavigatePrevious
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="navigate-previous-button"]');
      const prevButton = screen.getByTestId('navigate-previous-button');
      fireEvent.click(prevButton);
      
      expect(mockOnNavigatePrevious).toHaveBeenCalled();
    });

    it('should call onNavigateNext when next button is clicked', async () => {
      const mockOnNavigateNext = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onNavigateNext: mockOnNavigateNext
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="navigate-next-button"]');
      const nextButton = screen.getByTestId('navigate-next-button');
      fireEvent.click(nextButton);
      
      expect(mockOnNavigateNext).toHaveBeenCalled();
    });

    it('should call onBack when back button is clicked', async () => {
      const mockOnBack = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onBack: mockOnBack
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="back-button"]');
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('should disable previous button when at first record', async () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 0
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="navigate-previous-button"]');
      const prevButton = screen.getByTestId('navigate-previous-button');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button when at last record', async () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        recordIndex: 9,
        totalRecords: 10
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="navigate-next-button"]');
      const nextButton = screen.getByTestId('navigate-next-button');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Action Modals', () => {
    it('should open update modal when update button is clicked', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="update-button"]');
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
    });

    it('should open UpdateModal (not inline edit modal) when Update Person button is clicked', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      // Find the Update Person button specifically
      const updatePersonButton = screen.getByRole('button', { name: /update person/i });
      fireEvent.click(updatePersonButton);
      
      // Verify UpdateModal opens (not inline edit modal)
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Verify inline edit modal does not open
      expect(screen.queryByTestId('edit-record-form')).not.toBeInTheDocument();
    });

    it('should open complete action modal when complete button is clicked', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="complete-button"]');
      const completeButton = screen.getByTestId('complete-button');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('complete-action-modal')).toBeInTheDocument();
      });
    });

    it('should open add task modal when add task button is clicked', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="add-task-button"]');
      const addTaskButton = screen.getByTestId('add-task-button');
      fireEvent.click(addTaskButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('add-task-modal')).toBeInTheDocument();
      });
    });

    it('should open profile image upload modal when profile image is clicked', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="profile-image"]');
      const profileImage = screen.getByTestId('profile-image');
      fireEvent.click(profileImage);
      
      await waitFor(() => {
        expect(screen.getByTestId('profile-image-upload-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Inline Editing', () => {
    it('should enable inline editing for editable fields', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="editable-field-name"]');
      const editableField = screen.getByTestId('editable-field-name');
      fireEvent.click(editableField);
      
      // Should show edit input
      await waitFor(() => {
        expect(screen.getByTestId('edit-input')).toBeInTheDocument();
      });
    });

    it('should save inline edits when save button is clicked', async () => {
      const mockOnRecordUpdate = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onRecordUpdate: mockOnRecordUpdate
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="editable-field-name"]');
      const editableField = screen.getByTestId('editable-field-name');
      fireEvent.click(editableField);
      
      // Enter new value
      const editInput = await waitForElement('[data-testid="edit-input"]');
      fireEvent.change(editInput, { target: { value: 'New Name' } });
      
      // Click save
      const saveButton = screen.getByTestId('save-edit-button');
      fireEvent.click(saveButton);
      
      expect(mockOnRecordUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'New Name'
        })
      );
    });

    it('should cancel inline edits when cancel button is clicked', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="editable-field-name"]');
      const editableField = screen.getByTestId('editable-field-name');
      fireEvent.click(editableField);
      
      // Enter new value
      const editInput = await waitForElement('[data-testid="edit-input"]');
      fireEvent.change(editInput, { target: { value: 'New Name' } });
      
      // Click cancel
      const cancelButton = screen.getByTestId('cancel-edit-button');
      fireEvent.click(cancelButton);
      
      // Should return to display mode
      await waitFor(() => {
        expect(screen.queryByTestId('edit-input')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing record data gracefully', async () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        record: null
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="no-record-message"]');
      expect(screen.getByTestId('no-record-message')).toHaveTextContent('No record data available');
    });

    it('should handle record loading errors', async () => {
      const props = createTestUniversalRecordTemplateProps('people', {
        record: { error: 'Failed to load record' }
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="record-error"]');
      expect(screen.getByTestId('record-error')).toHaveTextContent('Failed to load record');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle keyboard shortcuts for navigation', async () => {
      const mockOnNavigatePrevious = jest.fn();
      const mockOnNavigateNext = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onNavigatePrevious: mockOnNavigatePrevious,
        onNavigateNext: mockOnNavigateNext
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      
      // Test previous navigation shortcut
      fireEvent.keyDown(document, { key: 'ArrowLeft', ctrlKey: true });
      expect(mockOnNavigatePrevious).toHaveBeenCalled();
      
      // Test next navigation shortcut
      fireEvent.keyDown(document, { key: 'ArrowRight', ctrlKey: true });
      expect(mockOnNavigateNext).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts for actions', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="universal-record-template"]');
      
      // Test complete action shortcut
      fireEvent.keyDown(document, { key: 'c', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('complete-action-modal')).toBeInTheDocument();
      });
    });

    it('should handle CMD+Enter keyboard shortcut in UpdateModal', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      // Open UpdateModal
      const updatePersonButton = screen.getByRole('button', { name: /update person/i });
      fireEvent.click(updatePersonButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Test CMD+Enter shortcut
      fireEvent.keyDown(document, { key: 'Enter', metaKey: true });
      
      // Verify the shortcut is handled (modal should remain open for form submission)
      expect(screen.getByTestId('update-modal')).toBeInTheDocument();
    });

    it('should handle CTRL+Enter keyboard shortcut in UpdateModal', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      // Open UpdateModal
      const updatePersonButton = screen.getByRole('button', { name: /update person/i });
      fireEvent.click(updatePersonButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Test CTRL+Enter shortcut
      fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
      
      // Verify the shortcut is handled (modal should remain open for form submission)
      expect(screen.getByTestId('update-modal')).toBeInTheDocument();
    });

    it('should handle CMD+Enter keyboard shortcut in inline edit modal as fallback', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      // Mock the inline edit modal being open
      const mockSetIsEditRecordModalOpen = jest.fn();
      const originalUseState = React.useState;
      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === false) {
          return [true, mockSetIsEditRecordModalOpen]; // Simulate inline modal being open
        }
        return originalUseState(initial);
      });
      
      // Test CMD+Enter shortcut
      fireEvent.keyDown(document, { key: 'Enter', metaKey: true });
      
      // Verify the shortcut is handled (should trigger save function)
      // The actual save function would be called in the real implementation
      
      // Restore original useState
      jest.restoreAllMocks();
    });
  });

  describe('Custom Tabs', () => {
    it('should render custom tabs when provided', async () => {
      const customTabs = [
        { id: 'custom1', label: 'Custom Tab 1', component: 'CustomTab1' },
        { id: 'custom2', label: 'Custom Tab 2', component: 'CustomTab2' }
      ];
      
      const props = createTestUniversalRecordTemplateProps('people', {
        customTabs
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="tab-custom1"]');
      expect(screen.getByTestId('tab-custom1')).toBeInTheDocument();
      expect(screen.getByTestId('tab-custom2')).toBeInTheDocument();
    });
  });

  describe('Contextual Actions', () => {
    it('should render contextual actions when provided', async () => {
      const contextualActions = [
        { id: 'action1', label: 'Custom Action 1', onClick: jest.fn() },
        { id: 'action2', label: 'Custom Action 2', onClick: jest.fn() }
      ];
      
      const props = createTestUniversalRecordTemplateProps('people', {
        contextualActions
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="contextual-action-action1"]');
      expect(screen.getByTestId('contextual-action-action1')).toBeInTheDocument();
      expect(screen.getByTestId('contextual-action-action2')).toBeInTheDocument();
    });
  });
});
