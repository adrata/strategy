/**
 * Monaco Enrichment Client - World-Class Integration
 *
 * Provides easy-to-use methods for triggering enrichment from the Action Platform:
 * 1. Single Lead Upload -> enrichSingleLead()
 * 2. Bulk Lead Upload -> enrichBulkLeads()
 * 3. Monaco Company Search -> enrichMonacoSearch()
 */

import { safeApiFetch } from "@/platform/api-fetch";

export interface EnrichmentOptions {
  runFullPipeline?: boolean;
  skipSteps?: number[];
  priorityCompanies?: string[];
  maxCompanies?: number;
  realTimeUpdates?: boolean;
}

export interface EnrichmentResult {
  success: boolean;
  executionId: string;
  status: "running" | "completed" | "failed";
  message: string;
  pollUrl?: string;
  estimatedDuration?: string;
  results?: {
    companiesEnriched: number;
    peopleEnriched: number;
    buyerGroupsCreated: number;
    hasIntelligence: boolean;
    hasErrors: boolean;
    errorCount: number;
  };
  intelligence?: Record<string, any>;
  metadata?: {
    startTime: Date;
    endTime?: Date;
    duration: number;
    triggerUser: string;
    costOptimized: boolean;
    cacheHitRate: number;
  };
  errors?: Array<{ step: string; error: string; companyId?: string }>;
}

export interface ExecutionStatus {
  success: boolean;
  executionId: string;
  status: "queued" | "running" | "completed" | "failed" | "partial";
  progress: {
    currentStep: number;
    totalSteps: number;
    completedCompanies: number;
    totalCompanies: number;
    percentage: number;
    estimatedTimeRemaining?: number;
  };
  results: {
    companiesEnriched: number;
    peopleEnriched: number;
    buyerGroupsCreated: number;
    hasIntelligence: boolean;
    hasErrors: boolean;
    errorCount: number;
  };
  intelligence?: Record<string, any>;
  errors?: Array<{ step: string; error: string; companyId?: string }>;
}

export class EnrichmentClient {
  constructor(
    private workspaceId: string,
    private userId: string,
  ) {}

