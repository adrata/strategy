"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "../layout";
import { CodeExample } from "./CodeExample";
import { ApiKeyCard } from "./ApiKeyCard";
import { KeyIcon } from "@heroicons/react/24/outline";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  isActive: boolean;
}

export function ApiMiddlePanel() {
  const { selectedKey, setSelectedKey } = useApi();
  const params = useParams();
  const router = useRouter();
  const workspace = params.workspace as string;
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<{ fullKey: string; keyPrefix: string; id: string } | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/area/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      const response = await fetch('/api/area/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedKey({
          fullKey: data.data.fullKey,
          keyPrefix: data.data.keyPrefix,
          id: data.data.id
        });
        setShowCreateModal(false);
        setNewKeyName("");
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const response = await fetch(`/api/area/api-keys/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchApiKeys();
        if (selectedKey === id) {
          setSelectedKey(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  };

  const handleSelectKey = (id: string) => {
    setSelectedKey(id);
  };

  // Get the first active API key or the selected key for code examples
  const selectedApiKey = apiKeys.find(k => k.isActive && (selectedKey ? k.id === selectedKey : true));
  const exampleApiKey = selectedApiKey ? `${selectedApiKey.keyPrefix}YOUR_SECRET_KEY` : "adrata_live_YOUR_SECRET_KEY";
  
  // Determine if step 2 should be active (has at least one API key)
  const hasApiKey = apiKeys.length > 0 && apiKeys.some(k => k.isActive);

  return (
    <div className="h-full overflow-y-auto invisible-scrollbar bg-background">
      <div className="w-full pt-9 px-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
            <p className="text-muted mt-1">Manage your API keys</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 text-foreground hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            <KeyIcon className="w-4 h-4" />
            Generate API Key
          </button>
        </div>

        {/* Created Key Modal */}
        {createdKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">API Key Created</h2>
              <p className="text-sm text-muted mb-4">
                Make sure to copy your API key now. You won't be able to see it again!
              </p>
              <div className="bg-gray-100 rounded-lg p-3 mb-4">
                <code className="text-sm font-mono break-all">{createdKey.fullKey}</code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(createdKey.fullKey);
                    alert('Copied to clipboard!');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 text-foreground hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Copy Key
                </button>
                <button
                  onClick={() => setCreatedKey(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">Generate API Key</h2>
              <input
                type="text"
                placeholder="Key name (e.g., Production, Development)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateKey}
                  className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 text-foreground hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Create Key
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyName("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys List - Full Width Management Interface */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted">Loading API keys...</div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="border border-border rounded-lg bg-panel-background p-12 text-center">
            <KeyIcon className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No API keys yet</h3>
            <p className="text-muted mb-6">Generate your first API key to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 text-foreground hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              <KeyIcon className="w-4 h-4" />
              Generate API Key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {apiKeys.map((key) => (
                <ApiKeyCard
                  key={key.id}
                  apiKey={key}
                  onDelete={handleDeleteKey}
                  onSelect={handleSelectKey}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

