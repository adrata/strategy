import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/api-fetch";
import { isDesktop } from "@/platform/platform-detection";

interface PipelineStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

interface PipelineExecution {
  id: string;
  status: "running" | "completed" | "failed";
  startedAt: Date;
  completedAt?: Date;
  sellerProfileId: string;
  steps: PipelineStep[];
  report?: {
    id: string;
    content: any;
  };
}

export function usePipeline(sellerProfileId?: string) {
  const queryClient = useQueryClient();

  const { data: executions, isLoading } = useQuery<PipelineExecution[]>({
    queryKey: ["pipeline", sellerProfileId],
    queryFn: async () => {
      if (!sellerProfileId) {
        throw new Error("Seller profile ID is required");
      }

      // Desktop mode: Return mock pipeline data
      if (isDesktop()) {
        return [
          {
            id: "mock-execution-1",
            status: "completed" as const,
            startedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
            completedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            sellerProfileId,
            steps: [
              {
                id: "step-1",
                name: "Data Collection",
                status: "completed",
                startedAt: new Date(),
                completedAt: new Date(),
              },
              {
                id: "step-2",
                name: "Analysis",
                status: "completed",
                startedAt: new Date(),
                completedAt: new Date(),
              },
              {
                id: "step-3",
                name: "Report Generation",
                status: "completed",
                startedAt: new Date(),
                completedAt: new Date(),
              },
            ],
            report: {
              id: "mock-report-1",
              content: { summary: "Mock pipeline report" },
            },
          },
        ];
      }

      const url = `/api/monaco/pipeline?sellerProfileId=${sellerProfileId}`;
      const response = await safeApiFetch(url);
      return response;
    },
    enabled: !!sellerProfileId,
  });

  const runPipeline = useMutation({
    mutationFn: async (sellerProfileId: string) => {
      // Desktop mode: Return mock execution start
      if (isDesktop()) {
        return {
          id: "mock-execution-" + Date.now(),
          status: "running",
          startedAt: new Date(),
          sellerProfileId,
          steps: [
            { id: "step-1", name: "Data Collection", status: "running" },
            { id: "step-2", name: "Analysis", status: "pending" },
            { id: "step-3", name: "Report Generation", status: "pending" },
          ],
        };
      }

      const response = await safeApiFetch("/api/monaco/pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sellerProfileId }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
  });

  const latestExecution = executions?.[0];
  const isRunning = latestExecution?.status === "running";

  return {
    executions,
    latestExecution,
    isLoading,
    isRunning,
    runPipeline,
  };
}
