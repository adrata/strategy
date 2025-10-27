/**
 * Context Menu Component for Table Rows
 * Provides View and Delete options on right-click
 */

import React, { useEffect, useRef } from 'react';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';

interface ContextMenuProps {
  x: number;
  y: number;
  record: any;
  section: string;
  onClose: () => void;
  onDelete: (record: any) => void;
}

export function ContextMenu({ x, y, record, section, onClose, onDelete }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { navigateToRecord } = useWorkspaceNavigation();

  // Close menu on click outside
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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleView = () => {
    navigateToRecord(section, record.id);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${section.slice(0, -1)}?`)) {
      onDelete(record);
    }
    onClose();
  };

  // Position menu at cursor location
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 1000,
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-[var(--panel-background)] border border-[var(--border)] rounded-md shadow-lg py-1 min-w-[120px]"
    >
      <button
        onClick={handleView}
        className="w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--hover)] transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View
      </button>
      
      <div className="border-t border-[var(--border)] my-1"></div>
      
      <button
        onClick={handleDelete}
        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>
  );
}
