"use client";

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';

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
  const { activeWorkspace } = useAcquisitionOS();
  
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
          
          const workspaceUsers = data.users || [];
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
        
        const workspaceUsers = data.users || [];
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
          setError('No users found in this workspace');
        }
      } catch (err) {
        console.error('Error fetching workspace users:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
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
