"use client";

import React, { useState } from 'react';
import { useWorkspaceUsers } from '@/platform/hooks/useWorkspaceUsers';

interface CompleteActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actionData: ActionLogData) => void;
  personName: string;
  isLoading?: boolean;
}

export interface ActionLogData {
  person: string;
  type: 'LinkedIn' | 'LinkedIn InMail' | 'LinkedIn DM' | 'Phone' | 'Email' | 'Text';
  time: 'Now' | 'Past' | 'Future';
  action: string;
  actionPerformedBy?: string; // User ID of who performed the action
}

export function CompleteActionModal({
  isOpen,
  onClose,
  onSubmit,
  personName,
  isLoading = false
}: CompleteActionModalProps) {
  const { users, currentUser } = useWorkspaceUsers();
  
  const [formData, setFormData] = useState<ActionLogData>({
    person: personName,
    type: 'LinkedIn',
    time: 'Now',
    action: '',
    actionPerformedBy: currentUser?.id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.action.trim()) {
      alert('Please enter action details');
      return;
    }
    onSubmit(formData);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && formData.action.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        person: personName,
        type: 'LinkedIn',
        time: 'Now',
        action: '',
        actionPerformedBy: currentUser?.id || ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">
                  Complete Action
                </h2>
                <p className="text-base text-[var(--muted)]">
                  Log your interaction with {personName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
            {/* Person - Auto-filled */}
            <div>
              <label className="block text-base font-semibold text-[var(--foreground)] mb-3">
                Person
              </label>
              <div className="px-4 py-4 bg-[var(--muted)]/10 border border-[var(--border)] rounded-lg text-[var(--foreground)] text-base">
                {personName}
              </div>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-base font-semibold text-[var(--foreground)] mb-3">
                Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActionLogData['type'] }))}
                className="w-full px-4 py-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-[var(--foreground)] bg-[var(--background)] text-base"
                disabled={isLoading}
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="LinkedIn InMail">LinkedIn InMail</option>
                <option value="LinkedIn DM">LinkedIn DM</option>
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="Text">Text</option>
              </select>
            </div>

            {/* Time */}
            <div>
              <label htmlFor="time" className="block text-base font-semibold text-[var(--foreground)] mb-3">
                Time
              </label>
              <select
                id="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value as ActionLogData['time'] }))}
                className="w-full px-4 py-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-[var(--foreground)] bg-[var(--background)] text-base"
                disabled={isLoading}
              >
                <option value="Now">Now</option>
                <option value="Past">Past</option>
                <option value="Future">Future</option>
              </select>
            </div>

            {/* Action */}
            <div>
              <label htmlFor="action" className="block text-base font-semibold text-[var(--foreground)] mb-3">
                Action
              </label>
              <textarea
                id="action"
                value={formData.action}
                onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                rows={4}
                className="w-full px-4 py-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-[var(--foreground)] bg-[var(--background)] resize-none text-base"
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
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-6 py-4 text-[var(--muted)] bg-[var(--muted)]/10 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 transition-colors disabled:opacity-50 font-semibold text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-4 text-white bg-green-500 border border-transparent rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base shadow-lg"
                title="Complete action (⌘+Enter)"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Completing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Complete</span>
                    <kbd className="px-2 py-1 text-xs bg-white/20 rounded border border-white/30">⌘↵</kbd>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 