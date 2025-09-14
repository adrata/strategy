import { useState, useEffect } from "react";
import { ChatMessage, ChatSession } from "../types";
import { useMonacoSearch } from "./useMonacoSearch";

export const useMonacoChat = () => {
  const { processNaturalLanguage, executePendingAction, aiService } =
    useMonacoSearch();

  const [chatSessions, setChatSessions] = useState<ChatSession>({ monaco: [] });
  const [rightChatInput, setRightChatInput] = useState("");
  const [showChatHistory, setShowChatHistory] = useState(false);

  // Get welcome message
  const getWelcomeMessage = () => {
    return `Welcome to Monaco! I've loaded your **Best 14 Strategic Accounts** with comprehensive buyer group intelligence and executive insights. Use natural language to review pipeline health, assess team performance, or explore market opportunities.`;
  };

  // Process AI chat message
  const processAIChat = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatSessions((prev) => ({
      ...prev,
      monaco: [...(prev.monaco || []), userMessage],
    }));

    try {
      // Process with AI
      const result = await processNaturalLanguage(message);

      if (result) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: result.response,
          timestamp: new Date(),
          searchResults: result.results,
        };

        setChatSessions((prev) => ({
          ...prev,
          monaco: [...(prev.monaco || []), assistantMessage],
        }));
      }
    } catch (error) {
      console.error("Error processing AI chat:", error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setChatSessions((prev) => ({
        ...prev,
        monaco: [...(prev.monaco || []), errorMessage],
      }));
    }
  };

  // Execute action and add response to chat
  const executeActionAndChat = async () => {
    const response = await executePendingAction();

    if (response) {
      const actionMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setChatSessions((prev) => ({
        ...prev,
        monaco: [...(prev.monaco || []), actionMessage],
      }));
    }
  };

  // Clear chat history
  const clearChatHistory = () => {
    setChatSessions({ monaco: [] });
  };

  // Get current chat messages
  const getCurrentChatMessages = () => {
    return chatSessions.monaco || [];
  };

  // Add welcome message on mount
  useEffect(() => {
    if ((chatSessions.monaco || []).length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        type: "assistant",
        content: getWelcomeMessage(),
        timestamp: new Date(),
      };

      setChatSessions((prev) => ({
        ...prev,
        monaco: [welcomeMessage],
      }));
    }
  }, [chatSessions.monaco]);

  return {
    // State
    chatSessions,
    rightChatInput,
    showChatHistory,

    // Actions
    setRightChatInput,
    setShowChatHistory,
    processAIChat,
    executeActionAndChat,
    clearChatHistory,

    // Getters
    getCurrentChatMessages,
    getWelcomeMessage,
  };
};
