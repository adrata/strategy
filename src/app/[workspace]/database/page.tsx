"use client";

import React, { useState, useEffect } from "react";
import { useDatabase } from "./layout";
import { TableBrowser } from "./components/TableBrowser";
import { TableDetail } from "./components/TableDetail";
import { QueryConsole } from "./components/QueryConsole";
import { SchemaVisualizer } from "./components/SchemaVisualizer";
import { DatabaseStats } from "./components/DatabaseStats";

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
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-700 font-bold text-base">D</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Database</h1>
                <p className="text-xs text-gray-600">Data Explorer & Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DatabaseStats stats={stats} loading={loading} />
              <button className="px-4 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors">
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
