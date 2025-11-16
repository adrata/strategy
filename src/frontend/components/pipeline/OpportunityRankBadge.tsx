"use client";

import React from 'react';

interface OpportunityRankBadgeProps {
  rank: number;
  className?: string;
}

/**
 * Squircle badge component for displaying opportunity rank (1, 2, 3, etc.)
 * Uses a squircle shape (rounded square) with modern styling matching Stacks
 */
export function OpportunityRankBadge({ rank, className = '' }: OpportunityRankBadgeProps) {
  return (
    <div
      className={`
        flex items-center justify-center
        w-6 h-6
        bg-panel-background
        text-foreground
        font-bold text-xs
        flex-shrink-0 shrink-0
        ${className}
      `}
      style={{
        borderRadius: '12px', // Squircle effect - rounded square matching Stacks
      }}
      title={`Rank ${rank}`}
    >
      {rank}
    </div>
  );
}

