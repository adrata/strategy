"use client";

import { useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';

export function DynamicTitle() {
  const { user } = useUnifiedAuth();
  
  useEffect(() => {
    if (user?.workspaces && user.workspaces.length > 0) {
      // Get the active workspace or the first workspace
      const activeWorkspace = user.workspaces.find(w => w['id'] === user.activeWorkspaceId) || user['workspaces'][0];
      
      if (activeWorkspace) {
        // Update the document title
        document['title'] = `${activeWorkspace.name} | Sales Acceleration`;
      } else {
        // Fallback to default title
        document['title'] = 'Adrata | Sales Acceleration';
      }
    } else {
      // No workspaces available, use default title
      document['title'] = 'Adrata | Sales Acceleration';
    }
  }, [user?.activeWorkspaceId, user?.workspaces]);

  // This component doesn't render anything
  return null;
}
