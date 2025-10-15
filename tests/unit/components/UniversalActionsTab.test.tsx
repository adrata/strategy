/**
 * UniversalActionsTab Unit Tests
 * 
 * Tests the UniversalActionsTab component's rendering, data display, and behavior
 * Covers loading states, error handling, event expansion, and cache behavior
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UniversalActionsTab } from '@/frontend/components/pipeline/tabs/UniversalActionsTab';

// Mock the auth fetch function
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

// Mock workspace users hook
jest.mock('@/platform/hooks/useWorkspaceUsers', () => ({
  useWorkspaceUsers: () => ({
    users: [
      { id: 'user1', name: 'Test User', fullName: 'Test User' },
      { id: 'user2', name: 'Another User', fullName: 'Another User' }
    ]
  })
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

describe('UniversalActionsTab Unit Tests', () => {
  const mockAuthFetch = require('@/platform/api-fetch').authFetch as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Basic Rendering', () => {
    test('should render with no record', () => {
      render(
        <UniversalActionsTab
          record={null}
          recordType="companies"
        />
      );

      expect(screen.getAllByText('Actions')[0]).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('No actions yet')).toBeInTheDocument();
    });

    test('should render with empty record', () => {
      render(
        <UniversalActionsTab
          record={{}}
          recordType="companies"
        />
      );

      expect(screen.getAllByText('Actions')[0]).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('should render with record but no ID', () => {
      render(
        <UniversalActionsTab
          record={{ name: 'Test Company' }}
          recordType="companies"
        />
      );

      expect(screen.getAllByText('Actions')[0]).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Actions Data Display', () => {
    test('should display actions correctly', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      const mockActions = [
        {
          id: 'action1',
          subject: 'Test Call',
          description: 'Made a test call to discuss proposal',
          type: 'call',
          status: 'completed',
          priority: 'high',
          completedAt: '2024-01-15T10:00:00Z',
          userId: 'user1'
        },
        {
          id: 'action2',
          subject: 'Follow-up Email',
          description: 'Sent follow-up email with additional information',
          type: 'email',
          status: 'completed',
          priority: 'medium',
          completedAt: '2024-01-14T14:30:00Z',
          userId: 'user2'
        }
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockActions
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for actions to load
      await waitFor(() => {
        expect(screen.getByText('Test Call')).toBeInTheDocument();
      });

      // Verify action count badge
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Verify action details
      expect(screen.getByText('Test Call')).toBeInTheDocument();
      expect(screen.getByText('Made a test call to discuss proposal')).toBeInTheDocument();
      expect(screen.getByText('Follow-up Email')).toBeInTheDocument();
      expect(screen.getByText('Sent follow-up email with additional information')).toBeInTheDocument();

      // Verify timestamps are formatted
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    test('should display single action with correct singular text', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      const mockActions = [
        {
          id: 'action1',
          subject: 'Single Action',
          description: 'Only one action',
          type: 'call',
          status: 'completed',
          priority: 'high',
          completedAt: '2024-01-15T10:00:00Z',
          userId: 'user1'
        }
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockActions
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for action to load
      await waitFor(() => {
        expect(screen.getByText('Single Action')).toBeInTheDocument();
      });

      // Verify singular text
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    test('should format timestamps correctly', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      const mockActions = [
        {
          id: 'action1',
          subject: 'Recent Action',
          description: 'A recent action',
          type: 'call',
          status: 'completed',
          priority: 'high',
          completedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          userId: 'user1'
        }
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockActions
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for action to load
      await waitFor(() => {
        expect(screen.getByText('Recent Action')).toBeInTheDocument();
      });

      // Verify relative time formatting
      expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('should show loading state while fetching', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      
      // Mock a delayed response
      mockAuthFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            data: []
          }), 100)
        )
      );

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Initially should show 0 actions
      expect(screen.getByText('0')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    test('should handle API errors gracefully', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      mockAuthFetch.mockRejectedValue(new Error('API Error'));

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
      });

      // Should still show the component structure
      expect(screen.getAllByText('Actions')[0]).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('should handle invalid API response', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      mockAuthFetch.mockResolvedValue({
        success: false,
        error: 'Invalid response'
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
      });
    });
  });

  describe('Event Expansion', () => {
    test('should expand and collapse long content', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      const longDescription = 'This is a very long description that should be truncated initially and then expanded when the user clicks the expand button. '.repeat(3);
      
      const mockActions = [
        {
          id: 'action1',
          subject: 'Action with Long Content',
          description: longDescription,
          type: 'call',
          status: 'completed',
          priority: 'high',
          completedAt: '2024-01-15T10:00:00Z',
          userId: 'user1'
        }
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockActions
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for action to load
      await waitFor(() => {
        expect(screen.getByText('Action with Long Content')).toBeInTheDocument();
      });

      // Should show truncated description initially
      expect(screen.getByText(/This is a very long description that should be truncated/)).toBeInTheDocument();

      // Should show expand button
      const expandButton = screen.getByText('Show full content');
      expect(expandButton).toBeInTheDocument();

      // Click to expand
      await userEvent.click(expandButton);

      // Should show collapse button
      expect(screen.getByText('Show less')).toBeInTheDocument();

      // Click to collapse
      await userEvent.click(screen.getByText('Show less'));

      // Should show expand button again
      expect(screen.getByText('Show full content')).toBeInTheDocument();
    });

    test('should not show expand button for short content', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      const mockActions = [
        {
          id: 'action1',
          subject: 'Short Action',
          description: 'Short description',
          type: 'call',
          status: 'completed',
          priority: 'high',
          completedAt: '2024-01-15T10:00:00Z',
          userId: 'user1'
        }
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockActions
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for action to load
      await waitFor(() => {
        expect(screen.getByText('Short Action')).toBeInTheDocument();
      });

      // Should not show expand button
      expect(screen.queryByText('Show full content')).not.toBeInTheDocument();
    });
  });

  describe('Cache Behavior', () => {
    test('should use cached data when available', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      const cachedData = {
        activities: [
          {
            id: 'cached-action',
            subject: 'Cached Action',
            description: 'This action is from cache',
            type: 'call',
            status: 'completed',
            priority: 'high',
            completedAt: '2024-01-15T10:00:00Z',
            userId: 'user1'
          }
        ],
        notes: [],
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for cached data to load
      await waitFor(() => {
        expect(screen.getByText('Cached Action')).toBeInTheDocument();
      });

      // Should not make API call if cache is valid
      expect(mockAuthFetch).not.toHaveBeenCalled();
    });

    test('should fetch fresh data when cache is stale', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      const staleCache = {
        activities: [],
        notes: [],
        timestamp: Date.now() - 200000 // 200 seconds ago (stale)
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(staleCache));
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'fresh-action',
            subject: 'Fresh Action',
            description: 'This is fresh data',
            type: 'call',
            status: 'completed',
            priority: 'high',
            completedAt: '2024-01-15T10:00:00Z',
            userId: 'user1'
          }
        ]
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for fresh data to load
      await waitFor(() => {
        expect(screen.getByText('Fresh Action')).toBeInTheDocument();
      });

      // Should make API call for fresh data
      expect(mockAuthFetch).toHaveBeenCalled();
    });

    test('should write to cache after successful API call', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      const mockActions = [
        {
          id: 'action1',
          subject: 'Test Action',
          description: 'Test description',
          type: 'call',
          status: 'completed',
          priority: 'high',
          completedAt: '2024-01-15T10:00:00Z',
          userId: 'user1'
        }
      ];

      mockAuthFetch.mockResolvedValue({
        success: true,
        data: mockActions
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test Action')).toBeInTheDocument();
      });

      // Should write to cache
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'actions-company1',
        expect.stringContaining('Test Action')
      );
    });
  });

  describe('Record Type Handling', () => {
    test('should use personId for people record type', async () => {
      const testRecord = { id: 'person1', name: 'Test Person' };
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="people"
        />
      );

      // Wait for API call
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalled();
      });

      // Should use personId in query
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('personId=person1')
      );
    });

    test('should use companyId for companies record type', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for API call
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalled();
      });

      // Should use companyId in query
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('companyId=company1')
      );
    });

    test('should use both personId and companyId for other record types', async () => {
      const testRecord = { id: 'lead1', name: 'Test Lead' };
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="leads"
        />
      );

      // Wait for API call
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalled();
      });

      // Should use both IDs in query
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('personId=lead1&companyId=lead1')
      );
    });
  });

  describe('Event Listeners', () => {
    test('should listen for actionCreated events', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
      });

      // Clear previous calls
      mockAuthFetch.mockClear();

      // Dispatch actionCreated event
      const event = new CustomEvent('actionCreated', {
        detail: {
          recordId: 'company1',
          recordType: 'companies',
          actionId: 'new-action'
        }
      });
      document.dispatchEvent(event);

      // Should trigger refresh
      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalled();
      });
    });

    test('should ignore actionCreated events for different records', async () => {
      const testRecord = { id: 'company1', name: 'Test Company' };
      mockAuthFetch.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <UniversalActionsTab
          record={testRecord}
          recordType="companies"
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('No actions yet')).toBeInTheDocument();
      });

      // Clear previous calls
      mockAuthFetch.mockClear();

      // Dispatch actionCreated event for different record
      const event = new CustomEvent('actionCreated', {
        detail: {
          recordId: 'company2',
          recordType: 'companies',
          actionId: 'new-action'
        }
      });
      document.dispatchEvent(event);

      // Should not trigger refresh
      await waitFor(() => {
        expect(mockAuthFetch).not.toHaveBeenCalled();
      });
    });
  });
});
