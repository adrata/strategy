"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DatabasePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tables view by default
    router.replace('/adrata/database/objects');
  }, [router]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header Skeleton */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-loading-bg rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-loading-bg rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-panel-background border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 w-24 bg-loading-bg rounded animate-pulse"></div>
                <div className="h-5 w-16 bg-loading-bg rounded animate-pulse"></div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-16 bg-loading-bg rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-loading-bg rounded animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-loading-bg rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-loading-bg rounded animate-pulse"></div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <div className="h-3 w-20 bg-loading-bg rounded animate-pulse mb-2"></div>
                <div className="flex gap-1">
                  <div className="h-5 w-12 bg-loading-bg rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-loading-bg rounded animate-pulse"></div>
                  <div className="h-5 w-14 bg-loading-bg rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
