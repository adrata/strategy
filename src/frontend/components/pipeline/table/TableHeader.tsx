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
  getColumnWidth: (index: number) => string;
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
              className={`
                px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                bg-white border-b border-gray-200
                ${!isActionColumn && onColumnSort ? 'cursor-pointer hover:bg-gray-50' : ''}
              `}
              style={{ width: getColumnWidth(index) }}
              onClick={!isActionColumn && onColumnSort ? () => onColumnSort(field) : undefined}
            >
              <div className="flex items-center space-x-1">
                <span>{header}</span>
                {sortIcon}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
