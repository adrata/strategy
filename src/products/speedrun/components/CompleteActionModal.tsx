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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  Complete Action
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Log your interaction with {personName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="px-3 py-2 bg-[var(--muted)]/10 border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm">
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
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-[var(--foreground)] bg-[var(--background)] text-sm"
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
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Time
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, time: 'Now' }))}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    formData.time === 'Now'
                      ? 'bg-green-100 border-green-300 text-green-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={isLoading}
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, time: 'Past' }))}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    formData.time === 'Past'
                      ? 'bg-green-100 border-green-300 text-green-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={isLoading}
                >
                  Past
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, time: 'Future' }))}
                  className={`px-3 py-2 text-sm rounded-md border ${
                    formData.time === 'Future'
                      ? 'bg-green-100 border-green-300 text-green-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={isLoading}
                >
                  Future
                </button>
              </div>
            </div>

            {/* Action */}
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Action
              </label>
              <textarea
                id="action"
                value={formData.action}
                onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-[var(--foreground)] bg-[var(--background)] resize-none text-sm"
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
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-[var(--muted)] bg-[var(--muted)]/10 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-white bg-green-100 border border-transparent rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg"
                title="Complete action (⌘+Enter)"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Complete</span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-white/20 rounded border border-white/30">⌘↵</kbd>
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