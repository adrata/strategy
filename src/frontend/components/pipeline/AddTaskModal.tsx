"use client";

import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskData) => void;
  isLoading?: boolean;
}

interface TaskData {
  subject: string;
  description?: string;
  priority: 'low' | 'normal' | 'high';
  scheduledDate?: string;
  type: string;
}

export function AddTaskModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: AddTaskModalProps) {
  const [formData, setFormData] = useState<TaskData>({
    subject: '',
    description: '',
    priority: 'normal',
    scheduledDate: '',
    type: 'Task'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      alert('Please enter a task subject');
      return;
    }
    onSubmit(formData);
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        subject: '',
        description: '',
        priority: 'normal',
        scheduledDate: '',
        type: 'Task'
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-xl border border-gray-100 shadow-sm p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
            Add Task
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--hover)] transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Subject */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Task Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter task subject"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-[var(--accent)] transition-colors"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-[var(--accent)] transition-colors resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'normal' | 'high' }))}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-[var(--accent)] transition-colors"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
