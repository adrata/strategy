"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  UserCircleIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";

interface DirectMessage {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface DMMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isOwn: boolean;
}

interface DMChatInterfaceProps {
  selectedDM: DirectMessage | null;
  onBack: () => void;
}

export function DMChatInterface({ selectedDM, onBack }: DMChatInterfaceProps) {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock messages - in real implementation, this would come from API
  useEffect(() => {
    if (selectedDM) {
      // Simulate loading messages
      setMessages([
        {
          id: '1',
          content: 'Hey! How are you doing?',
          senderId: selectedDM.id,
          senderName: selectedDM.name,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          isOwn: false
        },
        {
          id: '2',
          content: 'I\'m doing great! Thanks for asking. How about you?',
          senderId: 'current-user',
          senderName: 'You',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
          isOwn: true
        },
        {
          id: '3',
          content: 'Pretty good! Just working on some new features for the project.',
          senderId: selectedDM.id,
          senderName: selectedDM.name,
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          isOwn: false
        }
      ]);
    }
  }, [selectedDM]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedDM) return;

    const newMessage: DMMessage = {
      id: Date.now().toString(),
      content: messageInput.trim(),
      senderId: 'current-user',
      senderName: 'You',
      timestamp: new Date(),
      isOwn: true
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');

    // Simulate typing indicator and response
    setIsTyping(true);
    setTimeout(() => {
      const responseMessage: DMMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Thanks for the message! I\'ll get back to you soon.',
        senderId: selectedDM.id,
        senderName: selectedDM.name,
        timestamp: new Date(),
        isOwn: false
      };
      setMessages(prev => [...prev, responseMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!selectedDM) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--muted)]">
        <div className="text-center">
          <UserCircleIcon className="w-16 h-16 mx-auto mb-4 text-[var(--muted)]" />
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Simple back button header */}
      <div className="flex items-center p-4 border-b border-[var(--border)] bg-[var(--panel-background)]">
        <button
          onClick={onBack}
          className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages - Oasis style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex items-start space-x-2"
          >
            {!message.isOwn && (
              <div className="w-8 h-8 bg-white border border-[var(--border)] rounded flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-[var(--foreground)]">
                  {message.senderName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {!message.isOwn && (
                <div className="text-xs text-[var(--muted)] mb-1">
                  {message.senderName}
                </div>
              )}
              <div className="bg-white border border-[var(--border)] rounded-lg p-3">
                <p className="text-sm text-[var(--foreground)]">{message.content}</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-white border border-[var(--border)] rounded flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-[var(--foreground)]">
                {selectedDM?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Oasis style */}
      <div className="p-4 border-t border-[var(--border)]">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '120px',
                height: 'auto'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
