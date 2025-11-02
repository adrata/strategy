"use client";

import React, { useState, useEffect } from "react";
import { QueryResult, QueryHistory } from "../types";
import { DatabaseHeader } from "./DatabaseHeader";

export function QueryConsole() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<number | null>(null);

  // Load query history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('database-query-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to load query history:', error);
      }
    }
  }, []);

  // Save query history to localStorage
  const saveHistory = (newHistory: QueryHistory[]) => {
    setHistory(newHistory);
    localStorage.setItem('database-query-history', JSON.stringify(newHistory));
  };

  const executeQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        
        // Add to history
        const newEntry: QueryHistory = {
          id: Date.now().toString(),
          query: query.trim(),
          executedAt: new Date(),
          executionTime: data.data.executionTime,
          rowCount: data.data.rowCount,
        };
        
        const newHistory = [newEntry, ...history.slice(0, 49)]; // Keep last 50 queries
        saveHistory(newHistory);
      } else {
        setError(data.error || 'Query execution failed');
        
        // Add failed query to history
        const newEntry: QueryHistory = {
          id: Date.now().toString(),
          query: query.trim(),
          executedAt: new Date(),
          executionTime: 0,
          rowCount: 0,
          error: data.error,
        };
        
        const newHistory = [newEntry, ...history.slice(0, 49)];
        saveHistory(newHistory);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      executeQuery();
    }
  };

  const loadHistoryQuery = (historyItem: QueryHistory) => {
    setQuery(historyItem.query);
    setSelectedHistory(historyItem.id);
  };

  const clearQuery = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setSelectedHistory(null);
  };

  const formatValue = (value: any) => {
    if (value === null) return <span className="text-muted italic">null</span>;
    if (typeof value === 'object') {
      return <span className="font-mono text-xs bg-hover px-2 py-1 rounded">{JSON.stringify(value)}</span>;
    }
    return String(value);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Standardized Header */}
      <DatabaseHeader
          title="Query Console"
          subtitle="Execute SQL queries against your database"
          stats={[
            { label: "History", value: history.length },
            { label: "Last Result", value: result ? `${result.rowCount} rows` : 'None' }
          ]}
          actions={
            <>
              <button
                onClick={clearQuery}
                className="px-4 py-2 text-sm bg-hover text-muted rounded-lg hover:bg-loading-bg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={executeQuery}
                disabled={loading || !query.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Executing...' : 'Execute Query'}
              </button>
            </>
          }
        >
          {/* Query Editor */}
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your SQL query here...&#10;&#10;Example:&#10;SELECT * FROM users WHERE workspaceId = 'your-workspace-id' LIMIT 10;"
              className="w-full h-32 px-4 py-3 border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted">
              Cmd+Enter to execute
            </div>
          </div>
        </DatabaseHeader>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Query History */}
        <div className="w-80 border-r border-border bg-panel-background overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium text-foreground mb-3">Query History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted">No queries executed yet</p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryQuery(item)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedHistory === item.id
                        ? 'bg-blue-100 border border-blue-200'
                        : 'bg-background border border-border hover:bg-panel-background'
                    }`}
                  >
                    <div className="font-mono text-xs text-gray-700 mb-2 line-clamp-2">
                      {item.query}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{item.executionTime}ms</span>
                      <span>{item.rowCount} rows</span>
                      {item.error && (
                        <span className="text-red-500">Error</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-6 text-center">
              <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-muted">Executing query...</p>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h3 className="font-medium text-red-900">Query Error</h3>
                </div>
                <p className="text-red-700 font-mono text-sm">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="p-6">
              {/* Result Header */}
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-medium text-green-900">Query Executed Successfully</h3>
                  </div>
                  <div className="text-sm text-green-700">
                    {result.executionTime}ms • {result.rowCount} rows
                  </div>
                </div>
              </div>

              {/* Results Table */}
              {result.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border border-border rounded-md">
                    <thead className="bg-panel-background">
                      <tr>
                        {result.columns.map((column, index) => (
                          <th key={index} className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider border-b border-border">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-gray-200">
                      {result.data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-panel-background">
                          {result.columns.map((column, colIndex) => (
                            <td key={colIndex} className="px-4 py-3 text-sm text-foreground">
                              {formatValue(row[column])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-hover rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No results</h3>
                  <p className="text-muted">The query executed successfully but returned no data.</p>
                </div>
              )}
            </div>
          )}

          {!loading && !error && !result && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-hover rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Ready to execute queries</h3>
              <p className="text-muted mb-4">
                Enter a SQL query above and press Cmd+Enter to execute it.
              </p>
              <div className="text-left max-w-md mx-auto">
                <h4 className="font-medium text-foreground mb-2">Example queries:</h4>
                <div className="space-y-2 text-sm text-muted">
                  <div className="font-mono bg-hover p-2 rounded">
                    SELECT * FROM users LIMIT 10;
                  </div>
                  <div className="font-mono bg-hover p-2 rounded">
                    SELECT COUNT(*) FROM companies;
                  </div>
                  <div className="font-mono bg-hover p-2 rounded">
                    SELECT name, email FROM people WHERE status = 'ACTIVE';
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
