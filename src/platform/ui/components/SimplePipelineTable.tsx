"use client";

import React, { useState, useEffect } from 'react';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';

interface SimplePipelineTableProps {
  section: string;
  workspaceId: string;
  userId: string;
}

export function SimplePipelineTable({ section, workspaceId, userId }: SimplePipelineTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [section, workspaceId, userId]);

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
      <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col mx-6 mb-8">
        <PipelineSkeleton message="Loading pipeline data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col mx-6 mb-8">
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
      <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col mx-6 mb-8">
        <div className="p-8 text-center text-gray-500 flex-1 flex items-center justify-center">
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
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col mx-6 mb-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {section} {section === 'companies' ? '(Business entities)' : section === 'people' ? '(Individual entities)' : `(${data.length} records)`}
        </h3>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.fullName || record.name || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.company || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.email || 'No email'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
