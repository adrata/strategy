"use client";

import React from "react";

export function ApiDocumentationPanel() {
  return (
    <div className="h-full overflow-y-auto invisible-scrollbar bg-background">
      <div className="max-w-5xl mx-auto pt-8 p-6 space-y-8">
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
              <div className="bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-white font-mono">
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
              <div className="bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-white font-mono">
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
            
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">Rate Limiting</h3>
              <p className="text-sm text-muted mb-4">
                API requests are rate limited per key. Default limits are 1,000 requests per hour and 10,000 per day. 
                These can be customized per key.
              </p>
              <p className="text-sm text-muted mb-2">Check rate limit status in response headers:</p>
              <div className="bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-white font-mono">
                  <code>{`X-RateLimit-Remaining: 950
X-RateLimit-Reset: 2024-01-20T15:30:00Z`}</code>
                </pre>
              </div>
              <p className="text-sm text-muted mt-4 mb-2">When rate limited, you'll receive:</p>
              <div className="bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-white font-mono">
                  <code>{`HTTP/1.1 429 Too Many Requests
Retry-After: 3600
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}`}</code>
                </pre>
              </div>
            </div>
            
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">IP Restrictions</h3>
              <p className="text-sm text-muted mb-4">
                API keys can be restricted to specific IP addresses or networks. Supports:
              </p>
              <ul className="text-sm text-muted space-y-1 mb-4 ml-4">
                <li>• Single IP addresses (e.g., "192.168.1.1")</li>
                <li>• CIDR notation (e.g., "192.168.1.0/24")</li>
                <li>• Wildcards (e.g., "192.168.*")</li>
              </ul>
              <p className="text-sm text-muted">
                Configure allowlist and denylist when creating or updating API keys.
              </p>
            </div>
            
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">Scopes & Permissions</h3>
              <p className="text-sm text-muted mb-4">
                API keys support fine-grained permissions via scopes. Examples:
              </p>
              <ul className="text-sm text-muted space-y-1 mb-4 ml-4">
                <li>• <code className="bg-gray-100 px-1 rounded">buyer-groups:read</code> - Read buyer groups</li>
                <li>• <code className="bg-gray-100 px-1 rounded">buyer-groups:*</code> - All buyer group operations</li>
                <li>• <code className="bg-gray-100 px-1 rounded">companies:read</code> - Read company data</li>
              </ul>
              <p className="text-sm text-muted">
                If no scopes are set, the key has full access (legacy behavior).
              </p>
            </div>
            
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">Key Management</h3>
              <p className="text-sm text-muted mb-4">
                Manage your API keys through the management endpoints:
              </p>
              <ul className="text-sm text-muted space-y-2 ml-4">
                <li>
                  <code className="bg-gray-100 px-1 rounded">GET /api/area/api-keys</code> - List all keys
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">POST /api/area/api-keys</code> - Create new key
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">PATCH /api/area/api-keys/[id]</code> - Update key settings
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">POST /api/area/api-keys/[id]/rotate</code> - Rotate key (creates new, keeps old active during grace period)
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">DELETE /api/area/api-keys/[id]</code> - Revoke key
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">GET /api/area/api-keys/[id]/usage</code> - Get usage statistics
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Endpoints</h2>
          
          {/* Buyer Groups */}
          <div className="p-6 border border-border rounded-lg bg-panel-background">
            <div className="mb-3">
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
            <div className="bg-black rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-white font-mono">
                <code>{`curl https://api.adrata.com/api/v1/buyer-groups \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</code>
              </pre>
            </div>
            <div className="mt-4">
              <span className="text-xs font-medium text-muted">Example Response:</span>
              <div className="bg-black rounded-lg p-4 overflow-x-auto mt-2">
                <pre className="text-sm text-white font-mono">
                  <code>{`{
  "data": [
    {
      "id": "comp_123",
      "name": "Acme Corp Buying Committee",
      "description": "Buying committee for Acme Corp",
      "company_id": "comp_123",
      "company_name": "Acme Corp",
      "member_count": 5,
      "opportunities_count": 2,
      "status": "active",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-20T14:30:00Z",
      "members": [
        {
          "id": "person_456",
          "name": "John Doe",
          "title": "CEO",
          "email": "john@acme.com",
          "phone": "+1-555-0100",
          "role": "decision_maker",
          "influence_level": 100
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Error Responses */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Error Responses</h2>
          <div className="space-y-4">
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">401 Unauthorized</h3>
              <p className="text-sm text-muted mb-2">Returned when authentication fails or API key is missing/invalid.</p>
              <div className="bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-white font-mono">
                  <code>{`{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}`}</code>
                </pre>
              </div>
            </div>
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">400 Bad Request</h3>
              <p className="text-sm text-muted mb-2">Returned when required parameters are missing or invalid.</p>
              <div className="bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-white font-mono">
                  <code>{`{
  "error": "buyerGroupId required for members",
  "code": "BUYER_GROUP_ID_REQUIRED"
}`}</code>
                </pre>
              </div>
            </div>
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">404 Not Found</h3>
              <p className="text-sm text-muted mb-2">Returned when the requested resource doesn't exist.</p>
              <div className="bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-white font-mono">
                  <code>{`{
  "error": "Buyer group not found",
  "code": "BUYER_GROUP_NOT_FOUND"
}`}</code>
                </pre>
              </div>
            </div>
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">429 Too Many Requests</h3>
              <p className="text-sm text-muted mb-2">Returned when rate limit is exceeded.</p>
              <div className="bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-white font-mono">
                  <code>{`{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}`}</code>
                </pre>
              </div>
            </div>
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">500 Internal Server Error</h3>
              <p className="text-sm text-muted mb-2">Returned when an unexpected error occurs.</p>
              <div className="bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-white font-mono">
                  <code>{`{
  "error": "Failed to get buyer groups data",
  "code": "BUYER_GROUPS_ERROR"
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border border-border rounded-lg bg-panel-background">
              <h3 className="font-semibold text-foreground mb-2">Security</h3>
              <ul className="text-sm text-muted space-y-1">
                <li>• Never commit API keys to version control</li>
                <li>• Use environment variables for API keys</li>
                <li>• Rotate keys regularly (every 90 days) using the rotate endpoint</li>
                <li>• Use separate keys for dev/staging/production</li>
                <li>• Revoke keys immediately if compromised</li>
                <li>• Configure IP restrictions for production keys</li>
                <li>• Use scopes to limit key permissions</li>
                <li>• Monitor usage through the usage endpoint</li>
              </ul>
            </div>
            <div className="p-6 border border-border rounded-lg bg-panel-background">
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

