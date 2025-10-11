"use client";

import React, { useState, useEffect } from "react";
import { useUnifiedAuth } from "@/platform/auth";
import { useAcquisitionOS } from "@/platform/ui/context/AcquisitionOSProvider";
import { useDatabase } from "../layout";
import { DatabaseTable } from "../types";

interface DatabaseLeftPanelProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function DatabaseLeftPanel({ activeSection, onSectionChange }: DatabaseLeftPanelProps) {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  const { setSelectedTable, setViewMode } = useDatabase();
  
  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;
  const userId = authUser?.id;
  
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch database tables and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesResponse, statsResponse] = await Promise.all([
          fetch(`/api/database/tables?workspaceId=${workspaceId}`),
          fetch(`/api/database/stats?workspaceId=${workspaceId}`)
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

  // Group tables by category
  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.category]) {
      acc[table.category] = [];
    }
    acc[table.category].push(table);
    return acc;
  }, {} as Record<string, DatabaseTable[]>);

  // Filter tables based on search
  const filteredTables = searchTerm 
    ? tables.filter(table => 
        table.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tables;

  const handleTableClick = (tableName: string) => {
    setSelectedTable(tableName);
    setViewMode('detail');
  };

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    if (sectionId === 'tables') {
      setViewMode('browser');
    } else if (sectionId === 'query') {
      setViewMode('query');
    } else if (sectionId === 'schema') {
      setViewMode('schema');
    }
  };

  // Database sections
  const sections = [
    {
      id: "tables",
      name: "Tables",
      description: "Browse all tables",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : stats?.totalTables || "0",
      visible: true
    },
    {
      id: "query",
      name: "Query Console",
      description: "Run SQL queries",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : "SQL",
      visible: true
    },
    {
      id: "schema",
      name: "Schema",
      description: "Visual relationships",
      count: loading ? (
        <div className="w-6 h-3 bg-[var(--loading-bg)] rounded animate-pulse"></div>
      ) : "ER",
      visible: true
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

        {/* Search */}
        <div className="mx-2 mb-3">
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stats */}
        {stats && (
          <div className="mx-2 mb-3 p-3 bg-[var(--panel-background)] rounded-lg">
            <div className="text-xs text-[var(--muted)] space-y-1">
              <div className="flex justify-between">
                <span>Tables:</span>
                <span className="font-medium">{stats.totalTables}</span>
              </div>
              <div className="flex justify-between">
                <span>Records:</span>
                <span className="font-medium">{stats.totalRecords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium">{stats.storageSize}</span>
              </div>
            </div>
          </div>
        )}
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
                  {categoryTables
                    .filter(table => 
                      !searchTerm || table.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((table) => (
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
