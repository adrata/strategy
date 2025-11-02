"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SpeedrunPerson } from '../types/SpeedrunTypes';

interface OutcomeTrackingPopupProps {
  person: SpeedrunPerson;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OutcomeData) => void;
}

export interface OutcomeData {
  actionType: string;
  notes: string;
  outcome?: string;
  duration?: number;
}

const ACTION_TYPES = [
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'call', label: 'Call', icon: '📞' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'text', label: 'Text', icon: '💬' },
  { value: 'other', label: 'Other', icon: '📝' }
];

export function OutcomeTrackingPopup({ person, isOpen, onClose, onSave }: OutcomeTrackingPopupProps) {
  const [actionType, setActionType] = useState('email');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      setActionType('email');
      setNotes('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!notes.trim()) return;

    setIsSubmitting(true);
    
    const outcomeData: OutcomeData = {
      actionType,
      notes: notes.trim()
    };

    try {
      await onSave(outcomeData);
      onClose();
    } catch (error) {
      console.error('Failed to save outcome:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [actionType, notes, onSave, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // CMD+Enter to save (consistent with other modals)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleSave, onClose]);

  const selectedAction = ACTION_TYPES.find(type => type['value'] === actionType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Log Action - {person.name}
          </h3>
          <p className="text-sm text-muted mt-1">
            {person.title} at {typeof person.company === 'object' ? person.company?.name : person.company}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Action Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Action Type
            </label>
            <div className="relative">
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {ACTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Describe the ${selectedAction?.label.toLowerCase()} outcome...`}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              autoFocus
            />
          </div>

          {/* Quick outcome buttons for calls */}
          {actionType === 'call' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quick Actions
              </label>
              <div className="flex flex-wrap gap-2">
                {['Connected', 'Left VM', 'No Answer', 'Follow-up Scheduled'].map((outcome) => (
                  <button
                    key={outcome}
                    onClick={() => setNotes(prev => prev + (prev ? ' • ' : '') + outcome)}
                    className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-between items-center">
          <div className="text-xs text-muted">
            Press <kbd className="px-1 py-0.5 bg-primary/10 rounded text-primary">⌘+Enter</kbd> to save
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!notes.trim() || isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
