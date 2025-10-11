"use client";

import React, { useState, useEffect } from "react";
import { useDatabase } from "../layout";
import { DatabaseTable } from "../types";
import { DatabaseHeader } from "./DatabaseHeader";

export function TableBrowser() {
  const { setSelectedTable, setViewMode } = useDatabase();
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch tables data
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

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesSearch = !searchTerm || 
      table.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      table.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group tables by category
  const categories = ['all', 'core', 'auth', 'activity', 'products'];
  const categoryLabels = {
    all: 'All Tables',
    core: 'Core Tables',
    auth: 'Auth & Security',
    activity: 'Activity',
    products: 'Products'
  };

  const handleTableClick = (table: DatabaseTable) => {
    setSelectedTable(table.name);
    setViewMode('detail');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading database tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Standardized Header */}
      <div className="p-6">
        <DatabaseHeader
          title="Database Tables"
          subtitle="Browse and explore all database tables"
          stats={[
            { label: "Showing", value: `${filteredTables.length} of ${tables.length}` },
            { label: "Total", value: `${tables.length} tables` }
          ]}
        >
          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </option>
              ))}
            </select>
          </div>
        </DatabaseHeader>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredTables.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No tables match the selected category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <div
                key={table.name}
                onClick={() => handleTableClick(table)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {table.name}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize">{table.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {table.rowCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">records</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Columns:</span>
                    <span>{table.columns.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Relationships:</span>
                    <span>{table.relationships.length}</span>
                  </div>
                  {table.indexes.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Indexes:</span>
                      <span>{table.indexes.length}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Click to explore
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
