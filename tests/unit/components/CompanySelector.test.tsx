/**
 * CompanySelector Unit Tests
 * 
 * Tests for the CompanySelector component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanySelector } from '@/frontend/components/pipeline/CompanySelector';
import { setupCompanyCreationTest, createValidCompanyData } from '../../utils/company-test-helpers';

// Mock authFetch
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

describe('CompanySelector', () => {
  const mockOnChange = jest.fn();
  const { mockAuthFetch, mockCompanySearchResponse } = setupCompanyCreationTest();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default placeholder', () => {
      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByPlaceholderText('Search or add company...')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
          placeholder="Custom placeholder"
        />
      );

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('should display current company name when value is provided', () => {
      const company = createValidCompanyData({ name: 'Test Company' });
      
      render(
        <CompanySelector
          value={company}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    });

    it('should display company name when value is a string', () => {
      render(
        <CompanySelector
          value="Test Company"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
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

      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
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
      
      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      await user.type(input, 'Acme');
      
      // Clear the input
      await user.clear(input);

      expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/companies?search=&limit=10');
    });

    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockAuthFetch.mockRejectedValueOnce(new Error('Search failed'));

      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      await user.type(input, 'Acme');

      await waitFor(() => {
        // Should not crash, just show no results
        expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during search', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockAuthFetch.mockReturnValueOnce(controlledPromise);

      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      await user.type(input, 'Acme');

      // Should show loading state
      expect(screen.getByText('Searching...')).toBeInTheDocument();

      // Resolve the promise
      const mockCompanies = [createValidCompanyData({ id: '1', name: 'Acme Corp' })];
      resolvePromise!(mockCompanySearchResponse(mockCompanies));

      await waitFor(() => {
        expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Company Selection', () => {
    it('should call onChange when company is selected', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
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
      });

      const companyOption = screen.getByText('Acme Corp');
      await user.click(companyOption);

      expect(mockOnChange).toHaveBeenCalledWith(mockCompanies[0]);
    });

    it('should clear search results after selection', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
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
    });

    it('should not show "Add Company" option when exact match is found', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      await user.type(input, 'Acme Corp');

      await waitFor(() => {
        expect(screen.queryByText(/Add.*as new company/)).not.toBeInTheDocument();
      });
    });

    it('should show add company form when "Add Company" is clicked', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

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
        expect(mockOnChange).toHaveBeenCalledWith(newCompany);
      });
    });

    it('should handle company creation errors', async () => {
      const user = userEvent.setup();
      const { mockCompanyCreationError } = setupCompanyCreationTest();
      
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      mockAuthFetch
        .mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies))
        .mockRejectedValueOnce(mockCompanyCreationError('Creation failed'));

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
        expect(screen.getByText('Creation failed')).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should show loading state during company creation', async () => {
      const user = userEvent.setup();
      const { mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      const newCompany = createValidCompanyData({ id: '2', name: 'New Company' });
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockAuthFetch
        .mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies))
        .mockReturnValueOnce(controlledPromise);

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

      // Should show loading state
      expect(screen.getByText('Adding...')).toBeInTheDocument();
      expect(createButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!(mockCompanyCreationResponse(newCompany));

      await waitFor(() => {
        expect(screen.queryByText('Adding...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dropdown Behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(
        <div>
          <CompanySelector
            value={null}
            onChange={mockOnChange}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const input = screen.getByPlaceholderText('Search or add company...');
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

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
        createValidCompanyData({ id: '2', name: 'Beta Inc' }),
      ];
      
      mockAuthFetch.mockResolvedValueOnce(mockCompanySearchResponse(mockCompanies));

      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      await user.type(input, 'Test');

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Press Escape to close dropdown
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      expect(input).toBeDisabled();
    });

    it('should not be disabled when disabled prop is false', () => {
      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <CompanySelector
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByPlaceholderText('Search or add company...');
      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update ARIA attributes when dropdown is open', async () => {
      const user = userEvent.setup();
      const mockCompanies = [
        createValidCompanyData({ id: '1', name: 'Acme Corp' }),
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
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });
});
