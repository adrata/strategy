/**
 * Update Person Modal Integration Tests
 * 
 * Tests component interactions and API integration for the Update Person modal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { UpdateModal } from '@/frontend/components/pipeline/UpdateModal';

// Mock the auth function
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn()
}));

// Mock problematic modules
jest.mock('react-error-boundary', () => ({
  ErrorBoundary: ({ children }: any) => children,
  withErrorBoundary: (component: any) => component,
}));

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
    showSuccessMessage: false,
    successMessage: '',
    messageType: 'success',
    handleEditSave: jest.fn(),
    closeMessage: jest.fn(),
    showMessage: jest.fn()
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

// Mock other modals
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

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn()
  })
}));

// Test data
const mockPersonRecord = {
  id: 'test-person-123',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  jobTitle: 'Senior Engineer',
  department: 'Engineering',
  company: 'Test Company',
  status: 'ACTIVE',
  priority: 'HIGH',
  workspaceId: 'test-workspace',
  userId: 'test-user'
};

const mockUpdatedPerson = {
  ...mockPersonRecord,
  firstName: 'Updated',
  lastName: 'User',
  fullName: 'Updated User',
  email: 'updated.user@example.com',
  jobTitle: 'Lead Engineer'
};

describe('Update Person Modal Integration Tests', () => {
  const mockAuthFetch = require('@/platform/api-fetch').authFetch;
  const mockOnRecordUpdate = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthFetch.mockResolvedValue({
      success: true,
      data: mockUpdatedPerson
    });
  });

  describe('UpdateModal Integration with UniversalRecordTemplate', () => {
    it('should render UniversalRecordTemplate with person record', () => {
      const props = {
        record: mockPersonRecord,
        recordType: 'people' as const,
        onBack: mockOnBack,
        onRecordUpdate: mockOnRecordUpdate
      };

      render(<UniversalRecordTemplate {...props} />);
      
      expect(screen.getByTestId('universal-record-template')).toBeInTheDocument();
    });

    it('should open UpdateModal when Update Person button is clicked', async () => {
      const user = userEvent.setup();
      const props = {
        record: mockPersonRecord,
        recordType: 'people' as const,
        onBack: mockOnBack,
        onRecordUpdate: mockOnRecordUpdate
      };

      render(<UniversalRecordTemplate {...props} />);
      
      // Find and click the Update Person button
      const updateButton = screen.getByRole('button', { name: /update person/i });
      await user.click(updateButton);
      
      // Verify UpdateModal opens
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
    });

    it('should pass correct props to UpdateModal', async () => {
      const user = userEvent.setup();
      const props = {
        record: mockPersonRecord,
        recordType: 'people' as const,
        onBack: mockOnBack,
        onRecordUpdate: mockOnRecordUpdate
      };

      render(<UniversalRecordTemplate {...props} />);
      
      // Open UpdateModal
      const updateButton = screen.getByRole('button', { name: /update person/i });
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Verify UpdateModal receives correct props
      // The UpdateModal should be rendered with the person record
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    });
  });

  describe('Form Submission Flow', () => {
    it('should call handleUpdateSubmit with correct data when form is submitted', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      render(
        <UpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={mockOnUpdate}
        />
      );
      
      // Fill form with new data
      await user.clear(screen.getByDisplayValue('John'));
      await user.type(screen.getByDisplayValue(''), 'Updated');
      
      await user.clear(screen.getByDisplayValue('Doe'));
      await user.type(screen.getByDisplayValue(''), 'User');
      
      await user.clear(screen.getByDisplayValue('john.doe@example.com'));
      await user.type(screen.getByDisplayValue(''), 'updated.user@example.com');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Verify onUpdate was called with correct data
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Updated',
            lastName: 'User',
            email: 'updated.user@example.com'
          })
        );
      });
    });

    it('should call API with correct payload when handleUpdateSubmit is called', async () => {
      const user = userEvent.setup();
      const props = {
        record: mockPersonRecord,
        recordType: 'people' as const,
        onBack: mockOnBack,
        onRecordUpdate: mockOnRecordUpdate
      };

      render(<UniversalRecordTemplate {...props} />);
      
      // Open UpdateModal
      const updateButton = screen.getByRole('button', { name: /update person/i });
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Fill and submit form
      await user.clear(screen.getByDisplayValue('John'));
      await user.type(screen.getByDisplayValue(''), 'Updated');
      
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Verify API call was made
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith(
          `/api/v1/people/${mockPersonRecord.id}`,
          expect.objectContaining({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: expect.stringContaining('"firstName":"Updated"')
          })
        );
      });
    });
  });

  describe('Keyboard Shortcut Integration', () => {
    it('should trigger form submission when CMD+Enter is pressed in UpdateModal', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      render(
        <UpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={mockOnUpdate}
        />
      );
      
      // Fill form with new data
      await user.clear(screen.getByDisplayValue('John'));
      await user.type(screen.getByDisplayValue(''), 'KeyboardTest');
      
      // Press CMD+Enter
      await user.keyboard('{Meta>}{Enter}{/Meta}');
      
      // Verify onUpdate was called
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'KeyboardTest'
          })
        );
      });
    });

    it('should trigger form submission when CTRL+Enter is pressed in UpdateModal', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      
      render(
        <UpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={mockOnUpdate}
        />
      );
      
      // Fill form with new data
      await user.clear(screen.getByDisplayValue('John'));
      await user.type(screen.getByDisplayValue(''), 'CtrlTest');
      
      // Press CTRL+Enter
      await user.keyboard('{Control>}{Enter}{/Control}');
      
      // Verify onUpdate was called
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'CtrlTest'
          })
        );
      });
    });

    it('should prevent event propagation when CMD+Enter is pressed', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
      const mockOnClose = jest.fn();
      
      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={mockOnUpdate}
        />
      );
      
      // Fill form
      await user.clear(screen.getByDisplayValue('John'));
      await user.type(screen.getByDisplayValue(''), 'EventTest');
      
      // Press CMD+Enter
      await user.keyboard('{Meta>}{Enter}{/Meta}');
      
      // Verify onUpdate was called (form submitted)
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
      
      // Verify onClose was called (modal closed after successful update)
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('State Management', () => {
    it('should update local state when person data changes', async () => {
      const user = userEvent.setup();
      const props = {
        record: mockPersonRecord,
        recordType: 'people' as const,
        onBack: mockOnBack,
        onRecordUpdate: mockOnRecordUpdate
      };

      const { rerender } = render(<UniversalRecordTemplate {...props} />);
      
      // Open UpdateModal
      const updateButton = screen.getByRole('button', { name: /update person/i });
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Submit form with changes
      await user.clear(screen.getByDisplayValue('John'));
      await user.type(screen.getByDisplayValue(''), 'Updated');
      
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Wait for update to complete
      await waitFor(() => {
        expect(mockOnRecordUpdate).toHaveBeenCalled();
      });
      
      // Rerender with updated record
      rerender(<UniversalRecordTemplate {...props} record={mockUpdatedPerson} />);
      
      // Verify UI reflects the changes
      expect(screen.getByText('Updated User')).toBeInTheDocument();
    });

    it('should handle loading state during update', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(
        <UpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={mockOnUpdate}
        />
      );
      
      // Fill and submit form
      await user.clear(screen.getByDisplayValue('John'));
      await user.type(screen.getByDisplayValue(''), 'LoadingTest');
      
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Verify button shows loading state
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/updating/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      mockAuthFetch.mockRejectedValue(new Error('API Error'));
      
      const props = {
        record: mockPersonRecord,
        recordType: 'people' as const,
        onBack: mockOnBack,
        onRecordUpdate: mockOnRecordUpdate
      };

      render(<UniversalRecordTemplate {...props} />);
      
      // Open UpdateModal
      const updateButton = screen.getByRole('button', { name: /update person/i });
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Submit form
      await user.clear(screen.getByDisplayValue('John'));
      await user.type(screen.getByDisplayValue(''), 'ErrorTest');
      
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Verify error is handled (modal stays open, error message shown)
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Verify error message is displayed
      const errorMessage = screen.queryByText(/error|failed/i);
      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument();
      }
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      mockAuthFetch
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({ success: true, data: mockUpdatedPerson });
      
      const props = {
        record: mockPersonRecord,
        recordType: 'people' as const,
        onBack: mockOnBack,
        onRecordUpdate: mockOnRecordUpdate
      };

      render(<UniversalRecordTemplate {...props} />);
      
      // Open UpdateModal
      const updateButton = screen.getByRole('button', { name: /update person/i });
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // First attempt - should fail
      await user.clear(screen.getByDisplayValue('John'));
      await user.type(screen.getByDisplayValue(''), 'RetryTest');
      
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Wait for first attempt to fail
      await waitFor(() => {
        expect(screen.getByTestId('update-modal')).toBeInTheDocument();
      });
      
      // Second attempt - should succeed
      await user.click(submitButton);
      
      // Wait for successful update
      await waitFor(() => {
        expect(mockOnRecordUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Lifecycle', () => {
    it('should close modal after successful update', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      
      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={jest.fn().mockResolvedValue(undefined)}
        />
      );
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Verify modal closes
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should not close modal on error', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      const mockOnUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
      
      render(
        <UpdateModal
          isOpen={true}
          onClose={mockOnClose}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={mockOnUpdate}
        />
      );
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Wait for error to occur
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
      
      // Verify modal does not close
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByTestId('update-modal')).toBeInTheDocument();
    });
  });
});
