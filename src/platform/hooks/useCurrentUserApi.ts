import { useQuery } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/safe-api-fetch";
import { isDesktop } from "@/platform/platform-detection";

interface User {
  id: string;
  email: string;
  name: string;
}

export function useCurrentUserApi() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["current-user-api"],
    queryFn: async () => {
      // FIXED: Don't make API calls in desktop mode
      if (isDesktop()) {
        throw new Error("API not available in desktop mode");
      }

      const response = await safeApiFetch("/api/auth/me");
      return response;
    },
    // Disable in desktop mode
    enabled: !isDesktop(),
  });

  return {
    user,
    isLoading,
  };
}
