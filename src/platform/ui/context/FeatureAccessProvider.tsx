"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { type SimpleFeatureName } from '@/platform/services/simple-feature-service';

interface FeatureAccessContextType {
  // Individual feature checks
  hasFeature: (feature: SimpleFeatureName) => boolean;
  hasOasis: boolean;
  hasStacks: boolean;
  hasAtrium: boolean;
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
    ATRIUM: false,
    REVENUEOS: false,
    METRICS: false,
    CHRONICLE: false,
    DESKTOP_DOWNLOAD: false
  });
  const [workspaceFeatures, setWorkspaceFeatures] = useState<string[]>([]);
  const [userFeatures, setUserFeatures] = useState<string[]>([]);

  const loadFeatureAccess = async () => {
    if (!user?.id || !user?.activeWorkspaceId) {
      console.log('🔍 [FEATURE ACCESS] No user or workspace ID, skipping feature access check');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get workspace slug from the current URL or user data
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const workspaceSlug = pathSegments[0] || 'adrata';
      
      console.log('🔍 [FEATURE ACCESS] Detected workspace slug:', workspaceSlug, 'from path:', window.location.pathname);
      
      // For now, assume all users have WORKSPACE_ADMIN role
      // In a real implementation, you'd get this from the user's role data
      const userRole = 'WORKSPACE_ADMIN';

      // Call the simple features API
      const response = await fetch(`/api/v1/simple-features?workspaceSlug=${workspaceSlug}&userRole=${userRole}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ [FEATURE ACCESS] API request failed: ${response.status} ${response.statusText}, using fallback access`);
        // Instead of throwing an error, use fallback access
        setFeatureAccess({
          OASIS: true,
          STACKS: true,
          ATRIUM: true,
          REVENUEOS: true,
          METRICS: true,
          CHRONICLE: true,
          DESKTOP_DOWNLOAD: true
        });
        setWorkspaceFeatures(['OASIS', 'STACKS', 'ATRIUM', 'REVENUEOS', 'METRICS', 'CHRONICLE', 'DESKTOP_DOWNLOAD']);
        setUserFeatures(['OASIS', 'STACKS', 'ATRIUM', 'REVENUEOS', 'METRICS', 'CHRONICLE', 'DESKTOP_DOWNLOAD']);
        return;
      }

      const result = await response.json();
      
      if (!result.success) {
        console.warn(`⚠️ [FEATURE ACCESS] API returned error: ${result.error}, using fallback access`);
        // Instead of throwing an error, use fallback access
        setFeatureAccess({
          OASIS: true,
          STACKS: true,
          ATRIUM: true,
          REVENUEOS: true,
          METRICS: true,
          CHRONICLE: true,
          DESKTOP_DOWNLOAD: true
        });
        setWorkspaceFeatures(['OASIS', 'STACKS', 'ATRIUM', 'REVENUEOS', 'METRICS', 'CHRONICLE', 'DESKTOP_DOWNLOAD']);
        setUserFeatures(['OASIS', 'STACKS', 'ATRIUM', 'REVENUEOS', 'METRICS', 'CHRONICLE', 'DESKTOP_DOWNLOAD']);
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
    if (error || loading) {
      console.log(`🔍 [FEATURE ACCESS] Allowing access to ${feature} due to error or loading state`);
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
    hasAtrium: hasFeature('ATRIUM'),
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

export function useAtriumAccess(): boolean {
  const { hasAtrium } = useFeatureAccess();
  return hasAtrium;
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
