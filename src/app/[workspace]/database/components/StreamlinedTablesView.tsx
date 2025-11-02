"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { getStreamlinedModels, ParsedModel } from "../utils/schemaParser";

export function StreamlinedTablesView() {
  const router = useRouter();
  const { user: authUser } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const [models, setModels] = useState<ParsedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableStats, setTableStats] = useState<Record<string, number>>({});

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { models: modelsData } = await getStreamlinedModels();
        setModels(modelsData);

        // Fetch table stats for each streamlined table
        const stats: Record<string, number> = {};
        const promises = modelsData.map(async (model) => {
          try {
            const response = await fetch(`/api/database/tables/${model.tableName}/count?workspaceId=${workspaceId}`);
            if (response.ok) {
              const data = await response.json();
              return { tableName: model.tableName, count: data.data?.count || 0 };
            }
          } catch (error) {
            console.warn(`Could not get count for table ${model.tableName}:`, error);
          }
          return { tableName: model.tableName, count: 0 };
        });

        const results = await Promise.all(promises);
        results.forEach(({ tableName, count }) => {
          stats[tableName] = count;
        });
        
        setTableStats(stats);
      } catch (error) {
        console.error('Failed to fetch streamlined tables:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchData();
    }
  }, [workspaceId]);

  const handleTableClick = (tableName: string) => {
    router.push(`/adrata/database/tables/${tableName}`);
  };

  if (loading) {
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

        {/* Tables Grid Skeleton */}
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tables</h1>
            <p className="text-sm text-muted mt-1">
              Database tables ({models.length} tables)
            </p>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <div
              key={model.name}
              onClick={() => handleTableClick(model.tableName)}
              className="bg-white border border-border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">{model.name}</h3>
                <span className="text-xs text-muted bg-background px-2 py-1 rounded">
                  {model.fields.length} fields
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Records:</span>
                  <span className="font-medium">{tableStats[model.tableName]?.toLocaleString() || '0'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Table:</span>
                  <span className="font-mono text-xs">{model.tableName}</span>
                </div>
              </div>

              {/* Key Fields Preview */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-muted mb-2">Key Fields:</div>
                <div className="flex flex-wrap gap-1">
                  {model.fields.slice(0, 3).map((field) => (
                    <span
                      key={field.name}
                      className={`text-xs px-2 py-1 rounded ${
                        field.isPrimaryKey ? 'bg-blue-100 text-blue-700' :
                        field.isForeignKey ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {field.name}
                    </span>
                  ))}
                  {model.fields.length > 3 && (
                    <span className="text-xs text-muted">
                      +{model.fields.length - 3} more
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
