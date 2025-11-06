"use client";

import { createContext, useContext } from "react";

/**
 * Oasis Layout Context
 * 
 * Local state for layout-specific needs (separate from global Oasis state)
 * Moved to separate file to prevent circular dependency with layout.tsx
 */

export interface OasisLayoutContextType {
  activeSection: 'channels' | 'direct-messages' | 'mentions' | 'starred' | 'archived' | 'settings';
  setActiveSection: (section: 'channels' | 'direct-messages' | 'mentions' | 'starred' | 'archived' | 'settings') => void;
  selectedChannel: any | null;
  setSelectedChannel: (channel: any | null) => void;
  isVideoCallActive: boolean;
  setIsVideoCallActive: (active: boolean) => void;
  videoCallRoom: { id: string; name: string } | null;
  setVideoCallRoom: (room: { id: string; name: string } | null) => void;
  threadData: { messageId: string; threadMessages: any[]; parentMessageId: string | null; channelId: string | null; dmId: string | null } | null;
  setThreadData: (data: { messageId: string; threadMessages: any[]; parentMessageId: string | null; channelId: string | null; dmId: string | null } | null) => void;
  threadNavigationStack: Array<{ messageId: string; parentMessageId: string | null; level: number }>;
  setThreadNavigationStack: (stack: Array<{ messageId: string; parentMessageId: string | null; level: number }>) => void;
}

export const OasisLayoutContext = createContext<OasisLayoutContextType | undefined>(undefined);

export const useOasisLayout = () => {
  const context = useContext(OasisLayoutContext);
  if (!context) {
    throw new Error('useOasisLayout must be used within OasisLayoutProvider');
  }
  return context;
};

