"use client";

import React, { useState } from "react";
import { OasisChatPanel } from "@/products/oasis/components/OasisChatPanel";
import { OasisThreadView } from "@/products/oasis/components/OasisThreadView";
import { VideoCallPanel } from "@/products/oasis/components/VideoCallPanel";
import { useOasisLayout } from "@/app/[workspace]/(revenue-os)/layout";

interface OasisPageContentProps {
  conversationType?: string;
  conversationId?: string | null;
}

export function OasisPageContent({ conversationType, conversationId }: OasisPageContentProps) {
  const [isThreadVisible, setIsThreadVisible] = useState(false);
  const { isVideoCallActive, videoCallRoom, setIsVideoCallActive, setVideoCallRoom } = useOasisLayout();

  // Note: Channel selection is handled by OasisLeftPanel based on URL parameters
  // This component just renders the chat interface

  const handleEndVideoCall = () => {
    setIsVideoCallActive(false);
    setVideoCallRoom(null);
  };

  return (
    <div className="h-full bg-[var(--background)] relative">
      {/* Video Call Panel - Shows when video call is active */}
      {isVideoCallActive && videoCallRoom ? (
        <VideoCallPanel
          roomId={videoCallRoom.id}
          roomName={videoCallRoom.name}
          onEndCall={handleEndVideoCall}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
