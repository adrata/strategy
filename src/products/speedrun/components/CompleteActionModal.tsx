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
  type: 'LinkedIn' | 'LinkedIn InMail' | 'LinkedIn DM' | 'Phone' | 'Email' | 'Text';
  notes: string;
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
    type: 'LinkedIn',
    notes: '',
    actionPerformedBy: currentUser?.id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.notes.trim()) {
      alert('Please enter action notes');
      return;
    }
    onSubmit(formData);
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        type: 'LinkedIn',
        notes: '',
        actionPerformedBy: currentUser?.id || ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Complete Action
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Action Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-3">
                Action Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActionLogData['type'] }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
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

            {/* Action Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-3">
                Action Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 resize-none"
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
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.notes.trim()}
                className="flex-1 px-6 py-3 text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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