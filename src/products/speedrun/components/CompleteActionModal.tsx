"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';
import { getCommonShortcut, COMMON_SHORTCUTS } from '@/platform/utils/keyboard-shortcuts';

interface CompleteActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actionData: ActionLogData) => void;
  personName: string;
  isLoading?: boolean;
  section?: string; // The section type to determine color scheme
  initialData?: ActionLogData; // For undo functionality
}

export interface ActionLogData {
  person: string;
  type: 'LinkedIn Friend Request' | 'LinkedIn InMail' | 'LinkedIn DM' | 'Phone' | 'Email';
  time: 'Now' | 'Past' | 'Future';
  action: string;
  nextAction?: string;
  nextActionDate?: string;
  actionPerformedBy?: string; // User ID of who performed the action
}

export function CompleteActionModal({
  isOpen,
  onClose,
  onSubmit,
  personName,
  isLoading = false,
  section = 'speedrun',
  initialData
}: CompleteActionModalProps) {
  const { users, currentUser } = useWorkspaceUsers();
  const notesRef = useRef<HTMLTextAreaElement>(null);
  
  const [formData, setFormData] = useState<ActionLogData>(() => {
    // Use initialData if provided (for undo), otherwise use defaults
    return initialData ? {
      ...initialData,
      person: personName // Always use current personName
    } : {
      person: personName,
      type: 'LinkedIn Friend Request',
      time: 'Now',
      action: '',
      actionPerformedBy: currentUser?.id || ''
    };
  });

  // Update form data when initialData changes (for undo functionality)
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        person: personName // Always use current personName
      });
    }
  }, [initialData, personName]);

  // Auto-focus notes field when modal opens
  useEffect(() => {
    if (isOpen && notesRef.current) {
      // Small delay to ensure modal is fully rendered
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
    
    // Check if this is an undo action (has initialData)
    const isUndoAction = !!initialData;
    
    if (isUndoAction) {
      console.log('🔄 Resubmitting action after undo - will save to database');
    }
    
    onSubmit(formData);
  };

  // Cross-platform keyboard shortcut detection
  const isModifierKeyPressed = (event: KeyboardEvent | React.KeyboardEvent) => {
    // Mac: metaKey (⌘), Windows/Linux: ctrlKey (Ctrl)
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

  // Document-level keyboard shortcut handler for better reliability
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      // Handle action type shortcuts (1-5) with cycling
      // Check both key and code for better cross-platform compatibility
      const isNumberKey = (event.key >= '1' && event.key <= '5') || 
                         (event.code >= 'Digit1' && event.code <= 'Digit5') ||
                         (event.code >= 'Numpad1' && event.code <= 'Numpad5');
      
      if (isNumberKey) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const actionTypes: ActionLogData['type'][] = [
          'LinkedIn Friend Request',
          'LinkedIn InMail', 
          'LinkedIn DM',
          'Phone',
          'Email'
        ];
        
        // Extract number from key or code
        let pressedNumber: number;
        if (event.key >= '1' && event.key <= '5') {
          pressedNumber = parseInt(event.key);
        } else if (event.code.includes('Digit')) {
          pressedNumber = parseInt(event.code.replace('Digit', ''));
        } else if (event.code.includes('Numpad')) {
          pressedNumber = parseInt(event.code.replace('Numpad', ''));
        } else {
          return; // Fallback if we can't determine the number
        }
        
        const currentType = formData.type;
        const currentIndex = actionTypes.indexOf(currentType);
        
        // If pressing the same number as current selection, cycle to next option
        if (currentIndex === pressedNumber - 1) {
          const nextIndex = (currentIndex + 1) % actionTypes.length;
          setFormData(prev => ({ ...prev, type: actionTypes[nextIndex] }));
        } else {
          // Otherwise, select the pressed number
          setFormData(prev => ({ ...prev, type: actionTypes[pressedNumber - 1] }));
        }
        return;
      }

      // Handle submit shortcut
      if (isModifierKeyPressed(event) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        if (!isLoading && formData.action.trim()) {
          handleSubmit(event as any);
        }
      }
    };

    // Use both capture and bubble phases to ensure we get the event
    document.addEventListener('keydown', handleDocumentKeyDown, true); // Capture phase
    document.addEventListener('keydown', handleDocumentKeyDown, false); // Bubble phase
    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown, true);
      document.removeEventListener('keydown', handleDocumentKeyDown, false);
    };
  }, [isOpen, isLoading, formData.action, formData.type]);

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        person: personName,
        type: 'LinkedIn Friend Request',
        time: 'Now',
        action: '',
        actionPerformedBy: currentUser?.id || ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${section === 'speedrun' ? 'bg-green-100' : 'bg-blue-100'} rounded-lg`}>
                <svg className={`w-5 h-5 ${section === 'speedrun' ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  {initialData ? '🔄 Undo Action' : 'Complete Action'}
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  {initialData 
                    ? `Resubmit your interaction with ${personName} (undo mode - will resave to database)`
                    : `Log your interaction with ${personName}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
            {/* Person - Auto-filled */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Person
              </label>
              <div className={`px-3 py-2 ${section === 'speedrun' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg text-[var(--foreground)] text-sm`}>
                {personName}
              </div>
            </div>


            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-[var(--foreground)] mb-2">
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
              </select>
              <p className="text-xs text-[var(--muted)] mt-1">
                Press 1-5 to select, press same number to cycle through options
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Notes
              </label>
              <textarea
                ref={notesRef}
                id="action"
                value={formData.action}
                onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 ${section === 'speedrun' ? 'focus:ring-green-500' : 'focus:ring-blue-500'} focus:border-transparent text-[var(--foreground)] bg-[var(--background)] resize-none text-sm`}
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
                className={`flex-1 px-4 py-3 border rounded-lg transition-colors font-semibold text-sm ${
                  formData.action.trim() && !isLoading
                    ? section === 'speedrun' 
                      ? 'bg-green-200 border-green-300 text-green-700 hover:bg-green-300' // Active state when typing
                      : 'bg-blue-200 border-blue-300 text-blue-700 hover:bg-blue-300'
                    : section === 'speedrun'
                      ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' // Default state
                      : 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`Complete action (${getCommonShortcut('SUBMIT')})`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </div>
                ) : (
                  initialData ? `Resubmit (${getCommonShortcut('SUBMIT')})` : `Complete (${getCommonShortcut('SUBMIT')})`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 