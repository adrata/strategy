"use client";

import React, { useState, useEffect } from "react";
import { useDatabase } from "../layout";
import { DatabaseHeader } from "./DatabaseHeader";

export function SchemaVisualizer() {
  const { setSelectedTable } = useDatabase();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTableLocal] = useState<string | null>(null);

  // Fetch all tables for schema visualization
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch('/api/database/tables');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTables(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  const handleTableClick = (tableName: string) => {
    setSelectedTableLocal(tableName);
    setSelectedTable(tableName);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-[var(--muted)]">Loading schema visualization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Standardized Header */}
      <DatabaseHeader
          title="Schema Visualizer"
          subtitle="Interactive database schema overview"
          stats={[
            { label: "Tables", value: tables.length },
            { label: "Selected", value: selectedTable || 'None' }
          ]}
          actions={
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Enable Visual Diagram
            </button>
          }
        />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Schema Overview */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Database Schema Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <div
                  key={table.name}
                  onClick={() => handleTableClick(table.name)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTable === table.name
                      ? 'border-blue-300 bg-blue-50 shadow-md'
                      : 'border-[var(--border)] hover:border-[var(--border)] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[var(--foreground)]">{table.name}</h3>
                    <span className="text-xs text-[var(--muted)] capitalize">{table.category}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-[var(--muted)]">
                    <div className="flex justify-between">
                      <span>Columns:</span>
                      <span>{table.columns.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Records:</span>
                      <span>{table.rowCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Relationships:</span>
                      <span>{table.relationships.length}</span>
                    </div>
                  </div>

                  {table.relationships.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-[var(--muted)] mb-1">Related to:</div>
                      <div className="flex flex-wrap gap-1">
                        {table.relationships.slice(0, 3).map((rel: any, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-[var(--hover)] text-[var(--muted)] rounded"
                          >
                            {rel.targetTable}
                          </span>
                        ))}
                        {table.relationships.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-[var(--hover)] text-[var(--muted)] rounded">
                            +{table.relationships.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Table Details */}
          {selectedTable && (
            <div className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Table Details: {selectedTable}
              </h3>
              
              {(() => {
                const table = tables.find(t => t.name === selectedTable);
                if (!table) return null;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columns */}
                    <div>
                      <h4 className="font-medium text-[var(--foreground)] mb-3">Columns</h4>
                      <div className="space-y-2">
                        {table.columns.map((column: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-[var(--background)] rounded border">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{column.name}</span>
                              {column.isPrimaryKey && (
                                <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">
                                  PK
                                </span>
                              )}
                              {column.isForeignKey && (
                                <span className="px-1 py-0.5 text-xs bg-green-100 text-green-600 rounded">
                                  FK
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[var(--muted)]">{column.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Relationships */}
                    <div>
                      <h4 className="font-medium text-[var(--foreground)] mb-3">Relationships</h4>
                      {table.relationships.length > 0 ? (
                        <div className="space-y-2">
                          {table.relationships.map((rel: any, index: number) => (
                            <div key={index} className="p-3 bg-[var(--background)] rounded border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{rel.relationName}</span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  rel.type === 'one-to-one' 
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-green-100 text-green-600'
                                }`}>
                                  {rel.type}
                                </span>
                              </div>
                              <div className="text-xs text-[var(--muted)]">
                                {table.name}.{rel.sourceColumn} → {rel.targetTable}.{rel.targetColumn}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[var(--muted)] italic">
                          No relationships defined
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Visual Diagram Placeholder */}
          <div className="mt-8 bg-[var(--panel-background)] border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--loading-bg)] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Interactive ER Diagram</h3>
            <p className="text-[var(--muted)] mb-4">
              A visual diagram showing all table relationships will be displayed here.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Enable Visual Diagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
