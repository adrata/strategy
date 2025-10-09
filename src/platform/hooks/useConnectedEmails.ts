import { useQuery } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/api-fetch";

interface Email {
  id: string;
  address: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  lastSyncAt: string;
}

export function useConnectedEmails() {
  return useQuery<Email[]>({
    queryKey: ["connected-emails"],
    queryFn: async () => {
      const response = await safeApiFetch("/api/emails/connected");
      return response;
    },
  });
}
