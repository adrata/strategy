"use client";

import React, { useState, useEffect } from "react";
import { useApi } from "../layout";
import { CodeExample } from "./CodeExample";
import { ApiKeyCard } from "./ApiKeyCard";
import { KeyIcon, BookOpenIcon, ChartBarIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  isActive: boolean;
}

export function ApiMiddlePanel() {
  const { selectedKey, setSelectedKey, setActiveTab } = useApi();
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

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="w-full p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
            <p className="text-muted mt-1">Manage your API keys and integrations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <KeyIcon className="w-4 h-4" />
            Add API Key
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
              <h2 className="text-lg font-semibold mb-4">Create API Key</h2>
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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


        {/* Step 1: Add API Key */}
        {apiKeys.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">Add your first API key</h2>
                <p className="text-muted mb-4">
                  Create an API key to start integrating with Adrata. You'll use this key to authenticate your requests.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <KeyIcon className="w-4 h-4" />
                  Add API Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Get Buyer Group Data Section */}
        {apiKeys.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">Get buyer group data</h2>
                <p className="text-muted mb-4">Implement or run the code below to get buyer groups from your system.</p>
                <CodeExample apiKey={exampleApiKey} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1 (if keys exist): Show keys */}
        {apiKeys.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-4">Your API Keys</h2>
                <div className="grid grid-cols-1 gap-3">
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
            </div>
          </div>
        )}

        {/* Step 3: Explore More Section */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">Explore more</h2>
              <p className="text-muted mb-4">Continue unlocking Adrata's full API capabilities and setup.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg bg-panel-background hover:border-blue-300 transition-colors">
                  <BookOpenIcon className="w-6 h-6 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">API Documentation</h3>
                  <p className="text-sm text-muted mb-4">
                    Comprehensive API reference and guides for all endpoints.
                  </p>
                  <button 
                    onClick={() => setActiveTab('documentation')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Learn more →
                  </button>
                </div>
                <div className="p-4 border border-border rounded-lg bg-panel-background hover:border-blue-300 transition-colors">
                  <ChartBarIcon className="w-6 h-6 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Rate Limits</h3>
                  <p className="text-sm text-muted mb-4">
                    Understand API rate limits and how to optimize your usage.
                  </p>
                  <button 
                    onClick={() => setActiveTab('usage')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Learn more →
                  </button>
                </div>
                <div className="p-4 border border-border rounded-lg bg-panel-background hover:border-blue-300 transition-colors">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Best Practices</h3>
                  <p className="text-sm text-muted mb-4">
                    Security tips and best practices for API key management.
                  </p>
                  <button 
                    onClick={() => setActiveTab('documentation')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Learn more →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
