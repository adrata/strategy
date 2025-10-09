import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/api-fetch";

interface ProviderToken {
  id: string;
  provider: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

interface ConnectedProviderWithTokens extends ProviderToken {
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useConnectedProviders() {
  const queryClient = useQueryClient();

  const { data: providers, isLoading } = useQuery<
    ConnectedProviderWithTokens[]
  >({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await safeApiFetch("/api/providers");
      return response;
    },
  });

  const connectProvider = useMutation({
    mutationFn: async (data: Omit<ProviderToken, "id">) => {
      const response = await safeApiFetch("/api/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  const disconnectProvider = useMutation({
    mutationFn: async (provider: string) => {
      const response = await safeApiFetch(`/api/providers/${provider}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  const updateProviderToken = useMutation({
    mutationFn: async ({
      provider,
      accessToken,
      refreshToken,
      expiresAt,
    }: {
      provider: string;
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
    }) => {
      const response = await safeApiFetch(`/api/providers/${provider}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          refreshToken,
          expiresAt,
        }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });

  return {
    providers,
    isLoading,
    connectProvider,
    disconnectProvider,
    updateProviderToken,
  };
}
