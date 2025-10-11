"use client";

import React, { useState, useEffect } from "react";
import { useDatabase } from "../layout";
import { DataGrid } from "./DataGrid";
import { SchemaViewer } from "./SchemaViewer";
import { RelationshipDiagram } from "./RelationshipDiagram";
import { DatabaseHeader } from "./DatabaseHeader";
import { useParams } from "next/navigation";

interface TableDetailProps {
  tableName: string;
}

export function TableDetail({ tableName }: TableDetailProps) {
  const { setSelectedRecord } = useDatabase();
  const params = useParams();
  const workspaceId = params.workspace as string;
  
  const [activeTab, setActiveTab] = useState<'data' | 'schema' | 'relationships'>('data');
  const [tableSchema, setTableSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch table schema
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch(`/api/database/tables/${tableName}?workspaceId=${workspaceId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTableSchema(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch table schema:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, [tableName, workspaceId]);

  const handleRecordSelect = (record: Record<string, any>) => {
    setSelectedRecord(record);
  };

  const tabs = [
    { id: 'data', name: 'Data', icon: '📊' },
    { id: 'schema', name: 'Schema', icon: '🏗️' },
    { id: 'relationships', name: 'Relationships', icon: '🔗' }
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading table details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Standardized Header */}
      <DatabaseHeader
        title={tableName}
        subtitle={tableSchema ? `${tableSchema.columns.length} columns` : 'Loading...'}
        icon="📋"
        stats={[
          { label: "Columns", value: tableSchema?.columns.length || 0 },
          { label: "Relationships", value: tableSchema?.relationships.length || 0 }
        ]}
        actions={
          <>
            <button className="px-4 py-2 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
              Export Data
            </button>
            <button className="px-4 py-2 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
              Add Record
            </button>
          </>
        }
      >
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </DatabaseHeader>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'data' && (
          <DataGrid
            tableName={tableName}
            workspaceId={workspaceId}
            onRecordSelect={handleRecordSelect}
          />
        )}
        
        {activeTab === 'schema' && tableSchema && (
          <SchemaViewer schema={tableSchema} />
        )}
        
        {activeTab === 'relationships' && tableSchema && (
          <RelationshipDiagram tableName={tableName} schema={tableSchema} />
        )}
      </div>
    </div>
  );
}
