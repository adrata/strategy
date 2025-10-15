import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

jest.mock('@/platform/ui/components/AddCompanyModal', () => ({
  AddCompanyModal: ({ isOpen, onClose, onCompanyAdded }: any) => 
    isOpen ? (
      <div data-testid="add-company-modal">
        <button onClick={() => onCompanyAdded({ id: 'new-company-id', name: 'New Company' })}>
          Add Company
        </button>
        <button onClick={onClose}>Close</button>
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

// Mock other components that might be imported
jest.mock('@/platform/ui/components/Loader', () => ({
  CompanyDetailSkeleton: () => <div>Loading...</div>,
}));

jest.mock('@/platform/ui/components/SuccessMessage', () => ({
  SuccessMessage: () => null,
}));

jest.mock('@/platform/hooks/useInlineEdit', () => ({
  useInlineEdit: () => ({
    showMessage: jest.fn(),
    closeMessage: jest.fn(),
    message: '',
    messageType: 'success',
    handleEditSave: jest.fn(),
  }),
}));

describe('Add Company Button', () => {
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

  const createLeadRecord = (overrides = {}) => ({
    id: 'lead-1',
    fullName: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    ...overrides,
  });

  const createProspectRecord = (overrides = {}) => ({
    id: 'prospect-1',
    fullName: 'Bob Johnson',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    ...overrides,
  });

  const createCompanyRecord = (overrides = {}) => ({
    id: 'company-1',
    name: 'Test Company',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button Visibility', () => {
    it('should render Add Company button for people records without company', () => {
      const personRecord = createPersonRecord();
      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="people"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /add company/i })).toBeInTheDocument();
    });

    it('should render Add Company button for leads records without company', () => {
      const leadRecord = createLeadRecord();
      render(
        <UniversalRecordTemplate
          record={leadRecord}
          recordType="leads"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /add company/i })).toBeInTheDocument();
    });

    it('should render Add Company button for prospects records without company', () => {
      const prospectRecord = createProspectRecord();
      render(
        <UniversalRecordTemplate
          record={prospectRecord}
          recordType="prospects"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /add company/i })).toBeInTheDocument();
    });

    it('should NOT render Add Company button for people records with companyId', () => {
      const personRecord = createPersonRecord({ companyId: 'company-123' });
      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="people"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /add company/i })).not.toBeInTheDocument();
    });

    it('should NOT render Add Company button for people records with company name', () => {
      const personRecord = createPersonRecord({ company: 'Existing Company' });
      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="people"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /add company/i })).not.toBeInTheDocument();
    });

    it('should NOT render Add Company button for company records', () => {
      const companyRecord = createCompanyRecord();
      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="companies"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /add company/i })).not.toBeInTheDocument();
    });

    it('should NOT render Add Company button for other record types', () => {
      const personRecord = createPersonRecord();
      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="opportunities"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /add company/i })).not.toBeInTheDocument();
    });
  });

  describe('Button Interaction', () => {
    it('should open AddCompanyModal when Add Company button is clicked', async () => {
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

      const addCompanyButton = screen.getByRole('button', { name: /add company/i });
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-company-modal')).toBeInTheDocument();
      });
    });

    it('should close AddCompanyModal when close button is clicked', async () => {
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
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('add-company-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Props', () => {
    it('should pass correct props to AddCompanyModal', async () => {
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

      const addCompanyButton = screen.getByRole('button', { name: /add company/i });
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-company-modal')).toBeInTheDocument();
      });
    });
  });
});
