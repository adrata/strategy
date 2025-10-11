"use client";

import React, { useState, useEffect } from "react";
import { useDatabase } from "../layout";

interface RelationshipDiagramProps {
  tableName: string;
  schema: any;
}

export function RelationshipDiagram({ tableName, schema }: RelationshipDiagramProps) {
  const { setSelectedTable } = useDatabase();
  const [relatedTables, setRelatedTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch related tables
  useEffect(() => {
    const fetchRelatedTables = async () => {
      try {
        // Get all tables to find relationships
        const response = await fetch('/api/database/tables');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const allTables = data.data;
            
            // Find tables that have relationships with the current table
            const related = allTables.filter((table: any) => {
              return table.relationships.some((rel: any) => 
                rel.targetTable === tableName || table.name === tableName
              );
            });
            
            setRelatedTables(related);
          }
        }
      } catch (error) {
        console.error('Failed to fetch related tables:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedTables();
  }, [tableName]);

  const handleTableClick = (table: string) => {
    setSelectedTable(table);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading relationships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Table Relationships: {tableName}
          </h2>
          <p className="text-gray-600">
            Visual representation of how {tableName} connects to other tables in the database
          </p>
        </div>

        {/* Current Table */}
        <div className="mb-8">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">{tableName}</h3>
                <p className="text-blue-700">
                  {schema.columns.length} columns • {schema.relationships.length} relationships
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600">Current Table</div>
              </div>
            </div>
          </div>
        </div>

        {/* Relationships */}
        {schema.relationships.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Direct Relationships</h3>
            
            {schema.relationships.map((rel: any, index: number) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h4 className="text-lg font-medium text-gray-900">{rel.relationName}</h4>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      rel.type === 'one-to-one' 
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {rel.type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleTableClick(rel.targetTable)}
                    className="px-4 py-2 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    View {rel.targetTable}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Source ({tableName})</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Column:</span>
                        <span className="font-mono text-sm">{rel.sourceColumn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="text-sm">{rel.type === 'one-to-one' ? 'Single' : 'Multiple'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Target ({rel.targetTable})</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Column:</span>
                        <span className="font-mono text-sm">{rel.targetColumn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Relationship:</span>
                        <span className="text-sm">{rel.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">On Delete:</span> {rel.onDelete}
                    </div>
                    <div>
                      <span className="font-medium">On Update:</span> {rel.onUpdate}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No relationships found</h3>
            <p className="text-gray-500">
              This table doesn't have any direct relationships with other tables.
            </p>
          </div>
        )}

        {/* Related Tables */}
        {relatedTables.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Tables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedTables
                .filter(table => table.name !== tableName)
                .map((table) => (
                <div
                  key={table.name}
                  onClick={() => handleTableClick(table.name)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{table.name}</h4>
                    <span className="text-xs text-gray-500 capitalize">{table.category}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Records:</span>
                      <span>{table.rowCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Columns:</span>
                      <span>{table.columns.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Diagram Placeholder */}
        <div className="mt-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive ER Diagram</h3>
          <p className="text-gray-500 mb-4">
            A visual diagram showing table relationships will be displayed here.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Enable Visual Diagram
          </button>
        </div>
      </div>
    </div>
  );
}
