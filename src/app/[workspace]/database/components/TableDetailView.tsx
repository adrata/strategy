"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";

interface TableDetailViewProps {
  tableName: string;
}

export function TableDetailView({ tableName }: TableDetailViewProps) {
  const router = useRouter();
  const { user: authUser } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId || authUser?.activeWorkspaceId;

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/database/tables/${tableName}?workspaceId=${workspaceId}&limit=100`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTableData(data.data.rows || []);
          } else {
            setError(data.error || 'Failed to fetch table data');
          }
        } else {
          setError('Failed to fetch table data');
        }
      } catch (err) {
        setError('Failed to fetch table data');
        console.error('Error fetching table data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId && tableName) {
      fetchTableData();
    }
  }, [workspaceId, tableName]);

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-24 bg-loading-bg rounded animate-pulse mb-2"></div>
              <div className="h-8 w-48 bg-loading-bg rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-loading-bg rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Table Data Skeleton */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-panel-background border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <div className="w-full">
                {/* Table Header Skeleton */}
                <div className="bg-background border-b border-border">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-4 py-3 flex-1">
                        <div className="h-4 w-20 bg-loading-bg rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Table Rows Skeleton */}
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <div key={rowIndex} className="border-b border-border hover:bg-hover">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, colIndex) => (
                        <div key={colIndex} className="px-4 py-3 flex-1">
                          <div className="h-4 w-24 bg-loading-bg rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-muted mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-foreground text-background rounded hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted hover:text-foreground mb-2"
            >
              ← Back to Tables
            </button>
            <h1 className="text-2xl font-semibold text-foreground">{tableName}</h1>
            <p className="text-sm text-muted mt-1">
              {tableData.length} records • {columns.length} columns
            </p>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="flex-1 overflow-auto p-6">
        {tableData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted">No data found in this table</p>
          </div>
        ) : (
          <div className="bg-panel-background border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {tableData.map((row, index) => (
                    <tr key={index} className="hover:bg-hover">
                      {columns.map((column) => (
                        <td
                          key={column}
                          className="px-4 py-3 text-sm text-foreground"
                        >
                          <div className="max-w-xs truncate">
                            {typeof row[column] === 'object' 
                              ? JSON.stringify(row[column])
                              : String(row[column] || '')
                            }
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
