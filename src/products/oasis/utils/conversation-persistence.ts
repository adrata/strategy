/**
 * Conversation Persistence Utility
 * 
 * Handles saving and restoring the last active conversation
 */

export interface LastConversation {
  conversationId: string;
  conversationType: 'channel' | 'dm' | 'external';
  conversationName: string;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = 'oasis-last-conversation';

/**
 * Save the last active conversation to localStorage
 */
export function saveLastConversation(
  workspaceId: string,
  conversationId: string,
  conversationType: 'channel' | 'dm' | 'external',
  conversationName: string
): void {
  if (typeof window === 'undefined') return;

  const lastConversation: LastConversation = {
    conversationId,
    conversationType,
    conversationName,
    timestamp: Date.now()
  };

  const storageKey = `${STORAGE_KEY_PREFIX}-${workspaceId}`;
  localStorage.setItem(storageKey, JSON.stringify(lastConversation));
  
  console.log('💾 [CONVERSATION PERSISTENCE] Saved last conversation:', lastConversation);
}

/**
 * Get the last active conversation from localStorage
 */
export function getLastConversation(workspaceId: string): LastConversation | null {
  if (typeof window === 'undefined') return null;

  const storageKey = `${STORAGE_KEY_PREFIX}-${workspaceId}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) return null;

  try {
    const lastConversation = JSON.parse(stored) as LastConversation;
    
    // Check if the conversation is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - lastConversation.timestamp > maxAge) {
      localStorage.removeItem(storageKey);
      return null;
    }
    
    console.log('📖 [CONVERSATION PERSISTENCE] Retrieved last conversation:', lastConversation);
    return lastConversation;
  } catch (error) {
    console.warn('Failed to parse last conversation from localStorage:', error);
    localStorage.removeItem(storageKey);
    return null;
  }
}

/**
 * Clear the last conversation for a workspace
 */
export function clearLastConversation(workspaceId: string): void {
  if (typeof window === 'undefined') return;

  const storageKey = `${STORAGE_KEY_PREFIX}-${workspaceId}`;
  localStorage.removeItem(storageKey);
  
  console.log('🗑️ [CONVERSATION PERSISTENCE] Cleared last conversation for workspace:', workspaceId);
}

/**
 * Generate a URL-friendly slug from conversation name
 */
export function generateConversationSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Build the full conversation URL
 */
export function buildConversationUrl(
  workspaceSlug: string,
  conversationId: string,
  conversationType: 'channel' | 'dm' | 'external',
  conversationName: string
): string {
  const slug = generateConversationSlug(conversationName);
  return `/${workspaceSlug}/oasis/${slug}-${conversationId}`;
}
