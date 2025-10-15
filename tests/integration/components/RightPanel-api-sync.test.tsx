/**
 * Integration Tests for RightPanel API Sync and Conversation Management
 * 
 * Tests the integration between localStorage, API sync, and conversation state management
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RightPanel } from '@/platform/ui/components/chat/RightPanel';

// Mock all the dependencies
jest.mock('@/platform/ui/context/AcquisitionOSProvider', () => ({
  useAcquisitionOS: () => ({
    ui: {
      toggleRightPanel: jest.fn(),
      activeSubApp: 'Speedrun'
    },
    chat: {}
  })
}));

jest.mock('@/platform/ui/context/RecordContextProvider', () => ({
  useRecordContext: () => ({
    currentRecord: null,
    recordType: null,
    listViewContext: null
  })
}));

jest.mock('@/platform/auth', () => ({
  useUnifiedAuth: () => ({
    user: {
      id: 'user-123',
      activeWorkspaceId: 'workspace-123',
      workspaces: [{ id: 'workspace-123' }]
    }
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}));

// Mock the modular components
jest.mock('@/platform/ui/components/chat/ConversationHeader', () => ({
  ConversationHeader: ({ conversations, onCloseConversation, onSwitchConversation }: any) => (
    <div data-testid="conversation-header">
      {conversations.map((conv: any) => (
        <div key={conv.id} data-testid={`conversation-tab-${conv.id}`}>
          <span>{conv.title}</span>
          {conversations.length > 1 && (
            <button
              data-testid={`close-tab-${conv.id}`}
              onClick={() => onCloseConversation(conv.id)}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}));

jest.mock('@/platform/ui/components/chat/ChatInput', () => ({
  ChatInput: () => <div data-testid="chat-input">Chat Input</div>
}));

jest.mock('@/platform/ui/components/chat/MessageList', () => ({
  MessageList: () => <div data-testid="message-list">Message List</div>
}));

jest.mock('@/platform/ui/components/chat/WelcomeSection', () => ({
  WelcomeSection: () => <div data-testid="welcome-section">Welcome Section</div>
}));

jest.mock('@/platform/ui/components/chat/AIActionsView', () => ({
  AIActionsView: () => <div data-testid="ai-actions-view">AI Actions View</div>
}));

jest.mock('@/platform/ui/components/chat/TeamWinsView', () => ({
  TeamWinsView: () => <div data-testid="team-wins-view">Team Wins View</div>
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

// Mock fetch
global.fetch = jest.fn();

describe('RightPanel API Sync Integration', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
  });

  describe('API Sync with Local Deletions', () => {
    it('should sync conversations from API while respecting local deletions', async () => {
      // Mock localStorage to return initial conversations and deleted IDs
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return JSON.stringify([
            {
              id: 'conv-1',
              title: 'Local Chat 1',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: true
            }
          ]);
        }
        if (key === 'adrata-deleted-conversations-workspace-123') {
          return JSON.stringify(['conv-2']);
        }
        return null;
      });

      // Mock API sync to return conversations including deleted one
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            conversations: [
              {
                id: 'conv-1',
                title: 'API Chat 1',
                messages: [],
                lastActivity: new Date().toISOString(),
                isActive: false
              },
              {
                id: 'conv-2',
                title: 'API Chat 2 (Should be filtered)',
                messages: [],
                lastActivity: new Date().toISOString(),
                isActive: false
              },
              {
                id: 'conv-3',
                title: 'API Chat 3',
                messages: [],
                lastActivity: new Date().toISOString(),
                isActive: true
              }
            ]
          }
        })
      } as Response);

      render(<RightPanel />);

      await waitFor(() => {
        // conv-1 should be present (from API, not deleted locally)
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
        // conv-2 should NOT be present (deleted locally)
        expect(screen.queryByTestId('conversation-tab-conv-2')).not.toBeInTheDocument();
        // conv-3 should be present (from API, not deleted locally)
        expect(screen.getByTestId('conversation-tab-conv-3')).toBeInTheDocument();
      });

      // Verify API sync was called
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/conversations?includeMessages=true');
    });

    it('should merge local-only conversations with API conversations', async () => {
      // Mock localStorage to return local conversations
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return JSON.stringify([
            {
              id: 'local-conv-1',
              title: 'Local Only Chat',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: true
            }
          ]);
        }
        return null;
      });

      // Mock API sync to return different conversations
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            conversations: [
              {
                id: 'api-conv-1',
                title: 'API Chat',
                messages: [],
                lastActivity: new Date().toISOString(),
                isActive: false
              }
            ]
          }
        })
      } as Response);

      render(<RightPanel />);

      await waitFor(() => {
        // Both local and API conversations should be present
        expect(screen.getByTestId('conversation-tab-local-conv-1')).toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-api-conv-1')).toBeInTheDocument();
      });
    });

    it('should handle API sync errors and fall back to localStorage', async () => {
      // Mock localStorage to return conversations
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return JSON.stringify([
            {
              id: 'local-conv-1',
              title: 'Local Chat',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: true
            }
          ]);
        }
        return null;
      });

      // Mock API sync to fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<RightPanel />);

      await waitFor(() => {
        // Should still show local conversations
        expect(screen.getByTestId('conversation-tab-local-conv-1')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Deletion API Integration', () => {
    it('should call DELETE API when closing a conversation', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage to return conversations
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return JSON.stringify([
            {
              id: 'conv-1',
              title: 'Chat 1',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: true
            },
            {
              id: 'conv-2',
              title: 'Chat 2',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: false
            }
          ]);
        }
        return null;
      });

      // Mock successful API responses
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/v1/conversations?includeMessages=true')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { conversations: [] } })
          } as Response);
        }
        if (url.includes('/api/v1/conversations/conv-1') && url.includes('DELETE')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, message: 'Conversation deleted successfully' })
          } as Response);
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      render(<RightPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
      });

      // Close a conversation
      const closeButton = screen.getByTestId('close-tab-conv-1');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('conversation-tab-conv-1')).not.toBeInTheDocument();
      });

      // Verify DELETE API was called
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-1',
        { method: 'DELETE' }
      );
    });

    it('should handle DELETE API failures gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage to return conversations
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return JSON.stringify([
            {
              id: 'conv-1',
              title: 'Chat 1',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: true
            },
            {
              id: 'conv-2',
              title: 'Chat 2',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: false
            }
          ]);
        }
        return null;
      });

      // Mock API responses - sync succeeds but delete fails
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/v1/conversations?includeMessages=true')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { conversations: [] } })
          } as Response);
        }
        if (url.includes('/api/v1/conversations/conv-1') && url.includes('DELETE')) {
          return Promise.reject(new Error('Delete failed'));
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      render(<RightPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
      });

      // Close a conversation (API delete will fail)
      const closeButton = screen.getByTestId('close-tab-conv-1');
      await user.click(closeButton);

      await waitFor(() => {
        // Conversation should still be removed from UI despite API failure
        expect(screen.queryByTestId('conversation-tab-conv-1')).not.toBeInTheDocument();
      });

      // Verify DELETE API was attempted
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-1',
        { method: 'DELETE' }
      );
    });
  });

  describe('Periodic Sync Behavior', () => {
    it('should sync conversations periodically', async () => {
      // Mock localStorage
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock API sync
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            conversations: [
              {
                id: 'conv-1',
                title: 'Periodic Chat',
                messages: [],
                lastActivity: new Date().toISOString(),
                isActive: true
              }
            ]
          }
        })
      } as Response);

      render(<RightPanel />);

      // Wait for initial sync
      await waitFor(() => {
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
      });

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/conversations?includeMessages=true');
    });

    it('should not sync when already syncing', async () => {
      // Mock localStorage
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock slow API sync
      let resolveSync: (value: any) => void;
      const syncPromise = new Promise((resolve) => {
        resolveSync = resolve;
      });

      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/v1/conversations?includeMessages=true')) {
          return syncPromise.then(() => ({
            ok: true,
            json: async () => ({ success: true, data: { conversations: [] } })
          } as Response));
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      render(<RightPanel />);

      // Trigger multiple syncs while first is still pending
      act(() => {
        // Simulate multiple rapid sync triggers
        jest.advanceTimersByTime(1000);
        jest.advanceTimersByTime(1000);
        jest.advanceTimersByTime(1000);
      });

      // Resolve the first sync
      resolveSync!({});

      await waitFor(() => {
        // Should only have been called once despite multiple triggers
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Workspace Isolation', () => {
    it('should maintain separate conversation state for different workspaces', () => {
      // Mock localStorage to return workspace-specific data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return JSON.stringify([
            {
              id: 'workspace-123-conv',
              title: 'Workspace 123 Chat',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: true
            }
          ]);
        }
        if (key === 'adrata-deleted-conversations-workspace-123') {
          return JSON.stringify(['deleted-workspace-123-conv']);
        }
        return null;
      });

      render(<RightPanel />);

      // Verify workspace-specific storage keys were used
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('adrata-conversations-workspace-123');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('adrata-deleted-conversations-workspace-123');
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state during rapid operations', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage to return multiple conversations
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return JSON.stringify([
            {
              id: 'conv-1',
              title: 'Chat 1',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: true
            },
            {
              id: 'conv-2',
              title: 'Chat 2',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: false
            },
            {
              id: 'conv-3',
              title: 'Chat 3',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: false
            }
          ]);
        }
        return null;
      });

      // Mock API responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { conversations: [] } })
      } as Response);

      render(<RightPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-2')).toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-3')).toBeInTheDocument();
      });

      // Perform rapid operations
      const closeButton1 = screen.getByTestId('close-tab-conv-1');
      const closeButton2 = screen.getByTestId('close-tab-conv-2');
      
      await user.click(closeButton1);
      await user.click(closeButton2);

      await waitFor(() => {
        // State should be consistent - only conv-3 should remain
        expect(screen.queryByTestId('conversation-tab-conv-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('conversation-tab-conv-2')).not.toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-3')).toBeInTheDocument();
      });

      // Verify localStorage was updated correctly
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'adrata-deleted-conversations-workspace-123',
        expect.stringContaining('conv-1')
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'adrata-deleted-conversations-workspace-123',
        expect.stringContaining('conv-2')
      );
    });
  });
});
