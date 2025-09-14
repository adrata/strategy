"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useRecordContext } from "@/platform/ui/context/RecordContextProvider";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { QUICK_ACTIONS } from "@/platform/config";
import { ChatQueueManager } from "./ChatQueueManager";
import { AI_MODELS, type AIModel } from './AIModelSelector';
import { RecordUpdateService } from '@/platform/services/record-update-service';
import { CoreSignalChatHandler } from './CoreSignalChatHandler';
import { useRouter } from 'next/navigation';
import { elevenLabsVoice } from '@/platform/services/elevenlabs-voice';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Import modular components
import { ConversationHeader } from './ConversationHeader';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { WelcomeSection } from './WelcomeSection';
import { AIActionsView } from './AIActionsView';
import { TeamWinsView } from './TeamWinsView';

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
 * 🤖 AI RIGHT PANEL - MODULAR VERSION
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
export function AIRightPanel() {
  const { ui, chat } = useAcquisitionOS();
  const router = useRouter();
  
  // Utility function for file size formatting
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const { currentRecord, recordType } = useRecordContext();
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
    return AI_MODELS[0] || { id: 'adrata-advanced', name: 'Adrata Advanced', provider: 'Adrata' };
  });

  // Voice settings disabled for now
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('default');

  const { activeSubApp } = ui;

  // Voice functionality disabled for now - will be implemented properly later

  // Core state
  const [rightChatInput, setRightChatInput] = useState("");
  const [isPersonFinderMinimized, setIsPersonFinderMinimized] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(182);
  const [viewMode, setViewMode] = useState<'ai' | 'conversations' | 'chat' | 'actions' | 'achievements' | 'targets' | 'calendar' | 'insights'>('ai');
  
  // Conversation management with persistence
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('adrata-conversations');
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
  const [activeConversationId, setActiveConversationId] = useState('main-chat');
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  
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
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('adrata-context-files');
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
    if (typeof window !== 'undefined' && conversations.length > 0) {
      try {
        localStorage.setItem('adrata-conversations', JSON.stringify(conversations));
        console.log('💾 [CHAT] Saved conversations to localStorage:', conversations.length);
      } catch (error) {
        console.warn('Failed to save conversations to localStorage:', error);
      }
    }
  }, [conversations]);

  // Load conversations from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('adrata-conversations');
        if (stored) {
          const parsed = JSON.parse(stored);
          const restoredConversations = parsed.map((conv: any) => ({
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
          console.log('📂 [CHAT] Loaded conversations from localStorage:', restoredConversations.length);
        }
      } catch (error) {
        console.warn('Failed to load stored conversations:', error);
      }
    }
  }, []);

  
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
    console.log('🤖 [AI RIGHT PANEL] generateContextualActions called with:', { 
      record: record ? { id: record.id, name: record.name || record.fullName } : null, 
      recordType,
      activeSubApp 
    });
    
    if (!record) {
      console.log('🤖 [AI RIGHT PANEL] No record, returning generic actions');
      return QUICK_ACTIONS[activeSubApp] || QUICK_ACTIONS["Speedrun"] || [];
    }
    
    const actions: string[] = [];
    const name = record.fullName || record.name || 'this prospect';
    const company = record.company || record.companyName || 'their company';
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
        // Account-specific actions focused on expansion
        actions.push(`What's ${company}'s current relationship with us?`);
        actions.push(`Find expansion opportunities at ${company}`);
        actions.push(`Who else should I be talking to at ${company}?`);
        actions.push(`What's ${name}'s influence on buying decisions?`);
        break;
        
      case 'people':
        // Contact-specific actions focused on relationship building
        actions.push(`What's ${name}'s role and influence at ${company}?`);
        actions.push(`How can I leverage my relationship with ${name}?`);
        actions.push(`Who does ${name} report to at ${company}?`);
        actions.push(`What's the best way to stay in touch with ${name}?`);
        break;
        
      default:
        // Generic actions
        actions.push(`What should I know about ${name} before calling?`);
        actions.push(`Find ${company}'s biggest challenges right now`);
        actions.push(`Research ${name}'s background and role`);
        actions.push(`Draft a compelling message for ${name}`);
    }
    
    // Role-specific intelligence gathering (applies to all types)
    if (title?.toLowerCase().includes('vp') || title?.toLowerCase().includes('vice president')) {
      actions.push(`How do VPs like ${name} typically evaluate solutions?`);
    } else if (title?.toLowerCase().includes('director') || title?.toLowerCase().includes('manager')) {
      actions.push(`What problems does a ${title} at ${company} face daily?`);
    } else if (title?.toLowerCase().includes('cto') || title?.toLowerCase().includes('cio') || title?.toLowerCase().includes('technology')) {
      actions.push(`What's ${company}'s current tech stack and roadmap?`);
    } else if (title?.toLowerCase().includes('ceo') || title?.toLowerCase().includes('president')) {
      actions.push(`What are ${name}'s strategic priorities for ${company}?`);
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

  const createNewConversation = () => {
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
    if (conversations.length > 1) {
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      const conv = conversations.find(c => c['id'] === conversationId);
      if (conv?.isActive && conversations.length > 1) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        setActiveConversationId(remaining[0]?.id || 'main-chat');
      }
    }
  };

  const getWelcomeMessage = (app: string): string => {
    console.log('🤖 [AI RIGHT PANEL] getWelcomeMessage called with:', { 
      app, 
      currentRecord: currentRecord ? { id: currentRecord.id, name: currentRecord.name || currentRecord.fullName } : null, 
      recordType 
    });
    
    if (currentRecord && recordType) {
      const recordName = currentRecord.name || currentRecord.fullName || 
                        (currentRecord['firstName'] && currentRecord.lastName ? `${currentRecord.firstName} ${currentRecord.lastName}` : '') ||
                        currentRecord.companyName || 'this record';
      
      const company = currentRecord.company || currentRecord.companyName || 'their company';
      const title = currentRecord.title || currentRecord.jobTitle || 'their role';
      const status = currentRecord.status || 'new';
      const priority = currentRecord.priority || 'medium';
      
      // Generate contextual welcome message based on record type and data
      switch (recordType) {
        case 'leads':
          return `Ready to convert ${recordName} at ${company}? This ${title} is ${status} with ${priority} priority. Let's make it happen.`;
        case 'prospects':
          return `Time to advance ${recordName} at ${company}. This ${title} is engaged and ready to buy. Let's close it.`;
        case 'opportunities':
          return `Closing time for ${company}. ${recordName} (${title}) is ready to sign. Let's seal the deal.`;
        case 'companies':
          return `Expanding ${company} with ${recordName}. This ${title} is your key to growth. Let's scale up.`;
        case 'people':
          return `Leveraging ${recordName} at ${company}. This ${title} opens doors. Let's unlock opportunities.`;
        default:
          return `Working with ${recordName} at ${company}. This ${title} matters. Let's make it count.`;
      }
    }

    const activeConv = getActiveConversation();
    if (activeConv?.welcomeMessage && activeConv['messages']['length'] === 0) {
      return activeConv.welcomeMessage;
    }

    if (activeConv?.id === 'main-chat') {
      const isPipelineContext = typeof window !== 'undefined' && (window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/leads') || window.location.pathname.includes('/opportunities') || window.location.pathname.includes('/companies') || window.location.pathname.includes('/people') || window.location.pathname.includes('/partners') || window.location.pathname.includes('/prospects') || window.location.pathname.includes('/sellers') || window.location.pathname.includes('/customers') || window.location.pathname.includes('/metrics') || window.location.pathname.includes('/speedrun'));
      
      switch (app) {
        case "Speedrun":
          return "Welcome to Adrata! I'm here to help you maximize your sales success. Let's turn those leads into revenue together.";
        case "pipeline":
          return "Welcome to Adrata! I'm here to help you optimize your pipeline and close more deals. How can I assist you today?";
        case "monaco":
          return "Welcome to Adrata! I have **14 strategic accounts** loaded with executive buyer group intelligence. Let's turn this data into deals.";
        default:
          return isPipelineContext 
            ? "Welcome to Adrata! I'm your intelligent sales assistant, ready to help you close more opportunities. What would you like to work on today?"
            : "Welcome to Adrata! I'm your intelligent sales assistant, ready to help you close more opportunities. What would you like to work on today?";
      }
    }

    return activeConv?.welcomeMessage || "Ready to help you succeed! What would you like to work on today?";
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

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }, 0);
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
        // Persist to localStorage
        try {
          localStorage.setItem('adrata-context-files', JSON.stringify(updated));
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
        
        console.log(`📄 [FILE HANDLER] Parsed ${file.name}:`, parsedDoc);
        
        // Store document data in chat context for later processing
        chat.storeDocumentData(file.name, parsedDoc, activeSubApp);
        
        // Generate contextual response based on file type and content
        let responseMessage = '';
        
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

  // Message processing
  const processMessageWithQueue = async (input: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'user',
        content: input,
        timestamp: new Date()
      };
      
      setConversations(prev => prev.map(conv => 
        conv.isActive 
          ? { ...conv, messages: [...conv.messages, userMessage] }
          : conv
      ));
      
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

      // Call AI API
      console.log('🤖 [AI CHAT] Making API call to /api/ai-chat with POST method');
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          message: input,
          appType: activeSubApp,
          workspaceId,
          userId,
          conversationHistory: chatMessages.filter(msg => msg.content !== 'typing').slice(-10),
          currentRecord,
          recordType,
          enableVoiceResponse: false,
          selectedVoiceId: 'default'
        }),
      });

      console.log('🤖 [AI CHAT] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Validate response before parsing JSON
      if (!response.ok) {
        console.error('🚨 [AI CHAT] HTTP Error:', response.status, response.statusText);
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
        const assistantMessage: ChatMessage = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          isTypewriter: true,
          hasTodos: !!(data['todos'] && data.todos.length > 0),
          todos: data.todos || undefined
        };
        
        messagesToAdd.push(assistantMessage);

        setConversations(prev => prev.map(conv => 
          conv.isActive 
            ? { 
                ...conv, 
                messages: [
                  ...conv.messages.filter(msg => msg.content !== 'typing'),
                  ...messagesToAdd
                ]
              }
            : conv
        ));
        
        chat.setChatSessions(prev => {
          const currentMessages = prev[activeSubApp] || [];
          const withoutTyping = currentMessages.filter(msg => msg.content !== 'typing');
          return {
            ...prev,
            [activeSubApp]: [...withoutTyping, ...messagesToAdd]
          };
        });

        // Handle navigation response
        if (data.navigation) {
          console.log('🧭 Navigation response received:', data.navigation);
          
          // Navigate after speaking (if voice is enabled) - use in-app navigation
          const navigationDelay = data['voice'] && data.voice.shouldSpeak ? 2000 : 1000;
          setTimeout(() => {
            console.log('🚀 Navigating to:', data.navigation.route);
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
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };

      setConversations(prev => prev.map(conv => 
        conv.isActive 
          ? { 
              ...conv, 
              messages: [
                ...conv.messages.filter(msg => msg.content !== 'typing'),
                errorMessage
              ]
            }
          : conv
      ));
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

  // Handle record search from clickable links
  const handleRecordSearch = async (recordName: string) => {
    console.log(`🔍 Searching for record: ${recordName}`);
    
    // Add a search message to the chat
    const searchMessage = `Searching for "${recordName}"...`;
    await processMessageWithQueue(searchMessage);
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
      <div className="bg-[var(--background)] flex flex-col" style={{ 
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
        />
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">50</div>
              <div className="text-sm text-[var(--muted)]">Contacts</div>
            </div>
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">4</div>
              <div className="text-sm text-[var(--muted)]">Meetings</div>
            </div>
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">25</div>
              <div className="text-sm text-[var(--muted)]">Emails</div>
            </div>
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">15</div>
              <div className="text-sm text-[var(--muted)]">Calls</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="font-medium text-[var(--foreground)] mb-1">Follow up on recent outreach</div>
              <div className="text-sm text-[var(--muted)] mb-2">Check responses and prioritize hot leads</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--muted)]">High priority</span>
                <span className="text-sm font-medium text-[var(--foreground)]">30m</span>
              </div>
            </div>
            <div className="p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="font-medium text-[var(--foreground)] mb-1">Book 4 more meetings</div>
              <div className="text-sm text-[var(--muted)] mb-2">Convert warm leads into scheduled meetings</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--muted)]">High priority</span>
                <span className="text-sm font-medium text-[var(--foreground)]">60m</span>
              </div>
            </div>
            <div className="p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="font-medium text-[var(--foreground)] mb-1">Send LinkedIn connections</div>
              <div className="text-sm text-[var(--muted)] mb-2">Connect with decision makers from target companies</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--muted)]">Medium priority</span>
                <span className="text-sm font-medium text-[var(--foreground)]">20m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'calendar') {
    return (
      <div className="bg-[var(--background)] flex flex-col" style={{ 
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
        />
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">0</div>
              <div className="text-sm text-[var(--muted)]">Meetings</div>
            </div>
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">10h</div>
              <div className="text-sm text-[var(--muted)]">Available</div>
            </div>
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">2</div>
              <div className="text-sm text-[var(--muted)]">Focus Blocks</div>
            </div>
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">0h</div>
              <div className="text-sm text-[var(--muted)]">In Meetings</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-[var(--foreground)]">9:00 AM - 11:00 AM</span>
              </div>
              <div className="text-sm text-[var(--muted)] mb-1">Focus Block - Prospecting</div>
              <div className="text-xs text-[var(--muted)]">Available</div>
            </div>
            <div className="p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-[var(--foreground)]">2:00 PM - 4:00 PM</span>
              </div>
              <div className="text-sm text-[var(--muted)] mb-1">Focus Block - Follow-ups</div>
              <div className="text-xs text-[var(--muted)]">Available</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'insights') {
    return (
      <div className="bg-[var(--background)] flex flex-col" style={{ 
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
        />
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">12</div>
              <div className="text-sm text-[var(--muted)]">Fresh Insights</div>
            </div>
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">8</div>
              <div className="text-sm text-[var(--muted)]">Industry Trends</div>
            </div>
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">5</div>
              <div className="text-sm text-[var(--muted)]">Competitive Intel</div>
            </div>
            <div className="text-center p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--foreground)]">2h ago</div>
              <div className="text-sm text-[var(--muted)]">Last Updated</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="font-medium text-[var(--foreground)] mb-1">Retail grocery sector showing strong growth</div>
              <div className="text-sm text-[var(--muted)] mb-2">Companies like Dierbergs Markets expanding operations</div>
              <div className="text-xs text-[var(--muted)]">2h ago</div>
            </div>
            <div className="p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="font-medium text-[var(--foreground)] mb-1">Technology adoption accelerating in food retail</div>
              <div className="text-sm text-[var(--muted)] mb-2">Focus on digital transformation and automation</div>
              <div className="text-xs text-[var(--muted)]">4h ago</div>
            </div>
            <div className="p-4 bg-[var(--hover-bg)] rounded-lg">
              <div className="font-medium text-[var(--foreground)] mb-1">Supply chain optimization trending</div>
              <div className="text-sm text-[var(--muted)] mb-2">Companies investing in logistics and efficiency</div>
              <div className="text-xs text-[var(--muted)]">6h ago</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)] flex flex-col" style={{ 
      minWidth: '300px',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden'
    }}>
      
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
        menuPopupRef={menuPopupRef}
        conversationHistoryRef={conversationHistoryRef}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 px-6 py-0 overflow-y-auto" style={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          
          {chatMessages['length'] === 0 && (
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
          )}

          <ChatQueueManager 
            onProcessNext={async (query) => {
              await processMessageWithQueue(query);
            }}
          />

        <MessageList
          messages={chatMessages}
          chatEndRef={chatEndRef}
          onUpdateChatSessions={chat.setChatSessions}
          activeSubApp={activeSubApp}
          onRecordSearch={handleRecordSearch}
        />
        </div>
      </div>

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
      />
    </div>
  );
}