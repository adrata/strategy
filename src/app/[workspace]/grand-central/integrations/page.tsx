"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/platform/shared/components/ui/button";
import { useUnifiedAuth } from "@/platform/auth";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Database,
  Globe,
  Zap,
  Settings,
  Unplug,
  X,
} from "lucide-react";

interface ConnectedProvider {
  id: string;
  provider: string;
  email: string;
  connected: boolean;
  lastUpdated: string;
  tokenStatus: "valid" | "expired";
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  status: "active" | "inactive" | "error";
  email?: string;
  lastUpdated?: string;
  tokenStatus?: "valid" | "expired";
}

const IntegrationsHub = () => {
  const { user } = useUnifiedAuth();
  const [oauthMessage, setOauthMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<
    ConnectedProvider[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Load connected providers from API
  const loadConnectedProviders = useCallback(async () => {
    if (!user?.activeWorkspaceId) return;

    try {
      const response = await fetch(
        `/api/auth/oauth/connect?workspaceId=${user.activeWorkspaceId}`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        setConnectedProviders(data.providers || []);
      }
    } catch (error) {
      console.error("Failed to load connected providers:", error);
    }
  }, [user?.activeWorkspaceId]);

  // Handle OAuth callback messages and load connected providers
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");
    const provider = urlParams.get("provider");
    const email = urlParams.get("email");
    const message = urlParams.get("message");

    if (success === "connected" && provider) {
      setOauthMessage({
        type: "success",
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} successfully connected!${email ? ` Account: ${email}` : ""}`,
      });
      window.history.replaceState({}, "", window.location.pathname);
      loadConnectedProviders();
    } else if (error) {
      let errorMessage = "Failed to connect. Please try again.";
      if (message) {
        errorMessage = decodeURIComponent(message);
      }
      setOauthMessage({
        type: "error",
        message: errorMessage,
      });
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (success || error) {
      setTimeout(() => setOauthMessage(null), 8000);
    }

    if (user?.activeWorkspaceId) {
      loadConnectedProviders();
    }
  }, [user?.activeWorkspaceId, loadConnectedProviders]);

  // Handle secure OAuth connection
  const handleConnect = async (integrationId: string) => {
    if (!user?.activeWorkspaceId) {
      setOauthMessage({
        type: "error",
        message: "Not authenticated. Please sign in first.",
      });
      return;
    }

    setLoading(true);
    setOauthMessage(null);

    try {
      if (integrationId === "google-workspace") {
        const response = await fetch("/api/auth/oauth/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            provider: "google",
            scopes: [
              "https://www.googleapis.com/auth/gmail.readonly",
              "https://www.googleapis.com/auth/gmail.send",
              "https://www.googleapis.com/auth/calendar",
              "https://www.googleapis.com/auth/calendar.events",
            ],
            workspaceId: user.activeWorkspaceId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: Failed to initiate OAuth connection`,
          );
        }

        const data = await response.json();

        if (data['success'] && data.authorizationUrl) {
          window['location']['href'] = data.authorizationUrl;
        } else {
          throw new Error(data.error || "Failed to get authorization URL");
        }
      } else if (integrationId === "zoho-crm") {
        const response = await fetch("/api/auth/zoho", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            workspaceId: user.activeWorkspaceId,
            action: "get_auth_url",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: Failed to initiate Zoho OAuth connection`,
          );
        }

        const data = await response.json();

        if (data['success'] && data.authUrl) {
          window['location']['href'] = data.authUrl;
        } else {
          throw new Error(data.error || "Failed to get Zoho authorization URL");
        }
      } else if (integrationId === "microsoft-outlook") {
        const response = await fetch("/api/auth/oauth/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            provider: "microsoft",
            scopes: [
              "openid",
              "email",
              "profile",
              "https://graph.microsoft.com/Mail.Read",
              "https://graph.microsoft.com/Mail.Send",
              "https://graph.microsoft.com/Calendars.ReadWrite",
              "https://graph.microsoft.com/User.Read",
              "offline_access",
            ],
            workspaceId: user.activeWorkspaceId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: Failed to initiate Outlook OAuth connection`,
          );
        }

        const data = await response.json();

        if (data['success'] && data.authorizationUrl) {
          window['location']['href'] = data.authorizationUrl;
        } else {
          throw new Error(data.error || "Failed to get Outlook authorization URL");
        }
      } else if (integrationId === "zoom") {
        const response = await fetch("/api/auth/oauth/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            provider: "zoom",
            scopes: [
              "meeting:write",
              "meeting:read",
              "recording:read",
              "user:read",
            ],
            workspaceId: user.activeWorkspaceId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: Failed to initiate Zoom OAuth connection`,
          );
        }

        const data = await response.json();

        if (data['success'] && data.authorizationUrl) {
          window['location']['href'] = data.authorizationUrl;
        } else {
          throw new Error(data.error || "Failed to get Zoom authorization URL");
        }
      } else {
        setOauthMessage({
          type: "error",
          message: `${integrationId} integration is not yet implemented. Coming soon!`,
        });
      }
    } catch (error) {
      console.error("OAuth initiation error:", error);
      setOauthMessage({
        type: "error",
        message: `Failed to initiate connection. ${error instanceof Error ? error.message : "Please try again."}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle disconnecting a provider
  const handleDisconnect = async (provider: string) => {
    if (!user?.activeWorkspaceId) {
      setOauthMessage({
        type: "error",
        message: "Not authenticated. Please sign in first.",
      });
      return;
    }

    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
      return;
    }

    try {
      const response = await fetch("/api/auth/oauth/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider,
          workspaceId: user.activeWorkspaceId,
        }),
      });

      if (response.ok) {
        setOauthMessage({
          type: "success",
          message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected successfully.`,
        });
        loadConnectedProviders();
      } else {
        throw new Error("Failed to disconnect provider");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      setOauthMessage({
        type: "error",
        message: "Failed to disconnect. Please try again.",
      });
    }
  };

  // Check if an integration is connected
  const isConnected = (integrationId: string): ConnectedProvider | null => {
    if (integrationId === "google-workspace") {
      return connectedProviders.find((p) => p['provider'] === "google") || null;
    }
    if (integrationId === "microsoft-outlook") {
      return connectedProviders.find((p) => p['provider'] === "outlook") || null;
    }
    if (integrationId === "zoho-crm") {
      return connectedProviders.find((p) => p['provider'] === "zoho") || null;
    }
    if (integrationId === "zoom") {
      return connectedProviders.find((p) => p['provider'] === "zoom") || null;
    }
    return null;
  };

  // Only show integrations that actually exist and work
  const integrations: Integration[] = [
    // Google Workspace
    (() => {
      const googleConnection = isConnected("google-workspace");
      return {
        id: "google-workspace",
        name: "Google Workspace",
        description: "Gmail and Calendar integration",
        icon: Globe,
        connected: !!googleConnection,
        status: googleConnection?.tokenStatus === "valid" ? "active" : "inactive",
        ...(googleConnection?.email && { email: googleConnection.email }),
        ...(googleConnection?.lastUpdated && {
          lastUpdated: googleConnection.lastUpdated,
        }),
        ...(googleConnection?.tokenStatus && {
          tokenStatus: googleConnection.tokenStatus,
        }),
      };
    })(),

    // Microsoft Outlook
    (() => {
      const outlookConnection = isConnected("microsoft-outlook");
      return {
        id: "microsoft-outlook",
        name: "Microsoft Outlook",
        description: "Email and calendar access",
        icon: Mail,
        connected: !!outlookConnection,
        status: outlookConnection?.tokenStatus === "valid" ? "active" : "inactive",
        ...(outlookConnection?.email && { email: outlookConnection.email }),
        ...(outlookConnection?.lastUpdated && {
          lastUpdated: outlookConnection.lastUpdated,
        }),
        ...(outlookConnection?.tokenStatus && {
          tokenStatus: outlookConnection.tokenStatus,
        }),
      };
    })(),

    // Zoho CRM
    (() => {
      const zohoConnection = isConnected("zoho-crm");
      return {
        id: "zoho-crm",
        name: "Zoho CRM",
        description: "CRM data sync and webhooks",
        icon: Database,
        connected: !!zohoConnection,
        status: zohoConnection?.tokenStatus === "valid" ? "active" : "inactive",
        ...(zohoConnection?.email && { email: zohoConnection.email }),
        ...(zohoConnection?.lastUpdated && {
          lastUpdated: zohoConnection.lastUpdated,
        }),
        ...(zohoConnection?.tokenStatus && {
          tokenStatus: zohoConnection.tokenStatus,
        }),
      };
    })(),

    // Zoom
    (() => {
      const zoomConnection = isConnected("zoom");
      return {
        id: "zoom",
        name: "Zoom",
        description: "Video conferencing and meeting recordings",
        icon: Settings,
        connected: !!zoomConnection,
        status: zoomConnection?.tokenStatus === "valid" ? "active" : "inactive",
        ...(zoomConnection?.email && { email: zoomConnection.email }),
        ...(zoomConnection?.lastUpdated && {
          lastUpdated: zoomConnection.lastUpdated,
        }),
        ...(zoomConnection?.tokenStatus && {
          tokenStatus: zoomConnection.tokenStatus,
        }),
      };
    })(),
  ];

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-8 text-center border-b border-[var(--border)]">
          <button
            onClick={() => (window['location']['href'] = "/")}
            className="absolute top-4 right-4 p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--muted)]" />
          </button>

          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Integrations
          </h2>
          <p className="text-[var(--muted)]">
            Connect your essential business applications
          </p>
        </div>

        {/* OAuth Success/Error Message */}
        {oauthMessage && (
          <div
            className={`mx-8 mt-6 p-4 rounded-lg border ${
              oauthMessage['type'] === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{oauthMessage.message}</span>
              <button
                onClick={() => setOauthMessage(null)}
                className="ml-4 text-[var(--muted)] hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Integrations List */}
        <div className="p-8 space-y-4 overflow-y-auto max-h-96">
          {integrations.map((integration) => {
            const IconComponent = integration.icon;
            const connection = isConnected(integration.id);

            return (
              <div
                key={integration.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-[var(--hover-bg)] transition-colors ${
                  integration.connected 
                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' 
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    integration.connected 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-[var(--hover-bg)]'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      integration.connected 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-[var(--foreground)]'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[var(--foreground)]">
                        {integration.name}
                      </h3>
                      {integration['connected'] && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full">
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {integration.description}
                    </p>
                    {integration['connected'] && integration['email'] && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {integration.email}
                      </p>
                    )}
                    {integration['connected'] && integration['lastUpdated'] && (
                      <p className="text-xs text-[var(--muted)] mt-1">
                        Last synced: {new Date(integration.lastUpdated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Enhanced status indicator */}
                  <div className="flex items-center gap-2">
                    {integration.connected ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Active
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Clock className="h-5 w-5 text-[var(--muted)]" />
                        <span className="text-sm text-[var(--muted)]">
                          Not Connected
                        </span>
                      </div>
                    )}
                    {integration['tokenStatus'] === "expired" && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600">
                          Token Expired
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {integration.connected ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        <Unplug className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(integration.id)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      {loading ? "Connecting..." : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Footer */}
        <div className="p-6 border-t border-[var(--border)]">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {connectedProviders.length} Connected
                </span>
              </div>
              <span className="text-[var(--muted)]">•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-[var(--muted)]" />
                <span className="text-sm text-[var(--muted)]">
                  {integrations.length - connectedProviders.length} Available
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {connectedProviders.length > 0 
                ? `Active integrations: ${integrations.filter(i => i.connected).map(i => i.name).join(', ')}`
                : 'No integrations connected yet'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsHub;