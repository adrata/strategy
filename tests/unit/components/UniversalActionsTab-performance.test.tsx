import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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

describe('UniversalActionsTab Performance Optimizations', () => {
  const mockRecord = {
    id: 'test-record-123',
    name: 'Test Person',
    type: 'person'
  };

  const mockUsers = [
    { id: 'user-1', fullName: 'John Doe', email: 'john@example.com' },
    { id: 'user-2', fullName: 'Jane Smith', email: 'jane@example.com' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkspaceUsers.mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null
    });
    
    // Clear localStorage mock
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('Cache-First Loading', () => {
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
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();

      // Should not make API calls for fresh cache
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });

    it('should show loading skeleton only when no cache exists', async () => {
      // No cache data
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock API response
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action-1',
            subject: 'Test Action',
            description: 'Test description',
            userId: 'user-1',
            completedAt: new Date().toISOString(),
            type: 'call',
            status: 'completed'
          }
        ]
      });

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should show loading skeleton initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should make API call
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?personId=test-record-123');
      });

      // Should show data after API call
      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });

      // Loading should be gone
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should display stale cache immediately and refresh in background', async () => {
      // Mock stale cache data (2 minutes old)
      const staleCacheData = {
        activities: [
          {
            id: 'action-1',
            type: 'activity',
            date: new Date().toISOString(),
            title: 'Stale Action',
            description: 'Stale description',
            userId: 'user-1',
            metadata: { type: 'call', status: 'completed' }
          }
        ],
        notes: [],
        timestamp: Date.now() - 120000, // 2 minutes ago (stale)
        recordType: 'people',
        recordId: 'test-record-123'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(staleCacheData));

      // Mock API response for background refresh
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action-2',
            subject: 'Fresh Action',
            description: 'Fresh description',
            userId: 'user-1',
            completedAt: new Date().toISOString(),
            type: 'email',
            status: 'completed'
          }
        ]
      });

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should show stale data immediately
      await waitFor(() => {
        expect(screen.getByText('Stale Action')).toBeInTheDocument();
      });

      // Should NOT show loading skeleton
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

      // Should make background API call
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?personId=test-record-123');
      });

      // Should update with fresh data
      await waitFor(() => {
        expect(screen.getByText('Fresh Action')).toBeInTheDocument();
      });
    });
  });

  describe('API Call Optimization', () => {
    it('should only make one API call for person records', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledTimes(1);
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?personId=test-record-123');
      });

      // Should not call people or companies endpoints for person records
      expect(mockAuthFetch).not.toHaveBeenCalledWith('/api/v1/people?companyId=test-record-123');
      expect(mockAuthFetch).not.toHaveBeenCalledWith('/api/v1/companies?id=test-record-123');
    });

    it('should make multiple API calls for company records', async () => {
      const companyRecord = { ...mockRecord, id: 'company-123' };
      mockLocalStorage.getItem.mockReturnValue(null);
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UniversalActionsTab 
          record={companyRecord} 
          recordType="companies" 
        />
      );

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledTimes(2);
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?companyId=company-123');
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/people?companyId=company-123');
      });
    });
  });

  describe('Loading State Management', () => {
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

    it('should show error state with retry button on API failure', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockAuthFetch.mockRejectedValue(new Error('API Error'));

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load actions')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
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

  describe('Cache Management', () => {
    it('should use correct cache key format', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockAuthFetch.mockResolvedValue({ success: true, data: [] });

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('actions-test-record-123-people-v1');
      });
    });

    it('should cache data after successful API call', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action-1',
            subject: 'Test Action',
            description: 'Test description',
            userId: 'user-1',
            completedAt: new Date().toISOString(),
            type: 'call',
            status: 'completed'
          }
        ]
      });

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'actions-test-record-123-people-v1',
          expect.stringContaining('"activities"')
        );
      });
    });
  });
});

