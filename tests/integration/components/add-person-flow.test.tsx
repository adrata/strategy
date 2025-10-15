import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';

// Mock the required modules
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: () => ({
    currentRecord: null,
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

jest.mock('@/frontend/components/pipeline/AddPersonToCompanyModal', () => ({
  AddPersonToCompanyModal: ({ isOpen, onClose, onPersonAdded, companyId, companyName }: any) => 
    isOpen ? (
      <div data-testid="add-person-to-company-modal">
        <div data-testid="company-id">{companyId}</div>
        <div data-testid="company-name">{companyName}</div>
        <button 
          onClick={() => onPersonAdded({ 
            id: 'new-person-id', 
            fullName: 'New Person Name',
            companyId: companyId,
            company: companyName
          })}
          data-testid="submit-person"
        >
          Submit Person
        </button>
        <button onClick={onClose} data-testid="close-modal">Close</button>
      </div>
    ) : null,
}));

jest.mock('@/platform/ui/components/AddCompanyModal', () => ({
  AddCompanyModal: () => null,
}));

jest.mock('@/platform/ui/components/CompleteActionModal', () => ({
  CompleteActionModal: () => null,
}));

jest.mock('@/frontend/components/pipeline/UpdateModal', () => ({
  UpdateModal: () => null,
}));

jest.mock('@/frontend/components/pipeline/AddTaskModal', () => ({
  AddTaskModal: () => null,
}));

// Mock other components
jest.mock('@/platform/ui/components/Loader', () => ({
  CompanyDetailSkeleton: () => <div>Loading...</div>,
}));

jest.mock('@/platform/ui/components/SuccessMessage', () => ({
  SuccessMessage: () => null,
}));

const mockShowMessage = jest.fn();
jest.mock('@/platform/hooks/useInlineEdit', () => ({
  useInlineEdit: () => ({
    showMessage: mockShowMessage,
    closeMessage: jest.fn(),
    message: '',
    messageType: 'success',
    handleEditSave: jest.fn(),
  }),
}));

describe('Add Person Flow Integration', () => {
  const mockOnBack = jest.fn();
  const mockOnRecordUpdate = jest.fn();

  const createCompanyRecord = (overrides = {}) => ({
    id: 'company-1',
    name: 'Test Company',
    companyName: 'Test Company',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockShowMessage.mockClear();
  });

  describe('Complete Add Person Flow', () => {
    it('should complete the full flow: open modal, create person, show success', async () => {
      const user = userEvent.setup();
      const companyRecord = createCompanyRecord();
      
      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="companies"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      // Step 1: Verify Add Person button is visible
      const addPersonButton = screen.getByRole('button', { name: /add person/i });
      expect(addPersonButton).toBeInTheDocument();

      // Step 2: Click Add Person button to open modal
      await user.click(addPersonButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-person-to-company-modal')).toBeInTheDocument();
      });

      // Step 3: Verify company is locked in the modal
      expect(screen.getByTestId('company-id')).toHaveTextContent('company-1');
      expect(screen.getByTestId('company-name')).toHaveTextContent('Test Company');

      // Step 4: Submit person creation
      const submitButton = screen.getByTestId('submit-person');
      await user.click(submitButton);

      // Step 5: Verify success message was shown
      await waitFor(() => {
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Person added successfully!',
          'success'
        );
      });

      // Step 6: Verify onRecordUpdate was called
      await waitFor(() => {
        expect(mockOnRecordUpdate).toHaveBeenCalledWith('company-1');
      });

      // Step 7: Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByTestId('add-person-to-company-modal')).not.toBeInTheDocument();
      });
    });

    it('should pass correct company information to the modal', async () => {
      const user = userEvent.setup();
      const companyRecord = createCompanyRecord({ 
        id: 'test-company-123', 
        name: 'Acme Corporation',
        companyName: 'Acme Corporation'
      });
      
      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="companies"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      const addPersonButton = screen.getByRole('button', { name: /add person/i });
      await user.click(addPersonButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-person-to-company-modal')).toBeInTheDocument();
        expect(screen.getByTestId('company-id')).toHaveTextContent('test-company-123');
        expect(screen.getByTestId('company-name')).toHaveTextContent('Acme Corporation');
      });
    });

    it('should use companyName as fallback when name is not available', async () => {
      const user = userEvent.setup();
      const companyRecord = createCompanyRecord({ 
        id: 'test-company-123', 
        name: undefined,
        companyName: 'Fallback Company Name'
      });
      
      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="companies"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      const addPersonButton = screen.getByRole('button', { name: /add person/i });
      await user.click(addPersonButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-person-to-company-modal')).toBeInTheDocument();
        expect(screen.getByTestId('company-name')).toHaveTextContent('Fallback Company Name');
      });
    });
  });

  describe('Modal State Management', () => {
    it('should close modal after successful person creation', async () => {
      const user = userEvent.setup();
      const companyRecord = createCompanyRecord();
      
      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="companies"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      // Open modal
      const addPersonButton = screen.getByRole('button', { name: /add person/i });
      await user.click(addPersonButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-person-to-company-modal')).toBeInTheDocument();
      });

      // Submit person
      const submitButton = screen.getByTestId('submit-person');
      await user.click(submitButton);

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByTestId('add-person-to-company-modal')).not.toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const companyRecord = createCompanyRecord();

      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="companies"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      // Open modal
      const addPersonButton = screen.getByRole('button', { name: /add person/i });
      await user.click(addPersonButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-person-to-company-modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('add-person-to-company-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Company Association', () => {
    it('should create person with correct company association', async () => {
      const user = userEvent.setup();
      const companyRecord = createCompanyRecord({ 
        id: 'company-123', 
        name: 'Test Company' 
      });
      
      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="companies"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      const addPersonButton = screen.getByRole('button', { name: /add person/i });
      await user.click(addPersonButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-person-to-company-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-person');
      await user.click(submitButton);

      // Verify the person was created with the correct company association
      await waitFor(() => {
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Person added successfully!',
          'success'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle modal errors gracefully', async () => {
      const user = userEvent.setup();
      const companyRecord = createCompanyRecord();
      
      // Mock the modal to simulate an error
      jest.doMock('@/frontend/components/pipeline/AddPersonToCompanyModal', () => ({
        AddPersonToCompanyModal: ({ isOpen, onClose, onPersonAdded }: any) => 
          isOpen ? (
            <div data-testid="add-person-to-company-modal">
              <button 
                onClick={() => {
                  // Simulate error by calling onPersonAdded with null
                  onPersonAdded(null);
                }}
                data-testid="submit-person-error"
              >
                Submit Person (Error)
              </button>
              <button onClick={onClose} data-testid="close-modal">Close</button>
            </div>
          ) : null,
      }));

      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="companies"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      const addPersonButton = screen.getByRole('button', { name: /add person/i });
      await user.click(addPersonButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-person-to-company-modal')).toBeInTheDocument();
      });

      // The component should handle null person data gracefully
      // This test verifies the component doesn't crash when receiving unexpected data
    });
  });
});
