"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStreamlinedModels } from "../utils/schemaParser";

interface ParsedRelationship {
  type: string;
  targetModel: string;
  fieldName: string;
  relationName: string;
}

interface ParsedModel {
  name: string;
  tableName: string;
  fields: any[];
  relationships: ParsedRelationship[];
}

export function StreamlinedRelationshipsView() {
  const [models, setModels] = useState<ParsedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const { models: fetchedModels } = await getStreamlinedModels();
        setModels(fetchedModels);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleRelationshipClick = (modelName: string, relationshipName: string) => {
    router.push(`/adrata/database/objects/${modelName}/relationships/${relationshipName}`);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 bg-[var(--loading-bg)] rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-[var(--loading-bg)] rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Relationships List Skeleton */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white border border-[var(--border)] rounded-lg">
                <div className="p-4 border-b border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-32 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-16 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                      <div className="h-8 w-8 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, relIndex) => (
                      <div key={relIndex} className="flex items-center justify-between p-2 border border-[var(--border)] rounded">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-20 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                        </div>
                        <div className="flex gap-1">
                          <div className="h-4 w-12 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
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
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Relationships</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Object connections & links ({models.reduce((sum, model) => sum + model.relationships.length, 0)} relationships)
            </p>
          </div>
        </div>
      </div>

      {/* Relationships Grid */}
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
            <div key={model.name} className="bg-white border border-[var(--border)] rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-[var(--foreground)]">{model.name}</h3>
                <span className="text-xs text-[var(--muted)] bg-[var(--background)] px-2 py-1 rounded">
                  {model.relationships.length} relationships
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">Relationships:</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{model.relationships.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">One-to-Many:</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {model.relationships.filter(r => r.type === 'oneToMany').length}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <div className="text-xs text-[var(--muted)] mb-2">Key Relationships:</div>
                {model.relationships.length > 0 ? (
                  <div className="flex gap-1 flex-wrap">
                    {model.relationships.slice(0, 2).map((relationship) => (
                      <span key={relationship.relationName} className="text-xs bg-[var(--background)] text-[var(--muted)] px-2 py-1 rounded">
                        {relationship.relationName}
                      </span>
                    ))}
                    {model.relationships.length > 2 && (
                      <span className="text-xs text-[var(--muted)] px-2 py-1">
                        +{model.relationships.length - 2} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-[var(--muted)]">
                    No relationships defined
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <button
                  onClick={() => router.push(`/adrata/database/objects/${model.name}`)}
                  className="w-full text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-center"
                >
                  View Object Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
