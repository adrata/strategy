"use client";

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

// 🚀 PERFORMANCE: Request deduplication to prevent multiple simultaneous calls
const pendingRequests = new Map<string, Promise<any>>();

export function useWorkspaceUsers() {
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useUnifiedAuth();
  const { activeWorkspace } = useRevenueOS();
  
  // Check if we're in demo mode
  const isDemoMode = typeof window !== "undefined" && window.location.pathname.startsWith('/demo/');
  
  // In demo mode, use the UI context's activeWorkspace, otherwise use auth context
  const workspaceId = isDemoMode 
    ? activeWorkspace?.id 
    : (user?.activeWorkspaceId || session?.workspace?.id);

  useEffect(() => {
    async function fetchWorkspaceUsers() {
      if (!workspaceId) {
        console.log('🔍 [useWorkspaceUsers] No workspace ID available:', {
          userActiveWorkspaceId: user?.activeWorkspaceId,
          sessionWorkspaceId: session?.workspace?.id,
          finalWorkspaceId: workspaceId
        });
        setUsers([]);
        setError('No workspace ID available');
        setLoading(false);
        return;
      }

      // 🔐 AUTH: Check if user is authenticated (wait for auth to load first)
      // Note: This check should happen after workspaceId check, but we check user here
      // because workspaceId might be available but user might not be authenticated
      if (!user) {
        // Only set error if we're sure auth has finished loading
        // We can't easily detect this here, so we'll set a clear error
        console.log('🔐 [useWorkspaceUsers] No authenticated user - skipping fetch');
        setUsers([]);
        setError('Authentication required - please sign in');
        setLoading(false);
        return;
      }

      console.log('🔍 [useWorkspaceUsers] Fetching users for workspace:', {
        workspaceId,
        isDemoMode,
        activeWorkspaceId: activeWorkspace?.id,
        authWorkspaceId: user?.activeWorkspaceId || session?.workspace?.id
      });
      setLoading(true);
      setError(null);
      
      // 🚀 PERFORMANCE: Define requestKey outside try block for finally access
      const requestKey = `workspace_users:${workspaceId}`;
      
      try {
        // 🚀 PERFORMANCE: Check for existing request to prevent duplicates
        const existingRequest = pendingRequests.get(requestKey);
        
        if (existingRequest) {
          console.log('⚡ [DEDUP] Waiting for existing workspace users request:', requestKey);
          const data = await existingRequest;
          
          if (!data.success) {
            throw new Error(data.error || 'Failed to fetch users');
          }
          
          // Handle the response structure from createSuccessResponse
          const responseData = data.data || data;
          const workspaceUsers = responseData.users || [];
          const validUsers = workspaceUsers.filter((u: any) => u['id'] && (u.name || u.email));
          setUsers(validUsers);
          
          if (validUsers['length'] === 0) {
            setError('No users found in this workspace');
          }
          
          setLoading(false);
          return;
        }

        // Create new request promise
        const requestPromise = (async () => {
          const response = await fetch(`/api/workspace/users?workspaceId=${workspaceId}`);
          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('Authentication required - please sign in');
            }
            const errorText = await response.text();
            throw new Error(`Failed to fetch workspace users: ${response.status} ${errorText}`);
          }
          
          const data = await response.json();
          return data;
        })();

        // Store the request promise and clean up when done
        pendingRequests.set(requestKey, requestPromise);
        
        const data = await requestPromise;
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch users');
        }
        
        // Handle the response structure from createSuccessResponse
        const responseData = data.data || data;
        const workspaceUsers = responseData.users || [];
        console.log('🔍 [useWorkspaceUsers] Users fetched successfully:', {
          usersCount: workspaceUsers.length,
          users: workspaceUsers.map((u: any) => ({ 
            id: u.id, 
            name: u.name || u.displayName || u.email, 
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            displayName: u.displayName
          }))
        });
        
        // Ensure we only have users with valid IDs and names
        const validUsers = workspaceUsers.filter((u: any) => u['id'] && (u.name || u.email));
        setUsers(validUsers);
        
        if (validUsers['length'] === 0) {
          // Provide more specific error message
          if (workspaceUsers.length > 0) {
            setError('Users found but missing required data. Please contact support.');
          } else {
            setError('No users found in this workspace');
          }
        } else {
          // Clear any previous errors if we found users
          setError(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
        console.error('Error fetching workspace users:', err);
        
        // Don't set error for network failures - just log and continue
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          console.warn('⚠️ [useWorkspaceUsers] Network error - will retry later');
          setError(null); // Clear any previous errors
        } else {
          setError(errorMessage);
        }
        setUsers([]);
      } finally {
        // 🚀 PERFORMANCE: Clean up the request promise
        pendingRequests.delete(requestKey);
        setLoading(false);
      }
    }

    fetchWorkspaceUsers();
  }, [workspaceId, user?.activeWorkspaceId, session?.workspace?.id, activeWorkspace?.id, isDemoMode]);

  return { users, loading, error, currentUser: user };
}
