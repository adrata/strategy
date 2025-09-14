import React, { createContext, useContext, useState } from "react";

// Context type definition
interface AIChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (message: string) => void;
  clearMessages: () => void;
}

// Message type definition
interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "assistant";
}

// Create context
const ActionPlatformChatContext = createContext<
  ActionPlatformChatContextType | undefined
>(undefined);

// Provider component
export function ActionPlatformChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender: "user",
    };
    setMessages((prev) => [...prev, newMessage]);

    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `I understand you said: "${content}". How can I assist you further?`,
        timestamp: new Date(),
        sender: "assistant",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <ActionPlatformChatContext.Provider
      value={{
        messages,
        isTyping,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </ActionPlatformChatContext.Provider>
  );
}

// Hook to use the chat context
export function useActionPlatformChat() {
  const context = useContext(ActionPlatformChatContext);
  if (context === undefined) {
    throw new Error(
      "useActionPlatformChat must be used within an ActionPlatformChatProvider",
    );
  }
  return context;
}

export default ActionPlatformChatProvider;
