"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
// Removed TypingIndicator import - Oasis product removed

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  sender?: string;
  image?: {
    name: string;
    size: number;
    type: string;
    data: string;
  };
}

interface ChatWindowProps {
  messages: Message[];
  typingUsers?: string[];
  onImageClick?: (image: { src: string; alt: string; name: string }) => void;
  viewMode: "ai" | "conversations" | "chat";
  isLoading?: boolean;
  welcomeMessage?: string;
}

export function ChatWindow({
  messages,
  typingUsers = [],
  onImageClick,
  viewMode,
  isLoading = false,
  welcomeMessage,
}: ChatWindowProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      const chatContainer = chatEndRef.current.parentElement;
      if (chatContainer) {
        setTimeout(() => {
          chatContainer['scrollTop'] = chatContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages.length]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getAvatarStyle = (
    sender: string | undefined,
    type: "user" | "assistant",
  ) => {
    if (viewMode === "chat") {
      // Conversation chat mode
      if (sender === "Ross Sylvester") {
        return "bg-gradient-to-br from-blue-500 to-blue-600";
      } else if (sender === "Dan Mirolli") {
        return "bg-gradient-to-br from-green-500 to-green-600";
      } else if (sender === "Adrata AI") {
        return "bg-gradient-to-br from-purple-500 to-purple-600";
      } else if (sender === "You") {
        return "bg-gradient-to-br from-gray-500 to-gray-600";
      }
    }

    // AI chat mode
    return type === "user"
      ? "bg-gradient-to-br from-blue-500 to-blue-600"
      : "bg-gradient-to-br from-purple-500 to-purple-600";
  };

  const getAvatarImage = (sender: string | undefined): string | undefined => {
    if (sender === "Ross Sylvester") return "/ross-profile.png";
    if (sender === "Dan Mirolli") return "/dan-profile.png";
    return undefined;
  };

  const getInitials = (
    sender: string | undefined,
    type: "user" | "assistant",
  ): string => {
    if (viewMode === "chat") {
      if (sender === "Ross Sylvester") return "RS";
      if (sender === "Dan Mirolli") return "DM";
      if (sender === "Adrata AI") return "AI";
      if (sender === "You") return "You";
    }

    return type === "user" ? "You" : "AI";
  };

  const renderMessage = (message: Message) => {
    const isUser = message['type'] === "user" || message['sender'] === "You";
    const avatarImage = getAvatarImage(message.sender);
    const avatarStyle = getAvatarStyle(message.sender, message.type);
    const initials = getInitials(message.sender, message.type);

    return (
      <div
        key={message.id}
        className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full ${avatarStyle} flex items-center justify-center overflow-hidden`}
        >
          {avatarImage ? (
            <Image
              src={avatarImage}
              alt={message.sender || "User"}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-xs font-bold">{initials}</span>
          )}
        </div>

        {/* Message content */}
        <div
          className={`flex-1 max-w-xs lg:max-w-md ${isUser ? "flex flex-col items-end" : ""}`}
        >
          {/* Sender name and timestamp */}
          <div
            className={`flex items-center space-x-2 mb-1 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
          >
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {message.sender ||
                (message['type'] === "user" ? "You" : "AI Assistant")}
            </span>
            <span className="text-xs text-muted dark:text-muted">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Message bubble */}
          <div
            className={`rounded-lg px-3 py-2 ${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-hover text-foreground dark:text-white"
            }`}
          >
            {/* Text content */}
            {message['content'] && (
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}

            {/* Image content */}
            {message['image'] && (
              <div className="mt-2">
                <button
                  onClick={() =>
                    onImageClick?.({
                      src: message.image!.data,
                      alt: message.image!.name,
                      name: message.image!.name,
                    })
                  }
                  className="block"
                >
                  <Image
                    src={message.image.data}
                    alt={message.image.name}
                    width={250}
                    height={300}
                    className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: "300px", maxWidth: "250px" }}
                  />
                </button>
                <div className="mt-1 text-xs opacity-75">
                  📷 {message.image.name}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-muted dark:text-muted">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
          <span>Loading conversation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Welcome message for empty chats */}
      {messages['length'] === 0 && welcomeMessage && (
        <div className="text-center text-muted dark:text-muted py-8">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-lg font-medium mb-2">Welcome to AI Chat</p>
          <p className="text-sm">{welcomeMessage}</p>
        </div>
      )}

      {/* Messages */}
      {messages.map(renderMessage)}

      {/* Typing indicator */}
      {typingUsers.length > 0 && viewMode === "chat" && (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">...</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted dark:text-muted mb-1">
              {typingUsers.join(", ")} {typingUsers['length'] === 1 ? "is" : "are"}{" "}
              typing...
            </div>
            <div className="bg-hover rounded-lg px-3 py-2">
              {/* TypingIndicator removed - Oasis product no longer available */}
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={chatEndRef} />
    </div>
  );
}
