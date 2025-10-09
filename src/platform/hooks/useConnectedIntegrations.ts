import { useQuery } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/api-fetch";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "disconnected" | "error";
  lastSyncAt?: string;
  errorMessage?: string;
}

export function useConnectedIntegrations() {
  return useQuery<Integration[]>({
    queryKey: ["connected-integrations"],
    queryFn: async () => {
      const response = await safeApiFetch("/api/integrations/connected");
      return response;
    },
  });
}
