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
  Loader2,
  Calendar,
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
    details?: string;
  } | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<'outlook' | 'gmail' | 'google-calendar' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [pendingDisconnectId, setPendingDisconnectId] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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
        // Filter to show Outlook, Gmail, and Google Calendar connections
        const emailConnections = (data.connections || []).filter(
          (conn: Connection) => 
            conn.provider === 'outlook' || 
            conn.provider === 'gmail' ||
            conn.provider === 'google-calendar' ||
            conn.providerConfigKey === 'outlook' ||
            conn.providerConfigKey === 'google-mail' ||
            conn.providerConfigKey === 'gmail' ||
            conn.providerConfigKey === 'google-calendar'
        );
        setConnections(emailConnections);
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
      const providerName = provider === 'gmail' ? 'Gmail' : provider === 'google-calendar' ? 'Google Calendar' : 'Outlook';
      const actionText = provider === 'google-calendar' ? 'Syncing calendar...' : 'Processing emails...';
      setOauthMessage({
        type: "success",
        message: `${providerName} successfully connected! ${actionText}`,
      });
      window.history.replaceState({}, "", window.location.pathname);
      loadConnections();
      // Trigger email sync automatically
      setTimeout(() => {
        triggerEmailSync();
      }, 1500);
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

  // Auto-trigger email sync when connection is established
  const triggerEmailSync = useCallback(async () => {
    if (!user?.activeWorkspaceId || isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await fetch('/api/v1/integrations/nango/sync-now', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Email sync triggered:', data);
        
        // Poll for connection status updates
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max
        
        const pollStatus = setInterval(async () => {
          attempts++;
          
          // Fetch fresh connections
          try {
            const connResponse = await fetch(
              `/api/v1/integrations/nango/connections?workspaceId=${user.activeWorkspaceId}`,
              { credentials: "include" }
            );
            
            if (connResponse.ok) {
              const connData = await connResponse.json();
              const emailConnections = (connData.connections || []).filter(
                (conn: Connection) => 
                  conn.provider === 'outlook' || 
                  conn.provider === 'gmail' ||
                  conn.provider === 'google-calendar' ||
                  conn.providerConfigKey === 'outlook' ||
                  conn.providerConfigKey === 'google-mail' ||
                  conn.providerConfigKey === 'gmail' ||
                  conn.providerConfigKey === 'google-calendar'
              );
              const outlookConn = emailConnections.find(c => c.provider === 'outlook' || c.providerConfigKey === 'outlook');
              const gmailConn = emailConnections.find(c => c.provider === 'gmail' || c.providerConfigKey === 'google-mail' || c.providerConfigKey === 'gmail');
              const calendarConn = emailConnections.find(c => c.provider === 'google-calendar' || c.providerConfigKey === 'google-calendar');
              
              // Update connections state
              setConnections(emailConnections);
              
              // If connection is active and has lastSyncAt, sync is complete
              const activeConn = outlookConn || gmailConn || calendarConn;
              if (activeConn?.status === 'active' && activeConn?.lastSyncAt) {
                clearInterval(pollStatus);
                setIsSyncing(false);
                setOauthMessage({
                  type: "success",
                  message: "Emails synced successfully!",
                });
                setTimeout(() => setOauthMessage(null), 5000);
              } else if (attempts >= maxAttempts) {
                clearInterval(pollStatus);
                setIsSyncing(false);
                // Still show success if connection is active
                if (activeConn?.status === 'active') {
                  setOauthMessage({
                    type: "success",
                    message: "Connection active. Emails are syncing in the background.",
                  });
                }
              }
            }
          } catch (err) {
            console.error('Error polling connection status:', err);
          }
        }, 1000); // Poll every second

        // Cleanup on unmount
        return () => clearInterval(pollStatus);
      } else {
        setIsSyncing(false);
        console.error('Failed to trigger email sync');
      }
    } catch (error) {
      setIsSyncing(false);
      console.error('Error triggering email sync:', error);
    }
  }, [user?.activeWorkspaceId, isSyncing]);

  // Auto-refresh connections periodically when syncing
  useEffect(() => {
    if (!isSyncing) return;

    const interval = setInterval(() => {
      loadConnections();
    }, 2000); // Refresh every 2 seconds while syncing

    return () => clearInterval(interval);
  }, [isSyncing, loadConnections]);

  // Handle Nango connection (Outlook, Gmail, or Google Calendar)
  const handleConnect = async (provider: 'outlook' | 'gmail' | 'google-calendar' = 'outlook') => {
    if (!user?.activeWorkspaceId) {
      setOauthMessage({
        type: "error",
        message: "Not authenticated. Please sign in first.",
      });
      return;
    }

    setConnectingProvider(provider);
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
          provider,
          workspaceId: user.activeWorkspaceId,
          redirectUrl: `${window.location.origin}/${user.activeWorkspaceId}/grand-central/integrations`,
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (e) {
          // If JSON parsing fails, use the text as error message
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const errorMessage = errorData.error || `HTTP ${response.status}: Failed to initiate Outlook OAuth connection`;
        const errorDetails = errorData.details || errorData.message || '';
        const debugInfo = errorData.debug ? JSON.stringify(errorData.debug, null, 2) : '';
        
        // Log full error for debugging
        console.error('❌ [OAUTH] Backend error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorMessage,
          errorDetails,
          debugInfo
        });
        
        throw new Error(`${errorMessage}${errorDetails ? '\n\n' + errorDetails : ''}${debugInfo ? '\n\nDebug:\n' + debugInfo : ''}`);
      }

      const data = await response.json();

      if (!data.sessionToken) {
        // Show detailed error from backend if available
        const errorMsg = data.error || "Failed to get session token from backend";
        const errorDetails = data.details ? `\n\n${data.details}` : '';
        const debugInfo = data.debug ? `\n\nDebug: ${JSON.stringify(data.debug, null, 2)}` : '';
        throw new Error(`${errorMsg}${errorDetails}${debugInfo}`);
      }

      // Step 2: Use Nango frontend SDK to open connect UI
      // Nango frontend SDK can be initialized without config (publicKey is optional)
      // We fetch it from our secure API endpoint for better customization if available
      const nangoConfig: any = {};
      
      // Optionally fetch public key and host from our secure API endpoint
      // This allows customization without exposing env vars to frontend
      try {
        const configResponse = await fetch('/api/v1/integrations/nango/config', {
          credentials: 'include'
        });
        if (configResponse.ok) {
          const config = await configResponse.json();
          // Public key is optional but recommended for custom branding
          if (config.publicKey) {
            nangoConfig.publicKey = config.publicKey;
          }
          // Host is optional (defaults to https://api.nango.dev)
          if (config.host && config.host !== 'https://api.nango.dev') {
            nangoConfig.host = config.host;
          }
        }
      } catch (configError) {
        // Non-critical: Nango SDK works without config
        console.warn('Could not fetch Nango config, using defaults:', configError);
      }

      // Initialize Nango SDK (works with or without config)
      const nango = new Nango(Object.keys(nangoConfig).length > 0 ? nangoConfig : undefined);
      
      // Store popup window reference for closing attempts
      let popupWindow: Window | null = null;
      let messageHandlerCleanup: (() => void) | null = null;
      
      // Set up postMessage listener to detect when popup sends success message
      // The Nango popup (api.nango.dev) sends postMessage when connection succeeds
      const messageHandler = (event: MessageEvent) => {
        // Only accept messages from Nango's domain
        if (!event.origin.includes('nango.dev') && !event.origin.includes('api.nango.dev')) {
          return;
        }
        
        console.log('📧 [OAUTH] Received postMessage from popup:', {
          origin: event.origin,
          data: event.data,
          source: event.source
        });
        
        // Check for various Nango success messages
        const isSuccessMessage = 
          event.data?.type === 'nango-oauth-success' ||
          event.data?.type === 'nango-connected' ||
          event.data?.type === 'nango-auth-success' ||
          (typeof event.data === 'string' && event.data.includes('connected')) ||
          (event.data?.success === true) ||
          (event.data?.event === 'nango:auth:success');
        
        if (isSuccessMessage) {
          console.log('✅ [OAUTH] Connection success detected via postMessage, attempting to close popup...');
          
          // Try to close the popup via event.source
          try {
            if (event.source && typeof (event.source as Window).close === 'function') {
              (event.source as Window).close();
              console.log('✅ [OAUTH] Popup closed via event.source');
            }
          } catch (e) {
            console.log('⚠️ [OAUTH] Could not close via event.source (cross-origin restriction):', e);
          }
          
          // Try to close stored popup reference
          try {
            if (popupWindow && !popupWindow.closed) {
              popupWindow.close();
              console.log('✅ [OAUTH] Popup closed via stored reference');
            }
          } catch (e) {
            console.log('⚠️ [OAUTH] Could not close via stored reference:', e);
          }
          
          // Clean up message handler after successful close attempt
          if (messageHandlerCleanup) {
            messageHandlerCleanup();
            messageHandlerCleanup = null;
          }
        }
      };
      
      // Add message listener
      window.addEventListener('message', messageHandler);
      messageHandlerCleanup = () => {
        window.removeEventListener('message', messageHandler);
      };
      
      const connect = nango.openConnectUI({
        onEvent: (event) => {
          console.log('📧 [OAUTH] Nango SDK event:', event.type, event);
          
          if (event.type === 'close') {
            setConnectingProvider(null);
            if (messageHandlerCleanup) {
              messageHandlerCleanup();
              messageHandlerCleanup = null;
            }
            console.log('📧 [OAUTH] User closed the modal');
          } else if (event.type === 'connect') {
            setConnectingProvider(null);
            const providerName = data.provider === 'gmail' ? 'Gmail' : data.provider === 'google-calendar' ? 'Google Calendar' : 'Outlook';
            const actionText = data.provider === 'google-calendar' ? 'Syncing calendar...' : 'Processing emails...';
            setOauthMessage({
              type: "success",
              message: `${providerName} successfully connected! ${actionText}`,
            });
            
            console.log('✅ [OAUTH] Connection successful, attempting to close popup...');
            
            // The Nango SDK should close the popup automatically, but we try multiple methods
            // Note: Due to browser cross-origin security, we cannot programmatically close
            // windows from different origins. The SDK uses postMessage to communicate.
            
            // Try to close popup after a short delay to allow SDK to process
            setTimeout(() => {
              try {
                // Check if we can access the popup window
                if (popupWindow && !popupWindow.closed) {
                  popupWindow.close();
                  console.log('✅ [OAUTH] Popup closed via timeout');
                }
              } catch (e) {
                console.log('⚠️ [OAUTH] Could not close popup (expected due to cross-origin):', e);
              }
              
              // Clean up message handler
              if (messageHandlerCleanup) {
                messageHandlerCleanup();
                messageHandlerCleanup = null;
              }
            }, 1000);
            
            // Reload connections after successful connection
            setTimeout(() => {
              loadConnections();
              // Trigger email sync automatically
              triggerEmailSync();
            }, 1000);
          } else if (event.type === 'error') {
            setConnectingProvider(null);
            if (messageHandlerCleanup) {
              messageHandlerCleanup();
              messageHandlerCleanup = null;
            }
            setOauthMessage({
              type: "error",
              message: event.error || "An error occurred during connection",
            });
          }
        },
      });

      // Note: The Nango SDK manages the popup window internally.
      // Due to browser cross-origin security restrictions, we cannot directly
      // access or close the popup window from our code. The SDK uses postMessage
      // to communicate between the popup and parent window.
      // The popup should close automatically when the 'connect' event fires,
      // but if it doesn't, users can manually close it by clicking the button.
      
      // Set the session token to trigger the auth flow
      connect.setSessionToken(data.sessionToken);

    } catch (error) {
      console.error("OAuth initiation error:", error);
      let errorMessage = "Failed to initiate connection.";
      let errorDetails: string | null = null;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Extract details if present in the error message
        const detailsMatch = error.message.match(/\n\n(.*?)(?:\n\nDebug:|$)/s);
        if (detailsMatch) {
          errorDetails = detailsMatch[1].trim();
        }
        
        // Provide user-friendly messages for common errors
        if (error.message.includes("Nango is not configured")) {
          errorMessage = "Nango is not configured. Please contact your administrator to set up the Nango integration.";
        } else if (error.message.includes("not configured in Nango") || error.message.includes("Integration does not exist")) {
          errorMessage = "Email integration is not configured in Nango. Please check:";
          errorDetails = error.message.includes("details:") 
            ? error.message.split("details:")[1]?.trim() 
            : "1. Verify NANGO_SECRET_KEY in Vercel matches the 'prod' environment secret key\n2. Ensure the integration is saved in Nango dashboard\n3. Check that Client ID and Secret are correctly entered";
        } else if (error.message.includes("NANGO_SECRET_KEY")) {
          errorMessage = "Nango configuration is missing. Please set up Nango environment variables.";
        }
      }
      
      setOauthMessage({
        type: "error",
        message: errorMessage,
        details: errorDetails || undefined
      });
      setConnectingProvider(null);
    }
  };

  // Handle disconnecting - show confirmation modal
  const handleDisconnect = (connectionId: string) => {
    if (!user?.activeWorkspaceId) {
      setOauthMessage({
        type: "error",
        message: "Not authenticated. Please sign in first.",
      });
      return;
    }

    setPendingDisconnectId(connectionId);
    setShowDisconnectConfirm(true);
  };

  // Cancel disconnect confirmation
  const handleDisconnectCancel = () => {
    setShowDisconnectConfirm(false);
    setPendingDisconnectId(null);
  };

  // Confirm and execute disconnect
  const handleDisconnectConfirm = async () => {
    if (!pendingDisconnectId || !user?.activeWorkspaceId || isDisconnecting) {
      return;
    }

    const connectionId = pendingDisconnectId;
    setIsDisconnecting(true);
    setShowDisconnectConfirm(false);
    setPendingDisconnectId(null);

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
        const connection = connections.find(c => c.id === connectionId);
        const providerName = connection?.provider === 'gmail' ? 'Gmail' : connection?.provider === 'google-calendar' ? 'Google Calendar' : 'Outlook';
        setOauthMessage({
          type: "success",
          message: `${providerName} disconnected successfully.`,
        });
        await loadConnections();
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      setOauthMessage({
        type: "error",
        message: "Failed to disconnect. Please try again.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const outlookConnection = connections.find(
    (conn) => conn.provider === 'outlook' || conn.providerConfigKey === 'outlook'
  );
  
  // Gmail connection: Must have provider='gmail' OR providerConfigKey='google-mail'/'gmail'
  // EXCLUDE any connection that is explicitly a calendar connection
  const gmailConnection = connections.find(
    (conn) => {
      const isGmail = (conn.provider === 'gmail' || 
                       conn.providerConfigKey === 'google-mail' ||
                       conn.providerConfigKey === 'gmail');
      const isCalendar = (conn.provider === 'google-calendar' || 
                         conn.providerConfigKey === 'google-calendar');
      return isGmail && !isCalendar; // Explicitly exclude calendar connections
    }
  );
  
  // Google Calendar connection: Must have provider='google-calendar' OR providerConfigKey='google-calendar'
  // EXCLUDE any connection that is explicitly a Gmail connection
  const googleCalendarConnection = connections.find(
    (conn) => {
      const isCalendar = (conn.provider === 'google-calendar' || 
                         conn.providerConfigKey === 'google-calendar');
      const isGmail = (conn.provider === 'gmail' || 
                       conn.providerConfigKey === 'google-mail' ||
                       conn.providerConfigKey === 'gmail');
      return isCalendar && !isGmail; // Explicitly exclude Gmail connections
    }
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Integrations
        </h1>
        <p className="text-muted">
          Connect your email accounts to automatically sync incoming and outgoing emails in real-time
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
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium">{oauthMessage.message}</div>
              {oauthMessage.details && (
                <div className={`mt-2 text-sm whitespace-pre-line ${
                  oauthMessage.type === "success" ? "text-green-700" : "text-red-700"
                }`}>
                  {oauthMessage.details}
                </div>
              )}
            </div>
            <button
              onClick={() => setOauthMessage(null)}
              className="ml-4 text-muted hover:text-gray-700 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {outlookConnection.status === 'active' && !isSyncing ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        Connected
                      </span>
                    </>
                  ) : isSyncing || (outlookConnection.status === 'pending' && isSyncing) ? (
                    <>
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-blue-600">
                        Processing emails...
                      </span>
                    </>
                  ) : outlookConnection.status === 'pending' ? (
                    <>
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-yellow-600">
                        Setting up connection...
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
                    Emails sync automatically via webhooks and cron (every 5 minutes)
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnect(outlookConnection.id)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Unplug className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-4">
                <Button
                  onClick={() => handleConnect('outlook')}
                  disabled={connectingProvider === 'outlook'}
                  className={`bg-blue-600 hover:bg-blue-700 text-white w-40 ${
                    connectingProvider === 'outlook' ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {connectingProvider === 'outlook' ? "Connecting..." : "Connect Outlook"}
                </Button>
              </div>
            )}
          </div>

          {/* Gmail Integration Card */}
          <div
            className={`p-6 border rounded-lg ${
              gmailConnection?.status === 'active'
                ? 'border-green-200 bg-green-50/50'
                : 'border-border bg-background'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    gmailConnection?.status === 'active'
                      ? 'bg-green-100'
                      : 'bg-hover'
                  }`}
                >
                  <Mail
                    className={`h-6 w-6 ${
                      gmailConnection?.status === 'active'
                        ? 'text-green-600'
                        : 'text-foreground'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      Gmail
                    </h3>
                    {gmailConnection?.status === 'active' && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">
                    Email access via Nango
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {gmailConnection ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {gmailConnection.status === 'active' && !isSyncing ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        Connected
                      </span>
                    </>
                  ) : isSyncing || (gmailConnection.status === 'pending' && isSyncing) ? (
                    <>
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-blue-600">
                        Processing emails...
                      </span>
                    </>
                  ) : gmailConnection.status === 'pending' ? (
                    <>
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-yellow-600">
                        Setting up connection...
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

                {gmailConnection.lastSyncAt && (
                  <p className="text-xs text-muted">
                    Emails sync automatically via webhooks and cron (every 5 minutes)
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnect(gmailConnection.id)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Unplug className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-4">
                <Button
                  onClick={() => handleConnect('gmail')}
                  disabled={connectingProvider === 'gmail'}
                  className={`bg-blue-600 hover:bg-blue-700 text-white w-40 ${
                    connectingProvider === 'gmail' ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {connectingProvider === 'gmail' ? "Connecting..." : "Connect Gmail"}
                </Button>
              </div>
            )}
          </div>

          {/* Google Calendar Integration Card */}
          <div
            className={`p-6 border rounded-lg md:col-span-2 ${
              googleCalendarConnection?.status === 'active'
                ? 'border-green-200 bg-green-50/50'
                : 'border-border bg-background'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    googleCalendarConnection?.status === 'active'
                      ? 'bg-green-100'
                      : 'bg-hover'
                  }`}
                >
                  <Calendar
                    className={`h-6 w-6 ${
                      googleCalendarConnection?.status === 'active'
                        ? 'text-green-600'
                        : 'text-foreground'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      Google Calendar
                    </h3>
                    {googleCalendarConnection?.status === 'active' && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">
                    Calendar access via Nango
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {googleCalendarConnection ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {googleCalendarConnection.status === 'active' && !isSyncing ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        Connected
                      </span>
                    </>
                  ) : isSyncing || (googleCalendarConnection.status === 'pending' && isSyncing) ? (
                    <>
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-blue-600">
                        Syncing calendar...
                      </span>
                    </>
                  ) : googleCalendarConnection.status === 'pending' ? (
                    <>
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm text-yellow-600">
                        Setting up connection...
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

                {googleCalendarConnection.lastSyncAt && (
                  <p className="text-xs text-muted">
                    Calendar syncs automatically via webhooks and cron (every 5 minutes)
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnect(googleCalendarConnection.id)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Unplug className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-4">
                <Button
                  onClick={() => handleConnect('google-calendar')}
                  disabled={connectingProvider === 'google-calendar'}
                  className={`bg-blue-600 hover:bg-blue-700 text-white w-40 ${
                    connectingProvider === 'google-calendar' ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {connectingProvider === 'google-calendar' ? "Connecting..." : "Connect Google Calendar"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" 
          onClick={handleDisconnectCancel}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Disconnect Email Account</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to disconnect this email account? You'll need to reconnect to sync emails.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDisconnectCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnectConfirm}
                disabled={isDisconnecting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;
