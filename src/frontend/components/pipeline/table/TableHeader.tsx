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
  // Display names -> field names
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
  'State': 'state',
  'Actions': 'actions',
  'LAST ACTION': 'lastAction',
  'NEXT ACTION': 'nextAction',
  // Field names -> field names (for lowercase headers)
  'rank': 'rank',
  'company': 'company',
  'name': 'name',
  'title': 'title',
  'status': 'status',
  'lastAction': 'lastAction',
  'nextAction': 'nextAction',
  'lastActionDate': 'lastActionDate',
  'amount': 'amount',
  'stage': 'stage',
  'priority': 'priority',
  'industry': 'industry',
  'email': 'email',
  'phone': 'phone',
  'state': 'state',
  'actions': 'actions',
};

// Display name mapping for field names to proper display names
const DISPLAY_NAME_MAP: Record<string, string> = {
  'rank': 'Rank',
  'company': 'Company',
  'name': 'Name',
  'title': 'Title',
  'status': 'Status',
  'actions': 'Actions',
  'lastAction': 'Last Action',
  'nextAction': 'Next Action',
  'lastActionDate': 'Last Action',
  'amount': 'Amount',
  'stage': 'Stage',
  'priority': 'Priority',
  'industry': 'Industry',
  'email': 'Email',
  'phone': 'Phone',
  'state': 'State',
};

// -------- Helper Functions --------
function getFieldName(header: string): string {
  // First try exact match (handles both display names and field names)
  if (FIELD_MAP[header]) {
    return FIELD_MAP[header];
  }
  // Fallback: return lowercase version
  return header.toLowerCase();
}

function getDisplayName(fieldName: string): string {
  return DISPLAY_NAME_MAP[fieldName] || fieldName;
}

function getSortIcon(sortField: string | null, field: string, sortDirection?: 'asc' | 'desc' | null) {
  // Compare sortField with field - handle section-specific mappings
  // For speedrun/companies: 'rank' header maps to 'globalRank' field
  // For other sections: 'rank' header maps to 'rank' field
  const isCurrentSort = sortField === field || 
                        (sortField === 'globalRank' && field === 'rank') ||
                        (sortField === 'rank' && field === 'rank');
  
  if (!isCurrentSort) {
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
          // Compare sortField with field - handle section-specific mappings
          const isCurrentSort = sortField === field || 
                                (sortField === 'globalRank' && field === 'rank') ||
                                (sortField === 'rank' && field === 'rank');
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
                e.preventDefault();
                console.log(`🔧 [TableHeader] Column clicked: ${header} (field: ${field}), onColumnSort exists: ${!!onColumnSort}`);
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
