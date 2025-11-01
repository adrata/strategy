"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useRecordContext } from "@/platform/ui/context/RecordContextProvider";
import { useUnifiedAuth } from "@/platform/auth";
import { QUICK_ACTIONS } from "@/platform/config";
import { ChatQueueManager } from "@/platform/ui/components/chat/ChatQueueManager";
import { AI_MODELS, type AIModel } from '@/platform/ui/components/chat/AIModelSelector';
import { RecordUpdateService } from '@/platform/services/record-update-service';
import { CoreSignalChatHandler } from '@/platform/ui/components/chat/CoreSignalChatHandler';
import { useRouter, usePathname } from 'next/navigation';

// Import modular components
import { ConversationHeader } from '@/platform/ui/components/chat/ConversationHeader';
import { ChatInput } from '@/platform/ui/components/chat/ChatInput';
import { MessageList } from '@/platform/ui/components/chat/MessageList';
import { WelcomeSection } from '@/platform/ui/components/chat/WelcomeSection';

// Types
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTypewriter?: boolean;
  hasTodos?: boolean;
  todos?: Array<{
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  }>;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  browserResults?: any[];
  isBrowsing?: boolean;
  routingInfo?: {
    complexity: number;
    selectedModel: string;
    fallbackUsed: boolean;
    failoverChain: string[];
  };
  cost?: number;
  model?: string;
  provider?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastActivity: Date;
  isActive: boolean;
  welcomeMessage?: string;
}

interface ContextFile {
  id: string;
  name: string;
  size?: number;
  data?: string;
  type?: string;
}

/**
 * Adrata Chat Panel - Middle Chat Interface
 * 
 * Full-width AI chat interface that shares the same conversations as RightPanel
 * Uses the same localStorage key and API endpoints for complete parity
 */
