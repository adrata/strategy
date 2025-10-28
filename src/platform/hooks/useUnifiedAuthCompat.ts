"use client";

import { useState, useEffect } from 'react';
import { useSimpleAuth } from './useSimpleAuth';

// Compatibility interface to match UnifiedUser
interface CompatUser {
  id: string;
  name: string;
  email: string;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  activeWorkspaceId: string;
}

// Compatibility hook that provides the same interface as useUnifiedAuth
export function useUnifiedAuthCompat() {
  const { user: simpleUser, isLoading, isAuthenticated, signIn, signOut } = useSimpleAuth();
  const [compatUser, setCompatUser] = useState<CompatUser | null>(null);

  useEffect(() => {
    if (simpleUser) {
      // Convert simple user to UnifiedUser format
      const unifiedUser: CompatUser = {
        id: simpleUser.id,
        name: simpleUser.name,
        email: simpleUser.email,
        workspaces: simpleUser.workspaces || [],
        activeWorkspaceId: simpleUser.activeWorkspaceId
      };
      setCompatUser(unifiedUser);
    } else {
      setCompatUser(null);
    }
  }, [simpleUser]);

  return {
    user: compatUser,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    // Add other methods that might be expected
    refreshSession: async () => ({ success: true }),
    initAuth: async () => {},
  };
}

// Export with the expected name
export const useUnifiedAuth = useUnifiedAuthCompat;