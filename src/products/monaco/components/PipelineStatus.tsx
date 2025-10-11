import React from "react";
import {
  CheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface PipelineStatusProps {
  status: "running" | "completed" | "failed" | "pending";
  progress?: number;
  totalSteps?: number;
  completedSteps?: number;
  executionTime?: number;
  error?: string;
  companyName?: string;
}

export function PipelineStatus({
  status,
  progress = 0,
  totalSteps = 25,
  completedSteps = 0,
  executionTime,
  error,
  companyName,
}: PipelineStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckIcon className="w-5 h-5 text-green-500" />;
      case "failed":
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <SparklesIcon className="w-5 h-5 text-[var(--muted)]" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "running":
        return "border-blue-200 bg-blue-50 dark:bg-blue-900/20";
      case "completed":
        return "border-green-200 bg-green-50 dark:bg-green-900/20";
      case "failed":
        return "border-red-200 bg-red-50 dark:bg-red-900/20";
      default:
        return "border-[var(--border)] bg-[var(--panel-background)]/20";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "running":
        return `Analyzing ${companyName || "company"}... (${completedSteps}/${totalSteps} steps)`;
      case "completed":
        return `Intelligence report ready for ${companyName || "company"}`;
      case "failed":
        return `Analysis failed for ${companyName || "company"}`;
      default:
        return "Pipeline ready to run";
    }
  };

  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {getStatusText()}
          </p>
          {executionTime && status === "completed" && (
            <p className="text-xs text-[var(--muted)] mt-1">
              Completed in {Math.round(executionTime / 1000)}s
            </p>
          )}
          {error && status === "failed" && (
            <p className="text-xs text-red-600 mt-1">Error: {error}</p>
          )}
        </div>
      </div>

      {/* Progress bar for running pipelines */}
      {status === "running" && (
        <div className="space-y-2">
          <div className="w-full bg-[var(--loading-bg)] rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--muted)]">
            <span>Step {completedSteps + 1}: Analyzing data...</span>
            <span>{progressPercentage}%</span>
          </div>
        </div>
      )}

      {/* Results summary for completed pipelines */}
      {status === "completed" && (
        <div className="grid grid-cols-3 gap-4 text-center pt-3 border-t border-[var(--border)] dark:border-[var(--border)]">
          <div>
            <p className="text-xs text-[var(--muted)]">Intelligence Score</p>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              95/100
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Key Insights</p>
            <p className="text-sm font-semibold text-[var(--foreground)]">12</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Action Items</p>
            <p className="text-sm font-semibold text-[var(--foreground)]">8</p>
          </div>
        </div>
      )}
    </div>
  );
}