  /**
   * State 1: Single Lead Upload
   * Trigger focused enrichment for one lead
   */
  async enrichSingleLead(
    leadId: string,
    options: EnrichmentOptions = {},
  ): Promise<EnrichmentResult> {
    try {
      console.log(`🚀 Starting single lead enrichment for ${leadId}`);

      const response = await safeApiFetch("/api/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "single_lead",
          leadIds: [leadId],
          workspaceId: this.workspaceId,
          userId: this.userId,
          ...options,
        }),
      });

      if (!response.success) {
        throw new Error(response.error || "Single lead enrichment failed");
      }

      console.log(
        `✅ Single lead enrichment ${response.status} for ${leadId} (${response.executionId})`,
      );
      return response as EnrichmentResult;
    } catch (error) {
      console.error("❌ Single lead enrichment error:", error);
      throw new Error(
        `Single lead enrichment failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * State 2: Bulk Lead Upload
   * Smart company-first enrichment for multiple leads
   */
  async enrichBulkLeads(
    leadIds: string[],
    options: EnrichmentOptions = {},
  ): Promise<EnrichmentResult> {
    try {
      console.log(`🚀 Starting bulk enrichment for ${leadIds.length} leads`);

      const response = await safeApiFetch("/api/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bulk_leads",
          leadIds,
          workspaceId: this.workspaceId,
          userId: this.userId,
          ...options,
        }),
      });

      if (!response.success) {
        throw new Error(response.error || "Bulk lead enrichment failed");
      }

      console.log(
        `✅ Bulk enrichment ${response.status} for ${leadIds.length} leads (${response.executionId})`,
      );
      return response as EnrichmentResult;
    } catch (error) {
      console.error("❌ Bulk lead enrichment error:", error);
      throw new Error(
        `Bulk lead enrichment failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * State 3: Monaco Company Search
   * Real-time enrichment for Monaco search results
   */
  async enrichMonacoSearch(
    searchQuery?: string,
    companyIds?: string[],
    options: EnrichmentOptions = {},
  ): Promise<EnrichmentResult> {
    try {
      console.log(
        `🚀 Starting Monaco enrichment: ${searchQuery ? `search="${searchQuery}"` : `${companyIds?.length} companies`}`,
      );

      if (!searchQuery && (!companyIds || companyIds['length'] === 0)) {
        throw new Error("Either searchQuery or companyIds must be provided");
      }

      const response = await safeApiFetch("/api/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "monaco_search",
          searchQuery,
          companyIds,
          workspaceId: this.workspaceId,
          userId: this.userId,
          ...options,
        }),
      });

      if (!response.success) {
        throw new Error(response.error || "Monaco enrichment failed");
      }

      console.log(
        `✅ Monaco enrichment ${response.status} (${response.executionId})`,
      );
      return response as EnrichmentResult;
    } catch (error) {
      console.error("❌ Monaco enrichment error:", error);
      throw new Error(
        `Monaco enrichment failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Check execution status and get results
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    try {
      const response = await safeApiFetch(
        `/api/enrichment/${executionId}?workspaceId=${this.workspaceId}`,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to get execution status");
      }

      return response as ExecutionStatus;
    } catch (error) {
      console.error("❌ Get execution status error:", error);
      throw new Error(
        `Failed to get execution status: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(
    executionId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await safeApiFetch(
        `/api/enrichment/${executionId}?workspaceId=${this.workspaceId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to cancel execution");
      }

      return response;
    } catch (error) {
      console.error("❌ Cancel execution error:", error);
      throw new Error(
        `Failed to cancel execution: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * List active enrichment executions
   */
  async listExecutions(): Promise<{
    success: boolean;
    executions: Array<{
      executionId: string;
      type: string;
      status: string;
      progress: any;
      startTime: Date;
      endTime?: Date;
      companiesEnriched: number;
      peopleEnriched: number;
      hasErrors: boolean;
      triggerUser: string;
    }>;
    summary: {
      total: number;
      running: number;
      completed: number;
      failed: number;
    };
  }> {
    try {
      const response = await safeApiFetch(
        `/api/enrichment?workspaceId=${this.workspaceId}`,
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to list executions");
      }

      return response;
    } catch (error) {
      console.error("❌ List executions error:", error);
      throw new Error(
        `Failed to list executions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Wait for execution to complete with polling
   */
  async waitForCompletion(
    executionId: string,
    onProgress?: (status: ExecutionStatus) => void,
    maxWaitTime: number = 300000, // 5 minutes default
  ): Promise<ExecutionStatus> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    console.log(`⏳ Waiting for execution ${executionId} to complete...`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getExecutionStatus(executionId);

        // Call progress callback if provided
        if (onProgress) {
          onProgress(status);
        }

        // Check if completed
        if (["completed", "failed", "partial"].includes(status.status)) {
          console.log(`✅ Execution ${executionId} ${status.status}`);
          return status;
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error(`❌ Error polling execution ${executionId}:`, error);
        // Continue polling in case of temporary errors
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error(
      `Execution ${executionId} timed out after ${maxWaitTime}ms`,
    );
  }

  /**
   * Convenience method to enrich and wait for completion
   */
  async enrichAndWait(
    type: "single_lead" | "bulk_leads" | "monaco_search",
    data: {
      leadId?: string;
      leadIds?: string[];
      searchQuery?: string;
      companyIds?: string[];
    },
    options: EnrichmentOptions = {},
    onProgress?: (status: ExecutionStatus) => void,
  ): Promise<ExecutionStatus> {
    let result: EnrichmentResult;

    // Trigger appropriate enrichment
    switch (type) {
      case "single_lead":
        if (!data.leadId)
          throw new Error("leadId required for single_lead enrichment");
        result = await this.enrichSingleLead(data.leadId, options);
        break;
      case "bulk_leads":
        if (!data.leadIds)
          throw new Error("leadIds required for bulk_leads enrichment");
        result = await this.enrichBulkLeads(data.leadIds, options);
        break;
      case "monaco_search":
        result = await this.enrichMonacoSearch(
          data.searchQuery,
          data.companyIds,
          options,
        );
        break;
    }

    // If completed immediately, return result
    if (result['status'] === "completed") {
      return {
        success: true,
        executionId: result.executionId,
        status: "completed",
        progress: {
          currentStep: 100,
          totalSteps: 100,
          completedCompanies: 1,
          totalCompanies: 1,
          percentage: 100,
        },
        results: result.results!,
        intelligence: result.intelligence,
      };
    }

    // Otherwise wait for completion
    return this.waitForCompletion(result.executionId, onProgress);
  }
}

/**
 * Create enrichment client instance
 */
export function createEnrichmentClient(
  workspaceId: string,
  userId: string,
): EnrichmentClient {
  return new EnrichmentClient(workspaceId, userId);
}
