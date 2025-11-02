"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApiStatus } from "../hooks/useApiStatus";
import { API_REGISTRY } from "../data/api-registry";
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { StandardHeader } from "@/platform/ui/components/layout/StandardHeader";
import { IntegrationLibrary } from "../components/IntegrationLibrary";

export default function APIsPage() {
  const router = useRouter();
  const params = useParams();
  const workspace = params.workspace;
  const { statuses, loading: statusLoading, getStatusById } = useApiStatus();
  const [showLibrary, setShowLibrary] = useState(false);

  const handleAPIClick = (apiId: string) => {
    const api = API_REGISTRY.find(a => a.id === apiId);
    if (api) {
      router.push(`/${workspace}/grand-central/apis/${api.ulid}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Standardized Header */}
      <StandardHeader
        title="APIs"
        subtitle="REST and GraphQL endpoints for data enrichment and integration"
        stats={[
          { label: "Configured", value: statuses.filter(s => s.status === 'configured').length },
          { label: "Not Configured", value: statuses.filter(s => s.status === 'not-configured').length },
          { label: "Total", value: API_REGISTRY.length }
        ]}
        actions={
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <PlusIcon className="w-4 h-4" />
            Add Integration
          </button>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto invisible-scrollbar">
        <div className="p-6">
          {/* Loading State */}
          {statusLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-panel-background border border-border rounded-lg p-4 animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="h-5 bg-loading-bg rounded mb-2"></div>
                        <div className="h-4 bg-loading-bg rounded w-3/4"></div>
                      </div>
                      <div className="h-5 w-5 bg-loading-bg rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-loading-bg rounded w-1/3"></div>
                      <div className="h-3 bg-loading-bg rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Grid */}
          {!statusLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {API_REGISTRY.map(api => {
                  const status = getStatusById(api.id);
                  return (
                    <div
                      key={api.id}
                      onClick={() => handleAPIClick(api.id)}
                      className="bg-panel-background border border-border rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{api.name}</h3>
                          <p className="text-muted text-sm">{api.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {status?.status === 'configured' ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted capitalize">
                          {api.category.replace('-', ' ')}
                        </span>
                        <span className={`text-xs font-medium ${
                          status?.status === 'configured' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {status?.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Library Modal */}
      <IntegrationLibrary 
        isOpen={showLibrary} 
        onClose={() => setShowLibrary(false)} 
      />
    </div>
  );
}
