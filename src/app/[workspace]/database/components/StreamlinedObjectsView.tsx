"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { getStreamlinedModels, ParsedModel } from "../utils/schemaParser";
import { Breadcrumb } from "./Breadcrumb";

export function StreamlinedObjectsView() {
  const router = useRouter();
  const { user: authUser } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const [models, setModels] = useState<ParsedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { models: modelsData } = await getStreamlinedModels();
        setModels(modelsData);
      } catch (error) {
        console.error('Failed to fetch streamlined models:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchData();
    }
  }, [workspaceId]);

  const handleModelClick = (modelName: string) => {
    router.push(`/adrata/database/objects/${modelName}`);
  };

  const toggleModelExpansion = (modelName: string) => {
    const newExpanded = new Set(expandedModels);
    if (newExpanded.has(modelName)) {
      newExpanded.delete(modelName);
    } else {
      newExpanded.add(modelName);
    }
    setExpandedModels(newExpanded);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-40 bg-loading-bg rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-loading-bg rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Objects Grid Skeleton */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-panel-background border border-border rounded-lg p-4 shadow-sm">
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Database', onClick: () => window.location.href = window.location.pathname.split('/').slice(0, 3).join('/') },
        { label: 'Objects' }
      ]} />

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Database Models</h1>
            <p className="text-sm text-muted mt-1">
              Database models from streamlined schema ({models.length} models)
            </p>
          </div>
        </div>
      </div>

      {/* Objects Grid */}
      <div className="flex-1 overflow-y-auto p-6" style={{ 
        scrollbarWidth: 'thin', 
        scrollbarColor: 'var(--border) transparent',
        WebkitScrollbar: {
          width: '8px'
        },
        WebkitScrollbarTrack: {
          background: 'transparent'
        },
        WebkitScrollbarThumb: {
          background: 'var(--border)',
          borderRadius: '4px'
        }
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <div
              key={model.name}
              onClick={() => handleModelClick(model.name)}
              className="bg-panel-background border border-border rounded-lg p-4 hover:bg-hover cursor-pointer transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">{model.name}</h3>
                <span className="text-xs text-muted bg-background px-2 py-1 rounded">
                  {model.fields.length} fields
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Fields:</span>
                  <span className="text-sm font-medium text-foreground">{model.fields.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Relationships:</span>
                  <span className="text-sm font-medium text-foreground">{model.relationships.length}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-muted mb-2">Key Fields:</div>
                <div className="flex gap-1 flex-wrap">
                  {model.fields.slice(0, 3).map((field) => (
                    <span key={field.name} className="text-xs bg-background text-muted px-2 py-1 rounded">
                      {field.name}
                    </span>
                  ))}
                  {model.fields.length > 3 && (
                    <span className="text-xs bg-background text-muted px-2 py-1 rounded">
                      +{model.fields.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
