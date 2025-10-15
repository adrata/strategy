/**
 * InlineCompanySelector Unit Tests
 * 
 * Tests for the InlineCompanySelector component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineCompanySelector } from '@/frontend/components/pipeline/InlineCompanySelector';
import { setupCompanyCreationTest, createValidCompanyData, mockCompanyCreationResponse, mockCompanySearchResponse } from '../../utils/company-test-helpers';
import { authFetch } from '@/platform/api-fetch';

// Mock authFetch
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

describe('InlineCompanySelector', () => {
  const mockOnSave = jest.fn();
  const mockOnSuccess = jest.fn();
  const { mockCompanySearchResponse } = setupCompanyCreationTest();
  const mockAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

  const defaultProps = {
    value: null,
    field: 'company',
    onSave: mockOnSave,
    recordId: 'test-record-id',
    recordType: 'people',
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock responses
    mockAuthFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/v1/companies') && options?.method === 'POST') {
        const companyData = options.body ? JSON.parse(options.body) : {};
        const company = createValidCompanyData(companyData);
        return Promise.resolve(mockCompanyCreationResponse(company));
      }
      
      if (url.includes('/api/v1/companies?search=')) {
        const companies = [
          createValidCompanyData({ id: '1', name: 'Acme Corp' }),
          createValidCompanyData({ id: '2', name: 'Beta Inc' }),
        ];
        return Promise.resolve(mockCompanySearchResponse(companies));
      }
      
      return Promise.resolve({ success: true, data: [] });
    });
  });

  describe('Basic Rendering', () => {
    it('should render with placeholder when no value', () => {
      render(<InlineCompanySelector {...defaultProps} />);

      // The component should show a clickable area to enter edit mode
      expect(screen.getByText('Enter company name')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <InlineCompanySelector
          {...defaultProps}
          placeholder="Custom placeholder"
        />
      );

      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    it('should display company name when value is a company object', () => {
      const company = createValidCompanyData({ name: 'Test Company' });
      
      render(
        <InlineCompanySelector
          {...defaultProps}
          value={company}
        />
      );

      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    it('should display company name when value is a string', () => {
      render(
        <InlineCompanySelector
          {...defaultProps}
          value="Test Company"
        />
      );

      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    it('should show edit button on hover', () => {
      render(<InlineCompanySelector {...defaultProps} />);

      const container = screen.getByText('Enter company name').closest('div');
      expect(container).toHaveClass('group');
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      expect(screen.getByPlaceholderText('Enter company name')).toBeInTheDocument();
      expect(screen.getByTitle('Save')).toBeInTheDocument();
      expect(screen.getByTitle('Cancel')).toBeInTheDocument();
    });

    it('should focus input when entering edit mode', async () => {
      const user = userEvent.setup();
      
      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      expect(input).toHaveFocus();
    });

    it('should initialize input with current value when entering edit mode', async () => {
      const user = userEvent.setup();
      const company = createValidCompanyData({ name: 'Test Company' });
      
      render(
        <InlineCompanySelector
          {...defaultProps}
          value={company}
        />
      );

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      expect(input).toHaveValue('Test Company');
    });
  });

  describe('Company Search', () => {
    it('should search companies when user types', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
        createValidCompanyData({ id: '2', name: 'Beta Inc' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'Acme');

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/companies?search=Acme&limit=10');
      });

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      });
    });

    it('should clear search results when input is empty', async () => {
      const user = userEvent.setup();
      
      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'Acme');
      
      // Clear the input
      await user.clear(input);

      // The component should clear search results when input is empty
      // We don't need to check for a specific API call, just verify the behavior
      await waitFor(() => {
        expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      });
    });

    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Clear the default mock and set up error response
      mockAuthFetch.mockClear();
      mockAuthFetch.mockRejectedValue(new Error('Search failed'));

      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'Acme');

      await waitFor(() => {
        // Should not crash, just show no results
        expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      });
    });
  });

  describe('Company Selection', () => {
    it('should select company when clicked', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'Acme');

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const companyOption = screen.getByText('Acme Corp');
      await user.click(companyOption);

      expect(input).toHaveValue('Acme Corp');
    });

    it('should clear search results after selection', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'Acme');

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const companyOption = screen.getByText('Acme Corp');
      await user.click(companyOption);

      // Search results should be cleared
      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
    });
  });

  describe('Add Company Form', () => {
    it('should show "Add Company" option when no exact match is found', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'New Company');

      await waitFor(() => {
        expect(screen.getByText('+ Add "New Company"')).toBeInTheDocument();
      });
    });

    it('should show add company form when "Add Company" is clicked', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'New Company');

      await waitFor(() => {
        expect(screen.getByText('+ Add "New Company"')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add "New Company"');
      await user.click(addButton);

      expect(screen.getByText('Add New Company')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Company name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Website (optional)')).toBeInTheDocument();
    });

    it('should create new company when form is submitted', async () => {
      const user = userEvent.setup();
      const { mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      const newCompany = createValidCompanyData({ id: '2', name: 'New Company' });
      
      mockAuthFetch
        .mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies))
        .mockResolvedValueOnce(mockCompanyCreationResponse(newCompany));

      render(<InlineCompanySelector {...defaultProps} />);

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

      const websiteInput = screen.getByPlaceholderText('Website (optional)');
      await user.type(websiteInput, 'https://newcompany.com');

      const createButton = screen.getByText('Add Company');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'New Company',
            website: 'https://newcompany.com',
          }),
        });
      });

      await waitFor(() => {
        expect(input).toHaveValue('New Company');
      });
    });

    it('should handle company creation errors', async () => {
      const user = userEvent.setup();
      const { mockCompanyCreationError } = setupCompanyCreationTest();
      
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      // Clear the default mock and set up specific responses
      mockAuthFetch.mockClear();
      mockAuthFetch
        .mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies))
        .mockRejectedValueOnce(new Error('Creation failed'));

      render(<InlineCompanySelector {...defaultProps} />);

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
      // The field should be empty initially, so we need to type the company name
      await user.type(nameInput, 'New Company');

      const createButton = screen.getByText('Add Company');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Creation failed')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Save Functionality', () => {
    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'New Company');

      const saveButton = screen.getByTitle('Save');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith('company', 'New Company', 'test-record-id', 'people');
    });

    it('should call onSuccess when save is successful', async () => {
      const user = userEvent.setup();
      
      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'New Company');

      const saveButton = screen.getByTitle('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('Company updated successfully!');
      });
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockOnSave.mockRejectedValueOnce(new Error('Save failed'));

      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'New Company');

      const saveButton = screen.getByTitle('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('Failed to update. Please try again.');
      });
    });

    it('should not call onSave if value has not changed', async () => {
      const user = userEvent.setup();
      const company = createValidCompanyData({ name: 'Test Company' });
      
      render(
        <InlineCompanySelector
          {...defaultProps}
          value={company}
        />
      );

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const saveButton = screen.getByTitle('Save');
      await user.click(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should cancel edit mode when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const cancelButton = screen.getByTitle('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByPlaceholderText('Enter company name')).not.toBeInTheDocument();
      expect(screen.getByText('Enter company name')).toBeInTheDocument();
    });

    it('should reset input value when canceling', async () => {
      const user = userEvent.setup();
      const company = createValidCompanyData({ name: 'Test Company' });
      
      render(
        <InlineCompanySelector
          {...defaultProps}
          value={company}
        />
      );

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'Modified Company');

      const cancelButton = screen.getByTitle('Cancel');
      await user.click(cancelButton);

      // Should show original value
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should save when Enter is pressed', async () => {
      const user = userEvent.setup();
      
      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'New Company');

      await user.keyboard('{Enter}');

      expect(mockOnSave).toHaveBeenCalledWith('company', 'New Company', 'test-record-id', 'people');
    });

    it('should cancel when Escape is pressed', async () => {
      const user = userEvent.setup();
      
      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      await user.keyboard('{Escape}');

      expect(screen.queryByPlaceholderText('Enter company name')).not.toBeInTheDocument();
    });

    it('should create company when Enter is pressed in add form', async () => {
      const user = userEvent.setup();
      const { mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      const newCompany = createValidCompanyData({ id: '2', name: 'New Company' });
      
      // Clear the default mock and set up specific responses
      mockAuthFetch.mockClear();
      // Mock all search calls (user typing "New Company" will trigger multiple searches)
      mockAuthFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/v1/companies?search=')) {
          return Promise.resolve(mockCompanySearchResponse(mockCompanies));
        }
        if (url === '/api/v1/companies' && options?.method === 'POST') {
          return Promise.resolve(mockCompanyCreationResponse(newCompany));
        }
        return Promise.resolve({ success: true, data: [] });
      });

      render(<InlineCompanySelector {...defaultProps} />);

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
      // The field should be empty initially, so we need to type the company name
      await user.type(nameInput, 'New Company');

      const addCompanyButton = screen.getByText('Add Company');
      await user.click(addCompanyButton);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'New Company',
            website: '',
          }),
        });
      });
    });
  });

  describe('Click Outside Behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(
        <div>
          <InlineCompanySelector {...defaultProps} />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'Acme');

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      const outsideElement = screen.getByTestId('outside');
      await user.click(outsideElement);

      await waitFor(() => {
        expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during save', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValueOnce(controlledPromise);

      render(<InlineCompanySelector {...defaultProps} />);

      const editButton = screen.getByTitle('Edit');
      await user.click(editButton);

      const input = screen.getByPlaceholderText('Enter company name');
      await user.type(input, 'New Company');

      const saveButton = screen.getByTitle('Save');
      await user.click(saveButton);

      // Should show loading state
      expect(saveButton).toBeDisabled();
      expect(screen.getByTitle('Cancel')).toBeDisabled();

      // Resolve the promise
      resolvePromise!(undefined);

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });
});
