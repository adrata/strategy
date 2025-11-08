"use client";

import React from 'react';
import { StacksEpic } from './types';
import { EpicGoalBar } from './EpicGoalBar';
import { EpicRankBadge } from './EpicRankBadge';

interface EpicCardProps {
  epic: StacksEpic & { rank?: number };
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent, epicId: string) => void;
}

export function EpicCard({
  epic,
  isSelected,
  onClick,
  onContextMenu,
}: EpicCardProps) {
  // Calculate rank based on epic's rank or position
  const rank = epic.rank || 1;

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, epic.id)}
      className={`
        w-full p-6 bg-card rounded-lg border border-border shadow-sm 
        hover:shadow-md hover:border-[var(--primary)] transition-all cursor-pointer
        ${isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Rank badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <EpicRankBadge rank={rank} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground mb-2">{epic.title}</h2>
            {epic.description && (
              <p className="text-sm text-muted line-clamp-2">{epic.description}</p>
            )}
          </div>
        </div>
      </div>
      <EpicGoalBar epicId={epic.id} />
    </div>
  );
}

