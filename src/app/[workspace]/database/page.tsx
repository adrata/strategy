"use client";

import React, { useState, useEffect } from "react";
import { useDatabase } from "./layout";
import { TableBrowser } from "./components/TableBrowser";
import { TableDetail } from "./components/TableDetail";
import { QueryConsole } from "./components/QueryConsole";
import { SchemaVisualizer } from "./components/SchemaVisualizer";
import { DatabaseStats } from "./components/DatabaseStats";
import { DatabaseHeader } from "./components/DatabaseHeader";

export default function DatabasePage() {
  const { viewMode, selectedTable } = useDatabase();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch database statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/database/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch database stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const renderContent = () => {
    switch (viewMode) {
      case 'detail':
        return selectedTable ? <TableDetail tableName={selectedTable} /> : <TableBrowser />;
      case 'query':
        return <QueryConsole />;
      case 'schema':
        return <SchemaVisualizer />;
      case 'browser':
      default:
        return <TableBrowser />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Standardized Header */}
      <div className="p-6">
        <DatabaseHeader
          title="Database"
          subtitle="Data Explorer & Management"
          stats={[
            { label: "Tables", value: stats?.tableCount || 0 },
            { label: "Records", value: stats?.totalRecords?.toLocaleString() || 0 }
          ]}
          actions={
            <>
              <DatabaseStats stats={stats} loading={loading} />
              <button className="px-4 py-2 bg-blue-100 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors">
                Export
              </button>
            </>
          }
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
