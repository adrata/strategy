"use client";

import React, { useState } from "react";
import { KeyIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  isActive: boolean;
}

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
}

export function ApiKeyCard({ apiKey, onDelete, onSelect }: ApiKeyCardProps) {
  const [copied, setCopied] = useState(false);

  // Mask the key - show only prefix and last 4 characters
  const maskedKey = `${apiKey.keyPrefix}••••••••${apiKey.id.slice(-4)}`;

  const handleCopy = async () => {
    // In real implementation, we'd need to store the full key somewhere secure
    // For now, just copy the masked version
    await navigator.clipboard.writeText(maskedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`p-4 border border-border rounded-lg bg-panel-background hover:border-gray-400 transition-colors cursor-pointer ${
        onSelect ? '' : ''
      }`}
      onClick={() => onSelect?.(apiKey.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <KeyIcon className="w-4 h-4 text-muted" />
            <h3 className="font-medium text-foreground">{apiKey.name}</h3>
            {apiKey.isActive ? (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">Inactive</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <code className="text-sm font-mono text-muted bg-gray-100 px-2 py-1 rounded">
              {maskedKey}
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="text-xs text-gray-600 hover:text-gray-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="text-xs text-muted space-y-1">
            <div>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</div>
            {apiKey.lastUsedAt && (
              <div>Last used: {new Date(apiKey.lastUsedAt).toLocaleDateString()}</div>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${apiKey.name}"? This action cannot be undone.`)) {
              onDelete(apiKey.id);
            }
          }}
          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
          title="Delete API key"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

