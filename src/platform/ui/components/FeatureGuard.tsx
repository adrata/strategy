"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFeatureAccess } from '@/platform/ui/context/FeatureAccessProvider';
import { useUnifiedAuth } from '@/platform/auth';
import { StacksSkeletonLoader } from '@/frontend/components/stacks/StacksSkeletonLoader';

interface FeatureGuardProps {
  feature: 'OASIS' | 'STACKS' | 'WORKSHOP' | 'REVENUEOS' | 'METRICS' | 'CHRONICLE';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function FeatureGuard({ 
  feature, 
  children, 
  fallback,
  redirectTo = '/speedrun'
}: FeatureGuardProps) {
  const router = useRouter();
  const { user } = useUnifiedAuth();
  const { hasFeature, loading } = useFeatureAccess();

  // Show loading state while checking permissions
  if (loading) {
    // Use skeleton loader for Stacks feature
    if (feature === 'STACKS') {
      return <StacksSkeletonLoader />;
    }
    
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Checking access...</p>
        </div>
      </div>
    );
  }

  // Check if user has access to the feature
  if (!hasFeature(feature)) {
    // If custom fallback is provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default access denied message
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Restricted
          </h2>
          <p className="text-muted mb-4">
            You don't have permission to access {feature.toLowerCase()} in this workspace.
          </p>
          <button
            onClick={() => router.push(redirectTo)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // User has access, render the protected content
  return <>{children}</>;
}

// Convenience components for specific features
export function OasisGuard({ children, fallback, redirectTo }: Omit<FeatureGuardProps, 'feature'>) {
  return (
    <FeatureGuard feature="OASIS" fallback={fallback} redirectTo={redirectTo}>
      {children}
    </FeatureGuard>
  );
}

export function StacksGuard({ children, fallback, redirectTo }: Omit<FeatureGuardProps, 'feature'>) {
  return (
    <FeatureGuard 
      feature="STACKS" 
      fallback={fallback} 
      redirectTo={redirectTo}
    >
      {children}
    </FeatureGuard>
  );
}

export function WorkshopGuard({ children, fallback, redirectTo }: Omit<FeatureGuardProps, 'feature'>) {
  return (
    <FeatureGuard feature="WORKSHOP" fallback={fallback} redirectTo={redirectTo}>
      {children}
    </FeatureGuard>
  );
}

export function RevenueOSGuard({ children, fallback, redirectTo }: Omit<FeatureGuardProps, 'feature'>) {
  return (
    <FeatureGuard feature="REVENUEOS" fallback={fallback} redirectTo={redirectTo}>
      {children}
    </FeatureGuard>
  );
}

export function MetricsGuard({ children, fallback, redirectTo }: Omit<FeatureGuardProps, 'feature'>) {
  return (
    <FeatureGuard feature="METRICS" fallback={fallback} redirectTo={redirectTo}>
      {children}
    </FeatureGuard>
  );
}

export function ChronicleGuard({ children, fallback, redirectTo }: Omit<FeatureGuardProps, 'feature'>) {
  return (
    <FeatureGuard feature="CHRONICLE" fallback={fallback} redirectTo={redirectTo}>
      {children}
    </FeatureGuard>
  );
}
