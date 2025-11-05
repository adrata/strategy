"use client";

import React from 'react';

interface EpicRankBadgeProps {
  rank: number;
  className?: string;
}

/**
 * Squircle badge component for displaying epic rank (E1, E2, etc.)
 * Uses a squircle shape (rounded square) with modern styling
 */
export function EpicRankBadge({ rank, className = '' }: EpicRankBadgeProps) {
  return (
    <div
      className={`
        flex items-center justify-center
        w-10 h-10
        bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10
        border-2 border-[var(--primary)]/40
        text-[var(--primary)]
        font-bold text-sm
        shadow-sm
        transition-all hover:shadow-md
        ${className}
      `}
      style={{
        borderRadius: '14px', // Squircle effect - rounded square with more rounding
      }}
      title={`Epic Rank ${rank} - Most Important`}
    >
      E{rank}
    </div>
  );
}

