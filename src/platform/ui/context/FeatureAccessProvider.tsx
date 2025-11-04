"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { type SimpleFeatureName } from '@/platform/services/simple-feature-service';
import { generateWorkspaceSlug } from '@/platform/auth/workspace-slugs';

interface FeatureAccessContextType {
  // Individual feature checks
  hasFeature: (feature: SimpleFeatureName) => boolean;
  hasOasis: boolean;
  hasStacks: boolean;
  hasWorkbench: boolean;
  hasRevenueOS: boolean;
  hasMetrics: boolean;
  hasChronicle: boolean;
  hasDesktopDownload: boolean;
  
  // Bulk feature access
  featureAccess: Record<SimpleFeatureName, boolean>;
  
  // Workspace and user features
  workspaceFeatures: string[];
  userFeatures: string[];
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  
  // Refresh function
  refresh: () => Promise<void>;
}

const FeatureAccessContext = createContext<FeatureAccessContextType | undefined>(undefined);

interface FeatureAccessProviderProps {
  children: ReactNode;
}

export function FeatureAccessProvider({ children }: FeatureAccessProviderProps) {
  const { user } = useUnifiedAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureAccess, setFeatureAccess] = useState<Record<SimpleFeatureName, boolean>>({
    OASIS: false,
    STACKS: false,
    WORKBENCH: false,
    REVENUEOS: false,
    METRICS: false,
    CHRONICLE: false,
    DESKTOP_DOWNLOAD: false
  });
  const [workspaceFeatures, setWorkspaceFeatures] = useState<string[]>([]);
  const [userFeatures, setUserFeatures] = useState<string[]>([]);

  const loadFeatureAccess = async () => {
    if (!user?.id || !user?.activeWorkspaceId) {
      // Silently skip feature access check when no user (expected on auth pages)
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get workspace slug from user's workspace data, not URL (URL may be wrong during redirects)
      let workspaceSlug = 'adrata'; // Default fallback
      
      if (user?.workspaces && user?.activeWorkspaceId) {
        // Find the active workspace and generate its slug
        const activeWorkspace = user.workspaces.find(ws => ws.id === user.activeWorkspaceId);
        if (activeWorkspace) {
          workspaceSlug = generateWorkspaceSlug(activeWorkspace.name);
        } else {
          // Fallback: try to get from URL if workspace not found in user data
          const pathSegments = window.location.pathname.split('/').filter(Boolean);
          const urlSlug = pathSegments[0];
          // Only use URL slug if it's not an auth route
          if (urlSlug && !['sign-in', 'sign-up', 'reset-password', 'demo'].includes(urlSlug)) {
            workspaceSlug = urlSlug;
          }
        }
      } else {
        // Fallback to URL parsing if user data is incomplete
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const urlSlug = pathSegments[0];
        if (urlSlug && !['sign-in', 'sign-up', 'reset-password', 'demo'].includes(urlSlug)) {
          workspaceSlug = urlSlug;
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [FEATURE ACCESS] Using workspace slug:', workspaceSlug, 'for workspace ID:', user?.activeWorkspaceId);
      }
      
      // For now, assume all users have WORKSPACE_ADMIN role
      // In a real implementation, you'd get this from the user's role data
      const userRole = 'WORKSPACE_ADMIN';

      // Call the simple features API with user information for restrictions
      const response = await fetch(`/api/v1/simple-features?workspaceSlug=${workspaceSlug}&userRole=${userRole}&userId=${user.id}&userEmail=${user.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ [FEATURE ACCESS] API request failed: ${response.status} ${response.statusText}, using fallback access`);
        }
        // Instead of throwing an error, use fallback access
        setFeatureAccess({
          OASIS: true,
          STACKS: true,
          WORKSHOP: true,
          REVENUEOS: true,
          METRICS: true,
          CHRONICLE: true,
          DESKTOP_DOWNLOAD: true
        });
        setWorkspaceFeatures(['OASIS', 'STACKS', 'WORKSHOP', 'REVENUEOS', 'METRICS', 'CHRONICLE', 'DESKTOP_DOWNLOAD']);
        setUserFeatures(['OASIS', 'STACKS', 'WORKSHOP', 'REVENUEOS', 'METRICS', 'CHRONICLE', 'DESKTOP_DOWNLOAD']);
        return;
      }

      const result = await response.json();
      
      if (!result.success) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ [FEATURE ACCESS] API returned error: ${result.error}, using fallback access`);
        }
        // Instead of throwing an error, use fallback access
        setFeatureAccess({
          OASIS: true,
          STACKS: true,
          WORKSHOP: true,
          REVENUEOS: true,
          METRICS: true,
          CHRONICLE: true,
          DESKTOP_DOWNLOAD: true
        });
        setWorkspaceFeatures(['OASIS', 'STACKS', 'WORKSHOP', 'REVENUEOS', 'METRICS', 'CHRONICLE', 'DESKTOP_DOWNLOAD']);
        setUserFeatures(['OASIS', 'STACKS', 'WORKSHOP', 'REVENUEOS', 'METRICS', 'CHRONICLE', 'DESKTOP_DOWNLOAD']);
        return;
      }

      setFeatureAccess(result.featureAccess);
      setWorkspaceFeatures(Object.keys(result.featureAccess).filter(key => result.featureAccess[key]));
      setUserFeatures(Object.keys(result.featureAccess).filter(key => result.featureAccess[key]));

    } catch (err) {
      console.error('Error loading feature access:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feature access');
      
      // If there's an error, don't block access - just log it and continue
      // This prevents authentication issues from blocking the app
      console.warn('⚠️ [FEATURE ACCESS] Error occurred, but continuing with default access');
    } finally {
      setLoading(false);
    }
  };

  // Load feature access when user or workspace changes
  useEffect(() => {
    loadFeatureAccess();
  }, [user?.id, user?.activeWorkspaceId]);

  const hasFeature = (feature: SimpleFeatureName): boolean => {
    // If there's an error or we're still loading, be permissive to prevent blocking
    // Don't log here - this function is called frequently and would create noise
    if (error || loading) {
      return true;
    }
    return featureAccess[feature] || false;
  };

  const refresh = async () => {
    await loadFeatureAccess();
  };

  const contextValue: FeatureAccessContextType = {
    hasFeature,
    hasOasis: hasFeature('OASIS'),
    hasStacks: hasFeature('STACKS'),
    hasWorkshop: hasFeature('WORKSHOP'),
    hasRevenueOS: hasFeature('REVENUEOS'),
    hasMetrics: hasFeature('METRICS'),
    hasChronicle: hasFeature('CHRONICLE'),
    hasDesktopDownload: hasFeature('DESKTOP_DOWNLOAD'),
    featureAccess,
    workspaceFeatures,
    userFeatures,
    loading,
    error,
    refresh
  };

  return (
    <FeatureAccessContext.Provider value={contextValue}>
      {children}
    </FeatureAccessContext.Provider>
  );
}

export function useFeatureAccess(): FeatureAccessContextType {
  const context = useContext(FeatureAccessContext);
  if (context === undefined) {
    throw new Error('useFeatureAccess must be used within a FeatureAccessProvider');
  }
  return context;
}

// Convenience hooks for individual features
export function useOasisAccess(): boolean {
  const { hasOasis } = useFeatureAccess();
  return hasOasis;
}

export function useStacksAccess(): boolean {
  const { hasStacks } = useFeatureAccess();
  return hasStacks;
}

export function useWorkshopAccess(): boolean {
  const { hasWorkshop } = useFeatureAccess();
  return hasWorkshop;
}

export function useRevenueOSAccess(): boolean {
  const { hasRevenueOS } = useFeatureAccess();
  return hasRevenueOS;
}

export function useMetricsAccess(): boolean {
  const { hasMetrics } = useFeatureAccess();
  return hasMetrics;
}

export function useChronicleAccess(): boolean {
  const { hasChronicle } = useFeatureAccess();
  return hasChronicle;
}

export function useDesktopDownloadAccess(): boolean {
  const { hasDesktopDownload } = useFeatureAccess();
  return hasDesktopDownload;
}
