"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon, ClipboardDocumentListIcon, BoltIcon } from '@heroicons/react/24/outline';

interface AddNoteActionDropdownProps {
  onAddNote: () => void;
  onAddAction: () => void;
}

export function AddNoteActionDropdown({ onAddNote, onAddAction }: AddNoteActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef['current'] && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddNote = () => {
    onAddNote();
    setIsOpen(false);
  };

  const handleAddAction = () => {
    onAddAction();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[var(--background)] text-black border border-[var(--border)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--panel-background)] transition-colors flex items-center gap-2"
      >
        <PlusIcon className="w-4 h-4" />
        Add Action
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50">
          <button
            onClick={handleAddAction}
            className="w-full text-left px-4 py-3 hover:bg-[var(--panel-background)] border-b border-gray-100 flex items-center gap-3"
          >
            <BoltIcon className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">Add Action</div>
              <div className="text-sm text-[var(--muted)]">Record activity with contact</div>
            </div>
          </button>
          
          <button
            onClick={handleAddNote}
            className="w-full text-left px-4 py-3 hover:bg-[var(--panel-background)] flex items-center gap-3"
          >
            <PlusIcon className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-[var(--foreground)]">Add Note</div>
              <div className="text-sm text-[var(--muted)]">Quick note for any contact</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
