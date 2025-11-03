/**
 * Add Channel Modal
 * 
 * Native modal for creating new channels
 */

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, description?: string, isPrivate?: boolean) => void;
}

export function AddChannelModal({ isOpen, onClose, onConfirm }: AddChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim(), description.trim() || undefined, isPrivate);
      setName('');
      setDescription('');
      setIsPrivate(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-4 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Create Channel</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="channel-name" className="block text-sm font-medium text-foreground mb-2">
                Channel Name
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted-light text-muted text-sm">
                  #
                </span>
                <input
                  id="channel-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="general"
                  className="flex-1 rounded-r-md border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="channel-description" className="block text-sm font-medium text-foreground mb-2">
                Description (optional)
              </label>
              <input
                id="channel-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this channel about?"
                className="w-full rounded-md border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Channel Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                    className="h-4 w-4 text-primary focus:ring-primary border-border"
                  />
                  <span className="ml-2 text-sm text-foreground">Public - Anyone in the workspace can view</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                    className="h-4 w-4 text-primary focus:ring-primary border-border"
                  />
                  <span className="ml-2 text-sm text-foreground">Private - Only invited members can view</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
