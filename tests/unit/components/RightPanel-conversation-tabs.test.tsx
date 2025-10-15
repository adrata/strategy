/**
 * Unit Tests for RightPanel Conversation Tab Management
 * 
 * Tests the conversation tab closing functionality and state management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

describe('RightPanel Conversation Tab Management', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    
    // Mock successful API responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { conversations: [] } })
    } as Response);
  });

  describe('Conversation Tab Closing', () => {
    it('should close a conversation tab when close button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage to return initial conversations
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

      render(<RightPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-2')).toBeInTheDocument();
      });

      // Click close button on first conversation
      const closeButton = screen.getByTestId('close-tab-conv-1');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('conversation-tab-conv-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-2')).toBeInTheDocument();
      });

      // Verify API delete was called
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-1',
        { method: 'DELETE' }
      );
    });

    it('should not allow closing the last remaining conversation', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage to return single conversation
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return JSON.stringify([
            {
              id: 'conv-1',
              title: 'Chat 1',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: true
            }
          ]);
        }
        return null;
      });

      render(<RightPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
      });

      // Should not show close button for single conversation
      expect(screen.queryByTestId('close-tab-conv-1')).not.toBeInTheDocument();
    });

    it('should switch to another conversation when closing the active one', async () => {
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

      render(<RightPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-2')).toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-3')).toBeInTheDocument();
      });

      // Close the active conversation (conv-1)
      const closeButton = screen.getByTestId('close-tab-conv-1');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('conversation-tab-conv-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-2')).toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-3')).toBeInTheDocument();
      });

      // Verify API delete was called
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-1',
        { method: 'DELETE' }
      );
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save deleted conversation IDs to localStorage', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage to return initial conversations
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

      render(<RightPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
      });

      // Close a conversation
      const closeButton = screen.getByTestId('close-tab-conv-1');
      await user.click(closeButton);

      await waitFor(() => {
        // Verify deleted conversation ID was saved to localStorage
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'adrata-deleted-conversations-workspace-123',
          JSON.stringify(['conv-1'])
        );
      });
    });

    it('should load deleted conversation IDs from localStorage on mount', () => {
      // Mock localStorage to return deleted conversation IDs
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-deleted-conversations-workspace-123') {
          return JSON.stringify(['conv-1', 'conv-2']);
        }
        return null;
      });

      render(<RightPanel />);

      // Verify deleted conversation IDs were loaded
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'adrata-deleted-conversations-workspace-123'
      );
    });
  });

  describe('API Sync Integration', () => {
    it('should not re-add conversations that were deleted locally during API sync', async () => {
      // Mock localStorage to return initial conversations (without the deleted one)
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return JSON.stringify([
            {
              id: 'conv-2',
              title: 'Chat 2',
              messages: [],
              lastActivity: new Date().toISOString(),
              isActive: true
            }
          ]);
        }
        if (key === 'adrata-deleted-conversations-workspace-123') {
          return JSON.stringify(['conv-1']);
        }
        return null;
      });

      // Mock API sync to return conversations including the deleted one
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            conversations: [
              {
                id: 'conv-1',
                title: 'Chat 1 (Should be filtered)',
                messages: [],
                lastActivity: new Date().toISOString(),
                isActive: false
              },
              {
                id: 'conv-2',
                title: 'Chat 2',
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
        // conv-1 should not be present because it was deleted locally
        expect(screen.queryByTestId('conversation-tab-conv-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-2')).toBeInTheDocument();
      });
    });

    it('should handle API sync errors gracefully', async () => {
      // Mock API sync to fail
      mockFetch.mockRejectedValue(new Error('API Error'));

      render(<RightPanel />);

      // Should not crash and should show default conversation
      await waitFor(() => {
        expect(screen.getByTestId('conversation-header')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed localStorage data gracefully', () => {
      // Mock localStorage to return invalid JSON
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adrata-conversations-workspace-123') {
          return 'invalid-json';
        }
        return null;
      });

      // Should not crash
      expect(() => render(<RightPanel />)).not.toThrow();
    });

    it('should handle missing workspace ID gracefully', () => {
      // Mock useUnifiedAuth to return no workspace
      jest.doMock('@/platform/auth', () => ({
        useUnifiedAuth: () => ({
          user: {
            id: 'user-123',
            activeWorkspaceId: null,
            workspaces: []
          }
        })
      }));

      // Should not crash
      expect(() => render(<RightPanel />)).not.toThrow();
    });

    it('should handle rapid consecutive tab closures', async () => {
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

      render(<RightPanel />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-tab-conv-1')).toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-2')).toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-3')).toBeInTheDocument();
      });

      // Rapidly close multiple conversations
      const closeButton1 = screen.getByTestId('close-tab-conv-1');
      const closeButton2 = screen.getByTestId('close-tab-conv-2');
      
      await user.click(closeButton1);
      await user.click(closeButton2);

      await waitFor(() => {
        expect(screen.queryByTestId('conversation-tab-conv-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('conversation-tab-conv-2')).not.toBeInTheDocument();
        expect(screen.getByTestId('conversation-tab-conv-3')).toBeInTheDocument();
      });

      // Verify both API delete calls were made
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-1',
        { method: 'DELETE' }
      );
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-2',
        { method: 'DELETE' }
      );
    });
  });
});
