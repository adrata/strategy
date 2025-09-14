/**
 * Monaco Enrichment React Hooks
 *
 * Provides React hooks for integrating enrichment into Action Platform components:
 * - useEnrichment: Main hook for triggering enrichment
 * - useEnrichmentStatus: Hook for tracking execution status
 * - useLeadEnrichment: Convenience hook for lead-specific enrichment
 */

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EnrichmentClient,
  EnrichmentOptions,
  EnrichmentResult,
  ExecutionStatus,
} from "@/platform/services/enrichment-client";
import { useUnifiedAuth } from "@/platform/auth-unified";

// Hook for main enrichment operations
export function useEnrichment() {
  // Use actual authenticated user instead of hardcoded values
  const { user: authUser } = useUnifiedAuth();
  const queryClient = useQueryClient();

  // Get user's actual workspace ID - NO HARDCODED VALUES
  const workspaceId = authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;
  
  const client = (workspaceId && userId)
    ? new EnrichmentClient(workspaceId, userId)
    : null;

  // Single lead enrichment
  const enrichSingleLead = useMutation({
    mutationFn: ({
      leadId,
      options = {},
    }: {
      leadId: string;
      options?: EnrichmentOptions;
    }) => {
      if (!client) throw new Error("Client not initialized");
      return client.enrichSingleLead(leadId, options);
    },
    onSuccess: (result) => {
      console.log("✅ Single lead enrichment started:", result.executionId);
      // Invalidate leads data to refetch with enrichment
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      console.error("❌ Single lead enrichment failed:", error);
    },
  });

  // Bulk leads enrichment
  const enrichBulkLeads = useMutation({
    mutationFn: ({
      leadIds,
      options = {},
    }: {
      leadIds: string[];
      options?: EnrichmentOptions;
    }) => {
      if (!client) throw new Error("Client not initialized");
      return client.enrichBulkLeads(leadIds, options);
    },
    onSuccess: (result) => {
      console.log("✅ Bulk leads enrichment started:", result.executionId);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      console.error("❌ Bulk leads enrichment failed:", error);
    },
  });

  // Monaco search enrichment
  const enrichMonacoSearch = useMutation({
    mutationFn: ({
      searchQuery,
      companyIds,
      options = {},
    }: {
      searchQuery?: string;
      companyIds?: string[];
      options?: EnrichmentOptions;
    }) => {
      if (!client) throw new Error("Client not initialized");
      return client.enrichMonacoSearch(searchQuery, companyIds, options);
    },
    onSuccess: (result) => {
      console.log("✅ Monaco enrichment started:", result.executionId);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => {
      console.error("❌ Monaco enrichment failed:", error);
    },
  });

  // List active executions
  const { data: executions, isLoading: isLoadingExecutions } = useQuery({
    queryKey: ["enrichment-executions", workspaceId],
    queryFn: () => client?.listExecutions(),
    enabled: !!client,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  return {
    // Mutation functions
    enrichSingleLead: enrichSingleLead.mutateAsync,
    enrichBulkLeads: enrichBulkLeads.mutateAsync,
    enrichMonacoSearch: enrichMonacoSearch.mutateAsync,

    // Status
    isEnriching:
      enrichSingleLead.isPending ||
      enrichBulkLeads.isPending ||
      enrichMonacoSearch.isPending,
    error:
      enrichSingleLead.error ||
      enrichBulkLeads.error ||
      enrichMonacoSearch.error,

    // Executions
    executions: executions?.executions || [],
    executionsSummary: executions?.summary,
    isLoadingExecutions,

    // Client instance for advanced usage
    client,
  };
}

// Hook for tracking specific execution status
export function useEnrichmentStatus(executionId?: string) {
  const { client } = useEnrichment();

  const {
    data: status,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["enrichment-status", executionId],
    queryFn: () => client?.getExecutionStatus(executionId!),
    enabled: !!client && !!executionId,
    refetchInterval: 3000, // Poll every 3 seconds for active executions
  });

  const cancelExecution = useMutation({
    mutationFn: () => {
      if (!client || !executionId)
        throw new Error("Client or executionId not available");
      return client.cancelExecution(executionId);
    },
    onSuccess: () => {
      console.log("✅ Execution cancelled:", executionId);
    },
    onError: (error) => {
      console.error("❌ Failed to cancel execution:", error);
    },
  });

  return {
    status,
    isLoading,
    error,
    cancelExecution: cancelExecution.mutateAsync,
    isCancelling: cancelExecution.isPending,
  };
}

// Convenience hook for lead-specific enrichment
export function useLeadEnrichment(leadId?: string) {
  const { enrichSingleLead, isEnriching, error } = useEnrichment();
  const [executionId, setExecutionId] = useState<string>();
  const { status } = useEnrichmentStatus(executionId);

  const triggerEnrichment = useCallback(
    async (options: EnrichmentOptions = {}) => {
      if (!leadId) {
        throw new Error("Lead ID is required");
      }

      try {
        const result = await enrichSingleLead({ leadId, options });
        setExecutionId(result.executionId);
        return result;
      } catch (error) {
        console.error("❌ Lead enrichment failed:", error);
        throw error;
      }
    },
    [leadId, enrichSingleLead],
  );

  // Auto-clear execution ID when completed
  useEffect(() => {
    if (
      status?.status &&
      ["completed", "failed", "partial"].includes(status.status)
    ) {
      setTimeout(() => setExecutionId(undefined), 5000); // Clear after 5 seconds
    }
  }, [status?.status]);

  return {
    triggerEnrichment,
    isEnriching: isEnriching || status?.status === "running",
    status,
    executionId,
    error,

    // Quick status checks
    isCompleted: status?.status === "completed",
    isFailed: status?.status === "failed",
    hasResults:
      !!status?.intelligence && Object.keys(status.intelligence).length > 0,
    progress: status?.progress,

    // Intelligence results
    intelligence: status?.intelligence,
    results: status?.results,
  };
}

// Hook for Monaco-specific enrichment workflows
export function useMonacoEnrichment() {
  const { enrichMonacoSearch, isEnriching, error, executions } =
    useEnrichment();
  const [activeSearches, setActiveSearches] = useState<Map<string, string>>(
    new Map(),
  );

  const enrichCompanies = useCallback(
    async (
      companies: Array<{ id: string; name: string }>,
      options: EnrichmentOptions = {},
    ) => {
      const companyIds = companies.map((c) => c.id);

      try {
        const result = await enrichMonacoSearch({ companyIds, options });

        // Track this search
        setActiveSearches(
          (prev) => new Map(prev.set(result.executionId, "companies")),
        );

        return result;
      } catch (error) {
        console.error("❌ Monaco company enrichment failed:", error);
        throw error;
      }
    },
    [enrichMonacoSearch],
  );

  const enrichSearch = useCallback(
    async (searchQuery: string, options: EnrichmentOptions = {}) => {
      try {
        const result = await enrichMonacoSearch({ searchQuery, options });

        // Track this search
        setActiveSearches(
          (prev) => new Map(prev.set(result.executionId, searchQuery)),
        );

        return result;
      } catch (error) {
        console.error("❌ Monaco search enrichment failed:", error);
        throw error;
      }
    },
    [enrichMonacoSearch],
  );

  // Get enrichment results for Monaco
  const getEnrichmentResults = useCallback(
    (executionId: string) => {
      const execution = executions.find((e) => e['executionId'] === executionId);
      return execution;
    },
    [executions],
  );

  // Clean up completed searches
  useEffect(() => {
    const completedSearches = Array.from(activeSearches.keys()).filter(
      (executionId) => {
        const execution = executions.find((e) => e['executionId'] === executionId);
        return execution && ["completed", "failed"].includes(execution.status);
      },
    );

    if (completedSearches.length > 0) {
      setActiveSearches((prev) => {
        const newMap = new Map(prev);
        completedSearches.forEach((id) => newMap.delete(id));
        return newMap;
      });
    }
  }, [executions, activeSearches]);

  return {
    enrichCompanies,
    enrichSearch,
    getEnrichmentResults,
    isEnriching,
    error,
    activeSearches: Array.from(activeSearches.entries()).map(
      ([executionId, query]) => ({
        executionId,
        query,
        execution: executions.find((e) => e['executionId'] === executionId),
      }),
    ),
  };
}

// Hook for bulk operations
export function useBulkEnrichment() {
  const { enrichBulkLeads, isEnriching, error } = useEnrichment();
  const [batchExecutions, setBatchExecutions] = useState<
    Map<
      string,
      {
        name: string;
        leadIds: string[];
        executionId: string;
      }
    >
  >(new Map());

  const enrichLeadBatch = useCallback(
    async (
      batchName: string,
      leadIds: string[],
      options: EnrichmentOptions = {},
    ) => {
      try {
        const result = await enrichBulkLeads({ leadIds, options });

        // Track this batch
        setBatchExecutions(
          (prev) =>
            new Map(
              prev.set(result.executionId, {
                name: batchName,
                leadIds,
                executionId: result.executionId,
              }),
            ),
        );

        return result;
      } catch (error) {
        console.error("❌ Bulk lead enrichment failed:", error);
        throw error;
      }
    },
    [enrichBulkLeads],
  );

  return {
    enrichLeadBatch,
    isEnriching,
    error,
    batchExecutions: Array.from(batchExecutions.values()),
  };
}
