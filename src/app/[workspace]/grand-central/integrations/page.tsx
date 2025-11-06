"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/platform/shared/components/ui/button";
import { useUnifiedAuth } from "@/platform/auth";
import Nango from '@nangohq/frontend';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Unplug,
} from "lucide-react";

interface Connection {
  id: string;
  provider: string;
  providerConfigKey: string;
  nangoConnectionId: string;
  connectionName: string;
  status: 'active' | 'pending' | 'error' | 'inactive';
  metadata: any;
  lastSyncAt?: string;
  createdAt: string;
}

const IntegrationsPage = () => {
  const { user } = useUnifiedAuth();
  const [oauthMessage, setOauthMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load connections from Nango API
  const loadConnections = useCallback(async () => {
    if (!user?.activeWorkspaceId) return;

    try {
      const response = await fetch(
        `/api/v1/integrations/nango/connections?workspaceId=${user.activeWorkspaceId}`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Filter to only show Outlook connections
        const outlookConnections = (data.connections || []).filter(
          (conn: Connection) => conn.provider === 'outlook' || conn.providerConfigKey === 'outlook'
        );
        setConnections(outlookConnections);
      }
    } catch (error) {
      console.error("Failed to load connections:", error);
    }
  }, [user?.activeWorkspaceId]);

  // Handle OAuth callback messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");
    const provider = urlParams.get("provider");

    if (success === "connected" && provider) {
      setOauthMessage({
        type: "success",
        message: `Outlook successfully connected!`,
      });
      window.history.replaceState({}, "", window.location.pathname);
      loadConnections();
    } else if (error) {
      let errorMessage = "Failed to connect. Please try again.";
      if (error === "connection_not_found") {
        errorMessage = "Connection not found. Please try connecting again.";
      } else if (error === "connection_test_failed") {
        errorMessage = "Connection test failed. Please try again.";
      } else if (error === "callback_error") {
        errorMessage = "An error occurred during connection. Please try again.";
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
      loadConnections();
    }
  }, [user?.activeWorkspaceId, loadConnections]);

  // Handle Nango Outlook connection
  const handleConnect = async () => {
    if (!user?.activeWorkspaceId) {
      setOauthMessage({
        type: "error",
        message: "Not authenticated. Please sign in first.",
      });
      return;
    }

    setIsConnecting(true);
    setOauthMessage(null);

    try {
      // Step 1: Get session token from backend
      const response = await fetch("/api/v1/integrations/nango/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider: "outlook",
          workspaceId: user.activeWorkspaceId,
          redirectUrl: `${window.location.origin}/${user.activeWorkspaceId}/grand-central/integrations`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: Failed to initiate Outlook OAuth connection`;
        const errorDetails = errorData.details ? ` (${errorData.details})` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      const data = await response.json();

      if (!data.sessionToken) {
        throw new Error(data.error || "Failed to get session token from backend");
      }

      // Step 2: Use Nango frontend SDK to open connect UI
      const nango = new Nango();
      const connect = nango.openConnectUI({
        onEvent: (event) => {
          if (event.type === 'close') {
            setIsConnecting(false);
            // User closed the modal
          } else if (event.type === 'connect') {
            setIsConnecting(false);
            setOauthMessage({
              type: "success",
              message: "Outlook successfully connected!",
            });
            // Reload connections after successful connection
            setTimeout(() => {
              loadConnections();
            }, 1000);
          }
        },
      });

      // Set the session token to trigger the auth flow
      connect.setSessionToken(data.sessionToken);

    } catch (error) {
      console.error("OAuth initiation error:", error);
      let errorMessage = "Failed to initiate connection.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide user-friendly messages for common errors
        if (error.message.includes("Nango is not configured")) {
          errorMessage = "Nango is not configured. Please contact your administrator to set up the Nango integration.";
        } else if (error.message.includes("not configured in Nango")) {
          errorMessage = "Outlook integration is not configured in Nango. Please configure it in your Nango dashboard.";
        } else if (error.message.includes("NANGO_SECRET_KEY")) {
          errorMessage = "Nango configuration is missing. Please set up Nango environment variables.";
        }
      }
      
      setOauthMessage({
        type: "error",
        message: errorMessage,
      });
      setIsConnecting(false);
    }
  };

  // Handle disconnecting
  const handleDisconnect = async (connectionId: string) => {
    if (!user?.activeWorkspaceId) {
      setOauthMessage({
        type: "error",
        message: "Not authenticated. Please sign in first.",
      });
      return;
    }

    if (!confirm("Are you sure you want to disconnect Outlook?")) {
      return;
    }

    try {
      const response = await fetch("/api/v1/integrations/nango/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          connectionId,
          workspaceId: user.activeWorkspaceId,
        }),
      });

      if (response.ok) {
        setOauthMessage({
          type: "success",
          message: "Outlook disconnected successfully.",
        });
        loadConnections();
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      setOauthMessage({
        type: "error",
        message: "Failed to disconnect. Please try again.",
      });
    }
  };

  const outlookConnection = connections.find(
    (conn) => conn.provider === 'outlook' || conn.providerConfigKey === 'outlook'
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Integrations
        </h1>
        <p className="text-muted">
          Connect your Outlook account to sync emails
        </p>
      </div>

      {/* OAuth Success/Error Message */}
      {oauthMessage && (
        <div
          className={`mx-6 mt-4 p-4 rounded-lg border ${
            oauthMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{oauthMessage.message}</span>
            <button
              onClick={() => setOauthMessage(null)}
              className="ml-4 text-muted hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl">
          {/* Outlook Integration Card */}
          <div
            className={`p-6 border rounded-lg ${
              outlookConnection?.status === 'active'
                ? 'border-green-200 bg-green-50/50'
                : 'border-border bg-background'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    outlookConnection?.status === 'active'
                      ? 'bg-green-100'
                      : 'bg-hover'
                  }`}
                >
                  <Mail
                    className={`h-6 w-6 ${
                      outlookConnection?.status === 'active'
                        ? 'text-green-600'
                        : 'text-foreground'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      Microsoft Outlook
                    </h3>
                    {outlookConnection?.status === 'active' && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">
                    Email and calendar access via Nango
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {outlookConnection ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {outlookConnection.status === 'active' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        Active
                      </span>
                    </>
                  ) : outlookConnection.status === 'pending' ? (
                    <>
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-yellow-600">
                        Pending
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-red-600">
                        Error
                      </span>
                    </>
                  )}
                </div>

                {outlookConnection.lastSyncAt && (
                  <p className="text-xs text-muted">
                    Last synced: {new Date(outlookConnection.lastSyncAt).toLocaleString()}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDisconnect(outlookConnection.id)}
                  >
                    <Unplug className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-4">
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isConnecting ? "Connecting..." : "Connect Outlook"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
