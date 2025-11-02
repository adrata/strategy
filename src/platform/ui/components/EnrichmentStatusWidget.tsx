/**
 * Real-time Enrichment Status Widget
 *
 * Shows live progress of Monaco enrichment executions using Pusher for real-time updates.
 * Displays across all platforms (web, desktop, mobile).
 */

import React, { useState, useEffect, useCallback } from "react";
import { pusherClient, isPusherAvailable } from "@/platform/pusher";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { safeApiFetch } from "@/platform/api-fetch";

interface EnrichmentExecution {
  executionId: string;
  type: "single_lead" | "bulk_leads" | "monaco_search";
  status: "queued" | "running" | "completed" | "failed";
  progress: {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    currentStepName?: string;
  };
  startTime: string;
  estimatedTimeRemaining?: number;
  companiesEnriched: number;
  peopleEnriched: number;
}

interface EnrichmentStatusWidgetProps {
  workspaceId: string;
  className?: string;
  showDetails?: boolean;
  maxExecutions?: number;
}

export function EnrichmentStatusWidget({
  workspaceId,
  className = "",
  showDetails = false,
  maxExecutions = 3,
}: EnrichmentStatusWidgetProps) {
  const [executions, setExecutions] = useState<EnrichmentExecution[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });

  const fetchActiveExecutions = useCallback(async () => {
    try {
      const data = await safeApiFetch(
        `/api/enrichment?workspaceId=${workspaceId}`,
        {},
        {
          success: true,
          executions: [],
          summary: { total: 0, running: 0, completed: 0, failed: 0 },
        },
      );

      if (data['success'] && data['executions'] && Array.isArray(data.executions)) {
        // Show only running/queued executions and recent completed ones
        const activeExecutions = (data.executions || [])
          .filter(
            (exec: any) =>
              exec['status'] === "running" ||
              exec['status'] === "queued" ||
              (exec['status'] === "completed" &&
                Date.now() - new Date(exec.endTime).getTime() < 60000), // 1 minute
          )
          .slice(0, maxExecutions)
          .map((exec: any) => ({
            executionId: exec.executionId,
            type: exec.type,
            status: exec.status,
            progress: exec.progress,
            startTime: exec.startTime,
            estimatedTimeRemaining: exec.estimatedTimeRemaining,
            companiesEnriched: exec.companiesEnriched || 0,
            peopleEnriched: exec.peopleEnriched || 0,
          }));

        setExecutions(activeExecutions);
      }
    } catch (error) {
      console.error("Error fetching active executions:", error);
      // Fallback to empty executions in desktop mode
      setExecutions([]);
    }
  }, [workspaceId, maxExecutions]);

  useEffect(() => {
    if (!isPusherAvailable() || !workspaceId) {
      console.log("Pusher not available or no workspace ID");
      return undefined;
    }

    console.log(
      `🔔 Subscribing to enrichment updates for workspace: ${workspaceId}`,
    );

    // Subscribe to workspace enrichment channel
    const channelName = `enrichment-${workspaceId}`;
    const channel = pusherClient?.subscribe(channelName);

    if (channel) {
      // Handle connection status
      channel.bind("pusher:subscription_succeeded", () => {
        console.log(`✅ Connected to enrichment channel: ${channelName}`);
        setIsConnected(true);

        // Fetch current executions using the callback
        fetchActiveExecutions();
      });

      channel.bind("pusher:subscription_error", (error: any) => {
        console.error("❌ Failed to subscribe to enrichment channel:", error);
        setIsConnected(false);
      });

      // Handle progress updates
      channel.bind("progress-update", (data: any) => {
        console.log("📡 Received enrichment progress:", data);

        setExecutions((prev) => {
          // Ensure prev is always an array
          const safeExecutions = Array.isArray(prev) ? prev : [];
          const existingIndex = safeExecutions.findIndex(
            (exec) => exec['executionId'] === data.executionId,
          );

          if (existingIndex >= 0) {
            // Update existing execution
            const updated = [...safeExecutions];
            const existing = updated[existingIndex];
            if (!existing) return safeExecutions; // Safety check
            updated[existingIndex] = {
              executionId: existing.executionId,
              type: existing.type,
              status: data.status,
              startTime: existing.startTime,
              companiesEnriched: existing.companiesEnriched,
              peopleEnriched: existing.peopleEnriched,
              progress: {
                currentStep: data.step || existing.progress.currentStep,
                totalSteps: existing.progress.totalSteps,
                percentage: data.progress || existing.progress.percentage,
                currentStepName: data.stepName,
              },
              estimatedTimeRemaining: data.estimatedTimeRemaining,
            };
            return updated;
          } else {
            // Add new execution (if we have progress updates for unknown execution)
            const executionId = data.executionId || `execution-${Date.now()}`;
            return [
              ...safeExecutions,
              {
                executionId,
                type: data.type || "monaco_search",
                status: data.status,
                progress: {
                  currentStep: data.step || 0,
                  totalSteps: data.totalSteps || 5,
                  percentage: data.progress || 0,
                  currentStepName: data.stepName,
                },
                startTime: data.timestamp || new Date().toISOString(),
                estimatedTimeRemaining: data.estimatedTimeRemaining,
                companiesEnriched: 0,
                peopleEnriched: 0,
              },
            ].slice(0, maxExecutions);
          }
        });
      });
    }

    return () => {
      if (channel) {
        pusherClient?.unsubscribe(channelName);
        console.log(`🔌 Unsubscribed from enrichment channel: ${channelName}`);
      }
    };
  }, [workspaceId, maxExecutions, fetchActiveExecutions]);

  // Initial data fetch - only run once when component mounts or workspaceId changes
  useEffect(() => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    const fetchInitialExecutions = async () => {
      try {
        const data = await safeApiFetch(
          `/api/enrichment?workspaceId=${workspaceId}`,
          {},
          {
            success: true,
            executions: [],
            summary: { total: 0, running: 0, completed: 0, failed: 0 },
          },
        );

        if (data.success) {
          setExecutions(Array.isArray(data.executions) ? data.executions : []);
          setSummary(data.summary);
        }
      } catch (error) {
        console.error("Failed to fetch enrichment executions:", error);
        // Use fallback data
        setExecutions([]);
        setSummary({ total: 0, running: 0, completed: 0, failed: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialExecutions();
  }, [workspaceId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case "running":
        return <CpuChipIcon className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "queued":
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-muted" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "single_lead":
        return "Lead";
      case "bulk_leads":
        return "Bulk";
      case "monaco_search":
        return "Search";
      default:
        return "Unknown";
    }
  };

  const formatTimeRemaining = (ms?: number) => {
    if (!ms) return "";

    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  // Safety check: ensure executions is an array
  const safeExecutions = Array.isArray(executions) ? executions : [];

  if (!isPusherAvailable() || safeExecutions['length'] === 0) {
    return null;
  }

  return (
    <div
      className={`bg-background border border-border rounded-lg p-3 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CpuChipIcon className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-foreground">
            Monaco Intelligence
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`}
          />
          <span className="text-xs text-muted">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {safeExecutions.map((execution) => (
          <div
            key={execution.executionId}
            className="border border-border rounded-lg p-2"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(execution.status)}
                <span className="text-xs font-medium text-foreground">
                  {getTypeLabel(execution.type)} Enrichment
                </span>
              </div>
              <span className="text-xs text-muted">
                {execution.progress.percentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-loading-bg rounded-full h-1.5 mb-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  execution['status'] === "completed"
                    ? "bg-green-500"
                    : execution['status'] === "failed"
                      ? "bg-red-500"
                      : "bg-blue-500"
                }`}
                style={{ width: `${execution.progress.percentage}%` }}
              />
            </div>

            {/* Details */}
            {showDetails && (
              <div className="text-xs text-muted space-y-0.5">
                {execution['progress']['currentStepName'] && (
                  <div>Step: {execution.progress.currentStepName}</div>
                )}
                <div className="flex justify-between">
                  <span>
                    Progress: {execution.progress.currentStep}/
                    {execution.progress.totalSteps}
                  </span>
                  {execution['estimatedTimeRemaining'] &&
                    execution['status'] === "running" && (
                      <span>
                        ETA:{" "}
                        {formatTimeRemaining(execution.estimatedTimeRemaining)}
                      </span>
                    )}
                </div>
                {(execution.companiesEnriched > 0 ||
                  execution.peopleEnriched > 0) && (
                  <div>
                    Enriched: {execution.companiesEnriched} companies,{" "}
                    {execution.peopleEnriched} people
                  </div>
                )}
              </div>
            )}

            {/* Simple status for non-detailed view */}
            {!showDetails && execution['progress']['currentStepName'] && (
              <div className="text-xs text-muted truncate">
                {execution.progress.currentStepName}
                {execution['estimatedTimeRemaining'] &&
                  execution['status'] === "running" && (
                    <span className="ml-2">
                      • ETA{" "}
                      {formatTimeRemaining(execution.estimatedTimeRemaining)}
                    </span>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
