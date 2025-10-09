"use client";

import { useUnifiedAuth, type UnifiedUser } from "@/platform/auth-unified";

/**
 * 🔐 ACQUISITION OS AUTHENTICATION HOOK
 * 
 * Provides authentication context for the Acquisition OS system.
 * This is a wrapper around the unified auth system that provides
 * the specific interface expected by Acquisition OS components.
 */
export function useAcquisitionOSAuth() {
  const {
    user: unifiedUser,
    isAuthenticated,
    isLoading,
    signIn: unifiedSignIn,
    signOut: unifiedSignOut,
  } = useUnifiedAuth();

  // Convert UnifiedUser to the format expected by Acquisition OS
  const authUser = unifiedUser ? {
    id: unifiedUser.id,
    name: unifiedUser.name,
    email: unifiedUser.email,
    username: unifiedUser.username,
    firstName: unifiedUser.firstName,
    lastName: unifiedUser.lastName,
    timezone: unifiedUser.timezone,
    activeWorkspaceId: unifiedUser.activeWorkspaceId,
    workspaces: unifiedUser.workspaces,
  } : null;

  return {
    authUser,
    isAuthenticated,
    isLoading,
    signIn: unifiedSignIn,
    signOut: unifiedSignOut,
  };
}