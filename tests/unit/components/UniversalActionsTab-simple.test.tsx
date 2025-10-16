import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UniversalActionsTab } from '@/frontend/components/pipeline/tabs/UniversalActionsTab';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';
import { authFetch } from '@/platform/api-fetch';

// Mock dependencies
jest.mock('@/platform/hooks/useWorkspaceUsers');
jest.mock('@/platform/api-fetch');

const mockUseWorkspaceUsers = useWorkspaceUsers as jest.MockedFunction<typeof useWorkspaceUsers>;
const mockAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

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

describe('UniversalActionsTab - Core Performance Tests', () => {
  const mockRecord = {
    id: 'test-record-123',
    name: 'Test Person',
    type: 'person'
  };

  const mockUsers = [
    { id: 'user-1', fullName: 'John Doe', email: 'john@example.com' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkspaceUsers.mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null
    });
    
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('Cache-First Loading (Core Functionality)', () => {
    it('should display cached data instantly without loading skeleton', async () => {
      // Mock fresh cache data
      const cachedData = {
        activities: [
          {
            id: 'action-1',
            type: 'activity',
            date: new Date().toISOString(),
            title: 'Test Action',
            description: 'Test description',
            userId: 'user-1',
            metadata: { type: 'call', status: 'completed' }
          }
        ],
        notes: [],
        timestamp: Date.now() - 30000, // 30 seconds ago (fresh)
        recordType: 'people',
        recordId: 'test-record-123'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should show cached data immediately
      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });

      // Should NOT show loading skeleton
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

      // Should not make API calls for fresh cache
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });

    it('should show loading skeleton only when no cache exists', async () => {
      // No cache data
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should show loading skeleton initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should make API call
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?personId=test-record-123');
    });

    it('should not show loading when cached data exists', async () => {
      const cachedData = {
        activities: [
          {
            id: 'action-1',
            type: 'activity',
            date: new Date().toISOString(),
            title: 'Cached Action',
            description: 'Cached description',
            userId: 'user-1',
            metadata: { type: 'call', status: 'completed' }
          }
        ],
        notes: [],
        timestamp: Date.now() - 30000,
        recordType: 'people',
        recordId: 'test-record-123'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should never show loading state
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      
      // Should show cached data immediately
      await waitFor(() => {
        expect(screen.getByText('Cached Action')).toBeInTheDocument();
      });
    });
  });

  describe('API Call Optimization', () => {
    it('should only make one API call for person records', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should make only one API call for person records
      expect(mockAuthFetch).toHaveBeenCalledTimes(1);
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?personId=test-record-123');

      // Should not call people or companies endpoints for person records
      expect(mockAuthFetch).not.toHaveBeenCalledWith('/api/v1/people?companyId=test-record-123');
      expect(mockAuthFetch).not.toHaveBeenCalledWith('/api/v1/companies?id=test-record-123');
    });

    it('should make multiple API calls for company records', async () => {
      const companyRecord = { ...mockRecord, id: 'company-123' };
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <UniversalActionsTab 
          record={companyRecord} 
          recordType="companies" 
        />
      );

      // Should make 2 API calls for company records
      expect(mockAuthFetch).toHaveBeenCalledTimes(2);
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?companyId=company-123');
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/people?companyId=company-123');
    });
  });

  describe('Cache Management', () => {
    it('should use correct cache key format', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('actions-test-record-123-people-v1');
    });

    it('should handle corrupted cache gracefully', async () => {
      // Mock corrupted cache
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should show loading (cache was invalid)
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should make API call
      expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?personId=test-record-123');

      // Should have cleared corrupted cache
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('actions-test-record-123-people-v1');
    });
  });

  describe('User Name Resolution', () => {
    it('should resolve user names at render time', async () => {
      const cachedData = {
        activities: [
          {
            id: 'action-1',
            type: 'activity',
            date: new Date().toISOString(),
            title: 'Test Action',
            description: 'Test description',
            userId: 'user-1', // Store userId, not resolved name
            metadata: { type: 'call', status: 'completed' }
          }
        ],
        notes: [],
        timestamp: Date.now() - 30000,
        recordType: 'people',
        recordId: 'test-record-123'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should resolve user name at render time
      await waitFor(() => {
        expect(screen.getByText('by John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Expectations', () => {
    it('should minimize API calls with proper caching', async () => {
      const cachedData = {
        activities: [
          {
            id: 'action-1',
            type: 'activity',
            date: new Date().toISOString(),
            title: 'Cached Action',
            description: 'Cached description',
            userId: 'user-1',
            metadata: { type: 'call', status: 'completed' }
          }
        ],
        notes: [],
        timestamp: Date.now() - 30000, // Fresh cache
        recordType: 'people',
        recordId: 'test-record-123'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const { rerender } = render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should not make API call with fresh cache
      expect(mockAuthFetch).not.toHaveBeenCalled();

      // Simulate multiple tab switches
      for (let i = 0; i < 5; i++) {
        rerender(<div>Other Tab</div>);
        rerender(
          <UniversalActionsTab 
            record={mockRecord} 
            recordType="people" 
          />
        );
      }

      // Should still not make any API calls
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });
  });
});

