/**
 * Integration Tests for Record Actions
 * 
 * Tests complete action logging, record updates, and delete operations
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { SpeedrunRecordTemplate } from '@/products/speedrun/components/SpeedrunRecordTemplate';
import { 
  createTestUniversalRecordTemplateProps,
  createTestSpeedrunRecordTemplateProps,
  createTestActionData
} from '../../utils/record-page-factories';
import { 
  renderWithProviders,
  mockFetch,
  waitForElement,
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

jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: () => ({
    record: null,
    setRecord: jest.fn(),
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

// Mock modals
jest.mock('@/frontend/components/pipeline/UpdateModal', () => ({
  UpdateModal: ({ isOpen, onClose, onSave }: any) => 
    isOpen ? (
      <div data-testid="update-modal">
        <input data-testid="update-field" placeholder="Update field" />
        <button data-testid="save-update" onClick={() => onSave({ field: 'test', value: 'new value' })}>Save</button>
        <button data-testid="close-update" onClick={onClose}>Close</button>
      </div>
    ) : null
}));

jest.mock('@/platform/ui/components/CompleteActionModal', () => ({
  CompleteActionModal: ({ isOpen, onClose, onComplete }: any) => 
    isOpen ? (
      <div data-testid="complete-action-modal">
        <textarea data-testid="action-notes" placeholder="Action notes" />
        <select data-testid="action-outcome">
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
        <button data-testid="complete-action" onClick={() => onComplete({ 
          notes: 'Test completion', 
          outcome: 'positive' 
        })}>Complete</button>
        <button data-testid="close-complete" onClick={onClose}>Close</button>
      </div>
    ) : null
}));

jest.mock('@/products/speedrun/SnoozeRemoveModal', () => ({
  SnoozeRemoveModal: ({ isOpen, onClose, onSnooze, onRemove }: any) => 
    isOpen ? (
      <div data-testid="snooze-remove-modal">
        <select data-testid="snooze-duration">
          <option value="1 hour">1 Hour</option>
          <option value="1 day">1 Day</option>
          <option value="1 week">1 Week</option>
        </select>
        <button data-testid="confirm-snooze" onClick={() => onSnooze(1, '1 hour')}>Snooze</button>
        <button data-testid="confirm-remove" onClick={() => onRemove(1)}>Remove</button>
        <button data-testid="close-snooze-remove" onClick={onClose}>Close</button>
      </div>
    ) : null
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

describe('Record Actions Integration', () => {
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupTestEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    cleanupTestEnvironment();
  });

  describe('Complete Action Logging', () => {
    it('should complete action with notes and outcome', async () => {
      const mockOnRecordUpdate = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onRecordUpdate: mockOnRecordUpdate
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="complete-button"]');
      const completeButton = screen.getByTestId('complete-button');
      fireEvent.click(completeButton);
      
      // Should open complete action modal
      await waitFor(() => {
        expect(screen.getByTestId('complete-action-modal')).toBeInTheDocument();
      });
      
      // Fill in action details
      const notesField = screen.getByTestId('action-notes');
      fireEvent.change(notesField, { target: { value: 'Test completion notes' } });
      
      const outcomeSelect = screen.getByTestId('action-outcome');
      fireEvent.change(outcomeSelect, { target: { value: 'positive' } });
      
      // Complete the action
      const completeActionButton = screen.getByTestId('complete-action');
      fireEvent.click(completeActionButton);
      
      // Should call onRecordUpdate with completion data
      expect(mockOnRecordUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCompleted: true,
          actionNotes: 'Test completion notes',
          actionOutcome: 'positive'
        })
      );
    });

    it('should handle complete action API call', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          id: 'action-123',
          status: 'completed',
          notes: 'Test completion',
          outcome: 'positive'
        }
      };
      const restoreFetch = mockFetch(mockApiResponse);
      
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="complete-button"]');
      const completeButton = screen.getByTestId('complete-button');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('complete-action-modal')).toBeInTheDocument();
      });
      
      const completeActionButton = screen.getByTestId('complete-action');
      fireEvent.click(completeActionButton);
      
      // Should make API call to complete action
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/actions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      
      restoreFetch();
    });

    it('should handle complete action errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Failed to complete action'
      };
      const restoreFetch = mockFetch(mockErrorResponse, 500);
      
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="complete-button"]');
      const completeButton = screen.getByTestId('complete-button');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('complete-action-modal')).toBeInTheDocument();
      });
      
      const completeActionButton = screen.getByTestId('complete-action');
      fireEvent.click(completeActionButton);
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      restoreFetch();
    });
  });

  describe('Record Updates', () => {
    it('should update record field successfully', async () => {
      const mockOnRecordUpdate = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onRecordUpdate: mockOnRecordUpdate
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="update-button"]');
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
      
      // Should open update modal
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Fill in update data
      const updateField = screen.getByTestId('update-field');
      fireEvent.change(updateField, { target: { value: 'Updated value' } });
      
      // Save update
      const saveUpdateButton = screen.getByTestId('save-update');
      fireEvent.click(saveUpdateButton);
      
      // Should call onRecordUpdate with new data
      expect(mockOnRecordUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          field: 'test',
          value: 'new value'
        })
      );
    });

    it('should handle inline field updates', async () => {
      const mockOnRecordUpdate = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onRecordUpdate: mockOnRecordUpdate
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="editable-field-name"]');
      const editableField = screen.getByTestId('editable-field-name');
      fireEvent.click(editableField);
      
      // Should show edit input
      await waitFor(() => {
        expect(screen.getByTestId('edit-input')).toBeInTheDocument();
      });
      
      // Enter new value
      const editInput = screen.getByTestId('edit-input');
      fireEvent.change(editInput, { target: { value: 'New Name' } });
      
      // Save edit
      const saveEditButton = screen.getByTestId('save-edit');
      fireEvent.click(saveEditButton);
      
      // Should call onRecordUpdate
      expect(mockOnRecordUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'new value'
        })
      );
    });

    it('should handle update API call', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          id: 'record-123',
          fullName: 'Updated Name',
          updatedAt: new Date().toISOString()
        }
      };
      const restoreFetch = mockFetch(mockApiResponse);
      
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="update-button"]');
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      const saveUpdateButton = screen.getByTestId('save-update');
      fireEvent.click(saveUpdateButton);
      
      // Should make API call to update record
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/people/'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      
      restoreFetch();
    });

    it('should handle update errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Failed to update record'
      };
      const restoreFetch = mockFetch(mockErrorResponse, 500);
      
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="update-button"]');
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      const saveUpdateButton = screen.getByTestId('save-update');
      fireEvent.click(saveUpdateButton);
      
      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      restoreFetch();
    });
  });

  describe('Delete Operations', () => {
    it('should delete record with confirmation', async () => {
      const mockOnRecordUpdate = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onRecordUpdate: mockOnRecordUpdate
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="delete-button"]');
      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.click(deleteButton);
      
      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
      });
      
      // Confirm deletion
      const confirmDeleteButton = screen.getByTestId('confirm-delete');
      fireEvent.click(confirmDeleteButton);
      
      // Should call onRecordUpdate with deletion data
      expect(mockOnRecordUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted: true,
          deletedAt: expect.any(String)
        })
      );
    });

    it('should cancel delete operation', async () => {
      const mockOnRecordUpdate = jest.fn();
      const props = createTestUniversalRecordTemplateProps('people', {
        onRecordUpdate: mockOnRecordUpdate
      });
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="delete-button"]');
      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.click(deleteButton);
      
      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
      });
      
      // Cancel deletion
      const cancelDeleteButton = screen.getByTestId('cancel-delete');
      fireEvent.click(cancelDeleteButton);
      
      // Should not call onRecordUpdate
      expect(mockOnRecordUpdate).not.toHaveBeenCalled();
    });

    it('should handle delete API call', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          id: 'record-123',
          deleted: true,
          deletedAt: new Date().toISOString()
        }
      };
      const restoreFetch = mockFetch(mockApiResponse);
      
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="delete-button"]');
      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
      });
      
      const confirmDeleteButton = screen.getByTestId('confirm-delete');
      fireEvent.click(confirmDeleteButton);
      
      // Should make API call to delete record
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/people/'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      
      restoreFetch();
    });
  });

  describe('Speedrun Specific Actions', () => {
    it('should handle speedrun snooze action', async () => {
      const mockOnSnooze = jest.fn();
      const props = createTestSpeedrunRecordTemplateProps({
        onSnooze: mockOnSnooze
      });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="snooze-button"]');
      const snoozeButton = screen.getByTestId('snooze-button');
      fireEvent.click(snoozeButton);
      
      // Should open snooze modal
      await waitFor(() => {
        expect(screen.getByTestId('snooze-modal')).toBeInTheDocument();
      });
      
      // Select snooze duration
      const snoozeDuration = screen.getByTestId('snooze-duration');
      fireEvent.change(snoozeDuration, { target: { value: '1 day' } });
      
      // Confirm snooze
      const confirmSnoozeButton = screen.getByTestId('confirm-snooze');
      fireEvent.click(confirmSnoozeButton);
      
      // Should call onSnooze with duration
      expect(mockOnSnooze).toHaveBeenCalledWith(1, '1 day');
    });

    it('should handle speedrun remove action', async () => {
      const mockOnRemove = jest.fn();
      const props = createTestSpeedrunRecordTemplateProps({
        onRemove: mockOnRemove
      });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="remove-button"]');
      const removeButton = screen.getByTestId('remove-button');
      fireEvent.click(removeButton);
      
      // Should open remove modal
      await waitFor(() => {
        expect(screen.getByTestId('remove-modal')).toBeInTheDocument();
      });
      
      // Confirm removal
      const confirmRemoveButton = screen.getByTestId('confirm-remove');
      fireEvent.click(confirmRemoveButton);
      
      // Should call onRemove
      expect(mockOnRemove).toHaveBeenCalledWith(1);
    });

    it('should handle speedrun complete action', async () => {
      const mockOnComplete = jest.fn();
      const props = createTestSpeedrunRecordTemplateProps({
        onComplete: mockOnComplete
      });
      
      renderWithProviders(<SpeedrunRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="complete-button"]');
      const completeButton = screen.getByTestId('complete-button');
      fireEvent.click(completeButton);
      
      // Should open complete action modal
      await waitFor(() => {
        expect(screen.getByTestId('complete-action-modal')).toBeInTheDocument();
      });
      
      // Complete the action
      const completeActionButton = screen.getByTestId('complete-action');
      fireEvent.click(completeActionButton);
      
      // Should call onComplete
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Test completion',
          outcome: 'positive'
        })
      );
    });
  });

  describe('Action Validation', () => {
    it('should validate required fields before completing action', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="complete-button"]');
      const completeButton = screen.getByTestId('complete-button');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('complete-action-modal')).toBeInTheDocument();
      });
      
      // Try to complete without notes
      const completeActionButton = screen.getByTestId('complete-action');
      fireEvent.click(completeActionButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      });
    });

    it('should validate field format before updating', async () => {
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="update-button"]');
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Enter invalid email
      const updateField = screen.getByTestId('update-field');
      fireEvent.change(updateField, { target: { value: 'invalid-email' } });
      
      const saveUpdateButton = screen.getByTestId('save-update');
      fireEvent.click(saveUpdateButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      });
    });
  });

  describe('Action History', () => {
    it('should log action history', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          id: 'action-123',
          type: 'complete',
          recordId: 'record-123',
          recordType: 'people',
          userId: 'test-user-id',
          timestamp: new Date().toISOString(),
          notes: 'Test completion',
          outcome: 'positive'
        }
      };
      const restoreFetch = mockFetch(mockApiResponse);
      
      const props = createTestUniversalRecordTemplateProps('people');
      
      renderWithProviders(<UniversalRecordTemplate {...props} />);
      
      await waitForElement('[data-testid="complete-button"]');
      const completeButton = screen.getByTestId('complete-button');
      fireEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('complete-action-modal')).toBeInTheDocument();
      });
      
      const completeActionButton = screen.getByTestId('complete-action');
      fireEvent.click(completeActionButton);
      
      // Should log action history
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/actions'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"type":"complete"')
        })
      );
      
      restoreFetch();
    });
  });
});
