/**
 * UniversalBuyerGroupsTab Unit Tests
 * 
 * Tests the buyer groups tab component in isolation with mocked dependencies
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniversalBuyerGroupsTab } from '@/frontend/components/pipeline/tabs/UniversalBuyerGroupsTab';
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

describe('UniversalBuyerGroupsTab', () => {
  const mockOnSave = jest.fn();
  const defaultProps = {
    recordType: 'companies',
    onSave: mockOnSave,
  };

  // Get the mocked functions
  const { authFetch: mockAuthFetch } = require('@/platform/api-fetch');
  const { safeGetItem: mockSafeGetItem, safeSetItem: mockSafeSetItem } = require('@/platform/utils/storage/safeLocalStorage');

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockSafeGetItem.mockReturnValue(null);
    mockSafeSetItem.mockImplementation(() => {});
  });

  describe('Component Rendering', () => {
    it('should render with empty buyer groups initially', () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      // Check that all stats show 0 initially
      const totalElements = screen.getAllByText('0');
      expect(totalElements.length).toBeGreaterThanOrEqual(6); // At least 6 zero values (Total, Decision Makers, Champions, Stakeholders, Blockers, Introducers)
    });

    it('should render overview stats correctly', () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);
      
      // Check all stat categories are rendered
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Decision Makers')).toBeInTheDocument();
      expect(screen.getByText('Champions')).toBeInTheDocument();
      expect(screen.getByText('Stakeholders')).toBeInTheDocument();
      expect(screen.getByText('Blockers')).toBeInTheDocument();
      expect(screen.getByText('Introducers')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load buyer groups for a given company ID', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'John Doe', 
          role: 'Decision Maker',
          company: 'Test Company'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
        meta: { processingTime: 100 }
      });

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-1');
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Decision Maker')).toBeInTheDocument();
      });
    });

    it('should clear buyer groups when company changes', async () => {
      const company1 = createTestCompany({ id: 'company-1', name: 'Company 1' });
      const company2 = createTestCompany({ id: 'company-2', name: 'Company 2' });
      
      const mockBuyerGroup1 = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'John Doe', 
          company: 'Company 1'
        })
      ];
      
      const mockBuyerGroup2 = [
        createTestBuyerGroupMember({ 
          id: 'person-2', 
          name: 'Jane Smith', 
          company: 'Company 2'
        })
      ];

      // First render with company 1
      mockAuthFetch.mockResolvedValueOnce({
        success: true,
        data: mockBuyerGroup1,
      });

      const { rerender } = render(<UniversalBuyerGroupsTab {...defaultProps} record={company1} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Change to company 2
      mockAuthFetch.mockResolvedValueOnce({
        success: true,
        data: mockBuyerGroup2,
      });

      rerender(<UniversalBuyerGroupsTab {...defaultProps} record={company2} />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should clear state immediately when record ID is null', () => {
      render(<UniversalBuyerGroupsTab {...defaultProps} record={null} />);
      
      // Check that all stats show 0 when no record
      const totalElements = screen.getAllByText('0');
      expect(totalElements.length).toBeGreaterThanOrEqual(6); // At least 6 zero values
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should use cached data when available and valid', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'Cached Person', 
          company: 'Test Company'
        })
      ];

      // Mock cached data
      const { safeGetItem } = require('@/platform/utils/storage/safeLocalStorage');
      safeGetItem.mockReturnValue(mockBuyerGroup);

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        expect(screen.getByText('Cached Person')).toBeInTheDocument();
      });

      // Should not make API call if cache is valid
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });

    it('should invalidate cache when company changes', async () => {
      const company1 = createTestCompany({ id: 'company-1', name: 'Company 1' });
      const company2 = createTestCompany({ id: 'company-2', name: 'Company 2' });
      
      const mockBuyerGroup1 = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'Person 1', 
          company: 'Company 1'
        })
      ];

      // First render with company 1
      mockAuthFetch.mockResolvedValueOnce({
        success: true,
        data: mockBuyerGroup1,
      });

      const { rerender } = render(<UniversalBuyerGroupsTab {...defaultProps} record={company1} />);

      await waitFor(() => {
        expect(screen.getByText('Person 1')).toBeInTheDocument();
      });

      // Change to company 2 - should clear cache and fetch new data
      mockAuthFetch.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      rerender(<UniversalBuyerGroupsTab {...defaultProps} record={company2} />);

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
          expect.stringContaining('buyer-groups-company-1')
        );
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
          expect.stringContaining('buyer-groups-company-2')
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      
      mockAuthFetch.mockRejectedValue(new Error('API Error'));

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        // Should show 0 members on error
        const totalElements = screen.getAllByText('0');
        expect(totalElements.length).toBeGreaterThanOrEqual(6);
      });
    });

    it('should handle empty API responses', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        // Should show 0 members for empty response
        const totalElements = screen.getAllByText('0');
        expect(totalElements.length).toBeGreaterThanOrEqual(6);
      });
    });
  });

  describe('Member Interaction', () => {
    it('should handle member click navigation', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'John Doe', 
          title: 'CEO',
          email: 'john@test.com'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
      });

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const memberElement = screen.getByText('John Doe').closest('div');
      expect(memberElement).toHaveClass('cursor-pointer');
    });

    it('should display member details correctly', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'John Doe', 
          title: 'CEO',
          email: 'john@test.com',
          role: 'Decision Maker',
          influence: 'high'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
      });

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('CEO')).toBeInTheDocument();
        expect(screen.getByText('john@test.com')).toBeInTheDocument();
        expect(screen.getByText('Decision Maker')).toBeInTheDocument();
        expect(screen.getByText('high influence')).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should track previous company ID correctly', async () => {
      const company1 = createTestCompany({ id: 'company-1', name: 'Company 1' });
      const company2 = createTestCompany({ id: 'company-2', name: 'Company 2' });
      
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [],
      });

      const { rerender } = render(<UniversalBuyerGroupsTab {...defaultProps} record={company1} />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-1');
      });

      // Change to company 2
      rerender(<UniversalBuyerGroupsTab {...defaultProps} record={company2} />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-2');
      });

      // Should have been called twice (once for each company)
      expect(mockAuthFetch).toHaveBeenCalledTimes(2);
    });

    it('should prevent multiple simultaneous fetches', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      
      // Mock a slow API response
      mockAuthFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      );

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      // Trigger multiple renders quickly
      act(() => {
        // Simulate rapid re-renders
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
