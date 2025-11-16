/**
 * Buyer Groups Tab Integration Tests
 * 
 * Tests the buyer groups tab with real API integration, cache management, and state updates
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
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock localStorage with real implementation
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock safe storage functions
jest.mock('@/platform/utils/storage/safeLocalStorage', () => ({
  safeGetItem: jest.fn(),
  safeSetItem: jest.fn(),
}));

describe('Buyer Groups Tab Integration Tests', () => {
  const mockOnSave = jest.fn();
  const defaultProps = {
    recordType: 'companies',
    onSave: mockOnSave,
  };

  // Get the mocked functions
  const { authFetch: mockAuthFetch } = require('@/platform/api-fetch');
  const { safeGetItem: mockSafeGetItem, safeSetItem: mockSafeSetItem } = require('@/platform/utils/storage/safeLocalStorage');

  // Mock global fetch for company name fetching
  const mockFetch = jest.fn();
  global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockSafeGetItem.mockReturnValue(null);
    mockSafeSetItem.mockImplementation(() => {});
    // Reset fetch mock
    mockFetch.mockReset();
  });

  describe('API Integration', () => {
    it('should fetch buyer groups from /api/data/buyer-groups/fast', async () => {
      const company = createTestCompany({ 
        id: 'company-123', 
        name: 'Test Company',
        workspaceId: TEST_USER.workspaceId
      });
      
      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'John Doe', 
          role: 'Decision Maker',
          company: 'Test Company'
        }),
        createTestBuyerGroupMember({ 
          id: 'person-2', 
          name: 'Jane Smith', 
          role: 'Champion',
          company: 'Test Company'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
        meta: { 
          processingTime: 150,
          userId: TEST_USER.id,
          workspaceId: TEST_USER.workspaceId,
          companyId: 'company-123'
        }
      });

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-123');
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        
        // Check total members count
        const totalElements = screen.getAllByText('2');
        expect(totalElements.length).toBeGreaterThanOrEqual(1); // At least one "2" for total
        
        // Check individual role counts
        const oneElements = screen.getAllByText('1');
        expect(oneElements.length).toBeGreaterThanOrEqual(2); // At least two "1" values (Decision Makers, Champions)
      });
    });

    it('should handle different company IDs correctly', async () => {
      const company1 = createTestCompany({ id: 'company-1', name: 'Company 1' });
      const company2 = createTestCompany({ id: 'company-2', name: 'Company 2' });
      
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

      const { rerender } = render(<UniversalBuyerGroupsTab {...defaultProps} record={company1} />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-1');
        expect(screen.getByText('Person 1')).toBeInTheDocument();
      });

      rerender(<UniversalBuyerGroupsTab {...defaultProps} record={company2} />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-2');
        expect(screen.getByText('Person 2')).toBeInTheDocument();
        expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      
      mockAuthFetch.mockRejectedValue(new Error('Network error'));

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 members on error
      });
    });
  });

  describe('Cache Integration', () => {
    it('should store and retrieve from localStorage', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'Cached Person', 
          company: 'Test Company'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
      });

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        expect(screen.getByText('Cached Person')).toBeInTheDocument();
      });

      // Verify data was cached
      expect(mockSafeSetItem).toHaveBeenCalledWith(
        expect.stringContaining('people-'),
        expect.arrayContaining([
          expect.objectContaining({
            id: 'person-1',
            fullName: 'Cached Person'
          })
        ])
      );
    });

    it('should clear cache on company change', async () => {
      const company1 = createTestCompany({ id: 'company-1', name: 'Company 1' });
      const company2 = createTestCompany({ id: 'company-2', name: 'Company 2' });
      
      mockAuthFetch.mockResolvedValue({ success: true, data: [] });

      const { rerender } = render(<UniversalBuyerGroupsTab {...defaultProps} record={company1} />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-1');
      });

      // Change to company 2
      rerender(<UniversalBuyerGroupsTab {...defaultProps} record={company2} />);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          expect.stringContaining('buyer-groups-company-1')
        );
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          expect.stringContaining('buyer-groups-company-2')
        );
      });
    });

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
      mockSafeGetItem.mockReturnValue(mockBuyerGroup);

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        expect(screen.getByText('Cached Person')).toBeInTheDocument();
      });

      // Should not make API call if cache is valid
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should update buyerGroups state correctly', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-1', 
          name: 'John Doe', 
          role: 'Decision Maker',
          influence: 'high'
        }),
        createTestBuyerGroupMember({ 
          id: 'person-2', 
          name: 'Jane Smith', 
          role: 'Champion',
          influence: 'medium'
        }),
        createTestBuyerGroupMember({ 
          id: 'person-3', 
          name: 'Bob Wilson', 
          role: 'Stakeholder',
          influence: 'low'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
      });

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        // Check total count
        expect(screen.getByText('3')).toBeInTheDocument();
        
        // Check individual members are displayed
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        
        // Check roles are displayed
        expect(screen.getAllByText('Decision Maker')).toHaveLength(1);
        expect(screen.getAllByText('Champion')).toHaveLength(1);
        expect(screen.getAllByText('Stakeholder')).toHaveLength(1);
      });
    });

    it('should handle navigation simulation correctly', async () => {
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

      const { rerender } = render(<UniversalBuyerGroupsTab {...defaultProps} record={companies[0]} />);

      // Navigate through companies
      for (let i = 0; i < companies.length; i++) {
        await waitFor(() => {
          expect(screen.getByText(`Person ${i + 1}`)).toBeInTheDocument();
        });

        if (i < companies.length - 1) {
          rerender(<UniversalBuyerGroupsTab {...defaultProps} record={companies[i + 1]} />);
        }
      }

      // Verify all API calls were made
      expect(mockAuthFetch).toHaveBeenCalledTimes(3);
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-1');
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-2');
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-3');
    });
  });

  describe('UpdateModal Integration', () => {
    it('should handle different record props correctly', async () => {
      const company1 = createTestCompany({ id: 'company-1', name: 'Company 1' });
      const company2 = createTestCompany({ id: 'company-2', name: 'Company 2' });
      
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

      // Simulate UpdateModal passing different record props
      const { rerender } = render(<UniversalBuyerGroupsTab {...defaultProps} record={company1} />);

      await waitFor(() => {
        expect(screen.getByText('Person 1')).toBeInTheDocument();
      });

      // UpdateModal changes record prop
      rerender(<UniversalBuyerGroupsTab {...defaultProps} record={company2} />);

      await waitFor(() => {
        expect(screen.getByText('Person 2')).toBeInTheDocument();
        expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
      });
    });

    it('should handle person record type correctly', async () => {
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

      render(<UniversalBuyerGroupsTab {...defaultProps} record={person} recordType="people" />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-1');
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should wait for companyId and fetch when it becomes available', async () => {
      // Simulate initial load without companyId (common on first load)
      const prospectWithoutCompany = {
        id: 'prospect-1',
        fullName: 'Jane Smith',
        // companyId is missing initially
        company: null,
        workspaceId: TEST_USER.workspaceId
      };

      // Record with companyId (after API update)
      const prospectWithCompany = {
        id: 'prospect-1',
        fullName: 'Jane Smith',
        companyId: 'company-2',
        company: {
          id: 'company-2',
          name: 'Acme Corp'
        },
        workspaceId: TEST_USER.workspaceId
      };

      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-2', 
          name: 'Bob Johnson', 
          company: 'Acme Corp',
          companyId: 'company-2'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
      });

      // Render initially without companyId
      const { rerender } = render(
        <UniversalBuyerGroupsTab 
          {...defaultProps} 
          record={prospectWithoutCompany} 
          recordType="prospects" 
        />
      );

      // Should show loading state, no API call yet
      await waitFor(() => {
        expect(mockAuthFetch).not.toHaveBeenCalled();
      });

      // Update record with companyId (simulating API response with company data)
      rerender(
        <UniversalBuyerGroupsTab 
          {...defaultProps} 
          record={prospectWithCompany} 
          recordType="prospects" 
        />
      );

      // Now should fetch buyer groups with companyId
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-2');
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('should handle companyId without company relation object', async () => {
      // Simulate record with companyId field but null company relation (common scenario)
      // Provide companyName directly to avoid async fetch complexity in test
      const prospectWithCompanyIdOnly = {
        id: 'prospect-2',
        fullName: 'Alice Brown',
        companyId: 'company-3',
        companyName: 'Tech Inc', // Provide companyName directly to avoid fetch
        // company relation is null but companyId exists
        company: null,
        workspaceId: TEST_USER.workspaceId
      };

      const mockBuyerGroup = [
        createTestBuyerGroupMember({ 
          id: 'person-3', 
          name: 'Charlie Wilson', 
          company: 'Tech Inc',
          companyId: 'company-3'
        })
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockBuyerGroup,
      });

      render(
        <UniversalBuyerGroupsTab 
          {...defaultProps} 
          record={prospectWithCompanyIdOnly} 
          recordType="prospects" 
        />
      );

      // Should use companyId even though company relation is null
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/data/buyer-groups/fast?companyId=company-3');
        expect(screen.getByText('Charlie Wilson')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Performance and Optimization', () => {
    it('should prevent multiple simultaneous fetches', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      
      // Mock a slow API response
      mockAuthFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      );

      render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      // Trigger multiple renders quickly
      act(() => {
        jest.advanceTimersByTime(10);
      });

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should respect fetch throttling', async () => {
      const company = createTestCompany({ id: 'company-1', name: 'Test Company' });
      
      mockAuthFetch.mockResolvedValue({ success: true, data: [] });

      const { rerender } = render(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledTimes(1);
      });

      // Re-render with same company quickly
      rerender(<UniversalBuyerGroupsTab {...defaultProps} record={company} />);

      // Should not make another API call due to throttling
      expect(mockAuthFetch).toHaveBeenCalledTimes(1);
    });
  });
});
