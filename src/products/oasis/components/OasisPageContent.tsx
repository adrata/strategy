"use client";

import React, { useState } from "react";
import { OasisChatPanel } from "@/products/oasis/components/OasisChatPanel";
import { OasisThreadView } from "@/products/oasis/components/OasisThreadView";

interface OasisPageContentProps {
  conversationType?: string;
  conversationId?: string | null;
}

export function OasisPageContent({ conversationType, conversationId }: OasisPageContentProps) {
  const [isThreadVisible, setIsThreadVisible] = useState(false);

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
