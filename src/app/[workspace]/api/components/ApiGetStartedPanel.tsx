"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export function ApiGetStartedPanel() {
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

  // Get the first active API key for code examples
  const selectedApiKey = apiKeys.find(k => k.isActive);
  const exampleApiKey = selectedApiKey ? `${selectedApiKey.keyPrefix}YOUR_SECRET_KEY` : "adrata_live_YOUR_SECRET_KEY";
  
  // Determine if step 2 should be active (has at least one API key)
  const hasApiKey = apiKeys.length > 0 && apiKeys.some(k => k.isActive);

  // Handle successful API test - redirect to keys page
  const handleTestSuccess = () => {
    router.push(`/${workspace}/api/keys`);
  };

  return (
    <div className="h-full overflow-y-auto invisible-scrollbar bg-background">
      <div className="max-w-5xl mx-auto pt-9 p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Get Started</h1>
            <p className="text-muted mt-1">Find your first buyer group</p>
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

        {/* Step 1: Generate API Key (if no keys) */}
        {apiKeys.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="w-0.5 h-20 bg-gray-300 -mt-1 mb-1"></div>
              </div>
              <div className="flex-1 pt-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">Generate an API Key</h2>
                <p className="text-muted mb-4">
                  Create an API key to get access to our system and authenticate requests.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 text-foreground hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  <KeyIcon className="w-4 h-4" />
                  Generate API Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 (if keys exist): Show keys */}
        {apiKeys.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="w-0.5 h-20 bg-gray-300 -mt-1 mb-1"></div>
              </div>
              <div className="flex-1 pt-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">Generate an API Key</h2>
                <p className="text-muted mb-4">
                  Your API keys are shown below. Use them to authenticate requests and access our system.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {apiKeys.map((key) => (
                    <ApiKeyCard
                      key={key.id}
                      apiKey={key}
                      onDelete={async (id) => {
                        try {
                          const response = await fetch(`/api/area/api-keys/${id}`, {
                            method: 'DELETE'
                          });
                          if (response.ok) {
                            await fetchApiKeys();
                          }
                        } catch (error) {
                          console.error('Failed to delete API key:', error);
                          alert('Failed to delete API key');
                        }
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 text-foreground hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  <KeyIcon className="w-4 h-4" />
                  Generate another API Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Get Buyer Group Data Section - Always Visible */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                hasApiKey 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <div className={`w-0.5 h-20 -mt-1 mb-1 ${
                hasApiKey ? 'bg-gray-300' : 'bg-gray-200'
              }`}></div>
            </div>
            <div className={`flex-1 pt-1 ${hasApiKey ? '' : 'opacity-70'}`}>
              <h2 className={`text-xl font-semibold mb-2 ${
                hasApiKey ? 'text-foreground' : 'text-gray-500'
              }`}>
                Get buyer group data
              </h2>
              <p className={`mb-4 ${
                hasApiKey ? 'text-muted' : 'text-gray-500'
              }`}>
                Implement or run the code below to get buyer groups from your system.
              </p>
              <CodeExample apiKey={exampleApiKey} muted={!hasApiKey} onTestSuccess={handleTestSuccess} />
            </div>
          </div>
        </div>

        {/* Explore More Section */}
        <div className="space-y-4 mt-8">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8"></div>
            </div>
            <div className="flex-1 opacity-70">
              <h2 className="text-lg font-semibold text-gray-500 mb-2">Explore more</h2>
            <p className="text-gray-500 mb-4">Continue unlocking Adrata's full API capabilities and setup.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:border-gray-300 transition-colors">
                <h3 className="font-semibold text-gray-500 mb-2">API Documentation</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Comprehensive API reference and guides for all endpoints.
                </p>
                <button
                  onClick={() => router.push(`/${workspace}/api/documentation`)}
                  className="text-sm text-gray-500 hover:text-gray-600 font-medium"
                >
                  Learn more →
                </button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:border-gray-300 transition-colors">
                <h3 className="font-semibold text-gray-500 mb-2">Rate Limits</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Understand API rate limits and how to optimize your usage.
                </p>
                <button
                  onClick={() => router.push(`/${workspace}/api/usage`)}
                  className="text-sm text-gray-500 hover:text-gray-600 font-medium"
                >
                  Learn more →
                </button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:border-gray-300 transition-colors">
                <h3 className="font-semibold text-gray-500 mb-2">Best Practices</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Security tips and best practices for API key management.
                </p>
                <button
                  onClick={() => router.push(`/${workspace}/api/documentation`)}
                  className="text-sm text-gray-500 hover:text-gray-600 font-medium"
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

