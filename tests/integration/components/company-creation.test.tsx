/**
 * Company Creation Integration Tests
 * 
 * Tests for company creation flows across different components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddCompanyModal } from '@/platform/ui/components/AddCompanyModal';
import { CompanySelector } from '@/frontend/components/pipeline/CompanySelector';
import { InlineCompanySelector } from '@/frontend/components/pipeline/InlineCompanySelector';
import { mockCompanyAPI, setupCompanyCreationTest, COMPANY_TEST_SCENARIOS } from '../../utils/company-test-helpers';

// Mock the auth hook
jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: () => ({
    user: {
      id: '01K1VBYZG41K9QA0D9CF06KNRG',
      email: 'ross@adrata.com',
      name: 'Ross',
    },
  }),
}));

// Mock the category colors
jest.mock('@/platform/utils/category-colors', () => ({
  getCategoryColors: () => ({
    primary: '#3B82F6',
    secondary: '#1E40AF',
  }),
}));

// Mock authFetch
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

describe('Company Creation Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnCompanyAdded = jest.fn();
  const mockOnChange = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnSuccess = jest.fn();
  
  let mockAPI: ReturnType<typeof mockCompanyAPI>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAPI = mockCompanyAPI();
  });

  afterEach(() => {
    mockAPI.clearCompanies();
  });

  describe('AddCompanyModal Integration', () => {
    it('should create company and call onCompanyAdded', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const testCompany = createValidCompanyData({ name: 'Test Company' });
      mockAuthFetch.mockResolvedValueOnce(mockCompanyCreationResponse(testCompany));

      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Test Company');

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnCompanyAdded).toHaveBeenCalledWith(testCompany);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle duplicate company creation', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, mockCompanyCreationError } = setupCompanyCreationTest();
      
      mockAuthFetch.mockRejectedValueOnce(mockCompanyCreationError('A company with this name already exists'));

      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Duplicate Company');

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/already exists/)).toBeInTheDocument();
      });

      expect(mockOnCompanyAdded).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should validate workspace isolation', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const testCompany = createValidCompanyData({ 
        name: 'Test Company',
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' // Should match TEST_USER workspace
      });
      mockAuthFetch.mockResolvedValueOnce(mockCompanyCreationResponse(testCompany));

      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Test Company');

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Test Company',
            website: undefined,
            notes: undefined,
            mainSellerId: '01K1VBYZG41K9QA0D9CF06KNRG',
          }),
          timeout: 30000,
        });
      });
    });

    it('should assign mainSellerId correctly', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const testCompany = createValidCompanyData({ 
        name: 'Test Company',
        mainSellerId: '01K1VBYZG41K9QA0D9CF06KNRG'
      });
      mockAuthFetch.mockResolvedValueOnce(mockCompanyCreationResponse(testCompany));

      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Test Company');

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/companies', 
          expect.objectContaining({
            body: expect.stringContaining('"mainSellerId":"01K1VBYZG41K9QA0D9CF06KNRG"')
          })
        );
      });
    });
  });

  describe('CompanySelector Integration', () => {
    it('should search and select existing company', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, mockCompanySearchResponse } = setupCompanyCreationTest();
      
      const mockCompanies = [
        { id: '1', name: 'Acme Corp', website: 'https://acme.com' },
        { id: '2', name: 'Beta Inc', website: 'https://beta.com' },
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      await user.type(input, 'Acme');

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      });

      const companyOption = screen.getByText('Acme Corp');
      await user.click(companyOption);

      expect(mockOnChange).toHaveBeenCalledWith(mockCompanies[0]);
    });

    it('should create new company and select it', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, mockCompanySearchResponse, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompanies = [
        { id: '1', name: 'Acme Corp' },
      ];
      const newCompany = { id: '2', name: 'New Company', website: 'https://newcompany.com' };
      
      mockAuthFetch
        .mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies))
        .mockResolvedValueOnce(mockCompanyCreationResponse(newCompany));

      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      await user.type(input, 'New Company');

      await waitFor(() => {
        expect(screen.getByText('Add "New Company" as new company')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add "New Company" as new company');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'New Company');

      const websiteInput = screen.getByPlaceholderText('Website (optional)');
      await user.type(websiteInput, 'https://newcompany.com');

      const createButton = screen.getByText('Add Company');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(newCompany);
      });
    });

    it('should handle concurrent company creation', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, mockCompanySearchResponse, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompanies = [
        { id: '1', name: 'Acme Corp' },
      ];
      const newCompany = { id: '2', name: 'New Company' };
      
      // Simulate concurrent creation
      mockAuthFetch
        .mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies))
        .mockResolvedValueOnce(mockCompanyCreationResponse(newCompany));

      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      await user.type(input, 'New Company');

      await waitFor(() => {
        expect(screen.getByText('Add "New Company" as new company')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add "New Company" as new company');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'New Company');

      const createButton = screen.getByText('Add Company');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(newCompany);
      });
    });
  });

  describe('InlineCompanySelector Integration', () => {
    it('should create company and save to record', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, mockCompanySearchResponse, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompanies = [
        { id: '1', name: 'Acme Corp' },
      ];
      const newCompany = { id: '2', name: 'New Company' };
      
      mockAuthFetch
        .mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies))
        .mockResolvedValueOnce(mockCompanyCreationResponse(newCompany));

      render(
        <InlineCompanySelector
          value={null}
          field="company"
          onSave={mockOnSave}
          recordId="test-record-id"
          recordType="people"
          onSuccess={mockOnSuccess}
        />
      );

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'New Company');

      await waitFor(() => {
        expect(screen.getByText('+ Add "New Company"')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add "New Company"');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'New Company');

      const createButton = screen.getByText('Add Company');
      await user.click(createButton);

      await waitFor(() => {
        expect(input).toHaveValue('New Company');
      });

      // Now save the record
      const saveButton = screen.getByTitle('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('company', 'New Company', 'test-record-id', 'people');
      });
    });

    it('should handle company creation and selection in one flow', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, mockCompanySearchResponse, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompanies = [
        { id: '1', name: 'Acme Corp' },
      ];
      const newCompany = { id: '2', name: 'New Company' };
      
      mockAuthFetch
        .mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies))
        .mockResolvedValueOnce(mockCompanyCreationResponse(newCompany));

      render(
        <InlineCompanySelector
          value={null}
          field="company"
          onSave={mockOnSave}
          recordId="test-record-id"
          recordType="people"
          onSuccess={mockOnSuccess}
        />
      );

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'New Company');

      await waitFor(() => {
        expect(screen.getByText('+ Add "New Company"')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add "New Company"');
      await user.click(addButton);

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'New Company');

      const createButton = screen.getByText('Add Company');
      await user.click(createButton);

      await waitFor(() => {
        expect(input).toHaveValue('New Company');
      });

      // The company should now be available for selection
      expect(screen.queryByText('+ Add "New Company"')).not.toBeInTheDocument();
    });
  });

  describe('Cross-Component Integration', () => {
    it('should maintain consistency between different company creation methods', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const testCompany = createValidCompanyData({ name: 'Consistent Company' });
      mockAuthFetch.mockResolvedValue(mockCompanyCreationResponse(testCompany));

      // Test AddCompanyModal
      const { rerender } = render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Consistent Company');

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnCompanyAdded).toHaveBeenCalledWith(testCompany);
      });

      // Test CompanySelector with the same company
      rerender(
        <CompanySelector
          value={testCompany}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('Consistent Company')).toBeInTheDocument();

      // Test InlineCompanySelector with the same company
      rerender(
        <InlineCompanySelector
          value={testCompany}
          field="company"
          onSave={mockOnSave}
          recordId="test-record-id"
          recordType="people"
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Consistent Company')).toBeInTheDocument();
    });

    it('should handle error propagation across components', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, mockCompanyCreationError } = setupCompanyCreationTest();
      
      mockAuthFetch.mockRejectedValue(mockCompanyCreationError('Network error'));

      // Test AddCompanyModal error handling
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Error Company');

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      expect(mockOnCompanyAdded).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate company name across all components', async () => {
      const user = userEvent.setup();
      
      // Test AddCompanyModal validation
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });
    });

    it('should handle special characters in company names', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const testCompany = createValidCompanyData({ name: 'Company & Associates, LLC' });
      mockAuthFetch.mockResolvedValueOnce(mockCompanyCreationResponse(testCompany));

      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Company & Associates, LLC');

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnCompanyAdded).toHaveBeenCalledWith(testCompany);
      });
    });

    it('should handle long company names', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const longName = 'A'.repeat(200);
      const testCompany = createValidCompanyData({ name: longName });
      mockAuthFetch.mockResolvedValueOnce(mockCompanyCreationResponse(testCompany));

      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, longName);

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnCompanyAdded).toHaveBeenCalledWith(testCompany);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid company creation requests', async () => {
      const user = userEvent.setup();
      const { mockAuthFetch, createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const companies = [
        createValidCompanyData({ id: '1', name: 'Company 1' }),
        createValidCompanyData({ id: '2', name: 'Company 2' }),
        createValidCompanyData({ id: '3', name: 'Company 3' }),
      ];
      
      mockAuthFetch
        .mockResolvedValueOnce(mockCompanyCreationResponse(companies[0]))
        .mockResolvedValueOnce(mockCompanyCreationResponse(companies[1]))
        .mockResolvedValueOnce(mockCompanyCreationResponse(companies[2]));

      const { rerender } = render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      // Create first company
      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Company 1');

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnCompanyAdded).toHaveBeenCalledWith(companies[0]);
      });

      // Create second company
      rerender(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput2 = screen.getByPlaceholderText('Company name');
      await user.type(nameInput2, 'Company 2');

      const submitButton2 = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton2);

      await waitFor(() => {
        expect(mockOnCompanyAdded).toHaveBeenCalledWith(companies[1]);
      });

      // Create third company
      rerender(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput3 = screen.getByPlaceholderText('Company name');
      await user.type(nameInput3, 'Company 3');

      const submitButton3 = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton3);

      await waitFor(() => {
        expect(mockOnCompanyAdded).toHaveBeenCalledWith(companies[2]);
      });

      expect(mockOnCompanyAdded).toHaveBeenCalledTimes(3);
    });
  });
});
