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

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        person: personName,
        type: 'LinkedIn',
        action: '',
        actionPerformedBy: currentUser?.id || ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Person - Auto-filled */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Person
              </label>
              <div className="px-4 py-3 bg-[var(--muted)]/10 border border-[var(--border)] rounded-lg text-[var(--foreground)]">
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
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F6FDC] focus:border-transparent text-[var(--foreground)] bg-[var(--background)]"
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

            {/* Action */}
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Action
              </label>
              <textarea
                id="action"
                value={formData.action}
                onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F6FDC] focus:border-transparent text-[var(--foreground)] bg-[var(--background)] resize-none"
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
                className="flex-1 px-4 py-3 text-[var(--muted)] bg-[var(--muted)]/10 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.action.trim()}
                className="flex-1 px-4 py-3 text-white bg-[#2F6FDC] border border-transparent rounded-lg hover:bg-[#4374DE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save & Next'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 