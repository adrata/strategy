"use client";

import React, { useState, useRef, useEffect } from "react";

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  grammars: SpeechGrammarList;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechGrammarList {
  length: number;
  addFromString(grammar: string, weight?: number): void;
  addFromURI(uri: string, weight?: number): void;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useRecordContext } from "@/platform/ui/context/RecordContextProvider";
import { useUnifiedAuth } from "@/platform/auth";
import { QUICK_ACTIONS } from "@/platform/config";
import { ChatQueueManager } from "./ChatQueueManager";
import { AI_MODELS, type AIModel } from './AIModelSelector';
import { RecordUpdateService } from '@/platform/services/record-update-service';
import { CoreSignalChatHandler } from './CoreSignalChatHandler';
import { useRouter, usePathname } from 'next/navigation';
import { elevenLabsVoice } from '@/platform/services/elevenlabs-voice';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Import modular components
import { ConversationHeader } from './ConversationHeader';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { WelcomeSection } from './WelcomeSection';
import { AIActionsView } from './AIActionsView';
import { TeamWinsView } from './TeamWinsView';
import { DMChatInterface } from './DMChatInterface';
import { DirectMessagesList } from './DirectMessagesList';
import { VoiceModeModal } from './VoiceModeModal';

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
  // OpenRouter routing information
  routingInfo?: {
    complexity: number;
    selectedModel: string;
    fallbackUsed: boolean;
    failoverChain: string[];
  };
  cost?: number;
  model?: string;
  provider?: string;
  reasoning?: {
    contextAwareness?: {
      recordType?: string;
      recordName?: string;
      companyName?: string;
      workspaceContext?: string;
      dataPoints?: number;
    };
    dataSources?: Array<{
      type: 'record' | 'intelligence' | 'workspace' | 'history';
      name: string;
      description: string;
    }>;
    thinkingSteps?: Array<{
      step: number;
      description: string;
      confidence?: number;
    }>;
    confidence?: number;
    processingTime?: number;
    model?: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastActivity: Date;
  isActive: boolean;
  welcomeMessage?: string;
}

interface AIAction {
  id: string;
  action: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'in_progress';
  details?: string;
}

interface TeamWin {
  id: string;
  user: string;
  achievement: string;
  timestamp: Date;
  value?: string;
}

interface ContextFile {
  id: string;
  name: string;
  size?: number;
  data?: string;
  type?: string;
}

/**
 * 🤖 RIGHT PANEL - MODULAR VERSION
 * 
 * Intelligent AI assistant panel with contextual awareness:
 * - Real AI provider integration (OpenAI API)
 * - URL and app context detection
 * - Middle panel record context
 * - Left panel data integration
 * - Conversation history and memory
 * - Clean, streamlined chat experience
 * - Modular component architecture
 */