export function AdrataChatPanel() {
  const { ui, chat } = useRevenueOS();
  const router = useRouter();
  const pathname = usePathname();
  const { currentRecord, recordType, listViewContext } = useRecordContext();
  const { user } = useUnifiedAuth();

  // Get workspace and user info
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id;
  const userId = user?.id;

  // AI Model state with persistence
  const [selectedAIModel, setSelectedAIModel] = useState<AIModel>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('adrata-selected-ai-model');
        if (saved) {
          const parsed = JSON.parse(saved);
          const found = AI_MODELS.find(m => m['id'] === parsed.id);
          if (found) return found;
        }
      } catch (e) {
        console.warn('Failed to load saved AI model:', e);
      }
    }
    return AI_MODELS.find(m => m.provider === 'Adrata') || AI_MODELS[0] || { id: 'adrata-advanced', name: 'Adrata Advanced', provider: 'Adrata' };
  });

  const { activeSubApp } = ui;

  // Core state
  const [rightChatInput, setRightChatInput] = useState("");
  const [isPersonFinderMinimized, setIsPersonFinderMinimized] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(182);
  
  // Conversation management with hybrid persistence (localStorage + API)
  // Uses the SAME storage key as RightPanel
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== 'undefined' && workspaceId) {
      try {
        const storageKey = `adrata-conversations-${workspaceId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.map((conv: any) => ({
            ...conv,
            lastActivity: new Date(conv.lastActivity),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              isTypewriter: msg['isTypewriter'] === true ? false : undefined
            }))
          }));
        }
      } catch (error) {
        console.warn('Failed to load stored conversations:', error);
      }
    }
    return [
      {
        id: 'main-chat',
        title: 'Main Chat',
        messages: [],
        lastActivity: new Date(),
        isActive: true
      }
    ];
  });
  
  // Sync state for hybrid persistence
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeConversationId, setActiveConversationId] = useState('main-chat');
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  
  // Track if conversations have been initially loaded
  const conversationsLoadedRef = useRef(false);
  
  // Track locally deleted conversation IDs
  const [deletedConversationIds, setDeletedConversationIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined' && workspaceId) {
      try {
        const storageKey = `adrata-deleted-conversations-${workspaceId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load deleted conversation IDs:', error);
      }
    }
    return new Set();
  });

  // Context files state with persistence
  const [contextFiles, setContextFiles] = useState<ContextFile[]>(() => {
    if (typeof window !== 'undefined' && workspaceId) {
      try {
        const storageKey = `adrata-context-files-${workspaceId}`;
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.warn('Failed to load stored context files:', error);
        return [];
      }
    }
    return [];
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAddFilesPopup, setShowAddFilesPopup] = useState(false);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && conversations.length > 0 && workspaceId) {
      try {
        const storageKey = `adrata-conversations-${workspaceId}`;
        localStorage.setItem(storageKey, JSON.stringify(conversations));
        console.log('💾 [ADRATA] Saved conversations to localStorage:', conversations.length, 'for workspace:', workspaceId);
      } catch (error) {
        console.warn('Failed to save conversations to localStorage:', error);
      }
    }
  }, [conversations, workspaceId]);

  // Save deleted conversation IDs to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && workspaceId) {
      try {
        const storageKey = `adrata-deleted-conversations-${workspaceId}`;
        localStorage.setItem(storageKey, JSON.stringify(Array.from(deletedConversationIds)));
      } catch (error) {
        console.warn('Failed to save deleted conversation IDs:', error);
      }
    }
  }, [deletedConversationIds, workspaceId]);

  // Load conversations from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && workspaceId && !conversationsLoadedRef.current) {
      try {
        const storageKey = `adrata-conversations-${workspaceId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const filteredConversations = parsed.filter((conv: any) => !deletedConversationIds.has(conv.id));
          const restoredConversations = filteredConversations.map((conv: any) => ({
            ...conv,
            lastActivity: new Date(conv.lastActivity),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              isTypewriter: msg['isTypewriter'] === true ? false : undefined
            }))
          }));
          setConversations(restoredConversations);
          console.log('📂 [ADRATA] Loaded conversations from localStorage:', restoredConversations.length);
          conversationsLoadedRef.current = true;
        }
      } catch (error) {
        console.warn('Failed to load stored conversations:', error);
      }
    }
  }, [workspaceId]);

  // API sync functions - same as RightPanel
  const syncConversationsFromAPI = async () => {
    if (!workspaceId || !userId || isSyncing) return;
    
    setIsSyncing(true);
    try {
      console.log('🔄 [ADRATA] Syncing conversations from API...');
      const response = await fetch('/api/v1/conversations?includeMessages=true');
      const result = await response.json();
      
      if (result.success && result.data.conversations) {
        const apiConversations = result.data.conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          messages: conv.messages || [],
          lastActivity: new Date(conv.lastActivity),
          isActive: conv.isActive,
          welcomeMessage: conv.welcomeMessage
        }));
        
        setConversations(prevConversations => {
          const merged = apiConversations.filter(
            apiConv => !deletedConversationIds.has(apiConv.id)
          );
          
          prevConversations.forEach(localConv => {
            if (!merged.find(apiConv => apiConv.id === localConv.id) && 
                !deletedConversationIds.has(localConv.id)) {
              merged.push(localConv);
            }
          });
          
          return merged.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        });
        
        setLastSyncTime(new Date());
        console.log('✅ [ADRATA] Synced conversations from API:', apiConversations.length);
      }
    } catch (error) {
      console.warn('⚠️ [ADRATA] Failed to sync conversations from API:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveConversationToAPI = async (conversation: Conversation) => {
    if (!workspaceId || !userId) return;
    
    try {
      const response = await fetch('/api/v1/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: conversation.title,
          welcomeMessage: conversation.welcomeMessage,
          metadata: { source: 'adrata' }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ [ADRATA] Saved conversation to API:', result.data.conversation.id);
        return result.data.conversation.id;
      }
    } catch (error) {
      console.warn('⚠️ [ADRATA] Failed to save conversation to API:', error);
    }
    return null;
  };

  const saveMessageToAPI = async (conversationId: string, message: ChatMessage) => {
    if (!workspaceId || !userId) return;
    
    try {
      const response = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: message.type,
          content: message.content,
          metadata: {
            isTypewriter: message.isTypewriter,
            hasTodos: message.hasTodos,
            todos: message.todos,
            sources: message.sources,
            browserResults: message.browserResults,
            isBrowsing: message.isBrowsing,
            routingInfo: message.routingInfo,
            cost: message.cost,
            provider: message.provider
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ [ADRATA] Saved message to API:', result.data.message.id);
        return result.data.message.id;
      }
    } catch (error) {
      console.warn('⚠️ [ADRATA] Failed to save message to API:', error);
    }
    return null;
  };

  const deleteConversationFromAPI = async (conversationId: string) => {
    if (!workspaceId || !userId) return;
    
    try {
      const response = await fetch(`/api/v1/conversations/${conversationId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ [ADRATA] Deleted conversation from API:', conversationId);
      }
    } catch (error) {
      console.warn('⚠️ [ADRATA] Failed to delete conversation from API:', error);
    }
  };

  // Sync from API on mount and periodically
  useEffect(() => {
    if (workspaceId && userId) {
      const timer = setTimeout(() => {
        syncConversationsFromAPI();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [workspaceId, userId]);

  // Periodic sync every 30 seconds
  useEffect(() => {
    if (!workspaceId || !userId) return;
    
    const interval = setInterval(() => {
      syncConversationsFromAPI();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [workspaceId, userId]);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEnterHandledRef = useRef(false);
  const menuPopupRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<HTMLDivElement>(null);
  const addFilesPopupRef = useRef<HTMLDivElement>(null);

  // Generate contextual quick actions
  const generateContextualActions = (record: any, recordType: string): string[] => {
    if (!record) {
      return QUICK_ACTIONS[activeSubApp] || QUICK_ACTIONS["Speedrun"] || [];
    }
    
    const actions: string[] = [];
    const name = record.fullName || record.name || 'this prospect';
    const company = record.company || record.companyName || record.name || 'their company';
    const title = record.title || record.jobTitle || 'their role';
    const status = record.status?.toLowerCase() || 'new';
    
    switch (recordType) {
      case 'leads':
        actions.push(`What should I know about ${name} before calling?`);
        actions.push(`Find ${company}'s biggest challenges right now`);
        actions.push(`Create me a deep value report for ${name}`);
        break;
      case 'prospects':
        actions.push(`What's ${name}'s decision-making process at ${company}?`);
        actions.push(`Find ${company}'s budget and timeline for solutions`);
        actions.push(`Create me a deep value report for ${name}`);
        break;
      case 'opportunities':
        actions.push(`What's the status of the ${company} opportunity?`);
        actions.push(`Who are the key stakeholders at ${company}?`);
        actions.push(`How do I close this deal with ${name}?`);
        break;
      default:
        actions.push(`What should I know about ${name} before calling?`);
        actions.push(`Find ${company}'s biggest challenges right now`);
        actions.push(`Research ${name}'s background and role`);
    }
    
    return actions.slice(0, 4);
  };

  const quickActions = generateContextualActions(currentRecord, recordType || '');

  // Helper functions
  const getActiveConversation = () => {
    return conversations.find(c => c['id'] === activeConversationId) || conversations[0];
  };

  const activeConversation = getActiveConversation();
  const chatMessages = activeConversation?.messages || [];

  const createNewConversation = async () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: `Chat ${conversations.length + 1}`,
      messages: [],
      lastActivity: new Date(),
      isActive: true
    };
    
    const activeIndex = conversations.findIndex(c => c.isActive);
    const insertIndex = activeIndex >= 0 ? activeIndex + 1 : conversations.length;
    
    setConversations(prev => {
      const updated = prev.map(c => ({ ...c, isActive: false }));
      updated.splice(insertIndex, 0, newConv);
      return updated;
    });
    setActiveConversationId(newConv.id);
    
    try {
      const apiId = await saveConversationToAPI(newConv);
      if (apiId) {
        setConversations(prev => prev.map(conv => 
          conv.id === newConv.id ? { ...conv, id: apiId } : conv
        ));
        setActiveConversationId(apiId);
      }
    } catch (error) {
      console.warn('Failed to save new conversation to API:', error);
    }
  };

  const switchToConversation = (conversationId: string) => {
    if (activeConversationId === conversationId) return;
    
    setConversations(prev => prev.map(c => ({
      ...c,
      isActive: c['id'] === conversationId
    })));
    setActiveConversationId(conversationId);
    setShowConversationHistory(false);
    setRightChatInput('');
  };

  const closeConversation = (conversationId: string) => {
    setConversations(prev => {
      if (prev.length <= 1) return prev;
      
      const filtered = prev.filter(c => c.id !== conversationId);
      const closedConv = prev.find(c => c.id === conversationId);
      
      if (closedConv?.isActive && filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
      }
      
      return filtered;
    });
    
    setDeletedConversationIds(prev => new Set([...Array.from(prev), conversationId]));
    deleteConversationFromAPI(conversationId);
  };

  const handleReorderConversations = (newOrder: Conversation[]) => {
    setConversations(newOrder);
  };

  const getWelcomeMessage = (app: string): string => {
    const activeConv = getActiveConversation();
    if (activeConv?.welcomeMessage && activeConv['messages']['length'] === 0) {
      return activeConv.welcomeMessage;
    }

    if (currentRecord && recordType) {
      const recordName = currentRecord.name || currentRecord.fullName || 
                        (currentRecord['firstName'] && currentRecord.lastName ? `${currentRecord.firstName} ${currentRecord.lastName}` : '') ||
                        currentRecord.companyName || 'this record';
      
      const company = currentRecord.company || currentRecord.companyName || (recordType === 'companies' ? currentRecord.name : 'their company');
      const title = currentRecord.title || currentRecord.jobTitle || 'their role';
      const status = currentRecord.status || 'new';
      const priority = currentRecord.priority || 'medium';
      
      // Generate more natural, conversational welcome messages based on record type and data
      switch (recordType) {
        case 'leads':
          return `Hi! I can see you're looking at ${recordName} from ${company}. As a ${title}, they could be a great fit for your solution. What would you like to know about them or how can I help you move this forward?`;
        case 'prospects':
          return `I see you're working with ${recordName} at ${company}. They seem like a promising prospect in the ${title} role. What's your strategy for engaging with them?`;
        case 'opportunities':
          return `Great! You have an active opportunity with ${company}. ${recordName} (${title}) looks like they're ready to move forward. How can I help you close this deal?`;
        case 'companies':
          const employeeCount = currentRecord?.customFields?.coresignalData?.employees_count || currentRecord?.size || 'unknown';
          const industry = currentRecord?.industry || currentRecord?.customFields?.coresignalData?.categories_and_keywords?.[0] || 'business';
          return `Interesting company - ${company}. This looks like a ${industry} company with ${employeeCount} employees. What's your approach for building this relationship?`;
        case 'people':
          const article = title && /^[aeiouAEIOU]/.test(title.trim()) ? 'an' : 'a';
          return `I can see you're focused on ${recordName} at ${company}. As ${article} ${title}, they could be valuable for your business. What would you like to explore about this contact?`;
        default:
          return `I notice you're reviewing ${recordName} at ${company}. They look like they could be important for your sales efforts. How can I help you with this?`;
      }
    }

    // Get user's first name for personalization
    const getUserFirstName = () => {
      if (user?.name) {
        return user.name.split(' ')[0];
      }
      return null;
    };
    
    const firstName = getUserFirstName();
    const capitalizedFirstName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : null;
    const greeting = capitalizedFirstName ? `Hi, ${capitalizedFirstName}. I'm Adrata. What would you like to work on today?` : "Hi! I'm Adrata. What would you like to work on today?";

    if (activeConv?.id === 'main-chat') {
      const isPipelineContext = typeof window !== 'undefined' && (window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/leads') || window.location.pathname.includes('/opportunities') || window.location.pathname.includes('/companies') || window.location.pathname.includes('/people') || window.location.pathname.includes('/partners') || window.location.pathname.includes('/prospects') || window.location.pathname.includes('/sellers') || window.location.pathname.includes('/clients') || window.location.pathname.includes('/metrics') || window.location.pathname.includes('/speedrun'));
      
      switch (app) {
        case "Speedrun":
          return greeting;
        case "pipeline":
          return greeting;
        case "monaco":
          return greeting;
        default:
          return greeting;
      }
    }

    return activeConv?.welcomeMessage || greeting;
  };

  const handleQuickAction = (action: string) => {
    setRightChatInput(action);
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }, 100);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Process message with queue - same logic as RightPanel
  const processMessageWithQueue = async (input: string) => {
    if (isProcessing || !input.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'user',
        content: input,
        timestamp: new Date()
      };
      
      // Update UI immediately (optimistic update)
      setConversations(prev => prev.map(conv => 
        conv.isActive 
          ? { ...conv, messages: [...conv.messages, userMessage], lastActivity: new Date() }
          : conv
      ));
      
      // Save to API in background (will get updated conversation from state)
      const currentActiveConvId = activeConversationId;
      if (currentActiveConvId && currentActiveConvId !== 'main-chat') {
        saveMessageToAPI(currentActiveConvId, userMessage);
      }
      
      chat.setChatSessions(prev => ({
        ...prev,
        [activeSubApp]: [...(prev[activeSubApp] || []), userMessage]
      }));

      // Add typing indicator
      const typingMessage: ChatMessage = {
        id: `typing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: 'typing',
        timestamp: new Date()
      };
      
      setConversations(prev => prev.map(conv => 
        conv.isActive 
          ? { ...conv, messages: [...conv.messages, typingMessage] }
          : conv
      ));

      // Call AI API - same endpoint as RightPanel
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Request-ID': `adrata-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        body: JSON.stringify({
          message: input,
          appType: activeSubApp,
          workspaceId,
          userId,
          conversationHistory: chatMessages.filter(msg => msg.content !== 'typing' && msg.content !== 'browsing').slice(-5),
          currentRecord,
          recordType,
          listViewContext,
          enableVoiceResponse: false,
          selectedVoiceId: 'default',
          useOpenRouter: true,
          context: {
            currentUrl: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
            timestamp: new Date().toISOString(),
            sessionId: `adrata-session-${Date.now()}`
          },
          selectedModel: selectedAIModel.id
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      // Check if response is HTML (error page) instead of JSON
      if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html')) {
        throw new Error('Server returned an error page instead of JSON response');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }

      if (data.success) {
        // Handle todos and other metadata like RightPanel
        const assistantMessage: ChatMessage = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'assistant',
          content: data.response || data.message || 'I received your message.',
          timestamp: new Date(),
          isTypewriter: true,
          hasTodos: !!(data['todos'] && data.todos.length > 0),
          todos: data.todos || undefined,
          sources: data.sources || undefined,
          browserResults: data.browserResults || undefined,
          isBrowsing: data.metadata?.hasWebResearch || false,
          routingInfo: data.metadata?.routingInfo,
          cost: data.metadata?.cost,
          model: data.metadata?.model,
          provider: data.metadata?.provider
        };

        // Update UI - remove typing indicator and add assistant response
        setConversations(prev => prev.map(conv => 
          conv.isActive 
            ? {
                ...conv,
                messages: [
                  ...conv.messages.filter(msg => msg.content !== 'typing' && msg.content !== 'browsing'),
                  assistantMessage
                ],
                lastActivity: new Date()
              }
            : conv
        ));

        // Save to API in background
        const currentActiveConvId = activeConversationId;
        if (currentActiveConvId && currentActiveConvId !== 'main-chat') {
          saveMessageToAPI(currentActiveConvId, assistantMessage);
        }

        chat.setChatSessions(prev => {
          const currentMessages = prev[activeSubApp] || [];
          const withoutTyping = currentMessages.filter(msg => msg.content !== 'typing' && msg.content !== 'browsing');
          return {
            ...prev,
            [activeSubApp]: [...withoutTyping, assistantMessage]
          };
        });

        scrollToBottom();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('AI API call failed:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };

      // Update UI - remove typing indicator and show error
      setConversations(prev => prev.map(conv => 
        conv.isActive 
          ? {
              ...conv,
              messages: [
                ...conv.messages.filter(msg => msg.content !== 'typing' && msg.content !== 'browsing'),
                errorMessage
              ],
              lastActivity: new Date()
            }
          : conv
      ));
      
      // Save to API in background
      const currentActiveConvId = activeConversationId;
      if (currentActiveConvId && currentActiveConvId !== 'main-chat') {
        saveMessageToAPI(currentActiveConvId, errorMessage);
      }
    } finally {
      setIsProcessing(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rightChatInput.trim() || isProcessing) return;
    
    const message = rightChatInput.trim();
    setRightChatInput('');
    await processMessageWithQueue(message);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // File handling logic
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // File drop handling logic
  };

  const handleRecordSearch = (query: string) => {
    // Record search logic
  };

  return (
    <div className="bg-[var(--background)] flex flex-col h-full overflow-hidden">
      {/* Conversation Header */}
      <ConversationHeader
        conversations={conversations}
        activeConversationId={activeConversationId}
        showConversationHistory={showConversationHistory}
        showMenuPopup={showMenuPopup}
        onSwitchConversation={switchToConversation}
        onCreateNewConversation={createNewConversation}
        onToggleConversationHistory={() => setShowConversationHistory(!showConversationHistory)}
        onToggleMenuPopup={() => setShowMenuPopup(!showMenuPopup)}
        onCloseConversation={closeConversation}
        onSetViewMode={() => {}}
        onClosePanel={() => {}}
        onReorderConversations={handleReorderConversations}
        menuPopupRef={menuPopupRef}
        conversationHistoryRef={conversationHistoryRef}
        showChatIcon={false}
      />

      {/* Messages Area */}
      <div className="flex-1 px-6 py-0 overflow-y-auto ai-panel-scroll" style={{ 
        scrollBehavior: 'smooth',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <ChatQueueManager 
          onProcessNext={async (query) => {
            await processMessageWithQueue(query);
          }}
        />

        {chatMessages.length > 0 && (
          <div className="flex-1 flex flex-col">
            <MessageList
              messages={chatMessages}
              chatEndRef={chatEndRef}
              onUpdateChatSessions={chat.setChatSessions}
              activeSubApp={activeSubApp}
              onRecordSearch={handleRecordSearch}
            />
          </div>
        )}

        {chatMessages.length === 0 && (
          <div className="flex-1 flex items-end">
            <WelcomeSection
              activeSubApp={activeSubApp}
              workspaceId={workspaceId || 'demo-workspace'}
              isPersonFinderMinimized={isPersonFinderMinimized}
              onMinimizePersonFinder={() => setIsPersonFinderMinimized(true)}
              onExpandPersonFinder={() => setIsPersonFinderMinimized(false)}
              onQuickAction={handleQuickAction}
              getWelcomeMessage={getWelcomeMessage}
              quickActions={quickActions}
              activeConversationId={activeConversationId}
            />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        rightChatInput={rightChatInput}
        setRightChatInput={setRightChatInput}
        textareaHeight={textareaHeight}
        setTextareaHeight={setTextareaHeight}
        contextFiles={contextFiles}
        setContextFiles={setContextFiles}
        selectedAIModel={selectedAIModel}
        setSelectedAIModel={setSelectedAIModel}
        isDragOver={isDragOver}
        showAddFilesPopup={showAddFilesPopup}
        setShowAddFilesPopup={setShowAddFilesPopup}
        workspaceId={workspaceId}
        onSubmit={handleSubmit}
        onFileSelect={handleFileSelect}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        fileInputRef={fileInputRef}
        textareaRef={textareaRef}
        addFilesPopupRef={addFilesPopupRef}
        isEnterHandledRef={isEnterHandledRef}
        processMessageWithQueue={processMessageWithQueue}
        scrollToBottom={scrollToBottom}
        chatHistory={chatMessages.filter(msg => msg['type'] === 'user').map(msg => msg.content).slice(-20)}
      />
    </div>
  );
}

