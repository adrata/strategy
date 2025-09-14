import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/safe-api-fetch";

interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  memberships: Array<{
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

export function useWorkspaces() {
  const queryClient = useQueryClient();

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const data = await safeApiFetch("/api/workspaces");
      return data;
    },
  });

  const createWorkspace = useMutation({
    mutationFn: async (data: { name: string }) => {
      const result = await safeApiFetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  return {
    workspaces,
    isLoading,
    createWorkspace,
  };
}
