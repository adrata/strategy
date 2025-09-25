/**
 * Refactored pipeline table component.
 * Clean, modular table that handles all pipeline sections with proper TypeScript safety.
 */

import React, { useState } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';
import { usePipelineData } from '@/platform/hooks/usePipelineData';
import { usePipelineActions } from '@/platform/hooks/usePipelineActions';
import { getRealtimeActionTiming } from '@/platform/utils/statusUtils';
import { TableHeader } from './table/TableHeader';
import { TableRow } from './table/TableRow';
import { Pagination } from './table/Pagination';
import { TableSkeleton } from './table/TableSkeleton';
import { TableDataSkeleton } from './table/TableDataSkeleton';
import { EditRecordModal } from './EditRecordModal';
import { AddActionModal, ActionLogData } from './AddActionModal';
import { RecordDetailModal } from './RecordDetailModal';

// -------- Types --------
interface PipelineRecord {
  id: string;
  name: string;
  status?: string;
  priority?: string;
  stage?: string;
  lastActionTime?: string;
  lastContactTime?: string;
  lastActionDescription?: string;
  nextAction?: string;
  [key: string]: any;
}

interface PipelineTableProps {
  section: string;
  data: PipelineRecord[];
  onRecordClick: (record: PipelineRecord) => void;
  onReorderRecords?: (fromIndex: number, toIndex: number) => void;
  onColumnSort?: (columnName: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  visibleColumns?: string[];
  pageSize?: number;
  isLoading?: boolean;
}

// -------- Constants --------
const DEFAULT_PAGE_SIZE = 100; // Show more data by default

// -------- Helper Functions --------
function getColumnWidth(index: number): string {
  const widths = [
    '80px',   // Rank
    '200px',  // Company
    '180px',  // Person/Name
    '150px',  // Title
    '120px',  // Status
    '160px',  // Last Action (increased from 140px)
    '180px',  // Next Action (increased from 160px)
    '100px',  // Amount
    '120px',  // Stage
    '100px',  // Priority
    '120px',  // Industry
    '150px',  // Email
    '120px',  // Phone
    '80px',   // Actions
  ];
  
  return widths[index] || '120px';
}

// -------- Timing Functions --------
function getLastActionTiming(record: PipelineRecord) {
  const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
  return getRealtimeActionTiming(lastActionDate);
}

function getNextActionTiming(record: PipelineRecord) {
  // For next actions, we need to calculate timing based on when the next action should happen
  const nextActionDate = record['nextActionDate'] || record['nextContactDate'];
  if (!nextActionDate) {
    return { text: 'No date set', color: 'bg-gray-100 text-gray-800' };
  }
  
  const now = new Date();
  const actionDate = new Date(nextActionDate);
  const diffMs = actionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: 'Overdue', color: 'bg-red-100 text-red-800' };
  } else if (diffDays === 0) {
    return { text: 'Today', color: 'bg-orange-100 text-orange-800' };
  } else if (diffDays === 1) {
    return { text: 'Tomorrow', color: 'bg-yellow-100 text-yellow-800' };
  } else if (diffDays <= 7) {
    return { text: 'This week', color: 'bg-navy-100 text-navy-800' };
  } else if (diffDays <= 14) {
    return { text: 'Next week', color: 'bg-navy-100 text-navy-800' };
  } else if (diffDays <= 30) {
    return { text: 'This month', color: 'bg-gray-100 text-gray-800' };
  } else {
    return { text: 'Future', color: 'bg-gray-100 text-gray-800' };
  }
}

function getTableHeaders(visibleColumns?: string[], section?: string): string[] {
  if (visibleColumns && visibleColumns.length > 0) {
    return visibleColumns;
  }
  
  // Section-specific headers
  if (section === 'speedrun') {
    return [
      'Rank',
      'Person',
      'Stage',
      'Last Action',
      'Next Action'
    ];
  }
  
  // Default headers for other sections
  const defaultHeaders = [
    'Rank',
    'Company',
    'Person',
    'Title',
    'Status',
    'Last Action',
    'Next Action',
    'Amount',
    'Stage',
    'Priority',
    'Industry',
    'Email',
    'Phone',
  ];
  
  return defaultHeaders;
}

