"use client";

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useStacks } from '@/products/stacks/context/StacksProvider';
import { useWorkspaceId } from './utils/workspaceId';

interface AddEpicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEpicCreated: () => void;
}

export function AddEpicModal({ isOpen, onClose, onEpicCreated }: AddEpicModalProps) {
  const { createEpic } = useStacks() || {};
  const workspaceId = useWorkspaceId();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!createEpic) {
      setError('Unable to create epic. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createEpic({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      
      onEpicCreated();
    } catch (err: any) {
      console.error('Failed to create epic:', err);
      setError(err.message || 'Failed to create epic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4 border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Add Epic</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-panel-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Enter epic title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-panel-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Enter epic description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-panel-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-panel-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground bg-panel-background rounded-lg hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Epic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

