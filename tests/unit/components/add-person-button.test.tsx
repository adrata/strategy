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

jest.mock('@/frontend/components/pipeline/AddPersonToCompanyModal', () => ({
  AddPersonToCompanyModal: ({ isOpen, onClose, onPersonAdded, companyId, companyName }: any) => 
    isOpen ? (
      <div data-testid="add-person-to-company-modal">
        <div data-testid="company-id">{companyId}</div>
        <div data-testid="company-name">{companyName}</div>
        <button onClick={() => onPersonAdded({ id: 'new-person-id', fullName: 'New Person' })}>
          Add Person
        </button>
        <button onClick={onClose}>Close</button>
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

describe('Add Person Button', () => {
  const mockOnBack = jest.fn();
  const mockOnRecordUpdate = jest.fn();

  const createCompanyRecord = (overrides = {}) => ({
    id: 'company-1',
    name: 'Test Company',
    companyName: 'Test Company',
    ...overrides,
  });

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button Visibility', () => {
    it('should render Add Person button for company records', () => {
      const companyRecord = createCompanyRecord();
      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="companies"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.getByRole('button', { name: /add person/i })).toBeInTheDocument();
    });

    it('should NOT render Add Person button for people records', () => {
      const personRecord = createPersonRecord();
      render(
        <UniversalRecordTemplate
          record={personRecord}
          recordType="people"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /add person/i })).not.toBeInTheDocument();
    });

    it('should NOT render Add Person button for leads records', () => {
      const leadRecord = createLeadRecord();
      render(
        <UniversalRecordTemplate
          record={leadRecord}
          recordType="leads"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /add person/i })).not.toBeInTheDocument();
    });

    it('should NOT render Add Person button for prospects records', () => {
      const prospectRecord = createProspectRecord();
      render(
        <UniversalRecordTemplate
          record={prospectRecord}
          recordType="prospects"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /add person/i })).not.toBeInTheDocument();
    });

    it('should NOT render Add Person button for other record types', () => {
      const companyRecord = createCompanyRecord();
      render(
        <UniversalRecordTemplate
          record={companyRecord}
          recordType="opportunities"
          onBack={mockOnBack}
          onRecordUpdate={mockOnRecordUpdate}
        />
      );

      expect(screen.queryByRole('button', { name: /add person/i })).not.toBeInTheDocument();
    });
  });

  describe('Button Interaction', () => {
    it('should open AddPersonToCompanyModal when Add Person button is clicked', async () => {
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

      const addPersonButton = screen.getByRole('button', { name: /add person/i });
      await user.click(addPersonButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-person-to-company-modal')).toBeInTheDocument();
      });
    });

    it('should close AddPersonToCompanyModal when close button is clicked', async () => {
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
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('add-person-to-company-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Props', () => {
    it('should pass correct companyId and companyName to AddPersonToCompanyModal', async () => {
      const user = userEvent.setup();
      const companyRecord = createCompanyRecord({ 
        id: 'test-company-id', 
        name: 'Test Company Name' 
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
        expect(screen.getByTestId('company-id')).toHaveTextContent('test-company-id');
        expect(screen.getByTestId('company-name')).toHaveTextContent('Test Company Name');
      });
    });

    it('should use companyName as fallback when name is not available', async () => {
      const user = userEvent.setup();
      const companyRecord = createCompanyRecord({ 
        id: 'test-company-id', 
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
});
