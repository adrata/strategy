"use client";

import React, { useState } from "react";
import { OasisMiddlePanel } from "./OasisMiddlePanel";
import { OasisRightPanel } from "./OasisRightPanel";

export function OasisContainer() {
  const [activeSection, setActiveSection] = useState('channels');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Handle section changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSelectedChannel(null);
    setShowRightPanel(false);
  };

  // Handle channel selection
  const handleChannelSelect = (channel: any) => {
    setSelectedChannel(channel);
    setShowRightPanel(true);
  };

  // Handle right panel close
  const handleCloseRightPanel = () => {
    setShowRightPanel(false);
  };

  return (
    <div className="flex h-full">
      {/* Middle Panel */}
      <div className="flex-1">
        <OasisMiddlePanel
          activeSection={activeSection}
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          isLoading={false}
        />
      </div>

      {/* Right Panel */}
      {showRightPanel && (
        <OasisRightPanel
          selectedChannel={selectedChannel}
          onClose={handleCloseRightPanel}
        />
      )}
    </div>
  );
}

