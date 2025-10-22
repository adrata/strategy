"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { getStreamlinedModels, ParsedModel } from "../utils/schemaParser";

interface ModelDetailViewProps {
  modelName: string;
}

export function ModelDetailView({ modelName }: ModelDetailViewProps) {
  const router = useRouter();
  const { user: authUser } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  const [model, setModel] = useState<ParsedModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;

  useEffect(() => {
    const fetchModelData = async () => {
      try {
        setLoading(true);
        const { models } = await getStreamlinedModels();
        const foundModel = models.find(m => m.name === modelName);
        
        if (foundModel) {
          setModel(foundModel);
        } else {
          setError(`Model '${modelName}' not found`);
        }
      } catch (err) {
        setError('Failed to fetch model data');
        console.error('Error fetching model data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (modelName) {
      fetchModelData();
    }
  }, [modelName]);

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-24 bg-[var(--loading-bg)] rounded animate-pulse mb-2"></div>
              <div className="h-8 w-48 bg-[var(--loading-bg)] rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-[var(--loading-bg)] rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Model Details Skeleton */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Model Info Skeleton */}
            <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-4">
              <div className="h-6 w-32 bg-[var(--loading-bg)] rounded animate-pulse mb-3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index}>
                    <div className="h-4 w-24 bg-[var(--loading-bg)] rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-32 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fields Skeleton */}
            <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-4">
              <div className="h-6 w-24 bg-[var(--loading-bg)] rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="border border-[var(--border)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-24 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                        <div className="h-5 w-16 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                      </div>
                      <div className="flex gap-1">
                        <div className="h-5 w-20 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                        <div className="h-5 w-16 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-3 w-20 bg-[var(--loading-bg)] rounded animate-pulse mb-1"></div>
                      <div className="flex gap-1">
                        <div className="h-4 w-12 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                        <div className="h-4 w-14 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-[var(--muted)] mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)]">Model not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-[var(--muted)] hover:text-[var(--foreground)] mb-2"
            >
              ← Back to Objects
            </button>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{model.name}</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Database Model • {model.fields.length} fields • Table: {model.tableName}
            </p>
          </div>
        </div>
      </div>

      {/* Model Details */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Model Info */}
          <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-4">
            <h3 className="font-medium text-[var(--foreground)] mb-3">Model Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-[var(--muted)]">Model Name:</span>
                <p className="font-mono text-sm">{model.name}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--muted)]">Table Name:</span>
                <p className="font-mono text-sm">{model.tableName}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--muted)]">Total Fields:</span>
                <p className="text-sm">{model.fields.length}</p>
              </div>
              <div>
                <span className="text-sm text-[var(--muted)]">Relationships:</span>
                <p className="text-sm">{model.relationships.length}</p>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-4">
            <h3 className="font-medium text-[var(--foreground)] mb-4">Fields ({model.fields.length})</h3>
            <div className="space-y-3">
              {model.fields.map((field) => (
                <div key={field.name} className="border border-[var(--border)] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--foreground)]">{field.name}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        field.isPrimaryKey ? 'bg-blue-100 text-blue-700' :
                        field.isForeignKey ? 'bg-green-100 text-green-700' :
                        field.isUnique ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {field.type}
                      </span>
                      {field.isOptional && (
                        <span className="text-orange-500 text-xs">Optional</span>
                      )}
                      {field.isArray && (
                        <span className="text-blue-500 text-xs">Array</span>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {field.isPrimaryKey && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Primary Key</span>
                      )}
                      {field.isForeignKey && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Foreign Key</span>
                      )}
                      {field.isUnique && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Unique</span>
                      )}
                    </div>
                  </div>
                  
                  {field.attributes.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-[var(--muted)]">Attributes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {field.attributes.map((attr) => (
                          <span key={attr} className="text-xs text-[var(--muted)] bg-[var(--background)] px-2 py-1 rounded">
                            {attr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {field.defaultValue && (
                    <div className="mt-2">
                      <span className="text-xs text-[var(--muted)]">Default:</span>
                      <span className="text-xs font-mono ml-1">{field.defaultValue}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Relationships */}
          {model.relationships.length > 0 && (
            <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-medium text-[var(--foreground)] mb-4">Relationships ({model.relationships.length})</h3>
              <div className="space-y-3">
                {model.relationships.map((rel, index) => (
                  <div key={index} className="border border-[var(--border)] rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[var(--foreground)]">{rel.fieldName}</span>
                        <span className="text-sm text-[var(--muted)] ml-2">→ {rel.targetModel}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rel.type === 'one-to-one' ? 'bg-blue-100 text-blue-700' :
                        rel.type === 'one-to-many' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {rel.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
