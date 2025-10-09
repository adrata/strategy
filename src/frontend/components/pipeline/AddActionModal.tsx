"use client";

/**
 * 🎯 ADD ACTION MODAL
 * 
 * Modal for logging actions on pipeline records
 * Updated to match speedrun/sprint design pattern
 */

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { getCategoryColors } from '@/platform/config/color-palette';

export interface ActionLogData {
  person: string;
  type: 'LinkedIn Friend Request' | 'LinkedIn InMail' | 'LinkedIn DM' | 'Phone' | 'Email' | 'Meeting' | 'Custom';
  time: 'Now' | 'Past' | 'Future';
  action: string;
  nextAction?: string;
  nextActionDate?: string;
  actionPerformedBy?: string;
  personId?: string;
}

export interface AddActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actionData: ActionLogData) => void;
  contextRecord?: any;
  isLoading?: boolean;
  section?: string;
}

export function AddActionModal({
  isOpen,
  onClose,
  onSubmit,
  contextRecord,
  isLoading = false,
  section = 'leads'
}: AddActionModalProps) {
  const { users, currentUser } = useWorkspaceUsers();
  const notesRef = useRef<HTMLTextAreaElement>(null);
  
  // Get person name from context record
  const personName = contextRecord?.fullName || contextRecord?.name || contextRecord?.firstName + ' ' + contextRecord?.lastName || 'Unknown';
  
  const [formData, setFormData] = useState<ActionLogData>({
    person: personName,
    type: 'LinkedIn Friend Request',
    time: 'Now',
    action: '',
    actionPerformedBy: currentUser?.id || ''
  });

  // Update person name when contextRecord changes
  useEffect(() => {
    const newPersonName = contextRecord?.fullName || contextRecord?.name || contextRecord?.firstName + ' ' + contextRecord?.lastName || 'Unknown';
    setFormData(prev => ({ ...prev, person: newPersonName }));
  }, [contextRecord]);

  // Auto-focus notes field when modal opens
  useEffect(() => {
    if (isOpen && notesRef.current) {
      setTimeout(() => {
        notesRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.action.trim()) {
      alert('Please enter action details');
      return;
    }
    
    onSubmit(formData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Cross-platform keyboard shortcut detection
  const isModifierKeyPressed = (event: KeyboardEvent | React.KeyboardEvent) => {
    return event.metaKey || event.ctrlKey;
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isModifierKeyPressed(e) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && formData.action.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  // Document-level keyboard shortcut handler
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      // Handle action type shortcuts (1-6) with cycling
      const isNumberKey = (event.key >= '1' && event.key <= '6') || 
                         (event.code >= 'Digit1' && event.code <= 'Digit6') ||
                         (event.code >= 'Numpad1' && event.code <= 'Numpad6');
      
      if (isNumberKey) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const actionTypes: ActionLogData['type'][] = [
          'LinkedIn Friend Request',
          'LinkedIn InMail', 
          'LinkedIn DM',
          'Phone',
          'Email',
          'Meeting',
          'Custom'
        ];
        
        let pressedNumber: number;
        if (event.key >= '1' && event.key <= '6') {
          pressedNumber = parseInt(event.key);
        } else if (event.code.includes('Digit')) {
          pressedNumber = parseInt(event.code.replace('Digit', ''));
        } else if (event.code.includes('Numpad')) {
          pressedNumber = parseInt(event.code.replace('Numpad', ''));
        } else {
          return;
        }
        
        const currentType = formData.type;
        const currentIndex = actionTypes.indexOf(currentType);
        
        // If pressing the same number as current selection, cycle to next option
        if (currentIndex === pressedNumber - 1) {
          const nextIndex = (currentIndex + 1) % actionTypes.length;
          setFormData(prev => ({ ...prev, type: actionTypes[nextIndex] }));
        } else {
          // Select the pressed number
          setFormData(prev => ({ ...prev, type: actionTypes[pressedNumber - 1] }));
        }
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [isOpen, formData.type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${section === 'speedrun' ? 'bg-green-100' : 'bg-blue-100'}`}>
              <svg className={`w-5 h-5 ${section === 'speedrun' ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Add Action
              </h2>
              <p className="text-sm text-gray-500">
                Log your interaction with {personName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="p-6 space-y-4">
          {/* Person - Auto-filled */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Person
            </label>
            <div className={`px-3 py-2 ${section === 'speedrun' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg text-gray-900 text-sm`}>
              {personName}
            </div>
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActionLogData['type'] }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${section === 'speedrun' ? 'focus:ring-green-500/30 focus:border-green-500' : 'focus:ring-blue-500/30 focus:border-blue-500'} bg-white text-gray-900 text-sm shadow-sm hover:border-gray-400 transition-colors`}
              disabled={isLoading}
            >
              <option value="LinkedIn Friend Request">1. LinkedIn Friend Request</option>
              <option value="LinkedIn InMail">2. LinkedIn InMail</option>
              <option value="LinkedIn DM">3. LinkedIn DM</option>
              <option value="Phone">4. Phone</option>
              <option value="Email">5. Email</option>
              <option value="Meeting">6. Meeting</option>
              <option value="Custom">7. Custom</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Press 1-7 to select, press same number to cycle through options
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              ref={notesRef}
              id="action"
              value={formData.action}
              onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${section === 'speedrun' ? 'focus:ring-green-500' : 'focus:ring-blue-500'} focus:border-transparent text-gray-900 bg-white resize-none text-sm`}
              placeholder="Describe what happened during this interaction..."
              disabled={isLoading}
              required
            />
          </div>

          {/* Action Performed By - Hidden but still tracked */}
          <input
            type="hidden"
            value={formData.actionPerformedBy}
            onChange={(e) => setFormData(prev => ({ ...prev, actionPerformedBy: e.target.value }))}
          />

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 border rounded-lg transition-colors font-semibold text-sm"
              style={{
                backgroundColor: getCategoryColors(section).primary,
                borderColor: getCategoryColors(section).primary,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = getCategoryColors(section).dark;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = getCategoryColors(section).primary;
                }
              }}
            >
              {isLoading ? 'Adding...' : `Add Action (${getCommonShortcut('SUBMIT')})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}