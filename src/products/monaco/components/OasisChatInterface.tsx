import React, { useState, useRef, useEffect, useCallback } from "react";
import clsx from "clsx";
import {
  PaperAirplaneIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { EmojiPicker } from "@/platform/ui/components/EmojiPicker";

interface OasisChatInterfaceProps {
  // Chat state
  selectedChat: { type: "channel" | "dm"; id: string; name?: string } | null;
  chatInput: string;
  setChatInput: (value: string) => void;
  showDetail: boolean;
  setShowDetail: (show: boolean) => void;

  // Data and handlers
  chats: any[];
  messages: any[];
  currentUser: any;
  typingUsers: any[];
  loading: boolean;
  messagesLoading: boolean;
  sending: boolean;
  onSendMessage: (e: React.FormEvent) => void;
  onChatSelect: (chat: {
    type: "channel" | "dm";
    id: string;
    name?: string;
  }) => void;
  getInitials: (name: string | null | undefined) => string;
  getDirectMessages: () => Array<{ chat: any; label: string }>;
  getOrderedChannels: () => any[];
  getChatDisplayName: (chat: any) => string;
  getMessageSenderDisplayName: (sender: {
    id: string;
    name: string | null;
    email: string;
  }) => string;
  isUserOnline: (userId: string) => boolean;
  startTyping: () => void;
  stopTyping: () => void;
  editMessage: (messageId: string, content: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
}

interface MessageReaction {
  emoji: string;
  userId: string;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
  reactions?: MessageReaction[];
}

export const OasisChatInterface: React.FC<OasisChatInterfaceProps> = ({
  selectedChat,
  chatInput,
  setChatInput,
  showDetail,
  setShowDetail,
  chats,
  messages,
  currentUser,
  typingUsers,
  loading,
  messagesLoading,
  sending,
  onSendMessage,
  onChatSelect,
  getInitials,
  getDirectMessages,
  getOrderedChannels,
  getChatDisplayName,
  getMessageSenderDisplayName,
  isUserOnline,
  startTyping,
  stopTyping,
  editMessage,
  addReaction,
  removeReaction,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicators
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (chatInput) {
      startTyping();
      timeout = setTimeout(() => {
        stopTyping();
      }, 1000);
    }
    return () => {
      clearTimeout(timeout);
      stopTyping();
    };
  }, [chatInput, startTyping, stopTyping]);

  const handleEdit = (msg: any) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleEditSave = async (msg: any) => {
    setEditLoading(true);
    try {
      await editMessage(msg.id, editContent);
      setEditingMessageId(null);
      setEditContent("");
    } finally {
      setEditLoading(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const message = messages.find((m) => m['id'] === messageId) as
      | ChatMessage
      | undefined;
    if (!message) return;

    const hasReaction = message.reactions?.some(
      (r: MessageReaction) => r['emoji'] === emoji && r['userId'] === currentUser.id,
    );

    if (hasReaction) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
    setShowEmojiPicker(null);
  };

  if (!showDetail || !selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
          <p className="text-sm">
            Choose a channel or direct message to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)]">
      {/* Chat header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              {selectedChat['type'] === "channel" ? `#${selectedChat.name}` : getChatDisplayName(chats.find((c) => c['id'] === selectedChat.id))}
            </h1>
            {selectedChat['type'] === "channel" && (
              <div className="text-sm text-[var(--muted)]">
                {chats.find((c) => c['id'] === selectedChat.id)?.members?.length ||
                  0}{" "}
                members
              </div>
            )}
          </div>
          <button
            onClick={() => setShowDetail(false)}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors lg:hidden"
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 invisible-scrollbar">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-[var(--muted)]">Loading messages...</div>
          </div>
        ) : messages['length'] === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-[var(--muted)]">
              <p className="text-lg font-medium mb-2">
                {selectedChat['type'] === "channel"
                  ? "Welcome to the channel!"
                  : "Start the conversation"}
              </p>
              <p className="text-sm">
                {selectedChat['type'] === "channel"
                  ? "This is the beginning of your conversation in this channel."
                  : "This is the beginning of your direct message conversation."}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message['sender']['id'] === currentUser.id;
            const showAvatar =
              index === 0 ||
              messages[index - 1]?.sender.id !== message.sender.id;
            const isLastFromSender =
              index === messages.length - 1 ||
              messages[index + 1]?.sender.id !== message.sender.id;
            const isEditing = editingMessageId === message.id;

            return (
              <div key={message.id} className="flex gap-3 group relative">
                <div className="flex-shrink-0">
                  {showAvatar ? (
                    <div className="w-8 h-8 rounded-lg bg-[var(--hover-bg)] border border-[var(--border)] flex items-center justify-center text-sm font-medium text-[var(--foreground)]">
                      {getInitials(message.sender.name)}
                    </div>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-[var(--foreground)] text-sm">
                        {getMessageSenderDisplayName(message.sender)}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {selectedChat['type'] === "dm" &&
                        message.sender.id !== currentUser['id'] && (
                          <div
                            className={clsx(
                              "w-2 h-2 rounded-full",
                              isUserOnline(message.sender.id)
                                ? "bg-green-500"
                                : "bg-gray-400",
                            )}
                          />
                        )}
                    </div>
                  )}
                  <div className="text-[var(--foreground)] text-base leading-relaxed whitespace-pre-wrap break-words">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="w-full rounded border border-[var(--border)] p-2 text-sm"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          disabled={editLoading}
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={() => handleEditSave(message)}
                            disabled={editLoading}
                          >
                            Save
                          </button>
                          <button
                            className="px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded hover:bg-[var(--hover-bg)]"
                            onClick={handleEditCancel}
                            disabled={editLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {message.content}
                        {message['updatedAt'] &&
                          new Date(message.updatedAt).getTime() >
                            new Date(message.createdAt).getTime() && (
                            <span className="ml-2 text-xs text-[var(--muted)]">
                              (updated)
                            </span>
                          )}
                      </>
                    )}
                  </div>
                  {message['reactions'] && message.reactions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(
                        Object.entries(
                          message.reactions.reduce(
                            (
                              acc: { [key: string]: number },
                              r: MessageReaction,
                            ) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            },
                            {},
                          ),
                        ) as [string, number][]
                      ).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message.id, emoji)}
                          className={clsx(
                            "px-2 py-0.5 text-xs rounded-full border",
                            message.reactions.some(
                              (r: MessageReaction) =>
                                r['emoji'] === emoji &&
                                r['userId'] === currentUser.id,
                            )
                              ? "bg-blue-100 border-blue-200 text-blue-700"
                              : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]",
                          )}
                        >
                          {emoji} {count}
                        </button>
                      ))}
                    </div>
                  )}
                  {isCurrentUser && !isEditing && (
                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                      <button
                        className="px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded hover:bg-[var(--hover-bg)]"
                        onClick={() => handleEdit(message)}
                      >
                        <PencilIcon className="w-3 h-3" />
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded hover:bg-[var(--hover-bg)]"
                        onClick={() => setShowEmojiPicker(message.id)}
                      >
                        😀
                      </button>
                    </div>
                  )}
                  {showEmojiPicker === message['id'] && (
                    <div className="absolute right-0 top-8 z-20">
                      <div className="relative">
                        <EmojiPicker
                          onEmojiSelect={(emoji) =>
                            handleReaction(message.id, emoji)
                          }
                          onClose={() => setShowEmojiPicker(null)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8" />
            <div className="flex-1">
              <div className="text-sm text-[var(--muted)] italic">
                {typingUsers['length'] === 1
                  ? `${typingUsers[0].name} is typing...`
                  : `${typingUsers
                      .slice(0, -1)
                      .map((u) => u.name)
                      .join(
                        ", ",
                      )} and ${typingUsers[typingUsers.length - 1].name} are typing...`}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Message input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border)] bg-[var(--background)]">
        <form onSubmit={onSendMessage} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Message ${selectedChat['type'] === "channel" ? "#" + selectedChat.name : getChatDisplayName(chats.find((c) => c['id'] === selectedChat.id))}`}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={1}
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onKeyDown={(e) => {
                if (e['key'] === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage(e);
                }
              }}
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={!chatInput.trim() || sending}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ minHeight: "44px" }}
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OasisChatInterface;
