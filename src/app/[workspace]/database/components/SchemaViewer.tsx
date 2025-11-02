"use client";

import React from "react";

interface SchemaViewerProps {
  schema: any;
}

export function SchemaViewer({ schema }: SchemaViewerProps) {
  if (!schema) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted">No schema data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Table Overview */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Table Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{schema.columns.length}</div>
              <div className="text-sm text-muted">Columns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{schema.relationships.length}</div>
              <div className="text-sm text-muted">Relationships</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{schema.indexes.length}</div>
              <div className="text-sm text-muted">Indexes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{schema.constraints.length}</div>
              <div className="text-sm text-muted">Constraints</div>
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Columns</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Nullable</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Default</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Properties</th>
                </tr>
              </thead>
              <tbody>
                {schema.columns.map((column: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-panel-background">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{column.name}</span>
                        {column.isPrimaryKey && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                            PK
                          </span>
                        )}
                        {column.isForeignKey && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                            FK
                          </span>
                        )}
                        {column.isUnique && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                            Unique
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-gray-700">{column.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        column.nullable 
                          ? 'bg-yellow-100 text-yellow-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {column.nullable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {column.defaultValue ? (
                        <span className="font-mono text-sm text-gray-700">
                          {String(column.defaultValue)}
                        </span>
                      ) : (
                        <span className="text-muted italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {column.isList && (
                          <span className="px-2 py-1 text-xs bg-hover text-muted rounded">
                            Array
                          </span>
                        )}
                        {column.isUpdatedAt && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded">
                            Auto-update
                          </span>
                        )}
                        {column.kind === 'enum' && (
                          <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded">
                            Enum
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Relationships */}
        {schema.relationships.length > 0 && (
          <div className="bg-background border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Relationships</h2>
            <div className="space-y-3">
              {schema.relationships.map((rel: any, index: number) => (
                <div key={index} className="p-4 bg-panel-background rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{rel.relationName}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rel.type === 'one-to-one' 
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {rel.type}
                      </span>
                    </div>
                    <div className="text-sm text-muted">
                      {rel.targetTable}
                    </div>
                  </div>
                  <div className="text-sm text-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Source:</span> {rel.sourceColumn}
                      </div>
                      <div>
                        <span className="font-medium">Target:</span> {rel.targetColumn}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      On Delete: {rel.onDelete} • On Update: {rel.onUpdate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indexes */}
        {schema.indexes.length > 0 && (
          <div className="bg-background border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Indexes</h2>
            <div className="space-y-3">
              {schema.indexes.map((index: any, indexIdx: number) => (
                <div key={indexIdx} className="p-4 bg-panel-background rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{index.name}</span>
                    <div className="flex gap-2">
                      {index.unique && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                          Unique
                        </span>
                      )}
                      {index.primary && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                          Primary
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs bg-hover text-muted rounded-full">
                        {index.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted">
                    Columns: {index.columns.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints */}
        {schema.constraints.length > 0 && (
          <div className="bg-background border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Constraints</h2>
            <div className="space-y-3">
              {schema.constraints.map((constraint: any, index: number) => (
                <div key={index} className="p-4 bg-panel-background rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{constraint.name}</span>
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                      {constraint.type}
                    </span>
                  </div>
                  <div className="text-sm text-muted">
                    {constraint.column && (
                      <div>Column: {constraint.column}</div>
                    )}
                    {constraint.foreignTable && (
                      <div>References: {constraint.foreignTable}.{constraint.foreignColumn}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
