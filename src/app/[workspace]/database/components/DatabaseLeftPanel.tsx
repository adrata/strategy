"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useDatabase } from "../layout";
import { DatabaseTable } from "../types";
import { getStreamlinedModels, ParsedModel } from "../utils/schemaParser";

interface DatabaseLeftPanelProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function DatabaseLeftPanel({ activeSection, onSectionChange }: DatabaseLeftPanelProps) {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const { setSelectedTable, setViewMode } = useDatabase();
  
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const userId = authUser?.id;
  
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [models, setModels] = useState<ParsedModel[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch database tables, models, and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesResponse, statsResponse, modelsData] = await Promise.all([
          fetch(`/api/database/tables?workspaceId=${workspaceId}`),
          fetch(`/api/database/stats?workspaceId=${workspaceId}`),
          getStreamlinedModels()
        ]);

        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          if (tablesData.success) {
            setTables(tablesData.data);
          }
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success) {
            setStats(statsData.data);
          }
        }

        if (modelsData) {
          setModels(modelsData.models);
        }
      } catch (error) {
        console.error('Failed to fetch database data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchData();
    }
  }, [workspaceId]);

  // Filter tables to only show streamlined schema tables
  const streamlinedTableNames = models.map(model => model.tableName);
  const filteredTables = tables.filter(table => streamlinedTableNames.includes(table.name));
  
  // Group tables by category
  const groupedTables = filteredTables.reduce((acc, table) => {
    if (!acc[table.category]) {
      acc[table.category] = [];
    }
    acc[table.category].push(table);
    return acc;
  }, {} as Record<string, DatabaseTable[]>);


  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
    setViewMode('detail');
  };

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    if (sectionId === 'objects') {
      router.push('/adrata/database/objects');
    } else if (sectionId === 'attributes') {
      router.push('/adrata/database/attributes');
    } else if (sectionId === 'relationships') {
      router.push('/adrata/database/relationships');
    } else if (sectionId === 'query') {
      setViewMode('query');
    } else if (sectionId === 'schema') {
      setViewMode('schema');
    }
  };


  // Database sections
  const sections = [
    {
      id: "objects",
      name: "Objects",
      description: "Database objects & models",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : models.length || "0",
      visible: true
    },
    {
      id: "attributes",
      name: "Attributes",
      description: "Object fields & properties",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : models.reduce((sum, model) => sum + model.fields.length, 0) || "0",
      visible: true
    },
    {
      id: "relationships",
      name: "Relationships",
      description: "Object connections & links",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : models.reduce((sum, model) => sum + model.relationships.length, 0) || "0",
      visible: true
    },
    {
      id: "query",
      name: "Query Console",
      description: "Run SQL queries",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : "SQL",
      visible: false
    },
    {
      id: "schema",
      name: "Schema",
      description: "Visual relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : "ER",
      visible: false
    }
  ];

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
        <div className="p-4 text-center">
          <div className="text-sm text-[var(--muted)]">Loading Database...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 pt-0 pr-2 pl-2">
        {/* Header */}
        <div className="mx-2 mt-4 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--background)] border border-[var(--border)] overflow-hidden" style={{ filter: 'none' }}>
              <span className="text-lg font-bold text-black">D</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Database</h2>
              <p className="text-xs text-[var(--muted)]">Data Explorer</p>
            </div>
          </div>
        </div>


        {/* Stats */}
        <div className="mx-2 mb-3 p-3 bg-[var(--panel-background)] rounded-lg">
          <div className="text-xs text-[var(--muted)] space-y-1">
            <div className="flex justify-between">
              <span>Objects:</span>
              <span className="font-medium">
                {loading ? (
                  <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                ) : models.length || "0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fields:</span>
              <span className="font-medium">
                {loading ? (
                  <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                ) : models.reduce((sum, model) => sum + model.fields.length, 0) || "0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Relationships:</span>
              <span className="font-medium">
                {loading ? (
                  <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
                ) : models.reduce((sum, model) => sum + model.relationships.length, 0) || "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-1 p-2">
        {sections.filter(section => section.visible).map((section) => (
          <button
            key={section.id}
            onClick={() => handleSectionClick(section.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeSection === section.id
                ? 'bg-[var(--hover)] text-[var(--foreground)]'
                : 'hover:bg-[var(--panel-background)] text-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{section.name}</span>
              <span className="text-sm text-[var(--muted)]">
                {typeof section.count === 'number' ? section.count.toLocaleString() : section.count}
              </span>
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              {section.description}
            </div>
          </button>
        ))}

        {/* Tables by Category */}
        {activeSection === 'tables' && (
          <div className="mt-4 space-y-2">
            {Object.entries(groupedTables).map(([category, categoryTables]) => (
              <div key={category}>
                <div className="px-3 py-1 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                  {category} ({categoryTables.length})
                </div>
                <div className="space-y-1">
                  {categoryTables.map((table) => (
                    <button
                      key={table.name}
                      onClick={() => handleTableClick(table.name)}
                      className="w-full text-left px-3 py-1.5 rounded text-sm hover:bg-[var(--panel-background)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">{table.name}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {table.rowCount.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Fixed Bottom Section - Profile Button */}
      <div className="flex-shrink-0 p-2" style={{ paddingBottom: '15px' }}>
        <button
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover)] transition-colors"
          title="Profile"
        >
          <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {authUser?.name || 'User'}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {acquisitionData?.auth?.authUser?.activeWorkspaceName || 'Workspace'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
