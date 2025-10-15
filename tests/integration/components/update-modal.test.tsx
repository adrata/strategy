/**
 * UpdateModal Integration Tests
 * 
 * Tests the UpdateModal component's integration with buyer groups tab and record prop updates
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateModal } from '@/frontend/components/pipeline/UpdateModal';
import { createTestCompany, createTestBuyerGroupMember, TEST_USER } from '../../utils/test-factories';

// Mock the auth fetch function
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock safe storage functions
jest.mock('@/platform/utils/storage/safeLocalStorage', () => ({
  safeGetItem: jest.fn(),
  safeSetItem: jest.fn(),
}));

// Mock keyboard shortcuts
jest.mock('@/platform/utils/keyboard-shortcuts', () => ({
  getCommonShortcut: jest.fn(() => 'Ctrl+S'),
}));

describe('UpdateModal Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
    recordType: 'companies' as const,
  };

  // Get the mocked authFetch function
  const { authFetch: mockAuthFetch } = require('@/platform/api-fetch');

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
  });

  describe('Record Prop Updates', () => {
    it('should pass correct record prop to UniversalBuyerGroupsTab', async () => {
      const company1 = createTestCompany({ 
        id: 'company-1', 
        name: 'Company 1',
        workspaceId: TEST_USER.workspaceId
      });
      
      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'John Doe', 
          company: 'Company 1'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
      });

      const { rerender } = render(
        <UpdateModal {...defaultProps} record={company1} />
      );

      // Navigate to buyer groups tab
      const buyerGroupsTab = screen.getByText('Buyer Groups');
      await userEvent.click(buyerGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Verify API was called with correct company ID
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-1');
    });

    it('should re-render tabs when record changes', async () => {
      const company1 = createTestCompany({ 
        id: 'company-1', 
        name: 'Company 1',
        workspaceId: TEST_USER.workspaceId
      });
      
      const company2 = createTestCompany({ 
        id: 'company-2', 
        name: 'Company 2',
        workspaceId: TEST_USER.workspaceId
      });
      
      const mockBuyerGroup1 = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'Person 1', 
          company: 'Company 1'
        })
      ];
      
      const mockBuyerGroup2 = [
        createTestBuyerGroupMember({ 
          id: 'person-2', 
          name: 'Person 2', 
          company: 'Company 2'
        })
      ];

      mockAuthFetch
        .mockResolvedValueOnce({ success: true, data: mockBuyerGroup1 })
        .mockResolvedValueOnce({ success: true, data: mockBuyerGroup2 });

      const { rerender } = render(
        <UpdateModal {...defaultProps} record={company1} />
      );

      // Navigate to buyer groups tab
      const buyerGroupsTab = screen.getByText('Buyer Groups');
      await userEvent.click(buyerGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('Person 1')).toBeInTheDocument();
      });

      // Change record prop (simulating navigation to next company)
      rerender(<UpdateModal {...defaultProps} record={company2} />);

      await waitFor(() => {
        expect(screen.getByText('Person 2')).toBeInTheDocument();
        expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
      });

      // Verify both API calls were made
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-1');
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-2');
    });

    it('should handle tab switching correctly', async () => {
      const company = createTestCompany({ 
        id: 'company-1', 
        name: 'Test Company',
        workspaceId: TEST_USER.workspaceId
      });

      render(<UpdateModal {...defaultProps} record={company} />);

      // Start on Overview tab
      expect(screen.getByText('Overview')).toBeInTheDocument();

      // Switch to Buyer Groups tab
      const buyerGroupsTab = screen.getByText('Buyer Groups');
      await userEvent.click(buyerGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument(); // Stats section
      });

      // Switch back to Overview tab
      const overviewTab = screen.getByText('Overview');
      await userEvent.click(overviewTab);

      await waitFor(() => {
        // Should show company form fields
        expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
      });
    });

    it('should handle navigation arrows updating record prop correctly', async () => {
      const companies = [
        createTestCompany({ id: 'company-1', name: 'Company 1' }),
        createTestCompany({ id: 'company-2', name: 'Company 2' }),
        createTestCompany({ id: 'company-3', name: 'Company 3' })
      ];

      const mockBuyerGroups = [
        [createTestBuyerGroupMember({ id: 'person-1', name: 'Person 1', company: 'Company 1' })],
        [createTestBuyerGroupMember({ id: 'person-2', name: 'Person 2', company: 'Company 2' })],
        [createTestBuyerGroupMember({ id: 'person-3', name: 'Person 3', company: 'Company 3' })]
      ];

      mockAuthFetch
        .mockResolvedValueOnce({ success: true, data: mockBuyerGroups[0] })
        .mockResolvedValueOnce({ success: true, data: mockBuyerGroups[1] })
        .mockResolvedValueOnce({ success: true, data: mockBuyerGroups[2] });

      const { rerender } = render(
        <UpdateModal {...defaultProps} record={companies[0]} />
      );

      // Navigate to buyer groups tab
      const buyerGroupsTab = screen.getByText('Buyer Groups');
      await userEvent.click(buyerGroupsTab);

      // Simulate navigation through companies (as if parent component updated record prop)
      for (let i = 0; i < companies.length; i++) {
        rerender(<UpdateModal {...defaultProps} record={companies[i]} />);

        await waitFor(() => {
          expect(screen.getByText(`Person ${i + 1}`)).toBeInTheDocument();
        });
      }

      // Verify all API calls were made
      expect(mockAuthFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Buyer Groups Tab Integration', () => {
    it('should display buyer group members correctly', async () => {
      const company = createTestCompany({ 
        id: 'company-1', 
        name: 'Test Company',
        workspaceId: TEST_USER.workspaceId
      });
      
      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'John Doe', 
          title: 'CEO',
          role: 'Decision Maker',
          influence: 'high'
        }),
        createTestBuyerGroupMember({ 
          id: 'person-2', 
          name: 'Jane Smith', 
          title: 'VP Engineering',
          role: 'Champion',
          influence: 'medium'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
      });

      render(<UpdateModal {...defaultProps} record={company} />);

      // Navigate to buyer groups tab
      const buyerGroupsTab = screen.getByText('Buyer Groups');
      await userEvent.click(buyerGroupsTab);

      await waitFor(() => {
        // Check overview stats
        expect(screen.getByText('2')).toBeInTheDocument(); // Total
        expect(screen.getByText('1')).toBeInTheDocument(); // Decision Makers
        expect(screen.getByText('1')).toBeInTheDocument(); // Champions
        
        // Check member details
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('CEO')).toBeInTheDocument();
        expect(screen.getByText('Decision Maker')).toBeInTheDocument();
        
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('VP Engineering')).toBeInTheDocument();
        expect(screen.getByText('Champion')).toBeInTheDocument();
      });
    });

    it('should handle empty buyer groups', async () => {
      const company = createTestCompany({ 
        id: 'company-1', 
        name: 'Test Company',
        workspaceId: TEST_USER.workspaceId
      });

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<UpdateModal {...defaultProps} record={company} />);

      // Navigate to buyer groups tab
      const buyerGroupsTab = screen.getByText('Buyer Groups');
      await userEvent.click(buyerGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Total members
        expect(screen.getByText('0')).toBeInTheDocument(); // Decision Makers
        expect(screen.getByText('0')).toBeInTheDocument(); // Champions
      });
    });

    it('should handle API errors in buyer groups tab', async () => {
      const company = createTestCompany({ 
        id: 'company-1', 
        name: 'Test Company',
        workspaceId: TEST_USER.workspaceId
      });

      mockAuthFetch.mockRejectedValue(new Error('API Error'));

      render(<UpdateModal {...defaultProps} record={company} />);

      // Navigate to buyer groups tab
      const buyerGroupsTab = screen.getByText('Buyer Groups');
      await userEvent.click(buyerGroupsTab);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 on error
      });
    });
  });

  describe('Modal State Management', () => {
    it('should initialize form data with record data', () => {
      const company = createTestCompany({ 
        id: 'company-1', 
        name: 'Test Company',
        industry: 'Technology',
        size: '51-200 employees'
      });

      render(<UpdateModal {...defaultProps} record={company} />);

      // Check that form fields are populated with record data
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Technology')).toBeInTheDocument();
      expect(screen.getByDisplayValue('51-200 employees')).toBeInTheDocument();
    });

    it('should update form data when record changes', () => {
      const company1 = createTestCompany({ 
        id: 'company-1', 
        name: 'Company 1',
        industry: 'Technology'
      });
      
      const company2 = createTestCompany({ 
        id: 'company-2', 
        name: 'Company 2',
        industry: 'Healthcare'
      });

      const { rerender } = render(
        <UpdateModal {...defaultProps} record={company1} />
      );

      expect(screen.getByDisplayValue('Company 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Technology')).toBeInTheDocument();

      // Change record
      rerender(<UpdateModal {...defaultProps} record={company2} />);

      expect(screen.getByDisplayValue('Company 2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Healthcare')).toBeInTheDocument();
    });

    it('should handle modal close correctly', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });

      render(<UpdateModal {...defaultProps} record={company} />);

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Record Type Handling', () => {
    it('should handle people record type correctly', async () => {
      const person = {
        id: 'person-1',
        fullName: 'John Doe',
        companyId: 'company-1',
        company: 'Test Company',
        workspaceId: TEST_USER.workspaceId
      };

      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'John Doe', 
          company: 'Test Company'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
      });

      render(
        <UpdateModal 
          {...defaultProps} 
          record={person} 
          recordType="people" 
        />
      );

      // Navigate to buyer groups tab
      const buyerGroupsTab = screen.getByText('Buyer Groups');
      await userEvent.click(buyerGroupsTab);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-1');
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle different record types with appropriate tabs', () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      const person = {
        id: 'person-1',
        fullName: 'John Doe',
        companyId: 'company-1',
        company: 'Test Company'
      };

      const { rerender } = render(
        <UpdateModal {...defaultProps} record={company} recordType="companies" />
      );

      // Company should have buyer groups tab
      expect(screen.getByText('Buyer Groups')).toBeInTheDocument();

      // Change to person record type
      rerender(
        <UpdateModal {...defaultProps} record={person} recordType="people" />
      );

      // Person should also have buyer groups tab
      expect(screen.getByText('Buyer Groups')).toBeInTheDocument();
    });
  });
});
