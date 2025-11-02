"use client";

import React, { useEffect, useRef } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  ArrowDownCircleIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

interface StacksContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onMoveToTop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToBottom: () => void;
  onMoveBelowTheLine?: () => void;
  onMoveToDeepBacklog?: () => void;
  onDelete: () => void;
  showMoveBelowTheLine?: boolean;
  showMoveToDeepBacklog?: boolean;
}

export function StacksContextMenu({
  isVisible,
  position,
  onClose,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onMoveToBottom,
  onMoveBelowTheLine,
  onMoveToDeepBacklog,
  onDelete,
  showMoveBelowTheLine = false,
  showMoveToDeepBacklog = false
}: StacksContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  // Adjust position to prevent menu from being cut off at bottom
  useEffect(() => {
    if (!isVisible || !menuRef.current) return;

    const menuHeight = menuRef.current.offsetHeight;
    const windowHeight = window.innerHeight;
    const padding = 10; // Padding from viewport edge

    let adjustedY = position.y;

    // Check if menu would be cut off at bottom
    if (position.y + menuHeight + padding > windowHeight) {
      // Flip menu upward
      adjustedY = position.y - menuHeight;
      
      // If that would put it above the viewport, position at bottom with padding
      if (adjustedY < padding) {
        adjustedY = windowHeight - menuHeight - padding;
      }
    }

    // Also check left/right boundaries
    const menuWidth = menuRef.current.offsetWidth;
    let adjustedX = position.x;
    
    if (position.x + menuWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - menuWidth - padding;
    }
    
    if (adjustedX < padding) {
      adjustedX = padding;
    }

    setAdjustedPosition({ x: adjustedX, y: adjustedY });
  }, [isVisible, position]);

  if (!isVisible) return null;

  const menuItems = [
    {
      label: 'Move to Top',
      icon: ArrowUpIcon,
      onClick: onMoveToTop,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]'
    },
    {
      label: 'Move Up',
      icon: ChevronUpIcon,
      onClick: onMoveUp,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]'
    },
    {
      label: 'Move Down',
      icon: ChevronDownIcon,
      onClick: onMoveDown,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]'
    },
    {
      label: 'Move to Bottom',
      icon: ArrowDownIcon,
      onClick: onMoveToBottom,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]'
    },
    ...(showMoveBelowTheLine && onMoveBelowTheLine ? [{
      label: 'Move Below the Line',
      icon: ArrowDownCircleIcon,
      onClick: onMoveBelowTheLine,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]',
      showDivider: true
    }] : []),
    ...(showMoveToDeepBacklog && onMoveToDeepBacklog ? [{
      label: 'Deep Backlog',
      icon: ArchiveBoxIcon,
      onClick: onMoveToDeepBacklog,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]',
      showDivider: true
    }] : []),
    {
      label: 'Delete',
      icon: TrashIcon,
      onClick: onDelete,
      className: 'text-red-600 hover:bg-red-50'
    }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === menuItems.length - 1;
        const showDivider = (item as any).showDivider || isLast;
        return (
          <React.Fragment key={index}>
            {showDivider && <div className="border-t border-[var(--border)] my-1" />}
            <button
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${item.className} transition-colors`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
