"use client";

/**
 * Release Notes Modal Component
 * 
 * Modal for creating release notes when shipping items
 */

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (releaseNotes: {
    title: string;
    version: string;
    notes: string;
    items: string[];
  }) => void;
  shippedItems: any[];
}

export function ReleaseNotesModal({ isOpen, onClose, onSave, shippedItems }: ReleaseNotesModalProps) {
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>(
    shippedItems.map(item => item.id)
  );

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !version.trim() || !notes.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    onSave({
      title: title.trim(),
      version: version.trim(),
      notes: notes.trim(),
      items: selectedItems
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Ship Release
            </h2>
            <p className="text-sm text-muted mt-1">
              Create release notes for {shippedItems.length} shipped {shippedItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Release Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Release Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q1 2025 Feature Release"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Version <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., v1.2.0"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Release Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Release Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what's in this release..."
              rows={8}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Shipped Items List */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Items in This Release ({selectedItems.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
              {shippedItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-2 hover:bg-hover rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleItemToggle(item.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted mt-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-background border border-border rounded-lg hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ship Release
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

