/**
 * Table header component for pipeline tables.
 * Handles column headers, sorting, and sticky positioning.
 */

import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// -------- Types --------
interface TableHeaderProps {
  headers: string[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
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
  'Last Action': 'lastAction',
  'Next Action': 'nextAction',
  'Amount': 'amount',
  'Stage': 'stage',
  'Priority': 'priority',
  'Industry': 'industry',
  'Email': 'email',
  'Phone': 'phone',
};

// -------- Helper Functions --------
function getFieldName(header: string): string {
  return FIELD_MAP[header] || header.toLowerCase();
}

function getSortIcon(sortField: string, field: string, sortDirection?: 'asc' | 'desc') {
  if (sortField !== field) {
    return null;
  }
  
  return sortDirection === 'asc' ? (
    <ChevronUpIcon className="w-4 h-4" />
  ) : (
    <ChevronDownIcon className="w-4 h-4" />
  );
}

// -------- Main Component --------
export function TableHeader({ 
  headers, 
  sortField, 
  sortDirection, 
  onColumnSort, 
  getColumnWidth 
}: TableHeaderProps) {
  // Debug: Log headers to see what's being passed
  console.log('🔍 [TableHeader] Headers received:', headers);
  
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
          const isActionColumn = header === 'Actions';
          const field = getFieldName(header);
          const isCurrentSort = sortField === field;
          const sortIcon = getSortIcon(sortField || '', field, sortDirection);
          
          return (
            <th 
              key={header}
              className={`px-6 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 h-8 border-b border-gray-200 ${
                !isActionColumn && onColumnSort ? 'cursor-pointer hover:bg-gray-100 transition-colors group' : ''
              }`}
              style={{ 
                width: columnWidthFn(index),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              onClick={() => !isActionColumn && onColumnSort?.(header)}
            >
              <div className="flex items-center justify-between">
                <span style={{ 
                  wordSpacing: 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{isActionColumn ? '' : header}</span>
                {!isActionColumn && onColumnSort && (
                  <div className="flex items-center ml-2">
                    {isCurrentSort ? (
                      sortDirection === 'asc' ? (
                        <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                      )
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
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
