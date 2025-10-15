/**
 * Test Helpers for Conversation Tab Testing
 * 
 * Provides utilities for creating mock conversations, localStorage data, and API responses
 */

export interface MockConversation {
  id: string;
  title: string;
  messages: any[];
  lastActivity: Date;
  isActive: boolean;
  welcomeMessage?: string;
}

export interface MockApiResponse {
  success: boolean;
  data: {
    conversations: any[];
  };
}

/**
 * Creates a mock conversation object
 */
export function createMockConversation(overrides: Partial<MockConversation> = {}): MockConversation {
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Chat',
    messages: [],
    lastActivity: new Date(),
    isActive: false,
    ...overrides
  };
}

/**
 * Creates multiple mock conversations
 */
export function createMockConversations(count: number, overrides: Partial<MockConversation>[] = []): MockConversation[] {
  return Array.from({ length: count }, (_, index) => 
    createMockConversation({
      id: `conv-${index + 1}`,
      title: `Chat ${index + 1}`,
      isActive: index === 0,
      ...overrides[index]
    })
  );
}

/**
 * Creates localStorage data for conversations
 */
export function createLocalStorageConversations(conversations: MockConversation[]): string {
  return JSON.stringify(conversations.map(conv => ({
    ...conv,
    lastActivity: conv.lastActivity.toISOString(),
    messages: conv.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString()
    }))
  })));
}

/**
 * Creates localStorage data for deleted conversation IDs
 */
export function createLocalStorageDeletedConversations(deletedIds: string[]): string {
  return JSON.stringify(deletedIds);
}

/**
 * Creates a mock API response for conversations
 */
export function createMockApiResponse(conversations: MockConversation[]): MockApiResponse {
  return {
    success: true,
    data: {
      conversations: conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: conv.messages || [],
        lastActivity: conv.lastActivity.toISOString(),
        isActive: conv.isActive,
        welcomeMessage: conv.welcomeMessage
      }))
    }
  };
}

/**
 * Creates a mock fetch response for the conversations API
 */
export function createMockFetchResponse(conversations: MockConversation[]): Response {
  return {
    ok: true,
    json: async () => createMockApiResponse(conversations)
  } as Response;
}

/**
 * Creates a mock fetch response for conversation deletion
 */
export function createMockDeleteResponse(conversationId: string): Response {
  return {
    ok: true,
    json: async () => ({
      success: true,
      message: 'Conversation deleted successfully',
      conversationId
    })
  } as Response;
}

/**
 * Creates a mock fetch response for API errors
 */
export function createMockErrorResponse(error: string = 'API Error'): Response {
  return {
    ok: false,
    status: 500,
    json: async () => ({
      success: false,
      error
    })
  } as Response;
}

/**
 * Sets up localStorage mocks for conversation testing
 */
export function setupLocalStorageMocks(
  conversations: MockConversation[] = [],
  deletedIds: string[] = [],
  workspaceId: string = 'workspace-123'
) {
  const mockLocalStorage = {
    getItem: jest.fn((key: string) => {
      if (key === `adrata-conversations-${workspaceId}`) {
        return conversations.length > 0 ? createLocalStorageConversations(conversations) : null;
      }
      if (key === `adrata-deleted-conversations-${workspaceId}`) {
        return deletedIds.length > 0 ? createLocalStorageDeletedConversations(deletedIds) : null;
      }
      return null;
    }),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });

  return mockLocalStorage;
}

/**
 * Sets up fetch mocks for conversation API testing
 */
export function setupFetchMocks(
  conversations: MockConversation[] = [],
  deletedConversations: string[] = []
) {
  const mockFetch = jest.fn((url: string, options?: RequestInit) => {
    // Handle conversation sync
    if (url.includes('/api/v1/conversations?includeMessages=true')) {
      return Promise.resolve(createMockFetchResponse(conversations));
    }
    
    // Handle conversation deletion
    if (url.includes('/api/v1/conversations/') && options?.method === 'DELETE') {
      const conversationId = url.split('/').pop();
      if (conversationId && deletedConversations.includes(conversationId)) {
        return Promise.resolve(createMockDeleteResponse(conversationId));
      }
      return Promise.reject(new Error('Conversation not found'));
    }
    
    // Handle conversation creation
    if (url.includes('/api/v1/conversations') && options?.method === 'POST') {
      const newConv = createMockConversation({ id: `new-conv-${Date.now()}` });
      return Promise.resolve(createMockFetchResponse([newConv]));
    }
    
    return Promise.reject(new Error('Unexpected API call'));
  });

  global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;
  return mockFetch;
}

