"use client";

import React, { useState } from "react";
import { PanelLayout } from "@/platform/ui/components/layout/PanelLayout";
import { OasisLeftPanel } from "./OasisLeftPanel";
import { OasisChatInterface } from "./OasisChatInterface";
import { RightPanel } from "@/platform/ui/components/chat/RightPanel";
import { useOasis } from "../context/OasisProvider";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useRecordContext } from "@/platform/ui/context/RecordContextProvider";
import { useEffect } from "react";

export function OasisContainer() {
  const { ui } = useAcquisitionOS();
  const { setCurrentRecord } = useRecordContext();
  const {
    selectedChat,
    chats,
    messages,
    currentUser,
    typingUsers,
    loading,
    messagesLoading,
    sending,
    onSendMessage,
    selectChat,
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
  } = useOasis();

  const [showDetail, setShowDetail] = useState(true);

  // Update record context when chat is selected (for AI panel)
  useEffect(() => {
    if (selectedChat) {
      const chat = chats.find(c => c.id === selectedChat.id);
      if (chat) {
        setCurrentRecord({
          id: chat.id,
          name: getChatDisplayName(chat),
          type: selectedChat.type,
          messages: messages.slice(-10), // Last 10 messages for context
        }, 'chat');
      }
    } else {
      setCurrentRecord(null, '');
    }
  }, [selectedChat, chats, messages, setCurrentRecord, getChatDisplayName]);

  // Handle message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || sending) return;

    const form = e.target as HTMLFormElement;
    const input = form.querySelector('textarea') as HTMLTextAreaElement;
    const content = input.value.trim();

    if (!content) return;

    // Clear input immediately
    input.value = '';

    try {
      await onSendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore input content on error
      input.value = content;
    }
  };

  // Handle chat selection
  const handleChatSelect = (chat: { type: "channel" | "dm"; id: string; name?: string }) => {
    selectChat(chat);
    setShowDetail(true);
  };

  return (
    <PanelLayout
      thinLeftPanel={null}
      leftPanel={<OasisLeftPanel />}
      middlePanel={
        <OasisChatInterface
          selectedChat={selectedChat}
          chatInput=""
          setChatInput={() => {}} // Handled by form submission
          showDetail={showDetail}
          setShowDetail={setShowDetail}
          chats={chats}
          messages={messages}
          currentUser={currentUser}
          typingUsers={typingUsers}
          loading={loading}
          messagesLoading={messagesLoading}
          sending={sending}
          onSendMessage={handleSendMessage}
          onChatSelect={handleChatSelect}
          getInitials={getInitials}
          getDirectMessages={getDirectMessages}
          getOrderedChannels={getOrderedChannels}
          getChatDisplayName={getChatDisplayName}
          getMessageSenderDisplayName={getMessageSenderDisplayName}
          isUserOnline={isUserOnline}
          startTyping={startTyping}
          stopTyping={stopTyping}
          editMessage={editMessage}
          addReaction={addReaction}
          removeReaction={removeReaction}
        />
      }
      rightPanel={<RightPanel />}
      zoom={100}
      isLeftPanelVisible={ui.isLeftPanelVisible}
      isRightPanelVisible={ui.isRightPanelVisible}
      onToggleLeftPanel={ui.toggleLeftPanel}
      onToggleRightPanel={ui.toggleRightPanel}
    />
  );
}

