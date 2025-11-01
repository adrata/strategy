"use client";

import React, { useEffect, useRef } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface StacksContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onMoveToTop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToBottom: () => void;
}

export function StacksContextMenu({
  isVisible,
  position,
  onClose,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onMoveToBottom
}: StacksContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (!isVisible) return null;

  const menuItems = [
    {
      label: 'Move to Top',
      icon: ArrowUpIcon,
      onClick: onMoveToTop,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]'
    },
    {
      label: 'Move Up One',
      icon: ChevronUpIcon,
      onClick: onMoveUp,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]'
    },
    {
      label: 'Move Down One',
      icon: ChevronDownIcon,
      onClick: onMoveDown,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]'
    },
    {
      label: 'Move to Bottom',
      icon: ArrowDownIcon,
      onClick: onMoveToBottom,
      className: 'text-[var(--foreground)] hover:bg-[var(--hover)]'
    }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {menuItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${item.className} transition-colors`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