export function RightPanel() {
  const { ui, chat } = useRevenueOS();
  const router = useRouter();
  const pathname = usePathname();
  
  // Utility function for file size formatting
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const { currentRecord, recordType, listViewContext } = useRecordContext();
  const { user } = useUnifiedAuth();

  // 🔧 FIX: Use refs to capture latest record context at message send time
  const currentRecordRef = useRef(currentRecord);
  const recordTypeRef = useRef(recordType);
  const listViewContextRef = useRef(listViewContext);
  
  // Update refs whenever context changes
  useEffect(() => {
    currentRecordRef.current = currentRecord;
    recordTypeRef.current = recordType;
    listViewContextRef.current = listViewContext;
    
    // Log when record context changes
    if (currentRecord) {
      console.log('✅ [RightPanel] Record context updated in ref:', {
        recordId: currentRecord.id,
        recordName: currentRecord.name || currentRecord.fullName,
        recordType,
        recordCompany: typeof currentRecord.company === 'string' ? currentRecord.company : (currentRecord.company?.name || currentRecord.companyName),
        fieldCount: Object.keys(currentRecord).length,
        hasId: !!currentRecord.id,
        hasName: !!(currentRecord.name || currentRecord.fullName)
      });
    } else {
      console.warn('⚠️ [RightPanel] Record context is NULL - AI will not have record context!');
    }
  }, [currentRecord, recordType, listViewContext]);

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
    return AI_MODELS.find(m => m.id === 'auto') || AI_MODELS[0] || { id: 'auto', name: 'Auto', displayName: 'Auto', version: 'Intelligent Routing', provider: 'Auto' };
  });

  // Voice settings disabled for now
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('default');
  
  // Wake word detection state
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const wakeWordRecognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Voice modal state
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isModalListening, setIsModalListening] = useState(false);
  const [backgroundRecognition, setBackgroundRecognition] = useState<SpeechRecognition | null>(null);
  const [isBackgroundListening, setIsBackgroundListening] = useState(false);

  const { activeSubApp } = ui;

  // Background voice recognition when modal is closed
  useEffect(() => {
    if (!isVoiceModeActive || showVoiceModal) {
      // Stop background listening if modal is open or voice mode is off
      if (backgroundRecognition) {
        backgroundRecognition.stop();
        setBackgroundRecognition(null);
        setIsBackgroundListening(false);
      }
      return;
    }

    // Start background listening
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = 'en-US';

    // Add speech grammar for Adrata
    if ('SpeechGrammarList' in window) {
      const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
      const grammarList = new SpeechGrammarList();
      const grammar = '#JSGF V1.0; grammar adrata; public <phrase> = Adrata | Hey Adrata | Hi Adrata ;';
      grammarList.addFromString(grammar, 1.0);
      recognition.grammars = grammarList;
    }

    let finalTranscriptAccumulator = '';
    let silenceTimeout: NodeJS.Timeout | null = null;

    recognition.onstart = () => {
      setIsBackgroundListening(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('🎤 Background voice recognition started');
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives = Array.from(result);
        
        // Enhanced alternative selection with context awareness
        const scoredAlternatives = alternatives.map(alt => {
          let score = alt.confidence;
          const text = alt.transcript.toLowerCase();
          
          // Boost for greetings
          if (text.includes('hey') || text.includes('hi') || text.includes('hello')) {
            score *= 1.3;
          }
          
          // Boost for Adrata mentions
          const adrataVariations = ['adrata', 'edrata', 'adra', 'edra', 'a drata', 'ah drata'];
          if (adrataVariations.some(v => text.includes(v))) {
            score *= 1.5;
          }
          
          return { ...alt, adjustedScore: score };
        });
        
        const bestAlternative = scoredAlternatives.reduce((best, current) => 
          current.adjustedScore > best.adjustedScore ? current : best
        );
        
        if (result.isFinal && bestAlternative.confidence > 0.7) {
          finalTranscript += bestAlternative.transcript;
        }
      }

      if (finalTranscript) {
        finalTranscriptAccumulator += finalTranscript + ' ';
        
        // Clear existing timeout
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }
        
        // Set new timeout to process after 2 seconds of silence
        silenceTimeout = setTimeout(() => {
          if (finalTranscriptAccumulator.trim()) {
            // Fix Adrata spelling
            const fixedTranscript = finalTranscriptAccumulator
              .replace(/\bedrada\b/gi, 'Adrata')
              .replace(/\badrata\b/gi, 'Adrata')
              .replace(/\bedra\b/gi, 'Adrata')
              .replace(/\badra\b/gi, 'Adrata')
              .replace(/\ba\s*drata\b/gi, 'Adrata')
              .replace(/\bah\s*drata\b/gi, 'Adrata')
              .replace(/\bhey,?\s+adrata\b/gi, 'Hey, Adrata')
              .replace(/\bhey,?\s+edrada\b/gi, 'Hey, Adrata')
              .replace(/\bhi,?\s+adrata\b/gi, 'Hi, Adrata')
              .replace(/\bhello,?\s+adrata\b/gi, 'Hello, Adrata')
              .trim();
            
            // Send directly to chat
            if (process.env.NODE_ENV === 'development') {
              console.log('🎤 Background voice input:', fixedTranscript);
            }
            processMessageWithQueue(fixedTranscript);
            
            finalTranscriptAccumulator = '';
          }
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error('Background recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart on no-speech
        setTimeout(() => {
          if (isVoiceModeActive && !showVoiceModal) {
            recognition.start();
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      setIsBackgroundListening(false);
      // Auto-restart if voice mode is still active and modal is closed
      if (isVoiceModeActive && !showVoiceModal) {
        setTimeout(() => recognition.start(), 100);
      }
    };

    recognition.start();
    setBackgroundRecognition(recognition);

    return () => {
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
      recognition.stop();
      setIsBackgroundListening(false);
    };
  }, [isVoiceModeActive, showVoiceModal]);

  // Wake word detection setup
  useEffect(() => {
    if (!wakeWordEnabled || typeof window === 'undefined') return;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) return;

    wakeWordRecognitionRef.current = new SpeechRecognition();
    const recognition = wakeWordRecognitionRef.current;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListeningForWakeWord(true);
    };

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const alternatives = Array.from(result);
      
      // Find the best alternative based on confidence
      const bestAlternative = alternatives.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      const transcript = bestAlternative.transcript.toLowerCase();
      
      // Check for wake word variations with confidence threshold
      const wakeWordPatterns = [
        'hey adrata',
        'hi adrata', 
        'hello adrata',
        'hey adra',
        'hi adra'
      ];
      
      const isWakeWord = wakeWordPatterns.some(pattern => 
        transcript.includes(pattern) && bestAlternative.confidence > 0.6
      );
      
      if (isWakeWord) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Wake word detected:', transcript, 'Confidence:', bestAlternative.confidence);
        }
        
        // Trigger voice mode modal
        setShowVoiceModal(true);
        // Stop wake word listening temporarily
        recognition.stop();
        setIsListeningForWakeWord(false);
        
        // Restart wake word listening after a delay
        setTimeout(() => {
          if (wakeWordEnabled) {
            recognition.start();
          }
        }, 10000); // Longer delay to avoid interference
      }
    };

    recognition.onerror = (event) => {
      console.error('Wake word recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setWakeWordEnabled(false);
        setIsListeningForWakeWord(false);
      }
    };

    recognition.onend = () => {
      setIsListeningForWakeWord(false);
      // Restart if still enabled
      if (wakeWordEnabled) {
        setTimeout(() => recognition.start(), 1000);
      }
    };

    // Start listening
    recognition.start();

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [wakeWordEnabled]);

  // Direct Messages state
  const [showDirectMessagesList, setShowDirectMessagesList] = useState(false);
  const [selectedDM, setSelectedDM] = useState<any>(null);
  const [showDMChat, setShowDMChat] = useState(false);
  const [dms, setDms] = useState<any[]>([]);
  const [dmsLoading, setDmsLoading] = useState(false);

  // Load DMs from Oasis system
  const loadDMs = async () => {
    setDmsLoading(true);
    try {
      // Get workspace ID for Oasis
      const workspaceId = user?.activeWorkspaceId || '';
      
      // Fetch DMs from Oasis API
      const response = await fetch(`/api/v1/oasis/oasis/dms?workspaceId=${workspaceId}`);
      if (response.ok) {
        const oasisDMs = await response.json();
        
        // Convert Oasis DM format to our format
        const convertedDMs = oasisDMs.map((dm: any) => ({
          id: dm.id,
          name: dm.participants[0]?.name || 'Unknown User',
          lastMessage: dm.lastMessage?.content || 'No messages yet',
          lastMessageTime: dm.lastMessage?.createdAt ? new Date(dm.lastMessage.createdAt) : new Date(),
          unreadCount: 0, // TODO: Calculate unread count from Oasis data
          isOnline: true // TODO: Get real online status from Oasis presence
        }));
        
        setDms(convertedDMs);
      } else {
        // Fallback to mock data if API fails
        setDms([
          {
            id: '1',
            name: 'John Doe',
            lastMessage: 'Hey, how are you?',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
            unreadCount: 0,
            isOnline: true
          },
          {
            id: '2',
            name: 'Jane Smith',
            lastMessage: 'Thanks for the update!',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
            unreadCount: 0,
            isOnline: false
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load DMs from Oasis:', error);
      // Fallback to empty array
      setDms([]);
    }
    setDmsLoading(false);
  };

  // Voice functionality disabled for now - will be implemented properly later

  // Core state
  const [rightChatInput, setRightChatInput] = useState("");
  const [isPersonFinderMinimized, setIsPersonFinderMinimized] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(182);
  const [viewMode, setViewMode] = useState<'ai' | 'conversations' | 'chat' | 'actions' | 'achievements' | 'targets' | 'calendar' | 'insights'>('ai');
  
  // Conversation management with hybrid persistence (localStorage + API)
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== 'undefined' && workspaceId) {
      try {
        const storageKey = `adrata-conversations-${workspaceId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          return parsed.map((conv: any) => ({
            ...conv,
            lastActivity: new Date(conv.lastActivity),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              // Ensure typewriter state is properly handled on load
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
  
  // Track if conversations have been initially loaded to prevent re-loading on workspace changes
  const conversationsLoadedRef = useRef(false);
  
  // Track current page context for AI awareness
  const [currentPageContext, setCurrentPageContext] = useState<any>(null);
  const [contextLastUpdated, setContextLastUpdated] = useState<Date>(new Date());
  
  // Track locally deleted conversation IDs to prevent re-adding during API sync
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
  
  // Mock data for AI actions and team wins
  const [aiActions] = useState<AIAction[]>([
    {
      id: '1',
      action: 'Data Validation',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'completed',
      details: 'Validated and corrected vertical data for 233 accounts using AI classification'
    },
    {
      id: '2',
      action: 'UI Enhancement',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: 'completed',
      details: 'Updated leads and prospects filters with Companies/People toggle and vertical filtering'
    }
  ]);
  
  const [teamWins] = useState<TeamWin[]>([]);
  
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
        if (process.env.NODE_ENV === 'development') {
          console.log('💾 [CHAT] Saved conversations to localStorage:', conversations.length, 'for workspace:', workspaceId);
        }
      } catch (error) {
        console.warn('Failed to save conversations to localStorage:', error);
      }
    }
  }, [conversations, workspaceId]);

  // Save deleted conversation IDs to localStorage whenever they change
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

  // Load conversations from localStorage on component mount - WORKSPACE ISOLATED
  // Only load once to prevent closed tabs from reappearing
  useEffect(() => {
    if (typeof window !== 'undefined' && workspaceId && !conversationsLoadedRef.current) {
      try {
        const storageKey = `adrata-conversations-${workspaceId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Filter out conversations that were deleted locally
          const filteredConversations = parsed.filter((conv: any) => !deletedConversationIds.has(conv.id));
          const restoredConversations = filteredConversations.map((conv: any) => ({
            ...conv,
            lastActivity: new Date(conv.lastActivity),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              // Ensure typewriter state is properly handled on load
              isTypewriter: msg['isTypewriter'] === true ? false : undefined
            }))
          }));
          setConversations(restoredConversations);
          if (process.env.NODE_ENV === 'development') {
            console.log('📂 [CHAT] Loaded conversations from localStorage:', restoredConversations.length, 'for workspace:', workspaceId);
            if (parsed.length > filteredConversations.length) {
              console.log('🗑️ [CHAT] Filtered out', parsed.length - filteredConversations.length, 'deleted conversations');
            }
          }
          conversationsLoadedRef.current = true;
        }
      } catch (error) {
        console.warn('Failed to load stored conversations:', error);
      }
    }
  }, [workspaceId]);

  // API sync functions for hybrid persistence
  const syncConversationsFromAPI = async () => {
    if (!workspaceId || !userId || isSyncing) return;
    
    setIsSyncing(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [CHAT] Syncing conversations from API...');
      }
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
        
        // Merge with localStorage data (API is source of truth)
        setConversations(prevConversations => {
          // Don't re-add conversations that were deleted locally
          const merged = apiConversations.filter(
            apiConv => !deletedConversationIds.has(apiConv.id)
          );
          
          // Add any localStorage conversations that aren't in API (for offline support)
          prevConversations.forEach(localConv => {
            if (!merged.find(apiConv => apiConv.id === localConv.id) && 
                !deletedConversationIds.has(localConv.id)) {
              merged.push(localConv);
            }
          });
          
          return merged.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        });
        
        setLastSyncTime(new Date());
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [CHAT] Synced conversations from API:', apiConversations.length);
        }
      }
    } catch (error) {
      console.warn('⚠️ [CHAT] Failed to sync conversations from API:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveConversationToAPI = async (conversation: Conversation) => {
    if (!workspaceId || !userId) return null;
    
    try {
      // If conversation already has an API ID (not a temp ID), try to update it
      if (conversation.id && !conversation.id.startsWith('conv-') && conversation.id !== 'main-chat') {
        // Try to update existing conversation
        try {
          const updateResponse = await fetch(`/api/v1/conversations/${conversation.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: conversation.title,
              welcomeMessage: conversation.welcomeMessage
            })
          });
          const updateResult = await updateResponse.json();
          if (updateResult.success) {
            return conversation.id;
          }
        } catch (updateError) {
          // If update fails, fall through to create new
          console.warn('⚠️ [CHAT] Failed to update conversation, will create new:', updateError);
        }
      }
      
      // Create new conversation
      const response = await fetch('/api/v1/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: conversation.title,
          welcomeMessage: conversation.welcomeMessage,
          metadata: { 
            source: 'frontend',
            isMainChat: conversation.id === 'main-chat'
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [CHAT] Saved conversation to API:', result.data.conversation.id);
        }
        return result.data.conversation.id;
      }
    } catch (error) {
      console.warn('⚠️ [CHAT] Failed to save conversation to API:', error);
    }
    return null;
  };

  // Ensure main-chat conversation exists in API and has a real ID
  const ensureMainChatInAPI = async (): Promise<string | null> => {
    if (!workspaceId || !userId) return null;
    
    // Use a ref to get current conversations state
    let currentMainChat = conversations.find(c => c.id === 'main-chat');
    if (!currentMainChat) return null;
    
    // Check if main-chat already has a real API ID
    if (currentMainChat.id !== 'main-chat') return currentMainChat.id;
    
    try {
      // Try to find existing main chat in API
      const response = await fetch('/api/v1/conversations?includeMessages=true');
      const result = await response.json();
      
      if (result.success && result.data.conversations) {
        // Look for main chat (check metadata or title)
        const existingMainChat = result.data.conversations.find((conv: any) => 
          conv.metadata?.isMainChat === true || conv.title === 'Main Chat'
        );
        
        if (existingMainChat) {
          // Update local main-chat with API ID
          setConversations(prev => prev.map(conv => 
            conv.id === 'main-chat' 
              ? { ...conv, id: existingMainChat.id }
              : conv
          ));
          setActiveConversationId(existingMainChat.id);
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ [CHAT] Found existing main-chat in API:', existingMainChat.id);
          }
          return existingMainChat.id;
        }
      }
      
      // Create main-chat in API if it doesn't exist
      const apiId = await saveConversationToAPI(currentMainChat);
      if (apiId) {
        setConversations(prev => prev.map(conv => 
          conv.id === 'main-chat' 
            ? { ...conv, id: apiId }
            : conv
        ));
        setActiveConversationId(apiId);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [CHAT] Created main-chat in API:', apiId);
        }
        return apiId;
      }
    } catch (error) {
      console.warn('⚠️ [CHAT] Failed to ensure main-chat in API:', error);
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
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [CHAT] Saved message to API:', result.data.message.id);
        }
        return result.data.message.id;
      }
    } catch (error) {
      console.warn('⚠️ [CHAT] Failed to save message to API:', error);
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
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [CHAT] Deleted conversation from API:', conversationId);
        }
      }
    } catch (error) {
      console.warn('⚠️ [CHAT] Failed to delete conversation from API:', error);
    }
  };

  // Sync from API on mount and periodically
  useEffect(() => {
    if (workspaceId && userId) {
      // Initial sync after a short delay to let localStorage load first
      const timer = setTimeout(async () => {
        await syncConversationsFromAPI();
        // Ensure main-chat exists in API after syncing
        await ensureMainChatInAPI();
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

  // Update page context when pathname changes
  useEffect(() => {
    const newContext = getPageContext();
      if (newContext) {
        setCurrentPageContext(newContext);
        setContextLastUpdated(new Date());
        if (process.env.NODE_ENV === 'development') {
          console.log('🧭 [AI CONTEXT] Page context updated:', {
            section: newContext.secondarySection,
            detailView: newContext.detailView,
            isDetailPage: newContext.isDetailPage,
            itemId: newContext.itemId,
            itemName: newContext.itemName,
            viewType: newContext.viewType
          });
        }
      }
  }, [pathname]);

  // Update context when current record changes
  useEffect(() => {
    if (currentRecord) {
      setContextLastUpdated(new Date());
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 [AI CONTEXT] Record context updated:', {
          recordType,
          recordId: currentRecord.id,
          recordName: currentRecord.name || currentRecord.fullName
        });
      }
    }
  }, [currentRecord, recordType]);

  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEnterHandledRef = useRef(false);
  const menuPopupRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<HTMLDivElement>(null);
  const addFilesPopupRef = useRef<HTMLDivElement>(null);
  
  // Generate contextual quick actions based on current record
  const generateContextualActions = (record: any, recordType: string): string[] => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 [AI RIGHT PANEL] generateContextualActions called with:', { 
        record: record ? { id: record.id, name: record.name || record.fullName } : null, 
        recordType,
        activeSubApp 
      });
    }
    
    if (!record) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 [AI RIGHT PANEL] No record, returning generic actions');
      }
      return QUICK_ACTIONS[activeSubApp] || QUICK_ACTIONS["Speedrun"] || [];
    }
    
    const actions: string[] = [];
    // For companies, name refers to the company name; for people/leads, it refers to the person's name
    const name = record.fullName || record.name || 'this prospect';
    const company = record.company || record.companyName || record.name || 'their company';
    const title = record.title || record.jobTitle || 'their role';
    const email = record.email || record.workEmail;
    const status = record.status?.toLowerCase() || 'new';
    const priority = record.priority?.toLowerCase() || 'medium';
    const industry = record.industry?.toLowerCase() || '';
    
    // Record type specific actions
    switch (recordType) {
      case 'leads':
        // Lead-specific actions focused on qualification and conversion
        actions.push(`What should I know about ${name} before calling?`);
        actions.push(`Find ${company}'s biggest challenges right now`);
        actions.push(`Create me a deep value report for ${name}`);
        
        if (status === 'new' || status === 'uncontacted') {
          actions.push(`Draft a compelling opening line for ${name}`);
          actions.push(`What's the best way to reach ${name} at ${company}?`);
        } else if (status === 'contacted') {
          actions.push(`What should I say in my follow-up to ${name}?`);
          actions.push(`How do I qualify ${name} as a real prospect?`);
        } else if (status === 'responded' || status === 'engaged') {
          actions.push(`How do I advance ${name} to prospect stage?`);
          actions.push(`What questions should I ask ${name} to qualify them?`);
        }
        break;
        
      case 'prospects':
        // Prospect-specific actions focused on advancing the deal
        actions.push(`What's ${name}'s decision-making process at ${company}?`);
        actions.push(`Find ${company}'s budget and timeline for solutions`);
        actions.push(`Create me a deep value report for ${name}`);
        
        if (status === 'qualified') {
          actions.push(`How do I present our solution to ${name}?`);
          actions.push(`What objections might ${name} have and how do I handle them?`);
        } else if (status === 'engaged') {
          actions.push(`What's the next step to advance ${name}?`);
          actions.push(`How do I build urgency with ${name}?`);
        }
        break;
        
      case 'opportunities':
        // Opportunity-specific actions focused on closing
        actions.push(`What's the status of the ${company} opportunity?`);
        actions.push(`Who are the key stakeholders at ${company}?`);
        actions.push(`What's the timeline and budget for this deal?`);
        actions.push(`How do I close this deal with ${name}?`);
        break;
        
      case 'companies':
        // Account-specific actions focused on expansion and relationship building
        actions.push(`What's ${company}'s current relationship with us?`);
        actions.push(`Find expansion opportunities at ${company}`);
        actions.push(`Who else should I be talking to at ${company}?`);
        actions.push(`What are ${company}'s biggest business challenges?`);
        actions.push(`How can I build a relationship with ${company}?`);
        actions.push(`What's ${company}'s growth strategy and priorities?`);
        actions.push(`Who are the key decision makers at ${company}?`);
        actions.push(`Create me a deep value report for ${company}`);
        break;
        
      case 'people':
        // Contact-specific actions focused on relationship building
        actions.push(`What's ${name}'s role and influence at ${company}?`);
        actions.push(`How can I leverage my relationship with ${name}?`);
        actions.push(`Who does ${name} report to at ${company}?`);
        actions.push(`What's the best way to stay in touch with ${name}?`);
        actions.push(`Create me a deep value report for ${name}`);
        break;
        
      default:
        // Generic actions
        actions.push(`What should I know about ${name} before calling?`);
        actions.push(`Find ${company}'s biggest challenges right now`);
        actions.push(`Research ${name}'s background and role`);
        actions.push(`Draft a compelling message for ${name}`);
    }
    
    // Role-specific intelligence gathering (only applies to people/leads, not companies)
    if (recordType !== 'companies' && title) {
      if (title?.toLowerCase().includes('vp') || title?.toLowerCase().includes('vice president')) {
        actions.push(`How do VPs like ${name} typically evaluate solutions?`);
      } else if (title?.toLowerCase().includes('director') || title?.toLowerCase().includes('manager')) {
        actions.push(`What problems does a ${title} at ${company} face daily?`);
      } else if (title?.toLowerCase().includes('cto') || title?.toLowerCase().includes('cio') || title?.toLowerCase().includes('technology')) {
        actions.push(`What's ${company}'s current tech stack and roadmap?`);
      } else if (title?.toLowerCase().includes('ceo') || title?.toLowerCase().includes('president')) {
        actions.push(`What are ${name}'s strategic priorities for ${company}?`);
      }
    }
    
    // Industry-specific actions
    if (industry.includes('retail') || industry.includes('convenience')) {
      actions.push(`What are the biggest challenges in retail technology right now?`);
    } else if (industry.includes('technology') || industry.includes('software')) {
      actions.push(`What's ${company}'s technology strategy and roadmap?`);
    } else if (industry.includes('healthcare') || industry.includes('medical')) {
      actions.push(`What are the biggest challenges in healthcare technology?`);
    }
    
    // Priority-based actions
    if (priority === 'high' || priority === 'urgent') {
      actions.push(`This is high priority - what's the fastest path to close?`);
    }
    
    return actions.slice(0, 4); // Return top 4 most relevant actions
  };
  
  const quickActions = generateContextualActions(currentRecord, recordType || '');

  // Helper functions
  const getActiveConversation = () => {
    return conversations.find(c => c['id'] === activeConversationId) || conversations[0];
  };

  const activeConversation = getActiveConversation();
  const chatMessages = activeConversation?.messages || [];

  const createNewConversation = async () => {
    // Find the highest chat number to avoid duplicates
    const chatNumberPattern = /^Chat (\d+)$/;
    let maxChatNumber = 0;
    
    conversations.forEach(conv => {
      const match = conv.title.match(chatNumberPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxChatNumber) {
          maxChatNumber = num;
        }
      }
    });
    
    const newChatNumber = maxChatNumber + 1;
    const newConv: Conversation = {
      id: `conv-${Date.now()}`, // Temporary ID, will be replaced by API
      title: `Chat ${newChatNumber}`,
      messages: [],
      lastActivity: new Date(),
      isActive: true
    };
    
    const activeIndex = conversations.findIndex(c => c.isActive);
    const insertIndex = activeIndex >= 0 ? activeIndex + 1 : conversations.length;
    
    // Update UI immediately (optimistic update)
    setConversations(prev => {
      const updated = prev.map(c => ({ ...c, isActive: false }));
      updated.splice(insertIndex, 0, newConv);
      return updated;
    });
    setActiveConversationId(newConv.id);
    
    // Save to API in background
    try {
      const apiId = await saveConversationToAPI(newConv);
      if (apiId) {
        // Update the conversation with the real API ID
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
      
      // If closing the active conversation, switch to another
      if (closedConv?.isActive && filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
      }
      
      return filtered;
    });
    
    // Track this conversation as deleted locally
    setDeletedConversationIds(prev => new Set([...Array.from(prev), conversationId]));
    
    // Delete from API
    deleteConversationFromAPI(conversationId);
  };

  const handleReorderConversations = (newOrder: Conversation[]) => {
    setConversations(newOrder);
  };

  const getWelcomeMessage = (app: string): string => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 [AI RIGHT PANEL] getWelcomeMessage called with:', { 
        app, 
        currentRecord: currentRecord ? { id: currentRecord.id, name: currentRecord.name || currentRecord.fullName } : null, 
        recordType 
      });
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

    const activeConv = getActiveConversation();
    if (activeConv?.welcomeMessage && activeConv['messages']['length'] === 0) {
      return activeConv.welcomeMessage;
    }

    const greeting = "Hi. I'm Adrata. What would you like to work on today?";

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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuPopupRef['current'] && !menuPopupRef.current.contains(event.target as Node)) {
        setShowMenuPopup(false);
      }
      if (conversationHistoryRef['current'] && !conversationHistoryRef.current.contains(event.target as Node)) {
        setShowConversationHistory(false);
      }
      if (addFilesPopupRef['current'] && !addFilesPopupRef.current.contains(event.target as Node)) {
        setShowAddFilesPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track user scroll intent to prevent auto-scroll override
  const userScrolledUpRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // Detect manual scrolling - if user scrolls up, disable auto-scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const currentScrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const scrollBottom = scrollHeight - currentScrollTop - clientHeight;
        
        // Clear any pending timeout
        clearTimeout(scrollTimeout);
        
        // Debounce scroll detection to avoid false positives from smooth scrolling
        scrollTimeout = setTimeout(() => {
          // If user scrolled up (scrollTop decreased by more than 10px), mark as manual scroll
          if (currentScrollTop < lastScrollTopRef.current - 10) {
            userScrolledUpRef.current = true;
          }
          
          // If user scrolls back to bottom (within 50px), re-enable auto-scroll
          if (scrollBottom < 50) {
            userScrolledUpRef.current = false;
          }
          
          lastScrollTopRef.current = currentScrollTop;
        }, 150); // 150ms debounce
      }
    };

    // Find scroll container and attach listener
    const findScrollContainer = () => {
      // Try to find container immediately
      if (chatEndRef.current) {
        const container = chatEndRef.current.closest('.overflow-y-auto') as HTMLElement;
        if (container) {
          scrollContainerRef.current = container;
          container.addEventListener('scroll', handleScroll, { passive: true });
          lastScrollTopRef.current = container.scrollTop;
          return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
          };
        }
      }
      
      // If not found, try again after a short delay (container might not be mounted yet)
      const retryTimeout = setTimeout(() => {
        if (chatEndRef.current && !scrollContainerRef.current) {
          const container = chatEndRef.current.closest('.overflow-y-auto') as HTMLElement;
          if (container) {
            scrollContainerRef.current = container;
            container.addEventListener('scroll', handleScroll, { passive: true });
            lastScrollTopRef.current = container.scrollTop;
          }
        }
      }, 100);
      
      return () => {
        clearTimeout(retryTimeout);
        clearTimeout(scrollTimeout);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    };

    return findScrollContainer();
  }, [chatEndRef]);

  // Scroll to bottom helper - respects user scroll intent
  const scrollToBottom = (force = false) => {
    if (chatEndRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      
      // Only auto-scroll if:
      // 1. Forced (e.g., new message sent)
      // 2. User hasn't manually scrolled up AND is near bottom (within 100px)
      if (force || (!userScrolledUpRef.current && scrollBottom < 100)) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          chatEndRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end',
            inline: 'nearest'
          });
        });
      }
    } else if (chatEndRef.current) {
      // Fallback if container not found yet
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      });
    }
  };

  // Auto-scroll to bottom instantly on component mount (no animation)
  useEffect(() => {
    if (chatEndRef.current) {
      // Use instant scroll without animation
      chatEndRef.current.scrollIntoView({ 
        behavior: 'instant', 
        block: 'end' 
      });
    }
  }, []); // Only on mount

  // Excel import handling with AI analysis
  const handleExcelImport = async (file: File, parsedDoc: any, tableCount: number, rowCount: number) => {
    try {
      // Show initial processing message
      chat.addAssistantMessage(
        `📊 **Analyzing Excel file: ${file.name}**

**Initial Analysis:**
• File type: ${parsedDoc.fileType.toUpperCase()}
• Size: ${formatFileSize(parsedDoc.fileSize)}
• Tables found: ${tableCount}
• Data rows: ${rowCount - 1} (excluding headers)

🤖 **AI is analyzing the data structure and preparing import recommendations...**`,
        activeSubApp
      );

      // Extract Excel data for AI analysis
      const excelData = {
        fileName: file.name,
        fileSize: file.size,
        tables: parsedDoc.content.tables,
        sheets: parsedDoc.structure?.sheets || ['Sheet1'],
        headers: parsedDoc.content.tables[0]?.[0] || [],
        sampleData: parsedDoc.content.tables[0]?.slice(1, 6) || [], // First 5 rows
        totalRows: rowCount - 1
      };

      // Send to AI for analysis
      const aiResponse = await processMessageWithQueue(
        `I've uploaded an Excel file with lead data. Please analyze it and help me import the contacts with appropriate status and connection points. Here's the data structure:

File: ${file.name}
Headers: ${excelData.headers.join(', ')}
Sample data: ${JSON.stringify(excelData.sampleData, null, 2)}

Please provide:
1. Import type detection (people, companies, or mixed)
2. Column mapping suggestions
3. Status recommendations for each contact
4. Connection point opportunities
5. Data quality assessment
6. Import confidence score
7. Next action recommendations

I want to import this data into my CRM with the right status and create appropriate connection points.`,
        activeSubApp,
        'general',
        currentRecord,
        listViewContext
      );

      // After AI analysis, show import options
      setTimeout(() => {
        chat.addAssistantMessage(
          `🎯 **Ready to Import Excel Data**

Based on the AI analysis, I can now import your Excel data with intelligent processing:

**Import Options:**
• Smart column mapping
• Automatic status assignment (LEAD/PROSPECT/CUSTOMER)
• Company creation and linking
• Connection point generation
• Duplicate detection and handling

**To proceed with import, say:**
"Import the Excel data" or "Start the import process"

**To customize import settings, say:**
"Show import options" or "Configure the import"

The AI has analyzed your data and is ready to create the most valuable import for your sales pipeline.`,
          activeSubApp
        );
      }, 2000);

    } catch (error) {
      console.error('❌ [EXCEL IMPORT] Error:', error);
      chat.addAssistantMessage(
        `❌ **Error processing Excel file**

I encountered an issue analyzing your Excel file: ${error instanceof Error ? error.message : 'Unknown error'}

Please try:
• Ensuring the file is a valid Excel format (.xlsx or .xls)
• Checking that the file contains data in the first sheet
• Trying with a smaller file if this one is very large

You can also try uploading the file again or contact support if the issue persists.`,
        activeSubApp
      );
    }
  };

  // Execute Excel import with AI recommendations
  const executeExcelImport = async (file: File, importOptions: any = {}) => {
    try {
      // Show import progress
      chat.addAssistantMessage(
        `🚀 **Starting Excel Import Process**

**Import Settings:**
• File: ${file.name}
• Auto-create companies: ${importOptions.autoCreateCompanies !== false ? 'Yes' : 'No'}
• Create connection points: ${importOptions.createConnectionPoints !== false ? 'Yes' : 'No'}
• Skip duplicates: ${importOptions.skipDuplicates !== false ? 'Yes' : 'No'}

**Processing...** This may take a moment for large files.`,
        activeSubApp
      );

      // Prepare form data for API call
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId || '');
      formData.append('userId', userId || '');
      formData.append('userIntent', 'Import leads from Excel with AI analysis');
      formData.append('importOptions', JSON.stringify(importOptions));

      // Call Excel import API
      const response = await fetch('/api/v1/data/import-excel', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        const { results } = result;
        
        // Show success message with detailed results
        chat.addAssistantMessage(
          `✅ **Excel Import Completed Successfully!**

**Import Summary:**
• Total records processed: ${results.totalRecords}
• People created: ${results.createdPeople?.length || 0}
• Companies created: ${results.createdCompanies?.length || 0}
• Connection points created: ${results.createdActions?.length || 0}
• Records skipped: ${results.skippedRecords}
• Errors: ${results.errors?.length || 0}

**Import Type:** ${results.importType}
**Confidence Score:** ${results.confidence}%

**Column Mapping Applied:**
${Object.entries(results.columnMapping || {}).map(([header, field]) => `• ${header} → ${field}`).join('\n')}

**Recommendations:**
${results.recommendations?.map((rec: string) => `• ${rec}`).join('\n') || '• Import completed successfully'}

${results.errors?.length > 0 ? `\n**Errors encountered:**\n${results.errors.slice(0, 5).map((error: any) => `• Row ${error.row}: ${error.error}`).join('\n')}` : ''}

Your leads are now in the system with appropriate status and connection points! You can view them in the People section.`,
          activeSubApp
        );
      } else {
        throw new Error(result.error || 'Import failed');
      }

    } catch (error) {
      console.error('❌ [EXCEL IMPORT] Import error:', error);
      chat.addAssistantMessage(
        `❌ **Excel Import Failed**

Error: ${error instanceof Error ? error.message : 'Unknown error'}

Please try:
• Checking your file format and data structure
• Ensuring you have proper permissions
• Contacting support if the issue persists

You can also try uploading the file again or use a different format.`,
        activeSubApp
      );
    }
  };

  // File handling with universal document parsing
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      // Add file to context files (shows in input area)
      const contextFile: ContextFile = {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'file',
        size: file.size,
        data: file.type, // Store file type in data field
      };
      
      setContextFiles(prev => {
        const updated = [...prev, contextFile];
        // Persist to localStorage - WORKSPACE ISOLATED
        try {
          if (workspaceId) {
            const storageKey = `adrata-context-files-${workspaceId}`;
            localStorage.setItem(storageKey, JSON.stringify(updated));
          }
        } catch (error) {
          console.warn('Failed to persist context files:', error);
        }
        return updated;
      });
      
      // Add file display widget to chat messages to show it's part of research context
      chat.addAssistantMessage(
        `FILE_WIDGET:${JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        })}`,
        activeSubApp
      );
      
      // Process the file with universal parser
      try {
        // Dynamic import to avoid bundle bloat
        const { UniversalDocumentParser } = await import('@/platform/services/universal-document-parser');
        
        const parsedDoc = await UniversalDocumentParser.parseDocument(file, {
          extractTables: true,
          extractContacts: true,
          extractImages: false,
          ocrImages: false
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📄 [FILE HANDLER] Parsed ${file.name}:`, parsedDoc);
        }
        
        // Store document data in chat context for later processing
        chat.storeDocumentData(file.name, parsedDoc, activeSubApp);
        
        // Generate contextual response based on file type and content
        let responseMessage = '';
        
        // Check if this is an Excel file for import processing
        const isExcelFile = file.name.toLowerCase().endsWith('.xlsx') || 
                           file.name.toLowerCase().endsWith('.xls') ||
                           file.type.includes('spreadsheet') ||
                           file.type.includes('excel');
        
        if (isExcelFile && parsedDoc['content']['tables'] && parsedDoc.content.tables.length > 0) {
          const tableCount = parsedDoc.content.tables.length;
          const rowCount = parsedDoc.content['tables'][0]?.length || 0;
          
          // Trigger Excel import analysis
          await handleExcelImport(file, parsedDoc, tableCount, rowCount);
          return; // Early return to avoid duplicate processing
        }
        
        if (parsedDoc['content']['tables'] && parsedDoc.content.tables.length > 0) {
          const tableCount = parsedDoc.content.tables.length;
          const rowCount = parsedDoc.content['tables'][0]?.length || 0;
          responseMessage = `✅ **${file.name} processed successfully!**

**Document Analysis:**
• File type: ${parsedDoc.fileType.toUpperCase()}
• Size: ${formatFileSize(parsedDoc.fileSize)}
• Tables found: ${tableCount}
• Data rows: ${rowCount - 1} (excluding headers)
• Parse confidence: ${Math.round(parsedDoc.confidence * 100)}%

I can now help you with:
• Finding specific contacts or roles
• Enriching company data
• Analyzing the document content
• Extracting structured information

What would you like me to do with this data?`;
        } else if (parsedDoc['extractedData']['companies'] && parsedDoc.extractedData.companies.length > 0) {
          responseMessage = `✅ **${file.name} processed successfully!**

**Found ${parsedDoc.extractedData.companies.length} companies:**
${parsedDoc.extractedData.companies.slice(0, 5).map(c => `• ${c}`).join('\n')}
${parsedDoc.extractedData.companies.length > 5 ? `• ... and ${parsedDoc.extractedData.companies.length - 5} more` : ''}

I can help you find executives, enrich contact data, or analyze these companies. What would you like me to do?`;
        } else if (parsedDoc.content.text) {
          const wordCount = parsedDoc.content.text.split(' ').length;
          responseMessage = `✅ **${file.name} processed successfully!**

**Document Summary:**
• File type: ${parsedDoc.fileType.toUpperCase()}
• Content: ${wordCount} words extracted
• Parse confidence: ${Math.round(parsedDoc.confidence * 100)}%

I can analyze the content, extract key information, or answer questions about this document. How can I help?`;
        } else {
          responseMessage = `✅ **${file.name} uploaded successfully!**

I've received your ${parsedDoc.fileType.toUpperCase()} file. While I may need additional libraries for full parsing of this format, I can still help you with general questions about the file or guide you on how to process it further.`;
        }
        
        // Add processing response with faster timing
        setTimeout(() => {
          chat.addAssistantMessage(responseMessage, activeSubApp);
        }, 100);
        
      } catch (error) {
        console.error(`❌ [FILE HANDLER] Error processing ${file.name}:`, error);
        
        // Remove file from context files on error
        setContextFiles(prev => {
          const updated = prev.filter(f => f.id !== contextFile.id);
          // Persist to localStorage - WORKSPACE ISOLATED
          try {
            if (workspaceId) {
              const storageKey = `adrata-context-files-${workspaceId}`;
              localStorage.setItem(storageKey, JSON.stringify(updated));
            }
          } catch (storageError) {
            console.warn('Failed to persist context files:', storageError);
          }
          return updated;
        });
        
        // Fallback to basic file handling
        setTimeout(() => {
          chat.addAssistantMessage(
            `⚠️ I received your file "${file.name}" but encountered an issue processing it. I can still help you with general questions about the file or guide you on alternative approaches.`,
            activeSubApp
          );
        }, 100);
      }
    }
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef['current']['value'] = "";
    }
    
    // Scroll to show the new messages
    scrollToBottom();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    // Use the same file handling as the file input
    handleFileSelect({ target: { files } } as any);
  };

  // Optimized message processing with caching and debouncing
  // Helper function to extract comprehensive page context from URL
  const getPageContext = () => {
    if (typeof window === 'undefined') return null;
    
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // 🚀 PARTNEROS DETECTION: Check if we're in PartnerOS mode
    const isPartnerOS = typeof window !== 'undefined' && (
      pathname.includes('/partner-os/') || 
      sessionStorage.getItem('activeSubApp') === 'partneros'
    );
    
    // Extract context from URL structure
    let primaryApp = '';
    let secondarySection = '';
    let detailView = '';
    let breadcrumb = '';
    let itemId = '';
    let itemName = '';
    let isDetailPage = false;
    let viewType: 'list' | 'detail' | 'form' | 'editor' = 'list';
    const filters: Record<string, any> = {};
    
    // Parse URL segments
    if (pathSegments.length >= 2) {
      primaryApp = pathSegments[1]; // workspace
        if (pathSegments.length >= 3) {
        // Check if second segment is 'partner-os', then use third segment as section
        if (pathSegments[2] === 'partner-os' && pathSegments.length >= 4) {
          secondarySection = pathSegments[3]; // speedrun, leads, prospects, etc.
          // For PartnerOS detail pages, the ID is in the 5th segment
          if (pathSegments.length >= 5) {
            const potentialId = pathSegments[4];
            if (potentialId && (!isNaN(Number(potentialId)) || potentialId.match(/^[a-f0-9-]{8,}$/i))) {
              itemId = potentialId;
              isDetailPage = true;
              viewType = 'detail';
            }
          }
        } else {
          secondarySection = pathSegments[2]; // database, grand-central, olympus, etc.
        }
        if (pathSegments.length >= 4 && !isPartnerOS) {
          detailView = pathSegments[3]; // tables, apis, connectors, etc.
          if (pathSegments.length >= 5) {
            // Check if this is a detail page with an ID
            const potentialId = pathSegments[4];
            if (potentialId && !isNaN(Number(potentialId)) || potentialId.match(/^[a-f0-9-]{8,}$/i)) {
              // This looks like an ID
              itemId = potentialId;
              isDetailPage = true;
              viewType = 'detail';
              detailView += `/${potentialId}`;
            } else {
              // This is a sub-section
              detailView += `/${potentialId}`;
              if (pathSegments.length >= 6) {
                const subItem = pathSegments[5];
                if (subItem && !isNaN(Number(subItem)) || subItem.match(/^[a-f0-9-]{8,}$/i)) {
                  itemId = subItem;
                  isDetailPage = true;
                  viewType = 'detail';
                  detailView += `/${subItem}`;
                }
              }
            }
          }
        }
      }
    }
    
    // Determine view type based on URL patterns
    if (detailView.includes('edit') || detailView.includes('create') || detailView.includes('new')) {
      viewType = 'form';
    } else if (detailView.includes('editor') || detailView.includes('code') || detailView.includes('monaco')) {
      viewType = 'editor';
    } else if (isDetailPage) {
      viewType = 'detail';
    } else {
      viewType = 'list';
    }
    
    // Extract query parameters as filters
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'tab' && key !== 'view') { // Exclude UI state params
        try {
          // Try to parse as JSON for complex filters
          filters[key] = JSON.parse(value);
        } catch {
          // Keep as string for simple filters
          filters[key] = value;
        }
      }
    }
    
    // Try to extract item name from page title or other sources
    if (typeof document !== 'undefined') {
      const title = document.title;
      if (title && title !== 'Adrata') {
        // Extract meaningful name from title
        const titleParts = title.split(' - ');
        if (titleParts.length > 1) {
          itemName = titleParts[0];
        }
      }
    }
    
    // Build breadcrumb
    breadcrumb = pathSegments.join(' > ');
    
    // Add API-specific context
    let apiContext = null;
    if (secondarySection === 'api') {
      apiContext = {
        area: 'API Keys',
        section: detailView || 'keys',
        page: detailView === 'keys' ? 'API Key Management' :
              detailView === 'documentation' ? 'API Documentation' :
              detailView === 'usage' ? 'API Usage' :
              detailView === 'webhooks' ? 'Webhooks' :
              detailView === 'settings' ? 'API Settings' :
              'API',
        description: 'The API area allows users to manage API keys, view documentation, monitor usage, configure webhooks, and access API settings. Users can generate API keys to authenticate requests and access buyer groups and other data via the Adrata API.'
      };
    }
    
    return {
      primaryApp,
      secondarySection,
      detailView,
      breadcrumb,
      fullPath: pathname,
      isDetailPage,
      itemId: itemId || undefined,
      itemName: itemName || undefined,
      viewType,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      apiContext,
      // 🚀 PARTNEROS CONTEXT: Include PartnerOS mode information
      isPartnerOS,
      appMode: isPartnerOS ? 'PartnerOS' : (primaryApp === 'adrata' ? 'RevenueOS' : primaryApp)
    };
  };

  const processMessageWithQueue = async (input: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    
    // Reset scroll state when sending a new message (user wants to see the response)
    userScrolledUpRef.current = false;
    
      // 🔧 FIX: Use refs to get the latest record context at send time (avoid stale closures)
      const latestRecord = currentRecordRef.current;
      const latestRecordType = recordTypeRef.current;
      const latestListViewContext = listViewContextRef.current;
      
      // 🔧 SMART FIX: Extract record ID from URL if current record is not available
      // Also detect list view vs detail view for better context
      let recordIdFromUrl: string | null = null;
      let isListView = false;
      let listViewSection: string | null = null;
      
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        
        // Check if we're on a list view (no record ID in URL)
        // Pattern: /workspace/section/ or /workspace/section (no ID after)
        const listViewMatch = pathname.match(/\/([^\/]+)\/(speedrun|leads|prospects|opportunities|people|companies|clients|partners)\/?$/);
        if (listViewMatch) {
          isListView = true;
          listViewSection = listViewMatch[2];
          console.log('🔍 [RightPanel] Detected list view:', {
            pathname,
            section: listViewSection
          });
        }
        
        // Extract record ID if on detail view
        if (!latestRecord && !isListView) {
          // Extract ID from URLs like /top/speedrun/camille-murdock-01K9T0K41GN6Y4RJP6FJFDT742
          const match = pathname.match(/\/([^\/]+)-([A-Z0-9]{26})/);
          if (match) {
            recordIdFromUrl = match[2];
            console.log('🔍 [RightPanel] Extracted record ID from URL to send to API:', {
              pathname,
              recordId: recordIdFromUrl
            });
          }
        }
      }
      
      console.log('🔍 [RightPanel] Sending message with record context:', {
        hasCurrentRecord: !!latestRecord,
        recordId: latestRecord?.id,
        recordIdFromUrl,
        isListView,
        listViewSection,
        recordName: latestRecord?.name || latestRecord?.fullName,
        recordType: latestRecordType,
        recordCompany: typeof latestRecord?.company === 'string' ? latestRecord.company : (latestRecord?.company?.name || latestRecord?.companyName),
        recordTitle: latestRecord?.title || latestRecord?.jobTitle,
        recordFieldCount: latestRecord ? Object.keys(latestRecord).length : 0,
        // Also log the hook values for comparison
        hookHasCurrentRecord: !!currentRecord,
        hookRecordId: currentRecord?.id
      });
    
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
      
      // Save to API in background
      const activeConv = conversations.find(c => c.isActive);
      if (activeConv) {
        // Ensure main-chat has an API ID before saving
        if (activeConv.id === 'main-chat') {
          const apiId = await ensureMainChatInAPI();
          if (apiId) {
            saveMessageToAPI(apiId, userMessage);
          }
        } else {
          saveMessageToAPI(activeConv.id, userMessage);
        }
      }
      
      chat.setChatSessions(prev => ({
        ...prev,
        [activeSubApp]: [...(prev[activeSubApp] || []), userMessage]
      }));

      // TEMPORARY: Return simple message instead of processing AI request
      // Extract first name from full name if needed
      let username = user?.firstName || 'there';
      if (!username && user?.name) {
        const nameParts = user.name.trim().split(' ');
        username = nameParts[0] || 'there';
      }
      const simpleResponse: ChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: `Hey, ${username}! I'm adding competitive intelligence to your system. I'll have the Adrata team send you a message when I'm done!`,
        timestamp: new Date()
      };

      // Remove typing indicator if it exists
      setConversations(prev => prev.map(conv => 
        conv.isActive 
          ? { 
              ...conv, 
              messages: conv.messages.filter(msg => msg.content !== 'typing' && msg.content !== 'browsing'),
              lastActivity: new Date()
            }
          : conv
      ));

      // Add the simple response
      setConversations(prev => prev.map(conv => 
        conv.isActive 
          ? { ...conv, messages: [...conv.messages, simpleResponse], lastActivity: new Date() }
          : conv
      ));

      // Save response to API in background
      const activeConv = conversations.find(c => c.isActive);
      if (activeConv) {
        if (activeConv.id === 'main-chat') {
          const apiId = await ensureMainChatInAPI();
          if (apiId) {
            saveMessageToAPI(apiId, simpleResponse);
          }
        } else {
          saveMessageToAPI(activeConv.id, simpleResponse);
        }
      }

      chat.setChatSessions(prev => ({
        ...prev,
        [activeSubApp]: [...(prev[activeSubApp] || []), simpleResponse]
      }));

      scrollToBottom();
      setIsProcessing(false);
      return;

      // Add typing indicator (check if this might be a web research query)
      const isWebResearchQuery = input.toLowerCase().includes('search') || 
                                input.toLowerCase().includes('find') || 
                                input.toLowerCase().includes('look up') ||
                                input.toLowerCase().includes('browse') ||
                                input.toLowerCase().includes('http') ||
                                input.toLowerCase().includes('www.');
      
      const typingMessage: ChatMessage = {
        id: `typing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: isWebResearchQuery ? 'browsing' : 'typing',
        timestamp: new Date(),
        isBrowsing: isWebResearchQuery
      };
      
      setConversations(prev => prev.map(conv => 
        conv.isActive 
          ? { ...conv, messages: [...conv.messages, typingMessage] }
          : conv
      ));

      // Check for Excel import request
      const isExcelImportRequest = input.toLowerCase().includes('import the excel data') || 
                                  input.toLowerCase().includes('start the import process') ||
                                  input.toLowerCase().includes('import excel') ||
                                  input.toLowerCase().includes('import the data');
      
      if (isExcelImportRequest) {
        // Find the most recent Excel file in context
        const excelFile = contextFiles.find(file => 
          file.name.toLowerCase().endsWith('.xlsx') || 
          file.name.toLowerCase().endsWith('.xls')
        );
        
        if (excelFile) {
          // Get the actual file from the file input or recreate it
          const fileInput = fileInputRef.current;
          if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = Array.from(fileInput.files).find(f => f.name === excelFile.name);
            if (file) {
              // Execute the import
              await executeExcelImport(file, {
                autoCreateCompanies: true,
                createConnectionPoints: true,
                skipDuplicates: true
              });
              return;
            }
          }
        }
        
        // If no Excel file found, show error
        chat.addAssistantMessage(
          `❌ **No Excel file found for import**

I couldn't find an Excel file to import. Please:

1. Drag and drop an Excel file (.xlsx or .xls) into the chat area
2. Wait for the AI analysis to complete
3. Then say "Import the Excel data" or "Start the import process"

Make sure the file contains contact/lead data with headers like Name, Email, Company, etc.`,
          activeSubApp
        );
        return;
      }

      // Check for deep value report generation request
      const isReportRequest = input.toLowerCase().includes('deep value report') || 
                             input.toLowerCase().includes('create me a deep value report') ||
                             input.toLowerCase().includes('generate a deep value report');
      
      if (isReportRequest && currentRecord) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 [AI CHAT] Deep value report request detected for record:', currentRecord.id);
        }
        
        // Trigger report generation
        try {
          const report = {
            id: `${currentRecord.id}-deep-value-report-${Date.now()}`,
            title: `Deep Value Report for ${currentRecord.fullName || currentRecord.name || currentRecord.companyName || 'Record'}`,
            type: 'company' as const,
            description: 'Comprehensive deep value analysis',
            category: 'Deep Value Analysis',
            isGenerating: true,
            sourceRecordId: currentRecord.id,
            sourceRecordType: recordType || 'people',
            workspaceId,
            userId
          };

          // Add report generation message
          const reportMessage: ChatMessage = {
            id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'assistant',
            content: `I'll create a comprehensive deep value report for ${currentRecord.fullName || currentRecord.name || currentRecord.companyName || 'this record'}. This will include competitive analysis, market positioning, decision frameworks, and engagement strategies.`,
            timestamp: new Date()
          };

          setConversations(prev => prev.map(conv => 
            conv.isActive 
              ? { ...conv, messages: [...conv.messages, reportMessage] }
              : conv
          ));

          // TODO: Trigger report view in middle panel
          // This would be handled by the parent component or context
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 [AI CHAT] Report generation triggered:', report);
          }
          
          setIsProcessing(false);
          return; // Exit early, don't process as regular chat
        } catch (error) {
          console.error('❌ [AI CHAT] Failed to trigger report generation:', error);
          // Continue with regular chat processing
        }
      }

      // Enhanced AI API call with OpenRouter integration
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 [AI CHAT] Making optimized API call to /api/ai-chat with OpenRouter');
      }
      const startTime = performance.now();
      
      // 🚀 PARTNEROS DETECTION: Determine if we're in PartnerOS mode
      const isPartnerOSMode = typeof window !== 'undefined' && (
        window.location.pathname.includes('/partner-os/') || 
        sessionStorage.getItem('activeSubApp') === 'partneros'
      );
      // Use 'partneros' as appType when in PartnerOS mode, otherwise use activeSubApp
      const effectiveAppType = isPartnerOSMode ? 'partneros' : activeSubApp;
      
      // 🔍 ENHANCED LOGGING: Show what record context is being sent to AI
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 [AI CHAT REQUEST] Sending context to AI:', {
          hasCurrentRecord: !!currentRecord,
          recordType,
          recordId: currentRecord?.id,
          recordName: currentRecord?.name || currentRecord?.fullName,
          recordCompany: currentRecord?.company || currentRecord?.companyName,
          recordTitle: currentRecord?.title || currentRecord?.jobTitle,
          recordWebsite: currentRecord?.website,
          recordIndustry: currentRecord?.industry,
          recordEmployeeCount: currentRecord?.employeeCount || currentRecord?.size,
          recordDescription: currentRecord?.description ? 'Yes' : 'No',
          hasListViewContext: !!listViewContext,
          listViewRecordCount: listViewContext?.visibleRecords?.length || 0,
          currentUrl: window.location.href,
          pathname: window.location.pathname
        });
      }
      
      // 🔍 VISUAL FEEDBACK: Warn user if no record context available on a record page
      const isOnRecordPage = window.location.pathname.match(/\/(companies|people|leads|prospects|opportunities)\/[^/]+$/);
      if (isOnRecordPage && !currentRecord) {
        console.warn('⚠️ [AI CHAT] User is on a record page but no record context is available:', {
          pathname: window.location.pathname,
          hasCurrentRecord: !!currentRecord,
          recordType
        });
      }
      
      // Log what we're sending to the API for debugging
      console.log('📤 [AI RIGHT PANEL] Sending AI chat request:', {
        hasCurrentRecord: !!latestRecord,
        recordType: latestRecordType,
        recordId: latestRecord?.id,
        recordName: latestRecord?.name || latestRecord?.fullName,
        recordCompany: typeof latestRecord?.company === 'string' ? latestRecord.company : (latestRecord?.company?.name || latestRecord?.companyName),
        recordTitle: latestRecord?.title || latestRecord?.jobTitle,
        recordFieldCount: latestRecord ? Object.keys(latestRecord).length : 0,
        message: input.substring(0, 100) + '...',
        // Debug: Show if there's a mismatch between hook and ref
        hookVsRefMatch: latestRecord?.id === currentRecord?.id
      });

      // 🏆 FIX: Use NO trailing slash for API routes
      // Next.js App Router route handlers at app/api/ai-chat/route.ts handle /api/ai-chat (NO trailing slash)
      // Middleware will normalize /api/ai-chat/ → /api/ai-chat if needed
      // This prevents Next.js from redirecting and converting POST to GET
      let apiUrl = '/api/ai-chat';
      
      const requestId = `ai-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 🔍 COMPREHENSIVE DEBUGGING: Log everything about the request
      const fullUrl = typeof window !== 'undefined' ? new URL(apiUrl, window.location.origin).href : apiUrl;
      const debugInfo = {
        // Request details
        url: apiUrl,
        fullUrl,
        method: 'POST',
        requestId,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasTrailingSlash: apiUrl.endsWith('/'),
        originalPath: '/api/ai-chat',
        // Environment details
        windowLocation: typeof window !== 'undefined' ? window.location.href : 'N/A',
        windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        windowPathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
        // Next.js config (if accessible)
        nextConfigTrailingSlash: 'unknown (server-side)',
        // Request will be made to
        finalRequestUrl: fullUrl
      };
      
      console.log('🔍 [AI CHAT DEBUG] STEP 1 - Frontend: Preparing request:', debugInfo);
      console.log('🔍 [AI CHAT DEBUG] STEP 1 - Frontend: Request URL will be:', apiUrl);
      console.log('🔍 [AI CHAT DEBUG] STEP 1 - Frontend: Full URL will be:', fullUrl);
      console.log('🔍 [AI CHAT DEBUG] STEP 1 - Frontend: Method will be: POST');
      console.log('🔍 [AI CHAT DEBUG] STEP 1 - Frontend: Has trailing slash?', apiUrl.endsWith('/'));

      // 🔍 DEBUGGING: Log right before fetch
      console.log('🔍 [AI CHAT DEBUG] STEP 2 - Frontend: About to call fetch:', {
        url: apiUrl,
        method: 'POST',
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const fetchStartTime = performance.now();
      
      // Add timeout to prevent hanging requests (60 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000);
      });
      
      const fetchPromise = fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({
          message: input,
          appType: effectiveAppType,
          workspaceId,
          userId,
          conversationHistory: chatMessages.filter(msg => msg.content !== 'typing' && msg.content !== 'browsing').slice(-3), // Reduced to 3 messages for faster response
          currentRecord: latestRecord, // Use ref to ensure latest value
          recordType: latestRecordType, // Use ref to ensure latest value
          recordIdFromUrl, // 🔧 NEW: Send record ID from URL as fallback
          isListView, // 🔧 NEW: Indicate if on list view
          listViewSection, // 🔧 NEW: Which section list view (leads, prospects, etc.)
          listViewContext: latestListViewContext, // Use ref to ensure latest value
          enableVoiceResponse: false,
          selectedVoiceId: 'default',
          useOpenRouter: true, // Enable OpenRouter intelligent routing
          selectedAIModel, // Pass selected AI model to API
          // Enhanced context for smarter responses
          context: {
            currentUrl: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            sessionId: `session-${Date.now()}`,
            // 🚀 PARTNEROS CONTEXT: Include PartnerOS mode in context
            isPartnerOS: isPartnerOSMode
          },
          // Add page context for better AI awareness
          pageContext: currentPageContext || getPageContext()
        }),
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      const fetchEndTime = performance.now();
      const fetchTime = fetchEndTime - fetchStartTime;
      const responseTime = fetchEndTime - startTime;
      
      // 🔍 COMPREHENSIVE DEBUGGING: Log response details
      console.log('🔍 [AI CHAT DEBUG] STEP 3 - Frontend: Fetch completed:', {
        fetchTime: `${fetchTime.toFixed(2)}ms`,
        totalTime: `${responseTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Enhanced logging: Always log response details, especially in production for debugging
      const responseHeaders = Object.fromEntries(response.headers.entries());
      const responseDetails = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        responseTime: `${responseTime.toFixed(2)}ms`,
        url: response.url, // This will show the final URL after any redirects
        headers: responseHeaders,
        requestId,
        // 🔍 DEBUG: Compare URLs
        originalRequestUrl: apiUrl,
        originalFullUrl: fullUrl,
        finalResponseUrl: response.url,
        urlChanged: response.url !== fullUrl,
        urlChangedFromOriginal: response.url !== apiUrl
      };
      
      console.log('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: Response received:', responseDetails);
      console.log('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: Response status:', response.status);
      console.log('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: Response URL:', response.url);
      console.log('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: Original request URL:', apiUrl);
      console.log('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: URL changed?', response.url !== fullUrl);
      console.log('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: Response headers:', responseHeaders);
      
      // Check for redirects (status 307, 308, or Location header)
      if (response.status === 307 || response.status === 308 || responseHeaders['location']) {
        console.error('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: ⚠️ REDIRECT DETECTED:', {
          status: response.status,
          location: responseHeaders['location'],
          finalUrl: response.url,
          originalUrl: apiUrl,
          originalFullUrl: fullUrl,
          redirectType: response.status === 307 ? 'Temporary' : response.status === 308 ? 'Permanent' : 'Unknown'
        });
      }

      // Validate response before parsing JSON
      if (!response.ok) {
        // Enhanced error logging for 405 errors specifically
        if (response.status === 405) {
          console.error('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: 🚨 HTTP 405 ERROR DETAILS:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            originalUrl: apiUrl,
            originalFullUrl: fullUrl,
            method: 'POST',
            headers: responseHeaders,
            requestId,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            redirectLocation: responseHeaders['location'],
            // Log if URL changed (indicating redirect)
            urlChanged: response.url !== fullUrl,
            urlChangedFromOriginal: response.url !== apiUrl,
            // Check for redirect indicators
            hasLocationHeader: !!responseHeaders['location'],
            isRedirectStatus: response.status === 307 || response.status === 308,
            // Network debugging
            responseType: response.type,
            responseRedirected: response.redirected
          });
          
          // Try to get response body for more info
          try {
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            console.error('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: 405 Error response body:', responseText);
          } catch (e) {
            console.error('🔍 [AI CHAT DEBUG] STEP 4 - Frontend: Could not read 405 error body:', e);
          }
        } else {
          console.error('🚨 [AI CHAT] HTTP Error:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            originalUrl: apiUrl,
            headers: responseHeaders,
            requestId
          });
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response has content
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      // Check if response is HTML (error page) instead of JSON
      if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html')) {
        console.error('Received HTML instead of JSON:', responseText.substring(0, 200));
        throw new Error('Server returned an error page instead of JSON response');
      }

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response text:', responseText);
        throw new Error('Invalid response format from server');
      }
      
      if (data.success) {
        const messagesToAdd: ChatMessage[] = [];
        
        // Handle todos as part of the assistant message
        // 🔧 FIX: Ensure response content exists
        if (!data.response || typeof data.response !== 'string' || data.response.trim() === '') {
          console.error('❌ [AI CHAT] Empty or invalid response content:', { 
            hasResponse: !!data.response, 
            responseType: typeof data.response,
            responseLength: data.response?.length || 0,
            responsePreview: data.response?.substring(0, 100)
          });
          throw new Error('AI response is empty or invalid');
        }
        
        const assistantMessage: ChatMessage = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          isTypewriter: true,
          hasTodos: !!(data['todos'] && data.todos.length > 0),
          todos: data.todos || undefined,
          sources: data.sources || undefined,
          browserResults: data.browserResults || undefined,
          isBrowsing: data.metadata?.hasWebResearch || false,
          // OpenRouter routing information
          routingInfo: data.metadata?.routingInfo,
          cost: data.metadata?.cost,
          model: data.metadata?.model,
          provider: data.metadata?.provider,
          // AI Reasoning data (shows thinking process)
          reasoning: data.reasoning
        };

        // Log routing information for monitoring
        if (data.metadata?.routingInfo && process.env.NODE_ENV === 'development') {
          console.log('🎯 [AI CHAT] Routing info:', {
            model: data.metadata.model,
            provider: data.metadata.provider,
            complexity: data.metadata.routingInfo.complexity,
            cost: data.metadata.cost,
            fallbackUsed: data.metadata.routingInfo.fallbackUsed
          });
        }
        
        messagesToAdd.push(assistantMessage);

        // Check if response indicates a technical issue - clear files if so
        const responseText = assistantMessage.content.toLowerCase();
        if (responseText.includes('brief technical issue') || 
            responseText.includes('technical difficulties') ||
            responseText.includes('technical hiccup')) {
          // Clear context files when technical issues occur
          if (contextFiles.length > 0) {
            setContextFiles([]);
            try {
              if (workspaceId) {
                const storageKey = `adrata-context-files-${workspaceId}`;
                localStorage.removeItem(storageKey);
              }
            } catch (storageError) {
              console.warn('Failed to clear context files:', storageError);
            }
          }
        }

        // Update UI immediately (optimistic update)
        setConversations(prev => prev.map(conv => 
          conv.isActive 
            ? { 
                ...conv, 
                messages: [
                  ...conv.messages.filter(msg => msg.content !== 'typing' && msg.content !== 'browsing'),
                  ...messagesToAdd
                ],
                lastActivity: new Date()
              }
            : conv
        ));
        
        // Save to API in background
        const activeConv = conversations.find(c => c.isActive);
        if (activeConv) {
          // Ensure main-chat has an API ID before saving
          if (activeConv.id === 'main-chat') {
            const apiId = await ensureMainChatInAPI();
            if (apiId) {
              messagesToAdd.forEach(message => {
                saveMessageToAPI(apiId, message);
              });
            }
          } else {
            messagesToAdd.forEach(message => {
              saveMessageToAPI(activeConv.id, message);
            });
          }
        }
        
        chat.setChatSessions(prev => {
          const currentMessages = prev[activeSubApp] || [];
          const withoutTyping = currentMessages.filter(msg => msg.content !== 'typing' && msg.content !== 'browsing');
          return {
            ...prev,
            [activeSubApp]: [...withoutTyping, ...messagesToAdd]
          };
        });

        // Handle navigation response
        if (data.navigation) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🧭 Navigation response received:', data.navigation);
          }
          
          // Navigate after speaking (if voice is enabled) - use in-app navigation
          const navigationDelay = data['voice'] && data.voice.shouldSpeak ? 2000 : 1000;
          setTimeout(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('🚀 Navigating to:', data.navigation.route);
            }
            // Use in-app navigation instead of router.push to prevent new tab opening
            window['location']['href'] = data.navigation.route;
          }, navigationDelay);
        }

        // Voice response handling disabled for now
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('AI API call failed:', error);
      
      // Clear context files on error - they're no longer valid
      if (contextFiles.length > 0) {
        setContextFiles([]);
        // Clear from localStorage - WORKSPACE ISOLATED
        try {
          if (workspaceId) {
            const storageKey = `adrata-context-files-${workspaceId}`;
            localStorage.removeItem(storageKey);
          }
        } catch (storageError) {
          console.warn('Failed to clear context files:', storageError);
        }
      }
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };

      // Update UI immediately (optimistic update)
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
      const activeConv = conversations.find(c => c.isActive);
      if (activeConv) {
        // Ensure main-chat has an API ID before saving
        if (activeConv.id === 'main-chat') {
          const apiId = await ensureMainChatInAPI();
          if (apiId) {
            saveMessageToAPI(apiId, errorMessage);
          }
        } else {
          saveMessageToAPI(activeConv.id, errorMessage);
        }
      }
    } finally {
      setIsProcessing(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rightChatInput.trim() || isProcessing) return;

    const messageToSend = rightChatInput.trim();
    setRightChatInput('');
    setTextareaHeight(182);
    if (textareaRef.current) {
      textareaRef.current['style']['height'] = '182px';
    }
    
    await processMessageWithQueue(messageToSend);
  };

  const handleQuickAction = async (action: string) => {
    await processMessageWithQueue(action);
  };

  // Enhanced record search with smart navigation
  const handleRecordSearch = async (recordName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Smart search for record: ${recordName}`);
    }
    
    // Add a search message to the chat
    const searchMessage = `Searching for "${recordName}"...`;
    await processMessageWithQueue(searchMessage);
  };

  // Smart link generation for records and actions
  const generateSmartLinks = (content: string): string => {
    // Pattern matching for different types of links
    const patterns = {
      // Person records: "John Smith" -> link to person profile
      person: /"([A-Z][a-z]+ [A-Z][a-z]+)"/g,
      // Company records: "Acme Corp" -> link to company profile  
      company: /"([A-Z][a-z]+(?: [A-Z][a-z]+)*)"/g,
      // Email addresses: "john@company.com" -> link to person
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      // Phone numbers: "(555) 123-4567" -> link to contact
      phone: /(\([0-9]{3}\) [0-9]{3}-[0-9]{4})/g,
      // URLs: "https://company.com" -> external link
      url: /(https?:\/\/[^\s]+)/g
    };

    let enhancedContent = content;

    // Replace person names with clickable links
    enhancedContent = enhancedContent.replace(patterns.person, (match, name) => {
      return `[${name}](/people?search=${encodeURIComponent(name)})`;
    });

    // Replace company names with clickable links
    enhancedContent = enhancedContent.replace(patterns.company, (match, name) => {
      return `[${name}](/companies?search=${encodeURIComponent(name)})`;
    });

    // Replace email addresses with clickable links
    enhancedContent = enhancedContent.replace(patterns.email, (match, email) => {
      return `[${email}](/people?search=${encodeURIComponent(email)})`;
    });

    // Replace phone numbers with clickable links
    enhancedContent = enhancedContent.replace(patterns.phone, (match, phone) => {
      return `[${phone}](/people?search=${encodeURIComponent(phone)})`;
    });

    return enhancedContent;
  };

  // Render based on view mode
  if (viewMode === 'actions') {
    return (
      <AIActionsView 
        actions={aiActions}
        onBack={() => setViewMode('ai')}
      />
    );
  }

  if (viewMode === 'achievements') {
    return (
      <TeamWinsView 
        wins={teamWins}
        onBack={() => setViewMode('ai')}
      />
    );
  }

  if (viewMode === 'targets') {
    return (
      <div className="bg-background flex flex-col" style={{ 
        minWidth: '300px',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      }}>
        <ConversationHeader
          conversations={[{ id: 'targets', title: 'Targets', messages: [], lastActivity: new Date(), isActive: true }]}
          activeConversationId="targets"
          showConversationHistory={false}
          showMenuPopup={showMenuPopup}
          onSwitchConversation={() => {}}
          onCreateNewConversation={() => {}}
          onToggleConversationHistory={() => {}}
          onToggleMenuPopup={() => setShowMenuPopup(!showMenuPopup)}
          onCloseConversation={() => {}}
          onSetViewMode={(mode) => {
            setViewMode(mode);
            setShowMenuPopup(false);
          }}
          onClosePanel={() => ui.toggleRightPanel()}
          menuPopupRef={menuPopupRef}
          conversationHistoryRef={conversationHistoryRef}
          onToggleLeftPanel={ui.toggleLeftPanel}
        />
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">50</div>
              <div className="text-sm text-muted">Contacts</div>
            </div>
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">4</div>
              <div className="text-sm text-muted">Meetings</div>
            </div>
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">25</div>
              <div className="text-sm text-muted">Emails</div>
            </div>
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">15</div>
              <div className="text-sm text-muted">Calls</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-hover rounded-lg">
              <div className="font-medium text-foreground mb-1">Follow up on recent outreach</div>
              <div className="text-sm text-muted mb-2">Check responses and prioritize hot leads</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">High priority</span>
                <span className="text-sm font-medium text-foreground">30m</span>
              </div>
            </div>
            <div className="p-4 bg-hover rounded-lg">
              <div className="font-medium text-foreground mb-1">Book 4 more meetings</div>
              <div className="text-sm text-muted mb-2">Convert warm leads into scheduled meetings</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">High priority</span>
                <span className="text-sm font-medium text-foreground">60m</span>
              </div>
            </div>
            <div className="p-4 bg-hover rounded-lg">
              <div className="font-medium text-foreground mb-1">Send LinkedIn connections</div>
              <div className="text-sm text-muted mb-2">Connect with decision makers from target companies</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">Medium priority</span>
                <span className="text-sm font-medium text-foreground">20m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'calendar') {
    return (
      <div className="bg-background flex flex-col" style={{ 
        minWidth: '300px',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      }}>
        <ConversationHeader
          conversations={[{ id: 'calendar', title: 'Calendar', messages: [], lastActivity: new Date(), isActive: true }]}
          activeConversationId="calendar"
          showConversationHistory={false}
          showMenuPopup={showMenuPopup}
          onSwitchConversation={() => {}}
          onCreateNewConversation={() => {}}
          onToggleConversationHistory={() => {}}
          onToggleMenuPopup={() => setShowMenuPopup(!showMenuPopup)}
          onCloseConversation={() => {}}
          onSetViewMode={(mode) => {
            setViewMode(mode);
            setShowMenuPopup(false);
          }}
          onClosePanel={() => ui.toggleRightPanel()}
          menuPopupRef={menuPopupRef}
          conversationHistoryRef={conversationHistoryRef}
          onToggleLeftPanel={ui.toggleLeftPanel}
        />
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">0</div>
              <div className="text-sm text-muted">Meetings</div>
            </div>
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">10h</div>
              <div className="text-sm text-muted">Available</div>
            </div>
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">2</div>
              <div className="text-sm text-muted">Focus Blocks</div>
            </div>
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">0h</div>
              <div className="text-sm text-muted">In Meetings</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-hover rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-foreground">9:00 AM - 11:00 AM</span>
              </div>
              <div className="text-sm text-muted mb-1">Focus Block - Prospecting</div>
              <div className="text-xs text-muted">Available</div>
            </div>
            <div className="p-4 bg-hover rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-foreground">2:00 PM - 4:00 PM</span>
              </div>
              <div className="text-sm text-muted mb-1">Focus Block - Follow-ups</div>
              <div className="text-xs text-muted">Available</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'insights') {
    return (
      <div className="bg-background flex flex-col" style={{ 
        minWidth: '300px',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      }}>
        <ConversationHeader
          conversations={[{ id: 'insights', title: 'Insights', messages: [], lastActivity: new Date(), isActive: true }]}
          activeConversationId="insights"
          showConversationHistory={false}
          showMenuPopup={showMenuPopup}
          onSwitchConversation={() => {}}
          onCreateNewConversation={() => {}}
          onToggleConversationHistory={() => {}}
          onToggleMenuPopup={() => setShowMenuPopup(!showMenuPopup)}
          onCloseConversation={() => {}}
          onSetViewMode={(mode) => {
            setViewMode(mode);
            setShowMenuPopup(false);
          }}
          onClosePanel={() => ui.toggleRightPanel()}
          menuPopupRef={menuPopupRef}
          conversationHistoryRef={conversationHistoryRef}
          onToggleLeftPanel={ui.toggleLeftPanel}
        />
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">12</div>
              <div className="text-sm text-muted">Fresh Insights</div>
            </div>
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">8</div>
              <div className="text-sm text-muted">Industry Trends</div>
            </div>
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">5</div>
              <div className="text-sm text-muted">Competitive Intel</div>
            </div>
            <div className="text-center p-4 bg-hover rounded-lg">
              <div className="text-2xl font-semibold text-foreground">2h ago</div>
              <div className="text-sm text-muted">Last Updated</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-hover rounded-lg">
              <div className="font-medium text-foreground mb-1">Retail grocery sector showing strong growth</div>
              <div className="text-sm text-muted mb-2">Companies like Dierbergs Markets expanding operations</div>
              <div className="text-xs text-muted">2h ago</div>
            </div>
            <div className="p-4 bg-hover rounded-lg">
              <div className="font-medium text-foreground mb-1">Technology adoption accelerating in food retail</div>
              <div className="text-sm text-muted mb-2">Focus on digital transformation and automation</div>
              <div className="text-xs text-muted">4h ago</div>
            </div>
            <div className="p-4 bg-hover rounded-lg">
              <div className="font-medium text-foreground mb-1">Supply chain optimization trending</div>
              <div className="text-sm text-muted mb-2">Companies investing in logistics and efficiency</div>
              <div className="text-xs text-muted">6h ago</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .ai-panel-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .ai-panel-scroll::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .ai-panel-scroll::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 4px;
        }
        .ai-panel-scroll::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        
        /* Middle panel scrollbar styling */
        .middle-panel-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .middle-panel-scroll::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .middle-panel-scroll::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        .middle-panel-scroll::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
      <div className="bg-background flex flex-col relative" style={{ 
        minWidth: '300px',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      }}>
      
      {/* Only show main header when in AI chat mode */}
      {!showDirectMessagesList && !showDMChat && (
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
          onSetViewMode={setViewMode}
          onClosePanel={() => ui.toggleRightPanel()}
          onReorderConversations={handleReorderConversations}
          menuPopupRef={menuPopupRef}
          conversationHistoryRef={conversationHistoryRef}
          showChatIcon={!pathname.includes('/oasis')}
          onToggleDirectMessages={() => {
            setShowDirectMessagesList(true);
            loadDMs();
          }}
          // Only show hamburger menu in full screen chat experience (like /pinpoint/adrata)
          // Regular right panel views (like stacks) should not show it
          onToggleLeftPanel={pathname.includes('/pinpoint/adrata') ? ui.toggleLeftPanel : undefined}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {showDMChat ? (
          <DMChatInterface
            selectedDM={selectedDM}
            onBack={() => {
              setShowDMChat(false);
              setSelectedDM(null);
            }}
          />
        ) : showDirectMessagesList ? (
          <DirectMessagesList
            dms={dms}
            loading={dmsLoading}
            onSelectDM={(dm) => {
              setSelectedDM(dm);
              setShowDMChat(true);
            }}
            onBack={() => setShowDirectMessagesList(false)}
          />
        ) : (
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

            {/* Messages at top when there are messages */}
            {chatMessages['length'] > 0 && (
              <div className="flex-1 flex flex-col">
                {/* 🔍 CONTEXT WARNING BANNER: Show when on record page but no context available */}
                {(() => {
                  const isOnRecordPage = typeof window !== 'undefined' && 
                    window.location.pathname.match(/\/(companies|people|leads|prospects|opportunities)\/[^/]+$/);
                  const hasRecordContext = !!currentRecord;
                  
                  if (isOnRecordPage && !hasRecordContext) {
                    return (
                      <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1 text-sm">
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                              Limited Context Available
                            </p>
                            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                              The AI is responding without full record context. For better insights about this specific record, try refreshing the page or asking about general strategies.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <MessageList
                  messages={chatMessages}
                  chatEndRef={chatEndRef}
                  onUpdateChatSessions={chat.setChatSessions}
                  activeSubApp={activeSubApp}
                  onRecordSearch={handleRecordSearch}
                  scrollToBottom={scrollToBottom}
                />
              </div>
            )}

            {/* Welcome section at bottom when no messages */}
            {chatMessages['length'] === 0 && (
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
        )}
      </div>

      {/* Only show ChatInput when not in DM views */}
      {!showDirectMessagesList && !showDMChat && (
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
          chatHistory={chatMessages.filter(msg => msg['type'] === 'user').map(msg => msg.content).slice(-20)} // Last 20 user messages
          onLogVoiceConversation={(messages) => {
            // Log voice conversation to chat
            messages.forEach((message) => {
              const chatMessage = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                type: message.role === 'user' ? 'user' : 'assistant',
                content: message.content,
                timestamp: new Date().toISOString(),
                workspaceId: workspaceId
              };
              setChatMessages(prev => [...prev, chatMessage]);
            });
            scrollToBottom();
          }}
          onVoiceModeClick={() => {
            if (isVoiceModeActive) {
              // Turn off voice mode completely
              setIsVoiceModeActive(false);
              setShowVoiceModal(false);
              if (backgroundRecognition) {
                backgroundRecognition.stop();
                setBackgroundRecognition(null);
              }
            } else {
              // Turn on voice mode and show modal
              setShowVoiceModal(true);
              setIsVoiceModeActive(true);
            }
          }}
          isVoiceModeActive={isVoiceModeActive}
          isModalListening={isModalListening}
        />
      )}

      {/* Voice Mode Modal */}
      <VoiceModeModal
        isOpen={showVoiceModal}
        onClose={() => {
          setShowVoiceModal(false);
          setIsModalListening(false);
          // Keep voice mode active, background listening will start
          // Don't set isVoiceModeActive to false
        }}
        onLogToChat={(messages) => {
          // Log voice conversation to chat
          const chatMessages: ChatMessage[] = messages.map((message) => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: message.role === 'user' ? 'user' : 'assistant',
            content: message.content,
            timestamp: new Date(),
            workspaceId: workspaceId
          }));

          // Add messages to active conversation
          setConversations(prev => prev.map(conv => 
            conv.isActive 
              ? { 
                  ...conv, 
                  messages: [...conv.messages, ...chatMessages],
                  lastActivity: new Date()
                }
              : conv
          ));
          
          scrollToBottom();
        }}
        processMessageWithQueue={processMessageWithQueue}
        onListeningChange={(listening) => setIsModalListening(listening)}
      />

      </div>

      {/* Background listening indicator */}
      {isBackgroundListening && !showVoiceModal && (
        <div className="fixed bottom-24 right-8 z-50 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg shadow-md">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-blue-700 font-medium">Listening...</span>
        </div>
      )}

    </>
  );
}