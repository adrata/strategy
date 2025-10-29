/**
 * Pagination component for pipeline tables.
 * Handles page navigation and page size controls.
 */

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// -------- Types --------
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  apiTotalCount?: number; // Original total count for "filtered from X" display
  hasActiveFilters?: boolean; // Whether filters are active
}

// -------- Constants --------
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

// -------- Helper Functions --------
function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const maxVisiblePages = 7;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show pages with ellipsis
    pages.push(1);
    
    if (currentPage > 4) {
      pages.push('...');
    }
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 3) {
      pages.push('...');
    }
    
    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }
  
  return pages;
}

// -------- Main Component --------
export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  apiTotalCount,
  hasActiveFilters = false,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--background)] border-t border-[var(--border)]">
      {/* Page size selector */}
      {onPageSizeChange && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-[var(--border)] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Page info - Show filtered count with optional total */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">
          {hasActiveFilters && apiTotalCount && apiTotalCount !== totalItems ? (
            <>
              Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalItems.toLocaleString()} results
              <span className="text-gray-500 ml-1">
                (filtered from {apiTotalCount.toLocaleString()} total)
              </span>
            </>
          ) : (
            `Showing ${startItem.toLocaleString()} to ${endItem.toLocaleString()} of ${totalItems.toLocaleString()} results`
          )}
        </span>
      </div>
      
      {/* Page navigation - Only show when there are multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            p-2 rounded-md text-sm font-medium
            ${currentPage === 1 
              ? 'text-[var(--muted)] cursor-not-allowed' 
              : 'text-gray-700 hover:bg-[var(--hover)]'
            }
          `}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        
        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`
              px-3 py-2 text-sm font-medium rounded-md
              ${page === '...'
                ? 'text-[var(--muted)] cursor-default'
                : page === currentPage
                ? 'bg-navy-50 text-navy-900 border border-navy-200'
                : 'text-gray-700 hover:bg-[var(--hover)]'
              }
            `}
          >
            {page}
          </button>
        ))}
        
        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            p-2 rounded-md text-sm font-medium
            ${currentPage === totalPages 
              ? 'text-[var(--muted)] cursor-not-allowed' 
              : 'text-gray-700 hover:bg-[var(--hover)]'
            }
          `}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
        </div>
      )}
    </div>
  );
}
