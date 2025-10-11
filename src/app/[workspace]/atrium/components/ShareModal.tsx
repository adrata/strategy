"use client";

import React, { useState } from "react";
import { AtriumDocument } from "../types/document";
import { 
  XMarkIcon,
  LinkIcon,
  EyeIcon,
  PencilIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AtriumDocument;
}

export function ShareModal({ isOpen, onClose, document }: ShareModalProps) {
  const [shareType, setShareType] = useState<'internal' | 'external' | 'public'>('internal');
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit' | 'admin'>('view');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [maxViews, setMaxViews] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [allowedEmails, setAllowedEmails] = useState<string>('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowComments, setAllowComments] = useState(false);
  const [watermark, setWatermark] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateShare = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      // TODO: Implement actual API call
      // const response = await fetch(`/api/atrium/documents/${document.id}/share`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     shareType,
      //     permission,
      //     expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      //     maxViews: maxViews ? parseInt(maxViews) : null,
      //     password: password || null,
      //     allowedEmails: allowedEmails.split(',').map(email => email.trim()).filter(Boolean),
      //     allowDownload,
      //     allowComments,
      //     watermark,
      //   }),
      // });
      
      // Mock response
      const mockShareUrl = `https://atrium.example.com/shared/${Math.random().toString(36).substr(2, 9)}`;
      setShareUrl(mockShareUrl);
    } catch (err) {
      setError('Failed to create share link. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // TODO: Show success toast
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-[var(--panel-background)]0 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-[var(--background)] rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Share Document</h3>
              <p className="text-sm text-[var(--muted)]">{document.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {!shareUrl ? (
              /* Share Configuration */
              <>
                {/* Share Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Share Type
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'internal', label: 'Internal', description: 'Only workspace members can access' },
                      { value: 'external', label: 'External', description: 'Anyone with the link can access' },
                      { value: 'public', label: 'Public', description: 'Publicly accessible' },
                    ].map((type) => (
                      <label key={type.value} className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--panel-background)]">
                        <input
                          type="radio"
                          name="shareType"
                          value={type.value}
                          checked={shareType === type.value}
                          onChange={(e) => setShareType(e.target.value as any)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{type.label}</div>
                          <div className="text-sm text-[var(--muted)]">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Permission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permission Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'view', label: 'View', icon: EyeIcon, description: 'Can view only' },
                      { value: 'comment', label: 'Comment', icon: PencilIcon, description: 'Can view and comment' },
                      { value: 'edit', label: 'Edit', icon: PencilIcon, description: 'Can view, comment, and edit' },
                      { value: 'admin', label: 'Admin', icon: ShieldCheckIcon, description: 'Full access' },
                    ].map((perm) => {
                      const Icon = perm.icon;
                      return (
                        <label key={perm.value} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--panel-background)]">
                          <input
                            type="radio"
                            name="permission"
                            value={perm.value}
                            checked={permission === perm.value}
                            onChange={(e) => setPermission(e.target.value as any)}
                          />
                          <Icon className="w-5 h-5 text-[var(--muted)]" />
                          <div>
                            <div className="font-medium text-[var(--foreground)]">{perm.label}</div>
                            <div className="text-sm text-[var(--muted)]">{perm.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-4">
                  <h4 className="font-medium text-[var(--foreground)]">Advanced Options</h4>
                  
                  {/* Expiration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Max Views */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Views
                    </label>
                    <input
                      type="number"
                      value={maxViews}
                      onChange={(e) => setMaxViews(e.target.value)}
                      placeholder="No limit"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Protection
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Optional password"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Email Whitelist */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowed Email Addresses
                    </label>
                    <input
                      type="text"
                      value={allowedEmails}
                      onChange={(e) => setAllowedEmails(e.target.value)}
                      placeholder="email1@example.com, email2@example.com"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Additional Settings */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allowDownload}
                        onChange={(e) => setAllowDownload(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Allow download</span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allowComments}
                        onChange={(e) => setAllowComments(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Allow comments</span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={watermark}
                        onChange={(e) => setWatermark(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Add watermark</span>
                    </label>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateShare}
                    disabled={isCreating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? 'Creating...' : 'Create Share Link'}
                  </button>
                </div>
              </>
            ) : (
              /* Share Link Created */
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <LinkIcon className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                    Share Link Created
                  </h4>
                  <p className="text-sm text-[var(--muted)]">
                    Your document is now accessible via the link below
                  </p>
                </div>

                <div className="p-4 bg-[var(--panel-background)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShareUrl('');
                      setError(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
