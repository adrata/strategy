"use client";

import React from 'react';
import { EnrichmentStatusWidget } from "@/platform/ui/components/EnrichmentStatusWidget";
import { AiPersonFinder } from "../AiPersonFinder";

interface WelcomeSectionProps {
  activeSubApp: string;
  workspaceId: string;
  isPersonFinderMinimized: boolean;
  onMinimizePersonFinder: () => void;
  onExpandPersonFinder: () => void;
  onQuickAction: (action: string) => void;
  getWelcomeMessage: (subApp: string) => string;
  quickActions: string[];
  activeConversationId?: string;
}

export function WelcomeSection({
  activeSubApp,
  workspaceId,
  isPersonFinderMinimized,
  onMinimizePersonFinder,
  onExpandPersonFinder,
  onQuickAction,
  getWelcomeMessage,
  quickActions,
  activeConversationId
}: WelcomeSectionProps) {
  return (
    <div className="space-y-6" style={{ marginBottom: 0 }}>
      <div className="bg-transparent px-0 py-0 text-base text-[var(--foreground)] w-fit max-w-full leading-snug">
        <div className="whitespace-pre-line">
          {getWelcomeMessage(activeSubApp)}
        </div>
      </div>

      {/* 🚀 PERFORMANCE OPTIMIZATION: Disabled enrichment widget since chat is not in use */}
      {false && activeConversationId === 'main-chat' && (
        <>
          <EnrichmentStatusWidget
            workspaceId={workspaceId || 'demo-workspace'}
            showDetails={false}
            maxExecutions={2}
          />

          {/* Quick actions */}
          <div className="space-y-3">
            <div className="text-sm text-[var(--muted)]">
              Try these quick actions:
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={`${activeSubApp}-${action}-${index}`}
                  onClick={() => onQuickAction(action)}
                  className="inline-flex items-center space-x-2 px-3 py-2 text-sm bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
                >
                  <span>{action}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!isPersonFinderMinimized && (
        <AiPersonFinder
          isMinimized={false}
          onMinimize={onMinimizePersonFinder}
          onExpand={onExpandPersonFinder}
        />
      )}
    </div>
  );
}