// -------- Main Component --------
export function PipelineTable({
  section,
  data,
  onRecordClick,
  onReorderRecords,
  onColumnSort,
  sortField,
  sortDirection,
  visibleColumns,
  pageSize = DEFAULT_PAGE_SIZE,
  isLoading = false,
}: PipelineTableProps) {
  console.log('🔍 [PipelineTable] Component rendered for section:', section, 'visibleColumns:', visibleColumns, 'data length:', data?.length, 'isLoading:', isLoading);
  console.log('🔍 [PipelineTable] Sample data:', data?.slice(0, 2));
  
  // Get workspace context
  const { user: authUser } = useUnifiedAuth();
  const workspaceId = authUser?.activeWorkspaceId || '';
  const workspaceName = authUser?.workspaces?.find(w => w['id'] === workspaceId)?.['name'] || '';
  
  // Get table headers
  const headers = getTableHeaders(visibleColumns, section);
  
  // Dynamic height calculation - align with AI chat panel bottom
  const headerHeight = 40; // Height of table header
  const rowHeight = 64; // Approximate height per row
  const contentHeight = headerHeight + (data.length * rowHeight);
  const maxViewportHeight = typeof window !== 'undefined' ? window.innerHeight - 187.5 : 600; // Reserve space below table to align with chat panel
  
  // Dynamic height calculation - align with chat panel
  let tableHeight;
  if (data.length === 0) {
    // Empty state - use moderate height
    tableHeight = 200;
  } else if (data.length <= 10) {
    // Small to medium datasets - use content height with small buffer to match AI panel
    tableHeight = contentHeight + 24; // Extended by 4px to align with AI chat input box
  } else {
    // Larger datasets - use viewport height to fill available space and align with chat panel
    tableHeight = maxViewportHeight + 7; // Extended by 4px to align with AI chat input box
  }
  
  // Use custom hooks for data and actions
  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    setCurrentPage,
    setSortField,
    setSortDirection,
  } = usePipelineData({ data, pageSize });
  
  console.log('🔍 [PipelineTable] usePipelineData results:', {
    inputDataLength: data?.length,
    paginatedDataLength: paginatedData?.length,
    currentPage,
    totalPages,
    totalItems,
    samplePaginatedData: paginatedData?.slice(0, 2)
  });

  
  const {
    editModalOpen,
    addActionModalOpen,
    detailModalOpen,
    selectedRecord,
    isSubmitting,
    handleEdit,
    handleAddAction,
    handleMarkComplete,
    handleDelete,
    handleCall,
    handleEmail,
    handleEditSubmit,
    handleActionSubmit,
    closeEditModal,
    closeAddActionModal,
    closeDetailModal,
  } = usePipelineActions();

  // Wrapper function to convert ActionLogData types
  const handleActionSubmitWrapper = (actionData: any) => {
    // Convert from AddActionModal format to usePipelineActions format
    const convertedActionData = {
      type: actionData.actionType || actionData.type,
      description: actionData.notes || actionData.description,
      date: actionData.actionDate || actionData.date,
      outcome: actionData.nextAction || actionData.outcome
    };
    return handleActionSubmit(convertedActionData);
  };

  // Map section to recordType for RecordDetailModal
  const getRecordType = (section: string): 'lead' | 'prospect' | 'opportunity' | 'account' | 'contact' | 'customer' | 'partner' => {
    switch (section) {
      case 'leads': return 'lead';
      case 'prospects': return 'prospect';
      case 'opportunities': return 'opportunity';
      case 'companies': return 'account';
      case 'people': return 'contact';
      case 'clients': return 'customer';
      case 'partners': return 'partner';
      default: return 'lead';
    }
  };
  
  // Handle column sort
  const handleColumnSort = (columnName: string) => {
    if (onColumnSort) {
      onColumnSort(columnName);
    } else {
      // Use internal sorting
      if (sortField === columnName) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(columnName);
        setSortDirection('asc');
      }
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Show skeleton loading state - only for table data, keep header and filters visible
  if (isLoading) {
    return (
      <TableDataSkeleton 
        visibleColumns={visibleColumns}
        rowCount={pageSize}
      />
    );
  }
  
  return (
    <div 
      key={`pipeline-table-${section}-${visibleColumns?.join('-')}`} 
      className="bg-white rounded-lg border border-gray-200 flex flex-col relative" 
      style={{ height: `${tableHeight}px` }}
    >
      {/* Table container */}
      <div className="flex-1 overflow-auto min-h-0 middle-panel-scroll">
        <table className="w-full table-auto border-collapse mb-0">
          
          {/* Table header */}
          <TableHeader
            headers={headers}
            sortField={sortField}
            sortDirection={sortDirection}
            onColumnSort={handleColumnSort}
            getColumnWidth={getColumnWidth}
          />
          
          {/* Table body */}
          <tbody>
            {paginatedData.map((record, index) => {
              console.log(`🔍 [PipelineTable] Rendering row ${index}:`, {
                recordId: record.id,
                recordName: record.name || record['fullName'],
                recordCompany: record['company'],
                headersLength: headers.length,
                visibleColumnsLength: visibleColumns?.length,
                sampleRecordData: {
                  name: record.name,
                  company: record['company'],
                  state: record['state'],
                  title: record['title'],
                  lastAction: record['lastAction'],
                  nextAction: record['nextAction'],
                  allKeys: Object.keys(record).slice(0, 10) // Show first 10 keys
                }
              });
              
              // Simple table row for debugging
              return (
                <tr
                  key={record.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50 h-16 border-b border-gray-200"
                  onClick={() => onRecordClick(record)}
                >
                  {headers.map((header, headerIndex) => {
                    let cellContent = '';
                    
                    // Simple cell content mapping
                    switch (header.toLowerCase()) {
                      case 'rank':
                        // Use simple numeric rank for consistent design across all sections
                        const dbRank = record.rank;
                        
                        if (dbRank && dbRank > 0) {
                          cellContent = String(dbRank);
                        } else {
                          // Fallback: Calculate global rank across all pages
                          const globalRank = (currentPage - 1) * pageSize + index + 1;
                          cellContent = String(globalRank);
                        }
                        break;
                      case 'company':
                        // Handle both string and object company data
                        const company = record['company'];
                        if (typeof company === 'object' && company !== null) {
                          cellContent = company.name || company.companyName || 'Company';
                        } else {
                          cellContent = record['name'] || company || record['companyName'] || record['organization'] || 'Company';
                        }
                        break;
                      case 'person':
                      case 'name':
                        cellContent = record['fullName'] || `${record['firstName'] || ''} ${record['lastName'] || ''}`.trim() || record.name || 'Person';
                        break;
                      case 'state':
                        cellContent = record['state'] || record['status'] || record['location'] || 'State';
                        break;
                      case 'title':
                        cellContent = record['title'] || record['jobTitle'] || record['position'] || 'Title';
                        break;
                      case 'last action':
                        cellContent = record['lastActionDescription'] || record['lastAction'] || record['lastContactType'] || 'No action';
                        break;
                      case 'next action':
                        cellContent = record['nextAction'] || record['nextActionDescription'] || 'No action planned';
                        break;
                      default:
                        const value = record[header.toLowerCase()] || record[header];
                        cellContent = value ? String(value) : '';
                    }
                    
                    return (
                      <td
                        key={`${record.id}-${header}`}
                        className="px-6 py-3 whitespace-nowrap text-sm text-gray-900"
                        style={{ width: getColumnWidth(headerIndex) }}
                      >
                        {header.toLowerCase() === 'last action' || header.toLowerCase() === 'next action' ? (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const timing = header.toLowerCase() === 'last action' 
                                ? getLastActionTiming(record)
                                : getNextActionTiming(record);
                              return (
                                <>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${timing.color}`}>
                                    {timing.text}
                                  </span>
                                  <span className="text-sm text-gray-600 font-normal truncate max-w-32">
                                    {cellContent}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900 truncate">
                            {cellContent}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
      />
      
      {/* Modals */}
      {editModalOpen && selectedRecord && (
        <EditRecordModal
          record={selectedRecord}
          isOpen={editModalOpen}
          onClose={closeEditModal}
          onSave={handleEditSubmit}
          recordType={section}
          isLoading={isSubmitting}
        />
      )}
      
      {addActionModalOpen && selectedRecord && (
        <AddActionModal
          record={selectedRecord}
          isOpen={addActionModalOpen}
          onClose={closeAddActionModal}
          onSubmit={handleActionSubmitWrapper}
          recordType={section}
          isLoading={isSubmitting}
        />
      )}
      
      {detailModalOpen && selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          recordType={getRecordType(section)}
          isOpen={detailModalOpen}
          onClose={closeDetailModal}
        />
      )}
    </div>
  );
}
