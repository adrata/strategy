"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';

interface InfiniteScrollTableProps {
  section: string;
  columns: string[];
  searchPlaceholder?: string;
}

export function InfiniteScrollTable({ 
  section, 
  columns, 
  searchPlaceholder = `Search ${section}...` 
}: InfiniteScrollTableProps) {
  const { data, user } = useAcquisitionOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);

  // Get data from shared context instead of making API calls
  const getAllRecords = () => {
    switch (section) {
      case 'leads': return data.acquireData.leads || [];
      case 'prospects': return data.acquireData.prospects || [];
      case 'opportunities': return data.acquireData.opportunities || [];
      case 'companies': return data.acquireData.companies || [];
      case 'people': return data.acquireData.people || [];
      case 'clients': return data.acquireData.clients || [];
      case 'partners': return data.acquireData.partnerships || [];
      default: return [];
    }
  };

  const allRecords = getAllRecords();

  // Client-side filtering instead of API calls
  useEffect(() => {
    let filtered = allRecords;
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = allRecords.filter(record => {
        const searchableText = [
          record.fullName,
          record.name,
          record.firstName,
          record.lastName,
          record.email,
          record.company,
          record.title,
          record.jobTitle,
          record.industry
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchLower);
      });
    }
    
    setFilteredRecords(filtered);
    console.log(`🔍 [CLIENT FILTER] Filtered ${section}: ${filtered.length} of ${allRecords.length} records`);
  }, [allRecords, searchQuery, section]);

  // No infinite scroll needed - using client-side filtering of all data

  // Render table row based on section
  const renderTableRow = (record: any, index: number) => {
    const key = `${section}_${record.id || index}`;
    
    switch (section) {
      case 'leads':
        return (
          <tr key={key} className="hover:bg-[var(--panel-background)] cursor-pointer">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.company || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">{record.fullName || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.title || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.email || 'No email'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.status || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
              <span className={`px-2 py-1 text-xs rounded-full ${
                record['priority'] === 'high' ? 'bg-red-100 text-red-800' :
                record['priority'] === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {record.priority || 'Low'}
              </span>
            </td>
          </tr>
        );
        
      case 'prospects':
        return (
          <tr key={key} className="hover:bg-[var(--panel-background)] cursor-pointer">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.company || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">{record.fullName || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.jobTitle || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.email || 'No email'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.status || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
              <span className={`px-2 py-1 text-xs rounded-full ${
                record['priority'] === 'high' ? 'bg-red-100 text-red-800' :
                record['priority'] === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {record.priority || 'Low'}
              </span>
            </td>
          </tr>
        );
        
      case 'people':
        return (
          <tr key={key} className="hover:bg-[var(--panel-background)] cursor-pointer">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">{record.fullName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.jobTitle || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.email || 'No email'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.status || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
              {new Date(record.updatedAt).toLocaleDateString()}
            </td>
          </tr>
        );
        
      case 'companies':
        return (
          <tr key={key} className="hover:bg-[var(--panel-background)] cursor-pointer">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">{record.name || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.industry || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">{record.size || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
              {record.revenue ? `$${record.revenue.toLocaleString()}` : 'Unknown'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
              {new Date(record.updatedAt).toLocaleDateString()}
            </td>
          </tr>
        );
        
      default:
        return (
          <tr key={key} className="hover:bg-[var(--panel-background)] cursor-pointer">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
              {record.name || record.fullName || 'Unknown'}
            </td>
          </tr>
        );
    }
  };

  return (
    <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] h-full flex flex-col mx-6 mb-8">
      {/* Header with search */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[var(--foreground)] capitalize">
            {section} ({filteredRecords.length.toLocaleString()} {searchQuery ? 'filtered' : 'total'})
          </h3>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[var(--muted)] hover:text-[var(--muted)]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[var(--panel-background)] sticky top-0 z-10">
              <tr>
                {columns.map((header) => (
                  <th 
                    key={header}
                    className="px-6 py-4 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[var(--background)] divide-y divide-gray-200">
              {filteredRecords.map(renderTableRow)}
            </tbody>
          </table>
          
          {/* Data summary */}
          <div className="flex justify-center py-4">
            {filteredRecords.length > 0 && (
              <div className="text-center text-[var(--muted)] text-sm py-4">
                Showing {filteredRecords.length} {section} {searchQuery ? '(filtered)' : ''}
              </div>
            )}
            {filteredRecords['length'] === 0 && allRecords.length > 0 && searchQuery && (
              <div className="text-center text-[var(--muted)] text-sm py-4">
                No {section} match "{searchQuery}" - try a different search
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