/**
 * Waits for a conversation tab to appear in the DOM
 */
export async function waitForConversationTab(
  page: any,
  conversationId: string,
  timeout: number = 5000
) {
  return page.waitForSelector(`[data-testid="conversation-tab-${conversationId}"]`, { timeout });
}

/**
 * Waits for a conversation tab to disappear from the DOM
 */
export async function waitForConversationTabToDisappear(
  page: any,
  conversationId: string,
  timeout: number = 5000
) {
  return page.waitForSelector(`[data-testid="conversation-tab-${conversationId}"]`, { 
    state: 'detached',
    timeout 
  });
}

/**
 * Simulates closing a conversation tab
 */
export async function closeConversationTab(page: any, conversationId: string) {
  // Hover over the tab to show the close button
  await page.hover(`[data-testid="conversation-tab-${conversationId}"]`);
  
  // Click the close button
  await page.click(`[data-testid="close-tab-${conversationId}"]`);
}

/**
 * Simulates creating a new conversation
 */
export async function createNewConversation(page: any) {
  await page.click('[data-testid="new-conversation-button"]');
}

/**
 * Simulates switching to a conversation
 */
export async function switchToConversation(page: any, conversationId: string) {
  await page.click(`[data-testid="conversation-tab-${conversationId}"]`);
}

/**
 * Verifies that a conversation tab is visible
 */
export async function expectConversationTabVisible(page: any, conversationId: string) {
  const tab = page.locator(`[data-testid="conversation-tab-${conversationId}"]`);
  await expect(tab).toBeVisible();
}

/**
 * Verifies that a conversation tab is not visible
 */
export async function expectConversationTabNotVisible(page: any, conversationId: string) {
  const tab = page.locator(`[data-testid="conversation-tab-${conversationId}"]`);
  await expect(tab).not.toBeVisible();
}

/**
 * Verifies that a conversation tab is active
 */
export async function expectConversationTabActive(page: any, conversationId: string) {
  const tab = page.locator(`[data-testid="conversation-tab-${conversationId}"]`);
  await expect(tab).toHaveClass(/active/);
}

/**
 * Verifies the number of conversation tabs
 */
export async function expectConversationTabCount(page: any, count: number) {
  const tabs = page.locator('[data-testid^="conversation-tab-"]');
  await expect(tabs).toHaveCount(count);
}

/**
 * Test data factory for common conversation scenarios
 */
export const ConversationTestData = {
  /**
   * Creates a scenario with multiple conversations where one is active
   */
  multipleConversations: () => createMockConversations(3, [
    { isActive: true, title: 'Active Chat' },
    { isActive: false, title: 'Inactive Chat 1' },
    { isActive: false, title: 'Inactive Chat 2' }
  ]),

  /**
   * Creates a scenario with a single conversation
   */
  singleConversation: () => createMockConversations(1, [
    { isActive: true, title: 'Main Chat' }
  ]),

  /**
   * Creates a scenario with conversations that have messages
   */
  conversationsWithMessages: () => createMockConversations(2, [
    {
      isActive: true,
      title: 'Chat with Messages',
      messages: [
        { id: 'msg-1', type: 'user', content: 'Hello', timestamp: new Date() },
        { id: 'msg-2', type: 'assistant', content: 'Hi there!', timestamp: new Date() }
      ]
    },
    {
      isActive: false,
      title: 'Empty Chat',
      messages: []
    }
  ]),

  /**
   * Creates a scenario with deleted conversations
   */
  withDeletedConversations: () => ({
    conversations: createMockConversations(2, [
      { isActive: true, title: 'Remaining Chat' },
      { isActive: false, title: 'Another Chat' }
    ]),
    deletedIds: ['conv-deleted-1', 'conv-deleted-2']
  })
};
