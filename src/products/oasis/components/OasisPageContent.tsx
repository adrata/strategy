"use client";

import React from "react";
import { OasisChatPanel } from "@/products/oasis/components/OasisChatPanel";
import { VideoCallPanel } from "@/products/oasis/components/VideoCallPanel";
import { useOasisLayout } from "@/products/oasis/context/OasisLayoutContext";

interface OasisPageContentProps {
  conversationType?: string;
  conversationId?: string | null;
}

export function OasisPageContent({ conversationType, conversationId }: OasisPageContentProps) {
  const { isVideoCallActive, videoCallRoom, setIsVideoCallActive, setVideoCallRoom } = useOasisLayout();

  // Note: Channel selection is handled by OasisLeftPanel based on URL parameters
  // Thread view is now rendered in the right panel via layout, not as an overlay

  const handleEndVideoCall = () => {
    setIsVideoCallActive(false);
    setVideoCallRoom(null);
  };

  return (
    <div className="h-full bg-background relative">
      {/* Video Call Panel - Shows when video call is active */}
      {isVideoCallActive && videoCallRoom ? (
        <VideoCallPanel
          roomId={videoCallRoom.id}
          roomName={videoCallRoom.name}
          onEndCall={handleEndVideoCall}
        />
      ) : (
        <div className="h-full overflow-hidden">
          {/* Main Content - Full Width Chat */}
          {/* Thread view is now rendered in the right panel slot via layout based on threadData context */}
          <OasisChatPanel />
        </div>
      )}
    </div>
  );
}
