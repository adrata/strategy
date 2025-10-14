/**
 * Record Page Inline Edit Integration Tests
 * 
 * Tests inline editing within actual record pages to verify state updates,
 * cross-component updates, and record re-fetching
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniversalOverviewTab } from '@/frontend/components/pipeline/tabs/UniversalOverviewTab';
import { UniversalCompanyTab } from '@/frontend/components/pipeline/tabs/UniversalCompanyTab';
import { createTestPerson, createTestCompany, TEST_USER } from '../../../utils/test-factories';

// Mock the auth hook
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: jest.fn().mockReturnValue({
    user: TEST_USER,
    isLoading: false,
    error: null,
  }),
}));

// Mock auth fetch
jest.mock('@/platform/services/auth-fetch', () => ({
  authFetch: jest.fn(),
}));

// Mock the InlineEditField component to avoid complex mocking
jest.mock('@/frontend/components/pipeline/InlineEditField', () => ({
  InlineEditField: ({ value, onSave, field, recordId, recordType, onSuccess }: any) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);

    const handleSave = async () => {
      await onSave(field, editValue, recordId, recordType);
      setIsEditing(false);
      onSuccess?.(`${field} updated successfully!`);
    };

    const handleCancel = () => {
      setEditValue(value);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div data-testid={`edit-field-${field}`}>
          <input
            data-testid={`input-${field}`}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button data-testid={`save-${field}`} onClick={handleSave}>
            Save
          </button>
          <button data-testid={`cancel-${field}`} onClick={handleCancel}>
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div data-testid={`display-field-${field}`}>
        <span data-testid={`value-${field}`}>{value || '-'}</span>
        <button data-testid={`edit-${field}`} onClick={() => setIsEditing(true)}>
          Edit
        </button>
      </div>
    );
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test',
}));

describe('Record Page Inline Edit Integration', () => {
  const mockOnSave = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe('UniversalOverviewTab Integration', () => {
    const mockPerson = createTestPerson('LEAD', {
      id: 'person-123',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-123-4567',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      company: 'Test Company',
      status: 'LEAD',
      priority: 'MEDIUM',
      notes: 'Initial notes',
    });

    const defaultProps = {
      recordType: 'people',
      record: mockPerson,
      onSave: mockOnSave,
    };

    it('should render person fields with inline editing capability', () => {
      render(<UniversalOverviewTab {...defaultProps} />);
      
      // Check that key fields are rendered
      expect(screen.getByTestId('display-field-firstName')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-lastName')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-email')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-phone')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-jobTitle')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-department')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-company')).toBeInTheDocument();
    });

    it('should display current field values', () => {
      render(<UniversalOverviewTab {...defaultProps} />);
      
      expect(screen.getByTestId('value-firstName')).toHaveTextContent('John');
      expect(screen.getByTestId('value-lastName')).toHaveTextContent('Doe');
      expect(screen.getByTestId('value-email')).toHaveTextContent('john@example.com');
      expect(screen.getByTestId('value-phone')).toHaveTextContent('+1-555-123-4567');
      expect(screen.getByTestId('value-jobTitle')).toHaveTextContent('Software Engineer');
      expect(screen.getByTestId('value-department')).toHaveTextContent('Engineering');
      expect(screen.getByTestId('value-company')).toHaveTextContent('Test Company');
    });

    it('should allow editing firstName field', async () => {
      const user = userEvent.setup();
      render(<UniversalOverviewTab {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-firstName');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-firstName');
      expect(input).toHaveValue('John');
      
      await user.clear(input);
      await user.type(input, 'Jane');
      
      const saveButton = screen.getByTestId('save-firstName');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'firstName',
        'Jane',
        'person-123',
        'people'
      );
    });

    it('should allow editing email field', async () => {
      const user = userEvent.setup();
      render(<UniversalOverviewTab {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-email');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-email');
      await user.clear(input);
      await user.type(input, 'jane@example.com');
      
      const saveButton = screen.getByTestId('save-email');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'email',
        'jane@example.com',
        'person-123',
        'people'
      );
    });

    it('should allow editing jobTitle field', async () => {
      const user = userEvent.setup();
      render(<UniversalOverviewTab {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-jobTitle');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-jobTitle');
      await user.clear(input);
      await user.type(input, 'Senior Software Engineer');
      
      const saveButton = screen.getByTestId('save-jobTitle');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'jobTitle',
        'Senior Software Engineer',
        'person-123',
        'people'
      );
    });

    it('should allow editing company field', async () => {
      const user = userEvent.setup();
      render(<UniversalOverviewTab {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-company');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-company');
      await user.clear(input);
      await user.type(input, 'New Company Inc');
      
      const saveButton = screen.getByTestId('save-company');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'company',
        'New Company Inc',
        'person-123',
        'people'
      );
    });

    it('should handle multiple field edits in sequence', async () => {
      const user = userEvent.setup();
      render(<UniversalOverviewTab {...defaultProps} />);
      
      // Edit firstName
      const editFirstNameButton = screen.getByTestId('edit-firstName');
      await user.click(editFirstNameButton);
      
      const firstNameInput = screen.getByTestId('input-firstName');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');
      
      const saveFirstNameButton = screen.getByTestId('save-firstName');
      await user.click(saveFirstNameButton);
      
      // Edit email
      const editEmailButton = screen.getByTestId('edit-email');
      await user.click(editEmailButton);
      
      const emailInput = screen.getByTestId('input-email');
      await user.clear(emailInput);
      await user.type(emailInput, 'jane@newcompany.com');
      
      const saveEmailButton = screen.getByTestId('save-email');
      await user.click(saveEmailButton);
      
      expect(mockOnSave).toHaveBeenCalledTimes(2);
      expect(mockOnSave).toHaveBeenNthCalledWith(1, 'firstName', 'Jane', 'person-123', 'people');
      expect(mockOnSave).toHaveBeenNthCalledWith(2, 'email', 'jane@newcompany.com', 'person-123', 'people');
    });

    it('should handle keyboard shortcuts in edit mode', async () => {
      const user = userEvent.setup();
      render(<UniversalOverviewTab {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-firstName');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-firstName');
      await user.clear(input);
      await user.type(input, 'Jane');
      await user.keyboard('{Enter}');
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'firstName',
        'Jane',
        'person-123',
        'people'
      );
    });

    it('should handle cancel with Escape key', async () => {
      const user = userEvent.setup();
      render(<UniversalOverviewTab {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-firstName');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-firstName');
      await user.clear(input);
      await user.type(input, 'Jane');
      await user.keyboard('{Escape}');
      
      expect(mockOnSave).not.toHaveBeenCalled();
      
      // Should revert to original value
      await waitFor(() => {
        expect(screen.getByTestId('value-firstName')).toHaveTextContent('John');
      });
    });

    it('should handle different person statuses (LEAD, PROSPECT, OPPORTUNITY)', () => {
      const leadPerson = createTestPerson('LEAD', { id: 'lead-123' });
      const prospectPerson = createTestPerson('PROSPECT', { id: 'prospect-123' });
      const opportunityPerson = createTestPerson('OPPORTUNITY', { id: 'opportunity-123' });

      const { rerender } = render(
        <UniversalOverviewTab recordType="people" record={leadPerson} onSave={mockOnSave} />
      );
      expect(screen.getByTestId('display-field-firstName')).toBeInTheDocument();

      rerender(
        <UniversalOverviewTab recordType="people" record={prospectPerson} onSave={mockOnSave} />
      );
      expect(screen.getByTestId('display-field-firstName')).toBeInTheDocument();

      rerender(
        <UniversalOverviewTab recordType="people" record={opportunityPerson} onSave={mockOnSave} />
      );
      expect(screen.getByTestId('display-field-firstName')).toBeInTheDocument();
    });
  });

  describe('UniversalCompanyTab Integration', () => {
    const mockCompany = createTestCompany({
      id: 'company-123',
      name: 'Test Company',
      website: 'https://testcompany.com',
      email: 'contact@testcompany.com',
      phone: '+1-555-987-6543',
      industry: 'Technology',
      size: '51-200 employees',
      revenue: 10000000,
      employeeCount: 150,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      notes: 'Company notes',
      opportunityStage: 'Proposal',
      opportunityAmount: 50000,
      opportunityProbability: 75,
    });

    const defaultProps = {
      recordType: 'companies',
      record: mockCompany,
      onSave: mockOnSave,
    };

    it('should render company fields with inline editing capability', () => {
      render(<UniversalCompanyTab {...defaultProps} />);
      
      // Check that key company fields are rendered
      expect(screen.getByTestId('display-field-name')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-website')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-email')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-phone')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-industry')).toBeInTheDocument();
      expect(screen.getByTestId('display-field-size')).toBeInTheDocument();
    });

    it('should display current company field values', () => {
      render(<UniversalCompanyTab {...defaultProps} />);
      
      expect(screen.getByTestId('value-name')).toHaveTextContent('Test Company');
      expect(screen.getByTestId('value-website')).toHaveTextContent('https://testcompany.com');
      expect(screen.getByTestId('value-email')).toHaveTextContent('contact@testcompany.com');
      expect(screen.getByTestId('value-phone')).toHaveTextContent('+1-555-987-6543');
      expect(screen.getByTestId('value-industry')).toHaveTextContent('Technology');
      expect(screen.getByTestId('value-size')).toHaveTextContent('51-200 employees');
    });

    it('should allow editing company name', async () => {
      const user = userEvent.setup();
      render(<UniversalCompanyTab {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-name');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-name');
      await user.clear(input);
      await user.type(input, 'Updated Company Name');
      
      const saveButton = screen.getByTestId('save-name');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'name',
        'Updated Company Name',
        'company-123',
        'companies'
      );
    });

    it('should allow editing company website', async () => {
      const user = userEvent.setup();
      render(<UniversalCompanyTab {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-website');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-website');
      await user.clear(input);
      await user.type(input, 'https://updated-company.com');
      
      const saveButton = screen.getByTestId('save-website');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'website',
        'https://updated-company.com',
        'company-123',
        'companies'
      );
    });

    it('should allow editing company industry', async () => {
      const user = userEvent.setup();
      render(<UniversalCompanyTab {...defaultProps} />);
      
      const editButton = screen.getByTestId('edit-industry');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-industry');
      await user.clear(input);
      await user.type(input, 'Healthcare Technology');
      
      const saveButton = screen.getByTestId('save-industry');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'industry',
        'Healthcare Technology',
        'company-123',
        'companies'
      );
    });

    it('should allow editing opportunity fields', async () => {
      const user = userEvent.setup();
      render(<UniversalCompanyTab {...defaultProps} />);
      
      // Edit opportunity stage
      const editStageButton = screen.getByTestId('edit-opportunityStage');
      await user.click(editStageButton);
      
      const stageInput = screen.getByTestId('input-opportunityStage');
      await user.clear(stageInput);
      await user.type(stageInput, 'Negotiation');
      
      const saveStageButton = screen.getByTestId('save-opportunityStage');
      await user.click(saveStageButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'opportunityStage',
        'Negotiation',
        'company-123',
        'companies'
      );
    });

    it('should handle multiple company field edits', async () => {
      const user = userEvent.setup();
      render(<UniversalCompanyTab {...defaultProps} />);
      
      // Edit name
      const editNameButton = screen.getByTestId('edit-name');
      await user.click(editNameButton);
      
      const nameInput = screen.getByTestId('input-name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Company Name');
      
      const saveNameButton = screen.getByTestId('save-name');
      await user.click(saveNameButton);
      
      // Edit industry
      const editIndustryButton = screen.getByTestId('edit-industry');
      await user.click(editIndustryButton);
      
      const industryInput = screen.getByTestId('input-industry');
      await user.clear(industryInput);
      await user.type(industryInput, 'Fintech');
      
      const saveIndustryButton = screen.getByTestId('save-industry');
      await user.click(saveIndustryButton);
      
      expect(mockOnSave).toHaveBeenCalledTimes(2);
      expect(mockOnSave).toHaveBeenNthCalledWith(1, 'name', 'New Company Name', 'company-123', 'companies');
      expect(mockOnSave).toHaveBeenNthCalledWith(2, 'industry', 'Fintech', 'company-123', 'companies');
    });
  });

  describe('Cross-Component Updates', () => {
    it('should handle record updates that affect multiple components', async () => {
      const user = userEvent.setup();
      const mockPerson = createTestPerson('LEAD', {
        id: 'person-123',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        company: 'Test Company',
      });

      const { rerender } = render(
        <UniversalOverviewTab recordType="people" record={mockPerson} onSave={mockOnSave} />
      );

      // Edit firstName
      const editButton = screen.getByTestId('edit-firstName');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-firstName');
      await user.clear(input);
      await user.type(input, 'Jane');
      
      const saveButton = screen.getByTestId('save-firstName');
      await user.click(saveButton);

      // Simulate record update (as would happen after API call)
      const updatedPerson = { ...mockPerson, firstName: 'Jane', fullName: 'Jane Doe' };
      rerender(
        <UniversalOverviewTab recordType="people" record={updatedPerson} onSave={mockOnSave} />
      );

      // Verify the updated values are displayed
      expect(screen.getByTestId('value-firstName')).toHaveTextContent('Jane');
      expect(screen.getByTestId('value-fullName')).toHaveTextContent('Jane Doe');
    });

    it('should handle computed field updates (fullName)', async () => {
      const user = userEvent.setup();
      const mockPerson = createTestPerson('LEAD', {
        id: 'person-123',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
      });

      const { rerender } = render(
        <UniversalOverviewTab recordType="people" record={mockPerson} onSave={mockOnSave} />
      );

      // Edit lastName
      const editButton = screen.getByTestId('edit-lastName');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-lastName');
      await user.clear(input);
      await user.type(input, 'Smith');
      
      const saveButton = screen.getByTestId('save-lastName');
      await user.click(saveButton);

      // Simulate record update with computed fullName
      const updatedPerson = { ...mockPerson, lastName: 'Smith', fullName: 'John Smith' };
      rerender(
        <UniversalOverviewTab recordType="people" record={updatedPerson} onSave={mockOnSave} />
      );

      // Verify both lastName and fullName are updated
      expect(screen.getByTestId('value-lastName')).toHaveTextContent('Smith');
      expect(screen.getByTestId('value-fullName')).toHaveTextContent('John Smith');
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      const mockPerson = createTestPerson('LEAD', { id: 'person-123', firstName: 'John' });
      
      // Mock save to reject
      const mockOnSaveError = jest.fn().mockRejectedValue(new Error('Save failed'));
      
      render(
        <UniversalOverviewTab 
          recordType="people" 
          record={mockPerson} 
          onSave={mockOnSaveError} 
        />
      );

      const editButton = screen.getByTestId('edit-firstName');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-firstName');
      await user.clear(input);
      await user.type(input, 'Jane');
      
      const saveButton = screen.getByTestId('save-firstName');
      await user.click(saveButton);

      // Should stay in edit mode on error
      await waitFor(() => {
        expect(screen.getByTestId('input-firstName')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      const mockPerson = createTestPerson('LEAD', { id: 'person-123', firstName: 'John' });
      
      // Mock save to fail first, then succeed
      const mockOnSaveRetry = jest.fn()
        .mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce(undefined);
      
      render(
        <UniversalOverviewTab 
          recordType="people" 
          record={mockPerson} 
          onSave={mockOnSaveRetry} 
        />
      );

      const editButton = screen.getByTestId('edit-firstName');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-firstName');
      await user.clear(input);
      await user.type(input, 'Jane');
      
      const saveButton = screen.getByTestId('save-firstName');
      
      // First save attempt - should fail
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('input-firstName')).toBeInTheDocument();
      });
      
      // Second save attempt - should succeed
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('input-firstName')).not.toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should maintain edit state during rapid edits', async () => {
      const user = userEvent.setup();
      const mockPerson = createTestPerson('LEAD', { id: 'person-123', firstName: 'John' });
      
      render(
        <UniversalOverviewTab recordType="people" record={mockPerson} onSave={mockOnSave} />
      );

      // Start editing firstName
      const editButton = screen.getByTestId('edit-firstName');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-firstName');
      expect(input).toHaveValue('John');
      
      // Make changes
      await user.clear(input);
      await user.type(input, 'Jane');
      expect(input).toHaveValue('Jane');
      
      // Cancel and start editing again
      const cancelButton = screen.getByTestId('cancel-firstName');
      await user.click(cancelButton);
      
      // Should revert to original value
      await waitFor(() => {
        expect(screen.getByTestId('value-firstName')).toHaveTextContent('John');
      });
      
      // Start editing again
      const editButton2 = screen.getByTestId('edit-firstName');
      await user.click(editButton2);
      
      const input2 = screen.getByTestId('input-firstName');
      expect(input2).toHaveValue('John');
    });

    it('should handle record prop changes during editing', async () => {
      const user = userEvent.setup();
      const mockPerson = createTestPerson('LEAD', { id: 'person-123', firstName: 'John' });
      
      const { rerender } = render(
        <UniversalOverviewTab recordType="people" record={mockPerson} onSave={mockOnSave} />
      );

      // Start editing
      const editButton = screen.getByTestId('edit-firstName');
      await user.click(editButton);
      
      const input = screen.getByTestId('input-firstName');
      await user.clear(input);
      await user.type(input, 'Jane');
      
      // Update record prop (simulating external update)
      const updatedPerson = { ...mockPerson, firstName: 'Updated John' };
      rerender(
        <UniversalOverviewTab recordType="people" record={updatedPerson} onSave={mockOnSave} />
      );
      
      // Input should update to new prop value
      expect(input).toHaveValue('Updated John');
    });
  });
});
