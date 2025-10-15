import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';

// Mock fetch globally
global.fetch = jest.fn();

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

jest.mock('@/platform/ui/components/AddCompanyModal', () => ({
  AddCompanyModal: ({ isOpen, onClose, onCompanyAdded }: any) => 
    isOpen ? (
      <div data-testid="add-company-modal">
        <button 
          onClick={() => onCompanyAdded({ 
            id: 'new-company-id', 
            name: 'New Company Name' 
          })}
          data-testid="submit-company"
        >
          Submit Company
        </button>
        <button onClick={onClose} data-testid="close-modal">Close</button>
      </div>
    ) : null,
}));

jest.mock('@/frontend/components/pipeline/AddPersonToCompanyModal', () => ({
  AddPersonToCompanyModal: () => null,
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

describe('Add Company Flow Integration', () => {
  const mockOnBack = jest.fn();
  const mockOnRecordUpdate = jest.fn();

  const createPersonRecord = (overrides = {}) => ({
    id: 'person-1',
    fullName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockShowMessage.mockClear();
  });

  describe('Complete Add Company Flow', () => {
    it('should complete the full flow: open modal, create company, associate with person', async () => {
      const user = userEvent.setup();
      const personRecord = createPersonRecord();
      
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...personRecord,
            companyId: 'new-company-id',
            company: 'New Company Name'
          }
        }),
      });

      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="people"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      // Step 1: Verify Add Company button is visible
      const addCompanyButton = screen.getByRole('button', { name: /add company/i });
      expect(addCompanyButton).toBeInTheDocument();

      // Step 2: Click Add Company button to open modal
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-company-modal')).toBeInTheDocument();
      });

      // Step 3: Submit company creation
      const submitButton = screen.getByTestId('submit-company');
      await user.click(submitButton);

      // Step 4: Verify API call was made to associate company
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/people/person-1',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              companyId: 'new-company-id',
              company: 'New Company Name'
            }),
          })
        );
      });

      // Step 5: Verify success message was shown
      await waitFor(() => {
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Company added and associated successfully!',
          'success'
        );
      });

      // Step 6: Verify onRecordUpdate was called
      await waitFor(() => {
        expect(mockOnRecordUpdate).toHaveBeenCalledWith('person-1');
      });
    });

    it('should handle API error gracefully', async () => {
      const user = userEvent.setup();
      const personRecord = createPersonRecord();
      
      // Mock API error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="people"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      // Open modal and submit
      const addCompanyButton = screen.getByRole('button', { name: /add company/i });
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-company-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-company');
      await user.click(submitButton);

      // Verify error message was shown
      await waitFor(() => {
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Failed to associate company',
          'error'
        );
      });

      // Verify onRecordUpdate was NOT called on error
      expect(mockOnRecordUpdate).not.toHaveBeenCalled();
    });

    it('should handle network error gracefully', async () => {
      const user = userEvent.setup();
      const personRecord = createPersonRecord();
      
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="people"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      // Open modal and submit
      const addCompanyButton = screen.getByRole('button', { name: /add company/i });
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-company-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-company');
      await user.click(submitButton);

      // Verify error message was shown
      await waitFor(() => {
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Failed to associate company',
          'error'
        );
      });
    });
  });

  describe('Modal State Management', () => {
    it('should close modal after successful company creation', async () => {
      const user = userEvent.setup();
      const personRecord = createPersonRecord();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: personRecord }),
      });

      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="people"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      // Open modal
      const addCompanyButton = screen.getByRole('button', { name: /add company/i });
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-company-modal')).toBeInTheDocument();
      });

      // Submit company
      const submitButton = screen.getByTestId('submit-company');
      await user.click(submitButton);

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByTestId('add-company-modal')).not.toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const personRecord = createPersonRecord();

      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="people"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      // Open modal
      const addCompanyButton = screen.getByRole('button', { name: /add company/i });
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-company-modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('add-company-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Record Type Support', () => {
    it('should work for leads records', async () => {
      const user = userEvent.setup();
      const leadRecord = createPersonRecord({ id: 'lead-1' });
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: leadRecord }),
      });

      render(
        <UniversalRecordTemplate
          record={leadRecord}
          recordType="leads"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      const addCompanyButton = screen.getByRole('button', { name: /add company/i });
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-company-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-company');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/people/lead-1',
          expect.any(Object)
        );
      });
    });

    it('should work for prospects records', async () => {
      const user = userEvent.setup();
      const prospectRecord = createPersonRecord({ id: 'prospect-1' });
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: prospectRecord }),
      });

      render(
        <UniversalRecordTemplate
          record={prospectRecord}
          recordType="prospects"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      const addCompanyButton = screen.getByRole('button', { name: /add company/i });
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-company-modal')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('submit-company');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/people/prospect-1',
          expect.any(Object)
        );
      });
    });
  });
});
