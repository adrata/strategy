"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SimplePipelineTableProps {
  section: string;
  workspaceId: string;
  userId: string;
}

export function SimplePipelineTable({ section, workspaceId, userId }: SimplePipelineTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadData();
  }, [section, workspaceId, userId]);

  // Handle column sorting
  const handleColumnSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort data based on current sort field and direction
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🚀 [SIMPLE TABLE] Loading ${section} data for ${workspaceId}/${userId}`);
      
      const apiUrl = `/api/pipeline?section=${section}&workspaceId=${workspaceId}&userId=${userId}&_t=${Date.now()}`;
      console.log(`🔍 [SIMPLE TABLE] API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
          console.log(`✅ [SIMPLE TABLE] Loaded ${(result.data || []).length} ${section} records`);
        } else {
          setError(result.error || 'Failed to load data');
        }
      } else {
        setError(`API error: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error(`❌ [SIMPLE TABLE] Error loading ${section}:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] h-full flex flex-col mx-6 mb-8">
        <PipelineSkeleton message="Loading pipeline data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] h-full flex flex-col mx-6 mb-8">
        <div className="p-8 text-center text-red-500 flex-1 flex items-center justify-center">
          <div>
            <p className="text-sm">Error loading {section}: {error}</p>
            <button 
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data['length'] === 0) {
    return (
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] h-full flex flex-col mx-6 mb-8">
        <div className="p-8 text-center text-[var(--muted)] flex-1 flex items-center justify-center">
          <div>
            <p className="text-lg mb-2">No {section} found</p>
            <p className="text-sm">Data loaded successfully but no records returned</p>
            <button 
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] h-full flex flex-col mx-6 mb-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--foreground)] capitalize">
          {section} {section === 'companies' ? '(Business entities)' : section === 'people' ? '(Individual entities)' : `(${data.length} records)`}
        </h3>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[var(--panel-background)] sticky top-0 z-10">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--hover)] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColumnSort('name');
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--hover)] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColumnSort('company');
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Company</span>
                    {sortField === 'company' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--hover)] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColumnSort('email');
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Email</span>
                    {sortField === 'email' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--hover)] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColumnSort('status');
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--background)] divide-y divide-gray-200">
              {sortedData.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-[var(--panel-background)]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
                    {record.fullName || record.name || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
                    {record.company || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
                    {record.email || 'No email'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
                    {record.status || 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
