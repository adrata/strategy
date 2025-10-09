import { useMutation, useQueryClient } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/api-fetch";

interface SyncIntegrationResponse {
  success: boolean;
  message: string;
}

export function useSyncIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await safeApiFetch(
        `/api/integrations/${integrationId}/sync`,
        {
          method: "POST",
        },
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch connected integrations
      queryClient.invalidateQueries({ queryKey: ["connected-integrations"] });
    },
  });
}
