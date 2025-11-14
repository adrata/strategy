/**
 * Table header component for pipeline tables.
 * Handles column headers, sorting, and sticky positioning.
 */

import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// -------- Types --------
interface TableHeaderProps {
  headers: string[];
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onColumnSort?: (columnName: string) => void;
  getColumnWidth?: (index: number) => string;
}

// -------- Constants --------
const FIELD_MAP: Record<string, string> = {
  'Rank': 'rank',
  'Company': 'company',
  'Person': 'name',
  'Name': 'name',
  'Title': 'title',
  'Status': 'status',
  'Last Action': 'lastActionDate',
  'Next Action': 'nextAction',
  'Amount': 'amount',
  'Stage': 'stage',
  'Priority': 'priority',
  'Industry': 'industry',
  'Email': 'email',
  'Phone': 'phone',
};

// Display name mapping for field names to proper display names
const DISPLAY_NAME_MAP: Record<string, string> = {
  'rank': 'Rank',
  'company': 'Company',
  'name': 'Name',
  'title': 'Title',
  'status': 'Status',
  'actions': 'Actions',
  'lastAction': 'LAST ACTION',
  'nextAction': 'NEXT ACTION',
  'amount': 'Amount',
  'stage': 'Stage',
  'priority': 'Priority',
  'industry': 'Industry',
  'email': 'Email',
  'phone': 'Phone',
};

// -------- Helper Functions --------
function getFieldName(header: string): string {
  return FIELD_MAP[header] || header.toLowerCase();
}

function getDisplayName(fieldName: string): string {
  return DISPLAY_NAME_MAP[fieldName] || fieldName;
}

function getSortIcon(sortField: string | null, field: string, sortDirection?: 'asc' | 'desc' | null) {
  if (sortField !== field) {
    // Show neutral sort icon on hover for unsorted columns
    return (
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronUpIcon className="w-4 h-4 text-gray-300" />
      </div>
    );
  }
  
  // Show appropriate icon for current sort state
  if (sortDirection === 'asc') {
    return <ChevronUpIcon className="w-4 h-4 text-muted" />;
  } else if (sortDirection === 'desc') {
    return <ChevronDownIcon className="w-4 h-4 text-muted" />;
  } else {
    // Unsorted state - show neutral icon
    return <ChevronUpIcon className="w-4 h-4 text-gray-300" />;
  }
}

// -------- Main Component --------
export function TableHeader({ 
  headers, 
  sortField, 
  sortDirection, 
  onColumnSort, 
  getColumnWidth 
}: TableHeaderProps) {
  // Removed console.log to improve performance - was logging on every render
  // Uncomment for debugging if needed:
  // console.log('🔍 [TableHeader] Headers received:', headers);
  
  // Default column width function
  const defaultGetColumnWidth = (index: number): string => {
    const widths = ['80px', '200px', '150px', '120px', '120px', '120px'];
    return widths[index] || '120px';
  };
  
  const columnWidthFn = getColumnWidth || defaultGetColumnWidth;
  
  return (
    <thead className="sticky top-0 z-10">
      <tr>
        {headers.map((header, index) => {
          const field = getFieldName(header);
          const displayName = getDisplayName(header); // Use display name for rendering
          const isCurrentSort = sortField === field;
          const sortIcon = getSortIcon(sortField || '', field, sortDirection);
          
          return (
            <th 
              key={header}
              className={`px-6 py-1 text-left text-xs font-medium text-muted uppercase tracking-wider bg-panel-background h-8 border-b border-border ${
                onColumnSort ? 'cursor-pointer hover:bg-hover transition-colors group' : ''
              }`}
              style={{ 
                width: columnWidthFn(index),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Removed console.log to improve performance
                // Uncomment for debugging if needed:
                // console.log(`🔧 [TableHeader] Column clicked: ${header}, onColumnSort exists: ${!!onColumnSort}`);
                onColumnSort?.(header);
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ 
                  wordSpacing: 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{displayName}</span>
                {onColumnSort && (
                  <div className="flex items-center ml-2">
                    {getSortIcon(sortField, field, sortDirection)}
                  </div>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
