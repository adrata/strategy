"use client";

import React, { useState, useEffect } from "react";
import { OasisChatPanel } from "@/products/oasis/components/OasisChatPanel";
import { OasisThreadView } from "@/products/oasis/components/OasisThreadView";
import { useOasis } from "@/app/[workspace]/(pipeline)/layout";

interface OasisPageContentProps {
  conversationType?: string;
  conversationId?: string | null;
}

export function OasisPageContent({ conversationType, conversationId }: OasisPageContentProps) {
  const [isThreadVisible, setIsThreadVisible] = useState(false);
  const { setSelectedChannel } = useOasis();

  // Select channel based on URL parameters when component mounts
  useEffect(() => {
    if (conversationType && conversationId) {
      // Determine if it's a channel or DM based on the conversation type
      const isChannel = conversationType === 'channel';
      const isDM = conversationType === 'dm';
      
      if (isChannel || isDM) {
        // Create a mock conversation object that matches the expected format
        const conversation = {
          id: conversationId,
          type: conversationType as 'channel' | 'dm',
          name: conversationId, // This will be overridden by the actual channel data
        };
        
        setSelectedChannel(conversation);
      }
    }
  }, [conversationType, conversationId, setSelectedChannel]);

  return (
    <div className="h-full bg-[var(--background)] relative">
      {/* Main Content - Full Width Chat */}
      <div className="h-full overflow-hidden">
        <OasisChatPanel onShowThread={() => setIsThreadVisible(true)} />
      </div>
      
      {/* Thread View - Overlays Right Panel */}
      <OasisThreadView 
        isVisible={isThreadVisible}
        onClose={() => setIsThreadVisible(false)}
        conversationName={conversationId || "Thread"}
      />
    </div>
  );
}
