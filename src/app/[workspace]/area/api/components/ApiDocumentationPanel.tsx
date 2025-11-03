"use client";

import React from "react";
import { BookOpenIcon, CodeBracketIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export function ApiDocumentationPanel() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="w-full p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Documentation</h1>
          <p className="text-muted mt-1">Comprehensive API reference and guides for all endpoints</p>
        </div>

        {/* Getting Started */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Getting Started</h2>
          <div className="space-y-4">
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">Authentication</h3>
              <p className="text-sm text-muted mb-4">
                All API requests must be authenticated using an API key. Include your API key in the Authorization header.
              </p>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100 font-mono">
                  <code>Authorization: Bearer adrata_live_YOUR_SECRET_KEY</code>
                </pre>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">Base URL</h3>
              <p className="text-sm text-muted mb-2">All API requests should be made to:</p>
              <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">https://api.adrata.com/api/v1</code>
            </div>

            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">Response Format</h3>
              <p className="text-sm text-muted mb-4">
                All responses are returned in JSON format with the following structure:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100 font-mono">
                  <code>{`{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Endpoints</h2>
          
          {/* Buyer Groups */}
          <div className="p-6 border border-border rounded-lg bg-panel-background">
            <div className="flex items-center gap-2 mb-3">
              <CodeBracketIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-foreground">GET /buyer-groups</h3>
            </div>
            <p className="text-sm text-muted mb-4">
              Retrieve buyer groups for your workspace. Returns companies with their associated people and opportunities.
            </p>
            <div className="space-y-2 mb-4">
              <div>
                <span className="text-xs font-medium text-muted">Query Parameters:</span>
                <ul className="mt-1 space-y-1 text-sm text-muted ml-4">
                  <li><code className="bg-gray-100 px-1 rounded">type</code> - "groups" or "members" (default: "groups")</li>
                  <li><code className="bg-gray-100 px-1 rounded">buyerGroupId</code> - Required for "members" type</li>
                  <li><code className="bg-gray-100 px-1 rounded">page</code> - Page number (default: 1)</li>
                  <li><code className="bg-gray-100 px-1 rounded">limit</code> - Items per page (default: 50)</li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-100 font-mono">
                <code>{`curl https://api.adrata.com/api/v1/buyer-groups \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Security</h3>
              <ul className="text-sm text-muted space-y-1">
                <li>• Never commit API keys to version control</li>
                <li>• Use environment variables for API keys</li>
                <li>• Rotate keys regularly (every 90 days)</li>
                <li>• Use separate keys for dev/staging/production</li>
                <li>• Revoke keys immediately if compromised</li>
              </ul>
            </div>
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <BookOpenIcon className="w-6 h-6 text-blue-600 mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Error Handling</h3>
              <ul className="text-sm text-muted space-y-1">
                <li>• Always check response status codes</li>
                <li>• Handle rate limiting (429 status)</li>
                <li>• Implement exponential backoff</li>
                <li>• Log errors for debugging</li>
                <li>• Use proper error messages to users</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
