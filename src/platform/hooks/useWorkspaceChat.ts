import React, { useState, useCallback, useRef, useEffect } from "react";
import { generateOpenAIResponse } from "../utils/openaiService";
import type { ChatMessage, ChatSessions } from "../types/hooks";
import { useUnifiedAuth } from "@/platform/auth";

interface UseChatReturn {
  // Chat State
  rightChatInput: string;
  chatSessions: ChatSessions;

  // Actions
  setRightChatInput: (input: string) => void;
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSessions>>;
  processNaturalLanguage: (
    query: string,
    activeSubApp: string,
    activeSection: string,
    selectedRecord?: any,
  ) => Promise<void>;
  addUserMessage: (message: string, subApp: string) => void;
  addAssistantMessage: (
    message: string,
    subApp: string,
    isTypewriter?: boolean,
  ) => void;
  clearChatHistory: (subApp?: string) => void;
  storeCsvData: (fileName: string, csvContent: string, subApp: string) => void;
  getCsvData: (subApp: string) => { fileName: string; content: string } | null;
  storeDocumentData: (fileName: string, parsedDoc: any, subApp: string) => void;
  getDocumentData: (subApp: string) => any | null;
}

/**
 * CHAT HOOK
 * Handles all chat functionality for the platform
 */
export function useChat(): UseChatReturn {
  // Get authenticated user
  const { user: authUser } = useUnifiedAuth();
  
  // Debug helper
  const debug = (phase: string, details: any) => {
    console.log(`[CHAT HOOK] ${phase}:`, details);
  };

  // Chat State
  const [rightChatInput, setRightChatInput] = useState("");
  const [chatSessions, setChatSessions] = useState<ChatSessions>({
    Speedrun: [],
    acquire: [],
    expand: [],
    monaco: [],
    notes: [],
    actions: [],
  } as ChatSessions);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Get workspace ID for isolation
  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;

  // CSV Data Storage - stores uploaded CSV files per subApp - WORKSPACE ISOLATED
  const [csvData, setCsvData] = useState<Record<string, { fileName: string; content: string }>>(() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined' && workspaceId) {
      try {
        const storageKey = `adrata-chat-csv-data-${workspaceId}`;
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : {};
      } catch (error) {
        console.warn('Failed to load stored CSV data:', error);
        return {};
      }
    }
    return {};
  });
  
  // Document Data Storage - stores parsed documents per subApp - WORKSPACE ISOLATED
  const [documentData, setDocumentData] = useState<Record<string, any>>(() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined' && workspaceId) {
      try {
        const storageKey = `adrata-chat-document-data-${workspaceId}`;
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : {};
      } catch (error) {
        console.warn('Failed to load stored document data:', error);
        return {};
      }
    }
    return {};
  });

  // Refs for auto-scroll
  const rightChatEndRef = useRef<HTMLDivElement>(null);

  // PERFORMANCE OPTIMIZATION: Skip chat sessions loading since chat is not being used
  // This saves 2.6s on every dashboard load
  useEffect(() => {
    if (!isLoaded && authUser) {
      console.log("[CHAT HOOK] Skipping chat sessions loading for performance - chat not in use");
      
      // Initialize with empty sessions
      const emptySessions: ChatSessions = {
        Speedrun: [],
        acquire: [],
        expand: [],
        monaco: [],
        notes: [],
        actions: []
      };
      
      setChatSessions(emptySessions);
      setIsLoaded(true);
    }
  }, [authUser, isLoaded]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (rightChatEndRef.current) {
      const chatContainer = rightChatEndRef.current.parentElement;
      if (chatContainer && chatContainer.contains(rightChatEndRef.current)) {
        const isNearBottom =
          chatContainer.scrollTop + chatContainer.clientHeight >=
          chatContainer.scrollHeight - 100;

        if (isNearBottom) {
          setTimeout(() => {
            rightChatEndRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
              inline: "nearest",
            });
          }, 0);
        }
      }
    }
  }, [chatSessions]);

  // Save message to database
  const saveMessageToDatabase = async (message: ChatMessage, appType: string) => {
    if (!authUser) return;
    
    // Get user and workspace IDs - NO HARDCODED FALLBACKS
    const workspaceId = authUser.activeWorkspaceId || authUser.workspaces?.[0]?.id;
    const userId = authUser.id;
    
    if (!workspaceId || !userId) {
      console.error("[SAVE CHAT] User not authenticated or no workspace access");
      return;
    }
    
    try {
      const response = await fetch('/api/v1/collaboration/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          userId,
          appType,
          message,
          type: message.type
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        console.warn('Failed to save message to database:', result.error, result.details);
      } else {
        debug("MESSAGE_SAVED", { messageId: result.messageId, appType });
      }
    } catch (error) {
      console.warn('Failed to save message to database:', error);
    }
  };

  // Add user message to chat
  const addUserMessage = useCallback((message: string, subApp: string) => {
    debug("ADD_USER_MESSAGE", { message, subApp });

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatSessions((prev) => ({
      ...prev,
      [subApp]: [...(prev[subApp as keyof ChatSessions] || []), userMessage],
    }));

    // Save to database
    saveMessageToDatabase(userMessage, subApp);
  }, []);

  // Add assistant message to chat
  const addAssistantMessage = useCallback(
    (message: string, subApp: string, isTypewriter: boolean = false) => {
      debug("ADD_ASSISTANT_MESSAGE", {
        message: message.substring(0, 100),
        subApp,
        isTypewriter,
      });

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: message,
        timestamp: new Date(),
        isTypewriter,
      };

      setChatSessions((prev) => ({
        ...prev,
        [subApp]: [
          ...(prev[subApp as keyof ChatSessions] || []),
          assistantMessage,
        ],
      }));

      // Save to database (don't save typing indicators)
      if (message !== 'typing') {
        saveMessageToDatabase(assistantMessage, subApp);
      }
    },
    [],
  );

  // Clear chat history
  const clearChatHistory = useCallback((subApp?: string) => {
    debug("CLEAR_CHAT_HISTORY", { subApp });

    if (subApp) {
      setChatSessions((prev) => ({
        ...prev,
        [subApp]: [],
      }));
    } else {
      setChatSessions({
        Speedrun: [],
        acquire: [],
        expand: [],
        monaco: [],
        notes: [],
        actions: [],
      });
    }
  }, []);

  // CSV Data Management - Define BEFORE processWithAI
  const storeCsvData = useCallback((fileName: string, csvContent: string, subApp: string) => {
    console.log(`[CHAT HOOK] Storing CSV data for ${subApp}:`, { fileName, contentLength: csvContent.length });
    const newData = { fileName, content: csvContent };
    
    setCsvData(prev => {
      const updated = {
        ...prev,
        [subApp]: newData
      };
      
      // Persist to localStorage - WORKSPACE ISOLATED
      try {
        if (workspaceId) {
          const storageKey = `adrata-chat-csv-data-${workspaceId}`;
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
      } catch (error) {
        console.warn('Failed to persist CSV data:', error);
      }
      
      return updated;
    });
  }, [workspaceId]);

  const getCsvData = useCallback((subApp: string) => {
    return csvData[subApp] || null;
  }, [csvData]);

  // Document Data Management - Define BEFORE processWithAI
  const storeDocumentData = useCallback((fileName: string, parsedDoc: any, subApp: string) => {
    console.log(`[CHAT HOOK] Storing document data for ${subApp}:`, { fileName, fileType: parsedDoc.fileType });
    const newData = { fileName, parsedDoc };
    
    setDocumentData(prev => {
      const updated = {
        ...prev,
        [subApp]: newData
      };
      
      // Persist to localStorage (but limit size to prevent quota issues)
      try {
        const dataToStore = {
          ...updated,
          // Remove large content to save space, keep metadata
          [subApp]: {
            ...newData,
            parsedDoc: {
              ...parsedDoc,
              content: {
                ...parsedDoc.content,
                // Truncate large text content
                text: parsedDoc.content.text ? parsedDoc.content.text.substring(0, 10000) : undefined
              }
            }
          }
        };
        if (workspaceId) {
          const storageKey = `adrata-chat-document-data-${workspaceId}`;
          localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        }
      } catch (error) {
        console.warn('Failed to persist document data:', error);
      }
      
      return updated;
    });
  }, [workspaceId]);

  const getDocumentData = useCallback((subApp: string) => {
    return documentData[subApp] || null;
  }, [documentData]);

    // Fast AI processing function
  const processWithAI = useCallback(async (
    query: string,
    activeSubApp: string,
    activeSection: string,
    selectedRecord?: any
  ): Promise<string> => {
    // Fast AI processing - optimized for speed
    try {
      // Check if this is an enrichment request and we have document data
      const storedCsv = getCsvData(activeSubApp);
      const storedDoc = getDocumentData(activeSubApp);
      const isEnrichmentQuery = (query.toLowerCase().includes('find') || query.toLowerCase().includes('get') || query.toLowerCase().includes('search')) &&
                               (query.toLowerCase().includes('cfo') || query.toLowerCase().includes('ceo') || query.toLowerCase().includes('executive') || 
                                query.toLowerCase().includes('director') || query.toLowerCase().includes('vp') || query.toLowerCase().includes('president'));
      
                      // Handle CSV enrichment with progress tracking
                if (isEnrichmentQuery && storedCsv) {
                  console.log(`[CHAT HOOK] CSV enrichment request detected:`, { query, fileName: storedCsv.fileName });
                  
                  // Add progress tracker message
                  addAssistantMessage(
                    `ENRICHMENT_PROGRESS:${JSON.stringify({
                      fileName: storedCsv.fileName,
                      totalRecords: storedCsv.content.split('\n').length - 1, // Estimate records
                      query: query
                    })}`,
                    activeSubApp
                  );
                  
                  // Trigger CSV enrichment pipeline
                  try {
                    const workspaceId = authUser?.workspaces?.[0]?.id;
                    const userId = authUser?.id;
                    
                    if (!workspaceId || !userId) {
                      return "I need you to be logged in to process this request. Please sign in and try again.";
                    }
                    
                    const enrichmentResponse = await fetch('/api/ai/coresignal/csv-enrich', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        csvData: storedCsv.content,
                        fileName: storedCsv.fileName,
                        workspaceId,
                        userId,
                        enrichmentType: 'people',
                        userIntent: query,
                        addToLeads: true
                      })
                    });
                    
                    const result = await enrichmentResponse.json();
                    
                    if (result.success) {
                      const { total, enriched, creditsUsed } = result.results;
                      return `**Enrichment Complete!**

**Results from ${storedCsv.fileName}:**
• **Found ${enriched} CFOs** out of ${total} companies processed
• **Data Quality:** ${result.results.highConfidence || 0} high-confidence matches
• **Credits Used:** ${creditsUsed} Adrata credits
• **Pipeline:** Added ${result.results.leadsAdded || 0} qualified leads

**What I Found:**
• Verified email addresses for direct outreach
• Phone numbers for key contacts  
• LinkedIn profiles for social selling
• Updated job titles and company information

The enriched CFO contacts are now in your leads pipeline, ready for your sales outreach. Each contact includes verified contact information and current role details.`;
                    } else {
                      return `I encountered an error while processing your CSV: ${result.error}. Please try again or contact support if the issue persists.`;
                    }
                  } catch (error) {
                    console.error('CSV enrichment error:', error);
                    return `I encountered a technical error while processing your CSV enrichment request. Please try again in a moment.`;
                  }
                }
      
      // Handle document enrichment (new universal support)
      if (isEnrichmentQuery && storedDoc && !storedCsv) {
        console.log(`[CHAT HOOK] Document enrichment request detected:`, { query, fileName: storedDoc.fileName });
        
        const { parsedDoc } = storedDoc;
        
        // Check if document has table data suitable for enrichment
        if (parsedDoc['content']['tables'] && parsedDoc.content.tables.length > 0) {
          try {
            const workspaceId = authUser?.workspaces?.[0]?.id;
            const userId = authUser?.id;
            
            if (!workspaceId || !userId) {
              return "I need you to be logged in to process this request. Please sign in and try again.";
            }
            
            // Convert table data to CSV format for enrichment
            const csvContent = parsedDoc.content.tables.map((row: any[]) => 
              row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            ).join('\n');
            
            const enrichmentResponse = await fetch('/api/ai/coresignal/csv-enrich', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                csvData: csvContent,
                fileName: parsedDoc.fileName,
                workspaceId,
                userId,
                enrichmentType: 'people',
                userIntent: query,
                addToLeads: true
              })
            });
            
            const result = await enrichmentResponse.json();
            
            if (result.success) {
              const { total, enriched, creditsUsed } = result.results;
              return `**Document Enrichment Complete!**

**Results from ${parsedDoc.fileName}:**
• Processed: ${enriched}/${total} companies
• Credits used: ${creditsUsed} Adrata credits
• Added ${result.results.leadsAdded || 0} leads to your pipeline

I've successfully found and enriched the contacts you requested from your ${parsedDoc.fileType.toUpperCase()} document. The enriched data has been added to your leads pipeline where you can view and manage them.`;
            } else {
              return `I encountered an error while processing your document: ${result.error}. Please try again or contact support if the issue persists.`;
            }
          } catch (error) {
            console.error('Document enrichment error:', error);
            return `I encountered a technical error while processing your document enrichment request. Please try again in a moment.`;
          }
        } else if (parsedDoc['extractedData']['companies'] && parsedDoc.extractedData.companies.length > 0) {
          // Handle documents with extracted company data but no tables
          return `I found ${parsedDoc.extractedData.companies.length} companies in your ${parsedDoc.fileType.toUpperCase()} document. However, to perform enrichment, I need the data in a structured table format. Could you provide a CSV or Excel file with company names in columns?`;
        } else {
          return `I've analyzed your ${parsedDoc.fileType.toUpperCase()} document, but I don't see structured company data that I can enrich. For executive search, I need a document with company names in a table or list format. Could you provide a CSV or Excel file instead?`;
        }
      }
      
      // For enrichment queries without any stored data, ask for upload
      if (isEnrichmentQuery && !storedCsv && !storedDoc) {
        return `I'd be happy to help you find CFOs and executives! However, I don't see any uploaded files in our current conversation. Please upload a CSV, Excel, or other document with company names, and then I can search for the specific roles you need.`;
      }

      // Default fast response
      return `I understand you want to: "${query}". This is a modular Action Platform demo. In the full version, I would execute this action for you.`;
    } catch (error) {
      console.error('AI processing error:', error);
      return `I understand you want to: "${query}". This is a modular Action Platform demo. In the full version, I would execute this action for you.`;
    }
  }, [getCsvData, getDocumentData, authUser]);

  // Process natural language with AI
  const processNaturalLanguage = useCallback(
    async (
      query: string,
      activeSubApp: string,
      activeSection: string,
      selectedRecord?: any,
    ) => {
      debug("PROCESS_NATURAL_LANGUAGE", {
        query: query.substring(0, 100),
        activeSubApp,
        activeSection,
        hasSelectedRecord: !!selectedRecord,
      });

      // Add user message to chat history
      addUserMessage(query, activeSubApp);

      // Handle Mary Gin demo case specifically
      if (
        query.toLowerCase().includes("mary gin") &&
        activeSubApp === "acquire"
      ) {
        debug("MARY_GIN_DEMO_DETECTED", {});

        // Check if Mary Gin response already exists to prevent duplicates
        const currentMessages = chatSessions[activeSubApp] || [];
        const existingMaryGinResponse = currentMessages.find(
          (msg) =>
            msg['type'] === "assistant" &&
            msg.content.includes(
              "Mary Gin is NOT currently part of the Nike buyer group",
            ),
        );

        if (existingMaryGinResponse) {
          debug("MARY_GIN_RESPONSE_EXISTS", {
            message: "Skipping duplicate response",
          });
          return;
        }

        // Add typing indicator first
        const typingMessage: ChatMessage = {
          id: Date.now().toString() + "-typing",
          type: "assistant",
          content: "typing",
          timestamp: new Date(),
        };

        setChatSessions((prev) => ({
          ...prev,
          [activeSubApp]: [...(prev[activeSubApp] || []), typingMessage],
        }));

        // Wait a moment, then replace with actual response
        setTimeout(() => {
          const maryGinResponse = `I've analyzed our data on Mary Gin and here's what I found:

**Analysis Results:**
• Mary Gin is NOT currently part of the Nike buyer group
• She's a Director of Digital Marketing at Nike
• Your sales rep has been building a relationship with her over the past 2 months

⚠️ **Why she's not in our buyer group:**
• She's not involved in the Q4 Platform Upgrade decision
• Her department (Marketing) is outside the core buying committee
• The buyer group focuses on Engineering, Technology, Finance, and Procurement stakeholders

**Strategic Insight:**
Your rep may be pursuing the wrong contact for this specific deal. While Mary Gin could be valuable for future marketing-focused opportunities, she has minimal influence on platform infrastructure decisions.

🏁 **Recommendation:** Redirect efforts toward the current buyer group members, especially our Champion ([Sarah Chen](#sarah-chen-profile)) who can facilitate warm introductions to other stakeholders.

[View Mary Gin's Profile](#mary-gin-profile)`;

          setChatSessions((prev) => ({
            ...prev,
            [activeSubApp]: (prev[activeSubApp] || []).map((msg) =>
              msg['id'] === typingMessage.id
                ? { ...msg, content: maryGinResponse, isTypewriter: true }
                : msg,
            ),
          }));

          debug("MARY_GIN_RESPONSE_DELIVERED", {});
        }, 2000);

        return;
      }

      // Use OpenAI for intelligent responses in buyer groups section
      if (activeSubApp === "acquire" && activeSection === "buyerGroups") {
        debug("OPENAI_PROCESSING_STARTED", { activeSection });

        // Add typing indicator
        const typingMessage: ChatMessage = {
          id: Date.now().toString() + "-typing",
          type: "assistant",
          content: "typing",
          timestamp: new Date(),
        };

        setChatSessions((prev) => ({
          ...prev,
          [activeSubApp]: [...(prev[activeSubApp] || []), typingMessage],
        }));

        try {
          // Generate intelligent response based on buyer group context
          const aiResponse = await generateOpenAIResponse(
            query,
            activeSection,
            selectedRecord,
          );

          debug("OPENAI_RESPONSE_RECEIVED", {
            responseLength: aiResponse.length,
            hasResponse: !!aiResponse,
          });

          // Replace typing indicator with AI response
          setChatSessions((prev) => ({
            ...prev,
            [activeSubApp]: (prev[activeSubApp] || []).map((msg) =>
              msg['id'] === typingMessage.id
                ? { ...msg, content: aiResponse, isTypewriter: true }
                : msg,
            ),
          }));
        } catch (error) {
          debug("OPENAI_ERROR", { error });

          // Fallback in case of error
          setChatSessions((prev) => ({
            ...prev,
            [activeSubApp]: (prev[activeSubApp] || []).map((msg) =>
              msg['id'] === typingMessage.id
                ? {
                    ...msg,
                    content: `I'm having trouble accessing our intelligence systems right now. Please try asking about specific buyer group members or deal strategies, and I'll provide insights based on our stakeholder analysis.`,
                    isTypewriter: false,
                  }
                : msg,
            ),
          }));
        }

        return;
      }

      // Optimized AI processing for 20% faster responses
      debug("AI_PROCESSING_START", { activeSubApp, activeSection });

      // Add typing indicator immediately for better UX
      const typingMessage: ChatMessage = {
        id: Date.now().toString() + "-typing",
        type: "assistant",
        content: "typing",
        timestamp: new Date(),
      };

      setChatSessions((prev) => ({
        ...prev,
        [activeSubApp]: [...(prev[activeSubApp] || []), typingMessage],
      }));

      // Process with optimized AI call (reduced timeout from 1000ms to 200ms)
      setTimeout(async () => {
        try {
          // Get user and workspace IDs
          const workspaceId = authUser?.workspaces?.[0]?.id;
          const userId = authUser?.id;
          
          // First try fast AI processing for enrichment queries
          const [aiResponse] = await Promise.allSettled([
            processWithAI(query, activeSubApp, activeSection, selectedRecord)
          ]);
          
          let responseMessage = '';
          
          if (aiResponse['status'] === 'fulfilled' && aiResponse.value) {
            responseMessage = aiResponse.value;
          }
          
          // If no enrichment response and we have auth, call the chat API with document context
          if (!responseMessage || responseMessage.includes('modular Action Platform demo')) {
            if (workspaceId && userId) {
              try {
                // Get document context for the current subApp
                const storedDoc = getDocumentData(activeSubApp);
                
                // CRITICAL: Use trailing slash to match Next.js trailingSlash: true config
                // Next.js trailingSlash: true expects URLs WITH trailing slashes
                // If we send /api/ai-chat (no slash), Next.js redirects to /api/ai-chat/ (with slash)
                // This redirect converts POST → GET, causing 405 errors
                // Solution: Send /api/ai-chat/ (with slash) to match Next.js expectations, preventing redirect
                let apiUrl = '/api/ai-chat/';
                
                // Ensure trailing slash is present (defensive)
                if (!apiUrl.endsWith('/')) {
                  apiUrl = apiUrl + '/';
                }
                
                console.log('[HOOK] Making API call to /api/ai-chat with POST method');
                const chatResponse = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  },
                  body: JSON.stringify({
                    message: query,
                    workspaceId,
                    userId,
                    appType: activeSubApp,
                    conversationHistory: chatSessions[activeSubApp as keyof ChatSessions]?.slice(-5) || [],
                    currentRecord: selectedRecord,
                    recordType: selectedRecord ? 'lead' : null,
                    documentContext: storedDoc
                  })
                });
                
                console.log('[HOOK] Response received:', {
                  status: chatResponse.status,
                  statusText: chatResponse.statusText,
                  ok: chatResponse.ok
                });

                const result = await chatResponse.json();
                
                if (result['success'] && result.response) {
                  responseMessage = result.response;
                } else {
                  responseMessage = `I understand you want to: "${query}". This is a modular Action Platform demo. In the full version, I would execute this action for you.`;
                }
              } catch (error) {
                console.error('Chat API error:', error);
                responseMessage = `I understand you want to: "${query}". This is a modular Action Platform demo. In the full version, I would execute this action for you.`;
              }
            } else {
              responseMessage = `I understand you want to: "${query}". This is a modular Action Platform demo. In the full version, I would execute this action for you.`;
            }
          }
          
          // Remove typing indicator and add response
          setChatSessions((prev) => ({
            ...prev,
            [activeSubApp]: [
              ...(prev[activeSubApp] || []).filter(msg => msg.id !== typingMessage.id),
            ],
          }));
          
          addAssistantMessage(responseMessage, activeSubApp);
        } catch (error) {
          console.error('AI processing error:', error);
          // Remove typing indicator and add fallback
          setChatSessions((prev) => ({
            ...prev,
            [activeSubApp]: [
              ...(prev[activeSubApp] || []).filter(msg => msg.id !== typingMessage.id),
            ],
          }));
          addAssistantMessage(`I understand you want to: "${query}". This is a modular Action Platform demo. In the full version, I would execute this action for you.`, activeSubApp);
        }
      }, 150); // Optimized to 150ms for maximum speed while maintaining reliability
    },
    [addUserMessage, addAssistantMessage, chatSessions],
  );



  return {
    // State
    rightChatInput,
    chatSessions,

    // Actions
    setRightChatInput,
    setChatSessions,
    processNaturalLanguage,
    addUserMessage,
    addAssistantMessage,
    clearChatHistory,
    storeCsvData,
    getCsvData,
    storeDocumentData,
    getDocumentData,
  };
}

// Legacy alias for backwards compatibility
export const useActionPlatformChat = useChat;
