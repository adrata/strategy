"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TableData, DataGridColumn } from "../types";

interface DataGridProps {
  tableName: string;
  workspaceId: string;
  onRecordSelect?: (record: Record<string, any>) => void;
}

export function DataGrid({ tableName, workspaceId, onRecordSelect }: DataGridProps) {
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const pageSize = 50;

  // Fetch table data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(sortColumn && { orderBy: sortColumn, orderDirection: sortDirection })
        });

        const response = await fetch(`/api/database/tables/${tableName}/data?${params}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setData(result.data);
          } else {
            setError(result.error || 'Failed to fetch data');
          }
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, page, searchTerm, sortColumn, sortDirection]);

  // Generate columns from data
  const columns: DataGridColumn[] = useMemo(() => {
    if (!data || data.rows.length === 0) return [];
    
    const firstRow = data.rows[0];
    return Object.keys(firstRow).map(key => ({
      key,
      name: key,
      type: typeof firstRow[key],
      width: 150,
      sortable: true,
      filterable: true,
      editable: true
    }));
  }, [data]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (row: Record<string, any>, index: number) => {
    if (onRecordSelect) {
      onRecordSelect(row);
    }
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedRows(new Set(data.rows.map((_, index) => index)));
    } else {
      setSelectedRows(new Set());
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-[var(--muted)]">Loading table data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Error loading data</h3>
          <p className="text-[var(--muted)] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--hover)] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No data found</h3>
          <p className="text-[var(--muted)]">This table is empty or your search returned no results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{tableName}</h2>
            <p className="text-sm text-[var(--muted)]">
              {data.totalCount.toLocaleString()} records • Page {page} of {data.totalPages}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
              Add Record
            </button>
            <button className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
              Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {selectedRows.size > 0 && (
            <div className="text-sm text-[var(--muted)]">
              {selectedRows.size} selected
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-[var(--panel-background)] sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.rows.length && data.rows.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--hover)]"
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.name}
                    {column.sortable && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--background)] divide-y divide-gray-200">
            {data.rows.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-[var(--panel-background)] cursor-pointer"
                onClick={() => handleRowClick(row, index)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(index)}
                    onChange={(e) => handleSelectRow(index, e.target.checked)}
                    className="rounded border-[var(--border)]"
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-[var(--foreground)]">
                    <div className="max-w-xs truncate" title={String(row[column.key])}>
                      {row[column.key] === null ? (
                        <span className="text-[var(--muted)] italic">null</span>
                      ) : typeof row[column.key] === 'object' ? (
                        <span className="text-blue-600 font-mono text-xs">
                          {JSON.stringify(row[column.key])}
                        </span>
                      ) : (
                        String(row[column.key])
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--muted)]">
            Showing {(((page - 1) * pageSize) + 1).toLocaleString()} to {Math.min(page * pageSize, data.totalCount).toLocaleString()} of {data.totalCount.toLocaleString()} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!data.hasPreviousPage}
              className="px-3 py-1 text-sm border border-[var(--border)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--panel-background)]"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-[var(--muted)]">
              Page {page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!data.hasNextPage}
              className="px-3 py-1 text-sm border border-[var(--border)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--panel-background)]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
