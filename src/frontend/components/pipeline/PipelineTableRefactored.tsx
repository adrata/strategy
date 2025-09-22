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
  rank?: number;
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
const DEFAULT_PAGE_SIZE = 50;

// -------- Helper Functions --------
function getTableHeaders(visibleColumns?: string[], section?: string): string[] {
  if (!visibleColumns || visibleColumns.length === 0) {
    // Default headers based on section
    const defaultHeaders: Record<string, string[]> = {
      'leads': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'prospects': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'opportunities': ['Rank', 'Company', 'Stage', 'Value', 'Last Action', 'Next Action'],
      'companies': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'people': ['Rank', 'Person', 'Company', 'Title', 'Last Action', 'Next Action'],
      'clients': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'partners': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'sellers': ['Rank', 'Person', 'Company', 'Title', 'Last Action', 'Next Action'],
      'speedrun': ['Rank', 'Company', 'Last Action', 'Next Action']
    };
    
    return defaultHeaders[section || 'companies'] || defaultHeaders['companies'];
  }
  
  return visibleColumns;
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
  console.log('🔍 [PipelineTableRefactored] Component rendered for section:', section, 'visibleColumns:', visibleColumns, 'data length:', data?.length, 'isLoading:', isLoading);
  console.log('🔍 [PipelineTableRefactored] Sample data:', data?.slice(0, 2));
  
  // Get workspace context
  const { user: authUser } = useUnifiedAuth();
  const workspaceId = authUser?.activeWorkspaceId || '';
  const workspaceName = authUser?.workspaces?.find(w => w['id'] === workspaceId)?.['name'] || '';
  
  // Get table headers
  const headers = getTableHeaders(visibleColumns, section);
  
  // Dynamic height calculation - fit within viewport without overflow
  const headerHeight = 40; // Height of table header
  const rowHeight = 64; // Approximate height per row
  const contentHeight = headerHeight + (data.length * rowHeight);
  const maxViewportHeight = typeof window !== 'undefined' ? window.innerHeight - 250 : 500; // More conservative space reservation
  
  // Dynamic height calculation - prevent overflow
  let tableHeight;
  if (data.length === 0) {
    // Empty state - use moderate height
    tableHeight = 200;
  } else if (data.length <= 10) {
    // Small to medium datasets - use content height with minimal buffer
    tableHeight = Math.min(contentHeight + 24, maxViewportHeight);
  } else {
    // Larger datasets - use viewport height to fill available space without overflow
    tableHeight = maxViewportHeight + 4;
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
  
  console.log('🔍 [PipelineTableRefactored] usePipelineData results:', {
    inputDataLength: data?.length,
    paginatedDataLength: paginatedData?.length,
    currentPage,
    totalPages,
    totalItems,
    pageSize
  });
  
  // Action handling
  const {
    handleEditRecord,
    handleAddAction,
    handleDeleteRecord,
    handleReorderRecords,
    handleColumnSort
  } = usePipelineActions({
    section,
    workspaceId,
    onReorderRecords,
    onColumnSort
  });
  
  // Modal state
  const [editingRecord, setEditingRecord] = useState<PipelineRecord | null>(null);
  const [addingAction, setAddingAction] = useState<PipelineRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PipelineRecord | null>(null);
  
  // Handle record click
  const handleRecordClick = (record: PipelineRecord) => {
    onRecordClick(record);
  };
  
  // Handle edit
  const handleEdit = (record: PipelineRecord) => {
    setEditingRecord(record);
  };
  
  // Handle add action
  const handleAddActionClick = (record: PipelineRecord) => {
    setAddingAction(record);
  };
  
  // Handle view details
  const handleViewDetails = (record: PipelineRecord) => {
    setViewingRecord(record);
  };
  
  // Close modals
  const closeEditModal = () => setEditingRecord(null);
  const closeAddActionModal = () => setAddingAction(null);
  const closeDetailModal = () => setViewingRecord(null);
  
  // Loading state
  if (isLoading) {
    return <TableSkeleton />;
  }
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="text-lg font-medium mb-2">No {section} found</div>
        <div className="text-sm">Try adjusting your filters or add new records</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto" style={{ height: tableHeight }}>
        <table className="w-full">
          <TableHeader
            headers={headers}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleColumnSort}
            section={section}
          />
          
          {/* Table body */}
          <tbody>
            {paginatedData.map((record, index) => {
              console.log(`🔍 [PipelineTableRefactored] Rendering row ${index}:`, {
                recordId: record.id,
                recordName: record.name || record['fullName'],
                recordCompany: record['company'],
                recordRank: record.rank,
                headersLength: headers.length,
                visibleColumnsLength: visibleColumns?.length,
                // Show first 10 keys
                recordKeys: Object.keys(record).slice(0, 10)
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
                        // Use rank from database if available, otherwise calculate global rank
                        const dbRank = record.rank;
                        console.log(`🔍 [PipelineTableRefactored] Row ${index} rank debug:`, {
                          recordName: record.name || record['fullName'],
                          dbRank: dbRank,
                          dbRankType: typeof dbRank,
                          currentPage: currentPage,
                          pageSize: pageSize,
                          index: index
                        });
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
                        cellContent = record.name || record['fullName'] || `${record['firstName'] || ''} ${record['lastName'] || ''}`.trim() || 'Person';
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
                      case 'stage':
                        cellContent = record['stage'] || record['status'] || 'Unknown';
                        break;
                      case 'value':
                        cellContent = record['value'] || record['amount'] || record['revenue'] || 'Unknown';
                        break;
                      default:
                        cellContent = record[header.toLowerCase()] || record[header] || '';
                    }
                    
                    return (
                      <td key={headerIndex} className="px-4 py-3 text-sm text-gray-900">
                        {cellContent}
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
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
      
      {/* Modals */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          section={section}
          onClose={closeEditModal}
          onSave={handleEditRecord}
        />
      )}
      
      {addingAction && (
        <AddActionModal
          record={addingAction}
          section={section}
          onClose={closeAddActionModal}
          onSave={handleAddAction}
        />
      )}
      
      {viewingRecord && (
        <RecordDetailModal
          record={viewingRecord}
          section={section}
          onClose={closeDetailModal}
        />
      )}
    </div>
  );
}
