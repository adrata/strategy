"use client";

import React, { useEffect, useRef } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface OpportunityContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onMoveToTop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToBottom: () => void;
  onDelete?: () => void;
}

export function OpportunityContextMenu({
  isVisible,
  position,
  onClose,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onMoveToBottom,
  onDelete
}: OpportunityContextMenuProps) {
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
      className: 'text-foreground hover:bg-hover'
    },
    {
      label: 'Move Up',
      icon: ChevronUpIcon,
      onClick: onMoveUp,
      className: 'text-foreground hover:bg-hover'
    },
    {
      label: 'Move Down',
      icon: ChevronDownIcon,
      onClick: onMoveDown,
      className: 'text-foreground hover:bg-hover'
    },
    {
      label: 'Move to Bottom',
      icon: ArrowDownIcon,
      onClick: onMoveToBottom,
      className: 'text-foreground hover:bg-hover'
    },
    ...(onDelete ? [{
      label: 'Delete',
      icon: TrashIcon,
      onClick: onDelete,
      className: 'text-error hover:bg-error/10'
    }] : [])
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === menuItems.length - 1;
        return (
          <React.Fragment key={index}>
            {isLast && <div className="border-t border-border my-1" />}
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

