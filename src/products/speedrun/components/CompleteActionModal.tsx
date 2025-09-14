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
  actionLog: string;
  type: 'LinkedIn' | 'LinkedIn InMail' | 'LinkedIn DM' | 'Phone' | 'Email' | 'Text';
  notes: string;
  nextAction: string;
  nextActionDate: string;
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
    actionLog: '',
    type: 'LinkedIn',
    notes: '',
    nextAction: '',
    nextActionDate: '',
    actionPerformedBy: currentUser?.id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.actionLog.trim()) {
      alert('Please enter an action log title');
      return;
    }
    onSubmit(formData);
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        actionLog: '',
        type: 'LinkedIn',
        notes: '',
        nextAction: '',
        nextActionDate: '',
        actionPerformedBy: currentUser?.id || ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Complete Action Log
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Completing:</strong> {personName}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Action Log Title */}
            <div>
              <label htmlFor="actionLog" className="block text-sm font-medium text-gray-700 mb-1">
                Action Log *
              </label>
              <input
                type="text"
                id="actionLog"
                value={formData.actionLog}
                onChange={(e) => setFormData(prev => ({ ...prev, actionLog: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Initial outreach completed"
                required
                disabled={isLoading}
              />
            </div>

            {/* Action Performed By Dropdown */}
            <div>
              <label htmlFor="actionPerformedBy" className="block text-sm font-medium text-gray-700 mb-1">
                Action Performed By
              </label>
              <select
                id="actionPerformedBy"
                value={formData.actionPerformedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, actionPerformedBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user['email'] === currentUser?.email ? '(Me)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Dropdown */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActionLogData['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about this interaction..."
                disabled={isLoading}
              />
            </div>

            {/* Next Action */}
            <div>
              <label htmlFor="nextAction" className="block text-sm font-medium text-gray-700 mb-1">
                Next Action
              </label>
              <input
                type="text"
                id="nextAction"
                value={formData.nextAction}
                onChange={(e) => setFormData(prev => ({ ...prev, nextAction: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Schedule follow-up call"
                disabled={isLoading}
              />
            </div>

            {/* Next Action Date */}
            <div>
              <label htmlFor="nextActionDate" className="block text-sm font-medium text-gray-700 mb-1">
                Next Action Date
              </label>
              <input
                type="date"
                id="nextActionDate"
                value={formData.nextActionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, nextActionDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.actionLog.trim()}
                className="flex-1 px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit & Next'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 