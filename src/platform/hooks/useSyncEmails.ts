import { useMutation, useQueryClient } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/safe-api-fetch";
import { isDesktop } from "@/platform/platform-detection";

export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  threadId: string;
}

export function useSyncEmails() {
  const queryClient = useQueryClient();

  const syncEmails = useMutation({
    mutationFn: async ({
      provider,
      emails,
    }: {
      provider: string;
      emails: Email[];
    }) => {
      // Desktop mode: Return mock sync result
      if (isDesktop()) {
        console.log(`Mock: Syncing ${emails.length} emails from ${provider}`);
        return {
          success: true,
          synced: emails.length,
          message: `Successfully synced ${emails.length} emails from ${provider} (desktop mode)`,
        };
      }

      const response = await safeApiFetch("/api/sync/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          emails,
        }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
  });

  return syncEmails;
}
