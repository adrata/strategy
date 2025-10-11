/**
 * Refactored pipeline table component.
 * Clean, modular table that handles all pipeline sections with proper TypeScript safety.
 */

import React, { useState } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
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
  searchQuery?: string;
  totalCount?: number; // Add totalCount prop for correct pagination
}

// -------- Constants --------
const DEFAULT_PAGE_SIZE = 100; // Show more data by default

// -------- Timing Functions --------
function getLastActionTiming(record: PipelineRecord) {
  // 🚀 SPEEDRUN LOGIC: Use the API's lastActionTime field directly
  const lastActionTime = record['lastActionTime'];
  if (lastActionTime) {
    // Color coding for Speedrun timing
    if (lastActionTime === 'Never') {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (lastActionTime === 'Today') {
      return { text: lastActionTime, color: 'bg-green-100 text-green-800' };
    } else if (lastActionTime === 'Yesterday') {
      return { text: lastActionTime, color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    }
  }
  
  // Fallback: Calculate timing from date
  const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
  const timing = getRealtimeActionTiming(lastActionDate);
  return { ...timing, color: 'bg-[var(--hover)] text-gray-800' };
}

function getNextActionTiming(record: PipelineRecord) {
  // 🚀 SPEEDRUN LOGIC: Use the API's nextActionTiming field directly
  const nextActionTiming = record['nextActionTiming'];
  if (nextActionTiming) {
    // Color coding for Speedrun timing
    if (nextActionTiming === 'Now') {
      return { text: nextActionTiming, color: 'bg-red-100 text-red-800' };
    } else if (nextActionTiming === 'Today') {
      return { text: nextActionTiming, color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    }
  }
  
  // Fallback: For next actions, we need to calculate timing based on when the next action should happen
  const nextActionDate = record['nextActionDate'] || record['nextContactDate'];
  if (!nextActionDate) {
    return { text: 'No date set', color: 'bg-[var(--hover)] text-gray-800' };
  }
  
  const now = new Date();
  const actionDate = new Date(nextActionDate);
  const diffMs = actionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: 'Overdue', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays === 0) {
    return { text: 'Today', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays === 1) {
    return { text: 'Tomorrow', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays <= 7) {
    return { text: 'This week', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays <= 14) {
    return { text: 'Next week', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays <= 30) {
    return { text: 'This month', color: 'bg-[var(--hover)] text-gray-800' };
  } else {
    return { text: 'Future', color: 'bg-[var(--hover)] text-gray-800' };
  }
}

// -------- Helper Functions --------
function getTableHeaders(visibleColumns?: string[], section?: string): string[] {
  if (!visibleColumns || visibleColumns.length === 0) {
    // Default headers based on section
    const defaultHeaders: Record<string, string[]> = {
      'leads': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'prospects': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'opportunities': ['Rank', 'Company', 'Stage', 'Value', 'Last Action', 'Next Action'],
      'companies': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'people': ['Rank', 'Name', 'Company', 'Title', 'Last Action', 'Next Action'],
      'clients': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'partners': ['Rank', 'Company', 'Last Action', 'Next Action'],
      'sellers': ['Rank', 'Person', 'Company', 'Title', 'Last Action', 'Next Action'],
      'speedrun': ['Rank', 'Company', 'Person', 'Stage', 'Last Action', 'Next Action']
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
  searchQuery,
  totalCount,
}: PipelineTableProps) {
  console.log('🔍 [PipelineTableRefactored] Component rendered for section:', section, 'visibleColumns:', visibleColumns, 'data length:', data?.length, 'isLoading:', isLoading);
  console.log('🔍 [PipelineTableRefactored] Sample data:', data?.slice(0, 2));
  
  // Get workspace context
  const { user: authUser } = useUnifiedAuth();
  const workspaceId = authUser?.activeWorkspaceId || '';
  const workspaceName = authUser?.workspaces?.find(w => w['id'] === workspaceId)?.['name'] || '';
  
  // Get table headers
  const headers = getTableHeaders(visibleColumns, section);
  
  // Dynamic height calculation - keep table height reasonable
  const headerHeight = 40; // Height of table header
  const rowHeight = 62; // Approximate height per row
  const contentHeight = headerHeight + (data.length * rowHeight);
  // Account for tabs/filters section - increase space reservation for sections with tabs
  const hasTabs = ['leads', 'prospects', 'opportunities'].includes(section);
  const tabsHeight = hasTabs ? 60 : 0; // Extra height for tabs section
  const maxViewportHeight = typeof window !== 'undefined' ? window.innerHeight - 228 - tabsHeight : 500; // Account for tabs
  
  // Dynamic height calculation - keep table height reasonable
  let tableHeight;
  if (data.length === 0) {
    // Empty state - use moderate height
    tableHeight = 200;
  } else if (data.length <= 10) {
    // Small to medium datasets - use content height with minimal extension
    tableHeight = contentHeight + 20; // Minimal extension
  } else {
    // Larger datasets - use viewport height without extension
    tableHeight = maxViewportHeight; // No extension to keep reasonable height
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
  } = usePipelineData({ 
    data, 
    pageSize,
    disableSorting: section === 'companies' || section === 'people' || section === 'leads' || section === 'prospects', // Disable sorting for companies, people, leads, and prospects to preserve API ranking
    searchQuery, // Pass search query to hook
    totalCount // Pass totalCount for correct pagination
  });
  
  console.log('🔍 [PipelineTableRefactored] usePipelineData results:', {
    inputDataLength: data?.length,
    paginatedDataLength: paginatedData?.length,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    section,
    disableSorting: section === 'companies',
    sampleRanks: paginatedData?.slice(0, 5).map(r => ({ name: r.name, rank: r.rank }))
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
  
  // Loading state - only show skeleton for table data, keep header and filters visible
  if (isLoading) {
    return <TableDataSkeleton rowCount={8} visibleColumns={visibleColumns} />;
  }
  
  // Empty state - show table with "No data. Add a lead." in first row
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto pipeline-table-scroll" style={{ height: tableHeight }}>
          <table className="w-full">
            <TableHeader
              visibleColumns={visibleColumns}
              sortField={sortField}
              sortDirection={sortDirection}
              onColumnSort={onColumnSort}
              section={section}
            />
            <tbody>
              <tr className="border-b border-[var(--border)] hover:bg-[var(--panel-background)]">
                <td colSpan={visibleColumns?.length || 6} className="px-6 py-16 text-center">
                  <div className="text-[var(--muted)]">
                    <div className="text-lg font-medium mb-2">No leads yet</div>
                    <div className="text-sm">
                      Get started by adding your first lead to the pipeline.
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto pipeline-table-scroll" style={{ height: tableHeight }}>
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
                    className="cursor-pointer transition-colors hover:bg-[var(--panel-background)] h-table-row border-b border-[var(--border)]"
                    onClick={() => onRecordClick(record)}
                  >
                  {headers.map((header, headerIndex) => {
                    let cellContent = '';
                    
                    // Simple cell content mapping
                    switch (header.toLowerCase()) {
                      case 'rank':
                        // 🏆 HIERARCHICAL RANKING: Display company rank and person rank
                        const companyRank = record['companyRank'] || record['company']?.rank || 0;
                        const personRank = record['personRank'] || record['rank'] || 0;
                        const globalRank = record['globalPersonRank'] || record['rank'] || (currentPage - 1) * pageSize + index + 1;
                        
                        // Display hierarchical ranking based on section
                        let displayRank;
                        if (section === 'people' && companyRank > 0) {
                          // Show "Company Rank: Person Rank" format
                          displayRank = `${companyRank}:${personRank}`;
                        } else if (section === 'speedrun' && companyRank > 0) {
                          // Show "Company Rank: Person Rank" format for speedrun
                          displayRank = `${companyRank}:${personRank}`;
                        } else {
                          // Fallback to global rank
                          displayRank = globalRank;
                        }
                        
                        cellContent = String(displayRank);
                        break;
                      case 'company':
                        // Handle both string and object company data
                        // For companies section, the record itself IS the company, so use record.name
                        if (section === 'companies') {
                          const companyName = record.name || record.companyName || '';
                          cellContent = (companyName && companyName !== 'Unknown Company' && companyName.trim() !== '') ? companyName : '-';
                        } else {
                          // For other sections (leads, prospects, etc.), look for company field
                          const company = record['company'];
                          let companyName = '';
                          
                          if (typeof company === 'object' && company !== null) {
                            companyName = company.name || company.companyName || '';
                          } else {
                            companyName = company || record['companyName'] || '';
                          }
                          
                          // Show dash for "Unknown Company" or empty values
                          cellContent = (companyName && companyName !== 'Unknown Company' && companyName.trim() !== '') ? companyName : '-';
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
                        const title = record['title'] || 
                                     record['jobTitle'] || 
                                     record['position'] || 
                                     record?.customFields?.enrichedData?.overview?.title ||
                                     record?.customFields?.rawData?.active_experience_title;
                        
                        // Show dash for "Unknown Title" or empty values
                        cellContent = (title && title !== 'Unknown Title' && title.trim() !== '') ? title : '-';
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
                      case 'details':
                        // For sellers, show title and department
                        const sellerTitle = record['title'] || record['jobTitle'] || '';
                        const sellerDepartment = record['department'] || '';
                        if (sellerTitle && sellerDepartment) {
                          cellContent = `${sellerTitle} • ${sellerDepartment}`;
                        } else if (sellerTitle) {
                          cellContent = sellerTitle;
                        } else if (sellerDepartment) {
                          cellContent = sellerDepartment;
                        } else {
                          cellContent = 'Sales Team';
                        }
                        break;
                      case 'status':
                        // For sellers, show online/offline status with indicator
                        const metadata = record['metadata'] || {};
                        const isOnline = record['isOnline'] || record['status'] === 'online' || metadata['isOnline'] || metadata['status'] === 'online' || record['lastSeen'] || metadata['lastSeen'];
                        const lastSeen = record['lastSeen'] || record['lastActivity'] || metadata['lastSeen'] || metadata['lastActivity'];
                        
                        if (isOnline) {
                          cellContent = 'Online';
                        } else if (lastSeen) {
                          const lastSeenDate = new Date(lastSeen);
                          const now = new Date();
                          const diffHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60));
                          
                          if (diffHours < 1) {
                            cellContent = 'Online';
                          } else if (diffHours < 24) {
                            cellContent = `Offline (${diffHours}h ago)`;
                          } else {
                            const diffDays = Math.floor(diffHours / 24);
                            cellContent = `Offline (${diffDays}d ago)`;
                          }
                        } else {
                          cellContent = 'Offline';
                        }
                        break;
                      default:
                        cellContent = record[header.toLowerCase()] || record[header] || '';
                    }
                    
                    return (
                      <td key={headerIndex} className="px-6 py-3 text-sm text-[var(--foreground)]">
                        {header.toLowerCase() === 'last action' || header.toLowerCase() === 'next action' ? (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const timing = header.toLowerCase() === 'last action' 
                                ? getLastActionTiming(record)
                                : getNextActionTiming(record);
                              return (
                                <>
                                  <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${timing.color}`}>
                                    {timing.text}
                                  </span>
                                  <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                                    {cellContent}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        ) : header.toLowerCase() === 'status' ? (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const metadata = record['metadata'] || {};
                              const isOnline = record['isOnline'] || record['status'] === 'online' || metadata['isOnline'] || metadata['status'] === 'online' || record['lastSeen'] || metadata['lastSeen'];
                              const lastSeen = record['lastSeen'] || record['lastActivity'] || metadata['lastSeen'] || metadata['lastActivity'];
                              
                              let statusColor = 'bg-[var(--hover)] text-gray-800';
                              let statusIcon = '●';
                              
                              if (isOnline) {
                                statusColor = 'bg-green-100 text-green-800';
                                statusIcon = '●';
                              } else if (lastSeen) {
                                const lastSeenDate = new Date(lastSeen);
                                const now = new Date();
                                const diffHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60));
                                
                                if (diffHours < 1) {
                                  statusColor = 'bg-green-100 text-green-800';
                                  statusIcon = '●';
                                } else if (diffHours < 24) {
                                  statusColor = 'bg-yellow-100 text-yellow-800';
                                  statusIcon = '●';
                                } else {
                                  statusColor = 'bg-[var(--hover)] text-gray-800';
                                  statusIcon = '●';
                                }
                              } else {
                                statusColor = 'bg-[var(--hover)] text-gray-800';
                                statusIcon = '●';
                              }
                              
                              return (
                                <>
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                    <span className="text-xs">{statusIcon}</span>
                                    {cellContent}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm text-[var(--foreground)] truncate">
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
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
      
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
          contextRecord={addingAction}
          section={section}
          onClose={closeAddActionModal}
          onSubmit={handleAddAction}
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
