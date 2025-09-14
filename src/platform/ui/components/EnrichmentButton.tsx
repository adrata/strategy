/**
 * Monaco Enrichment Button Component
 *
 * Reusable button for triggering enrichment from anywhere in the Action Platform:
 * - Single lead enrichment
 * - Bulk lead enrichment
 * - Monaco company enrichment
 * - Real-time progress tracking
 * - Beautiful UI with status indicators
 */

import React, { useState } from "react";
import {
  useLeadEnrichment,
  useEnrichment,
} from "@/platform/hooks/useEnrichment";
import { EnrichmentOptions } from "@/platform/services/enrichment-client";

interface EnrichmentButtonProps {
  // Single lead mode
  leadId?: string;

  // Bulk leads mode
  leadIds?: string[];

  // Monaco search mode
  searchQuery?: string;
  companyIds?: string[];

  // Button configuration
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
  icon?: boolean;

  // Enrichment options
  options?: EnrichmentOptions;

  // Callbacks
  onStart?: (executionId: string) => void;
  onComplete?: (results: any) => void;
  onError?: (error: Error) => void;

  // UI customization
  className?: string;
  disabled?: boolean;
  showProgress?: boolean;
  showResults?: boolean;
}

export function EnrichmentButton({
  leadId,
  leadIds,
  searchQuery,
  companyIds,
  variant = "primary",
  size = "md",
  label,
  icon = true,
  options = {},
  onStart,
  onComplete,
  onError,
  className = "",
  disabled = false,
  showProgress = true,
  showResults = false,
}: EnrichmentButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine enrichment type
  const enrichmentType = leadId
    ? "single_lead"
    : leadIds
      ? "bulk_leads"
      : "monaco_search";

  // Use appropriate hook based on type
  const singleLead = useLeadEnrichment(leadId);
  const { enrichBulkLeads, enrichMonacoSearch, isEnriching, error } =
    useEnrichment();

  // Get appropriate loading state
  const isLoading =
    enrichmentType === "single_lead" ? singleLead.isEnriching : isEnriching;

  // Get appropriate progress
  const progress =
    enrichmentType === "single_lead" ? singleLead.progress : undefined;

  // Handle click based on enrichment type
  const handleClick = async () => {
    if (disabled || isLoading) return;

    try {
      let result;

      switch (enrichmentType) {
        case "single_lead":
          if (!leadId) return;
          result = await singleLead.triggerEnrichment(options);
          break;

        case "bulk_leads":
          if (!leadIds || leadIds['length'] === 0) return;
          result = await enrichBulkLeads({ leadIds, options });
          break;

        case "monaco_search":
          result = await enrichMonacoSearch({
            searchQuery,
            companyIds,
            options,
          });
          break;

        default:
          return;
      }

      if (onStart) {
        onStart(result.executionId);
      }

      // If completed immediately, call onComplete
      if (result['status'] === "completed" && onComplete) {
        onComplete(result.results);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("❌ Enrichment failed:", error);
      if (onError) {
        onError(error);
      }
    }
  };

  // Get button styling
  const getButtonStyles = () => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const variantStyles = {
      primary: `
        bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
        hover:from-blue-700 hover:to-indigo-700 
        focus:ring-blue-500
        ${isLoading ? "opacity-75 cursor-not-allowed" : "shadow-md hover:shadow-lg"}
      `,
      secondary: `
        bg-gray-100 text-gray-700 border border-gray-200
        hover:bg-gray-200 hover:border-gray-300
        focus:ring-gray-500
        ${isLoading ? "opacity-75 cursor-not-allowed" : ""}
      `,
      outline: `
        border border-blue-600 text-blue-600 bg-transparent
        hover:bg-blue-50 hover:border-blue-700
        focus:ring-blue-500
        ${isLoading ? "opacity-75 cursor-not-allowed" : ""}
      `,
      ghost: `
        text-gray-600 bg-transparent
        hover:bg-gray-100 hover:text-gray-700
        focus:ring-gray-500
        ${isLoading ? "opacity-75 cursor-not-allowed" : ""}
      `,
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
  };

  // Get button label
  const getLabel = () => {
    if (label) return label;

    if (isLoading) {
      switch (enrichmentType) {
        case "single_lead":
          return "Enriching Lead...";
        case "bulk_leads":
          return `Enriching ${leadIds?.length} Leads...`;
        case "monaco_search":
          return "Enriching Companies...";
      }
    }

    switch (enrichmentType) {
      case "single_lead":
        return "Enrich Lead";
      case "bulk_leads":
        return `Enrich ${leadIds?.length} Leads`;
      case "monaco_search":
        return "Enrich Companies";
      default:
        return "Enrich";
    }
  };

  // Get icon based on state
  const getIcon = () => {
    if (!icon) return null;

    if (isLoading) {
      return (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }

    return (
      <svg
        className="mr-2 h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={getButtonStyles()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={`Trigger ${enrichmentType.replace("_", " ")} enrichment`}
      >
        {getIcon()}
        {getLabel()}
      </button>

      {/* Progress indicator */}
      {showProgress && progress && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>
              Step {progress.currentStep} of {progress.totalSteps}
            </span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          {progress['estimatedTimeRemaining'] && (
            <div className="text-xs text-gray-500 mt-1">
              ~{Math.round(progress.estimatedTimeRemaining / 1000)}s remaining
            </div>
          )}
        </div>
      )}

      {/* Results preview */}
      {showResults && singleLead['hasResults'] && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
          <div className="text-xs font-medium text-gray-700 mb-1">
            Enrichment Complete
          </div>
          <div className="text-xs text-gray-600">
            ✅ {singleLead.results?.companiesEnriched ?? 0} companies enriched
            <br />✅ {singleLead.results?.peopleEnriched ?? 0} people enriched
            {(singleLead.results?.buyerGroupsCreated ?? 0) > 0 && (
              <>
                <br />✅ {singleLead.results?.buyerGroupsCreated} buyer groups
                identified
              </>
            )}
          </div>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 z-10">
          <div className="text-xs font-medium text-red-700 mb-1">
            Enrichment Failed
          </div>
          <div className="text-xs text-red-600">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </div>
        </div>
      )}
    </div>
  );
}

// Convenience components for specific use cases
export function SingleLeadEnrichButton({
  leadId,
  ...props
}: Omit<EnrichmentButtonProps, "leadIds" | "searchQuery" | "companyIds"> & {
  leadId: string;
}) {
  return <EnrichmentButton leadId={leadId} {...props} />;
}

export function BulkLeadsEnrichButton({
  leadIds,
  ...props
}: Omit<EnrichmentButtonProps, "leadId" | "searchQuery" | "companyIds"> & {
  leadIds: string[];
}) {
  return <EnrichmentButton leadIds={leadIds} {...props} />;
}

export function MonacoEnrichButton({
  searchQuery,
  companyIds,
  ...props
}: Omit<EnrichmentButtonProps, "leadId" | "leadIds">) {
  return (
    <EnrichmentButton
      searchQuery={searchQuery}
      companyIds={companyIds}
      {...props}
    />
  );
}
