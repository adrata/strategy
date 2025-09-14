import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { safeApiFetch } from "@/platform/safe-api-fetch";
import { isDesktop } from "@/platform/platform-detection";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for desktop mode
const mockUsers: User[] = [
  {
    id: "1",
    name: "Ross Sylvester",
    email: "ross@adrata.com",
    role: "admin",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "2",
    name: "Dan Mirolli",
    email: "dan@adrata.com",
    role: "user",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "3",
    name: "Sarah Chen",
    email: "sarah@adrata.com",
    role: "user",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "4",
    name: "Mike Johnson",
    email: "mike@adrata.com",
    role: "user",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

export function useUsers() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      // FIXED: Use mock data in desktop mode
      if (isDesktop()) {
        return mockUsers;
      }

      const response = await safeApiFetch("/api/users");
      return response;
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: { name: string; email: string; role: string }) => {
      // FIXED: Simulate creation in desktop mode
      if (isDesktop()) {
        const newUser: User = {
          id: Date.now().toString(),
          name: data.name,
          email: data.email,
          role: data.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return newUser;
      }

      const response = await safeApiFetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    users,
    isLoading,
    createUser,
  };
}
