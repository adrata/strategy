/**
 * AddCompanyModal Unit Tests
 * 
 * Tests for the AddCompanyModal component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddCompanyModal } from '@/platform/ui/components/AddCompanyModal';
import { setupCompanyCreationTest, COMPANY_TEST_SCENARIOS } from '../../utils/company-test-helpers';

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

describe('AddCompanyModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCompanyAdded = jest.fn();
  const { mockAuthFetch } = setupCompanyCreationTest();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Open/Close Behavior', () => {
    it('should render when isOpen is true', () => {
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      expect(screen.getByText('Add Company')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Company name')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <AddCompanyModal
          isOpen={false}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      expect(screen.queryByText('Add Company')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when escape key is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('should show error when trying to submit without company name', async () => {
      const user = userEvent.setup();
      
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

    it('should show error when company name is only whitespace', async () => {
      const user = userEvent.setup();
      
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, '   ');

      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });
    });

    it('should not show error when company name is valid', async () => {
      const user = userEvent.setup();
      
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Test Company');

      expect(screen.queryByText('Company name is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const { createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompany = createValidCompanyData({ name: 'Test Company' });
      mockAuthFetch.mockResolvedValueOnce(mockCompanyCreationResponse(mockCompany));

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

      await waitFor(() => {
        expect(mockOnCompanyAdded).toHaveBeenCalledWith(mockCompany);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should submit form with website and notes', async () => {
      const user = userEvent.setup();
      const { createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompany = createValidCompanyData({ 
        name: 'Test Company',
        website: 'https://testcompany.com'
      });
      mockAuthFetch.mockResolvedValueOnce(mockCompanyCreationResponse(mockCompany));

      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Test Company');

      const websiteInput = screen.getByPlaceholderText('Website (optional)');
      await user.type(websiteInput, 'https://testcompany.com');

      const notesInput = screen.getByPlaceholderText('Notes (optional)');
      await user.type(notesInput, 'Test notes');

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
            website: 'https://testcompany.com',
            notes: 'Test notes',
            mainSellerId: '01K1VBYZG41K9QA0D9CF06KNRG',
          }),
          timeout: 30000,
        });
      });
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      const { mockCompanyCreationError } = setupCompanyCreationTest();
      
      mockAuthFetch.mockRejectedValueOnce(mockCompanyCreationError('API Error'));

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
        expect(screen.getByText(/API Error/)).toBeInTheDocument();
      });

      expect(mockOnCompanyAdded).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const { createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompany = createValidCompanyData({ name: 'Test Company' });
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockAuthFetch.mockReturnValueOnce(controlledPromise);

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

      // Should show loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!(mockCompanyCreationResponse(mockCompany));

      await waitFor(() => {
        expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should submit form when Cmd+Enter is pressed', async () => {
      const user = userEvent.setup();
      const { createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompany = createValidCompanyData({ name: 'Test Company' });
      mockAuthFetch.mockResolvedValueOnce(mockCompanyCreationResponse(mockCompany));

      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Test Company');

      // Simulate Cmd+Enter (or Ctrl+Enter on Windows)
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalled();
      });
    });

    it('should not submit form when Enter is pressed without Cmd', async () => {
      const user = userEvent.setup();
      
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Test Company');

      // Simulate just Enter
      await user.keyboard('{Enter}');

      // Should not submit (form should not be submitted)
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });
  });

  describe('Website URL Normalization', () => {
    it('should normalize website URLs correctly', async () => {
      const user = userEvent.setup();
      const { createValidCompanyData, mockCompanyCreationResponse } = setupCompanyCreationTest();
      
      const mockCompany = createValidCompanyData({ 
        name: 'Test Company',
        website: 'https://testcompany.com'
      });
      mockAuthFetch.mockResolvedValueOnce(mockCompanyCreationResponse(mockCompany));

      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Test Company');

      const websiteInput = screen.getByPlaceholderText('Website (optional)');
      await user.type(websiteInput, 'testcompany.com');

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
            website: 'https://testcompany.com',
            notes: undefined,
            mainSellerId: '01K1VBYZG41K9QA0D9CF06KNRG',
          }),
          timeout: 30000,
        });
      });
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal closes', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      await user.type(nameInput, 'Test Company');

      // Close modal
      rerender(
        <AddCompanyModal
          isOpen={false}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      // Reopen modal
      rerender(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      // Form should be reset
      expect(screen.getByPlaceholderText('Company name')).toHaveValue('');
    });

    it('should clear error state when modal reopens', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /add company/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });

      // Close and reopen modal
      rerender(
        <AddCompanyModal
          isOpen={false}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      rerender(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      // Error should be cleared
      expect(screen.queryByText('Company name is required')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Company name')).toBeInTheDocument();
      expect(screen.getByLabelText('Website (optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('Notes (optional)')).toBeInTheDocument();
    });

    it('should focus name input when modal opens', async () => {
      render(
        <AddCompanyModal
          isOpen={true}
          onClose={mockOnClose}
          onCompanyAdded={mockOnCompanyAdded}
        />
      );

      const nameInput = screen.getByPlaceholderText('Company name');
      expect(nameInput).toHaveFocus();
    });
  });
});
