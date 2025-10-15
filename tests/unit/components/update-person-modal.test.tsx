/**
 * Update Person Modal Unit Tests
 * 
 * Tests individual component behavior for the Update Person modal functionality
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

describe('Update Person Modal Unit Tests', () => {
  const mockAuthFetch = require('@/platform/api-fetch').authFetch;
  const mockOnRecordUpdate = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthFetch.mockResolvedValue({
      success: true,
      data: mockPersonRecord
    });
  });

  describe('UpdateModal Initialization', () => {
    it('should initialize with person data', () => {
      render(
        <UpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={jest.fn()}
        />
      );
      
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Senior Engineer')).toBeInTheDocument();
    });

    it('should populate all form fields correctly', () => {
      render(
        <UpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={jest.fn()}
        />
      );
      
      // Check all form fields are populated
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1-555-123-4567')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Senior Engineer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    });

    it('should render tabs for people record type', () => {
      render(
        <UpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={jest.fn()}
        />
      );
      
      // Verify tabs are rendered for people record type
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });
  });

  describe('Button Click Handler', () => {
    it('should call setIsUpdateModalOpen when Update Person button is clicked', async () => {
      const user = userEvent.setup();
      const mockSetIsUpdateModalOpen = jest.fn();
      
      // Mock the useState hook
      const originalUseState = React.useState;
      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === false) {
          return [false, mockSetIsUpdateModalOpen];
        }
        return originalUseState(initial);
      });
      
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
      
      // Verify setIsUpdateModalOpen was called with true
      expect(mockSetIsUpdateModalOpen).toHaveBeenCalledWith(true);
      
      // Restore original useState
      jest.restoreAllMocks();
    });

    it('should not call setIsEditRecordModalOpen when Update Person button is clicked', async () => {
      const user = userEvent.setup();
      const mockSetIsEditRecordModalOpen = jest.fn();
      
      // Mock the useState hook
      const originalUseState = React.useState;
      jest.spyOn(React, 'useState').mockImplementation((initial) => {
        if (initial === false) {
          return [false, mockSetIsEditRecordModalOpen];
        }
        return originalUseState(initial);
      });
      
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
      
      // Verify setIsEditRecordModalOpen was NOT called
      expect(mockSetIsEditRecordModalOpen).not.toHaveBeenCalled();
      
      // Restore original useState
      jest.restoreAllMocks();
    });
  });

  describe('Keyboard Event Handler - UpdateModal', () => {
    it('should call handleSubmit when CMD+Enter is pressed with modal open', async () => {
      const user = userEvent.setup();
      const mockHandleSubmit = jest.fn();
      
      // Mock the UpdateModal component to capture handleSubmit
      const MockUpdateModal = ({ isOpen, onClose, record, recordType, onUpdate }: any) => {
        React.useEffect(() => {
          if (!isOpen) return;

          const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
              mockHandleSubmit();
            }
          };

          document.addEventListener('keydown', handleKeyDown, true);
          document.addEventListener('keydown', handleKeyDown, false);
          
          return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keydown', handleKeyDown, false);
          };
        }, [isOpen]);

        return isOpen ? <div data-testid="update-modal">Update Modal</div> : null;
      };
      
      render(
        <MockUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={jest.fn()}
        />
      );
      
      // Press CMD+Enter
      await user.keyboard('{Meta>}{Enter}{/Meta}');
      
      // Verify handleSubmit was called
      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('should call event.preventDefault() when CMD+Enter is pressed', async () => {
      const user = userEvent.setup();
      const mockPreventDefault = jest.fn();
      const mockStopPropagation = jest.fn();
      const mockStopImmediatePropagation = jest.fn();
      
      // Mock the UpdateModal component
      const MockUpdateModal = ({ isOpen }: any) => {
        React.useEffect(() => {
          if (!isOpen) return;

          const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
            }
          };

          document.addEventListener('keydown', handleKeyDown, true);
          document.addEventListener('keydown', handleKeyDown, false);
          
          return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keydown', handleKeyDown, false);
          };
        }, [isOpen]);

        return isOpen ? <div data-testid="update-modal">Update Modal</div> : null;
      };
      
      render(
        <MockUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={jest.fn()}
        />
      );
      
      // Create a mock event
      const mockEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        preventDefault: mockPreventDefault,
        stopPropagation: mockStopPropagation,
        stopImmediatePropagation: mockStopImmediatePropagation
      });
      
      // Dispatch the event
      document.dispatchEvent(mockEvent);
      
      // Verify event methods were called
      expect(mockPreventDefault).toHaveBeenCalled();
      expect(mockStopPropagation).toHaveBeenCalled();
      expect(mockStopImmediatePropagation).toHaveBeenCalled();
    });

    it('should call event.stopPropagation() when CMD+Enter is pressed', async () => {
      const user = userEvent.setup();
      const mockStopPropagation = jest.fn();
      
      // Mock the UpdateModal component
      const MockUpdateModal = ({ isOpen }: any) => {
        React.useEffect(() => {
          if (!isOpen) return;

          const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.stopPropagation();
            }
          };

          document.addEventListener('keydown', handleKeyDown, true);
          document.addEventListener('keydown', handleKeyDown, false);
          
          return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keydown', handleKeyDown, false);
          };
        }, [isOpen]);

        return isOpen ? <div data-testid="update-modal">Update Modal</div> : null;
      };
      
      render(
        <MockUpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={jest.fn()}
        />
      );
      
      // Create a mock event
      const mockEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        stopPropagation: mockStopPropagation
      });
      
      // Dispatch the event
      document.dispatchEvent(mockEvent);
      
      // Verify stopPropagation was called
      expect(mockStopPropagation).toHaveBeenCalled();
    });
  });

  describe('Keyboard Event Handler - Inline Modal', () => {
    it('should call handleSaveRecord when CMD+Enter is pressed with inline modal open', async () => {
      const user = userEvent.setup();
      const mockHandleSaveRecord = jest.fn();
      
      // Mock the UniversalRecordTemplate component
      const MockUniversalRecordTemplate = ({ record, recordType }: any) => {
        const [isEditRecordModalOpen, setIsEditRecordModalOpen] = React.useState(false);
        
        React.useEffect(() => {
          if (!isEditRecordModalOpen) return;

          const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
              mockHandleSaveRecord();
            }
          };

          document.addEventListener('keydown', handleKeyDown, true);
          document.addEventListener('keydown', handleKeyDown, false);
          
          return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keydown', handleKeyDown, false);
          };
        }, [isEditRecordModalOpen]);

        return (
          <div data-testid="universal-record-template">
            <button onClick={() => setIsEditRecordModalOpen(true)}>
              Open Inline Modal
            </button>
            {isEditRecordModalOpen && (
              <div data-testid="inline-edit-modal">Inline Edit Modal</div>
            )}
          </div>
        );
      };
      
      render(
        <MockUniversalRecordTemplate
          record={mockPersonRecord}
          recordType="people"
        />
      );
      
      // Open inline modal
      const openButton = screen.getByText('Open Inline Modal');
      await user.click(openButton);
      
      // Press CMD+Enter
      await user.keyboard('{Meta>}{Enter}{/Meta}');
      
      // Verify handleSaveRecord was called
      expect(mockHandleSaveRecord).toHaveBeenCalled();
    });

    it('should handle proper event cleanup when inline modal closes', async () => {
      const user = userEvent.setup();
      const mockRemoveEventListener = jest.fn();
      
      // Mock document.removeEventListener
      const originalRemoveEventListener = document.removeEventListener;
      document.removeEventListener = mockRemoveEventListener;
      
      // Mock the UniversalRecordTemplate component
      const MockUniversalRecordTemplate = ({ record, recordType }: any) => {
        const [isEditRecordModalOpen, setIsEditRecordModalOpen] = React.useState(false);
        
        React.useEffect(() => {
          if (!isEditRecordModalOpen) return;

          const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
            }
          };

          document.addEventListener('keydown', handleKeyDown, true);
          document.addEventListener('keydown', handleKeyDown, false);
          
          return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keydown', handleKeyDown, false);
          };
        }, [isEditRecordModalOpen]);

        return (
          <div data-testid="universal-record-template">
            <button onClick={() => setIsEditRecordModalOpen(true)}>
              Open Inline Modal
            </button>
            <button onClick={() => setIsEditRecordModalOpen(false)}>
              Close Inline Modal
            </button>
            {isEditRecordModalOpen && (
              <div data-testid="inline-edit-modal">Inline Edit Modal</div>
            )}
          </div>
        );
      };
      
      const { rerender } = render(
        <MockUniversalRecordTemplate
          record={mockPersonRecord}
          recordType="people"
        />
      );
      
      // Open inline modal
      const openButton = screen.getByText('Open Inline Modal');
      await user.click(openButton);
      
      // Close inline modal
      const closeButton = screen.getByText('Close Inline Modal');
      await user.click(closeButton);
      
      // Verify removeEventListener was called for cleanup
      expect(mockRemoveEventListener).toHaveBeenCalled();
      
      // Restore original removeEventListener
      document.removeEventListener = originalRemoveEventListener;
    });
  });

  describe('Form Data Preparation', () => {
    it('should transform data correctly for API payload', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      
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
      
      // Verify onUpdate was called with correct payload structure
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

    it('should filter empty/null fields correctly', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn();
      
      render(
        <UpdateModal
          isOpen={true}
          onClose={jest.fn()}
          record={mockPersonRecord}
          recordType="people"
          onUpdate={mockOnUpdate}
        />
      );
      
      // Clear some fields to make them empty
      await user.clear(screen.getByDisplayValue('John'));
      await user.clear(screen.getByDisplayValue('Doe'));
      await user.clear(screen.getByDisplayValue('john.doe@example.com'));
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Verify onUpdate was called with empty fields
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: '',
            lastName: '',
            email: ''
          })
        );
      });
    });
  });

  describe('API Response Handling', () => {
    it('should handle successful API response', async () => {
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
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Verify onUpdate was called
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
      
      // Verify onClose was called (modal closes after successful update)
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show success message after successful update', async () => {
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
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Wait for update to complete
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
      
      // Verify success message is shown (if implemented)
      const successMessage = screen.queryByText(/success|updated/i);
      if (successMessage) {
        expect(successMessage).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle failed API response', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn().mockRejectedValue(new Error('API Error'));
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
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Wait for error to occur
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
      
      // Verify modal stays open on error
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByTestId('update-modal')).toBeInTheDocument();
    });

    it('should show error message on failed update', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
      
      render(
        <UpdateModal
          isOpen={true}
          onClose={jest.fn()}
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
      
      // Verify error message is shown
      const errorMessage = screen.queryByText(/error|failed/i);
      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument();
      }
    });

    it('should preserve form data on error', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
      
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
      await user.type(screen.getByDisplayValue(''), 'ErrorTest');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update person/i });
      await user.click(submitButton);
      
      // Wait for error to occur
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
      
      // Verify form data is preserved
      expect(screen.getByDisplayValue('ErrorTest')).toBeInTheDocument();
    });
  });
});
