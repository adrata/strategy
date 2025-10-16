import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { UniversalActionsTab } from '@/frontend/components/pipeline/tabs/UniversalActionsTab';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';
import { authFetch } from '@/platform/api-fetch';

// Mock dependencies
jest.mock('@/platform/hooks/useWorkspaceUsers');
jest.mock('@/platform/api-fetch');

const mockUseWorkspaceUsers = useWorkspaceUsers as jest.MockedFunction<typeof useWorkspaceUsers>;
const mockAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

// Mock localStorage with realistic behavior
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Actions Tab Performance Integration Tests', () => {
  const mockRecord = {
    id: 'person-123',
    name: 'John Smith',
    type: 'person',
    workspaceId: 'workspace-123'
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

  describe('Full User Flow - Tab Switching', () => {
    it('should load instantly on second visit (cached data)', async () => {
      // First visit - no cache
      mockLocalStorage.getItem.mockReturnValue(null);
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action-1',
            subject: 'First Call',
            description: 'Initial call with client',
            userId: 'user-1',
            completedAt: new Date().toISOString(),
            type: 'call',
            status: 'completed'
          }
        ]
      });

      const { rerender } = render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // First visit should show loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for data to load and cache
      await waitFor(() => {
        expect(screen.getByText('First Call')).toBeInTheDocument();
      });

      // Simulate tab switch away and back
      rerender(<div>Other Tab Content</div>);
      
      // Mock cache for second visit
      const cachedData = {
        activities: [
          {
            id: 'action-1',
            type: 'activity',
            date: new Date().toISOString(),
            title: 'First Call',
            description: 'Initial call with client',
            userId: 'user-1',
            metadata: { type: 'call', status: 'completed' }
          }
        ],
        notes: [],
        timestamp: Date.now() - 30000, // Fresh cache
        recordType: 'people',
        recordId: 'person-123'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      // Second visit - should be instant
      rerender(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should show data immediately without loading
      expect(screen.getByText('First Call')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should handle record changes correctly', async () => {
      const record1 = { ...mockRecord, id: 'person-1' };
      const record2 = { ...mockRecord, id: 'person-2' };

      // Mock cache for person-1
      const cache1 = {
        activities: [
          {
            id: 'action-1',
            type: 'activity',
            date: new Date().toISOString(),
            title: 'Action for Person 1',
            description: 'Description 1',
            userId: 'user-1',
            metadata: { type: 'call', status: 'completed' }
          }
        ],
        notes: [],
        timestamp: Date.now() - 30000,
        recordType: 'people',
        recordId: 'person-1'
      };

      // Mock cache for person-2
      const cache2 = {
        activities: [
          {
            id: 'action-2',
            type: 'activity',
            date: new Date().toISOString(),
            title: 'Action for Person 2',
            description: 'Description 2',
            userId: 'user-1',
            metadata: { type: 'email', status: 'completed' }
          }
        ],
        notes: [],
        timestamp: Date.now() - 30000,
        recordType: 'people',
        recordId: 'person-2'
      };

      const { rerender } = render(
        <UniversalActionsTab 
          record={record1} 
          recordType="people" 
        />
      );

      // Mock cache for person-1
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cache1));

      await waitFor(() => {
        expect(screen.getByText('Action for Person 1')).toBeInTheDocument();
      });

      // Switch to person-2
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cache2));
      rerender(
        <UniversalActionsTab 
          record={record2} 
          recordType="people" 
        />
      );

      // Should show person-2 data immediately
      await waitFor(() => {
        expect(screen.getByText('Action for Person 2')).toBeInTheDocument();
      });

      // Should not show person-1 data
      expect(screen.queryByText('Action for Person 1')).not.toBeInTheDocument();
    });
  });

  describe('Background Refresh Behavior', () => {
    it('should show stale data immediately and update with fresh data', async () => {
      // Mock stale cache (2 minutes old)
      const staleCache = {
        activities: [
          {
            id: 'action-1',
            type: 'activity',
            date: new Date().toISOString(),
            title: 'Stale Action',
            description: 'This is stale data',
            userId: 'user-1',
            metadata: { type: 'call', status: 'completed' }
          }
        ],
        notes: [],
        timestamp: Date.now() - 120000, // 2 minutes old
        recordType: 'people',
        recordId: 'person-123'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(staleCache));

      // Mock fresh API response
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action-2',
            subject: 'Fresh Action',
            description: 'This is fresh data',
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

      // Should not show loading
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

      // Should make background API call
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?personId=person-123');
      });

      // Should update with fresh data
      await waitFor(() => {
        expect(screen.getByText('Fresh Action')).toBeInTheDocument();
      });

      // Stale data should be replaced
      expect(screen.queryByText('Stale Action')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle API errors gracefully and allow retry', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockAuthFetch.mockRejectedValue(new Error('Network error'));

      render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load actions')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Mock successful retry
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action-1',
            subject: 'Retry Action',
            description: 'Success after retry',
            userId: 'user-1',
            completedAt: new Date().toISOString(),
            type: 'call',
            status: 'completed'
          }
        ]
      });

      // Click retry button
      fireEvent.click(screen.getByText('Try Again'));

      // Should show loading during retry
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should show data after successful retry
      await waitFor(() => {
        expect(screen.getByText('Retry Action')).toBeInTheDocument();
      });
    });

    it('should handle corrupted cache gracefully', async () => {
      // Mock corrupted cache
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      // Mock successful API response
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'action-1',
            subject: 'Fresh Action',
            description: 'Data from API after cache corruption',
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

      // Should show loading (cache was invalid)
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should make API call
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith('/api/v1/actions?personId=person-123');
      });

      // Should show fresh data
      await waitFor(() => {
        expect(screen.getByText('Fresh Action')).toBeInTheDocument();
      });

      // Should have cleared corrupted cache
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('actions-person-123-people-v1');
    });
  });

  describe('Performance Metrics', () => {
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
        recordId: 'person-123'
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

    it('should handle concurrent requests properly', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Mock slow API response
      let resolveApiCall: (value: any) => void;
      const apiPromise = new Promise((resolve) => {
        resolveApiCall = resolve;
      });
      
      mockAuthFetch.mockReturnValue(apiPromise);

      const { rerender } = render(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Simulate rapid tab switches
      rerender(<div>Other Tab</div>);
      rerender(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );
      rerender(<div>Other Tab</div>);
      rerender(
        <UniversalActionsTab 
          record={mockRecord} 
          recordType="people" 
        />
      );

      // Should only make one API call despite multiple renders
      expect(mockAuthFetch).toHaveBeenCalledTimes(1);

      // Resolve the API call
      resolveApiCall!({
        success: true,
        data: [
          {
            id: 'action-1',
            subject: 'Concurrent Action',
            description: 'Handled concurrent requests',
            userId: 'user-1',
            completedAt: new Date().toISOString(),
            type: 'call',
            status: 'completed'
          }
        ]
      });

      await waitFor(() => {
        expect(screen.getByText('Concurrent Action')).toBeInTheDocument();
      });
    });
  });
});

