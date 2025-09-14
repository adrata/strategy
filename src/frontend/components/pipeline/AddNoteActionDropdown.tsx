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
        className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <PlusIcon className="w-4 h-4" />
        Add Action
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <button
            onClick={handleAddAction}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-3"
          >
            <BoltIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900">Add Action</div>
              <div className="text-sm text-gray-500">Record activity with contact</div>
            </div>
          </button>
          
          <button
            onClick={handleAddNote}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
          >
            <PlusIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900">Add Note</div>
              <div className="text-sm text-gray-500">Quick note for any contact</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
